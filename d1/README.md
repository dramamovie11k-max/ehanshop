# Cloudflare D1 সেটআপ গাইড

## ১. স্কিমা তৈরি করুন

**অপশন ক — D1 Console (Dashboard):**
Cloudflare Dashboard → Workers & Pages → D1 → `dramamovie3k` → Console →
`d1/schema.sql` ফাইলের সম্পূর্ণ কনটেন্ট পেস্ট করে রান করুন।

**অপশন খ — Wrangler CLI:**
```bash
npx wrangler d1 execute dramamovie3k --remote --file=./d1/schema.sql
```

## ২. Pages প্রজেক্টে বাইন্ডিং যোগ করুন

`wrangler.toml` রিপোতে আছে। তবু ড্যাশবোর্ডে যাচাই করুন:
Pages → প্রজেক্ট → Settings → Bindings →
- D1 database: variable name `DB` → database `dramamovie3k`
- R2 bucket: variable name `BUCKET` → bucket `dramamovie3k`

## ৩. Environment Variables

Pages → Settings → Environment variables:

| নাম | মান | ধরন |
|---|---|---|
| `SUPABASE_URL` | `https://xfzklwldzajwwtbnxxor.supabase.co` | Plaintext |
| `R2_PUBLIC_URL` | `https://pub-89f3fc51674d4c82896d14b0468dcc2c.r2.dev` | Plaintext |
| `SUPABASE_JWT_SECRET` | (শুধু লিগ্যাসি HS256 টোকেন হলে) | **Encrypted** |

> নতুন Supabase signing keys ব্যবহার করলে `SUPABASE_JWT_SECRET` লাগবে না —
> JWT স্বয়ংক্রিয়ভাবে JWKS endpoint দিয়ে ভেরিফাই হবে।

## ৪. অ্যাডমিন রোল D1-তে যোগ করুন

D1-তে RLS নেই, তাই অ্যাডমিন চেক `user_roles` টেবিল থেকে হয়।
আপনার Lovable Cloud ইউজার আইডি দিয়ে:

```sql
INSERT INTO user_roles (id, user_id, role)
VALUES (lower(hex(randomblob(16))), '<আপনার-auth-user-id>', 'admin');
```

## ৫. Build সেটিংস

- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions` (স্বয়ংক্রিয়ভাবে ডিটেক্ট হয়)

## আর্কিটেকচার

```text
ব্রাউজার
   │
   ├── লগইন/সাইনআপ ─────────────► Lovable Cloud (Supabase Auth)  ← অপরিবর্তিত
   │                                       │ JWT
   │                                       ▼
   └── ডেটা কল ──► /api/*  ──► Pages Functions ──► D1 (Primary)
                       │  (JWT ভেরিফাই + রোল চেক)
                       └── ব্যর্থ হলে ──► Lovable Cloud (Fallback)
```

`src/lib/apiClient.ts` প্রথমে `/api/health` দিয়ে D1 আছে কিনা দেখে।
না থাকলে (যেমন লোকাল ডেভ) সব কল Lovable Cloud এ যায় — সাইট বন্ধ হয় না।

## স্বয়ংক্রিয় Migration (ডেপ্লয়মেন্টে)

Cloudflare Pages → Settings → Builds & deployments:

- **Build command:** `npm run build:cf`
- **Output directory:** `dist`

Environment variables (Production + Preview দুটোতেই):

| নাম | ধরন | কাজ |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Encrypted | D1 Edit পারমিশনসহ টোকেন — schema apply করার জন্য |
| `CLOUDFLARE_ACCOUNT_ID` | Plaintext | Cloudflare account id |
| `D1_DATABASE_NAME` | Plaintext (ঐচ্ছিক) | ডিফল্ট `dramamovie3k` |

প্রতিটি ডেপ্লয়ে `scripts/d1-migrate.mjs` ক্রমানুসারে চালায়:
`d1/schema.sql` → `d1/auth-schema.sql` → `d1/migrations/*.sql`।
সব SQL idempotent, তাই `auth_users`-এর মতো টেবিল আর কখনো মিস হবে না।
টোকেন না দিলে migration skip হবে (build ফেল করবে না) — তখন টেবিল মিস হওয়ার ঝুঁকি থাকে।
