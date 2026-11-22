// GET/POST /api/variations?product_id=... — প্রোডাক্ট ভ্যারিয়েশন
import { collectionRoute } from "../../_shared/crud";

export const VARIATION_WRITABLE = [
  "id", "product_id", "variation_type", "variation_name", "price", "stock",
  "sort_order", "is_default", "image_url", "shipping_inside_dhaka",
  "shipping_outside_dhaka", "free_shipping",
];

export const onRequest = collectionRoute({
  table: "product_variations",
  writable: VARIATION_WRITABLE,
  filters: { product_id: "product_id" },
  orderBy: "sort_order ASC, created_at ASC",
});
