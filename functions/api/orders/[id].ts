// GET    /api/orders/:id  — এক অর্ডার (আইটেম ও লগসহ; স্টাফ অথবা নিজের অর্ডার)
// PUT    /api/orders/:id  — স্ট্যাটাস/তথ্য আপডেট (শুধু স্টাফ) + order_logs
// DELETE /api/orders/:id  — অর্ডার মুছে ফেলা (শুধু অ্যাডমিন)

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff, requireAdmin, requireUser } from "../../_shared/auth";
import { decodeRow, decodeRows, buildUpdate, newId } from "../../_shared/db";
import { syncOrderStock, isStockActiveStatus } from "../../_shared/stock";
import type { PagesCtx } from "../../_shared/types";

const ORDER_WRITABLE = [
  "customer_name", "customer_phone", "customer_address", "customer_city",
  "total_amount", "shipping_cost", "status", "payment_method", "notes",
  "is_duplicate_blocked", "courier_id", "courier_tracking_code",
  "courier_consignment_id", "courier_sent_at", "courier_ratio_data",
  "tracking_data", "order_source", "coupon_code", "coupon_discount",
];

export const onRequest = withApi(async ({ request, env, params }: PagesCtx) => {
  const id = String((params as Record<string, string>).id ?? "");
  if (!id) return errorJson("অর্ডার আইডি প্রয়োজন", 400);

  if (request.method === "GET") {
    // গেস্ট চেকআউটেও অর্ডার সাকসেস পেজ কাজ করতে হবে — তাই লগইন ছাড়া
    // অর্ডার আইডি জানা থাকলে সীমিত (পাবলিক) তথ্য দেখানো হয়।
    const auth = await requireUser(request, env);
    const user = "response" in auth ? null : auth.user;
    const isStaff = user?.role === "admin" || user?.role === "moderator";

    const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
    if (!order) return errorJson("অর্ডার পাওয়া যায়নি", 404);
    let data: any = decodeRow(order);
    const isOwner = !!user && data.user_id === user.id;

    if (!isStaff && !isOwner) {
      // পাবলিক ভিউ — শুধু কনফার্মেশনের জন্য প্রয়োজনীয় ফিল্ড
      data = {
        id: data.id,
        customer_name: data.customer_name,
        customer_address: data.customer_address,
        customer_city: data.customer_city,
        total_amount: data.total_amount,
        shipping_cost: data.shipping_cost,
        payment_method: data.payment_method,
        status: data.status,
        notes: data.notes,
        created_at: data.created_at,
      };
    }

    const { results: items } = await env.DB.prepare(
      "SELECT * FROM order_items WHERE order_id = ?",
    ).bind(id).all();
    data.items = decodeRows(items);
    data.order_items = data.items;

    if (isStaff) {
      const { results: logs } = await env.DB.prepare(
        "SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at DESC",
      ).bind(id).all();
      data.logs = decodeRows(logs);
    }
    return json({ data });
  }


  if (request.method === "PUT" || request.method === "PATCH") {
    const body = (await request.json()) as Record<string, unknown>;

    // পিক্সেল ট্র্যাকিং তথ্য — চেকআউটের পরপরই (গেস্টসহ) একবারই লেখা যায়।
    // অন্য কোনো ফিল্ড এভাবে বদলানো যায় না।
    const trackingOnly =
      Object.keys(body).length > 0 &&
      Object.keys(body).every((k) => k === "purchase_event_id" || k === "tracking_data");
    if (trackingOnly) {
      const current = await env.DB.prepare(
        "SELECT purchase_event_id, tracking_data FROM orders WHERE id = ?",
      ).bind(id).first<{ purchase_event_id: string | null; tracking_data: string | null }>();
      if (!current) return errorJson("অর্ডার পাওয়া যায়নি", 404);
      if (current.purchase_event_id || current.tracking_data) {
        return errorJson("ট্র্যাকিং তথ্য আগেই সংরক্ষিত হয়েছে", 409);
      }
      await env.DB.prepare(
        "UPDATE orders SET purchase_event_id = ?, tracking_data = ? WHERE id = ?",
      ).bind(
        (body.purchase_event_id as string) ?? null,
        body.tracking_data == null ? null : JSON.stringify(body.tracking_data),
        id,
      ).run();
      return json({ data: { success: true } });
    }

    const auth = await requireStaff(request, env);
    if ("response" in auth) return auth.response;


    const before = await env.DB.prepare("SELECT status FROM orders WHERE id = ?")
      .bind(id).first<{ status: string }>();
    if (!before) return errorJson("অর্ডার পাওয়া যায়নি", 404);

    const built = buildUpdate("orders", body, ORDER_WRITABLE, "id");
    if (!built) return errorJson("আপডেট করার মতো কিছু নেই", 400);
    const row = await env.DB.prepare(built.sql).bind(...built.values, id).first();

    // স্ট্যাটাস বদলালে লগ + স্টক সমন্বয়
    if (body.status && body.status !== before.status) {
      await env.DB.prepare(
        `INSERT INTO order_logs (id, order_id, action, old_status, new_status, notes, performed_by)
         VALUES (?, ?, 'status_change', ?, ?, ?, ?)`,
      ).bind(
        newId(), id, before.status, String(body.status),
        (body.notes as string) ?? null, auth.user.id,
      ).run();

      const active = isStockActiveStatus(String(body.status));
      await syncOrderStock(
        env, id, active,
        active ? "অর্ডার পুনরায় সক্রিয় — স্টক কমানো হয়েছে" : "অর্ডার বাতিল/রিটার্ন — স্টক ফেরত",
      );
    }
    return json({ data: decodeRow(row) });
  }

  if (request.method === "DELETE") {
    const auth = await requireAdmin(request, env);
    if ("response" in auth) return auth.response;
    // মুছে ফেলার আগে স্টক ফেরত (idempotent — আগে ফেরত হয়ে থাকলে কিছুই হবে না)
    await syncOrderStock(env, id, false, "অর্ডার ডিলিট — স্টক ফেরত");
    await env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
    return json({ data: { success: true } });
  }


  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
