// পাসওয়ার্ড হ্যাশিং — PBKDF2-SHA256 (Workers এর Web Crypto দিয়ে)
// ফরম্যাট: pbkdf2$<iterations>$<saltB64u>$<hashB64u>
// পুরনো সিস্টেম থেকে আসা bcrypt ($2a/$2b/$2y) হ্যাশও যাচাই করা যায়।

import { b64uEncode, b64uDecode } from "./jwt";
import bcrypt from "bcryptjs";

const ITERATIONS = 100_000;
const enc = new TextEncoder();


async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64uEncode(salt)}$${b64uEncode(hash)}`;
}

export function isLegacyHash(stored: string): boolean {
  return /^\$2[aby]?\$/.test(stored || "");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (isLegacyHash(stored)) {
    try {
      return await bcrypt.compare(password, stored);
    } catch {
      return false;
    }
  }
  const [scheme, iterStr, saltB64, hashB64] = (stored || "").split("$");
  if (scheme !== "pbkdf2" || !iterStr || !saltB64 || !hashB64) return false;

  const expected = b64uDecode(hashB64);
  const actual = await derive(password, b64uDecode(saltB64), Number(iterStr));
  if (actual.length !== expected.length) return false;
  // constant-time তুলনা
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
