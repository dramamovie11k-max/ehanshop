// GET/POST /api/pages — স্ট্যাটিক পেজ
import { collectionRoute } from "../../_shared/crud";

export const PAGE_WRITABLE = [
  "id", "title", "slug", "content", "meta_description", "is_published", "sort_order",
];

export const onRequest = collectionRoute({
  table: "pages",
  writable: PAGE_WRITABLE,
  publicWhere: "is_published = 1",
  orderBy: "sort_order ASC, created_at DESC",
});
