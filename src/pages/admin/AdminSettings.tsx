import { useState, useEffect } from "react";
import InvoiceLivePreview from "@/components/admin/InvoiceLivePreview";
import { getInvoiceColors, invoiceColorDefaults } from "@/lib/invoiceTheme";
import { STICKER_TEMPLATES } from "@/lib/stickerTemplates";
import { Loader2, Save, Truck, Package, Eye, EyeOff, Code, Users, Ban, Shield, Clock, Plus, Search, Trash2, User, UserPlus, ShieldX, MessageCircle, Phone, Settings2, Menu, Palette, Smartphone, ExternalLink, Image, Printer, BarChart3, KeyRound, ShoppingCart, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import LogoUploader from "@/components/admin/LogoUploader";

import HeaderCustomizer from "@/components/admin/HeaderCustomizer";
import BottomNavManager from "@/components/admin/BottomNavManager";
import AccountSettings from "@/components/admin/AccountSettings";
import FooterManager, { FooterLink } from "@/components/admin/FooterManager";
import SliderManager from "@/components/admin/SliderManager";
import { supabase } from "@/integrations/supabase/client";
import { saveSiteSettings } from "@/lib/dataApi";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlockedUsers } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

interface AllSettings {
  // Shipping
  default_shipping_inside_dhaka: string;
  default_shipping_outside_dhaka: string;
  // Site Settings
  site_name: string;
  site_tagline: string;
  browser_tab_title: string;
  og_title: string;
  og_description: string;
  og_image: string;
  published_url: string;
  site_logo_text: string;
  site_logo_url: string;
  logo_size: string;
  topbar_phone: string;
  topbar_delivery: string;
  topbar_original: string;
  topbar_support: string;
  topbar_messages: string;
  footer_phone: string;
  footer_email: string;
  footer_address: string;
  footer_description: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_tiktok: string;
  newsletter_title: string;
  newsletter_subtitle: string;
  copyright_text: string;
  // Header Colors
  header_bg_color: string;
  header_text_color: string;
  topbar_bg_color: string;
  topbar_text_color: string;
  topbar_gradient_from: string;
  topbar_gradient_to: string;
  topbar_gradient_direction: string;
  header_catnav_bg: string;
  header_catnav_text: string;
  header_search_bg: string;
  header_search_text: string;
  header_badge_bg: string;
  header_badge_text: string;
  header_hover_bg: string;
  header_hotdeal_color: string;
  // Menus
  site_menus: string;
  header_menu_items: string;
  // Footer
  footer_quick_links: string;
  footer_customer_service_links: string;
  // Bottom Nav
  bottom_nav_home_link: string;
  bottom_nav_shop_link: string;
  bottom_nav_whatsapp_link: string;
  bottom_nav_account_link: string;
  bottom_nav_offers_link: string;
  // Steadfast
  steadfast_api_key: string;
  steadfast_secret_key: string;
  // Pathao
  pathao_client_id: string;
  pathao_client_secret: string;
  pathao_username: string;
  pathao_password: string;
  pathao_store_id: string;
  // BD Courier
  bdcourier_api_key: string;
  // Custom Code
  header_code: string;
  body_code: string;
  footer_code: string;
  // Duplicate Order Block
  duplicate_block_enabled: string;
  duplicate_block_time: string;
  duplicate_block_message: string;
  duplicate_block_whatsapp: string;
  support_phone: string;
  // Product Page Settings
  product_addtocart_bg: string;
  product_addtocart_text: string;
  product_addtocart_label: string;
  product_order_bg: string;
  product_order_text: string;
  product_order_label: string;
  product_whatsapp_border: string;
  product_whatsapp_text: string;
  product_whatsapp_label: string;
  product_call_border: string;
  product_call_text: string;
  product_call_bg: string;
  product_call_phone: string;
  product_whatsapp_bg: string;
  product_whatsapp_phone: string;
  whatsapp_number: string;
  developer_text: string;
  // Slider
  slider_images: string;
  slider_full_width: string;
  slider_height_mobile: string;
  slider_height_desktop: string;
  // Category Section
  category_section_title: string;
  category_section_title_color: string;
  category_section_button_text: string;
  category_section_button_text_color: string;
  category_section_button_bg_color: string;
  category_card_border_color: string;
  category_card_bg_color: string;
  category_icon_bg_color: string;
  category_icon_color: string;
  category_text_color: string;
  category_section_border: string;
  category_section_enabled: string;
  // Homepage Product Sections (6 sections)
  product_section_1_enabled: string;
  product_section_1_title: string;
  product_section_1_category: string;
  product_section_1_count: string;
  product_section_2_enabled: string;
  product_section_2_title: string;
  product_section_2_category: string;
  product_section_2_count: string;
  product_section_3_enabled: string;
  product_section_3_title: string;
  product_section_3_category: string;
  product_section_3_count: string;
  product_section_4_enabled: string;
  product_section_4_title: string;
  product_section_4_category: string;
  product_section_4_count: string;
  product_section_5_enabled: string;
  product_section_5_title: string;
  product_section_5_category: string;
  product_section_5_count: string;
  product_section_6_enabled: string;
  product_section_6_title: string;
  product_section_6_category: string;
  product_section_6_count: string;
  // Invoice Settings
  invoice_brand_name: string;
  invoice_brand_tagline: string;
  invoice_shop_name: string;
  invoice_shop_phone: string;
  invoice_footer_text: string;
  invoice_primary_color: string;
  invoice_accent_color: string;
  invoice_logo_url: string;
  // Cancel Tracking
  cancel_tracking_enabled: string;
  // Facebook Pixel + CAPI
  fb_pixel_enabled: string;
  fb_pixel_id: string;
  fb_pixel_access_token: string;
  fb_pixel_test_event_code: string;
  // TikTok Pixel + Events API
  tiktok_pixel_enabled: string;
  tiktok_pixel_id: string;
  tiktok_pixel_access_token: string;
  tiktok_pixel_test_event_code: string;
  // Payment Numbers
  payment_bkash_number: string;
  payment_nagad_number: string;
  payment_rocket_number: string;
  // Checkout
  checkout_thana_district_enabled: string;
  checkout_coupon_enabled: string;
  checkout_terms_enabled: string;
  checkout_terms_text: string;
  checkout_terms_page_url: string;
  checkout_terms_link_label: string;
  checkout_terms_link2_label: string;
  checkout_terms_link2_url: string;
  checkout_terms_separator: string;
  checkout_terms_suffix: string;
  checkout_header_title: string;
  checkout_header_subtitle: string;
  // Checkout Colors
  checkout_page_bg: string;
  checkout_card_bg: string;
  checkout_header_bg_from: string;
  checkout_header_bg_to: string;
  checkout_heading_color: string;
  checkout_subheading_color: string;
  checkout_label_color: string;
  checkout_field_bg: string;
  checkout_field_border: string;
  checkout_field_text: string;
  checkout_field_placeholder: string;
  checkout_option_bg: string;
  checkout_option_border: string;
  checkout_option_text: string;
  checkout_option_active_from: string;
  checkout_option_active_to: string;
  checkout_option_active_text: string;
  checkout_summary_bg: string;
  checkout_summary_text: string;
  checkout_summary_border: string;
  checkout_total_color: string;
  checkout_terms_bg: string;
  checkout_terms_border: string;
  checkout_terms_text_color: string;
  checkout_terms_link_color: string;
  checkout_submit_from: string;
  checkout_submit_to: string;
  checkout_submit_text: string;
}


const defaultSettings: AllSettings = {
  default_shipping_inside_dhaka: "60",
  default_shipping_outside_dhaka: "120",
  site_name: "সাজিব",
  site_tagline: "এন্টারপ্রাইজ",
  browser_tab_title: "",
  og_title: "",
  og_description: "",
  og_image: "",
  published_url: "",
  site_logo_text: "SE",
  site_logo_url: "",
  logo_size: "44",
  topbar_phone: "হেল্পলাইন: 01700-000000",
  topbar_delivery: "সারা বাংলাদেশে হোম ডেলিভারি",
  topbar_original: "100% অরিজিনাল প্রোডাক্ট",
  topbar_support: "24/7 কাস্টমার সাপোর্ট",
  topbar_messages: "👉 টাকা হাতে পেয়ে দেখে টাকা দিন|🏆 ১০০% কোয়ালিটি পণ্য|🔁 ৭ দিনের রিটার্ন/এক্সচেঞ্জ|🚚 হোম ডেলিভারি সারা বাংলাদেশে",
  footer_phone: "01700-000000",
  footer_email: "info@example.com",
  footer_address: "ঢাকা, বাংলাদেশ",
  footer_description: "বাংলাদেশের সেরা অনলাইন শপিং প্ল্যাটফর্ম। সেরা দামে সেরা প্রোডাক্ট।",
  social_facebook: "#",
  social_instagram: "#",
  social_youtube: "#",
  social_tiktok: "#",
  newsletter_title: "নিউজলেটার সাবস্ক্রাইব করুন",
  newsletter_subtitle: "সেরা অফার ও নতুন প্রোডাক্টের আপডেট পান",
  copyright_text: "© 2024 সাজিব এন্টারপ্রাইজ। সর্বস্বত্ব সংরক্ষিত।",
  // Header Colors
  header_bg_color: "#0f172a",
  header_text_color: "#ffffff",
  topbar_bg_color: "",
  topbar_text_color: "",
  topbar_gradient_from: "",
  topbar_gradient_to: "",
  topbar_gradient_direction: "to right",
  header_catnav_bg: "",
  header_catnav_text: "",
  header_search_bg: "",
  header_search_text: "",
  header_badge_bg: "",
  header_badge_text: "",
  header_hover_bg: "",
  header_hotdeal_color: "",
  // Menus
  site_menus: "[]",
  header_menu_items: JSON.stringify([
    { label_bn: "হোম", label_en: "Home", url: "/" },
    { label_bn: "শপ", label_en: "Shop", url: "/products" },
    { type: "categories", label_bn: "ক্যাটেগরি", label_en: "Categories" },
    { label_bn: "যোগাযোগ", label_en: "Contact", url: "/contact" },
    { label_bn: "আমাদের সম্পর্কে", label_en: "About", url: "/about" },
  ]),
  // Footer
  footer_quick_links: JSON.stringify([
    { id: "1", label: "Home", url: "/" },
    { id: "2", label: "All Products", url: "/products" },
    { id: "3", label: "About Us", url: "/page/about" },
    { id: "4", label: "Contact", url: "/page/contact" },
  ]),
  footer_customer_service_links: JSON.stringify([
    { id: "1", label: "Delivery Rules", url: "/page/delivery-rules" },
    { id: "2", label: "Return Policy", url: "/page/return-policy" },
    { id: "3", label: "Refund Policy", url: "/page/refund-policy" },
    { id: "4", label: "Terms & Conditions", url: "/page/terms" },
  ]),
  // Bottom Nav
  bottom_nav_home_link: "/",
  bottom_nav_shop_link: "/products",
  bottom_nav_whatsapp_link: "https://wa.me/8801XXXXXXXXX",
  bottom_nav_account_link: "/dashboard",
  bottom_nav_offers_link: "/products?featured=true",
  // API Keys
  steadfast_api_key: "",
  steadfast_secret_key: "",
  pathao_client_id: "",
  pathao_client_secret: "",
  pathao_username: "",
  pathao_password: "",
  pathao_store_id: "",
  bdcourier_api_key: "",
  header_code: "",
  body_code: "",
  footer_code: "",
  duplicate_block_enabled: "true",
  duplicate_block_time: "30",
  duplicate_block_message: "আপনি ইতিমধ্যে একটি অর্ডার করেছেন। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন অথবা WhatsApp এ অর্ডার করুন।",
  duplicate_block_whatsapp: "+8801XXXXXXXXX",
  support_phone: "01XXXXXXXXX",
  // Product Page Settings
  product_addtocart_bg: "",
  product_addtocart_text: "",
  product_addtocart_label: "কার্টে যোগ করুন",
  product_order_bg: "",
  product_order_text: "",
  product_order_label: "অর্ডার করুন",
  product_whatsapp_border: "#16a34a",
  product_whatsapp_text: "#16a34a",
  product_whatsapp_label: "WhatsApp এ অর্ডার করুন",
  product_call_border: "",
  product_call_text: "",
  product_call_bg: "",
  product_call_phone: "",
  product_whatsapp_bg: "",
  product_whatsapp_phone: "",
  whatsapp_number: "",
  developer_text: "Developed by Rebuild It",
  // Slider
  slider_images: "[]",
  slider_full_width: "false",
  slider_height_mobile: "180",
  slider_height_desktop: "450",
  // Category Section
  category_section_title: "টপ ক্যাটাগরি",
  category_section_title_color: "",
  category_section_button_text: "সব দেখুন",
  category_section_button_text_color: "",
  category_section_button_bg_color: "",
  category_card_border_color: "",
  category_card_bg_color: "",
  category_icon_bg_color: "",
  category_icon_color: "",
  category_text_color: "",
  category_section_border: "true",
  category_section_enabled: "true",
  // Homepage Product Sections (6 sections)
  product_section_1_enabled: "true",
  product_section_1_title: "নতুন প্রোডাক্ট",
  product_section_1_category: "",
  product_section_1_count: "10",
  product_section_2_enabled: "true",
  product_section_2_title: "জনপ্রিয় প্রোডাক্ট",
  product_section_2_category: "",
  product_section_2_count: "10",
  product_section_3_enabled: "true",
  product_section_3_title: "বিশেষ অফার",
  product_section_3_category: "",
  product_section_3_count: "10",
  product_section_4_enabled: "true",
  product_section_4_title: "ট্রেন্ডিং প্রোডাক্ট",
  product_section_4_category: "",
  product_section_4_count: "10",
  product_section_5_enabled: "true",
  product_section_5_title: "বেস্ট সেলিং",
  product_section_5_category: "",
  product_section_5_count: "10",
  product_section_6_enabled: "true",
  product_section_6_title: "হট ডিলস",
  product_section_6_category: "",
  product_section_6_count: "10",
  // Invoice
  invoice_brand_name: "",
  invoice_brand_tagline: "সেরা পণ্যের নির্ভরযোগ্য প্রতিষ্ঠান",
  invoice_shop_name: "",
  invoice_shop_phone: "",
  invoice_footer_text: "আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!",
  invoice_primary_color: "#1a2a44",
  invoice_accent_color: "#b38b2d",
  invoice_logo_url: "",
  ...invoiceColorDefaults,
  // Cancel Tracking
  cancel_tracking_enabled: "true",
  fb_pixel_enabled: "false",
  fb_pixel_id: "",
  fb_pixel_access_token: "",
  fb_pixel_test_event_code: "",
  tiktok_pixel_enabled: "false",
  tiktok_pixel_id: "",
  tiktok_pixel_access_token: "",
  tiktok_pixel_test_event_code: "",
  payment_bkash_number: "",
  payment_nagad_number: "",
  payment_rocket_number: "",
  checkout_thana_district_enabled: "true",
  checkout_coupon_enabled: "true",
  checkout_terms_enabled: "false",
  checkout_terms_text: "আমি সকল শর্তাবলী পড়েছি ও সম্মত আছি।",
  checkout_terms_page_url: "/page/terms",
  checkout_terms_link_label: "Terms of Service",
  checkout_terms_link2_label: "Privacy Policy",
  checkout_terms_link2_url: "/page/privacy",
  checkout_terms_separator: "and",
  checkout_terms_suffix: ".",
  checkout_header_title: "",
  checkout_header_subtitle: "",
  checkout_page_bg: "#f3f8f3",
  checkout_card_bg: "#ffffff",
  checkout_header_bg_from: "",
  checkout_header_bg_to: "",
  checkout_heading_color: "#ffffff",
  checkout_subheading_color: "#ffffff",
  checkout_label_color: "#1e293b",
  checkout_field_bg: "#ecfdf5",
  checkout_field_border: "#d1fae5",
  checkout_field_text: "#1e293b",
  checkout_field_placeholder: "#94a3b8",
  checkout_option_bg: "#ecfdf5",
  checkout_option_border: "#d1fae5",
  checkout_option_text: "#334155",
  checkout_option_active_from: "",
  checkout_option_active_to: "",
  checkout_option_active_text: "#ffffff",
  checkout_summary_bg: "#fafafa",
  checkout_summary_text: "#475569",
  checkout_summary_border: "#e5e7eb",
  checkout_total_color: "",
  checkout_terms_bg: "#f0f9ff",
  checkout_terms_border: "#e0f2fe",
  checkout_terms_text_color: "#1e293b",
  checkout_terms_link_color: "#0284c7",
  checkout_submit_from: "",
  checkout_submit_to: "",
  checkout_submit_text: "#ffffff",
};

