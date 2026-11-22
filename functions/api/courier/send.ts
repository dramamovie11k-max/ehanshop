// POST /api/courier/send — Steadfast/Pathao তে অর্ডার পাঠানো (edge function এর পোর্ট)
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { newId } from "../../_shared/db";
import type { PagesCtx, Env } from "../../_shared/types";

interface Creds {
  steadfast_api_key?: string;
  steadfast_secret_key?: string;
  pathao_client_id?: string;
  pathao_client_secret?: string;
  pathao_username?: string;
  pathao_password?: string;
  pathao_store_id?: string;
}

/** site_settings থেকে কুরিয়ার ক্রেডেনশিয়াল পড়া */
async function getCreds(env: Env): Promise<Creds> {
  const keys = [
    "steadfast_api_key", "steadfast_secret_key", "pathao_client_id",
    "pathao_client_secret", "pathao_username", "pathao_password", "pathao_store_id",
  ];
  const { results } = await env.DB.prepare(
    `SELECT setting_key, setting_value FROM site_settings
     WHERE setting_key IN (${keys.map(() => "?").join(",")})`,
  ).bind(...keys).all<{ setting_key: string; setting_value: string }>();
  const out: Creds = {};
  for (const r of results || []) {
    (out as Record<string, string>)[r.setting_key] = r.setting_value;
  }
  return out;
}

async function sendToSteadfast(c: Creds, d: any) {
  if (!c.steadfast_api_key || !c.steadfast_secret_key) {
    throw new Error("Steadfast API ক্রেডেনশিয়াল সেট করা নেই");
  }
  const res = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": c.steadfast_api_key,
      "Secret-Key": c.steadfast_secret_key,
    },
    body: JSON.stringify({
      invoice: d.orderId.slice(0, 8).toUpperCase(),
      recipient_name: d.recipientName,
      recipient_phone: d.recipientPhone,
      recipient_address: d.recipientAddress,
      cod_amount: d.codAmount,
      note: d.note || "",
    }),
  });
  const result = (await res.json()) as any;
  if (!res.ok || result.status !== 200) throw new Error(result.message || "Steadfast API ত্রুটি");
  return {
    consignmentId: String(result.consignment?.consignment_id || ""),
    trackingCode: result.consignment?.tracking_code || "",
  };
}

async function sendToPathao(c: Creds, d: any) {
  if (!c.pathao_client_id || !c.pathao_client_secret || !c.pathao_username || !c.pathao_password) {
    throw new Error("Pathao API ক্রেডেনশিয়াল সেট করা নেই");
  }
  const tokenRes = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/issue-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: c.pathao_client_id,
      client_secret: c.pathao_client_secret,
      username: c.pathao_username,
      password: c.pathao_password,
      grant_type: "password",
    }),
  });
  const tokenResult = (await tokenRes.json()) as any;
  if (!tokenRes.ok || !tokenResult.access_token) {
    throw new Error("Pathao টোকেন পাওয়া যায়নি: " + (tokenResult.message || "অজানা ত্রুটি"));
  }
  const cityId = d.recipientCity?.toLowerCase().includes("dhaka") ? 1 : 2;
  const orderRes = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${tokenResult.access_token}`,
    },
    body: JSON.stringify({
      store_id: c.pathao_store_id || "1",
      merchant_order_id: d.orderId.slice(0, 8).toUpperCase(),
      recipient_name: d.recipientName,
      recipient_phone: d.recipientPhone,
      recipient_address: d.recipientAddress,
      recipient_city: cityId,
      recipient_zone: 1,
      delivery_type: 48,
      item_type: 2,
      special_instruction: d.note || "",
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: d.codAmount,
      item_description: "Product delivery",
    }),
  });
  const orderResult = (await orderRes.json()) as any;
  if (!orderRes.ok) {
    throw new Error("Pathao অর্ডার তৈরি ব্যর্থ: " + (orderResult.message || "অজানা ত্রুটি"));
  }
  return {
    consignmentId: String(orderResult.data?.consignment_id || ""),
    trackingCode: orderResult.data?.consignment_id || "",
  };
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "POST") return errorJson("এই মেথড সাপোর্ট করে না", 405);

  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as any;
  const { orderId, courier } = body;
  if (!orderId || !["steadfast", "pathao"].includes(courier)) {
    return errorJson("orderId ও সঠিক courier আবশ্যক", 400);
  }

  const creds = await getCreds(env);
  const result = courier === "steadfast"
    ? await sendToSteadfast(creds, body)
    : await sendToPathao(creds, body);

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE orders SET courier_id = ?, courier_consignment_id = ?,
       courier_tracking_code = ?, courier_sent_at = datetime('now'), status = 'shipped'
       WHERE id = ?`,
    ).bind(courier, result.consignmentId, result.trackingCode, orderId),
    env.DB.prepare(
      `INSERT INTO order_logs (id, order_id, action, new_status, notes, performed_by)
       VALUES (?, ?, 'courier_sent', 'shipped', ?, ?)`,
    ).bind(
      newId(), orderId,
      `${courier.toUpperCase()} — Tracking: ${result.trackingCode}`,
      auth.user.id,
    ),
  ]);

  return json({
    success: true,
    message: `অর্ডার ${courier.toUpperCase()}-এ পাঠানো হয়েছে`,
    trackingCode: result.trackingCode,
    consignmentId: result.consignmentId,
  });
});
