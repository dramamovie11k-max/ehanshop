// GET/PUT/DELETE /api/blocked-users/:id
import { itemRoute } from "../../_shared/crud";
import { BLOCKED_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "blocked_users",
  writable: BLOCKED_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
});
