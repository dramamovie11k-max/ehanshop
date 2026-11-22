// জেনেরিক CRUD ফ্যাক্টরি — একই প্যাটার্নের টেবিলগুলোর জন্য রুট তৈরি সহজ করে।
// প্রতিটি রুট: CORS, এরর হ্যান্ডলিং, অনুমতি চেক ও কলাম হোয়াইটলিস্ট মেনে চলে।

import { withApi, json, errorJson } from "./cors";
import { requireStaff, requireAdmin, requireUser, getUser } from "./auth";
import { decodeRow, decodeRows, buildInsert, buildUpdate, newId } from "./db";
import type { PagesCtx, Env } from "./types";

export type Access = "public" | "user" | "staff" | "admin";

async function checkAccess(
  access: Access,
  request: Request,
  env: Env,
): Promise<{ user: any } | { response: Response } | null> {
  if (access === "public") return null;
  if (access === "user") return await requireUser(request, env);
  if (access === "staff") return await requireStaff(request, env);
  return await requireAdmin(request, env);
}

export interface CrudOptions {
  /** টেবিলের নাম */
  table: string;
  /** ক্লায়েন্ট যে কলামগুলো লিখতে পারবে */
  writable: string[];
  /** পড়ার অনুমতি (ডিফল্ট public) */
  readAccess?: Access;
  /** লেখার অনুমতি (ডিফল্ট staff) */
  writeAccess?: Access;
  /** ডিফল্ট সর্টিং */
  orderBy?: string;
  /** query param → SQL ফিল্টার */
  filters?: Record<string, string>;
  /** পাবলিক (নন-স্টাফ) রিকোয়েস্টে বাধ্যতামূলক শর্ত, যেমন is_published = 1 */
  publicWhere?: string;
  /** পাবলিক রেসপন্স থেকে বাদ দেওয়া কলাম */
  hideFromPublic?: string[];
}

/** কালেকশন রুট: GET (লিস্ট) + POST (নতুন) */
export function collectionRoute(opts: CrudOptions) {
  const {
    table, writable, readAccess = "public", writeAccess = "staff",
    orderBy = "created_at DESC", filters = {}, publicWhere, hideFromPublic = [],
  } = opts;

  return withApi(async ({ request, env }: PagesCtx) => {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const guard = await checkAccess(readAccess, request, env);
      if (guard && "response" in guard) return guard.response;

      const user = await getUser(request, env);
      const isStaff = user?.role === "admin" || user?.role === "moderator";

      const where: string[] = ["1=1"];
      const binds: (string | number)[] = [];
      if (publicWhere && !isStaff) where.push(publicWhere);
      for (const [param, column] of Object.entries(filters)) {
        const v = url.searchParams.get(param);
        if (v !== null) { where.push(`${column} = ?`); binds.push(v); }
      }

      const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);
      const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

      const { results } = await env.DB.prepare(
        `SELECT * FROM ${table} WHERE ${where.join(" AND ")}
         ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      ).bind(...binds, limit, offset).all();

      let rows = decodeRows(results);
      if (!isStaff && hideFromPublic.length) {
        rows = rows.map((r: any) => {
          const c = { ...r };
          for (const col of hideFromPublic) delete c[col];
          return c;
        });
      }
      return json({ data: rows });
    }

    if (request.method === "POST") {
      const guard = await checkAccess(writeAccess, request, env);
      if (guard && "response" in guard) return guard.response;

      const body = (await request.json()) as Record<string, unknown>;
      body.id = body.id || newId();
      const { sql, values } = buildInsert(table, body, writable);
      const row = await env.DB.prepare(sql).bind(...values).first();
      return json({ data: decodeRow(row) }, 201);
    }

    return errorJson("এই মেথড সাপোর্ট করে না", 405);
  });
}

/** আইটেম রুট: GET / PUT / DELETE (slug অথবা id — দুইভাবেই কাজ করে) */
export function itemRoute(opts: CrudOptions & { keyColumn?: string; param?: string }) {
  const {
    table, writable, readAccess = "public", writeAccess = "staff",
    keyColumn = "id", param = "id", publicWhere, hideFromPublic = [],
  } = opts;

  // slug-ভিত্তিক রুটেও অ্যাডমিন প্যানেল প্রায়ই id পাঠায় → দুটোই মেলানো হয়
  const matchSql = keyColumn === "id"
    ? "id = ?"
    : `(${keyColumn} = ? OR id = ?)`;
  const matchBinds = (key: string) => (keyColumn === "id" ? [key] : [key, key]);

  return withApi(async ({ request, env, params }: PagesCtx) => {
    const key = String((params as Record<string, string>)[param] ?? "");
    if (!key) return errorJson("আইডি প্রয়োজন", 400);

    if (request.method === "GET") {
      const guard = await checkAccess(readAccess, request, env);
      if (guard && "response" in guard) return guard.response;

      const user = await getUser(request, env);
      const isStaff = user?.role === "admin" || user?.role === "moderator";
      const extra = publicWhere && !isStaff ? ` AND ${publicWhere}` : "";
      const row = await env.DB.prepare(
        `SELECT * FROM ${table} WHERE ${matchSql}${extra} LIMIT 1`,
      ).bind(...matchBinds(key)).first();
      if (!row) return errorJson("পাওয়া যায়নি", 404);

      const decoded: any = decodeRow(row);
      if (!isStaff) for (const col of hideFromPublic) delete decoded[col];
      return json({ data: decoded });
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      const guard = await checkAccess(writeAccess, request, env);
      if (guard && "response" in guard) return guard.response;

      const existing = await env.DB.prepare(
        `SELECT id FROM ${table} WHERE ${matchSql} LIMIT 1`,
      ).bind(...matchBinds(key)).first<{ id: string }>();
      if (!existing) return errorJson("পাওয়া যায়নি", 404);

      const body = (await request.json()) as Record<string, unknown>;
      const built = buildUpdate(table, body, writable, "id");
      if (!built) return errorJson("আপডেট করার মতো কিছু নেই", 400);
      const row = await env.DB.prepare(built.sql).bind(...built.values, existing.id).first();
      return json({ data: decodeRow(row) });
    }

    if (request.method === "DELETE") {
      const guard = await checkAccess(writeAccess, request, env);
      if (guard && "response" in guard) return guard.response;
      const existing = await env.DB.prepare(
        `SELECT id FROM ${table} WHERE ${matchSql} LIMIT 1`,
      ).bind(...matchBinds(key)).first<{ id: string }>();
      if (!existing) return errorJson("পাওয়া যায়নি", 404);
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(existing.id).run();
      return json({ data: { success: true } });
    }

    return errorJson("এই মেথড সাপোর্ট করে না", 405);
  });
}

