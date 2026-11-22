// GET/PUT/DELETE /api/abandoned-carts/:id — শুধু স্টাফ
import { itemRoute } from "../../_shared/crud";
import { ABANDONED_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "abandoned_carts",
  writable: ABANDONED_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
});
