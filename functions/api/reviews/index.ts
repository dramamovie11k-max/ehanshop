// GET  /api/reviews?product_id=... — অনুমোদিত রিভিউ (পাবলিক), স্টাফ হলে সব
// POST /api/reviews — কাস্টমার রিভিউ দিতে পারে (অনুমোদনের অপেক্ষায় থাকে)

import { withApi, json, errorJson } from "../../_shared/cors";
import { getUser } from "../../_shared/auth";
import { decodeRows, decodeRow, buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

export const REVIEW_WRITABLE = [
  "id", "product_id", "user_id", "customer_name", "customer_phone",
  "rating", "review_text", "is_approved",
];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);
  const user = await getUser(request, env);
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  if (request.method === "GET") {
    const productId = url.searchParams.get("product_id");
    const where: string[] = ["1=1"];
    const binds: string[] = [];
    if (productId) { where.push("product_id = ?"); binds.push(productId); }
    if (!isStaff) {
      // নিজের দেওয়া রিভিউ (অনুমোদনের অপেক্ষায় থাকলেও) নিজে দেখতে পাবে
      if (user) { where.push("(is_approved = 1 OR user_id = ?)"); binds.push(user.id); }
      else where.push("is_approved = 1");
    }

    const { results } = await env.DB.prepare(
      `SELECT * FROM product_reviews WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC LIMIT 200`,
    ).bind(...binds).all();

    let rows: any[] = decodeRows(results);
    // ফোন নম্বর শুধু স্টাফ দেখবে
    if (!isStaff) rows = rows.map(({ customer_phone, ...r }: any) => r);
    return json({ data: rows });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.product_id || !body.customer_name || !body.rating) {
      return errorJson("product_id, customer_name এবং rating আবশ্যক", 400);
    }
    const rating = Number(body.rating);
    if (!(rating >= 1 && rating <= 5)) return errorJson("রেটিং ১-৫ এর মধ্যে হতে হবে", 400);

    body.id = newId();
    body.user_id = user?.id ?? null;
    // শুধু স্টাফ সরাসরি অনুমোদিত রিভিউ যোগ করতে পারে
    body.is_approved = isStaff ? (body.is_approved ?? true) : false;

    const { sql, values } = buildInsert("product_reviews", body, REVIEW_WRITABLE);
    const row = await env.DB.prepare(sql).bind(...values).first();
    return json({ data: decodeRow(row) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
