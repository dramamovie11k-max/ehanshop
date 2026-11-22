// ============================================================
// নিজস্ব অথেনটিকেশন API (Cloudflare D1 + HS256 JWT)
//
//  POST /api/auth/signup            { email, password, full_name }
//  POST /api/auth/login             { email, password }
//  POST /api/auth/refresh           { refresh_token }
//  POST /api/auth/logout            { refresh_token? }
//  GET  /api/auth/me
//  PUT  /api/auth/user              { email?, password?, full_name?, phone? }
//  POST /api/auth/forgot-password   { email }
//  POST /api/auth/reset-password    { token, password }
// ============================================================

import { withApi, json, errorJson } from "../../_shared/cors";
import { signJwt, hashToken, randomToken } from "../../_shared/jwt";
import { hashPassword, verifyPassword, isLegacyHash } from "../../_shared/password";
import { getUser, jwtSecret } from "../../_shared/auth";
import { newId } from "../../_shared/db";
import type { PagesCtx, Env } from "../../_shared/types";

const ACCESS_TTL = 60 * 60;            // ১ ঘণ্টা
const REFRESH_TTL_DAYS = 30;

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  is_banned: number;
  created_at: string;
}

function publicUser(u: DbUser, role: string) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone ?? undefined,
    created_at: u.created_at,
    role,
    user_metadata: { full_name: u.full_name ?? "", phone: u.phone ?? "" },
    app_metadata: { role },
  };
}

/**
 * ADMIN_EMAILS env ভেরিয়েবলে থাকা ইমেইল হলে স্বয়ংক্রিয়ভাবে admin রোল দেয়।
 * কমা/স্পেস/নতুন লাইন দিয়ে একাধিক ইমেইল দেওয়া যায়।
 */
async function ensureAdminEmail(env: Env, userId: string, email: string) {
  const list = (env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(email.toLowerCase())) return;
  await env.DB.prepare(
    "INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
  ).bind(newId(), userId).run();
}

async function roleOf(env: Env, userId: string): Promise<string> {
  const row = await env.DB.prepare(
    `SELECT role FROM user_roles WHERE user_id = ?
     ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END LIMIT 1`,
  ).bind(userId).first<{ role: string }>();
  return row?.role || "user";
}

/** অ্যাকসেস + রিফ্রেশ টোকেন তৈরি করে সেশন অবজেক্ট ফেরত দেয় */
async function makeSession(env: Env, u: DbUser) {
  await ensureAdminEmail(env, u.id, u.email);
  const role = await roleOf(env, u.id);
  const access_token = await signJwt(
    { sub: u.id, email: u.email, role }, jwtSecret(env), ACCESS_TTL,
  );
  const refresh_token = randomToken();
  const expires = new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000).toISOString();
  await env.DB.prepare(
    "INSERT INTO auth_refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(await hashToken(refresh_token), u.id, expires).run();

  return {
    access_token,
    refresh_token,
    token_type: "bearer",
    expires_in: ACCESS_TTL,
    expires_at: Math.floor(Date.now() / 1000) + ACCESS_TTL,
    user: publicUser(u, role),
  };
}

function validEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

