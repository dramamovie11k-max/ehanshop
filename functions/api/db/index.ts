// ============================================================
// জেনেরিক ডেটা API — ক্লায়েন্টের কোয়েরি বিল্ডার (src/lib/cf/client.ts) এই
// endpoint এ JSON কোয়েরি পাঠায়। PostgREST-এর মতো আচরণ, কিন্তু সম্পূর্ণ D1 ভিত্তিক।
//
// POST /api/db  { table, action, select, filters, order, limit, values, ... }
//
// নিরাপত্তা:
//  - প্রতিটি টেবিলের নীতি policies.ts এ নির্ধারিত (read/write/owner/hidden)
//  - কলামের নাম আসল স্কিমার সাথে মিলিয়ে যাচাই হয় (SQL ইনজেকশন অসম্ভব)
//  - সব মান প্যারামিটার হিসেবে বাইন্ড হয়
// ============================================================

import { withApi, json } from "../../_shared/cors";
import { getUser, type AuthUser } from "../../_shared/auth";
import { decodeRows, encodeValue, newId } from "../../_shared/db";
import { POLICIES, RELATIONS, type Access, type TablePolicy } from "../../_shared/policies";
import type { PagesCtx, Env } from "../../_shared/types";

/* ---------------- স্কিমা ইন্ট্রোস্পেকশন (কলাম যাচাইয়ের জন্য) ---------------- */
const columnCache = new Map<string, Set<string>>();

async function tableColumns(env: Env, table: string): Promise<Set<string>> {
  const cached = columnCache.get(table);
  if (cached) return cached;
  const { results } = await env.DB.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all<{ name: string }>();
  const cols = new Set((results || []).map((r) => r.name));
  if (cols.size) columnCache.set(table, cols);
  return cols;
}

/** কলাম-সেটটির উপর UNIQUE ইনডেক্স/প্রাইমারি কী আছে কিনা (ON CONFLICT ব্যবহারের শর্ত) */
const uniqueCache = new Map<string, string[][]>();
async function uniqueSets(env: Env, table: string): Promise<string[][]> {
  const cached = uniqueCache.get(table);
  if (cached) return cached;
  const sets: string[][] = [];
  const info = await env.DB.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all<any>();
  const pk = (info.results || []).filter((r: any) => r.pk > 0)
    .sort((a: any, b: any) => a.pk - b.pk).map((r: any) => r.name);
  if (pk.length) sets.push(pk);
  const idx = await env.DB.prepare(`PRAGMA index_list(${quoteIdent(table)})`).all<any>();
  for (const i of idx.results || []) {
    if (!i.unique) continue;
    const cols = await env.DB.prepare(`PRAGMA index_info(${quoteIdent(i.name)})`).all<any>();
    sets.push((cols.results || []).map((c: any) => c.name));
  }
  uniqueCache.set(table, sets);
  return sets;
}

async function hasUniqueIndex(env: Env, table: string, columns: string[]): Promise<boolean> {
  const target = [...columns].sort().join(",");
  return (await uniqueSets(env, table)).some((s) => [...s].sort().join(",") === target);
}

function quoteIdent(name: string): string {

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new ApiError(`অবৈধ নাম: ${name}`, "42601");
  return `"${name}"`;
}

class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "400", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/* ---------------- অনুমতি ---------------- */
function rank(a: Access): number {
  return { public: 0, user: 1, staff: 2, admin: 3, none: 9 }[a];
}

function userRank(user: AuthUser | null): number {
  if (!user) return 0;
  if (user.role === "admin") return 3;
  if (user.role === "moderator") return 2;
  return 1;
}

function assertAccess(need: Access, user: AuthUser | null) {
  if (need === "none") throw new ApiError("এই টেবিলে এই কাজ করা যাবে না", "42501", 403);
  if (rank(need) > userRank(user)) {
    throw new ApiError(user ? "এই কাজের অনুমতি নেই" : "লগইন প্রয়োজন", "42501", user ? 403 : 401);
  }
}

