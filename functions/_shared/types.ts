// Cloudflare Pages Functions এর env বাইন্ডিং টাইপ

export interface Env {
  /** D1 ডেটাবেস (wrangler.toml এ binding = "DB") */
  DB: D1Database;
  /** R2 বাকেট (ছবি ও ফাইল আপলোড) */
  BUCKET?: R2Bucket;
  /** R2 পাবলিক URL (কাস্টম ডোমেইন থাকলে) */
  R2_PUBLIC_URL?: string;
  /** নিজস্ব JWT সিক্রেট — অথেনটিকেশনের ভিত্তি */
  AUTH_JWT_SECRET?: string;
  /** কমা দিয়ে আলাদা করা ইমেইল তালিকা — এই ইমেইলগুলো অটো admin হবে */
  ADMIN_EMAILS?: string;
  /** BD Courier API key (না থাকলে site_settings থেকে পড়া হয়) */
  BDCOURIER_API_KEY?: string;
}

export type PagesCtx<P extends string = string> = EventContext<
  Env,
  P,
  Record<string, unknown>
>;
