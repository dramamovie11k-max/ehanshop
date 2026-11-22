// GET/POST /api/expense-categories — খরচের ক্যাটাগরি (শুধু স্টাফ)
import { collectionRoute } from "../../_shared/crud";

export const onRequest = collectionRoute({
  table: "expense_categories",
  writable: ["id", "name", "name_bn", "icon"],
  readAccess: "staff",
  writeAccess: "staff",
  orderBy: "name ASC",
});
