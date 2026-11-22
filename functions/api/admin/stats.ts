// GET /api/admin/stats — অ্যাডমিন ড্যাশবোর্ডের সারসংক্ষেপ (শুধু স্টাফ)
import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import type { PagesCtx } from "../../_shared/types";

async function count(env: any, sql: string, ...bind: unknown[]) {
  const row = await env.DB.prepare(sql).bind(...bind).first<{ c: number }>();
  return Number(row?.c ?? 0);
}

async function sum(env: any, sql: string, ...bind: unknown[]) {
  const row = await env.DB.prepare(sql).bind(...bind).first<{ s: number }>();
  return Number(row?.s ?? 0);
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "GET") return errorJson("এই মেথড সাপোর্ট করে না", 405);
  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;

  const paid = "status NOT IN ('cancelled','returned')";

  const [
    totalOrders, totalProducts, pendingOrders, blockedUsers,
    todayOrders, weekOrders, monthOrders,
    todayRevenue, weekRevenue, monthRevenue,
  ] = await Promise.all([
    count(env, "SELECT COUNT(*) AS c FROM orders"),
    count(env, "SELECT COUNT(*) AS c FROM products"),
    count(env, "SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'"),
    count(env, "SELECT COUNT(*) AS c FROM blocked_users"),
    count(env, "SELECT COUNT(*) AS c FROM orders WHERE date(created_at) = date('now')"),
    count(env, "SELECT COUNT(*) AS c FROM orders WHERE created_at >= datetime('now','-7 days')"),
    count(env, "SELECT COUNT(*) AS c FROM orders WHERE created_at >= datetime('now','-30 days')"),
    sum(env, `SELECT COALESCE(SUM(total_amount),0) AS s FROM orders WHERE ${paid} AND date(created_at) = date('now')`),
    sum(env, `SELECT COALESCE(SUM(total_amount),0) AS s FROM orders WHERE ${paid} AND created_at >= datetime('now','-7 days')`),
    sum(env, `SELECT COALESCE(SUM(total_amount),0) AS s FROM orders WHERE ${paid} AND created_at >= datetime('now','-30 days')`),
  ]);

  return json({
    data: {
      totalOrders, totalProducts, pendingOrders, blockedUsers,
      todayOrders, weekOrders, monthOrders,
      todayRevenue, weekRevenue, monthRevenue,
    },
  });
});
