// POST /api/courier/check-ratio — BD Courier দিয়ে কাস্টমারের ডেলিভারি রেশিও চেক
// API key: প্রথমে env (BDCOURIER_API_KEY), না থাকলে site_settings টেবিল থেকে
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import type { PagesCtx } from "../../_shared/types";

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "POST") return errorJson("এই মেথড সাপোর্ট করে না", 405);

  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;

  const { phone } = (await request.json()) as { phone?: string };
  if (!phone) return errorJson("ফোন নম্বর প্রয়োজন", 400);

  // নম্বর পরিষ্কার করা (+880 → 0)
  let cleanPhone = phone.replace(/[\s\-+]/g, "");
  if (cleanPhone.startsWith("880")) cleanPhone = "0" + cleanPhone.slice(3);
  if (!cleanPhone.startsWith("0")) cleanPhone = "0" + cleanPhone;

  // ক্যাশ (২৪ ঘণ্টা)
  const cached = await env.DB.prepare(
    `SELECT data FROM courier_ratio_cache
     WHERE phone = ? AND checked_at > datetime('now', '-1 day')`,
  ).bind(cleanPhone).first<{ data: string }>();
  if (cached) return json({ success: true, data: JSON.parse(cached.data), cached: true });

  const apiKey =
    (env as any).BDCOURIER_API_KEY ||
    (await env.DB.prepare(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'bdcourier_api_key'",
    ).first<{ setting_value: string }>())?.setting_value;

  if (!apiKey) return errorJson("BD Courier API key কনফিগার করা নেই", 500);

  const res = await fetch("https://api.bdcourier.com/courier-check", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ phone: cleanPhone }),
  });

  if (!res.ok) {
    // API ব্যর্থ হলে "নতুন কাস্টমার" হিসেবে ধরে নেওয়া হয় (অর্ডার ফ্লো আটকায় না)
    return json({
      success: true,
      data: {
        phone: cleanPhone, total: 0, success: 0, cancel: 0,
        success_ratio: 0, cancel_ratio: 0, message: "নতুন কাস্টমার",
      },
    });
  }

  const result = (await res.json()) as { data?: unknown };
  const data = result.data ?? result;

  await env.DB.prepare(
    `INSERT INTO courier_ratio_cache (phone, data, checked_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(phone) DO UPDATE SET data = excluded.data, checked_at = excluded.checked_at`,
  ).bind(cleanPhone, JSON.stringify(data)).run();

  return json({ success: true, data });
});