const isStaff = (u: AuthUser | null) => !!u && (u.role === "admin" || u.role === "moderator");

/* ---------------- select স্ট্রিং পার্স ---------------- */
interface ParsedSelect {
  columns: string[];              // "*" থাকলে খালি অ্যারে + all=true
  all: boolean;
  embeds: Array<{ name: string; select: string }>;
}

function parseSelect(input: string): ParsedSelect {
  const out: ParsedSelect = { columns: [], all: false, embeds: [] };
  let depth = 0, buf = "";
  const parts: string[] = [];
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(buf); buf = ""; } else buf += ch;
  }
  if (buf.trim()) parts.push(buf);

  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)$/.exec(part);
    if (m) out.embeds.push({ name: m[1], select: m[2].trim() || "*" });
    else if (part === "*") out.all = true;
    else out.columns.push(part.split(":").pop()!.trim());
  }
  return out;
}

/* ---------------- ফিল্টার → SQL ---------------- */
interface Filter { op: string; column?: string; value?: unknown; not?: boolean; expr?: string }

const OPS: Record<string, string> = {
  eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=",
  like: "LIKE", ilike: "LIKE",
};

function condFor(op: string, column: string, value: unknown, cols: Set<string>, binds: unknown[]): string {
  if (!cols.has(column)) throw new ApiError(`অজানা কলাম: ${column}`, "42703");
  const col = quoteIdent(column);
  if (op === "in") {
    const arr = Array.isArray(value) ? value : [];
    if (!arr.length) return "0 = 1";
    binds.push(...arr.map(encodeValue));
    return `${col} IN (${arr.map(() => "?").join(", ")})`;
  }
  if (op === "is") {
    if (value === null) return `${col} IS NULL`;
    binds.push(encodeValue(value));
    return `${col} IS ?`;
  }
  if (op === "ilike") {
    binds.push(String(value));
    return `LOWER(${col}) LIKE LOWER(?)`;
  }
  const sqlOp = OPS[op];
  if (!sqlOp) throw new ApiError(`অসমর্থিত ফিল্টার: ${op}`, "42601");
  binds.push(encodeValue(value));
  return `${col} ${sqlOp} ?`;
}

/** PostgREST স্টাইল or-স্ট্রিং: "a.eq.1,b.in.(x,y),c.ilike.%q%" */
function parseOr(expr: string, cols: Set<string>, binds: unknown[]): string {
  const parts: string[] = [];
  let depth = 0, buf = "";
  for (const ch of expr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(buf); buf = ""; } else buf += ch;
  }
  if (buf.trim()) parts.push(buf);

  const conds = parts.map((p) => {
    const seg = p.trim();
    const i1 = seg.indexOf(".");
    const i2 = seg.indexOf(".", i1 + 1);
    if (i1 < 0 || i2 < 0) throw new ApiError(`অবৈধ or ফিল্টার: ${seg}`, "42601");
    const column = seg.slice(0, i1);
    const op = seg.slice(i1 + 1, i2);
    let raw: unknown = seg.slice(i2 + 1);
    if (op === "in") {
      raw = String(raw).replace(/^\(|\)$/g, "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    } else if (raw === "null") {
      raw = null;
    }
    return condFor(op, column, raw, cols, binds);
  });
  return conds.length ? `(${conds.join(" OR ")})` : "1 = 1";
}

async function buildWhere(
  env: Env, table: string, filters: Filter[], binds: unknown[],
): Promise<string> {
  const cols = await tableColumns(env, table);
  const conds: string[] = [];
  for (const f of filters || []) {
    if (f.op === "or") {
      conds.push(parseOr(String(f.expr ?? f.value ?? ""), cols, binds));
      continue;
    }
    const c = condFor(f.op, String(f.column), f.value, cols, binds);
    conds.push(f.not ? `NOT (${c})` : c);
  }
  return conds.length ? `WHERE ${conds.join(" AND ")}` : "";
}

