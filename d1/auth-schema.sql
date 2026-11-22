-- ============================================================
-- নিজস্ব JWT অথেনটিকেশনের টেবিল (Supabase auth এর বদলে)
-- Cloudflare D1 এ চলবে
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,           -- PBKDF2: iterations$saltB64$hashB64
  full_name       TEXT,
  phone           TEXT,
  email_confirmed INTEGER NOT NULL DEFAULT 1,
  is_banned       INTEGER NOT NULL DEFAULT 0,
  last_sign_in_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

-- রিফ্রেশ টোকেন (হ্যাশ করে রাখা হয়)
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON auth_refresh_tokens(user_id);

-- পাসওয়ার্ড রিসেট টোকেন
CREATE TABLE IF NOT EXISTS auth_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_auth_users_updated
AFTER UPDATE ON auth_users
BEGIN
  UPDATE auth_users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
