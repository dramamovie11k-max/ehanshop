// অথেনটিকেশন — সম্পূর্ণ নিজস্ব (Cloudflare D1 + HS256 JWT)।
// কোনো বাইরের auth সার্ভিসের উপর নির্ভরতা নেই।

import type { Env } from "./types";
import { errorJson } from "./cors";
import { verifyJwt } from "./jwt";
import { newId } from "./db";

/** ADMIN_EMAILS env-এ থাকা ইমেইলগুলোর তালিকা (lowercase) */
export function adminEmails(env: Env): string[] {
  return (env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}


export interface AuthUser {
  id: string;
  email?: string;
  role: "admin" | "moderator" | "user";
}

/** env থেকে JWT সিক্রেট (না থাকলে পরিষ্কার ত্রুটি) */
export function jwtSecret(env: Env): string {
  const s = env.AUTH_JWT_SECRET;
  if (!s) throw new Error("AUTH_JWT_SECRET সেট করা নেই");
  return s;
}

/** রিকোয়েস্ট থেকে ইউজার বের করে (লগইন না থাকলে null) */
export async function getUser(request: Request, env: Env): Promise<AuthUser | null> {
  const auth = request.headers.get("authorization") || "";
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  if (!token || !env.AUTH_JWT_SECRET) return null;

  const payload = await verifyJwt(token, env.AUTH_JWT_SECRET);
  if (!payload?.sub) return null;

  // রোল সবসময় ডেটাবেস থেকে পড়া হয় (JWT-তে বিশ্বাস করা হয় না)
  const row = await env.DB.prepare(
    `SELECT role FROM user_roles WHERE user_id = ?
     ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END LIMIT 1`,
  ).bind(payload.sub).first<{ role: string }>();

  let role = (row?.role as AuthUser["role"]) || "user";

  // ADMIN_EMAILS তালিকায় থাকলে যেকোনো রিকোয়েস্টেই অটো admin (আগের অ্যাকাউন্টও)
  if (role !== "admin") {
    const dbEmail = await env.DB.prepare("SELECT email FROM auth_users WHERE id = ?")
      .bind(payload.sub).first<{ email: string }>();
    const email = (dbEmail?.email || (typeof payload.email === "string" ? payload.email : "")).toLowerCase();
    if (email && adminEmails(env).includes(email)) {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
      ).bind(newId(), payload.sub).run();
      role = "admin";
    }
  }

  return {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    role,
  };
}


/** লগইন বাধ্যতামূলক — না থাকলে 401 */
export async function requireUser(
  request: Request,
  env: Env,
): Promise<{ user: AuthUser } | { response: Response }> {
  const user = await getUser(request, env);
  if (!user) return { response: errorJson("লগইন প্রয়োজন", 401) };
  return { user };
}

/** স্টাফ (admin/moderator) বাধ্যতামূলক */
export async function requireStaff(
  request: Request,
  env: Env,
): Promise<{ user: AuthUser } | { response: Response }> {
  const res = await requireUser(request, env);
  if ("response" in res) return res;
  if (res.user.role !== "admin" && res.user.role !== "moderator") {
    return { response: errorJson("এই কাজের অনুমতি নেই", 403) };
  }
  return res;
}

/** শুধু অ্যাডমিন */
export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<{ user: AuthUser } | { response: Response }> {
  const res = await requireUser(request, env);
  if ("response" in res) return res;
  if (res.user.role !== "admin") {
    return { response: errorJson("শুধু অ্যাডমিন এই কাজ করতে পারবেন", 403) };
  }
  return res;
}
