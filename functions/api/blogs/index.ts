// GET/POST /api/blogs — ব্লগ পোস্ট (পাবলিক শুধু প্রকাশিতগুলো দেখে)
import { collectionRoute } from "../../_shared/crud";

export const BLOG_WRITABLE = [
  "id", "title", "title_bn", "slug", "content", "content_bn", "featured_image",
  "images", "sections", "video_url", "product_id", "button_text", "button_link",
  "is_published",
];

export const onRequest = collectionRoute({
  table: "blog_posts",
  writable: BLOG_WRITABLE,
  publicWhere: "is_published = 1",
  orderBy: "created_at DESC",
});
