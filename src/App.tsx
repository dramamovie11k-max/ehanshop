import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CustomCodeInjector from "@/components/CustomCodeInjector";
import FBPixelLoader from "@/components/FBPixelLoader";
import TikTokPixelLoader from "@/components/TikTokPixelLoader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import SpinWheel from "@/components/spin/SpinWheel";
import ScrollToTop from "@/components/layout/ScrollToTop";
import OrderSourceCapture from "@/components/OrderSourceCapture";
import DynamicTitle from "@/components/DynamicTitle";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Orders = lazy(() => import("./pages/Orders"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const SalesPageOrderSuccess = lazy(() => import("./pages/SalesPageOrderSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Admin Pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminBlocked = lazy(() => import("./pages/admin/AdminBlocked"));
const AdminAbandoned = lazy(() => import("./pages/admin/AdminAbandoned"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCustomCode = lazy(() => import("./pages/admin/AdminCustomCode"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminSalesPages = lazy(() => import("./pages/admin/AdminSalesPages"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminSpinSettings = lazy(() => import("./pages/admin/AdminSpinSettings"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <LanguageProvider>
              <ScrollToTop />
              <OrderSourceCapture />
              <DynamicTitle />
              <CustomCodeInjector />
              <FBPixelLoader />
              <TikTokPixelLoader />
              <Toaster />
              <Sonner />
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/lp-order-success" element={<SalesPageOrderSuccess />} />
                  {/* Sales Landing Pages - No Header/Footer */}
                  <Route path="/lp/:slug" element={<SalesPage />} />
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/blocked" element={<AdminBlocked />} />
                  <Route path="/admin/abandoned" element={<AdminAbandoned />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/custom-code" element={<AdminCustomCode />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                  <Route path="/admin/sales-pages" element={<AdminSalesPages />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/pages" element={<AdminPages />} />
                  <Route path="/admin/spin-settings" element={<AdminSpinSettings />} />
                  <Route path="/admin/blogs" element={<AdminBlogs />} />

                  {/* Blog Detail */}
                  <Route path="/blog/:slug" element={<BlogDetail />} />

                  {/* Dynamic Pages - must be before catch-all */}
                  <Route path="/:slug" element={<DynamicPage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </ErrorBoundary>
              {/* Mobile Bottom Navigation - only shown on mobile */}
              <MobileBottomNav />
              <SpinWheel />
            </LanguageProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
