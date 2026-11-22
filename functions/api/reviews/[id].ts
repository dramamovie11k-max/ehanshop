// GET/PUT/DELETE /api/reviews/:id — অনুমোদন/সম্পাদনা/মুছে ফেলা (শুধু স্টাফ)
import { itemRoute } from "../../_shared/crud";
import { REVIEW_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "product_reviews",
  writable: REVIEW_WRITABLE,
  readAccess: "staff",
  writeAccess: "staff",
});
