// GET/POST /api/spin/offers — স্পিন হুইলের অফার
import { collectionRoute } from "../../_shared/crud";

export const SPIN_OFFER_WRITABLE = [
  "id", "offer_text", "discount_type", "discount_value", "color", "text_color",
  "icon", "probability", "is_active", "sort_order",
];

export const onRequest = collectionRoute({
  table: "spin_offers",
  writable: SPIN_OFFER_WRITABLE,
  publicWhere: "is_active = 1",
  orderBy: "sort_order ASC",
});
