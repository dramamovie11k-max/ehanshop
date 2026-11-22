// GET/PUT/DELETE /api/transactions/:id
import { itemRoute } from "../../_shared/crud";
import { TRANSACTION_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "transactions",
  writable: TRANSACTION_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
});
