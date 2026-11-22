// ============================================================
// আগে এখানে Supabase ক্লায়েন্ট ছিল। এখন পুরো ব্যাকএন্ড Cloudflare
// (D1 + R2 + নিজস্ব JWT)। পুরনো ইমপোর্ট পথ কাজ করে যাতে কোনো কম্পোনেন্ট
// ভাঙে না — কিন্তু ভেতরে সবকিছু Cloudflare-এ চলে।
//
// নতুন কোডে সরাসরি লিখুন:  import { cf } from "@/lib/cf/client";
// ============================================================

export { cf as supabase, cf as default } from "@/lib/cf/client";
export type { User, Session } from "@/lib/cf/client";
