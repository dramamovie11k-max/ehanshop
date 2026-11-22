// GET /api/client-ip — ভিজিটরের আইপি (Supabase edge function get-client-ip এর বদলে)
import { withApi, json } from "../_shared/cors";
import type { PagesCtx } from "../_shared/types";

export const onRequest = withApi(async ({ request }: PagesCtx) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("cf-connecting-ip") ||
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    request.headers.get("x-real-ip") ||
    "";
  return json({ ip });
});
