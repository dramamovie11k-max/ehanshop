-- স্টক কখনো ঋণাত্মক (negative) হবে না — অর্ডার ট্রিগার আপডেট
DROP TRIGGER IF EXISTS trg_order_item_stock_out;

CREATE TRIGGER trg_order_item_stock_out
AFTER INSERT ON order_items FOR EACH ROW
WHEN NEW.product_id IS NOT NULL
BEGIN
  UPDATE products SET stock = MAX(0, stock - NEW.quantity) WHERE id = NEW.product_id;
  INSERT INTO stock_history (id, product_id, change_type, quantity_change,
                             previous_stock, new_stock, reference_id, reference_type, notes)
  SELECT lower(hex(randomblob(16))), NEW.product_id, 'sale', -NEW.quantity,
         stock + NEW.quantity, stock, NEW.order_id, 'order', 'অর্ডার থেকে স্টক কমানো হয়েছে'
  FROM products WHERE id = NEW.product_id;
END;

-- বিদ্যমান ঋণাত্মক স্টক ঠিক করা
UPDATE products SET stock = 0 WHERE stock < 0;
