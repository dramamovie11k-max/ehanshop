// ============================================================
// ডোমেইন-ভিত্তিক ডেটা ফাংশন — প্রতিটিতে D1 (প্রাইমারি) ও Lovable Cloud (ফলব্যাক)
// হুকগুলো সরাসরি এই ফাংশনগুলো ব্যবহার করবে, supabase ক্লায়েন্ট নয়।
// ============================================================

import { cf as supabase } from "@/lib/cf/client";
import { apiFetch, withFallback } from "./apiClient";

/* ------------------------- ক্যাটাগরি ------------------------- */
export function fetchCategories() {
  return withFallback(
    () => apiFetch("/categories"),
    async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- প্রোডাক্ট ------------------------- */
export interface ProductQuery {
  category?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
}

export function fetchProducts(q: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (q.category) params.set("category", q.category);
  if (q.featured) params.set("featured", "true");
  if (q.search) params.set("search", q.search);
  if (q.limit) params.set("limit", String(q.limit));

  return withFallback(
    () => apiFetch(`/products?${params.toString()}`),
    async () => {
      let query = supabase.from("products").select("*, categories(name, slug)");
      if (q.featured) query = query.eq("is_featured", true);
      if (q.search) query = query.or(`name.ilike.%${q.search}%,name_bn.ilike.%${q.search}%`);
      if (q.limit) query = query.limit(q.limit);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  );
}

export function fetchProduct(slug: string) {
  return withFallback(
    () => apiFetch(`/products/${encodeURIComponent(slug)}`),
    async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variations(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...data, variations: (data as any).product_variations ?? [] } : null;
    },
  );
}

/* ------------------------- সাইট সেটিংস ------------------------- */
export async function fetchSiteSettings() {
  const res = await withFallback(
    () => apiFetch("/settings"),
    async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  );
  // সবসময় অ্যারে ফেরত দাও (অবজেক্ট/নাল আসলেও UI ভাঙবে না)
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).data)) return (res as any).data;
  if (res && typeof res === "object") {
    return Object.entries(res as Record<string, any>).map(([setting_key, setting_value]) => ({
      id: setting_key,
      setting_key,
      setting_value: setting_value == null ? null : String(setting_value),
      created_at: "",
      updated_at: "",
    }));
  }
  return [];
}

/** সব সেটিংস এক রিকোয়েস্টে সেভ (D1 ব্যাচ) — প্রতি কী-তে আলাদা রাউন্ডট্রিপ নয় */
export function saveSiteSettings(settings: Record<string, string>) {
  return withFallback(
    () => apiFetch("/settings", { method: "PUT", body: JSON.stringify({ settings }) }),
    async () => {
      // ফলব্যাক: সমান্তরালে upsert (sequential loop নয়)
      const results = await Promise.all(
        Object.entries(settings).map(([setting_key, setting_value]) =>
          supabase
            .from("site_settings")
            .upsert(
              { setting_key, setting_value, updated_at: new Date().toISOString() },
              { onConflict: "setting_key" },
            ),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      return { success: true } as any;
    },
  );
}

/* ------------------------- অর্ডার ------------------------- */
export interface NewOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  shipping_cost?: number;
  payment_method?: string;
  notes?: string;
  order_source?: string;
  coupon_code?: string;
  coupon_discount?: number;
  purchase_event_id?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    product_price: number;
    quantity: number;
    variation_id?: string;
    variation_name?: string;
  }>;
}

/** অর্ডার তৈরি — Cloudflare route-এ server-side validation সহ */
export function createOrder(input: NewOrderInput) {
  return apiFetch("/orders", { method: "POST", body: JSON.stringify(input) });
}

/** Checkout-এর পরে pixel attribution একবার সংরক্ষণ */
export function saveOrderTracking(
  orderId: string,
  tracking: { purchase_event_id?: string; tracking_data?: Record<string, unknown> },
) {
  return apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify(tracking),
  });
}

