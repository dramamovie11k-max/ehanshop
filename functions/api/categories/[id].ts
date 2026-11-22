// GET/PUT/PATCH/DELETE /api/categories/:id — এক ক্যাটাগরি (id অথবা slug দুটোতেই কাজ করে)
import { itemRoute } from "../../_shared/crud";

export const onRequest = itemRoute({
  table: "categories",
  writable: ["name", "name_bn", "icon", "image_url", "slug", "parent_id", "sort_order"],
  keyColumn: "slug",
  param: "id",
  readAccess: "public",
  writeAccess: "staff",
});