export const onRequest = withApi(async ({ request, env, params }: PagesCtx) => {
  const raw = (params as Record<string, string | string[]>).route;
  const route = (Array.isArray(raw) ? raw.join("/") : String(raw || "")).toLowerCase();
  const body: any = request.method === "GET" ? {} : await request.json().catch(() => ({}));

  // ---------- সাইন আপ ----------
  if (route === "signup" && request.method === "POST") {
    const { email, password, full_name, phone } = body;
    if (!validEmail(email)) return errorJson("সঠিক ইমেইল দিন", 400);
    if (typeof password !== "string" || password.length < 6) {
      return errorJson("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", 400);
    }
    const exists = await env.DB.prepare("SELECT id FROM auth_users WHERE email = ?")
      .bind(email.toLowerCase()).first();
    if (exists) return errorJson("এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে", 409);

    const id = newId();
    const user = await env.DB.prepare(
      `INSERT INTO auth_users (id, email, password_hash, full_name, phone)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    ).bind(
      id, email.toLowerCase(), await hashPassword(password),
      full_name ?? null, phone ?? null,
    ).first<DbUser>();

    await env.DB.batch([
      env.DB.prepare(
        "INSERT OR IGNORE INTO profiles (id, user_id, full_name, phone) VALUES (?, ?, ?, ?)",
      ).bind(newId(), id, full_name ?? null, phone ?? null),
      env.DB.prepare(
        "INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'user')",
      ).bind(newId(), id),
    ]);

    return json({ data: await makeSession(env, user!) }, 201);
  }

  // ---------- লগইন ----------
  if ((route === "login" || route === "signin") && request.method === "POST") {
    const { email, password } = body;
    if (!validEmail(email) || typeof password !== "string") {
      return errorJson("ইমেইল ও পাসওয়ার্ড দিন", 400);
    }
    const user = await env.DB.prepare("SELECT * FROM auth_users WHERE email = ?")
      .bind(email.toLowerCase()).first<DbUser>();
    // একই বার্তা — অ্যাকাউন্ট আছে কিনা ফাঁস হয় না
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return errorJson("ইমেইল বা পাসওয়ার্ড ভুল", 401);
    }
    if (user.is_banned) return errorJson("এই অ্যাকাউন্ট বন্ধ করা হয়েছে", 403);

    // পুরনো bcrypt হ্যাশ হলে লগইনের সময় নতুন PBKDF2 হ্যাশে আপগ্রেড
    if (isLegacyHash(user.password_hash)) {
      const upgraded = await hashPassword(password);
      await env.DB.prepare("UPDATE auth_users SET password_hash = ? WHERE id = ?")
        .bind(upgraded, user.id).run();
    }

    await env.DB.prepare("UPDATE auth_users SET last_sign_in_at = datetime('now') WHERE id = ?")
      .bind(user.id).run();
    return json({ data: await makeSession(env, user) });
  }

  // ---------- রিফ্রেশ ----------
  if (route === "refresh" && request.method === "POST") {
    const { refresh_token } = body;
    if (typeof refresh_token !== "string") return errorJson("refresh_token প্রয়োজন", 400);
    const hash = await hashToken(refresh_token);
    const row = await env.DB.prepare(
      "SELECT user_id FROM auth_refresh_tokens WHERE token_hash = ? AND expires_at > datetime('now')",
    ).bind(hash).first<{ user_id: string }>();
    if (!row) return errorJson("সেশনের মেয়াদ শেষ, আবার লগইন করুন", 401);

    const user = await env.DB.prepare("SELECT * FROM auth_users WHERE id = ?")
      .bind(row.user_id).first<DbUser>();
    if (!user) return errorJson("ইউজার পাওয়া যায়নি", 401);

    // পুরনো রিফ্রেশ টোকেন বাতিল (rotation)
    await env.DB.prepare("DELETE FROM auth_refresh_tokens WHERE token_hash = ?").bind(hash).run();
    return json({ data: await makeSession(env, user) });
  }

  // ---------- লগআউট ----------
  if (route === "logout" && request.method === "POST") {
    if (typeof body.refresh_token === "string") {
      await env.DB.prepare("DELETE FROM auth_refresh_tokens WHERE token_hash = ?")
        .bind(await hashToken(body.refresh_token)).run();
    }
    return json({ data: { success: true } });
  }

  // ---------- বর্তমান ইউজার ----------
  if (route === "me" && request.method === "GET") {
    const authUser = await getUser(request, env);
    if (!authUser) return errorJson("লগইন প্রয়োজন", 401);
    const user = await env.DB.prepare("SELECT * FROM auth_users WHERE id = ?")
      .bind(authUser.id).first<DbUser>();
    if (!user) return errorJson("ইউজার পাওয়া যায়নি", 401);
    return json({ data: { user: publicUser(user, authUser.role) } });
  }

  // ---------- প্রোফাইল/পাসওয়ার্ড আপডেট ----------
  if (route === "user" && (request.method === "PUT" || request.method === "PATCH")) {
    const authUser = await getUser(request, env);
    if (!authUser) return errorJson("লগইন প্রয়োজন", 401);

    const sets: string[] = [];
    const vals: (string | null)[] = [];
    if (validEmail(body.email)) { sets.push("email = ?"); vals.push(body.email.toLowerCase()); }
    if (typeof body.full_name === "string") { sets.push("full_name = ?"); vals.push(body.full_name); }
    if (typeof body.phone === "string") { sets.push("phone = ?"); vals.push(body.phone); }
    if (typeof body.password === "string") {
      if (body.password.length < 6) return errorJson("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", 400);
      sets.push("password_hash = ?"); vals.push(await hashPassword(body.password));
    }
    if (!sets.length) return errorJson("আপডেট করার মতো কিছু নেই", 400);

    const user = await env.DB.prepare(
      `UPDATE auth_users SET ${sets.join(", ")} WHERE id = ? RETURNING *`,
    ).bind(...vals, authUser.id).first<DbUser>();

    if (typeof body.full_name === "string" || typeof body.phone === "string") {
      await env.DB.prepare(
        `INSERT INTO profiles (id, user_id, full_name, phone) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           full_name = COALESCE(excluded.full_name, profiles.full_name),
           phone = COALESCE(excluded.phone, profiles.phone)`,
      ).bind(newId(), authUser.id, body.full_name ?? null, body.phone ?? null).run();
    }
    return json({ data: { user: publicUser(user!, authUser.role) } });
  }

  // ---------- পাসওয়ার্ড রিসেট রিকোয়েস্ট ----------
  if (route === "forgot-password" && request.method === "POST") {
    const { email } = body;
    if (!validEmail(email)) return errorJson("সঠিক ইমেইল দিন", 400);
    return errorJson("ইমেইলে পাসওয়ার্ড রিসেটের ব্যবস্থা এখনো চালু হয়নি।", 503);
  }

  // ---------- পাসওয়ার্ড রিসেট ----------
  if (route === "reset-password" && request.method === "POST") {
    const { token, password } = body;
    if (typeof token !== "string" || typeof password !== "string" || password.length < 6) {
      return errorJson("টোকেন ও কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন", 400);
    }
    const hash = await hashToken(token);
    const row = await env.DB.prepare(
      `SELECT user_id FROM auth_reset_tokens
       WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')`,
    ).bind(hash).first<{ user_id: string }>();
    if (!row) return errorJson("রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ", 400);

    await env.DB.batch([
      env.DB.prepare("UPDATE auth_users SET password_hash = ? WHERE id = ?")
        .bind(await hashPassword(password), row.user_id),
      env.DB.prepare("UPDATE auth_reset_tokens SET used = 1 WHERE token_hash = ?").bind(hash),
      // নিরাপত্তার জন্য সব সেশন বাতিল
      env.DB.prepare("DELETE FROM auth_refresh_tokens WHERE user_id = ?").bind(row.user_id),
    ]);
    return json({ data: { success: true } });
  }

  return errorJson("এই রুট পাওয়া যায়নি", 404);
});
