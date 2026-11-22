// site_settings টেবিল থেকে কনফিগ পড়ার হেল্পার
import type { Env } from "./types";

export async function getSettings(env: Env, keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const { results } = await env.DB.prepare(
    `SELECT setting_key, setting_value FROM site_settings
     WHERE setting_key IN (${keys.map(() => "?").join(",")})`,
  ).bind(...keys).all<{ setting_key: string; setting_value: string | null }>();
  const cfg: Record<string, string> = {};
  for (const r of results || []) cfg[r.setting_key] = r.setting_value || "";
  return cfg;
}

/** PII হ্যাশ করা (lowercase + trim → SHA-256 hex) */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** রিকোয়েস্ট থেকে ভিজিটরের আইপি */
export function clientIp(request: Request): string | undefined {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined
  );
}
