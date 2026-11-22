-- ============================================================
-- Cloudflare D1 (SQLite) স্কিমা — Lovable Cloud (Postgres) থেকে পোর্ট করা
-- D1 Console অথবা: npx wrangler d1 execute dramamovie3k --remote --file=./d1/schema.sql
--
-- নোট (গুরুত্বপূর্ণ):
--  * SQLite-এ uuid টাইপ নেই → সব id কলাম TEXT, API layer crypto.randomUUID() দিয়ে জেনারেট করে
--  * jsonb ও text[] কলাম → TEXT (JSON string হিসেবে সেভ হয়), API layer parse/stringify করে
--  * boolean → INTEGER (0/1)
--  * numeric → REAL, timestamptz → TEXT (ISO 8601)
--  * D1-তে RLS নেই → সব পারমিশন চেক functions/_shared/auth.ts এ হয়
-- ============================================================

PRAGMA foreign_keys = ON;

-- ----------------------- ক্যাটাগরি -----------------------
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  name_bn     TEXT NOT NULL,
  icon        TEXT,
  image_url   TEXT,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ----------------------- প্রোডাক্ট -----------------------
CREATE TABLE IF NOT EXISTS products (
  id                     TEXT PRIMARY KEY NOT NULL,
  name                   TEXT NOT NULL,
  name_bn                TEXT NOT NULL,
  description            TEXT,
  description_bn         TEXT,
  short_description      TEXT,
  short_description_bn   TEXT,
  price                  REAL NOT NULL,
  original_price         REAL,
  cost_price             REAL,
  image_url              TEXT,
  images                 TEXT DEFAULT '[]',        -- JSON array
  review_images          TEXT DEFAULT '[]',        -- JSON array
  video_url              TEXT,
  category_id            TEXT REFERENCES categories(id) ON DELETE SET NULL,
  stock                  INTEGER DEFAULT 0,
  low_stock_threshold    INTEGER DEFAULT 5,
  rating                 REAL DEFAULT 0,
  reviews_count          INTEGER DEFAULT 0,
  is_featured            INTEGER DEFAULT 0,
  is_new                 INTEGER DEFAULT 0,
  slug                   TEXT NOT NULL UNIQUE,
  shipping_inside_dhaka  REAL,
  shipping_outside_dhaka REAL,
  free_shipping          INTEGER DEFAULT 0,
  has_variations         INTEGER DEFAULT 0,
  variation_type         TEXT,
  catalog_id             INTEGER,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- প্রোডাক্ট ↔ একাধিক ক্যাটাগরি
CREATE TABLE IF NOT EXISTS product_categories (
  id          TEXT PRIMARY KEY NOT NULL,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (product_id, category_id)
);

-- প্রোডাক্ট ভ্যারিয়েশন
CREATE TABLE IF NOT EXISTS product_variations (
  id                     TEXT PRIMARY KEY NOT NULL,
  product_id             TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_type         TEXT NOT NULL DEFAULT 'size',
  variation_name         TEXT NOT NULL,
  price                  REAL NOT NULL,
  stock                  INTEGER DEFAULT 0,
  sort_order             INTEGER DEFAULT 0,
  is_default             INTEGER DEFAULT 0,
  image_url              TEXT,
  shipping_inside_dhaka  REAL,
  shipping_outside_dhaka REAL,
  free_shipping          INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);

-- ----------------------- রিভিউ -----------------------
CREATE TABLE IF NOT EXISTS product_reviews (
  id             TEXT PRIMARY KEY NOT NULL,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id        TEXT,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,                             -- শুধু অ্যাডমিন দেখতে পাবে (API-তে ফিল্টার করা)
  rating         INTEGER NOT NULL,
  review_text    TEXT,
  is_approved    INTEGER DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id, is_approved);

-- ----------------------- অর্ডার -----------------------
CREATE TABLE IF NOT EXISTS orders (
  id                     TEXT PRIMARY KEY NOT NULL,
  user_id                TEXT,
  customer_name          TEXT NOT NULL,
  customer_phone         TEXT NOT NULL,
  customer_address       TEXT NOT NULL,
  customer_city          TEXT NOT NULL,
  customer_ip            TEXT,
  total_amount           REAL NOT NULL,
  shipping_cost          REAL DEFAULT 60,
  status                 TEXT NOT NULL DEFAULT 'pending',
  payment_method         TEXT NOT NULL DEFAULT 'cod',
  notes                  TEXT,
  is_duplicate_blocked   INTEGER DEFAULT 0,
  courier_id             TEXT,
  courier_tracking_code  TEXT,
  courier_consignment_id TEXT,
  courier_sent_at        TEXT,
  courier_ratio_data     TEXT,                     -- JSON
  tracking_data          TEXT,                     -- JSON
  order_source           TEXT DEFAULT 'direct',
  coupon_code            TEXT,
  coupon_discount        REAL DEFAULT 0,
  purchase_event_id      TEXT,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id             TEXT PRIMARY KEY NOT NULL,
  order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name   TEXT NOT NULL,
  product_price  REAL NOT NULL,
  quantity       INTEGER NOT NULL,
  variation_id   TEXT,
  variation_name TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_logs (
  id           TEXT PRIMARY KEY NOT NULL,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  old_status   TEXT,
  new_status   TEXT,
  notes        TEXT,
  performed_by TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_logs(order_id);

-- ----------------------- কার্ট / উইশলিস্ট -----------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id             TEXT PRIMARY KEY NOT NULL,
  user_id        TEXT NOT NULL,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL DEFAULT 1,
  variation_id   TEXT,
  variation_name TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS wishlist (
  id         TEXT PRIMARY KEY NOT NULL,
  user_id    TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id             TEXT PRIMARY KEY NOT NULL,
  session_id     TEXT,
  user_id        TEXT,
  customer_phone TEXT,
  customer_ip    TEXT,
  cart_data      TEXT,                              -- JSON
  checkout_step  TEXT DEFAULT 'cart',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_abandoned_carts_phone_unique ON abandoned_carts (customer_phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts (session_id);


-- ----------------------- ইউজার / রোল -----------------------
-- অথেনটিকেশন Lovable Cloud (Supabase Auth) এ-ই থাকছে; এখানে শুধু প্রোফাইল ও রোল মিরর হয়
CREATE TABLE IF NOT EXISTS profiles (
  id         TEXT PRIMARY KEY NOT NULL,
  user_id    TEXT NOT NULL UNIQUE,                  -- Supabase auth.users.id
  full_name  TEXT,
  phone      TEXT,
  address    TEXT,
  city       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY NOT NULL,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','moderator','user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

CREATE TABLE IF NOT EXISTS blocked_users (
  id            TEXT PRIMARY KEY NOT NULL,
  phone         TEXT,
  ip_address    TEXT,
  reason        TEXT,
  block_type    TEXT DEFAULT 'permanent',
  blocked_until TEXT,
  blocked_by    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------- কনটেন্ট -----------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id             TEXT PRIMARY KEY NOT NULL,
  title          TEXT NOT NULL,
  title_bn       TEXT NOT NULL DEFAULT '',
  slug           TEXT NOT NULL UNIQUE,
  content        TEXT,
  content_bn     TEXT,
  featured_image TEXT,
  images         TEXT DEFAULT '[]',                 -- JSON array
  sections       TEXT DEFAULT '[]',                 -- JSON array (মডুলার ব্লগ সেকশন)
  video_url      TEXT,
  product_id     TEXT REFERENCES products(id) ON DELETE SET NULL,
  button_text    TEXT,
  button_link    TEXT,
  is_published   INTEGER DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  id               TEXT PRIMARY KEY NOT NULL,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  is_published     INTEGER DEFAULT 1,
  sort_order       INTEGER DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  id            TEXT PRIMARY KEY NOT NULL,
  setting_key   TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------- সেলস পেজ -----------------------
-- Postgres-এ ১২০+ কলাম ছিল; এখানে স্ট্যাটিক কলাম + বাকিগুলো একটি JSON কলামে (config)
CREATE TABLE IF NOT EXISTS sales_pages (
  id                  TEXT PRIMARY KEY NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  is_active           INTEGER DEFAULT 1,
  product_id          TEXT REFERENCES products(id) ON DELETE SET NULL,
  template_id         TEXT DEFAULT 'elegant-dark',
  hero_headline       TEXT NOT NULL,
  hero_subheadline    TEXT,
  hero_badge_text     TEXT,
  hero_images         TEXT DEFAULT '[]',            -- JSON array
  hero_video_url      TEXT,
  offer_price         REAL NOT NULL,
  original_price      REAL,
  discount_text       TEXT,
  price_unit          TEXT DEFAULT '৳',
  offer_details       TEXT,
  payment_method      TEXT DEFAULT 'cod',
  multi_products      TEXT NOT NULL DEFAULT '[]',   -- JSON array
  show_multi_products INTEGER NOT NULL DEFAULT 0,
  allow_multi_select  INTEGER NOT NULL DEFAULT 0,
  -- বাকি সব সেকশন সেটিং (features, gallery, reviews, contact, colors,
  -- extra_section_1..3, spec_items, section_order, variants, template_styles)
  -- একটি JSON অবজেক্টে রাখা হয় — নতুন ফিল্ড যোগ করতে migration লাগে না
  config              TEXT NOT NULL DEFAULT '{}',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------- স্পিন হুইল -----------------------
CREATE TABLE IF NOT EXISTS spin_offers (
  id             TEXT PRIMARY KEY NOT NULL,
  offer_text     TEXT NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  color          TEXT NOT NULL DEFAULT '#0d6e3f',
  text_color     TEXT NOT NULL DEFAULT '#ffffff',
  icon           TEXT DEFAULT '🎁',
  probability    INTEGER NOT NULL DEFAULT 1,
  is_active      INTEGER NOT NULL DEFAULT 1,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spin_entries (
  id             TEXT PRIMARY KEY NOT NULL,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  offer_id       TEXT REFERENCES spin_offers(id) ON DELETE SET NULL,
  offer_text     TEXT,
  coupon_code    TEXT NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  is_used        INTEGER NOT NULL DEFAULT 0,
  used_order_id  TEXT REFERENCES orders(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_spin_entries_coupon ON spin_entries(coupon_code);

-- ----------------------- ইনভেন্টরি ও হিসাব -----------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id            TEXT PRIMARY KEY NOT NULL,
  supplier_id   TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  total_amount  REAL NOT NULL DEFAULT 0,
  notes         TEXT,
  order_date    TEXT NOT NULL DEFAULT (date('now')),
  received_date TEXT,
  created_by    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                TEXT PRIMARY KEY NOT NULL,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name      TEXT NOT NULL,
  quantity          INTEGER NOT NULL,
  unit_cost         REAL NOT NULL,
  total_cost        REAL NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_history (
  id              TEXT PRIMARY KEY NOT NULL,
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type     TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  previous_stock  INTEGER NOT NULL,
  new_stock       INTEGER NOT NULL,
  unit_cost       REAL,
  reference_id    TEXT,
  reference_type  TEXT,
  notes           TEXT,
  created_by      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);

CREATE TABLE IF NOT EXISTS expense_categories (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  name_bn    TEXT NOT NULL,
  icon       TEXT DEFAULT '📁',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id               TEXT PRIMARY KEY NOT NULL,
  type             TEXT NOT NULL,                   -- income / expense
  category_id      TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
  order_id         TEXT REFERENCES orders(id) ON DELETE SET NULL,
  amount           REAL NOT NULL,
  description      TEXT,
  notes            TEXT,
  transaction_date TEXT NOT NULL DEFAULT (date('now')),
  created_by       TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------- কুরিয়ার ক্যাশ -----------------------
CREATE TABLE IF NOT EXISTS courier_ratio_cache (
  phone      TEXT PRIMARY KEY NOT NULL,
  data       TEXT NOT NULL,                         -- JSON
  checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ট্রিগার — Postgres ফাংশনগুলোর SQLite সমতুল্য
-- ============================================================

-- updated_at অটো-আপডেট (Postgres: update_updated_at_column)
CREATE TRIGGER IF NOT EXISTS trg_products_updated
AFTER UPDATE ON products FOR EACH ROW
BEGIN UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_orders_updated
AFTER UPDATE ON orders FOR EACH ROW
BEGIN UPDATE orders SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_sales_pages_updated
AFTER UPDATE ON sales_pages FOR EACH ROW
BEGIN UPDATE sales_pages SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_site_settings_updated
AFTER UPDATE ON site_settings FOR EACH ROW
BEGIN UPDATE site_settings SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_blog_posts_updated
AFTER UPDATE ON blog_posts FOR EACH ROW
BEGIN UPDATE blog_posts SET updated_at = datetime('now') WHERE id = NEW.id; END;

-- প্রোডাক্ট রেটিং রি-ক্যালকুলেশন (Postgres: update_product_rating)
CREATE TRIGGER IF NOT EXISTS trg_review_insert_rating
AFTER INSERT ON product_reviews FOR EACH ROW
BEGIN
  UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM product_reviews
                       WHERE product_id = NEW.product_id AND is_approved = 1), 0),
    reviews_count = (SELECT COUNT(*) FROM product_reviews
                     WHERE product_id = NEW.product_id AND is_approved = 1)
  WHERE id = NEW.product_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_review_update_rating
AFTER UPDATE ON product_reviews FOR EACH ROW
BEGIN
  UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM product_reviews
                       WHERE product_id = NEW.product_id AND is_approved = 1), 0),
    reviews_count = (SELECT COUNT(*) FROM product_reviews
                     WHERE product_id = NEW.product_id AND is_approved = 1)
  WHERE id = NEW.product_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_review_delete_rating
AFTER DELETE ON product_reviews FOR EACH ROW
BEGIN
  UPDATE products SET
    rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM product_reviews
                       WHERE product_id = OLD.product_id AND is_approved = 1), 0),
    reviews_count = (SELECT COUNT(*) FROM product_reviews
                     WHERE product_id = OLD.product_id AND is_approved = 1)
  WHERE id = OLD.product_id;
END;

-- অর্ডার আইটেম যোগ হলে স্টক কমানো + হিস্ট্রি (Postgres: handle_order_stock_change)
CREATE TRIGGER IF NOT EXISTS trg_order_item_stock_out
AFTER INSERT ON order_items FOR EACH ROW
WHEN NEW.product_id IS NOT NULL
BEGIN
  UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
  INSERT INTO stock_history (id, product_id, change_type, quantity_change,
                             previous_stock, new_stock, reference_id, reference_type, notes)
  SELECT lower(hex(randomblob(16))), NEW.product_id, 'sale', -NEW.quantity,
         stock + NEW.quantity, stock, NEW.order_id, 'order', 'অর্ডার থেকে স্টক কমানো হয়েছে'
  FROM products WHERE id = NEW.product_id;
END;

-- অর্ডার আইটেম ডিলিট হলে স্টক ফেরত (Postgres: handle_order_delete_stock)
CREATE TRIGGER IF NOT EXISTS trg_order_item_stock_return
AFTER DELETE ON order_items FOR EACH ROW
WHEN OLD.product_id IS NOT NULL
BEGIN
  UPDATE products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
  INSERT INTO stock_history (id, product_id, change_type, quantity_change,
                             previous_stock, new_stock, reference_id, reference_type, notes)
  SELECT lower(hex(randomblob(16))), OLD.product_id, 'return', OLD.quantity,
         stock - OLD.quantity, stock, OLD.order_id, 'order', 'অর্ডার বাতিল/ডিলিট — স্টক ফেরত'
  FROM products WHERE id = OLD.product_id;
END;

-- ----------------------- পাবলিক রিভিউ ভিউ -----------------------
-- ফোন নম্বর ছাড়া, শুধু অনুমোদিত রিভিউ (সাইটে দেখানোর জন্য)
CREATE VIEW IF NOT EXISTS product_reviews_public AS
SELECT id, product_id, user_id, customer_name, rating, review_text,
       is_approved, created_at, updated_at
FROM product_reviews
WHERE is_approved = 1;
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
