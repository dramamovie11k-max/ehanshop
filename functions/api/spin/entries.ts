// GET  /api/spin/entries — স্পিন এন্ট্রি লিস্ট (শুধু স্টাফ)
//   ?coupon=CODE → কুপন যাচাই (পাবলিক)
// POST /api/spin/entries — নতুন স্পিন এন্ট্রি + কুপন কোড তৈরি (পাবলিক)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { decodeRow, decodeRows, buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

export const SPIN_ENTRY_WRITABLE = [
  "id", "customer_name", "customer_phone", "offer_id", "offer_text",
  "coupon_code", "discount_type", "discount_value", "is_used",
  "used_order_id", "status",
];

/** সহজে পড়া যায় এমন কুপন কোড */
function makeCoupon(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "SPIN";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const coupon = url.searchParams.get("coupon");
    // কুপন যাচাই — পাবলিক, শুধু প্রয়োজনীয় ফিল্ড
    if (coupon) {
      const row = await env.DB.prepare(
        `SELECT coupon_code, discount_type, discount_value, is_used, offer_text
         FROM spin_entries WHERE coupon_code = ?`,
      ).bind(coupon.trim().toUpperCase()).first();
      if (!row) return errorJson("কুপন কোডটি সঠিক নয়", 404);
      const data: any = decodeRow(row);
      if (data.is_used) return errorJson("এই কুপন আগেই ব্যবহার হয়েছে", 400);
      return json({ data });
    }

    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;
    const { results } = await env.DB.prepare(
      "SELECT * FROM spin_entries ORDER BY created_at DESC LIMIT 500",
    ).all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as Record<string, any>;
    if (!body.customer_name || !body.customer_phone) {
      return errorJson("নাম ও ফোন নম্বর আবশ্যক", 400);
    }
    // একই ফোনে একবারই স্পিন
    const existing = await env.DB.prepare(
      "SELECT id FROM spin_entries WHERE customer_phone = ?",
    ).bind(body.customer_phone).first();
    if (existing) return errorJson("এই নম্বর দিয়ে আগেই স্পিন করা হয়েছে", 400);

    body.id = newId();
    body.coupon_code = makeCoupon();
    const { sql, values } = buildInsert("spin_entries", body, SPIN_ENTRY_WRITABLE);
    const row = await env.DB.prepare(sql).bind(...values).first();
    return json({ data: decodeRow(row) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
