// GET  /api/sales-pages — সেলস পেজের তালিকা
// POST /api/sales-pages — নতুন সেলস পেজ (শুধু স্টাফ)
//
// টেবিলে না থাকা সব ফিল্ড স্বয়ংক্রিয়ভাবে `config` JSON কলামে সেভ হয়।

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff, getUser } from "../../_shared/auth";
import { buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";
import { SALES_PAGE_COLUMNS, splitSalesPageBody, expandSalesPage, attachProduct } from "./_shared";

export const SALES_PAGE_WRITABLE = SALES_PAGE_COLUMNS;

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method === "GET") {
    const user = await getUser(request, env);
    const isStaff = user?.role === "admin" || user?.role === "moderator";
    const { results } = await env.DB.prepare(
      `SELECT * FROM sales_pages ${isStaff ? "" : "WHERE is_active = 1"}
       ORDER BY created_at DESC LIMIT 200`,
    ).all();
    const pages = (results || []).map(expandSalesPage);
    const withProducts = await Promise.all(pages.map((p) => attachProduct(env, p)));
    return json({ data: withProducts });
  }

  if (request.method === "POST") {
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.slug || !body.title) return errorJson("slug এবং title আবশ্যক", 400);

    const dup = await env.DB.prepare("SELECT id FROM sales_pages WHERE slug = ?")
      .bind(String(body.slug)).first();
    if (dup) return errorJson("এই slug আগে থেকেই ব্যবহার হচ্ছে", 409);

    const row = splitSalesPageBody(body);
    row.id = row.id || newId();
    row.hero_headline = row.hero_headline || body.title;
    row.offer_price = Number(row.offer_price ?? 0);

    const { sql, values } = buildInsert("sales_pages", row, SALES_PAGE_COLUMNS);
    const created = await env.DB.prepare(sql).bind(...values).first();
    return json({ data: expandSalesPage(created) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
