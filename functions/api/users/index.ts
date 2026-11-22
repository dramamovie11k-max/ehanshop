// GET    /api/users — সব ইউজার (auth_users + profiles + role) — শুধু অ্যাডমিন
// POST   /api/users — { user_id | email, role } রোল সেট করা — শুধু অ্যাডমিন
// DELETE /api/users?user_id=..&role=.. — রোল সরানো — শুধু অ্যাডমিন

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireAdmin } from "../../_shared/auth";
import { newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

const ROLES = ["admin", "moderator", "user"];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);
  const admin = await requireAdmin(request, env);
  if ("response" in admin) return admin.response;

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT au.id                AS user_id,
              au.email             AS email,
              COALESCE(p.full_name, au.full_name) AS full_name,
              COALESCE(p.phone, au.phone)         AS phone,
              au.created_at        AS created_at,
              au.is_banned         AS is_banned,
              (SELECT role FROM user_roles ur WHERE ur.user_id = au.id
                 ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END
                 LIMIT 1) AS role
         FROM auth_users au
         LEFT JOIN profiles p ON p.user_id = au.id
        ORDER BY au.created_at DESC`,
    ).all();
    const data = (results as Record<string, unknown>[]).map((r) => ({
      ...r,
      id: r.user_id,
      role: (r.role as string) || "user",
    }));
    return json({ data });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { user_id?: string; email?: string; role?: string };
    const role = body.role;
    if (!role || !ROLES.includes(role)) return errorJson("সঠিক role দিন", 400);

    let userId = body.user_id;
    if (!userId && body.email) {
      const row = await env.DB.prepare("SELECT id FROM auth_users WHERE email = ?")
        .bind(body.email.trim().toLowerCase()).first<{ id: string }>();
      if (!row) return errorJson("এই ইমেইলে কোনো ইউজার নেই", 404);
      userId = row.id;
    }
    if (!userId) return errorJson("user_id বা email দিন", 400);

    await env.DB.batch([
      env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(userId),
      env.DB.prepare("INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, ?)")
        .bind(newId(), userId, role),
    ]);
    return json({ data: { user_id: userId, role } }, 201);
  }

  if (request.method === "DELETE") {
    const userId = url.searchParams.get("user_id");
    if (!userId) return errorJson("user_id আবশ্যক", 400);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(userId),
      env.DB.prepare("INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'user')")
        .bind(newId(), userId),
    ]);
    return json({ data: { success: true } });
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
