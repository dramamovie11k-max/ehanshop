// GET/PUT/DELETE /api/pages/:slug
import { itemRoute } from "../../_shared/crud";
import { PAGE_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "pages",
  writable: PAGE_WRITABLE,
  keyColumn: "slug",
  param: "slug",
  publicWhere: "is_published = 1",
});
