-- অর্ডার ডিলিটে স্টক ফেরতের ট্রিগার idempotent করা।
-- আগে: বাতিল করা অর্ডার (যার স্টক ইতিমধ্যে ফেরত গেছে) ডিলিট করলে
--       দ্বিতীয়বার স্টক যোগ হয়ে যেত।
-- এখন: শুধু তখনই ফেরত যাবে যখন ঐ অর্ডারের জন্য স্টক এখনো কাটা আছে
--       (stock_history-তে নেট পরিবর্তন এখনো ঋণাত্মক)।

DROP TRIGGER IF EXISTS trg_order_item_stock_return;

CREATE TRIGGER trg_order_item_stock_return
AFTER DELETE ON order_items FOR EACH ROW
WHEN OLD.product_id IS NOT NULL
 AND (SELECT COALESCE(SUM(quantity_change), 0) FROM stock_history
       WHERE reference_type = 'order'
         AND reference_id = OLD.order_id
         AND product_id = OLD.product_id) < 0
BEGIN
  UPDATE products SET stock = MAX(0, stock + OLD.quantity) WHERE id = OLD.product_id;
  INSERT INTO stock_history (id, product_id, change_type, quantity_change,
                             previous_stock, new_stock, reference_id, reference_type, notes)
  SELECT lower(hex(randomblob(16))), OLD.product_id, 'return', OLD.quantity,
         stock - OLD.quantity, stock, OLD.order_id, 'order', 'অর্ডার ডিলিট — স্টক ফেরত'
  FROM products WHERE id = OLD.product_id;
END;
