// CORS হেডার ও সাধারণ রেসপন্স হেল্পার — সব API route এ ব্যবহৃত হয়

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey, x-requested-with",
  "Access-Control-Max-Age": "86400",
};

/** OPTIONS (preflight) রিকোয়েস্টের উত্তর */
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** সফল JSON রেসপন্স */
export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

/** এরর রেসপন্স — সবসময় CORS হেডারসহ */
export function errorJson(message: string, status = 500, details?: unknown): Response {
  // সার্ভার লগে বিস্তারিত রাখি, ক্লায়েন্টকে শুধু বার্তা পাঠাই
  if (status >= 500) console.error("[API ERROR]", message, details ?? "");
  return json({ error: message, ...(status < 500 && details ? { details } : {}) }, status);
}

/** যেকোনো হ্যান্ডলারকে try/catch + OPTIONS হ্যান্ডলিং দিয়ে মুড়ে দেয় */
export function withApi<T>(
  handler: (ctx: T & { request: Request }) => Promise<Response>,
) {
  return async (ctx: T & { request: Request }): Promise<Response> => {
    if (ctx.request.method === "OPTIONS") return handleOptions();
    try {
      return await handler(ctx);
    } catch (err) {
      return errorJson(
        err instanceof Error ? err.message : "অজানা সার্ভার ত্রুটি",
        500,
        err,
      );
    }
  };
}
