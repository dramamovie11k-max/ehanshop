// GET  /api/categories — সব ক্যাটাগরি (পাবলিক)
// POST /api/categories — নতুন ক্যাটাগরি (স্টাফ)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { decodeRows, decodeRow, buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

const WRITABLE = ["id", "name", "name_bn", "icon", "image_url", "slug", "parent_id", "sort_order"];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM categories ORDER BY sort_order ASC, name ASC",
    ).all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name || !body.slug) return errorJson("name এবং slug আবশ্যক", 400);
    body.id = body.id || newId();
    body.name_bn = body.name_bn || body.name;

    const { sql, values } = buildInsert("categories", body, WRITABLE);
    const row = await env.DB.prepare(sql).bind(...values).first();
    return json({ data: decodeRow(row) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
