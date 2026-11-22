// ============================================================
// ডেটা লেয়ার — সম্পূর্ণ Cloudflare (Pages Functions + D1 + R2)
// কোনো বাইরের ব্যাকএন্ড নেই। ডেডিকেটেড /api রুট ব্যর্থ হলে জেনেরিক
// /api/db (একই D1) দিয়ে দ্বিতীয় চেষ্টা করা যায়।
// ============================================================

import { cfAuth } from "./cf/auth";

/** API লেয়ার সচল কিনা — একবার চেক করে মনে রাখা হয় */
let apiAvailable: boolean | null = null;
let apiProbe: Promise<boolean> | null = null;

export async function isD1Available(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  if (!apiProbe) {
    apiProbe = fetch("/api/health", { method: "GET" })
      .then((r) => r.ok)
      .catch(() => false)
      .then((ok) => {
        apiAvailable = ok;
        if (!ok) console.warn("[data] /api পাওয়া যায়নি — Cloudflare Functions চলছে না");
        return ok;
      });
  }
  return apiProbe;
}

/** লগইন করা ইউজারের JWT (Cloudflare auth) */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await cfAuth.accessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** API কল — সফল হলে data ফেরত, ব্যর্থ হলে throw */
export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(await authHeader()),
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || `API ত্রুটি (${res.status})`);
  return (body as any)?.data !== undefined ? (body as any).data : (body as T);
}

/**
 * ডেডিকেটেড রুট চেষ্টা করে; ব্যর্থ হলে বিকল্প (সাধারণত জেনেরিক /api/db) চালায়।
 * দুটোই একই Cloudflare D1 ডেটাবেসে যায়।
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    console.warn("[data] প্রাইমারি রুট ব্যর্থ, /api/db দিয়ে চেষ্টা:", err);
    return fallback();
  }
}
