// GET/POST /api/blocked-users — ব্লক করা ফোন/আইপি (শুধু স্টাফ)
import { collectionRoute } from "../../_shared/crud";

export const BLOCKED_WRITABLE = [
  "id", "phone", "ip_address", "reason", "block_type", "blocked_until", "blocked_by",
];

export const onRequest = collectionRoute({
  table: "blocked_users",
  writable: BLOCKED_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
  orderBy: "created_at DESC",
});
