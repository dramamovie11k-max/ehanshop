// GET/POST /api/transactions — আয়-ব্যয় হিসাব (শুধু স্টাফ)
import { collectionRoute } from "../../_shared/crud";

export const TRANSACTION_WRITABLE = [
  "id", "type", "category_id", "order_id", "amount", "description",
  "notes", "transaction_date", "created_by",
];

export const onRequest = collectionRoute({
  table: "transactions",
  writable: TRANSACTION_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
  filters: { type: "type" },
  orderBy: "transaction_date DESC, created_at DESC",
});
