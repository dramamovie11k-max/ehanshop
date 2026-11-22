// POST /api/tracking/tt — TikTok Events API (server-side ইভেন্ট)
import { withApi, json, errorJson } from "../../_shared/cors";
import { getSettings, sha256, clientIp } from "../../_shared/settings";
import type { PagesCtx } from "../../_shared/types";

// Meta-স্টাইল ইভেন্ট নাম → TikTok স্ট্যান্ডার্ড ইভেন্ট
const EVENT_MAP: Record<string, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  AddToWishlist: "AddToWishlist",
  InitiateCheckout: "InitiateCheckout",
  AddPaymentInfo: "AddPaymentInfo",
  Purchase: "CompletePayment",
  Lead: "SubmitForm",
  Contact: "Contact",
  CompleteRegistration: "CompleteRegistration",
  Search: "Search",
  CancelOrder: "CancelOrder",
};

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "POST") return errorJson("এই মেথড সাপোর্ট করে না", 405);

  const cfg = await getSettings(env, [
    "tiktok_pixel_id", "tiktok_pixel_access_token",
    "tiktok_pixel_test_event_code", "tiktok_pixel_enabled",
  ]);
  if (cfg.tiktok_pixel_enabled !== "true" || !cfg.tiktok_pixel_id || !cfg.tiktok_pixel_access_token) {
    return json({ skipped: true, reason: "TikTok pixel not configured or disabled" });
  }

  const payload = (await request.json()) as any;
  if (!payload?.event_name) return errorJson("event_name required", 400);

  const u = payload.user_data || {};
  const user: Record<string, any> = {};
  if (u.email) user.email = await sha256(u.email);
  if (u.phone) user.phone = await sha256(String(u.phone).replace(/\D/g, ""));
  if (u.first_name) user.first_name = await sha256(u.first_name);
  if (u.last_name) user.last_name = await sha256(u.last_name);
  if (u.city) user.city = await sha256(u.city);
  if (u.state) user.state = await sha256(u.state);
  if (u.country) user.country = await sha256(u.country);
  if (u.zip) user.zip_code = await sha256(u.zip);
  if (u.external_id) user.external_id = await sha256(String(u.external_id));
  if (u.client_user_agent) user.user_agent = u.client_user_agent;
  if (u.ttp) user.ttp = u.ttp;
  if (u.ttclid) user.ttclid = u.ttclid;
  if (u.locale) user.locale = u.locale;
  const ip = u.client_ip_address || clientIp(request);
  if (ip) user.ip = ip;

  const cd = payload.custom_data || {};
  const properties: Record<string, any> = {};
  if (cd.currency) properties.currency = String(cd.currency).toUpperCase().slice(0, 3);
  if (cd.value !== undefined) {
    const n = Number(cd.value);
    properties.value = isNaN(n) ? 0 : Number(n.toFixed(2));
    if (!properties.currency) properties.currency = "BDT";
  }
  if (cd.content_type) properties.content_type = cd.content_type;
  if (cd.content_name) properties.content_name = cd.content_name;
  if (cd.content_category) properties.content_category = cd.content_category;
  if (cd.content_id) properties.content_id = String(cd.content_id);
  if (Array.isArray(cd.content_ids)) properties.content_ids = cd.content_ids.map((x: any) => String(x));
  if (cd.description) properties.description = String(cd.description);
  if (cd.brand) properties.brand = String(cd.brand);
  if (cd.order_id) properties.order_id = cd.order_id;
  if (cd.search_string) properties.query = cd.search_string;
  if (cd.query) properties.query = cd.query;
  if (cd.status) properties.status = cd.status;
  if (Array.isArray(cd.contents)) {
    properties.contents = cd.contents.map((c: any) => ({
      content_id: String(c.id ?? c.content_id ?? ""),
      content_name: c.item_name || c.content_name,
      content_category: c.item_category || c.content_category,
      brand: c.item_brand || c.brand,
      price: c.item_price !== undefined && !isNaN(Number(c.item_price))
        ? Number(Number(c.item_price).toFixed(2))
        : c.price !== undefined ? Number(Number(c.price).toFixed(2)) : undefined,
      quantity: c.quantity !== undefined && !isNaN(Number(c.quantity)) ? Number(c.quantity) : 1,
    }));
  }

  const body: Record<string, any> = {
    event_source: "web",
    event_source_id: cfg.tiktok_pixel_id,
    data: [{
      event: EVENT_MAP[payload.event_name] || payload.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.event_id,
      user,
      properties,
      page: { url: payload.event_source_url, referrer: payload.event_source_referrer || "" },
    }],
  };
  if (cfg.tiktok_pixel_test_event_code) body.test_event_code = cfg.tiktok_pixel_test_event_code;

  const ttRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": cfg.tiktok_pixel_access_token },
    body: JSON.stringify(body),
  });
  const ttJson = (await ttRes.json()) as any;
  if (!ttRes.ok || ttJson.code !== 0) return json({ error: ttJson }, 502);

  return json({ success: true, tiktok: ttJson });
});
