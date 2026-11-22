-- অসম্পূর্ণ অর্ডার (abandoned_carts): ফোন নম্বর প্রতি একটাই রো থাকা উচিত।
-- আগে UNIQUE ইনডেক্স না থাকায় upsert (ON CONFLICT customer_phone) ফেল করত,
-- ফলে কোনো অসম্পূর্ণ অর্ডার সেভ হতো না।

-- ১) ডুপ্লিকেট থাকলে সবচেয়ে নতুনটি রেখে বাকিগুলো মুছে ফেলা
DELETE FROM abandoned_carts
WHERE customer_phone IS NOT NULL
  AND id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY customer_phone ORDER BY updated_at DESC, created_at DESC
      ) AS rn
      FROM abandoned_carts WHERE customer_phone IS NOT NULL
    ) WHERE rn = 1
  );

-- ২) ইউনিক ইনডেক্স
CREATE UNIQUE INDEX IF NOT EXISTS idx_abandoned_carts_phone_unique
  ON abandoned_carts (customer_phone);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session
  ON abandoned_carts (session_id);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_updated
  ON abandoned_carts (updated_at);
