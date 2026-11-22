// GET    /api/products/:slug  — একটি প্রোডাক্ট (ভ্যারিয়েশন + অনুমোদিত রিভিউসহ)
// PATCH  /api/products/:slug  — আপডেট (স্টাফ)
// DELETE /api/products/:slug  — ডিলিট (অ্যাডমিন)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff, requireAdmin } from "../../_shared/auth";
import { decodeRow, decodeRows, buildUpdate } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

const WRITABLE = [
  "name", "name_bn", "description", "description_bn", "short_description",
  "short_description_bn", "price", "original_price", "cost_price", "image_url",
  "images", "review_images", "video_url", "category_id", "stock",
  "low_stock_threshold", "is_featured", "is_new", "slug", "shipping_inside_dhaka",
  "shipping_outside_dhaka", "free_shipping", "has_variations", "variation_type",
];

export const onRequest = withApi(async ({ request, env, params }: PagesCtx<"slug">) => {
  const slug = String(params.slug);

  // slug অথবা id — দুইভাবেই খোঁজা যায়
  const product = await env.DB.prepare(
    "SELECT * FROM products WHERE slug = ? OR id = ? LIMIT 1",
  ).bind(slug, slug).first();

  if (!product) return errorJson("প্রোডাক্ট পাওয়া যায়নি", 404);

  if (request.method === "GET") {
    const [variations, reviews] = await Promise.all([
      env.DB.prepare(
        "SELECT * FROM product_variations WHERE product_id = ? ORDER BY sort_order",
      ).bind(product.id).all(),
      // customer_phone পাবলিক রেসপন্সে দেওয়া হয় না (প্রাইভেসি)
      env.DB.prepare(
        `SELECT id, product_id, customer_name, rating, review_text, created_at
         FROM product_reviews WHERE product_id = ? AND is_approved = 1
         ORDER BY created_at DESC`,
      ).bind(product.id).all(),
    ]);

    return json({
      data: {
        ...decodeRow(product),
        variations: decodeRows(variations.results),
        reviews: decodeRows(reviews.results),
      },
    });
  }

  if (request.method === "PATCH" || request.method === "PUT") {
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Record<string, unknown>;
    const upd = buildUpdate("products", body, WRITABLE);
    if (!upd) return errorJson("আপডেট করার মতো কোনো ফিল্ড নেই", 400);

    const row = await env.DB.prepare(upd.sql).bind(...upd.values, product.id).first();
    return json({ data: decodeRow(row) });
  }

  if (request.method === "DELETE") {
    const auth = await requireAdmin(request, env);
    if ("response" in auth) return auth.response;

    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(product.id).run();
    return json({ data: { success: true } });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
