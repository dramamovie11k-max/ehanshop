// GET/POST /api/inventory/purchase-orders — ক্রয় অর্ডার (আইটেমসহ)
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import { decodeRows, decodeRow, buildInsert, newId } from "../../_shared/db";
import type { PagesCtx } from "../../_shared/types";

const PO_WRITABLE = [
  "id", "supplier_id", "status", "total_amount", "notes",
  "order_date", "received_date", "created_by",
];

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT po.*, s.name AS supplier_name FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       ORDER BY po.created_at DESC LIMIT 200`,
    ).all();
    const orders: any[] = decodeRows(results);
    // প্রতিটি অর্ডারের আইটেম যোগ করা
    for (const o of orders) {
      const { results: items } = await env.DB.prepare(
        "SELECT * FROM purchase_order_items WHERE purchase_order_id = ?",
      ).bind(o.id).all();
      o.items = decodeRows(items);
    }
    return json({ data: orders });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as Record<string, any>;
    const items: any[] = Array.isArray(body.items) ? body.items : [];
    body.id = body.id || newId();
    body.created_by = auth.user.id;
    body.total_amount = items.reduce(
      (s, i) => s + Number(i.unit_cost || 0) * Number(i.quantity || 0), 0,
    );

    const { sql, values } = buildInsert("purchase_orders", body, PO_WRITABLE);
    const row = await env.DB.prepare(sql).bind(...values).first<{ id: string }>();

    for (const it of items) {
      await env.DB.prepare(
        `INSERT INTO purchase_order_items
         (id, purchase_order_id, product_id, product_name, quantity, unit_cost, total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(), row!.id, it.product_id ?? null, it.product_name,
        Number(it.quantity), Number(it.unit_cost),
        Number(it.quantity) * Number(it.unit_cost),
      ).run();
    }
    return json({ data: decodeRow(row) }, 201);
  }

  return errorJson("এই মেথড সাপোর্ট করে না", 405);
});
