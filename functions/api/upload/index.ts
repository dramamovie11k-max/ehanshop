// POST   /api/upload — R2 তে ফাইল আপলোড (multipart/form-data, field: file)
// DELETE /api/upload?key=... — R2 থেকে ফাইল মুছে ফেলা
// শুধু স্টাফ ব্যবহার করতে পারবে।

import { withApi, json, errorJson } from "../../_shared/cors";
import { requireStaff } from "../../_shared/auth";
import type { PagesCtx } from "../../_shared/types";

const MAX_BYTES = 10 * 1024 * 1024; // ১০ MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-").slice(-80);
}

export const onRequest = withApi(async ({ request, env }: PagesCtx) => {
  const auth = await requireStaff(request, env);
  if ("response" in auth) return auth.response;
  if (!env.BUCKET) return errorJson("R2 বাকেট কনফিগার করা নেই", 500);

  if (request.method === "DELETE") {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return errorJson("key প্রয়োজন", 400);
    await env.BUCKET.delete(key);
    return json({ data: { success: true } });
  }

  if (request.method !== "POST") return errorJson("এই মেথড সাপোর্ট করে না", 405);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return errorJson("file ফিল্ড আবশ্যক", 400);
  if (file.size > MAX_BYTES) return errorJson("ফাইলের সাইজ ১০ MB এর বেশি হতে পারবে না", 400);
  if (!ALLOWED.includes(file.type)) return errorJson("শুধু ছবি আপলোড করা যাবে", 400);

  // ক্লায়েন্ট নির্দিষ্ট key দিলে সেটি স্যানিটাইজ করে ব্যবহার করা হয়,
  // না দিলে ফোল্ডার + সময় দিয়ে key তৈরি হয়।
  const wanted = String(form.get("key") || "").trim();
  const key = wanted
    ? wanted.split("/").filter(Boolean).map(safeName).join("/").replace(/\.\.+/g, ".")
    : `${safeName(String(form.get("folder") || "uploads")).replace(/\.+/g, "")}/${
        Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;


  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });

  const base = (env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  return json({ data: { key, url: base ? `${base}/${key}` : `/api/files/${key}` } }, 201);
});
