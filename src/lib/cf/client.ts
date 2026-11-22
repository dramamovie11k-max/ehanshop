// ============================================================
// Cloudflare ক্লায়েন্ট — ডেটাবেস (D1), স্টোরেজ (R2), অথ (JWT), ফাংশন
//
// পুরো অ্যাপ এই একটিমাত্র ক্লায়েন্ট ব্যবহার করে। কোনো বাইরের ব্যাকএন্ড
// (Supabase / Lovable Cloud) এর উপর নির্ভরতা নেই — প্রজেক্ট শুধু
// Cloudflare Pages + D1 + R2 দিয়েই সম্পূর্ণ চলে।
// ============================================================

import { cfAuth, type User, type Session } from "./auth";
import { from } from "./query";
import { storage } from "./storage";
import { functions } from "./functions";

async function rpc(fn: string, args: Record<string, any> = {}) {
  // একমাত্র ব্যবহৃত RPC: has_role — ভূমিকা সার্ভার থেকেই যাচাই হয়
  if (fn === "has_role") {
    const { data, error } = await cfAuth.getUser();
    if (error) return { data: null, error };
    const role = data.user?.role || null;
    const wanted = args._role;
    const ok = role === wanted || (wanted === "moderator" && role === "admin");
    return { data: ok, error: null };
  }
  try {
    const token = await cfAuth.accessToken();
    const res = await fetch(`/api/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(args),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: { message: body?.error || `ত্রুটি (${res.status})`, name: "RpcError" } };
    return { data: body?.data ?? body, error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : "নেটওয়ার্ক ত্রুটি", name: "RpcError" } };
  }
}

export const cf = {
  from,
  rpc,
  auth: cfAuth,
  storage,
  functions,
};

export type { User, Session };
export default cf;
