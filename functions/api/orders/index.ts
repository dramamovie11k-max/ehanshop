// GET  /api/orders — স্টাফ হলে সব অর্ডার, সাধারণ ইউজার হলে শুধু নিজের
// POST /api/orders — নতুন অর্ডার (গেস্টও পারবে, ক্যাশ অন ডেলিভারি)

import { withApi, json, errorJson } from "../../_shared/cors";
import { getUser, requireUser } from "../../_shared/auth";
import { decodeRows, decodeRow, newId, encodeValue } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

interface OrderItemInput {
  product_id?: string;
  product_name: string;
  product_price: number;
  quantity: number;
  variation_id?: string;
  variation_name?: string;
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const url = new URL(request.url);

  // ---------------- অর্ডার লিস্ট ----------------
  if (request.method === "GET") {
    const auth = await requireUser(request, env);
    if ("response" in auth) return auth.response;
    const { user } = auth;

    const isStaff = user.role === "admin" || user.role === "moderator";
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
    const status = url.searchParams.get("status");

    const where: string[] = [];
    const binds: (string | number)[] = [];
    if (!isStaff) { where.push("user_id = ?"); binds.push(user.id); }  // নিজের অর্ডারই দেখবে
    if (status) { where.push("status = ?"); binds.push(status); }

    const { results } = await env.DB.prepare(
      `SELECT * FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...binds, limit, offset).all();

    const orders = decodeRows<{ id: string }>(results);
    // প্রতিটি অর্ডারের আইটেম একবারেই আনা হয়
    if (orders.length) {
      const ph = orders.map(() => "?").join(",");
      const { results: items } = await env.DB.prepare(
        `SELECT * FROM order_items WHERE order_id IN (${ph})`,
      ).bind(...orders.map((o) => o.id)).all();
      const byOrder = new Map<string, unknown[]>();
      for (const it of decodeRows<{ order_id: string }>(items)) {
        if (!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
        byOrder.get(it.order_id)!.push(it);
      }
      orders.forEach((o: any) => { o.order_items = byOrder.get(o.id) || []; });
    }

    return json({ data: orders });
  }

  // ---------------- নতুন অর্ডার ----------------
  if (request.method === "POST") {
    const user = await getUser(request, env);   // গেস্ট অর্ডার অনুমোদিত → null হতে পারে
    const body = (await request.json()) as Record<string, any>;

    const required = ["customer_name", "customer_phone", "customer_address", "customer_city"];
    for (const f of required) {
      if (!body[f] || String(body[f]).trim() === "") {
        return errorJson(`${f} আবশ্যক`, 400);
      }
    }
    const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) return errorJson("অন্তত একটি প্রোডাক্ট থাকতে হবে", 400);

    // price / unit_price নামেও আসতে পারে — সবগুলো এক ফরম্যাটে আনা হয়
    const items: OrderItemInput[] = rawItems.map((i) => ({
      ...i,
      product_name: i.product_name ?? i.name ?? "",
      product_price: Number(i.product_price ?? i.price ?? i.unit_price ?? NaN),
      quantity: Number(i.quantity || 1),
    }));
    for (const i of items) {
      if (!i.product_name) return errorJson("প্রতিটি আইটেমে product_name আবশ্যক", 400);
      if (!Number.isFinite(i.product_price)) return errorJson("প্রতিটি আইটেমে product_price আবশ্যক", 400);
    }

    const ip = request.headers.get("cf-connecting-ip")
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || null;

    // ব্লক-লিস্ট চেক (ফোন বা IP)
    const blocked = await env.DB.prepare(
      `SELECT id FROM blocked_users
       WHERE (phone = ? OR (ip_address IS NOT NULL AND ip_address != '' AND ip_address = ?))
         AND (blocked_until IS NULL OR blocked_until = ''
              OR datetime(replace(replace(blocked_until, 'T', ' '), 'Z', '')) > datetime('now'))
       LIMIT 1`,
    ).bind(body.customer_phone, ip).first();
    if (blocked) return errorJson("এই নম্বর থেকে অর্ডার করা সম্ভব নয়", 403);

    // সার্ভার-সাইডে মোট হিসাব — ক্লায়েন্টের পাঠানো total/discount বিশ্বাস করা হয় না
    const subtotal = items.reduce(
      (s, i) => s + Number(i.product_price || 0) * Number(i.quantity || 1), 0,
    );
    let shipping = Number(body.shipping_cost ?? 60);
    if (!Number.isFinite(shipping) || shipping < 0) shipping = 0;

    // কুপন যাচাই — সার্ভার সাইডে (একই কুপন দুইবার ব্যবহার করা যাবে না)
    let discount = 0;
    let couponCode: string | null = null;
    const rawCoupon = String(body.coupon_code || "").trim().toUpperCase();
    if (rawCoupon) {
      const entry = await env.DB.prepare(
        `SELECT coupon_code, discount_type, discount_value, is_used
           FROM spin_entries WHERE coupon_code = ?`,
      ).bind(rawCoupon).first<{
        coupon_code: string; discount_type: string; discount_value: number; is_used: number;
      }>();
      if (!entry) return errorJson("কুপন কোডটি সঠিক নয়", 400);
      if (entry.is_used) return errorJson("এই কুপন আগেই ব্যবহার হয়েছে", 400);

      couponCode = entry.coupon_code;
      const value = Number(entry.discount_value || 0);
      if (entry.discount_type === "percentage") {
        discount = Math.round(subtotal * (value / 100));
      } else if (entry.discount_type === "free_shipping") {
        discount = 0;
        shipping = 0;
      } else {
        discount = value;
      }
      discount = Math.max(0, Math.min(discount, subtotal));
    }

    const total = Math.max(subtotal + shipping - discount, 0);

    const orderId = newId();
    const stmts = [
      env.DB.prepare(
        `INSERT INTO orders (id, user_id, customer_name, customer_phone, customer_address,
           customer_city, customer_ip, total_amount, shipping_cost, status, payment_method,
           notes, order_source, coupon_code, coupon_discount, purchase_event_id,
           tracking_data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        orderId, user?.id ?? null, body.customer_name, body.customer_phone,
        body.customer_address, body.customer_city, ip, total, shipping,
        "pending", body.payment_method || "cod", body.notes ?? null,
        body.order_source || "direct", couponCode, discount,
        body.purchase_event_id ?? null,
        body.tracking_data == null ? null : JSON.stringify(body.tracking_data),
      ),
      ...items.map((i) =>
        env.DB.prepare(
          `INSERT INTO order_items (id, order_id, product_id, product_name,
             product_price, quantity, variation_id, variation_name)
           VALUES (?,?,?,?,?,?,?,?)`,
        ).bind(
          newId(), orderId, i.product_id ?? null, i.product_name,
          Number(i.product_price), Number(i.quantity || 1),
          i.variation_id ?? null, i.variation_name ?? null,
        ),
      ),
      env.DB.prepare(
        `INSERT INTO order_logs (id, order_id, action, new_status, notes)
         VALUES (?,?,?,?,?)`,
      ).bind(newId(), orderId, "created", "pending", "নতুন অর্ডার তৈরি হয়েছে"),
    ];

    // কুপন ব্যবহৃত হিসেবে চিহ্নিত (শুধু তখনই, যদি এখনো ব্যবহার না হয়ে থাকে)
    if (couponCode) {
      stmts.push(
        env.DB.prepare(
          `UPDATE spin_entries SET is_used = 1, used_order_id = ?, status = 'used'
            WHERE coupon_code = ? AND is_used = 0`,
        ).bind(orderId, couponCode),
      );
    }


    await env.DB.batch(stmts);   // ট্রানজেকশন হিসেবে একসাথে চলে

    const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
      .bind(orderId).first();
    return json({ data: decodeRow(order) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