/* ---------------- সংবেদনশীল কলাম বাদ ---------------- */
function stripHidden(rows: any[], policy: TablePolicy, staff: boolean): any[] {
  if (staff || !policy.hidden?.length) return rows;
  return rows.map((r) => {
    const copy = { ...r };
    for (const h of policy.hidden!) delete copy[h];
    return copy;
  });
}

/* ---------------- embed লোড ---------------- */
async function loadEmbeds(
  env: Env, table: string, rows: any[], embeds: ParsedSelect["embeds"], user: AuthUser | null,
) {
  if (!rows.length || !embeds.length) return;
  const rels = RELATIONS[table] || {};
  for (const embed of embeds) {
    const rel = rels[embed.name];
    if (!rel) throw new ApiError(`এই সম্পর্ক সমর্থিত নয়: ${table}.${embed.name}`, "42P01");
    const childPolicy = POLICIES[rel.table];
    if (!childPolicy || rank(childPolicy.read) > userRank(user)) {
      rows.forEach((r) => { r[embed.name] = rel.type === "many" ? [] : null; });
      continue;
    }

    const parentKey = rel.type === "one" ? rel.fk : "id";
    const childKey = rel.type === "one" ? "id" : rel.fk;
    const ids = [...new Set(rows.map((r) => r[parentKey]).filter((v) => v !== null && v !== undefined))];
    if (!ids.length) {
      rows.forEach((r) => { r[embed.name] = rel.type === "many" ? [] : null; });
      continue;
    }

    const parsed = parseSelect(embed.select);
    const childCols = await tableColumns(env, rel.table);
    const cols = parsed.all
      ? "*"
      : [...new Set([childKey, ...parsed.columns])]
          .filter((c) => childCols.has(c)).map(quoteIdent).join(", ") || "*";

    const { results } = await env.DB.prepare(
      `SELECT ${cols} FROM ${quoteIdent(rel.table)}
       WHERE ${quoteIdent(childKey)} IN (${ids.map(() => "?").join(", ")})`,
    ).bind(...ids.map(encodeValue)).all();

    const childRows = stripHidden(decodeRows(results), childPolicy, isStaff(user));
    if (parsed.embeds.length) await loadEmbeds(env, rel.table, childRows, parsed.embeds, user);

    const grouped = new Map<unknown, any[]>();
    for (const c of childRows) {
      const k = (c as any)[childKey];
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(c);
    }
    for (const r of rows) {
      const match = grouped.get(r[parentKey]) || [];
      r[embed.name] = rel.type === "many" ? match : (match[0] ?? null);
    }
  }
}

