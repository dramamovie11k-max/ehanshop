// GET /api/health — D1 কানেকশন ঠিক আছে কিনা যাচাই করার জন্য
// ফ্রন্টএন্ড এটি দিয়ে বুঝে নেয় D1 ব্যবহার করা যাবে, নাকি Lovable Cloud এ ফলব্যাক করতে হবে

import { withApi, json } from "../_shared/cors";
import type { PagesCtx } from "../_shared/types";

export const onRequest = withApi(async ({ env }: PagesCtx) => {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM products").first<{ c: number }>();
  return json({
    ok: true,
    database: "cloudflare-d1",
    products: row?.c ?? 0,
    time: new Date().toISOString(),
  });
});
