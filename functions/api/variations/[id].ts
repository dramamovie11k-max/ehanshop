// GET/PUT/DELETE /api/variations/:id
import { itemRoute } from "../../_shared/crud";
import { VARIATION_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "product_variations",
  writable: VARIATION_WRITABLE,
});