/* ---------------- মূল হ্যান্ডলার ---------------- */
export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  if (request.method !== "POST") {
    return json({ data: null, error: { message: "শুধু POST সমর্থিত", code: "405" } }, 405);
  }

  const q = (await request.json()) as any;
  const user = await getUser(request, env);

  try {
    const table = String(q.table || "");
    const policy = POLICIES[table];
    if (!policy) throw new ApiError(`এই টেবিল ব্যবহার করা যাবে না: ${table}`, "42P01", 404);

    const action: string = q.action || "select";
    const staff = isStaff(user);
    const filters: Filter[] = Array.isArray(q.filters) ? [...q.filters] : [];

    // গেস্ট (লগইন ছাড়া) পড়ার বিশেষ অনুমতি আছে কিনা
    const guestLookup =
      action === "select" && !user && !!policy.guestRead &&
      filters.some((f) => f.op === "eq" && policy.guestRead!.requireFilterOn.includes(String(f.column)));

    // মালিকানা ফিল্টার — শুধু পড়া/আপডেট/ডিলিটে (insert আলাদাভাবে সামলানো হয়)
    if (policy.owner && !staff && action !== "insert" && action !== "upsert") {
      if (!user && !guestLookup) throw new ApiError("লগইন প্রয়োজন", "42501", 401);
      if (user) filters.push({ op: "eq", column: policy.owner, value: user.id });
    }
    if (policy.publicFilter && !staff && action === "select") {
      for (const [k, v] of Object.entries(policy.publicFilter)) {
        if (!filters.some((f) => f.column === k)) filters.push({ op: "eq", column: k, value: v });
      }
    }

    // গেস্ট লুকআপে সংবেদনশীল কলাম লুকানো হয়
    const effPolicy: TablePolicy = guestLookup
      ? { ...policy, hidden: [...(policy.hidden || []), ...(policy.guestRead?.hidden || [])] }
      : policy;

    const cols = await tableColumns(env, table);
    if (!cols.size) throw new ApiError(`টেবিল পাওয়া যায়নি: ${table}`, "42P01", 404);

    /* ---------- SELECT ---------- */
    if (action === "select") {
      if (!guestLookup) assertAccess(policy.read, user);

      const binds: unknown[] = [];
      const where = await buildWhere(env, table, filters, binds);

      if (q.head && q.count) {
        const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${quoteIdent(table)} ${where}`)
          .bind(...binds.map(encodeValue)).first<{ c: number }>();
        return json({ data: null, error: null, count: row?.c ?? 0 });
      }

      const parsed = parseSelect(String(q.select || "*"));
      const selectCols = parsed.all || !parsed.columns.length
        ? "*"
        : [...new Set(parsed.columns.filter((c) => cols.has(c)))].map(quoteIdent).join(", ") || "*";

      const orderSql = (q.order || [])
        .filter((o: any) => cols.has(o.column))
        .map((o: any) => `${quoteIdent(o.column)} ${o.ascending === false ? "DESC" : "ASC"}`)
        .join(", ");

      let sql = `SELECT ${selectCols} FROM ${quoteIdent(table)} ${where}`;
      if (orderSql) sql += ` ORDER BY ${orderSql}`;
      if (q.single || q.maybeSingle) sql += " LIMIT 2";
      else if (q.limit) sql += ` LIMIT ${Number(q.limit) | 0}`;
      if (q.offset) sql += ` OFFSET ${Number(q.offset) | 0}`;

      const { results } = await env.DB.prepare(sql).bind(...binds.map(encodeValue)).all();
      let rows = stripHidden(decodeRows(results), effPolicy, staff);
      await loadEmbeds(env, table, rows, parsed.embeds, user);

      let count: number | null = null;
      if (q.count) {
        const cBinds: unknown[] = [];
        const cWhere = await buildWhere(env, table, filters, cBinds);
        const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${quoteIdent(table)} ${cWhere}`)
          .bind(...cBinds.map(encodeValue)).first<{ c: number }>();
        count = row?.c ?? 0;
      }

      if (q.single || q.maybeSingle) {
        if (rows.length > 1) throw new ApiError("একাধিক রো পাওয়া গেছে", "PGRST116");
        if (!rows.length && q.single) throw new ApiError("কোনো রো পাওয়া যায়নি", "PGRST116", 406);
        return json({ data: rows[0] ?? null, error: null, count });
      }
      return json({ data: rows, error: null, count });
    }

    /* ---------- INSERT / UPSERT ---------- */
    if (action === "insert" || action === "upsert") {
      assertAccess(policy.write, user);
      const list: any[] = Array.isArray(q.values) ? q.values : [q.values || {}];
      const out: any[] = [];

      // গেস্ট চেকআউট: ব্লক করা ফোন/IP থেকে অর্ডার আটকানো
      if (table === "orders" && !staff) {
        const ip = request.headers.get("cf-connecting-ip")
          || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          || null;
        for (const item of list) {
          const phone = item?.customer_phone ? String(item.customer_phone) : null;
          if (!phone && !ip) continue;
          const blocked = await env.DB.prepare(
            `SELECT id FROM blocked_users
             WHERE ((? IS NOT NULL AND phone = ?)
                 OR (? IS NOT NULL AND ip_address IS NOT NULL AND ip_address != '' AND ip_address = ?))
               AND (blocked_until IS NULL OR blocked_until = ''
                    OR datetime(replace(replace(blocked_until, 'T', ' '), 'Z', '')) > datetime('now'))
             LIMIT 1`,
          ).bind(phone, phone, ip, ip).first();
          if (blocked) throw new ApiError("এই নম্বর থেকে অর্ডার করা সম্ভব নয়", "42501", 403);
        }
      }

      // স্পিন কুপন: পাবলিক ইনসার্টে ডিসকাউন্ট মান অবশ্যই সক্রিয় অফার থেকেই আসতে হবে
      if (table === "spin_entries" && !staff) {
        for (const item of list) {
          const offer = item?.offer_id
            ? await env.DB.prepare(
                `SELECT discount_type, discount_value, offer_text FROM spin_offers
                  WHERE id = ? AND is_active = 1`,
              ).bind(String(item.offer_id)).first<any>()
            : null;
          if (!offer) throw new ApiError("সঠিক স্পিন অফার প্রয়োজন", "42501", 403);
          item.discount_type = offer.discount_type;
          item.discount_value = offer.discount_value;
          item.offer_text = offer.offer_text;
          item.is_used = 0;
          delete item.used_order_id;
        }
      }


      const conflictCols = action === "upsert"
        ? String(q.onConflict || "id").split(",").map((s) => s.trim()).filter((c) => cols.has(c))
        : [];
      // ON CONFLICT শুধু তখনই কাজ করে যখন কলামগুলোতে UNIQUE ইনডেক্স আছে।
      // না থাকলে SQLite এরর দেয় — তাই ম্যানুয়াল update-then-insert ফলব্যাক।
      const conflictIsUnique = conflictCols.length
        ? await hasUniqueIndex(env, table, conflictCols)
        : false;

      for (const item of list) {
        const data: Record<string, unknown> = { ...item };
        if (policy.owner && !staff && user) data[policy.owner] = user.id;
        if (policy.owner && user && data[policy.owner] === undefined) data[policy.owner] = user.id;

        // ফলব্যাক upsert: আগে ম্যাচিং রো আপডেটের চেষ্টা
        if (action === "upsert" && conflictCols.length && !conflictIsUnique) {
          const setCols = Object.keys(data).filter(
            (c) => cols.has(c) && data[c] !== undefined && !conflictCols.includes(c) && c !== "id",
          );
          if (setCols.length && conflictCols.every((c) => data[c] !== undefined && data[c] !== null)) {
            const uBinds = [
              ...setCols.map((c) => encodeValue(data[c])),
              ...conflictCols.map((c) => encodeValue(data[c])),
            ];
            const updated = await env.DB.prepare(
              `UPDATE ${quoteIdent(table)} SET ${setCols.map((c) => `${quoteIdent(c)} = ?`).join(", ")}
               WHERE ${conflictCols.map((c) => `${quoteIdent(c)} = ?`).join(" AND ")} RETURNING *`,
            ).bind(...uBinds).all();
            if (updated.results?.length) {
              out.push(...updated.results);
              continue;
            }
          }
        }

        if (cols.has("id") && data.id === undefined) data.id = newId();

        const useCols = Object.keys(data).filter((c) => cols.has(c) && data[c] !== undefined);
        if (!useCols.length) throw new ApiError("লেখার মতো কোনো বৈধ কলাম নেই", "42703");
        const binds = useCols.map((c) => encodeValue(data[c]));

        let sql = `INSERT INTO ${quoteIdent(table)} (${useCols.map(quoteIdent).join(", ")})
                   VALUES (${useCols.map(() => "?").join(", ")})`;
        if (action === "upsert") {
          const conflict = conflictIsUnique ? conflictCols : [];
          const updates = useCols.filter((c) => !conflict.includes(c));
          sql += conflict.length && updates.length
            ? ` ON CONFLICT(${conflict.map(quoteIdent).join(", ")}) DO UPDATE SET ${
                updates.map((c) => `${quoteIdent(c)} = excluded.${quoteIdent(c)}`).join(", ")}`
            : " ON CONFLICT DO NOTHING";
        }
        sql += " RETURNING *";
        const row = await env.DB.prepare(sql).bind(...binds).first();
        if (row) out.push(row);
      }


      const rows = stripHidden(decodeRows(out), policy, staff);
      if (q.returning === false) return json({ data: null, error: null });
      if (q.single || q.maybeSingle) return json({ data: rows[0] ?? null, error: null });
      return json({ data: rows, error: null });
    }

    /* ---------- UPDATE ---------- */
    if (action === "update") {
      assertAccess(policy.write, user);
      const data: Record<string, unknown> = { ...(q.values || {}) };
      if (policy.owner && !staff) delete data[policy.owner];

      // স্পিন কুপন: পাবলিক আপডেটে শুধু "ব্যবহৃত" চিহ্নিত করা যাবে (আনডু নয়)
      if (table === "spin_entries" && !staff) {
        const usedOrder = data.used_order_id;
        for (const key of Object.keys(data)) delete data[key];
        data.is_used = 1;
        data.status = "used";
        if (usedOrder) data.used_order_id = usedOrder;
        filters.push({ op: "eq", column: "is_used", value: 0 });
      }

      const setCols = Object.keys(data).filter((c) => cols.has(c) && data[c] !== undefined);
      if (!setCols.length) throw new ApiError("আপডেট করার মতো কিছু নেই", "42703");

      const binds: unknown[] = setCols.map((c) => encodeValue(data[c]));
      const where = await buildWhere(env, table, filters, binds);
      if (!where) throw new ApiError("আপডেটের জন্য ফিল্টার আবশ্যক", "42601");

      const sql = `UPDATE ${quoteIdent(table)} SET ${setCols.map((c) => `${quoteIdent(c)} = ?`).join(", ")}
                   ${where} RETURNING *`;
      const { results } = await env.DB.prepare(sql).bind(...binds.map(encodeValue)).all();
      const rows = stripHidden(decodeRows(results), policy, staff);
      if (q.single || q.maybeSingle) return json({ data: rows[0] ?? null, error: null });
      return json({ data: q.returning === false ? null : rows, error: null });
    }

    /* ---------- DELETE ---------- */
    if (action === "delete") {
      assertAccess(policy.write, user);
      const binds: unknown[] = [];
      const where = await buildWhere(env, table, filters, binds);
      if (!where) throw new ApiError("ডিলিটের জন্য ফিল্টার আবশ্যক", "42601");
      const { results } = await env.DB.prepare(
        `DELETE FROM ${quoteIdent(table)} ${where} RETURNING *`,
      ).bind(...binds.map(encodeValue)).all();
      const rows = stripHidden(decodeRows(results), policy, staff);
      if (q.single || q.maybeSingle) return json({ data: rows[0] ?? null, error: null });
      return json({ data: q.returning === false ? null : rows, error: null });
    }

    throw new ApiError(`অজানা অ্যাকশন: ${action}`, "42601");
  } catch (err) {
    const message = err instanceof Error ? err.message : "অজানা ত্রুটি";
    let code = err instanceof ApiError ? err.code : "500";
    const status = err instanceof ApiError ? err.status : 500;
    // SQLite ইউনিক ভায়োলেশন → Postgres কোড (ক্লায়েন্ট 23505 চেক করে)
    if (/UNIQUE constraint failed/i.test(message)) code = "23505";
    if (/FOREIGN KEY constraint failed/i.test(message)) code = "23503";
    return json({ data: null, error: { message, code, details: null, hint: null } }, status);
  }
});
