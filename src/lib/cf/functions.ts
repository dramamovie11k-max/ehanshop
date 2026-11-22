// ============================================================
// ফাংশন ইনভোকার — আগের edge function গুলো এখন Cloudflare Pages Functions
// supabase.functions.invoke("নাম", { body }) কল একই রকম কাজ করে।
// ============================================================

import { cfAuth } from "./auth";

/** পুরনো ফাংশন নাম → Cloudflare রুট */
const ROUTES: Record<string, string> = {
  "get-client-ip": "/api/client-ip",
  "check-courier-ratio": "/api/courier/check-ratio",
  "send-to-courier": "/api/courier/send",
  "fb-conversions-api": "/api/tracking/fb",
  "facebook-conversions": "/api/tracking/fb",
  "tiktok-events-api": "/api/tracking/tt",
  "tiktok-events": "/api/tracking/tt",
};

export const functions = {
  async invoke<T = any>(name: string, opts?: { body?: unknown; method?: string }) {
    const path = ROUTES[name] || `/api/${name}`;
    try {
      const token = await cfAuth.accessToken();
      const res = await fetch(path, {
        method: opts?.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: { message: body?.error || `ত্রুটি (${res.status})`, name: "FunctionsError" } };
      }
      return { data: (body?.data ?? body) as T, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "নেটওয়ার্ক ত্রুটি", name: "FunctionsError" },
      };
    }
  },
};
