// GET  /api/user-roles — সব রোল (শুধু অ্যাডমিন)
//   ?me=1 → নিজের রোল (লগইন করা যেকোনো ইউজার)
// POST /api/user-roles — রোল দেওয়া (শুধু অ্যাডমিন)
// DELETE /api/user-roles?user_id=..&role=.. — রোল সরানো (শুধু অ্যাডমিন)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireAdmin, requireUser } from "../../_shared/auth";
import { decodeRows, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

const ROLES = ["admin", "moderator", "user"];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);

  if (request.method === "GET" && url.searchParams.get("me")) {
    const auth = await requireUser(request, env);
    if ("response" in auth) return auth.response;
    return json({ data: { user_id: auth.user.id, role: auth.user.role } });
  }

  const admin = await requireAdmin(request, env);
  if ("response" in admin) return admin.response;

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM user_roles ORDER BY created_at DESC",
    ).all();
    return json({ data: decodeRows(results) });
  }

  if (request.method === "POST") {
    const { user_id, role } = (await request.json()) as { user_id?: string; role?: string };
    if (!user_id || !role || !ROLES.includes(role)) {
      return errorJson("সঠিক user_id ও role আবশ্যক", 400);
    }
    await env.DB.prepare(
      "INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, ?)",
    ).bind(newId(), user_id, role).run();
    return json({ data: { user_id, role } }, 201);
  }

  if (request.method === "DELETE") {
    const userId = url.searchParams.get("user_id");
    const role = url.searchParams.get("role");
    if (!userId || !role) return errorJson("user_id ও role আবশ্যক", 400);
    await env.DB.prepare(
      "DELETE FROM user_roles WHERE user_id = ? AND role = ?",
    ).bind(userId, role).run();
    return json({ data: { success: true } });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
