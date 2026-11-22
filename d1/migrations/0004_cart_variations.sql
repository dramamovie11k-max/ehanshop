-- কার্টে ভ্যারিয়েশন সাপোর্ট।
-- আগে: লগইন করা ইউজারের কার্ট সিঙ্ক হলে সাইজ/কালার পছন্দ হারিয়ে যেত,
--       কারণ cart_items টেবিলে variation কলাম ছিল না।
-- SQLite-এ "ADD COLUMN IF NOT EXISTS" নেই, তাই কলাম না থাকলে যোগ করার জন্য
-- আলাদা টেবিল বানিয়ে ডেটা কপি করা হয় (idempotent — বারবার চালালেও নিরাপদ)।

CREATE TABLE IF NOT EXISTS cart_items_v2 (
  id             TEXT PRIMARY KEY NOT NULL,
  user_id        TEXT NOT NULL,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL DEFAULT 1,
  variation_id   TEXT,
  variation_name TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO cart_items_v2 (id, user_id, product_id, quantity, created_at, updated_at)
SELECT id, user_id, product_id, quantity, created_at, updated_at FROM cart_items;

DROP TABLE IF EXISTS cart_items;
ALTER TABLE cart_items_v2 RENAME TO cart_items;

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_product_variation
  ON cart_items(user_id, product_id, COALESCE(variation_id, ''));
