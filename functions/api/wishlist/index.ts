// GET/POST/DELETE /api/wishlist — লগইন করা ইউজারের উইশলিস্ট
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
      `SELECT w.*, p.name, p.name_bn, p.price, p.image_url, p.slug
       FROM wishlist w JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    ).bind(userId).all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const { product_id } = (await request.json()) as { product_id?: string };
    if (!product_id) return errorJson("product_id আবশ্যক", 400);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)",
    ).bind(newId(), userId, product_id).run();
    return json({ data: { success: true } }, 201);
  }

  if (request.method === "DELETE") {
    const productId = url.searchParams.get("product_id");
    if (!productId) return errorJson("product_id আবশ্যক", 400);
    await env.DB.prepare(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
    ).bind(userId, productId).run();
    return json({ data: { success: true } });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
