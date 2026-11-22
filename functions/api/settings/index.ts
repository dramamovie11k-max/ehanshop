// GET /api/settings — সাইট সেটিংস
//   • পাবলিক ভিজিটর: গোপন কী (API key/token/password) বাদ দিয়ে
//   • স্টাফ (admin/moderator): সব সেটিংস
// PUT /api/settings — সেটিংস আপডেট (শুধু অ্যাডমিন)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireAdmin, getUser } from "../../_shared/auth";
import { decodeRows, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

// এই কী-গুলো পাবলিক রেসপন্সে যাবে না (API টোকেন/পাসওয়ার্ড)
const SECRET_KEY_PATTERN = /(api_key|secret|token|password|access_token)/i;

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method === "GET") {
    const user = await getUser(request, env);
    const isStaff = user?.role === "admin" || user?.role === "moderator";
    const { results } = await env.DB.prepare("SELECT * FROM site_settings").all();
    const rows = decodeRows<{ setting_key: string }>(results)
      .filter((r) => isStaff || !SECRET_KEY_PATTERN.test(r.setting_key));
    return json({ data: rows });
  }


  if (request.method === "PUT" || request.method === "POST") {
    const auth = await requireAdmin(request, env);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as { settings?: Record<string, string> };
    const settings = body.settings || {};
    const keys = Object.keys(settings);
    if (!keys.length) return errorJson("কোনো সেটিংস পাঠানো হয়নি", 400);

    // UPSERT — setting_key ইউনিক
    const stmts = keys.map((k) =>
      env.DB.prepare(
        `INSERT INTO site_settings (id, setting_key, setting_value)
         VALUES (?, ?, ?)
         ON CONFLICT(setting_key) DO UPDATE
           SET setting_value = excluded.setting_value, updated_at = datetime('now')`,
      ).bind(newId(), k, settings[k] ?? null),
    );
    await env.DB.batch(stmts);

    return json({ success: true, updated: keys.length });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