type AppRole = "admin" | "moderator" | "user";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: AppRole;
  created_at: string;
}

const roleLabels: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "অ্যাডমিন", color: "bg-red-500" },
  moderator: { label: "মডারেটর", color: "bg-blue-500" },
  user: { label: "ইউজার", color: "bg-gray-500" },
};

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("moderator");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Blocked Users State
  const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
  const [blockedSearchQuery, setBlockedSearchQuery] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    phone: "",
    ip_address: "",
    reason: "",
    block_type: "permanent",
    blocked_until: "",
  });

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name || null,
          phone: profile.phone || null,
          email: null,
          role: (userRole?.role as AppRole) || "user",
          created_at: profile.created_at,
        };
      });

      return usersWithRoles;
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      if (data) {
        const newSettings: AllSettings = { ...defaultSettings };
        data.forEach((item) => {
          if (item.setting_key in newSettings) {
            (newSettings as any)[item.setting_key] = item.setting_value || "";
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("সেটিংস লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // এক রিকোয়েস্টে সব সেটিংস — আগের sequential loop-এ ২০০+ রাউন্ডট্রিপ হতো
      await saveSiteSettings(settings as unknown as Record<string, string>);

      toast.success("সেটিংস সেভ হয়েছে!");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecretInput = (key: keyof AllSettings, label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <div className="relative">
        <Input
          id={key}
          type={showSecrets[key] ? "text" : "password"}
          value={settings[key]}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => toggleSecret(key)}
        >
          {showSecrets[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  // User Management Functions
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name?.toLowerCase() || "").includes(userSearchQuery.toLowerCase()) ||
      (user.phone || "").includes(userSearchQuery) ||
      user.user_id.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error("User ID দিন");
      return;
    }

    setIsSubmitting(true);

    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let userId = newUserEmail.trim();

      if (!uuidRegex.test(userId)) {
        toast.error("সঠিক User ID দিন (UUID ফরম্যাটে)");
        setIsSubmitting(false);
        return;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newUserRole })
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("ইউজার রোল আপডেট হয়েছে");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newUserRole });

        if (error) throw error;
        toast.success("ইউজার রোল যোগ হয়েছে");
      }

      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserRole("moderator");
    } catch (error: any) {
      toast.error(error.message || "রোল যোগ করতে ব্যর্থ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast.success("রোল আপডেট হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    } catch (error: any) {
      toast.error(error.message || "রোল আপডেট ব্যর্থ");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;
      toast.success("ইউজার রোল মুছে ফেলা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "রোল ডিলিট ব্যর্থ");
    }
  };

  // Blocked Users Functions
  const filteredBlockedUsers = blockedUsers.filter(
    (u: any) =>
      u.phone?.includes(blockedSearchQuery) ||
      u.ip_address?.includes(blockedSearchQuery) ||
      u.reason?.toLowerCase().includes(blockedSearchQuery.toLowerCase())
  );

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blockFormData.phone && !blockFormData.ip_address) {
      toast.error("ফোন বা IP অন্তত একটি দিতে হবে");
      return;
    }

    setBlockSaving(true);

    const blockData = {
      phone: blockFormData.phone || null,
      ip_address: blockFormData.ip_address || null,
      reason: blockFormData.reason || null,
      block_type: blockFormData.block_type,
      blocked_until: blockFormData.block_type === "temporary" && blockFormData.blocked_until
        ? new Date(blockFormData.blocked_until).toISOString()
        : null,
      blocked_by: user?.id,
    };

    const { error } = await supabase.from("blocked_users").insert(blockData);

    if (error) {
      if (error.code === "23505") {
        toast.error("এই ফোন/IP ইতিমধ্যে ব্লক করা আছে");
      } else {
        toast.error("ব্লক করতে ব্যর্থ");
      }
    } else {
      toast.success("সফলভাবে ব্লক করা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      setBlockDialogOpen(false);
      setBlockFormData({
        phone: "",
        ip_address: "",
        reason: "",
        block_type: "permanent",
        blocked_until: "",
      });
    }

    setBlockSaving(false);
  };

  const handleUnblock = async (id: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("id", id);

    if (error) {
      toast.error("আনব্লক করতে ব্যর্থ");
    } else {
      toast.success("আনব্লক করা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout title="সেটিংস">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout title="সেটিংস">
        <div className="space-y-6">
          <Tabs defaultValue="site">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="site" className="gap-2">
                <Settings2 className="h-4 w-4" />
                সাইট সেটিংস
              </TabsTrigger>
              <TabsTrigger value="header" className="gap-2">
                <Palette className="h-4 w-4" />
                হেডার
              </TabsTrigger>
              <TabsTrigger value="bottom-nav" className="gap-2">
                <Smartphone className="h-4 w-4" />
                বটম নেভ
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                ফুটার
              </TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2">
                <Truck className="h-4 w-4" />
                শিপিং
              </TabsTrigger>
              <TabsTrigger value="duplicate-block" className="gap-2">
                <ShieldX className="h-4 w-4" />
                ডুপ্লিকেট ব্লক
              </TabsTrigger>
              <TabsTrigger value="courier" className="gap-2">
                <Package className="h-4 w-4" />
                কুরিয়ার API
              </TabsTrigger>
              <TabsTrigger value="custom-code" className="gap-2">
                <Code className="h-4 w-4" />
                কাস্টম কোড
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                ইউজার ম্যানেজমেন্ট
              </TabsTrigger>
              <TabsTrigger value="blocked" className="gap-2">
                <Ban className="h-4 w-4" />
                ব্লক তালিকা
              </TabsTrigger>
              <TabsTrigger value="product-page" className="gap-2">
                <Package className="h-4 w-4" />
                প্রোডাক্ট পেজ
              </TabsTrigger>
              <TabsTrigger value="homepage-sections" className="gap-2">
                <Home className="h-4 w-4" />
                হোম পেজ
              </TabsTrigger>
              <TabsTrigger value="invoice" className="gap-2">
                <Printer className="h-4 w-4" />
                ইনভয়েস
              </TabsTrigger>
              <TabsTrigger value="tracking" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                ট্র্যাকিং
              </TabsTrigger>
              <TabsTrigger value="checkout" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                চেকআউট
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <KeyRound className="h-4 w-4" />
                অ্যাকাউন্ট
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    সাইট কাস্টমাইজেশন
                  </CardTitle>
                  <CardDescription>
                    ওয়েবসাইটের লোগো, টেক্সট, সোশ্যাল লিংক এবং অন্যান্য তথ্য পরিবর্তন করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Site Identity */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">সাইট পরিচয়</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="site_name">সাইটের নাম</Label>
                        <Input
                          id="site_name"
                          value={settings.site_name || ""}
                          onChange={(e) => setSettings({ ...settings, site_name: e.target.value } as any)}
                          placeholder="সাজিব"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site_tagline">ট্যাগলাইন</Label>
                        <Input
                          id="site_tagline"
                          value={settings.site_tagline || ""}
                          onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value } as any)}
                          placeholder="এন্টারপ্রাইজ"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="browser_tab_title">ব্রাউজার ট্যাবের নাম</Label>
                      <Input
                        id="browser_tab_title"
                        value={settings.browser_tab_title || ""}
                        onChange={(e) => setSettings({ ...settings, browser_tab_title: e.target.value } as any)}
                        placeholder="যেমন: Shadamon Shop - অনলাইন শপিং"
                      />
                      <p className="text-xs text-muted-foreground">ব্রাউজারের ট্যাবে যা দেখাবে</p>
                    </div>


                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="site_logo_text">লোগো টেক্সট (ইমেজ না থাকলে)</Label>
                        <Input
                          id="site_logo_text"
                          value={settings.site_logo_text || ""}
                          onChange={(e) => setSettings({ ...settings, site_logo_text: e.target.value } as any)}
                          placeholder="SE"
                          maxLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site_logo_url">লোগো ইমেজ URL</Label>
                        <Input
                          id="site_logo_url"
                          value={settings.site_logo_url || ""}
                          onChange={(e) => setSettings({ ...settings, site_logo_url: e.target.value } as any)}
                          placeholder="https://example.com/logo.png"
                        />
                        <p className="text-xs text-muted-foreground">
                          লোগো ইমেজ আপলোড করুন অথবা URL দিন। ইমেজ থাকলে টেক্সটের বদলে ইমেজ দেখাবে।
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo_size">লোগো সাইজ (px)</Label>
                        <Input
                          id="logo_size"
                          type="number"
                          value={settings.logo_size || "44"}
                          onChange={(e) => setSettings({ ...settings, logo_size: e.target.value })}
                          placeholder="44"
                          min="24"
                          max="120"
                        />
                        <p className="text-xs text-muted-foreground">
                          লোগোর উচ্চতা পিক্সেলে (ডিফল্ট: 44px)
                        </p>
                      </div>
                    </div>
                    
                    {/* Logo Preview */}
                    {settings.site_logo_url && (
                      <div className="p-4 bg-slate-900 rounded-xl inline-flex items-center gap-3">
                        <img 
                          src={settings.site_logo_url} 
                          alt="Logo Preview" 
                          className="h-10 w-10 object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="text-white">
                          <p className="font-bold">{settings.site_name}</p>
                          <p className="text-xs text-slate-400">{settings.site_tagline}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগ তথ্য</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="footer_phone">ফোন নম্বর</Label>
                        <Input
                          id="footer_phone"
                          value={settings.footer_phone || ""}
                          onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value } as any)}
                          placeholder="01700-000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footer_email">ইমেইল</Label>
                        <Input
                          id="footer_email"
                          value={settings.footer_email || ""}
                          onChange={(e) => setSettings({ ...settings, footer_email: e.target.value } as any)}
                          placeholder="info@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footer_address">ঠিকানা</Label>
                        <Input
                          id="footer_address"
                          value={settings.footer_address || ""}
                          onChange={(e) => setSettings({ ...settings, footer_address: e.target.value } as any)}
                          placeholder="ঢাকা, বাংলাদেশ"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer_description">সাইট বিবরণ</Label>
                      <Textarea
                        id="footer_description"
                        value={settings.footer_description || ""}
                        onChange={(e) => setSettings({ ...settings, footer_description: e.target.value } as any)}
                        placeholder="বাংলাদেশের সেরা অনলাইন শপিং প্ল্যাটফর্ম..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">সোশ্যাল মিডিয়া লিংক</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="social_facebook">Facebook URL</Label>
                        <Input
                          id="social_facebook"
                          value={settings.social_facebook || ""}
                          onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value } as any)}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_instagram">Instagram URL</Label>
                        <Input
                          id="social_instagram"
                          value={settings.social_instagram || ""}
                          onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value } as any)}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_youtube">YouTube URL</Label>
                        <Input
                          id="social_youtube"
                          value={settings.social_youtube || ""}
                          onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value } as any)}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_tiktok">TikTok URL</Label>
                        <Input
                          id="social_tiktok"
                          value={settings.social_tiktok || ""}
                          onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value } as any)}
                          placeholder="https://tiktok.com/@..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">নিউজলেটার</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newsletter_title">নিউজলেটার শিরোনাম</Label>
                        <Input
                          id="newsletter_title"
                          value={settings.newsletter_title || ""}
                          onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value } as any)}
                          placeholder="নিউজলেটার সাবস্ক্রাইব করুন"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newsletter_subtitle">নিউজলেটার সাবটাইটেল</Label>
                        <Input
                          id="newsletter_subtitle"
                          value={settings.newsletter_subtitle || ""}
                          onChange={(e) => setSettings({ ...settings, newsletter_subtitle: e.target.value } as any)}
                          placeholder="সেরা অফার ও নতুন প্রোডাক্টের আপডেট পান"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="space-y-2">
                    <Label htmlFor="copyright_text">কপিরাইট টেক্সট</Label>
                    <Input
                      id="copyright_text"
                      value={settings.copyright_text || ""}
                      onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value } as any)}
                      placeholder="© 2024 সাজিব এন্টারপ্রাইজ। সর্বস্বত্ব সংরক্ষিত।"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slider Tab */}
            {/* Slider & Categories now live inside the হোম পেজ tab below */}
            <TabsContent value="__legacy_slider_categories__" className="hidden">
              <div className="space-y-6">
                {/* Category Style Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      ক্যাটাগরি স্টাইল
                    </CardTitle>
                    <CardDescription>
                      হোমপেজে ক্যাটাগরি সেকশনের কালার ও স্টাইল কাস্টমাইজ করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Section Enable/Disable Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>সেকশন চালু/বন্ধ</Label>
                        <p className="text-xs text-muted-foreground">বন্ধ করলে হোমপেজে ক্যাটাগরি সেকশন আর দেখাবে না</p>
                      </div>
                      <Select
                        value={settings.category_section_enabled || "true"}
                        onValueChange={(value) => setSettings({ ...settings, category_section_enabled: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">চালু</SelectItem>
                          <SelectItem value="false">বন্ধ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section Title */}
                    <div className="space-y-2">
                      <Label>সেকশন টাইটেল</Label>
                      <Input
                        value={settings.category_section_title || ""}
                        onChange={(e) => setSettings({ ...settings, category_section_title: e.target.value })}
                        placeholder="টপ ক্যাটাগরি"
                      />
                    </div>

                    {/* Section Border Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>সেকশন বর্ডার</Label>
                        <p className="text-xs text-muted-foreground">পুরো ক্যাটাগরি সেকশনের চারপাশে বর্ডার দেখান</p>
                      </div>
                      <Select
                        value={settings.category_section_border || "true"}
                        onValueChange={(value) => setSettings({ ...settings, category_section_border: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">চালু</SelectItem>
                          <SelectItem value="false">বন্ধ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Card Colors */}
                    <div className="space-y-4">
                      <h4 className="font-medium">কার্ড কালার</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>কার্ড টপ বর্ডার কালার</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.category_card_border_color || "#16a34a"}
                              onChange={(e) => setSettings({ ...settings, category_card_border_color: e.target.value })}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={settings.category_card_border_color || ""}
                              onChange={(e) => setSettings({ ...settings, category_card_border_color: e.target.value })}
                              placeholder="#16a34a (ডিফল্ট: primary)"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>কার্ড ব্যাকগ্রাউন্ড</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.category_card_bg_color || "#ffffff"}
                              onChange={(e) => setSettings({ ...settings, category_card_bg_color: e.target.value })}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={settings.category_card_bg_color || ""}
                              onChange={(e) => setSettings({ ...settings, category_card_bg_color: e.target.value })}
                              placeholder="ডিফল্ট: card color"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Icon Colors */}
                    <div className="space-y-4">
                      <h4 className="font-medium">আইকন কালার</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>আইকন ব্যাকগ্রাউন্ড</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.category_icon_bg_color || "#dcfce7"}
                              onChange={(e) => setSettings({ ...settings, category_icon_bg_color: e.target.value })}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={settings.category_icon_bg_color || ""}
                              onChange={(e) => setSettings({ ...settings, category_icon_bg_color: e.target.value })}
                              placeholder="ডিফল্ট: primary/10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>আইকন কালার</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.category_icon_color || "#16a34a"}
                              onChange={(e) => setSettings({ ...settings, category_icon_color: e.target.value })}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={settings.category_icon_color || ""}
                              onChange={(e) => setSettings({ ...settings, category_icon_color: e.target.value })}
                              placeholder="ডিফল্ট: primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Text Color */}
                    <div className="space-y-2">
                      <Label>টেক্সট কালার</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.category_text_color || "#1f2937"}
                          onChange={(e) => setSettings({ ...settings, category_text_color: e.target.value })}
                          className="w-14 h-10 p-1"
                        />
                        <Input
                          value={settings.category_text_color || ""}
                          onChange={(e) => setSettings({ ...settings, category_text_color: e.target.value })}
                          placeholder="ডিফল্ট: foreground"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      সংরক্ষণ করুন
                    </Button>
                  </CardContent>
                </Card>

                {/* Link to Category Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      ক্যাটাগরি ম্যানেজমেন্ট
                    </CardTitle>
                    <CardDescription>
                      নতুন ক্যাটাগরি যোগ করুন, ছবি আপলোড করুন এবং আইকন সেট করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="bg-gradient-brand">
                      <a href="/admin/categories">
                        ক্যাটাগরি ম্যানেজ করুন
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Header Customization Tab */}
            <TabsContent value="header">
              <div className="space-y-6">
                <LogoUploader
                  currentLogoUrl={settings.site_logo_url || ""}
                  onLogoChange={(url) => setSettings({ ...settings, site_logo_url: url })}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📢 টপ বার মার্কি মেসেজ</CardTitle>
                    <CardDescription>হেডারের উপরে স্ক্রল হওয়া মেসেজগুলো</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="topbar_messages">
                        মেসেজ লিস্ট (প্রতি লাইনে একটি অথবা <code>|</code> দিয়ে আলাদা করুন) — HTML ও inline CSS সাপোর্টেড
                      </Label>
                      <textarea
                        id="topbar_messages"
                        value={(settings as any).topbar_messages ?? ""}
                        onChange={(e) => setSettings({ ...settings, topbar_messages: e.target.value } as any)}
                        placeholder={"👉 <b style='color:#fde047'>টাকা হাতে পেয়ে দেখে টাকা দিন</b>\n🏆 <span style='color:#22d3ee'>১০০% কোয়ালিটি পণ্য</span>\n🔁 ৭ দিনের রিটার্ন/এক্সচেঞ্জ\n🚚 হোম ডেলিভারি সারা বাংলাদেশে"}
                        rows={6}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                      />
                      <p className="text-xs text-muted-foreground">
                        ইমোজি ও HTML ট্যাগ ব্যবহার করতে পারেন। উদাহরণ: <code>&lt;b style="color:#fde047"&gt;টেক্সট&lt;/b&gt;</code> অথবা <code>&lt;span style="font-size:14px;color:#22d3ee"&gt;টেক্সট&lt;/span&gt;</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Header Menu Items Manager */}
                {(() => {
                  let items: Array<{ label_bn: string; label_en: string; url?: string; type?: string }> = [];
                  try {
                    const parsed = JSON.parse((settings as any).header_menu_items || "[]");
                    if (Array.isArray(parsed)) items = parsed;
                  } catch {}
                  // Auto-inject Categories system item if missing
                  if (!items.some((it) => it?.type === "categories")) {
                    const insertAt = Math.min(2, items.length);
                    items = [
                      ...items.slice(0, insertAt),
                      { type: "categories", label_bn: "ক্যাটেগরি", label_en: "Categories" },
                      ...items.slice(insertAt),
                    ];
                  }
                  const update = (next: typeof items) =>
                    setSettings({ ...settings, header_menu_items: JSON.stringify(next) } as any);
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">🧭 হেডার মেনু আইটেম</CardTitle>
                        <CardDescription>
                          ডেস্কটপ হেডারের মাঝখানে দেখানো মেনু লিংকগুলো। লেবেল (বাংলা/ইংরেজি) ও URL দিন।
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {items.length === 0 && (
                          <p className="text-sm text-muted-foreground">কোনো মেনু আইটেম নেই। নিচে থেকে যোগ করুন।</p>
                        )}
                        {items.map((item, idx) => {
                          const isSystem = item?.type === "categories";
                          return (
                          <div key={idx} className={`grid grid-cols-1 md:grid-cols-[1fr,1fr,1.5fr,auto] gap-2 items-end p-3 border rounded-lg ${isSystem ? "bg-muted/40" : ""}`}>
                            <div className="space-y-1">
                              <Label className="text-xs">লেবেল (বাংলা){isSystem && " 🔒"}</Label>
                              <Input
                                value={item.label_bn || ""}
                                disabled={isSystem}
                                onChange={(e) => {
                                  const next = [...items];
                                  next[idx] = { ...item, label_bn: e.target.value };
                                  update(next);
                                }}
                                placeholder="হোম"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Label (English){isSystem && " 🔒"}</Label>
                              <Input
                                value={item.label_en || ""}
                                disabled={isSystem}
                                onChange={(e) => {
                                  const next = [...items];
                                  next[idx] = { ...item, label_en: e.target.value };
                                  update(next);
                                }}
                                placeholder="Home"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{isSystem ? "টাইপ" : "URL / লিঙ্ক"}</Label>
                              <Input
                                value={isSystem ? "📂 সব ক্যাটেগরি (ড্রপডাউন)" : (item.url || "")}
                                disabled={isSystem}
                                onChange={(e) => {
                                  const next = [...items];
                                  next[idx] = { ...item, url: e.target.value };
                                  update(next);
                                }}
                                placeholder="/products"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                disabled={idx === 0}
                                onClick={() => {
                                  const next = [...items];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  update(next);
                                }}
                                title="উপরে নিন"
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                disabled={idx === items.length - 1}
                                onClick={() => {
                                  const next = [...items];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                  update(next);
                                }}
                                title="নিচে নিন"
                              >
                                ↓
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                disabled={isSystem}
                                onClick={() => update(items.filter((_, i) => i !== idx))}
                                title={isSystem ? "সিস্টেম আইটেম মুছা যাবে না" : "মুছুন"}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                          );
                        })}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => update([...items, { label_bn: "", label_en: "", url: "/" }])}
                        >
                          + নতুন মেনু আইটেম যোগ করুন
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })()}

                <HeaderCustomizer
                  headerBgColor={settings.header_bg_color || "#0f172a"}
                  headerTextColor={settings.header_text_color || "#ffffff"}
                  topbarBgColor={settings.topbar_bg_color || ""}
                  topbarTextColor={settings.topbar_text_color || ""}
                  topbarGradientFrom={settings.topbar_gradient_from || ""}
                  topbarGradientTo={settings.topbar_gradient_to || ""}
                  topbarGradientDirection={settings.topbar_gradient_direction || "to right"}
                  catnavBgColor={settings.header_catnav_bg || ""}
                  catnavTextColor={settings.header_catnav_text || ""}
                  searchBgColor={settings.header_search_bg || ""}
                  searchTextColor={settings.header_search_text || ""}
                  badgeBgColor={settings.header_badge_bg || ""}
                  badgeTextColor={settings.header_badge_text || ""}
                  hoverBgColor={settings.header_hover_bg || ""}
                  hotdealColor={settings.header_hotdeal_color || ""}
                  topbarMessages={(settings as any).topbar_messages || ""}
                  siteName={settings.site_name || ""}
                  siteLogoUrl={settings.site_logo_url || ""}
                  siteLogoText={settings.site_logo_text || ""}
                  menuItems={(() => {
                    try {
                      const parsed = JSON.parse((settings as any).header_menu_items || "[]");
                      const arr = Array.isArray(parsed) ? parsed : [];
                      if (!arr.some((it: any) => it?.type === "categories")) {
                        const at = Math.min(2, arr.length);
                        arr.splice(at, 0, { type: "categories", label_bn: "ক্যাটেগরি", label_en: "Categories" });
                      }
                      return arr;
                    } catch { return []; }
                  })()}
                  onHeaderBgChange={(color) => setSettings({ ...settings, header_bg_color: color })}
                  onHeaderTextChange={(color) => setSettings({ ...settings, header_text_color: color })}
                  onTopbarBgChange={(color) => setSettings({ ...settings, topbar_bg_color: color })}
                  onTopbarTextChange={(color) => setSettings({ ...settings, topbar_text_color: color })}
                  onTopbarGradientFromChange={(color) => setSettings({ ...settings, topbar_gradient_from: color })}
                  onTopbarGradientToChange={(color) => setSettings({ ...settings, topbar_gradient_to: color })}
                  onTopbarGradientDirectionChange={(dir) => setSettings({ ...settings, topbar_gradient_direction: dir })}
                  onCatnavBgChange={(color) => setSettings({ ...settings, header_catnav_bg: color })}
                  onCatnavTextChange={(color) => setSettings({ ...settings, header_catnav_text: color })}
                  onSearchBgChange={(color) => setSettings({ ...settings, header_search_bg: color })}
                  onSearchTextChange={(color) => setSettings({ ...settings, header_search_text: color })}
                  onBadgeBgChange={(color) => setSettings({ ...settings, header_badge_bg: color })}
                  onBadgeTextChange={(color) => setSettings({ ...settings, header_badge_text: color })}
                  onHoverBgChange={(color) => setSettings({ ...settings, header_hover_bg: color })}
                  onHotdealColorChange={(color) => setSettings({ ...settings, header_hotdeal_color: color })}
                />
              </div>
            </TabsContent>

            {/* Tracking Settings Tab */}
            <TabsContent value="tracking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    ট্র্যাকিং সেটিংস
                  </CardTitle>
                  <CardDescription>
                    অর্ডার ক্যান্সেলেশন ও অন্যান্য ট্র্যাকিং ইভেন্ট নিয়ন্ত্রণ করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">ক্যান্সেলেশন ট্র্যাকিং</Label>
                      <p className="text-sm text-muted-foreground">
                        অর্ডার বাতিল হলে স্বয়ংক্রিয়ভাবে DataLayer-এ ক্যান্সেলেশন ইভেন্ট পাঠানো হবে
                      </p>
                    </div>
                    <Select
                      value={settings.cancel_tracking_enabled}
                      onValueChange={(value) => setSettings({ ...settings, cancel_tracking_enabled: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">সক্রিয়</SelectItem>
                        <SelectItem value="false">নিষ্ক্রিয়</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Facebook Pixel + Conversion API */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Facebook Pixel + Conversion API</Label>
                        <p className="text-sm text-muted-foreground">
                          সরাসরি Pixel ID, Access Token ও Test Event Code দিয়ে ব্রাউজার + সার্ভার ইভেন্ট পাঠাবে।
                          GTM ব্যবহার করলে এটি বন্ধ রাখুন (DataLayer থেকে GTM নিজেই ফায়ার করবে)।
                        </p>
                      </div>
                      <Select
                        value={settings.fb_pixel_enabled || "false"}
                        onValueChange={(v) => setSettings({ ...settings, fb_pixel_enabled: v } as any)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">সক্রিয়</SelectItem>
                          <SelectItem value="false">নিষ্ক্রিয়</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fb_pixel_id">Pixel ID</Label>
                        <Input
                          id="fb_pixel_id"
                          placeholder="123456789012345"
                          value={settings.fb_pixel_id || ""}
                          onChange={(e) => setSettings({ ...settings, fb_pixel_id: e.target.value } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fb_pixel_test_event_code">Test Event Code (অপশনাল)</Label>
                        <Input
                          id="fb_pixel_test_event_code"
                          placeholder="TEST12345"
                          value={settings.fb_pixel_test_event_code || ""}
                          onChange={(e) => setSettings({ ...settings, fb_pixel_test_event_code: e.target.value } as any)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="fb_pixel_access_token">Access Token (Conversion API)</Label>
                        <Input
                          id="fb_pixel_access_token"
                          type="password"
                          placeholder="EAA..."
                          value={settings.fb_pixel_access_token || ""}
                          onChange={(e) => setSettings({ ...settings, fb_pixel_access_token: e.target.value } as any)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Events Manager → Settings → Conversions API → Generate access token
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">সাপোর্টেড স্ট্যান্ডার্ড ইভেন্টস (Ecommerce)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["PageView","ViewContent","Search","AddToCart","AddToWishlist","InitiateCheckout","AddPaymentInfo","Purchase","Lead","CompleteRegistration"].map(ev => (
                          <span key={ev} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px]">{ev}</span>
                        ))}
                      </div>
                      <p className="mt-2">
                        সব ইভেন্ট <code>event_id</code> সহ পাঠানো হয় — Pixel ও CAPI এর মধ্যে অটো ডিডুপ্লিকেশন হয়।
                      </p>
                    </div>
                  </div>

                  {/* TikTok Pixel + Events API */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">TikTok Pixel + Events API</Label>
                        <p className="text-sm text-muted-foreground">
                          সরাসরি TikTok Pixel ID, Access Token ও Test Event Code দিয়ে ব্রাউজার + সার্ভার ইভেন্ট পাঠাবে।
                          GTM ব্যবহার করলে এটি বন্ধ রাখুন (DataLayer থেকে GTM নিজেই ফায়ার করবে)।
                        </p>
                      </div>
                      <Select
                        value={settings.tiktok_pixel_enabled || "false"}
                        onValueChange={(v) => setSettings({ ...settings, tiktok_pixel_enabled: v } as any)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">সক্রিয়</SelectItem>
                          <SelectItem value="false">নিষ্ক্রিয়</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_pixel_id">Pixel ID</Label>
                        <Input
                          id="tiktok_pixel_id"
                          placeholder="C4XXXXXXXXXXXXXXXX"
                          value={settings.tiktok_pixel_id || ""}
                          onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_pixel_test_event_code">Test Event Code (অপশনাল)</Label>
                        <Input
                          id="tiktok_pixel_test_event_code"
                          placeholder="TEST12345"
                          value={settings.tiktok_pixel_test_event_code || ""}
                          onChange={(e) => setSettings({ ...settings, tiktok_pixel_test_event_code: e.target.value } as any)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="tiktok_pixel_access_token">Access Token (Events API)</Label>
                        <Input
                          id="tiktok_pixel_access_token"
                          type="password"
                          placeholder="ttok-..."
                          value={settings.tiktok_pixel_access_token || ""}
                          onChange={(e) => setSettings({ ...settings, tiktok_pixel_access_token: e.target.value } as any)}
                        />
                        <p className="text-xs text-muted-foreground">
                          TikTok Events Manager → Settings → Events API → Generate access token
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">সাপোর্টেড স্ট্যান্ডার্ড ইভেন্টস (Ecommerce)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Pageview","ViewContent","Search","AddToCart","AddToWishlist","InitiateCheckout","AddPaymentInfo","CompletePayment","SubmitForm","Contact","CancelOrder"].map(ev => (
                          <span key={ev} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px]">{ev}</span>
                        ))}
                      </div>
                      <p className="mt-2">
                        সব ইভেন্ট <code>event_id</code> সহ পাঠানো হয় — Pixel ও Events API এর মধ্যে অটো ডিডুপ্লিকেশন হয়।
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings Tab */}
            <TabsContent value="account">
              <AccountSettings />
            </TabsContent>

            {/* Checkout Settings Tab */}
            <TabsContent value="checkout">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    চেকআউট সেটিংস
                  </CardTitle>
                  <CardDescription>চেকআউট পেইজের বিভিন্ন ফিল্ড ও অপশন নিয়ন্ত্রণ করুন</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">থানা ও জেলা ফিল্ড</Label>
                      <p className="text-sm text-muted-foreground">চেকআউটে থানা ও জেলা ইনপুট দেখাবে</p>
                    </div>
                    <Switch
                      checked={settings.checkout_thana_district_enabled === "true"}
                      onCheckedChange={(c) => setSettings({ ...settings, checkout_thana_district_enabled: c ? "true" : "false" })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">কুপন কোড ফিল্ড</Label>
                      <p className="text-sm text-muted-foreground">চেকআউটে কুপন কোড ইনপুট দেখাবে</p>
                    </div>
                    <Switch
                      checked={settings.checkout_coupon_enabled === "true"}
                      onCheckedChange={(c) => setSettings({ ...settings, checkout_coupon_enabled: c ? "true" : "false" })}
                    />
                  </div>

                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">টার্মস ও কন্ডিশন</Label>
                        <p className="text-sm text-muted-foreground">অর্ডার করতে টার্মস টিক করা বাধ্যতামূলক</p>
                      </div>
                      <Switch
                        checked={settings.checkout_terms_enabled === "true"}
                        onCheckedChange={(c) => setSettings({ ...settings, checkout_terms_enabled: c ? "true" : "false" })}
                      />
                    </div>
                    {settings.checkout_terms_enabled === "true" && (
                      <div className="space-y-3">
                        <Label htmlFor="checkout_terms_text">চেকবক্সের টেক্সট (লিংকের আগে)</Label>
                        <Textarea
                          id="checkout_terms_text"
                          value={settings.checkout_terms_text}
                          onChange={(e) => setSettings({ ...settings, checkout_terms_text: e.target.value })}
                          placeholder="যেমন: I agree to workupjobs"
                          rows={3}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_link_label">প্রথম লিংকের নাম</Label>
                            <Input
                              id="checkout_terms_link_label"
                              value={settings.checkout_terms_link_label}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_link_label: e.target.value })}
                              placeholder="Terms of Service"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_page_url">প্রথম লিংকের URL</Label>
                            <Input
                              id="checkout_terms_page_url"
                              value={settings.checkout_terms_page_url}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_page_url: e.target.value })}
                              placeholder="/page/terms"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_separator">সংযোগ শব্দ</Label>
                            <Input
                              id="checkout_terms_separator"
                              value={settings.checkout_terms_separator}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_separator: e.target.value })}
                              placeholder="and / এবং"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_suffix">শেষের চিহ্ন</Label>
                            <Input
                              id="checkout_terms_suffix"
                              value={settings.checkout_terms_suffix}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_suffix: e.target.value })}
                              placeholder="."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_link2_label">দ্বিতীয় লিংকের নাম</Label>
                            <Input
                              id="checkout_terms_link2_label"
                              value={settings.checkout_terms_link2_label}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_link2_label: e.target.value })}
                              placeholder="Privacy Policy (খালি রাখলে দেখাবে না)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkout_terms_link2_url">দ্বিতীয় লিংকের URL</Label>
                            <Input
                              id="checkout_terms_link2_url"
                              value={settings.checkout_terms_link2_url}
                              onChange={(e) => setSettings({ ...settings, checkout_terms_link2_url: e.target.value })}
                              placeholder="/page/privacy"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">উদাহরণ: "I agree to workupjobs" <span className="text-sky-600">Terms of Service</span> and <span className="text-sky-600">Privacy Policy</span>.</p>
                      </div>
                    )}
                  </div>

                  {/* Checkout Colors */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <div>
                      <Label className="text-base font-semibold">হেডার টেক্সট</Label>
                      <p className="text-sm text-muted-foreground">চেকআউট পেইজের উপরের টাইটেল ও সাব-টাইটেল</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkout_header_title">টাইটেল</Label>
                        <Input
                          id="checkout_header_title"
                          value={settings.checkout_header_title}
                          onChange={(e) => setSettings({ ...settings, checkout_header_title: e.target.value })}
                          placeholder="Place Order"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout_header_subtitle">সাব-টাইটেল</Label>
                        <Input
                          id="checkout_header_subtitle"
                          value={settings.checkout_header_subtitle}
                          onChange={(e) => setSettings({ ...settings, checkout_header_subtitle: e.target.value })}
                          placeholder="Fast delivery guaranteed!"
                        />
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold">চেকআউট পেইজ কালার</Label>
                      <p className="text-sm text-muted-foreground">প্রতিটি কম্পোনেন্টের কালার কাস্টমাইজ করুন (খালি রাখলে ডিফল্ট)</p>
                    </div>
                    {([
                      ["checkout_page_bg", "পেইজ ব্যাকগ্রাউন্ড"],
                      ["checkout_card_bg", "কার্ড ব্যাকগ্রাউন্ড"],
                      ["checkout_header_bg_from", "হেডার গ্রেডিয়েন্ট (শুরু)"],
                      ["checkout_header_bg_to", "হেডার গ্রেডিয়েন্ট (শেষ)"],
                      ["checkout_heading_color", "হেডিং (টাইটেল) কালার"],
                      ["checkout_subheading_color", "সাব-হেডিং কালার"],
                      ["checkout_label_color", "লেবেল কালার"],
                      ["checkout_field_bg", "ফিল্ড ব্যাকগ্রাউন্ড"],
                      ["checkout_field_border", "ফিল্ড বর্ডার"],
                      ["checkout_field_text", "ফিল্ড টেক্সট"],
                      ["checkout_field_placeholder", "প্লেসহোল্ডার কালার"],
                      ["checkout_option_bg", "Delivery/Payment বাটন BG"],
                      ["checkout_option_border", "Delivery/Payment বাটন বর্ডার"],
                      ["checkout_option_text", "Delivery/Payment বাটন টেক্সট"],
                      ["checkout_option_active_from", "অ্যাক্টিভ বাটন গ্রেডিয়েন্ট (শুরু)"],
                      ["checkout_option_active_to", "অ্যাক্টিভ বাটন গ্রেডিয়েন্ট (শেষ)"],
                      ["checkout_option_active_text", "অ্যাক্টিভ বাটন টেক্সট"],
                      ["checkout_summary_bg", "অর্ডার সামারি BG"],
                      ["checkout_summary_border", "অর্ডার সামারি বর্ডার"],
                      ["checkout_summary_text", "অর্ডার সামারি টেক্সট"],
                      ["checkout_total_color", "টোটাল প্রাইস কালার"],
                      ["checkout_terms_bg", "টার্মস ব্যাকগ্রাউন্ড"],
                      ["checkout_terms_border", "টার্মস বর্ডার"],
                      ["checkout_terms_text_color", "টার্মস টেক্সট"],
                      ["checkout_terms_link_color", "টার্মস লিংক কালার"],
                      ["checkout_submit_from", "Submit বাটন গ্রেডিয়েন্ট (শুরু)"],
                      ["checkout_submit_to", "Submit বাটন গ্রেডিয়েন্ট (শেষ)"],
                      ["checkout_submit_text", "Submit বাটন টেক্সট"],
                    ] as [keyof AllSettings, string][]).reduce<JSX.Element[][]>((rows, item, idx) => {
                      const row = Math.floor(idx / 2);
                      if (!rows[row]) rows[row] = [];
                       const defaultVal = (defaultSettings[item[0]] as string) || "";
                       const currentVal = (settings[item[0]] as string) ?? "";
                       const effectiveVal = currentVal !== "" ? currentVal : defaultVal;
                       rows[row].push(
                         <div key={item[0]} className="space-y-2">
                           <Label className="text-sm">{item[1]}</Label>
                           <div className="flex gap-2">
                             <Input
                               type="color"
                               value={effectiveVal || "#ffffff"}
                               onChange={(e) => setSettings({ ...settings, [item[0]]: e.target.value } as any)}
                               className="w-14 h-10 p-1"
                             />
                             <Input
                               value={effectiveVal}
                               onChange={(e) => setSettings({ ...settings, [item[0]]: e.target.value } as any)}
                               placeholder={defaultVal || "ডিফল্ট"}
                             />
                           </div>
                         </div>
                       );
                      return rows;
                    }, []).map((row, i) => (
                      <div key={i} className="grid sm:grid-cols-2 gap-4">{row}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            {/* Bottom Navigation Tab */}
            <TabsContent value="bottom-nav">
              <BottomNavManager
                settings={{
                  bottom_nav_home_link: settings.bottom_nav_home_link || "/",
                  bottom_nav_shop_link: settings.bottom_nav_shop_link || "/products",
                  bottom_nav_whatsapp_link: settings.bottom_nav_whatsapp_link || "https://wa.me/8801XXXXXXXXX",
                  bottom_nav_account_link: settings.bottom_nav_account_link || "/dashboard",
                  bottom_nav_offers_link: settings.bottom_nav_offers_link || "/products?featured=true",
                }}
                onSettingsChange={(key, value) => setSettings({ ...settings, [key]: value })}
              />
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer">
              <div className="space-y-6">
                {/* Footer Contact & Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      ফুটার তথ্য ও যোগাযোগ
                    </CardTitle>
                    <CardDescription>ফুটারে প্রদর্শিত ফোন, ঠিকানা, সোশ্যাল লিঙ্ক ইত্যাদি পরিবর্তন করুন</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগ তথ্য</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="footer_phone">ফোন নম্বর</Label>
                          <Input
                            id="footer_phone"
                            value={settings.footer_phone}
                            onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })}
                            placeholder="01700-000000"
                          />
                          <p className="text-xs text-muted-foreground">ফুটার ও কল বাটনে এই নম্বর দেখাবে</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="footer_email">ইমেইল</Label>
                          <Input
                            id="footer_email"
                            value={settings.footer_email}
                            onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })}
                            placeholder="info@example.com"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="footer_address">ঠিকানা</Label>
                          <Input
                            id="footer_address"
                            value={settings.footer_address}
                            onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })}
                            placeholder="ঢাকা, বাংলাদেশ"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">সোশ্যাল মিডিয়া লিঙ্ক</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="social_facebook">Facebook URL</Label>
                          <Input
                            id="social_facebook"
                            value={settings.social_facebook}
                            onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                            placeholder="https://facebook.com/yourpage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_instagram">Instagram URL</Label>
                          <Input
                            id="social_instagram"
                            value={settings.social_instagram}
                            onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                            placeholder="https://instagram.com/yourpage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_youtube">YouTube URL</Label>
                          <Input
                            id="social_youtube"
                            value={settings.social_youtube}
                            onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                            placeholder="https://youtube.com/yourchannel"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_tiktok">TikTok URL</Label>
                          <Input
                            id="social_tiktok"
                            value={settings.social_tiktok || ""}
                            onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value } as any)}
                            placeholder="https://tiktok.com/@yourpage"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Developer & Copyright */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">কপিরাইট ও ডেভেলপার</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="copyright_text">কপিরাইট টেক্সট</Label>
                          <Input
                            id="copyright_text"
                            value={settings.copyright_text}
                            onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                            placeholder="© 2024 সাজিব এন্টারপ্রাইজ"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="developer_text">ডেভেলপার টেক্সট</Label>
                          <Input
                            id="developer_text"
                            value={settings.developer_text}
                            onChange={(e) => setSettings({ ...settings, developer_text: e.target.value })}
                            placeholder="Developed by Rebuild It"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Footer Menu Manager */}
                <FooterManager
                  quickLinks={(() => {
                    try {
                      return JSON.parse(settings.footer_quick_links || "[]") as FooterLink[];
                    } catch {
                      return [];
                    }
                  })()}
                  customerServiceLinks={(() => {
                    try {
                      return JSON.parse(settings.footer_customer_service_links || "[]") as FooterLink[];
                    } catch {
                      return [];
                    }
                  })()}
                  onQuickLinksChange={(links) => 
                    setSettings({ ...settings, footer_quick_links: JSON.stringify(links) })
                  }
                  onCustomerServiceChange={(links) => 
                    setSettings({ ...settings, footer_customer_service_links: JSON.stringify(links) })
                  }
                />
              </div>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    শিপিং সেটিংস
                  </CardTitle>
                  <CardDescription>
                    ডিফল্ট শিপিং চার্জ সেট করুন। প্রোডাক্টে আলাদা সেট না করলে এই চার্জ প্রযোজ্য হবে।
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inside_dhaka">ঢাকার ভিতরে (৳)</Label>
                      <Input
                        id="inside_dhaka"
                        type="number"
                        value={settings.default_shipping_inside_dhaka}
                        onChange={(e) =>
                          setSettings({ ...settings, default_shipping_inside_dhaka: e.target.value })
                        }
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outside_dhaka">ঢাকার বাহিরে (৳)</Label>
                      <Input
                        id="outside_dhaka"
                        type="number"
                        value={settings.default_shipping_outside_dhaka}
                        onChange={(e) =>
                          setSettings({ ...settings, default_shipping_outside_dhaka: e.target.value })
                        }
                        placeholder="120"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      অনলাইন পেমেন্ট নাম্বার
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      চেকআউট পেজে কাস্টমার এই নাম্বারগুলো কপি করতে পারবে।
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment_bkash_number">বিকাশ নাম্বার</Label>
                        <Input
                          id="payment_bkash_number"
                          value={settings.payment_bkash_number}
                          onChange={(e) => setSettings({ ...settings, payment_bkash_number: e.target.value })}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_nagad_number">নগদ নাম্বার</Label>
                        <Input
                          id="payment_nagad_number"
                          value={settings.payment_nagad_number}
                          onChange={(e) => setSettings({ ...settings, payment_nagad_number: e.target.value })}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_rocket_number">রকেট নাম্বার</Label>
                        <Input
                          id="payment_rocket_number"
                          value={settings.payment_rocket_number}
                          onChange={(e) => setSettings({ ...settings, payment_rocket_number: e.target.value })}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Duplicate Order Block Tab */}
            <TabsContent value="duplicate-block">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldX className="h-5 w-5" />
                    ডুপ্লিকেট অর্ডার ব্লক
                  </CardTitle>
                  <CardDescription>
                    একই কাস্টমারের পুনরায় অর্ডার করা সাময়িকভাবে ব্লক করুন। এটি ফেইক অর্ডার প্রতিরোধে সাহায্য করে।
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">ডুপ্লিকেট ব্লক সক্রিয়</Label>
                      <p className="text-sm text-muted-foreground">
                        এটি বন্ধ থাকলে কাস্টমার যেকোনো সময় অর্ডার করতে পারবে
                      </p>
                    </div>
                    <Select
                      value={settings.duplicate_block_enabled}
                      onValueChange={(value) => setSettings({ ...settings, duplicate_block_enabled: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">সক্রিয়</SelectItem>
                        <SelectItem value="false">নিষ্ক্রিয়</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Block Time */}
                  <div className="space-y-2">
                    <Label htmlFor="block_time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      ব্লক সময় (মিনিট)
                    </Label>
                    <Input
                      id="block_time"
                      type="number"
                      value={settings.duplicate_block_time}
                      onChange={(e) => setSettings({ ...settings, duplicate_block_time: e.target.value })}
                      placeholder="30"
                      min="1"
                      max="1440"
                    />
                    <p className="text-xs text-muted-foreground">
                      অর্ডার সফল হওয়ার পর এই সময় পর্যন্ত পুনরায় অর্ডার করা যাবে না। (১ থেকে ১৪৪০ মিনিট)
                    </p>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp নম্বর
                    </Label>
                    <Input
                      id="whatsapp_number"
                      type="text"
                      value={settings.duplicate_block_whatsapp}
                      onChange={(e) => setSettings({ ...settings, duplicate_block_whatsapp: e.target.value })}
                      placeholder="+8801XXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      ব্লক হলে কাস্টমার এই নম্বরে WhatsApp মেসেজ পাঠাতে পারবে
                    </p>
                  </div>

                  {/* Error Message */}
                  <div className="space-y-2">
                    <Label htmlFor="block_message">কাস্টম মেসেজ</Label>
                    <Textarea
                      id="block_message"
                      value={settings.duplicate_block_message}
                      onChange={(e) => setSettings({ ...settings, duplicate_block_message: e.target.value })}
                      placeholder="আপনি ইতিমধ্যে একটি অর্ডার করেছেন..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      ব্লক হলে কাস্টমারকে এই মেসেজ দেখানো হবে
                    </p>
                  </div>

                  <Separator />

                  {/* Support Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="support_phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      সাপোর্ট ফোন নম্বর
                    </Label>
                    <Input
                      id="support_phone"
                      type="text"
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      অর্ডার সফল হলে থ্যাংক ইউ পেজে এই নম্বরটি দেখানো হবে
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courier Tab */}
            <TabsContent value="courier">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">স্টেডফাস্ট কুরিয়ার</CardTitle>
                    <CardDescription>
                      স্টেডফাস্ট মার্চেন্ট প্যানেল থেকে API Key ও Secret Key সংগ্রহ করুন।
                      <a 
                        href="https://steadfast.com.bd" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary ml-1 hover:underline"
                      >
                        steadfast.com.bd
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {renderSecretInput("steadfast_api_key", "API Key", "Enter Steadfast API Key")}
                      {renderSecretInput("steadfast_secret_key", "Secret Key", "Enter Steadfast Secret Key")}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">পাঠাও কুরিয়ার</CardTitle>
                    <CardDescription>
                      পাঠাও মার্চেন্ট প্যানেল থেকে API credentials সংগ্রহ করুন।
                      <a 
                        href="https://merchant.pathao.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary ml-1 hover:underline"
                      >
                        merchant.pathao.com
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {renderSecretInput("pathao_client_id", "Client ID", "Enter Pathao Client ID")}
                      {renderSecretInput("pathao_client_secret", "Client Secret", "Enter Pathao Client Secret")}
                      {renderSecretInput("pathao_username", "Username/Email", "Enter Pathao Username")}
                      {renderSecretInput("pathao_password", "Password", "Enter Pathao Password")}
                      <div className="space-y-2">
                        <Label htmlFor="pathao_store_id">Store ID</Label>
                        <Input
                          id="pathao_store_id"
                          value={settings.pathao_store_id}
                          onChange={(e) => setSettings({ ...settings, pathao_store_id: e.target.value })}
                          placeholder="Enter Pathao Store ID"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">BD Courier (রেসিও চেক)</CardTitle>
                    <CardDescription>
                      কাস্টমারের কুরিয়ার অর্ডার রেসিও চেক করার জন্য BD Courier API ব্যবহার করা হয়।
                      <a 
                        href="https://bdcourier.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary ml-1 hover:underline"
                      >
                        bdcourier.com
                      </a>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderSecretInput("bdcourier_api_key", "API Key", "Enter BD Courier API Key")}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Custom Code Tab */}
            <TabsContent value="custom-code">
              <div className="space-y-4">
                {/* Info Card */}
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>💡 টিপস:</strong> শুধু Google Tag Manager (GTM) এর কোড হেডারে বসান। 
                      DataLayer এ অটোমেটিক ডাটা পুশ হবে - PageView, ViewContent, AddToCart, InitiateCheckout, Purchase ইভেন্ট সহ।
                      GTM থেকে ট্রিগার সেটআপ করে Facebook, Google Ads, TikTok সব প্ল্যাটফর্মে কনভার্সন পাঠাতে পারবেন।
                    </p>
                  </CardContent>
                </Card>

                {/* Header Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      হেডার কোড (&lt;head&gt;)
                    </CardTitle>
                    <CardDescription>
                      এই কোড পেজের <code>&lt;head&gt;</code> সেকশনে যোগ হবে। 
                      Google Tag Manager বা অন্যান্য ট্র্যাকিং স্ক্রিপ্ট এখানে দিন।
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>`}
                      value={settings.header_code}
                      onChange={(e) => setSettings({ ...settings, header_code: e.target.value })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Body Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      বডি কোড (&lt;body&gt; শুরুতে)
                    </CardTitle>
                    <CardDescription>
                      এই কোড <code>&lt;body&gt;</code> ট্যাগের ঠিক পরে যোগ হবে। 
                      GTM noscript iframe এখানে দিন।
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={`<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
                      value={settings.body_code}
                      onChange={(e) => setSettings({ ...settings, body_code: e.target.value })}
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Footer Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      ফুটার কোড (&lt;/body&gt; আগে)
                    </CardTitle>
                    <CardDescription>
                      এই কোড <code>&lt;/body&gt;</code> ট্যাগের ঠিক আগে যোগ হবে। 
                      চ্যাট উইজেট বা অন্যান্য স্ক্রিপ্ট এখানে দিন।
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={`<!-- Chat Widget বা অন্যান্য স্ক্রিপ্ট -->
<script>
// Your custom scripts here
</script>`}
                      value={settings.footer_code}
                      onChange={(e) => setSettings({ ...settings, footer_code: e.target.value })}
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ইউজার খুঁজুন (নাম, ফোন, ID)..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="রোল ফিল্টার" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সকল রোল</SelectItem>
                        <SelectItem value="admin">অ্যাডমিন</SelectItem>
                        <SelectItem value="moderator">মডারেটর</SelectItem>
                        <SelectItem value="user">ইউজার</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      রোল যোগ করুন
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        মোট অ্যাডমিন
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">
                        {users.filter((u) => u.role === "admin").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        মোট মডারেটর
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-500">
                        {users.filter((u) => u.role === "moderator").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        মোট ইউজার
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Users Table */}
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ইউজার</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>ফোন</TableHead>
                              <TableHead>রোল</TableHead>
                              <TableHead>যোগ হয়েছে</TableHead>
                              <TableHead className="text-right">অ্যাকশন</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-muted-foreground">কোনো ইউজার নেই</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUsers.map((userItem) => {
                                const roleInfo = roleLabels[userItem.role];
                                return (
                                  <TableRow key={userItem.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                          {userItem.role === "admin" ? (
                                            <Shield className="h-5 w-5 text-red-500" />
                                          ) : userItem.role === "moderator" ? (
                                            <Shield className="h-5 w-5 text-blue-500" />
                                          ) : (
                                            <User className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {userItem.full_name || "নাম নেই"}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {userItem.user_id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>{userItem.phone || "-"}</TableCell>
                                    <TableCell>
                                      <Select
                                        value={userItem.role}
                                        onValueChange={(value: AppRole) =>
                                          handleUpdateRole(userItem.user_id, value)
                                        }
                                      >
                                        <SelectTrigger className="w-32">
                                          <Badge className={`${roleInfo.color} text-white`}>
                                            {roleInfo.label}
                                          </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">অ্যাডমিন</SelectItem>
                                          <SelectItem value="moderator">মডারেটর</SelectItem>
                                          <SelectItem value="user">ইউজার</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {new Date(userItem.created_at).toLocaleDateString("bn-BD")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedUser(userItem);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Add Role Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ইউজার রোল যোগ করুন</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>User ID (UUID)</Label>
                        <Input
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          ইউজারের UUID দিন। এটি প্রোফাইল বা অর্ডার থেকে পাওয়া যাবে।
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>রোল</Label>
                        <Select value={newUserRole} onValueChange={(v: AppRole) => setNewUserRole(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">অ্যাডমিন</SelectItem>
                            <SelectItem value="moderator">মডারেটর</SelectItem>
                            <SelectItem value="user">ইউজার</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        বাতিল
                      </Button>
                      <Button onClick={handleAddUser} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        যোগ করুন
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Role Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>রোল মুছে ফেলতে চান?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {selectedUser?.full_name || "এই ইউজার"} এর রোল মুছে ফেললে সে সাধারণ ইউজার হয়ে যাবে।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>বাতিল</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRole}>মুছে ফেলুন</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TabsContent>

            {/* Blocked Users Tab */}
            <TabsContent value="blocked">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ফোন বা IP দিয়ে খুঁজুন..."
                      value={blockedSearchQuery}
                      onChange={(e) => setBlockedSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-destructive hover:bg-destructive/90">
                        <Plus className="h-4 w-4 mr-2" />
                        নতুন ব্লক
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>নতুন ব্লক যোগ করুন</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleBlockSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>ফোন নম্বর</Label>
                          <Input
                            value={blockFormData.phone}
                            onChange={(e) => setBlockFormData({ ...blockFormData, phone: e.target.value })}
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>IP অ্যাড্রেস</Label>
                          <Input
                            value={blockFormData.ip_address}
                            onChange={(e) => setBlockFormData({ ...blockFormData, ip_address: e.target.value })}
                            placeholder="192.168.1.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>কারণ</Label>
                          <Textarea
                            value={blockFormData.reason}
                            onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                            placeholder="ব্লক করার কারণ..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ব্লক টাইপ</Label>
                          <Select
                            value={blockFormData.block_type}
                            onValueChange={(value) => setBlockFormData({ ...blockFormData, block_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanent">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  স্থায়ী ব্লক
                                </div>
                              </SelectItem>
                              <SelectItem value="temporary">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  সাময়িক ব্লক
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {blockFormData.block_type === "temporary" && (
                          <div className="space-y-2">
                            <Label>ব্লক শেষ হওয়ার তারিখ</Label>
                            <Input
                              type="datetime-local"
                              value={blockFormData.blocked_until}
                              onChange={(e) => setBlockFormData({ ...blockFormData, blocked_until: e.target.value })}
                            />
                          </div>
                        )}
                        <DialogFooter>
                          <Button type="submit" className="bg-destructive" disabled={blockSaving}>
                            {blockSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ব্লক করুন
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Blocked Users Table */}
                {blockedLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredBlockedUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">কোনো ব্লকড ইউজার নেই</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ফোন</TableHead>
                              <TableHead>IP অ্যাড্রেস</TableHead>
                              <TableHead>কারণ</TableHead>
                              <TableHead>টাইপ</TableHead>
                              <TableHead>তারিখ</TableHead>
                              <TableHead className="text-right">অ্যাকশন</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBlockedUsers.map((blocked: any) => (
                              <TableRow key={blocked.id}>
                                <TableCell className="font-mono">
                                  {blocked.phone || "-"}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {blocked.ip_address || "-"}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {blocked.reason || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={blocked.block_type === "permanent" ? "destructive" : "secondary"}
                                  >
                                    {blocked.block_type === "permanent" ? (
                                      <>
                                        <Shield className="h-3 w-3 mr-1" />
                                        স্থায়ী
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3 mr-1" />
                                        সাময়িক
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(blocked.created_at).toLocaleDateString("bn-BD")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        আনব্লক
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>আনব্লক করতে চান?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          এই ইউজারকে আনব্লক করলে সে আবার অর্ডার করতে পারবে।
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleUnblock(blocked.id)}>
                                          আনব্লক
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Product Page Settings Tab */}
            <TabsContent value="product-page">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    প্রোডাক্ট পেজ কাস্টমাইজেশন
                  </CardTitle>
                  <CardDescription>
                    প্রোডাক্ট পেজের বাটন কালার, টেক্সট এবং স্টাইল পরিবর্তন করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add to Cart Button */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">কার্টে যোগ করুন বাটন</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_addtocart_label">বাটন টেক্সট</Label>
                        <Input
                          id="product_addtocart_label"
                          value={settings.product_addtocart_label || ""}
                          onChange={(e) => setSettings({ ...settings, product_addtocart_label: e.target.value })}
                          placeholder="কার্টে যোগ করুন"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_addtocart_bg">ব্যাকগ্রাউন্ড কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_addtocart_bg"
                            value={settings.product_addtocart_bg || "#7c3aed"}
                            onChange={(e) => setSettings({ ...settings, product_addtocart_bg: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_addtocart_bg || ""}
                            onChange={(e) => setSettings({ ...settings, product_addtocart_bg: e.target.value })}
                            placeholder="#7c3aed"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_addtocart_text">টেক্সট কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_addtocart_text"
                            value={settings.product_addtocart_text || "#ffffff"}
                            onChange={(e) => setSettings({ ...settings, product_addtocart_text: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_addtocart_text || ""}
                            onChange={(e) => setSettings({ ...settings, product_addtocart_text: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Now Button */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">অর্ডার করুন বাটন</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_order_label">বাটন টেক্সট</Label>
                        <Input
                          id="product_order_label"
                          value={settings.product_order_label || ""}
                          onChange={(e) => setSettings({ ...settings, product_order_label: e.target.value })}
                          placeholder="অর্ডার করুন"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_order_bg">ব্যাকগ্রাউন্ড কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_order_bg"
                            value={settings.product_order_bg || "#f97316"}
                            onChange={(e) => setSettings({ ...settings, product_order_bg: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_order_bg || ""}
                            onChange={(e) => setSettings({ ...settings, product_order_bg: e.target.value })}
                            placeholder="#f97316"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_order_text">টেক্সট কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_order_text"
                            value={settings.product_order_text || "#ffffff"}
                            onChange={(e) => setSettings({ ...settings, product_order_text: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_order_text || ""}
                            onChange={(e) => setSettings({ ...settings, product_order_text: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">WhatsApp বাটন</h3>
                    <div className="space-y-2">
                      <Label htmlFor="product_whatsapp_phone">WhatsApp নম্বর</Label>
                      <Input
                        id="product_whatsapp_phone"
                        value={settings.product_whatsapp_phone || ""}
                        onChange={(e) => setSettings({ ...settings, product_whatsapp_phone: e.target.value })}
                        placeholder="০১৭XX-XXXXXX (খালি রাখলে ডিফল্ট WhatsApp নম্বর ব্যবহার হবে)"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_whatsapp_label">বাটন টেক্সট</Label>
                        <Input
                          id="product_whatsapp_label"
                          value={settings.product_whatsapp_label || ""}
                          onChange={(e) => setSettings({ ...settings, product_whatsapp_label: e.target.value })}
                          placeholder="WhatsApp এ অর্ডার করুন"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_whatsapp_bg">ব্যাকগ্রাউন্ড কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_whatsapp_bg"
                            value={(settings as any).product_whatsapp_bg || "#ffffff"}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_bg: e.target.value } as any)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={(settings as any).product_whatsapp_bg || ""}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_bg: e.target.value } as any)}
                            placeholder="খালি রাখলে ট্রান্সপারেন্ট"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_whatsapp_border">বর্ডার কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_whatsapp_border"
                            value={settings.product_whatsapp_border || "#16a34a"}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_border: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_whatsapp_border || ""}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_border: e.target.value })}
                            placeholder="#16a34a"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_whatsapp_text">টেক্সট কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_whatsapp_text"
                            value={settings.product_whatsapp_text || "#16a34a"}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_text: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_whatsapp_text || ""}
                            onChange={(e) => setSettings({ ...settings, product_whatsapp_text: e.target.value })}
                            placeholder="#16a34a"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call Button */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">কল বাটন</h3>
                    <div className="space-y-2">
                      <Label htmlFor="product_call_phone">ফোন নম্বর</Label>
                      <Input
                        id="product_call_phone"
                        value={settings.product_call_phone || ""}
                        onChange={(e) => setSettings({ ...settings, product_call_phone: e.target.value })}
                        placeholder="০১৭XX-XXXXXX (খালি রাখলে ফুটারের নম্বর ব্যবহার হবে)"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product_call_bg">ব্যাকগ্রাউন্ড কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_call_bg"
                            value={(settings as any).product_call_bg || "#ffffff"}
                            onChange={(e) => setSettings({ ...settings, product_call_bg: e.target.value } as any)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={(settings as any).product_call_bg || ""}
                            onChange={(e) => setSettings({ ...settings, product_call_bg: e.target.value } as any)}
                            placeholder="খালি রাখলে ট্রান্সপারেন্ট"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_call_border">বর্ডার কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_call_border"
                            value={settings.product_call_border || "#7c3aed"}
                            onChange={(e) => setSettings({ ...settings, product_call_border: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_call_border || ""}
                            onChange={(e) => setSettings({ ...settings, product_call_border: e.target.value })}
                            placeholder="#7c3aed"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_call_text">টেক্সট কালার</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="product_call_text"
                            value={settings.product_call_text || "#7c3aed"}
                            onChange={(e) => setSettings({ ...settings, product_call_text: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.product_call_text || ""}
                            onChange={(e) => setSettings({ ...settings, product_call_text: e.target.value })}
                            placeholder="#7c3aed"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">WhatsApp নম্বর / লিঙ্ক</h3>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_number">WhatsApp নম্বর বা লিঙ্ক</Label>
                      <Input
                        id="whatsapp_number"
                        value={(settings as any).whatsapp_number || ""}
                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value } as any)}
                        placeholder="https://wa.me/8801XXXXXXXXX অথবা 01XXXXXXXXX"
                      />
                      <p className="text-xs text-muted-foreground">
                        সরাসরি WhatsApp লিঙ্ক (https://wa.me/...), শর্ট লিঙ্ক (wa.me/...) অথবা শুধু নম্বর দিতে পারবেন। খালি রাখলে ফোন নম্বর ব্যবহার হবে।
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">প্রিভিউ</h3>
                    <div className="p-4 bg-secondary/20 rounded-lg space-y-2 max-w-md">
                      {/* Order Now - Full width primary */}
                      <button
                        className="w-full h-11 px-4 text-sm sm:text-base font-semibold gap-2 rounded-full inline-flex items-center justify-center"
                        style={{
                          backgroundColor: settings.product_order_bg || "#16a34a",
                          color: settings.product_order_text || "#ffffff",
                        }}
                      >
                        🛒 <span className="truncate">{settings.product_order_label || "অর্ডার করুন"}</span>
                      </button>
                      {/* Add to Cart - Full width outline */}
                      <button
                        className="w-full h-11 px-4 text-sm sm:text-base font-semibold gap-2 rounded-full inline-flex items-center justify-center border-2"
                        style={{
                          backgroundColor: settings.product_addtocart_bg || "transparent",
                          color: settings.product_addtocart_text || "#16a34a",
                          borderColor: settings.product_addtocart_text || "#16a34a",
                        }}
                      >
                        🛒 <span className="truncate">{settings.product_addtocart_label || "কার্টে যোগ করুন"}</span>
                      </button>
                      {/* WhatsApp & Call side-by-side */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          className="w-full h-11 text-sm font-semibold rounded-full border-2 inline-flex items-center justify-center gap-2"
                          style={{
                            borderColor: settings.product_whatsapp_border || "#16a34a",
                            color: ((settings as any).product_whatsapp_bg && (settings as any).product_whatsapp_bg !== 'transparent') ? (settings.product_whatsapp_text || "#16a34a") : "#ffffff",
                            backgroundColor: ((settings as any).product_whatsapp_bg && (settings as any).product_whatsapp_bg !== 'transparent') ? (settings as any).product_whatsapp_bg : "#16a34a",
                          }}
                        >
                          📱 <span className="truncate">WhatsApp</span>
                        </button>
                        <button
                          className="w-full h-11 text-sm font-semibold rounded-full border-2 inline-flex items-center justify-center gap-2"
                          style={{
                            borderColor: settings.product_call_border || "#7c3aed",
                            color: settings.product_call_text || "#7c3aed",
                            backgroundColor: (settings as any).product_call_bg || "transparent",
                          }}
                        >
                          📞 <span className="truncate">কল করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Homepage Product Sections Tab */}
            <TabsContent value="homepage-sections">
              <div className="space-y-6">
              {/* Slider Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    স্লাইডার
                  </CardTitle>
                  <CardDescription>হোমপেজের হিরো স্লাইডার ম্যানেজ করুন</CardDescription>
                </CardHeader>
                <CardContent>
                  <SliderManager
                    sliderImages={(() => {
                      try {
                        const parsed = JSON.parse(settings.slider_images || "[]");
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        return [];
                      }
                    })()}
                    onImagesChange={(images) => {
                      setSettings({ ...settings, slider_images: JSON.stringify(images) });
                    }}
                    isFullWidth={settings.slider_full_width === "true"}
                    onFullWidthChange={(value) => {
                      setSettings({ ...settings, slider_full_width: value ? "true" : "false" });
                    }}
                    heightMobile={settings.slider_height_mobile}
                    onHeightMobileChange={(value) => {
                      setSettings({ ...settings, slider_height_mobile: value });
                    }}
                    heightDesktop={settings.slider_height_desktop}
                    onHeightDesktopChange={(value) => {
                      setSettings({ ...settings, slider_height_desktop: value });
                    }}
                  />
                  <div className="mt-4">
                    <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      সংরক্ষণ করুন
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Category Style Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    ক্যাটাগরি স্টাইল
                  </CardTitle>
                  <CardDescription>
                    হোমপেজে ক্যাটাগরি সেকশনের কালার ও স্টাইল কাস্টমাইজ করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Enable/Disable Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>সেকশন চালু/বন্ধ</Label>
                      <p className="text-xs text-muted-foreground">বন্ধ করলে হোমপেজে ক্যাটাগরি সেকশন আর দেখাবে না</p>
                    </div>
                    <Select
                      value={settings.category_section_enabled || "true"}
                      onValueChange={(value) => setSettings({ ...settings, category_section_enabled: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">চালু</SelectItem>
                        <SelectItem value="false">বন্ধ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>সেকশন টাইটেল</Label>
                    <Input
                      value={settings.category_section_title || ""}
                      onChange={(e) => setSettings({ ...settings, category_section_title: e.target.value })}
                      placeholder="টপ ক্যাটাগরি"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>টাইটেল কালার</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={settings.category_section_title_color || "#000000"} onChange={(e) => setSettings({ ...settings, category_section_title_color: e.target.value })} className="w-14 h-10 p-1" />
                      <Input value={settings.category_section_title_color || ""} onChange={(e) => setSettings({ ...settings, category_section_title_color: e.target.value })} placeholder="ডিফল্ট: foreground" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">"সব দেখুন" বাটন</h4>
                    <div className="space-y-2">
                      <Label>বাটন টেক্সট</Label>
                      <Input
                        value={settings.category_section_button_text || ""}
                        onChange={(e) => setSettings({ ...settings, category_section_button_text: e.target.value })}
                        placeholder="সব দেখুন"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>বাটন টেক্সট কালার</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_section_button_text_color || "#16a34a"} onChange={(e) => setSettings({ ...settings, category_section_button_text_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_section_button_text_color || ""} onChange={(e) => setSettings({ ...settings, category_section_button_text_color: e.target.value })} placeholder="ডিফল্ট: primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>বাটন ব্যাকগ্রাউন্ড কালার</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_section_button_bg_color || "#ffffff"} onChange={(e) => setSettings({ ...settings, category_section_button_bg_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_section_button_bg_color || ""} onChange={(e) => setSettings({ ...settings, category_section_button_bg_color: e.target.value })} placeholder="ডিফল্ট: transparent" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>সেকশন বর্ডার</Label>
                      <p className="text-xs text-muted-foreground">পুরো ক্যাটাগরি সেকশনের চারপাশে বর্ডার দেখান</p>
                    </div>
                    <Select
                      value={settings.category_section_border || "true"}
                      onValueChange={(value) => setSettings({ ...settings, category_section_border: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">চালু</SelectItem>
                        <SelectItem value="false">বন্ধ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">কার্ড কালার</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>কার্ড টপ বর্ডার কালার</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_card_border_color || "#16a34a"} onChange={(e) => setSettings({ ...settings, category_card_border_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_card_border_color || ""} onChange={(e) => setSettings({ ...settings, category_card_border_color: e.target.value })} placeholder="#16a34a (ডিফল্ট: primary)" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>কার্ড ব্যাকগ্রাউন্ড</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_card_bg_color || "#ffffff"} onChange={(e) => setSettings({ ...settings, category_card_bg_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_card_bg_color || ""} onChange={(e) => setSettings({ ...settings, category_card_bg_color: e.target.value })} placeholder="ডিফল্ট: card color" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">আইকন কালার</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>আইকন ব্যাকগ্রাউন্ড</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_icon_bg_color || "#dcfce7"} onChange={(e) => setSettings({ ...settings, category_icon_bg_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_icon_bg_color || ""} onChange={(e) => setSettings({ ...settings, category_icon_bg_color: e.target.value })} placeholder="ডিফল্ট: primary/10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>আইকন কালার</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={settings.category_icon_color || "#16a34a"} onChange={(e) => setSettings({ ...settings, category_icon_color: e.target.value })} className="w-14 h-10 p-1" />
                          <Input value={settings.category_icon_color || ""} onChange={(e) => setSettings({ ...settings, category_icon_color: e.target.value })} placeholder="ডিফল্ট: primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>টেক্সট কালার</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={settings.category_text_color || "#1f2937"} onChange={(e) => setSettings({ ...settings, category_text_color: e.target.value })} className="w-14 h-10 p-1" />
                      <Input value={settings.category_text_color || ""} onChange={(e) => setSettings({ ...settings, category_text_color: e.target.value })} placeholder="ডিফল্ট: foreground" />
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    সংরক্ষণ করুন
                  </Button>
                </CardContent>
              </Card>

              {/* Category Management Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    ক্যাটাগরি ম্যানেজমেন্ট
                  </CardTitle>
                  <CardDescription>নতুন ক্যাটাগরি যোগ করুন, ছবি আপলোড করুন এবং আইকন সেট করুন</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="bg-gradient-brand">
                    <a href="/admin/categories">
                      ক্যাটাগরি ম্যানেজ করুন
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Product Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    হোমপেজ প্রোডাক্ট সেকশন
                  </CardTitle>
                  <CardDescription>
                    হোমপেজে প্রোডাক্ট সেকশনগুলোর শিরোনাম ও ক্যাটাগরি সেট করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const enabledKey = `product_section_${num}_enabled` as keyof AllSettings;
                    const titleKey = `product_section_${num}_title` as keyof AllSettings;
                    const categoryKey = `product_section_${num}_category` as keyof AllSettings;
                    const countKey = `product_section_${num}_count` as keyof AllSettings;
                    
                    
                    return (
                      <div key={num} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">সেকশন {num}</h3>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings[enabledKey] === "true"}
                              onChange={(e) => setSettings({ ...settings, [enabledKey]: e.target.checked ? "true" : "false" })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">সক্রিয়</span>
                          </label>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>সেকশন শিরোনাম</Label>
                            <Input
                              value={settings[titleKey] || ""}
                              onChange={(e) => setSettings({ ...settings, [titleKey]: e.target.value })}
                              placeholder="সেকশন শিরোনাম"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>কতটি প্রোডাক্ট দেখাবে</Label>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={settings[countKey] || "10"}
                              onChange={(e) => setSettings({ ...settings, [countKey]: e.target.value })}
                              placeholder="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ক্যাটাগরি (ফাঁকা রাখলে সব প্রোডাক্ট দেখাবে)</Label>
                            <Select
                              value={settings[categoryKey] || "all"}
                              onValueChange={(value) => setSettings({ ...settings, [categoryKey]: value === "all" ? "" : value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="ক্যাটাগরি বাছুন" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">সব প্রোডাক্ট</SelectItem>
                                <SelectItem value="kitchen">কিচেন আইটেম</SelectItem>
                                <SelectItem value="mens-bag">পুরুষদের ব্যাগ</SelectItem>
                                <SelectItem value="fashion">ফ্যাশন</SelectItem>
                                <SelectItem value="baby-items">বেবি আইটেম</SelectItem>
                                <SelectItem value="ladies-bag">মহিলাদের ব্যাগ</SelectItem>
                                <SelectItem value="speakers">স্পিকার</SelectItem>
                                <SelectItem value="smart-watch">স্মার্ট ওয়াচ</SelectItem>
                                <SelectItem value="headphones">হেডফোন</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    💡 <strong>টিপস:</strong> ক্যাটাগরি বাছাই করলে সেই ক্যাটাগরির প্রোডাক্ট দেখাবে। ফাঁকা রাখলে সর্বশেষ প্রোডাক্ট দেখাবে।
                  </p>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            {/* Invoice Settings Tab */}
            <TabsContent value="invoice">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    ইনভয়েস কাস্টমাইজেশন
                  </CardTitle>
                  <CardDescription>
                    প্রিন্টযোগ্য ইনভয়েসের টেক্সট, কালার এবং লোগো পরিবর্তন করুন
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">ব্র্যান্ড তথ্য</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_brand_name">ব্র্যান্ড নাম</Label>
                        <Input
                          id="invoice_brand_name"
                          value={(settings as any).invoice_brand_name || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_brand_name: e.target.value } as any)}
                          placeholder="BRANDNAME"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_brand_tagline">ব্র্যান্ড ট্যাগলাইন</Label>
                        <Input
                          id="invoice_brand_tagline"
                          value={(settings as any).invoice_brand_tagline || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_brand_tagline: e.target.value } as any)}
                          placeholder="সেরা পণ্যের নির্ভরযোগ্য প্রতিষ্ঠান"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_shop_name">শপের নাম (Billing From)</Label>
                        <Input
                          id="invoice_shop_name"
                          value={(settings as any).invoice_shop_name || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_shop_name: e.target.value } as any)}
                          placeholder="আপনার শপের নাম"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_shop_phone">শপের ফোন</Label>
                        <Input
                          id="invoice_shop_phone"
                          value={(settings as any).invoice_shop_phone || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_shop_phone: e.target.value } as any)}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_logo_url">ইনভয়েস লোগো URL (ঐচ্ছিক)</Label>
                      <Input
                        id="invoice_logo_url"
                        value={(settings as any).invoice_logo_url || ""}
                        onChange={(e) => setSettings({ ...settings, invoice_logo_url: e.target.value } as any)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">কালার কাস্টমাইজেশন</h3>
                    <p className="text-xs text-muted-foreground">প্রতিটা এলিমেন্টের কালার আলাদা করে চেঞ্জ করুন। ডানদিকে লাইভ প্রিভিউ দেখুন।</p>

                    {[
                      {
                        title: "হেডার এরিয়া",
                        fields: [
                          ["invoice_header_bg", "হেডার ব্যাকগ্রাউন্ড"],
                          ["invoice_header_accent_bg", "হেডার অ্যাকসেন্ট (অরেঞ্জ)"],
                          ["invoice_header_brown_bg", "হেডার ব্রাউন স্ট্রাইপ"],
                          ["invoice_brand_name_color", "ব্র্যান্ড নামের কালার"],
                          ["invoice_brand_tagline_color", "ট্যাগলাইন কালার"],
                          ["invoice_label_color", "INVOICE লেবেল কালার"],
                          ["invoice_id_color", "ID NO কালার"],
                        ],
                      },
                      {
                        title: "সেপারেটর",
                        fields: [
                          ["invoice_separator_left_bg", "বাঁদিকের সেপারেটর"],
                          ["invoice_separator_right_bg", "ডানদিকের সেপারেটর"],
                        ],
                      },
                      {
                        title: "বডি এবং ব্যাজ",
                        fields: [
                          ["invoice_page_bg", "পেইজ ব্যাকগ্রাউন্ড"],
                          ["invoice_body_text_color", "বডি টেক্সট কালার"],
                          ["invoice_badge_bg", "ব্যাজ ব্যাকগ্রাউন্ড"],
                          ["invoice_badge_text_color", "ব্যাজ টেক্সট"],
                          ["invoice_badge_border_color", "ব্যাজ বর্ডার"],
                          ["invoice_section_name_color", "নামের কালার"],
                          ["invoice_section_info_color", "ইনফো টেক্সট কালার"],
                        ],
                      },
                      {
                        title: "টেবিল",
                        fields: [
                          ["invoice_table_header_bg", "টেবিল হেডার ব্যাকগ্রাউন্ড"],
                          ["invoice_table_header_text", "টেবিল হেডার টেক্সট"],
                          ["invoice_table_row_text", "রো টেক্সট কালার"],
                          ["invoice_table_row_border", "রো বর্ডার কালার"],
                        ],
                      },
                      {
                        title: "টোটাল ও সামারি",
                        fields: [
                          ["invoice_summary_text", "সামারি টেক্সট"],
                          ["invoice_total_bar_bg", "টোটাল বার ব্যাকগ্রাউন্ড"],
                          ["invoice_total_bar_text", "টোটাল বার টেক্সট"],
                        ],
                      },
                      {
                        title: "ফুটার",
                        fields: [
                          ["invoice_thanks_title_color", "ধন্যবাদ টাইটেল"],
                          ["invoice_thanks_text_color", "ধন্যবাদ টেক্সট"],
                          ["invoice_signature_color", "সিগনেচার কালার"],
                          ["invoice_signature_label_color", "সিগনেচার লেবেল"],
                          ["invoice_bottom_band_left_bg", "নিচের বাঁ ব্যান্ড"],
                          ["invoice_bottom_band_right_bg", "নিচের ডান ব্যান্ড"],
                        ],
                      },
                      {
                        title: "প্রিন্ট বাটন",
                        fields: [
                          ["invoice_print_button_bg", "প্রিন্ট বাটন ব্যাকগ্রাউন্ড"],
                          ["invoice_print_button_text", "প্রিন্ট বাটন টেক্সট"],
                        ],
                      },
                    ].map((group) => (
                      <div key={group.title} className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">{group.title}</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {group.fields.map(([key, label]) => {
                            const fallback = invoiceColorDefaults[key] || "#000000";
                            const value = (settings as any)[key] || fallback;
                            return (
                              <div key={key} className="space-y-1">
                                <Label htmlFor={key} className="text-xs">{label}</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={value}
                                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value } as any)}
                                    className="w-10 h-9 p-1 cursor-pointer"
                                  />
                                  <Input
                                    id={key}
                                    value={value}
                                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value } as any)}
                                    className="h-9 text-xs"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                      <div>
                        <Label className="text-sm">প্রোডাক্ট ইমেজ দেখান</Label>
                        <p className="text-xs text-muted-foreground">টেবিলে প্রোডাক্ট নামের পাশে ছবি শো করবে</p>
                      </div>
                      <Switch
                        checked={((settings as any).invoice_show_product_image ?? "true") !== "false"}
                        onCheckedChange={(v) => setSettings({ ...settings, invoice_show_product_image: v ? "true" : "false" } as any)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">ফুটার টেক্সট</h3>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_footer_text">ইনভয়েস ফুটার মেসেজ</Label>
                      <Input
                        id="invoice_footer_text"
                        value={(settings as any).invoice_footer_text || ""}
                        onChange={(e) => setSettings({ ...settings, invoice_footer_text: e.target.value } as any)}
                        placeholder="আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">শিপিং স্টিকার</h3>
                    <p className="text-xs text-muted-foreground">ইনভয়েসের নিচে প্রিন্ট হবে। অর্ডারের ডাটা থেকেই অটো ফিল হবে।</p>

                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                      <div>
                        <Label className="text-sm">স্টিকার অন</Label>
                        <p className="text-xs text-muted-foreground">ইনভয়েসের সাথে স্টিকার প্রিন্ট হবে</p>
                      </div>
                      <Switch
                        checked={((settings as any).invoice_sticker_enabled ?? "true") !== "false"}
                        onCheckedChange={(v) => setSettings({ ...settings, invoice_sticker_enabled: v ? "true" : "false" } as any)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice_sticker_template" className="text-sm">স্টিকার ডিজাইন টেমপ্লেট</Label>
                      <Select
                        value={(settings as any).invoice_sticker_template || "classic"}
                        onValueChange={(v) => setSettings({ ...settings, invoice_sticker_template: v } as any)}
                      >
                        <SelectTrigger id="invoice_sticker_template">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STICKER_TEMPLATES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">ডানদিকে লাইভ প্রিভিউতে চেঞ্জ দেখাবে।</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_sticker_hotline" className="text-xs">Hot Line (ঐচ্ছিক)</Label>
                        <Input
                          id="invoice_sticker_hotline"
                          value={(settings as any).invoice_sticker_hotline || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_sticker_hotline: e.target.value } as any)}
                          placeholder="09638839178"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_sticker_slogan" className="text-xs">স্লোগান</Label>
                        <Input
                          id="invoice_sticker_slogan"
                          value={(settings as any).invoice_sticker_slogan || ""}
                          onChange={(e) => setSettings({ ...settings, invoice_sticker_slogan: e.target.value } as any)}
                          placeholder="আপনাদের সেবা আমাদের ধর্ম"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">স্টিকার কালার</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          ["invoice_sticker_border", "বর্ডার কালার"],
                          ["invoice_sticker_header_bg", "হেডার ব্যাকগ্রাউন্ড"],
                          ["invoice_sticker_header_text", "হেডার টেক্সট"],
                          ["invoice_sticker_accent", "অ্যাকসেন্ট"],
                          ["invoice_sticker_label_color", "লেবেল কালার"],
                          ["invoice_sticker_value_color", "ভ্যালু কালার"],
                          ["invoice_sticker_slogan_color", "স্লোগান কালার"],
                        ].map(([key, label]) => {
                          const fallback = invoiceColorDefaults[key] || "#000000";
                          const value = (settings as any)[key] || fallback;
                          return (
                            <div key={key} className="space-y-1">
                              <Label htmlFor={key} className="text-xs">{label}</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={value}
                                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value } as any)}
                                  className="w-10 h-9 p-1 cursor-pointer"
                                />
                                <Input
                                  id={key}
                                  value={value}
                                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value } as any)}
                                  className="h-9 text-xs"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                    </div>

                    {/* Live Preview - right column */}
                    <div className="lg:sticky lg:top-4 self-start">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                          লাইভ প্রিভিউ
                        </h3>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          স্যাম্পল ডেটা
                        </span>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3 max-h-[calc(100vh-180px)] overflow-y-auto">
                        <InvoiceLivePreview
                          brandName={(settings as any).invoice_brand_name || (settings as any).site_name || "BRANDNAME"}
                          brandTagline={(settings as any).invoice_brand_tagline || "Your Trusted Store"}
                          shopName={(settings as any).invoice_shop_name || (settings as any).site_name || "Your Shop Name"}
                          shopPhone={(settings as any).invoice_shop_phone || (settings as any).support_phone || "01XXXXXXXXX"}
                          footerText={(settings as any).invoice_footer_text || "Thank you for shopping with us!"}
                          logoUrl={(settings as any).invoice_logo_url || (settings as any).site_logo_url || ""}
                          colors={getInvoiceColors((key, def = "") => (settings as any)[key] || def)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-brand"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              সেটিংস সেভ করুন
            </Button>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminSettings;
