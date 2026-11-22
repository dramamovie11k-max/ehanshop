// GET /api/files/<key> — R2 ফাইল সার্ভ করা (পাবলিক রিড, R2 কাস্টম ডোমেইন না থাকলে)
import { corsHeaders, errorJson } from "../../_shared/cors";
import type { PagesCtx } from "../../_shared/types";

export const onRequest = async ({ request, env, params }: PagesCtx) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "GET") return errorJson("এই মেথড সাপোর্ট করে না", 405);
  if (!env.BUCKET) return errorJson("R2 বাকেট কনফিগার করা নেই", 500);

  const raw = (params as Record<string, string | string[]>).path;
  const key = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  if (!key) return errorJson("ফাইল পাওয়া যায়নি", 404);

  const object = await env.BUCKET.get(key);
  if (!object) return errorJson("ফাইল পাওয়া যায়নি", 404);

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
};
