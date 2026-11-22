// GET  /api/inventory/stock — স্টক হিস্ট্রি
// POST /api/inventory/stock — ম্যানুয়াল স্টক অ্যাডজাস্টমেন্ট (হিস্ট্রিসহ)
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { decodeRows, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);

  if (request.method === "GET") {
    const productId = url.searchParams.get("product_id");
    const sql = productId
      ? "SELECT * FROM stock_history WHERE product_id = ? ORDER BY created_at DESC LIMIT 200"
      : "SELECT * FROM stock_history ORDER BY created_at DESC LIMIT 200";
    const stmt = productId
      ? env.DB.prepare(sql).bind(productId)
      : env.DB.prepare(sql);
    const { results } = await stmt.all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as Record<string, any>;
    if (!body.product_id || body.quantity_change === undefined) {
      return errorJson("product_id ও quantity_change আবশ্যক", 400);
    }
    const product = await env.DB.prepare(
      "SELECT stock FROM products WHERE id = ?",
    ).bind(body.product_id).first<{ stock: number }>();
    if (!product) return errorJson("প্রোডাক্ট পাওয়া যায়নি", 404);

    const prev = Number(product.stock || 0);
    const next = Math.max(prev + Number(body.quantity_change), 0);

    await env.DB.batch([
      env.DB.prepare("UPDATE products SET stock = ? WHERE id = ?").bind(next, body.product_id),
      env.DB.prepare(
        `INSERT INTO stock_history
         (id, product_id, change_type, quantity_change, previous_stock, new_stock,
          unit_cost, reference_id, reference_type, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(), body.product_id, body.change_type || "manual",
        Number(body.quantity_change), prev, next,
        body.unit_cost ?? null, body.reference_id ?? null,
        body.reference_type ?? null, body.notes ?? null, auth.user.id,
      ),
    ]);

    return json({ data: { product_id: body.product_id, stock: next } }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
