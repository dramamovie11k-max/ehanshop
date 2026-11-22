// GET/PUT/PATCH/DELETE /api/sales-pages/:slug — slug অথবা id, দুইভাবেই কাজ করে

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff, getUser } from "../../_shared/auth";
import { buildUpdate } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";
import {
  SALES_PAGE_COLUMNS, splitSalesPageBody, expandSalesPage, attachProduct,
} from "./_shared";

export const onRequest = withApi(async ({ request, env, params }: PagesCtx) => {
  const key = String((params as Record<string, string>).slug ?? "");
  if (!key) return errorJson("slug প্রয়োজন", 400);

  const row = await env.DB.prepare(
    "SELECT * FROM sales_pages WHERE slug = ? OR id = ? LIMIT 1",
  ).bind(key, key).first<Record<string, unknown>>();
  if (!row) return errorJson("সেলস পেজ পাওয়া যায়নি", 404);

  if (request.method === "GET") {
    const user = await getUser(request, env);
    const isStaff = user?.role === "admin" || user?.role === "moderator";
    if (!isStaff && Number(row.is_active) !== 1) {
      return errorJson("সেলস পেজ পাওয়া যায়নি", 404);
    }
    return json({ data: await attachProduct(env, expandSalesPage(row)) });
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;

    const existingConfig = (() => {
      try { return JSON.parse(String(row.config || "{}")); } catch { return {}; }
    })();

    const body = (await request.json()) as Record<string, unknown>;
    delete body.id;
    const patch = splitSalesPageBody(body, existingConfig);
    patch.updated_at = new Date().toISOString();

    const built = buildUpdate(
      "sales_pages", patch, [...SALES_PAGE_COLUMNS.filter((c) => c !== "id"), "updated_at"], "id",
    );
    if (!built) return errorJson("আপডেট করার মতো কিছু নেই", 400);
    const updated = await env.DB.prepare(built.sql).bind(...built.values, row.id).first();
    return json({ data: expandSalesPage(updated) });
  }

  if (request.method === "DELETE") {
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;
    await env.DB.prepare("DELETE FROM sales_pages WHERE id = ?").bind(row.id).run();
    return json({ data: { success: true } });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
