// GET/PUT/DELETE /api/blogs/:slug
import { itemRoute } from "../../_shared/crud";
import { BLOG_WRITABLE } from "./index";

export const onRequest = itemRoute({
  table: "blog_posts",
  writable: BLOG_WRITABLE,
  keyColumn: "slug",
  param: "slug",
  publicWhere: "is_published = 1",
});