/** নিজের/সব অর্ডার লিস্ট */
export function fetchOrders(params: { status?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));

  return withFallback(
    () => apiFetch(`/orders?${qs.toString()}`),
    async () => {
      let query = supabase.from("orders").select("*, order_items(*)");
      if (params.status) query = query.eq("status", params.status);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- ব্লগ ------------------------- */
export function fetchBlogs(params: { limit?: number; published?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.published !== false) qs.set("is_published", "true");

  return withFallback(
    () => apiFetch(`/blogs?${qs.toString()}`),
    async () => {
      let query = supabase.from("blog_posts").select("*");
      if (params.published !== false) query = query.eq("is_published", true);
      if (params.limit) query = query.limit(params.limit);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  );
}

export function fetchBlog(slug: string) {
  return withFallback(
    () => apiFetch(`/blogs/${encodeURIComponent(slug)}`),
    async () => {
      const { data, error } = await supabase
        .from("blog_posts").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- স্ট্যাটিক পেজ ------------------------- */
export function fetchPage(slug: string) {
  return withFallback(
    () => apiFetch(`/pages/${encodeURIComponent(slug)}`),
    async () => {
      const { data, error } = await supabase
        .from("pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- সেলস পেজ ------------------------- */
export function fetchSalesPage(slug: string) {
  return withFallback(
    () => apiFetch(`/sales-pages/${encodeURIComponent(slug)}`),
    async () => {
      const { data, error } = await supabase
        .from("sales_pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- রিভিউ ------------------------- */
export function fetchReviews(productId: string) {
  return withFallback(
    () => apiFetch(`/reviews?product_id=${encodeURIComponent(productId)}`),
    async () => {
      const { data, error } = await supabase
        .from("product_reviews").select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  );
}

export function createReview(input: Record<string, unknown>) {
  return withFallback(
    () => apiFetch("/reviews", { method: "POST", body: JSON.stringify(input) }),
    async () => {
      const { data, error } = await supabase.from("product_reviews").insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- প্রোডাক্ট ভ্যারিয়েশন ------------------------- */
export function fetchVariations(productId: string) {
  return withFallback(
    () => apiFetch(`/variations?product_id=${encodeURIComponent(productId)}`),
    async () => {
      const { data, error } = await supabase
        .from("product_variations").select("*").eq("product_id", productId);
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- স্পিন হুইল ------------------------- */
export function fetchSpinOffers() {
  return withFallback(
    () => apiFetch("/spin/offers"),
    async () => {
      const { data, error } = await supabase
        .from("spin_offers").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  );
}

export function createSpinEntry(input: Record<string, unknown>) {
  return withFallback(
    () => apiFetch("/spin/entries", { method: "POST", body: JSON.stringify(input) }),
    async () => {
      const { data, error } = await supabase
        .from("spin_entries").insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- উইশলিস্ট ------------------------- */
export function fetchWishlist() {
  return withFallback(
    () => apiFetch("/wishlist"),
    async () => {
      const { data, error } = await supabase.from("wishlist").select("*, products(*)");
      if (error) throw error;
      return data;
    },
  );
}

export function addToWishlist(productId: string) {
  return withFallback(
    () => apiFetch("/wishlist", { method: "POST", body: JSON.stringify({ product_id: productId }) }),
    async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("wishlist")
        .insert({ product_id: productId, user_id: userData.user?.id as string })
        .select().single();
      if (error) throw error;
      return data;
    },
  );
}

export function removeFromWishlist(productId: string) {
  return withFallback(
    () => apiFetch(`/wishlist?product_id=${encodeURIComponent(productId)}`, { method: "DELETE" }),
    async () => {
      const { error } = await supabase.from("wishlist").delete().eq("product_id", productId);
      if (error) throw error;
      return { success: true } as any;
    },
  );
}

/* ------------------------- ভিজিটরের আইপি ------------------------- */
export async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch("/api/client-ip");
    if (res.ok) return ((await res.json()) as any)?.ip || "";
  } catch { /* উপেক্ষা */ }
  try {
    const { data } = await supabase.functions.invoke("get-client-ip");
    return (data as any)?.ip || "";
  } catch {
    return "";
  }
}

/* ------------------------- ট্র্যাকিং (সার্ভার-সাইড পিক্সেল) ------------------------- */
export async function trackServerEvent(
  channel: "fb" | "tt",
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const res = await fetch(`/api/tracking/${channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
  } catch { /* নিচে ফলব্যাক */ }
  const fn = channel === "fb" ? "fb-conversions-api" : "tiktok-events-api";
  await supabase.functions.invoke(fn, { body: payload }).catch(() => undefined);
}

/* ------------------------- কুরিয়ার ------------------------- */
export function checkCourierRatio(phone: string) {
  return withFallback(
    () => apiFetch("/courier/check-ratio", { method: "POST", body: JSON.stringify({ phone }) }),
    async () => {
      const { data, error } = await supabase.functions.invoke("check-courier-ratio", {
        body: { phone },
      });
      if (error) throw error;
      return data;
    },
  );
}

export function sendOrderToCourier(payload: Record<string, unknown>) {
  return withFallback(
    () => apiFetch("/courier/send", { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const { data, error } = await supabase.functions.invoke("send-to-courier", { body: payload });
      if (error) throw error;
      return data;
    },
  );
}

/* ------------------------- ফাইল আপলোড ------------------------- */
/** R2 তে আপলোড; D1 না থাকলে Lovable Cloud স্টোরেজে যায় */
export async function uploadFile(
  file: File,
  folder = "uploads",
  bucket = "product-images",
): Promise<{ url: string; key: string }> {
  const { authHeader } = await import("./apiClient");
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder || bucket);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || "আপলোড ব্যর্থ হয়েছে");
  return (body as any).data;
}
