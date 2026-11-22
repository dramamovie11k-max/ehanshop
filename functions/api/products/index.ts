// GET  /api/products  — প্রোডাক্ট লিস্ট (পাবলিক)
// POST /api/products  — নতুন প্রোডাক্ট (শুধু স্টাফ)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { decodeRows, decodeRow, buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

// ক্লায়েন্ট যে কলামগুলো লিখতে পারবে
const WRITABLE = [
  "id", "name", "name_bn", "description", "description_bn", "short_description",
  "short_description_bn", "price", "original_price", "cost_price", "image_url",
  "images", "review_images", "video_url", "category_id", "stock",
  "low_stock_threshold", "is_featured", "is_new", "slug", "shipping_inside_dhaka",
  "shipping_outside_dhaka", "free_shipping", "has_variations", "variation_type",
];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const limit = Math.min(Number(url.searchParams.get("limit") || 60), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
    const category = url.searchParams.get("category");   // category slug
    const featured = url.searchParams.get("featured");
    const search = url.searchParams.get("search");

    const where: string[] = ["1=1"];
    const binds: (string | number)[] = [];

    if (category) {
      where.push("p.category_id = (SELECT id FROM categories WHERE slug = ?)");
      binds.push(category);
    }
    if (featured === "true") where.push("p.is_featured = 1");
    if (search) {
      where.push("(p.name LIKE ? OR p.name_bn LIKE ?)");
      binds.push(`%${search}%`, `%${search}%`);
    }

    const { results } = await env.DB.prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where.join(" AND ")}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...binds, limit, offset).all();

    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    // অনুমতি চেক
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name || !body.slug || body.price === undefined) {
      return errorJson("name, slug এবং price আবশ্যক", 400);
    }
    body.id = body.id || newId();
    body.name_bn = body.name_bn || body.name;

    const { sql, values } = buildInsert("products", body, WRITABLE);
    const row = await env.DB.prepare(sql).bind(...values).first();
    return json({ data: decodeRow(row) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
