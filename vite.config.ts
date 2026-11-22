import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // ডেভ/এডিটর প্রিভিউতে Cloudflare Pages Functions চলে না —
    // তাই /api কল লাইভ Cloudflare ডিপ্লয়মেন্টে প্রক্সি করা হয়।
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "https://shop-advance-craft.pages.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
