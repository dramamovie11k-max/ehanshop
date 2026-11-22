// GET  /api/abandoned-carts — পরিত্যক্ত কার্ট লিস্ট (শুধু স্টাফ)
// POST /api/abandoned-carts — চেকআউট শুরু হলে ট্র্যাক করা (পাবলিক)
import { collectionRoute } from "../../_shared/crud";

export const ABANDONED_WRITABLE = [
  "id", "session_id", "user_id", "customer_phone", "customer_ip",
  "cart_data", "checkout_step",
];

export const onRequest = collectionRoute({
  table: "abandoned_carts",
  writable: ABANDONED_WRITABLE,
  readAccess: "staff",
  writeAccess: "public",
  orderBy: "updated_at DESC",
});
