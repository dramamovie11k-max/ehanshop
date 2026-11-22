// সেলস পেজের কলাম ম্যাপিং — টেবিলে যে কলামগুলো আছে সেগুলো সরাসরি,
// বাকি সব সেকশন সেটিং `config` JSON কলামে রাখা হয়।

import { decodeRow } from "../../_shared/db";
import type { Env } from "../../_shared/types";

export const SALES_PAGE_COLUMNS = [
  "id", "slug", "title", "is_active", "product_id", "template_id",
  "hero_headline", "hero_subheadline", "hero_badge_text", "hero_images",
  "hero_video_url", "offer_price", "original_price", "discount_text",
  "price_unit", "offer_details", "payment_method", "multi_products",
  "show_multi_products", "allow_multi_select", "config",
];

/** কোন কী-গুলো কখনোই ক্লায়েন্ট থেকে সরাসরি লেখা যাবে না */
const NEVER_WRITE = new Set(["created_at", "updated_at", "products"]);

/**
 * ক্লায়েন্টের পাঠানো অবজেক্টকে দুই ভাগে ভাগ করে:
 * টেবিলের আসল কলাম, আর বাকি সব `config` JSON-এ।
 */
export function splitSalesPageBody(
  body: Record<string, unknown>,
  existingConfig: Record<string, unknown> = {},
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const config: Record<string, unknown> = { ...existingConfig };

  for (const [k, v] of Object.entries(body)) {
    if (NEVER_WRITE.has(k) || v === undefined) continue;
    if (k === "config" && v && typeof v === "object") {
      Object.assign(config, v as Record<string, unknown>);
      continue;
    }
    if (SALES_PAGE_COLUMNS.includes(k)) row[k] = v;
    else config[k] = v;
  }

  row.config = config;
  return row;
}

/** D1 রো → ক্লায়েন্ট অবজেক্ট (config-এর ফিল্ডগুলো টপ-লেভেলে মিশিয়ে দেওয়া হয়) */
export function expandSalesPage(row: any): any {
  if (!row) return row;
  const decoded: any = decodeRow(row);
  const config = decoded.config && typeof decoded.config === "object" ? decoded.config : {};
  delete decoded.config;
  return { ...config, ...decoded };
}

/** সেলস পেজের সাথে যুক্ত প্রোডাক্টের তথ্য (টেমপ্লেটগুলো `page.products` ব্যবহার করে) */
export async function attachProduct(env: Env, page: any): Promise<any> {
  if (!page?.product_id) return page;
  const product = await env.DB.prepare(
    `SELECT id, name, name_bn, price, original_price, image_url,
            shipping_inside_dhaka, shipping_outside_dhaka, free_shipping,
            has_variations, variation_type
       FROM products WHERE id = ?`,
  ).bind(page.product_id).first();
  if (product) page.products = decodeRow(product);
  return page;
}
