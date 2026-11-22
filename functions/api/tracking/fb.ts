// POST /api/tracking/fb — Facebook Conversions API (server-side ইভেন্ট)
import { withApi, json, errorJson } from "../../_shared/cors";
import { getSettings, sha256, clientIp } from "../../_shared/settings";
import type { PagesCtx } from "../../_shared/types";

interface CapiPayload {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: Record<string, string | undefined>;
  custom_data?: Record<string, any>;
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "POST") return errorJson("এই মেথড সাপোর্ট করে না", 405);

  const cfg = await getSettings(env, [
    "fb_pixel_id", "fb_pixel_access_token", "fb_pixel_test_event_code", "fb_pixel_enabled",
  ]);
  if (cfg.fb_pixel_enabled !== "true" || !cfg.fb_pixel_id || !cfg.fb_pixel_access_token) {
    return json({ skipped: true, reason: "Pixel not configured or disabled" });
  }

  const payload = (await request.json()) as CapiPayload;
  if (!payload?.event_name) return errorJson("event_name required", 400);

  const u = payload.user_data || {};
  const ud: Record<string, any> = {};
  if (u.email) ud.em = [await sha256(u.email)];
  if (u.phone) ud.ph = [await sha256(u.phone.replace(/\D/g, ""))];
  if (u.first_name) ud.fn = [await sha256(u.first_name)];
  if (u.last_name) ud.ln = [await sha256(u.last_name)];
  if (u.city) ud.ct = [await sha256(u.city)];
  if (u.state) ud.st = [await sha256(u.state)];
  if (u.country) ud.country = [await sha256(u.country)];
  if (u.zip) ud.zp = [await sha256(u.zip)];
  if (u.date_of_birth) ud.db = [await sha256(u.date_of_birth.replace(/\D/g, ""))];
  if (u.gender) ud.ge = [await sha256(u.gender.trim().toLowerCase().slice(0, 1))];
  if (u.external_id) ud.external_id = [await sha256(String(u.external_id))];
  if (u.client_user_agent) ud.client_user_agent = u.client_user_agent;
  if (u.fbp) ud.fbp = u.fbp;
  if (u.fbc) ud.fbc = u.fbc;
  const ip = u.client_ip_address || clientIp(request);
  if (ip) ud.client_ip_address = ip;

  const customData: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload.custom_data || {})) {
    if (v !== undefined && v !== null && v !== "") customData[k] = v;
  }
  if (customData.value !== undefined) {
    const num = Number(customData.value);
    customData.value = isNaN(num) ? 0 : Number(num.toFixed(2));
  }
  if (customData.currency) {
    customData.currency = String(customData.currency).toUpperCase().slice(0, 3);
  } else if (customData.value !== undefined) {
    customData.currency = "BDT";
  }
  if (Array.isArray(customData.contents)) {
    customData.contents = customData.contents.map((c: any) => ({
      ...c,
      id: String(c.id ?? ""),
      item_price: c.item_price !== undefined && !isNaN(Number(c.item_price))
        ? Number(Number(c.item_price).toFixed(2)) : undefined,
      quantity: c.quantity !== undefined && !isNaN(Number(c.quantity)) ? Number(c.quantity) : 1,
    }));
  }

  const body: Record<string, any> = {
    data: [{
      event_name: payload.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.event_id,
      event_source_url: payload.event_source_url,
      action_source: "website",
      user_data: ud,
      custom_data: customData,
    }],
    access_token: cfg.fb_pixel_access_token,
  };
  if (cfg.fb_pixel_test_event_code) body.test_event_code = cfg.fb_pixel_test_event_code;

  const fbRes = await fetch(`https://graph.facebook.com/v18.0/${cfg.fb_pixel_id}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const fbJson = await fbRes.json();
  if (!fbRes.ok) return json({ error: fbJson }, 502);

  return json({ success: true, fb: fbJson });
});
