// D1 হেল্পার — SQLite ↔ অ্যাপের ডেটা টাইপ রূপান্তর
// SQLite-এ boolean/array/json নেই, তাই রো পড়ার সময় সেগুলো ডিকোড করতে হয়।

/** JSON হিসেবে সেভ হওয়া কলামগুলোর তালিকা (টেবিল অনুযায়ী) */
const JSON_COLUMNS = new Set([
  "images", "review_images", "sections", "cart_data", "courier_ratio_data",
  "tracking_data", "data", "hero_images", "multi_products", "config",
]);

/** boolean হিসেবে ব্যবহৃত INTEGER কলাম */
const BOOL_COLUMNS = new Set([
  "is_featured", "is_new", "free_shipping", "has_variations", "is_default",
  "is_approved", "is_published", "is_active", "is_used", "is_duplicate_blocked",
  "show_multi_products", "allow_multi_select",
]);

/** D1 রো → অ্যাপ অবজেক্ট (JSON parse + 0/1 → boolean) */
export function decodeRow<T = any>(row: any): T {
  if (!row) return row;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (JSON_COLUMNS.has(k) && typeof v === "string") {
      try { out[k] = JSON.parse(v); } catch { out[k] = v; }
    } else if (BOOL_COLUMNS.has(k) && (v === 0 || v === 1)) {
      out[k] = v === 1;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function decodeRows<T = any>(rows: any[] | undefined): T[] {
  return (rows || []).map((r) => decodeRow<T>(r));
}

/** অ্যাপ অবজেক্ট → D1 এ লেখার উপযোগী মান (array/object → JSON, boolean → 0/1) */
export function encodeValue(v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "number") return v;
  return String(v);
}

/** নতুন UUID (SQLite-এ gen_random_uuid() নেই) */
export function newId(): string {
  return crypto.randomUUID();
}

/** ISO টাইমস্ট্যাম্প */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * অবজেক্ট থেকে নিরাপদ INSERT তৈরি — শুধু allowed কলামগুলো নেওয়া হয়
 * (ক্লায়েন্ট ইচ্ছেমতো কলাম পাঠাতে পারবে না)
 */
export function buildInsert(
  table: string,
  data: Record<string, unknown>,
  allowed: string[],
): { sql: string; values: (string | number | null)[] } {
  const cols: string[] = [];
  const values: (string | number | null)[] = [];
  for (const col of allowed) {
    if (data[col] !== undefined) {
      cols.push(col);
      values.push(encodeValue(data[col]));
    }
  }
  const sql = `INSERT INTO ${table} (${cols.join(", ")})
               VALUES (${cols.map(() => "?").join(", ")}) RETURNING *`;
  return { sql, values };
}

/** নিরাপদ UPDATE তৈরি */
export function buildUpdate(
  table: string,
  data: Record<string, unknown>,
  allowed: string[],
  idColumn = "id",
): { sql: string; values: (string | number | null)[] } | null {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  for (const col of allowed) {
    if (data[col] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(encodeValue(data[col]));
    }
  }
  if (!sets.length) return null;
  return {
    sql: `UPDATE ${table} SET ${sets.join(", ")} WHERE ${idColumn} = ? RETURNING *`,
    values,
  };
}
