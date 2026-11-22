// নিজস্ব HS256 JWT — সাইন ও ভেরিফাই (Web Crypto, Cloudflare Workers এ চলে)
// সিক্রেট: env.AUTH_JWT_SECRET

const enc = new TextEncoder();

export function b64uEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64uDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [k: string]: unknown;
}

/** JWT তৈরি — expiresInSec ডিফল্ট ১ ঘণ্টা */
export async function signJwt(payload: JwtPayload, secret: string, expiresInSec = 3600): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const head = b64uEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const data = `${head}.${b64uEncode(enc.encode(JSON.stringify(body)))}`;
  const key = await hmacKey(secret, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return `${data}.${b64uEncode(sig)}`;
}

/** JWT যাচাই — বৈধ হলে payload, নয়তো null */
export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const key = await hmacKey(secret, ["verify"]);
  const ok = await crypto.subtle.verify(
    "HMAC", key, b64uDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64uDecode(parts[1]))) as JwtPayload;
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** টোকেনের SHA-256 হ্যাশ (রিফ্রেশ/রিসেট টোকেন ডেটাবেসে হ্যাশ আকারে রাখি) */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return b64uEncode(new Uint8Array(digest));
}

/** র‍্যান্ডম নিরাপদ টোকেন */
export function randomToken(bytes = 32): string {
  return b64uEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}
