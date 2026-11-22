# Cloudflare D1 মাইগ্রেশন রোডম্যাপ

## ✅ সম্পন্ন (Foundation)
- [x] `d1/schema.sql` — সম্পূর্ণ SQLite স্কিমা (২৫ টেবিল + ট্রিগার)
- [x] `wrangler.toml` — D1 (`DB`) ও R2 (`BUCKET`) বাইন্ডিং
- [x] `functions/_shared/cors.ts` — CORS + এরর হ্যান্ডলিং র‍্যাপার
- [x] `functions/_shared/auth.ts` — Supabase JWT ভেরিফিকেশন (JWKS + HS256) + রোল চেক
- [x] `functions/_shared/db.ts` — JSON/boolean এনকোড-ডিকোড, নিরাপদ insert/update বিল্ডার
- [x] API routes: `/api/health`, `/api/products`, `/api/products/:slug`,
      `/api/categories`, `/api/settings`, `/api/orders`
- [x] `src/lib/apiClient.ts` + `src/lib/dataApi.ts` — D1 প্রাইমারি, Lovable Cloud ফলব্যাক
- [x] `useSiteSettings` নতুন ডেটা লেয়ারে

## ✅ সম্পন্ন (API লেয়ার)
- [x] API routes: reviews, blogs, pages, sales-pages, spin, wishlist, cart,
      inventory (suppliers/purchase-orders/stock), transactions, abandoned-carts,
      blocked-users, user-roles, expense-categories
- [x] অর্ডার আপডেট/ডিলিট route (`/api/orders/:id`) + order_logs
- [x] Edge Functions পোর্ট → `functions/api/`:
      `/api/courier/check-ratio`, `/api/courier/send`, `/api/client-ip`,
      `/api/tracking/fb`, `/api/tracking/tt`
- [x] R2 আপলোড route (`/api/upload`) + ফাইল সার্ভিং (`/api/files/*`)
- [x] `src/lib/dataApi.ts` — blogs, pages, sales pages, reviews, variations,
      spin, wishlist, courier, tracking, uploads সহ সম্পূর্ণ

## ⏳ বাকি কাজ
- [ ] ফ্রন্টএন্ড হুক মাইগ্রেশন: useProducts, useBlogs, usePages, useSalesPages,
      useProductReviews, useProductVariations, useWishlist, অ্যাডমিন পেজগুলো
- [ ] অ্যাডমিন ইউজারের রোল D1 `user_roles` টেবিলে যোগ করা
- [ ] প্রোডাকশন যাচাই: `/api/health` + অর্ডার ফ্লো টেস্ট
## ⚠️ নিরাপত্তা
- [ ] চ্যাটে শেয়ার করা Cloudflare API Token **রোটেট/রিভোক** করতে হবে

## ধাপ ৪ — ১০০% Cloudflare (সম্পন্ন)

- `functions/api/db/index.ts`: জেনেরিক ডেটা API (PostgREST-সদৃশ) — টেবিল নীতি, embed,
  ফিল্টার, count, upsert সবই D1 এর উপর।
- `functions/_shared/policies.ts`: প্রতিটি টেবিলের read/write অনুমতি, মালিকানা কলাম,
  লুকানো কলাম ও গেস্ট-লুকআপ নিয়ম।
- `src/lib/cf/*`: ক্লায়েন্ট (query builder, auth, R2 storage, functions invoke)।
- `src/integrations/supabase/client.ts` এখন শুধু `@/lib/cf/client` রি-এক্সপোর্ট করে,
  তাই পুরনো সব ইমপোর্ট অপরিবর্তিত অবস্থায় Cloudflare-এ চলে।
- `@supabase/supabase-js` প্যাকেজ ও `supabase/` ফোল্ডার মুছে ফেলা হয়েছে।

### ডিপ্লয়ের আগে যা করতে হবে
1. স্কিমা প্রয়োগ:
   `wrangler d1 execute dramamovie3k --remote --file=d1/schema.sql`
   `wrangler d1 execute dramamovie3k --remote --file=d1/auth-schema.sql`
2. সিক্রেট সেট: Pages প্রজেক্টে `AUTH_JWT_SECRET` (লম্বা র‍্যান্ডম স্ট্রিং), প্রয়োজনে
   `BDCOURIER_API_KEY`, `R2_PUBLIC_URL`।
3. প্রথম অ্যাডমিন: signup করার পর
   `UPDATE user_roles SET role='admin' WHERE user_id='<id>';`

## অডিট (২ সেপ্টেম্বর ২০২৬)
- [x] সব পাবলিক ও অ্যাডমিন রুট স্ক্যান — কনসোল/নেটওয়ার্ক এরর ক্লিয়ার
- [x] `usePage` → `maybeSingle` (পেজ না থাকলে ৪০৬ এরর বন্ধ)
- [x] Vite dev proxy: এডিটর প্রিভিউতে `/api` লাইভ Cloudflare-এ প্রক্সি (আগে সব API 404 ছিল)
- [x] `d1/migrations/0001_stock_clamp.sql` — স্টক আর ঋণাত্মক হবে না (লাইভে অ্যাপ্লাই)
- [x] E2E টেস্ট: signup/login/me, /api/users, category/product/blog/page/sales-page/spin/
      supplier/transaction ইনসার্ট, অর্ডার + স্টক ডিডাকশন, রিভিউ, আপলোড অথ — সব পাস
- [ ] ডেটাবেস ফাঁকা: প্রোডাক্ট/ক্যাটাগরি/সেটিংস অ্যাডমিন প্যানেল থেকে যোগ করতে হবে
