// GET/POST/PUT/DELETE /api/cart — লগইন করা ইউজারের কার্ট
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireUser } from "../../_shared/auth";
import { decodeRows, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const auth = await requireUser(request, env);
  if ("response" in auth) return auth.response;
  const userId = auth.user.id;
  const url = new URL(request.url);

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT c.*, p.name, p.name_bn, p.price, p.image_url, p.slug, p.stock,
              v.price AS variation_price
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       LEFT JOIN product_variations v ON v.id = c.variation_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC`,
    ).bind(userId).all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const { product_id, quantity, variation_id, variation_name } =
      (await request.json()) as {
        product_id?: string; quantity?: number;
        variation_id?: string | null; variation_name?: string | null;
      };
    if (!product_id) return errorJson("product_id আবশ্যক", 400);
    const qty = Math.max(Number(quantity || 1), 1);
    const varId = variation_id || null;

    const existing = await env.DB.prepare(
      `SELECT id, quantity FROM cart_items
        WHERE user_id = ? AND product_id = ? AND COALESCE(variation_id, '') = COALESCE(?, '')`,
    ).bind(userId, product_id, varId).first<{ id: string; quantity: number }>();

    if (existing) {
      await env.DB.prepare(
        "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?",
      ).bind(existing.quantity + qty, existing.id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO cart_items (id, user_id, product_id, quantity, variation_id, variation_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(newId(), userId, product_id, qty, varId, variation_name || null).run();
    }
    return json({ data: { success: true } }, 201);
  }

  if (request.method === "PUT") {
    const { product_id, quantity, variation_id } = (await request.json()) as
      { product_id?: string; quantity?: number; variation_id?: string | null };
    if (!product_id || quantity === undefined) {
      return errorJson("product_id ও quantity আবশ্যক", 400);
    }
    const varId = variation_id || null;
    if (Number(quantity) <= 0) {
      await env.DB.prepare(
        `DELETE FROM cart_items WHERE user_id = ? AND product_id = ?
           AND COALESCE(variation_id, '') = COALESCE(?, '')`,
      ).bind(userId, product_id, varId).run();
    } else {
      await env.DB.prepare(
        `UPDATE cart_items SET quantity = ?, updated_at = datetime('now')
         WHERE user_id = ? AND product_id = ?
           AND COALESCE(variation_id, '') = COALESCE(?, '')`,
      ).bind(Number(quantity), userId, product_id, varId).run();
    }
    return json({ data: { success: true } });
  }

  if (request.method === "DELETE") {
    const productId = url.searchParams.get("product_id");
    const variationId = url.searchParams.get("variation_id");
    if (productId) {
      await env.DB.prepare(
        `DELETE FROM cart_items WHERE user_id = ? AND product_id = ?
           AND (? IS NULL OR COALESCE(variation_id, '') = ?)`,
      ).bind(userId, productId, variationId, variationId || "").run();
    } else {
      await env.DB.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId).run();
    }
    return json({ data: { success: true } });
  }


  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
