// টেবিল অনুযায়ী অ্যাকসেস নীতি ও রিলেশন ম্যাপ — জেনেরিক /api/db endpoint এর ভিত্তি।

export type Access = "public" | "user" | "staff" | "admin" | "none";

export interface TablePolicy {
  /** পড়ার অনুমতি */
  read: Access;
  /** লেখার (insert/update/delete) অনুমতি */
  write: Access;
  /** ইউজার-নির্দিষ্ট টেবিল হলে মালিকানার কলাম (স্টাফ ছাড়া সবাই শুধু নিজের রো দেখবে/বদলাবে) */
  owner?: string;
  /** পাবলিক পড়ার সময় বাধ্যতামূলক ফিল্টার (স্টাফ হলে প্রযোজ্য নয়) */
  publicFilter?: Record<string, unknown>;
  /** পাবলিক রেসপন্স থেকে বাদ দেওয়া সংবেদনশীল কলাম */
  hidden?: string[];
  /**
   * লগইন ছাড়া পড়ার বিশেষ অনুমতি — শুধু তখনই, যখন এই কলামগুলোর একটিতে
   * নির্দিষ্ট মান (eq) দিয়ে খোঁজা হয়। যেমন গেস্ট চেকআউটে নিজের ফোন দিয়ে
   * সাম্প্রতিক অর্ডার যাচাই। ঢালাওভাবে সব রো পড়া যায় না।
   */
  guestRead?: { requireFilterOn: string[]; hidden?: string[] };
}

export const POLICIES: Record<string, TablePolicy> = {
  // ---------- পাবলিক ক্যাটালগ ----------
  products:              { read: "public", write: "staff" },
  categories:            { read: "public", write: "staff" },
  product_categories:    { read: "public", write: "staff" },
  product_variations:    { read: "public", write: "staff" },
  site_settings:         { read: "public", write: "staff" },
  blog_posts:            { read: "public", write: "staff" },
  pages:                 { read: "public", write: "staff", publicFilter: { is_published: true } },
  sales_pages:           { read: "public", write: "staff" },
  spin_offers:           { read: "public", write: "staff" },

  // রিভিউ: সবাই দেখতে/দিতে পারে, কিন্তু অনুমোদিত রিভিউ ও ফোন গোপন
  product_reviews: {
    read: "public", write: "public",
    publicFilter: { is_approved: true },
    hidden: ["customer_phone", "reviewer_phone", "phone"],
  },
  product_reviews_public: { read: "public", write: "none", hidden: ["customer_phone", "phone"] },

  // ---------- ইউজার-নির্দিষ্ট ----------
  cart_items:  { read: "user", write: "user", owner: "user_id" },
  wishlist:    { read: "user", write: "user", owner: "user_id" },
  profiles:    { read: "user", write: "user", owner: "id" },
  // অর্ডার তৈরি/পরিবর্তন সবসময় ডেডিকেটেড /api/orders রুট দিয়ে হয় (সার্ভার-সাইড
  // দাম, কুপন, ব্লক-লিস্ট ও স্টক যাচাইসহ)। জেনেরিক /api/db দিয়ে লেখা যাবে না।
  orders: {
    read: "user", write: "staff", owner: "user_id",
    guestRead: {
      requireFilterOn: ["customer_phone", "customer_ip", "session_id", "id", "order_number"],
      hidden: ["customer_email", "notes", "admin_notes", "courier_response",
               "courier_ratio_data", "customer_ip", "cost_total"],
    },
  },
  // অর্ডার আইটেম: গেস্ট কনফার্মেশন পেজে order_id দিয়ে নিজের অর্ডারের আইটেম দেখা যায়
  order_items: {
    read: "user", write: "staff",
    guestRead: { requireFilterOn: ["order_id"] },
  },
  order_logs:  { read: "staff", write: "staff" },
  // স্পিন এন্ট্রি তৈরি /api/spin/entries দিয়ে (এক ফোনে একবার নিয়ম প্রয়োগসহ)।
  // পাবলিক লিস্টিং বন্ধ — না হলে সব কুপন কোড ফাঁস হয়ে যেত।
  spin_entries: {
    read: "staff", write: "staff",
    guestRead: { requireFilterOn: ["coupon_code"], hidden: ["customer_phone"] },
  },


  // ---------- স্টাফ ----------
  abandoned_carts:      { read: "staff", write: "public" }, // ট্র্যাকিং পাবলিক, পড়া স্টাফ
  blocked_users:        { read: "staff", write: "staff" },
  suppliers:            { read: "staff", write: "staff" },
  purchase_orders:      { read: "staff", write: "staff" },
  purchase_order_items: { read: "staff", write: "staff" },
  stock_history:        { read: "staff", write: "staff" },
  expense_categories:   { read: "staff", write: "staff" },
  transactions:         { read: "staff", write: "staff" },
  courier_ratio_cache:  { read: "staff", write: "staff" },

  // ---------- অ্যাডমিন ----------
  user_roles: { read: "staff", write: "admin" },
  auth_users: { read: "admin", write: "admin", hidden: ["password_hash"] },
};

export interface Relation {
  /** সম্পর্কিত টেবিল */
  table: string;
  /** one = প্যারেন্টে FK, many = চাইল্ডে FK */
  type: "one" | "many";
  /** one হলে প্যারেন্টের কলাম, many হলে চাইল্ডের কলাম */
  fk: string;
}

/** select স্ট্রিং-এ ব্যবহৃত embed গুলোর ম্যাপ: parentTable → embedName → Relation */
export const RELATIONS: Record<string, Record<string, Relation>> = {
  products: {
    categories: { table: "categories", type: "one", fk: "category_id" },
    product_variations: { table: "product_variations", type: "many", fk: "product_id" },
    product_categories: { table: "product_categories", type: "many", fk: "product_id" },
    product_reviews: { table: "product_reviews", type: "many", fk: "product_id" },
  },
  product_categories: {
    categories: { table: "categories", type: "one", fk: "category_id" },
    products: { table: "products", type: "one", fk: "product_id" },
  },
  product_variations: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  product_reviews: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  product_reviews_public: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  orders: {
    order_items: { table: "order_items", type: "many", fk: "order_id" },
    order_logs: { table: "order_logs", type: "many", fk: "order_id" },
  },
  order_items: {
    products: { table: "products", type: "one", fk: "product_id" },
    product_variations: { table: "product_variations", type: "one", fk: "variation_id" },
    orders: { table: "orders", type: "one", fk: "order_id" },
  },
  cart_items: {
    products: { table: "products", type: "one", fk: "product_id" },
    product_variations: { table: "product_variations", type: "one", fk: "variation_id" },
  },
  wishlist: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  blog_posts: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  sales_pages: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  purchase_orders: {
    suppliers: { table: "suppliers", type: "one", fk: "supplier_id" },
    purchase_order_items: { table: "purchase_order_items", type: "many", fk: "purchase_order_id" },
  },
  stock_history: {
    products: { table: "products", type: "one", fk: "product_id" },
  },
  spin_entries: {
    spin_offers: { table: "spin_offers", type: "one", fk: "offer_id" },
  },
};
