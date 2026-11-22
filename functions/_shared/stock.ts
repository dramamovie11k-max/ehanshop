// ============================================================
// অর্ডারভিত্তিক স্টক সমন্বয় (idempotent)
//
// নীতি: একটি অর্ডারের জন্য stock_history-তে জমা হওয়া নেট পরিবর্তন
// (reference_type='order', reference_id=orderId) সবসময় হওয়া উচিত —
//   - সক্রিয় অর্ডার (pending/confirmed/shipped/delivered…): -মোট পরিমাণ
//   - বাতিল/রিটার্ন অর্ডার, বা মুছে ফেলার আগে:                 0
//
// যতবারই ডাকা হোক, পার্থক্য (delta) হিসাব করে শুধু প্রয়োজনীয় সংশোধন করা হয়।
// তাই ডাবল কাটা বা ডাবল ফেরত কখনো হবে না।
// ============================================================

import { newId } from "./db";
import type { Env } from "./types";

/** যেসব স্ট্যাটাসে স্টক কাটা থাকবে না (স্টক ফেরত যাবে) */
export const STOCK_RELEASED_STATUSES = new Set(["cancelled", "returned", "refunded", "failed"]);

export function isStockActiveStatus(status: string | null | undefined): boolean {
  return !STOCK_RELEASED_STATUSES.has(String(status || "").toLowerCase());
}

/**
 * অর্ডারের স্টক অবস্থা কাঙ্ক্ষিত অবস্থায় নিয়ে আসে।
 * @param active true হলে স্টক কাটা থাকবে, false হলে ফেরত যাবে
 */
export async function syncOrderStock(
  env: Env,
  orderId: string,
  active: boolean,
  note: string,
): Promise<void> {
  const { results: items } = await env.DB.prepare(
    `SELECT product_id, variation_id, SUM(quantity) AS qty
       FROM order_items
      WHERE order_id = ? AND product_id IS NOT NULL
      GROUP BY product_id, variation_id`,
  ).bind(orderId).all<{ product_id: string; variation_id: string | null; qty: number }>();

  if (!items?.length) return;

  const { results: hist } = await env.DB.prepare(
    `SELECT product_id, SUM(quantity_change) AS net
       FROM stock_history
      WHERE reference_type = 'order' AND reference_id = ?
      GROUP BY product_id`,
  ).bind(orderId).all<{ product_id: string; net: number }>();

  const netByProduct = new Map<string, number>();
  for (const h of hist || []) netByProduct.set(h.product_id, Number(h.net || 0));

  // প্রোডাক্ট পর্যায়ে মোট পরিমাণ (একই প্রোডাক্টের একাধিক ভ্যারিয়েশন থাকতে পারে)
  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(
      item.product_id,
      (qtyByProduct.get(item.product_id) ?? 0) + Number(item.qty || 0),
    );
  }

  const statements: D1PreparedStatement[] = [];

  for (const [productId, totalQty] of qtyByProduct) {
    if (!totalQty) continue;
    const desired = active ? -totalQty : 0;
    const current = netByProduct.get(productId) ?? 0;
    const delta = desired - current;
    if (!delta) continue;

    const product = await env.DB.prepare("SELECT stock FROM products WHERE id = ?")
      .bind(productId).first<{ stock: number }>();
    if (!product) continue;

    const prev = Number(product.stock || 0);
    const next = Math.max(0, prev + delta);

    statements.push(
      env.DB.prepare("UPDATE products SET stock = ? WHERE id = ?").bind(next, productId),
      env.DB.prepare(
        `INSERT INTO stock_history
           (id, product_id, change_type, quantity_change, previous_stock, new_stock,
            reference_id, reference_type, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'order', ?)`,
      ).bind(
        newId(), productId, delta < 0 ? "sale" : "return",
        delta, prev, next, orderId, note,
      ),
    );
  }

  // ভ্যারিয়েশন-পর্যায়ের স্টকও একই অনুপাতে সমন্বয় করা হয়।
  // প্রোডাক্ট স্টকের delta যেদিকে গেছে, ভ্যারিয়েশনও সেদিকেই যাবে।
  const productDeltaSign = active ? -1 : 1;
  const alreadySynced = (productId: string) =>
    (netByProduct.get(productId) ?? 0) === (active ? -(qtyByProduct.get(productId) ?? 0) : 0);

  for (const item of items) {
    if (!item.variation_id) continue;
    const qty = Number(item.qty || 0);
    if (!qty) continue;
    // প্রোডাক্ট স্টক আগেই কাঙ্ক্ষিত অবস্থায় থাকলে ভ্যারিয়েশনও বদলানো হবে না
    if (alreadySynced(item.product_id)) continue;

    const variation = await env.DB.prepare(
      "SELECT stock FROM product_variations WHERE id = ?",
    ).bind(item.variation_id).first<{ stock: number }>();
    if (!variation) continue;

    const next = Math.max(0, Number(variation.stock || 0) + productDeltaSign * qty);
    statements.push(
      env.DB.prepare("UPDATE product_variations SET stock = ? WHERE id = ?")
        .bind(next, item.variation_id),
    );
  }

  if (statements.length) await env.DB.batch(statements);
}

