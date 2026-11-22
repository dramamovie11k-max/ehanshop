// ============================================================
// PostgREST-সদৃশ কোয়েরি বিল্ডার — সব কল /api/db (Cloudflare D1) এ যায়।
// .from("products").select("*, categories(*)").eq("id", id).single() ইত্যাদি
// আগের মতোই কাজ করে, শুধু ব্যাকএন্ড এখন সম্পূর্ণ Cloudflare।
// ============================================================

import { cfAuth } from "./auth";

export interface PostgrestError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface QueryResult<T = any> {
  data: T;
  error: PostgrestError | null;
  count: number | null;
  status: number;
}

interface Filter { op: string; column?: string; value?: unknown; not?: boolean; expr?: string }

interface QueryState {
  table: string;
  action: "select" | "insert" | "update" | "upsert" | "delete";
  select: string;
  filters: Filter[];
  order: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  offset?: number;
  values?: unknown;
  onConflict?: string;
  count?: "exact";
  head?: boolean;
  single?: boolean;
  maybeSingle?: boolean;
  returning: boolean;
}

async function runQuery(state: QueryState): Promise<QueryResult> {
  const singleish = state.single || state.maybeSingle;
  const isListSelect = state.action === "select" && !singleish;

  try {
    const token = await cfAuth.accessToken();
    const res = await fetch("/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(state),
    });
    const body = await res.json().catch(() => ({}));
    const err =
      body?.error ??
      (res.ok
        ? null
        : {
            message: `API ত্রুটি (${res.status})`,
            code: String(res.status),
            details: null,
            hint: null,
          });
    // নন-single সিলেক্টে সবসময় অ্যারে — null হলে UI ক্র্যাশ করে
    const data = body?.data ?? (isListSelect ? [] : null);
    return {
      data,
      error: err,
      count: body?.count ?? null,
      status: res.status,
    };

  } catch (err) {
    return {
      data: isListSelect ? [] : null,
      error: {
        message: err instanceof Error ? err.message : "নেটওয়ার্ক ত্রুটি",
        code: "NETWORK",
        details: null,
        hint: null,
      },
      count: null,
      status: 0,
    };
  }
}

class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private state: QueryState;

  constructor(table: string) {
    this.state = {
      table, action: "select", select: "*", filters: [], order: [], returning: true,
    };
  }

  /* ---------- অ্যাকশন ---------- */
  select(columns = "*", opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    this.state.select = columns || "*";
    if (this.state.action !== "select") this.state.returning = true;
    if (opts?.count) this.state.count = "exact";
    if (opts?.head) this.state.head = true;
    return this;
  }

  insert(values: unknown) {
    this.state.action = "insert";
    this.state.values = values;
    this.state.returning = false;
    return this;
  }

  upsert(values: unknown, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.state.action = "upsert";
    this.state.values = values;
    this.state.onConflict = opts?.onConflict;
    this.state.returning = false;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.state.action = "update";
    this.state.values = values;
    this.state.returning = false;
    return this;
  }

  delete() {
    this.state.action = "delete";
    this.state.returning = false;
    return this;
  }

  /* ---------- ফিল্টার ---------- */
  private add(op: string, column: string, value: unknown, not = false) {
    this.state.filters.push({ op, column, value, not });
    return this;
  }

  eq(c: string, v: unknown) { return this.add("eq", c, v); }
  neq(c: string, v: unknown) { return this.add("neq", c, v); }
  gt(c: string, v: unknown) { return this.add("gt", c, v); }
  gte(c: string, v: unknown) { return this.add("gte", c, v); }
  lt(c: string, v: unknown) { return this.add("lt", c, v); }
  lte(c: string, v: unknown) { return this.add("lte", c, v); }
  like(c: string, v: string) { return this.add("like", c, v); }
  ilike(c: string, v: string) { return this.add("ilike", c, v); }
  in(c: string, v: unknown[]) { return this.add("in", c, v); }
  is(c: string, v: unknown) { return this.add("is", c, v); }
  not(c: string, op: string, v: unknown) { return this.add(op, c, v, true); }
  or(expr: string) { this.state.filters.push({ op: "or", expr }); return this; }
  match(obj: Record<string, unknown>) {
    for (const [k, v] of Object.entries(obj)) this.add("eq", k, v);
    return this;
  }

  /* ---------- মডিফায়ার ---------- */
  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.state.order.push({ column, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.state.limit = n; return this; }
  range(from: number, to: number) {
    this.state.offset = from;
    this.state.limit = to - from + 1;
    return this;
  }
  single() { this.state.single = true; return this as unknown as QueryBuilder<T>; }
  maybeSingle() { this.state.maybeSingle = true; return this as unknown as QueryBuilder<T>; }

  /* ---------- এক্সিকিউশন ---------- */
  then<R1 = QueryResult<T>, R2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return runQuery(this.state).then(onfulfilled as any, onrejected as any);
  }

  catch(onrejected: (reason: unknown) => unknown) {
    return (runQuery(this.state) as Promise<QueryResult<T>>).catch(onrejected);
  }

  finally(cb: () => void) {
    return (runQuery(this.state) as Promise<QueryResult<T>>).finally(cb);
  }
}

export function from<T = any>(table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(table);
}

export type { QueryBuilder };
