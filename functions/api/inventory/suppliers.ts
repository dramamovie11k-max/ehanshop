// GET/POST /api/inventory/suppliers — সরবরাহকারী (শুধু স্টাফ)
import { collectionRoute } from "../../_shared/crud";

export const onRequest = collectionRoute({
  table: "suppliers",
  writable: ["id", "name", "phone", "email", "address", "notes"],
  readAccess: "staff",
  writeAccess: "staff",
  orderBy: "name ASC",
});
