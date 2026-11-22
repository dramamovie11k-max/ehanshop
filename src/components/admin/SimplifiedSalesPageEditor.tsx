import { useState, useEffect, useRef } from "react";

 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
  import { SalesPage } from "@/types/salesPage";
import { FeaturePoint, SpecItem, MultiProductItem } from "@/types/salesPage";
import MultiProductPicker from "./MultiProductPicker";
 import { useCreateSalesPage, useUpdateSalesPage } from "@/hooks/useSalesPages";
 import { useProducts } from "@/hooks/useProducts";
 import { supabase } from "@/integrations/supabase/client";
import { X, Upload, Image as ImageIcon, Palette, ChevronDown, Trash2 } from "lucide-react";
import Template15StyleEditor from "./Template15StyleEditor";
import CustomSectionEditor, { CustomSection } from "./CustomSectionEditor";
import CustomSectionInlineEditor from "./CustomSectionInlineEditor";
 import { toast } from "sonner";
import { SalesPageTemplate, getTemplate, salesPageTemplates } from "@/lib/salesPageTemplates";
import SectionOrderManager, { DEFAULT_ORDER, CustomSectionInfo } from "./SectionOrderManager";
 
// Helper functions to migrate old fixed-column data to new JSONB arrays
const migrateOldFeatures = (page: SalesPage): FeaturePoint[] => {
  const features: FeaturePoint[] = [];
  for (let i = 1; i <= 6; i++) {
    const text = (page as any)[`feature_${i}_text`];
    const icon = (page as any)[`feature_${i}_icon`];
    const description = (page as any)[`feature_${i}_description`];
    if (text && text.trim()) {
      features.push({ icon: icon || '✅', text, description: description || '' });
    }
  }
  return features;
};

const migrateOldPoints = (page: SalesPage, sectionNum: number): string[] => {
  const points: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const point = (page as any)[`extra_section_${sectionNum}_point_${i}`];
    if (point && point.trim()) {
      points.push(point);
    }
  }
  return points;
};

 interface SimplifiedSalesPageEditorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   salesPage: SalesPage | null;
 }
 
 const defaultFormData = {
   slug: "",
   title: "",
   is_active: true,
   product_id: "",
   template_id: "template-01-organic",
   show_hero_section: true,
   show_video_section: false,
   show_countdown: false,
   show_gallery_section: true,
   show_features_section: true,
   show_reviews_section: true,
   show_contact_section: true,
   show_checkout_section: true,
   hero_variant: "01",
   gallery_variant: "01",
   feature_variant: "01",
   review_variant: "01",
   contact_variant: "01",
   hero_badge_text: "🌿 ১০০% অর্গানিক ও প্রাকৃতিক",
   hero_headline: "",
   hero_subheadline: "",
   hero_images: [] as string[],
   hero_video_url: "",
   countdown_end_date: "",
   countdown_label_days: "দিন",
   countdown_label_hours: "ঘন্টা",
   countdown_label_minutes: "মিনিট",
   countdown_label_seconds: "সেকেন্ড",
   offer_price: 0,
   original_price: 0,
   discount_text: "২৯% ছাড়",
   price_unit: "৳",
   offer_details: "",
   features_headline: "কি কি থাকছে?",
   features_subheadline: "আমাদের বিশেষত্ব ও গ্যারান্টি",
   feature_1_text: "১০০% রঙ গ্যারান্টি",
   feature_1_icon: "🎨",
   feature_1_description: "ইন্ডিয়ান কোয়েড প্রিন্ট",
   feature_2_text: "কোয়েল কাজ",
   feature_2_icon: "✨",
   feature_2_description: "রঙ, ছাতা ও টেনাই কাজ",
   feature_3_text: "সঠিক চেলা",
   feature_3_icon: "👗",
   feature_3_description: "স্ট্যান্ডার্ড মাপের চেলা",
   feature_4_text: "সেম টু সেম",
   feature_4_icon: "✅",
   feature_4_description: "যেমন দেখছেন তেমনই পাবেন",
   feature_5_text: "ক্যাশ অন ডেলিভারি",
   feature_5_icon: "💵",
   feature_5_description: "পণ্য হাতে পেয়ে টাকা দিন",
   feature_6_text: "ফ্রি ডেলিভারি",
   feature_6_icon: "🚚",
   feature_6_description: "সারা দেশ ফ্রি ডেলিভারি",
   feature_card_bg_color: "#1a3a2f",
   feature_icon_bg_color: "#f59e0b",
   gallery_title: "আমাদের কালেকশন",
   gallery_subtitle: "যেমন দেখছেন, তেমনই পাবেন",
    gallery_images: [] as string[],
    gallery_product_prices: [] as number[],
    reviews_headline: "কাস্টমার ফিডব্যাক",
    reviews_subheadline: "আমাদের সন্তুষ্ট গ্রাহকদের মতামত",
    review_images: [] as string[],
    review_video_url: "",
   contact_headline: "যেকোনো প্রয়োজনে কল করুন",
   contact_subheadline: "ফোনে অর্ডার করতে কল করুন",
   contact_phone: "01832-677000",
   contact_phone_link: "tel:01832677000",
   contact_whatsapp: "01832677000",
   contact_whatsapp_text: "হোয়াটসঅ্যাপ মেসেজ",
   contact_availability: "২৪/৭ সার্ভিস",
   cta_button_text: "এখনই অর্ডার করুন",
   cta_urgency_text: "সীমিত স্টক! মিস করবেন না",
    primary_color: "#16a34a",
    background_color: "#052e16",
    text_color: "#ffffff",
    accent_color: "#22c55e",
    headline_color: "#ffff00",
    button_color: "#e8c84a",
  // Extra Sections
  show_extra_section_1: false,
  extra_section_1_heading: "কেন আমাদের উপর আস্থা রাখবেন?",
  show_extra_section_2: false,
  extra_section_2_heading: "আমাদের বিশেষত্ব",
  show_extra_section_3: false,
  extra_section_3_heading: "গ্রাহক সুবিধা",
  section_order: DEFAULT_ORDER,
  // Unlimited points arrays
  feature_points: [] as FeaturePoint[],
  extra_section_1_points: [] as string[],
  extra_section_2_points: [] as string[],
  extra_section_3_points: [] as string[],
  // Footer
  footer_text: "",
  // Spec Section
  show_spec_section: false,
  spec_section_heading: "টেকনিক্যাল স্পেসিফিকেশন",
  spec_items: [] as SpecItem[],
  // Feature Section Image
  feature_section_image: "",
  feature_section_images: [] as string[],
  // Template-specific styles (JSONB)
  template_styles: {} as Record<string, Record<string, string>>,
  // Multiple products
  show_multi_products: false,
  multi_products: [] as MultiProductItem[],
  allow_multi_select: false,
  };
 
 const SimplifiedSalesPageEditor = ({
   open,
   onOpenChange,
   salesPage,
 }: SimplifiedSalesPageEditorProps) => {
   const createMutation = useCreateSalesPage();
   const updateMutation = useUpdateSalesPage();
   const { data: products } = useProducts();
   const [formData, setFormData] = useState(defaultFormData);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<"hero" | "gallery" | "review" | "feature">("hero");
  const [expandedSections, setExpandedSections] = useState<string[]>(["template"]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
 
   useEffect(() => {
     if (salesPage) {
       setFormData({
         slug: salesPage.slug,
         title: salesPage.title,
         is_active: salesPage.is_active,
         product_id: salesPage.product_id || "",
         template_id: salesPage.template_id || "template-01-organic",
         show_hero_section: salesPage.show_hero_section ?? true,
         show_video_section: salesPage.show_video_section ?? false,
         show_countdown: salesPage.show_countdown ?? false,
         show_gallery_section: salesPage.show_gallery_section ?? true,
         show_features_section: salesPage.show_features_section ?? true,
         show_reviews_section: salesPage.show_reviews_section ?? true,
         show_contact_section: salesPage.show_contact_section ?? true,
         show_checkout_section: salesPage.show_checkout_section ?? true,
         hero_variant: salesPage.hero_variant || "01",
         gallery_variant: salesPage.gallery_variant || "01",
         feature_variant: salesPage.feature_variant || "01",
         review_variant: salesPage.review_variant || "01",
         contact_variant: salesPage.contact_variant || "01",
         hero_badge_text: salesPage.hero_badge_text || "",
         hero_headline: salesPage.hero_headline,
         hero_subheadline: salesPage.hero_subheadline || "",
         hero_images: salesPage.hero_images || [],
         hero_video_url: salesPage.hero_video_url || "",
         countdown_end_date: salesPage.countdown_end_date || "",
         countdown_label_days: salesPage.countdown_label_days || "দিন",
         countdown_label_hours: salesPage.countdown_label_hours || "ঘন্টা",
         countdown_label_minutes: salesPage.countdown_label_minutes || "মিনিট",
         countdown_label_seconds: salesPage.countdown_label_seconds || "সেকেন্ড",
         offer_price: salesPage.offer_price,
         original_price: salesPage.original_price || 0,
         discount_text: salesPage.discount_text || "",
         price_unit: salesPage.price_unit || "৳",
         offer_details: salesPage.offer_details || "",
         features_headline: salesPage.features_headline || "কি কি থাকছে?",
         features_subheadline: salesPage.features_subheadline || "",
         feature_1_text: salesPage.feature_1_text || "",
         feature_1_icon: salesPage.feature_1_icon || "✅",
         feature_1_description: salesPage.feature_1_description || "",
         feature_2_text: salesPage.feature_2_text || "",
         feature_2_icon: salesPage.feature_2_icon || "✅",
         feature_2_description: salesPage.feature_2_description || "",
         feature_3_text: salesPage.feature_3_text || "",
         feature_3_icon: salesPage.feature_3_icon || "✅",
         feature_3_description: salesPage.feature_3_description || "",
         feature_4_text: salesPage.feature_4_text || "",
         feature_4_icon: salesPage.feature_4_icon || "✅",
         feature_4_description: salesPage.feature_4_description || "",
         feature_5_text: salesPage.feature_5_text || "",
         feature_5_icon: salesPage.feature_5_icon || "✅",
         feature_5_description: salesPage.feature_5_description || "",
         feature_6_text: salesPage.feature_6_text || "",
         feature_6_icon: salesPage.feature_6_icon || "✅",
         feature_6_description: salesPage.feature_6_description || "",
         feature_card_bg_color: salesPage.feature_card_bg_color || "#1a3a2f",
         feature_icon_bg_color: salesPage.feature_icon_bg_color || "#f59e0b",
         gallery_title: salesPage.gallery_title || "",
         gallery_subtitle: salesPage.gallery_subtitle || "",
          gallery_images: salesPage.gallery_images || [],
          gallery_product_prices: salesPage.gallery_product_prices || [],
          reviews_headline: salesPage.reviews_headline || "কাস্টমার ফিডব্যাক",
          reviews_subheadline: salesPage.reviews_subheadline || "",
          review_images: salesPage.review_images || [],
          review_video_url: (salesPage as any).review_video_url || "",
         contact_headline: salesPage.contact_headline || "",
         contact_subheadline: salesPage.contact_subheadline || "",
         contact_phone: salesPage.contact_phone || "",
         contact_phone_link: salesPage.contact_phone_link || "",
         contact_whatsapp: salesPage.contact_whatsapp || "",
         contact_whatsapp_text: salesPage.contact_whatsapp_text || "",
         contact_availability: salesPage.contact_availability || "",
         cta_button_text: salesPage.cta_button_text || "",
         cta_urgency_text: salesPage.cta_urgency_text || "",
          primary_color: salesPage.primary_color || "#16a34a",
          background_color: salesPage.background_color || "#052e16",
          text_color: salesPage.text_color || "#ffffff",
          accent_color: salesPage.accent_color || "#22c55e",
          headline_color: (salesPage as any).headline_color || "#ffff00",
          button_color: (salesPage as any).button_color || "#e8c84a",
        // Extra Sections
        show_extra_section_1: salesPage.show_extra_section_1 ?? false,
        extra_section_1_heading: salesPage.extra_section_1_heading || "কেন আমাদের উপর আস্থা রাখবেন?",
        show_extra_section_2: salesPage.show_extra_section_2 ?? false,
        extra_section_2_heading: salesPage.extra_section_2_heading || "আমাদের বিশেষত্ব",
        show_extra_section_3: salesPage.show_extra_section_3 ?? false,
        extra_section_3_heading: salesPage.extra_section_3_heading || "গ্রাহক সুবিধা",
        section_order: salesPage.section_order || DEFAULT_ORDER,
        // Unlimited points arrays - migrate from old format if needed
        feature_points: salesPage.feature_points || migrateOldFeatures(salesPage),
        extra_section_1_points: salesPage.extra_section_1_points || migrateOldPoints(salesPage, 1),
        extra_section_2_points: salesPage.extra_section_2_points || migrateOldPoints(salesPage, 2),
        extra_section_3_points: salesPage.extra_section_3_points || migrateOldPoints(salesPage, 3),
        // Footer
        footer_text: salesPage.footer_text || "",
        // Spec Section
         show_spec_section: (salesPage as any).show_spec_section ?? false,
         spec_section_heading: (salesPage as any).spec_section_heading || "টেকনিক্যাল স্পেসিফিকেশন",
         spec_items: Array.isArray((salesPage as any).spec_items) ? (salesPage as any).spec_items : [],
        show_multi_products: (salesPage as any).show_multi_products ?? false,
        multi_products: Array.isArray((salesPage as any).multi_products) ? (salesPage as any).multi_products : [],
        allow_multi_select: (salesPage as any).allow_multi_select ?? false,
          // Feature Section Image
          feature_section_image: (salesPage as any).feature_section_image || "",
          feature_section_images: Array.isArray((salesPage as any).feature_section_images) ? (salesPage as any).feature_section_images : [],
          // Template-specific styles
          template_styles: (salesPage as any).template_styles || {},
        });
     } else {
       setFormData(defaultFormData);
     }
   }, [salesPage, open]);
 
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || files.length === 0) return;
 
     setUploading(true);
     const uploadedUrls: string[] = [];
 
     try {
       for (const file of Array.from(files)) {
         const fileExt = file.name.split(".").pop();
         const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
         const filePath = `sales-pages/${formData.slug || "temp"}/${fileName}`;
 
         const { error: uploadError } = await supabase.storage
           .from("products")
           .upload(filePath, file);
 
         if (uploadError) throw uploadError;
 
         const { data: urlData } = supabase.storage.from("products").getPublicUrl(filePath);
         uploadedUrls.push(urlData.publicUrl);
       }
 
        setFormData((prev) => {
          if (uploadTarget === "feature") {
            // Feature section images: append to array
            return { ...prev, feature_section_images: [...prev.feature_section_images, ...uploadedUrls] };
          }
          const key = uploadTarget === "hero" ? "hero_images" 
            : uploadTarget === "gallery" ? "gallery_images" 
            : "review_images";
          return { ...prev, [key]: [...prev[key], ...uploadedUrls] };
       });
 
       toast.success(`${uploadedUrls.length}টি ইমেজ আপলোড হয়েছে!`);
     } catch (err: unknown) {
       console.error("Upload error:", err);
       toast.error("ইমেজ আপলোড করতে সমস্যা হয়েছে");
     } finally {
       setUploading(false);
       if (fileInputRef.current) fileInputRef.current.value = "";
     }
   };
 
   const removeImage = (target: "hero" | "gallery" | "review", index: number) => {
     const key = target === "hero" ? "hero_images" 
       : target === "gallery" ? "gallery_images" 
       : "review_images";
     setFormData((prev) => ({
       ...prev,
       [key]: prev[key].filter((_, i) => i !== index),
     }));
   };
 
   const handleSubmit = async () => {
     const payload = {
       ...formData,
        product_id:
          (formData.multi_products?.find((p) => p.is_default)?.product_id ||
            formData.multi_products?.[0]?.product_id ||
            formData.product_id) || null,
       original_price: formData.original_price || null,
       hero_subheadline: formData.hero_subheadline || null,
       hero_video_url: formData.hero_video_url || null,
      video_url: formData.hero_video_url || null,
        offer_details: formData.offer_details || null,
        countdown_end_date: formData.countdown_end_date || null,
        feature_section_image: formData.feature_section_image || null,
        feature_section_images: formData.feature_section_images || [],
        template_styles: formData.template_styles || {},
        multi_products: formData.multi_products || [],
        show_multi_products: (formData.multi_products?.length ?? 0) > 0,
        allow_multi_select: formData.allow_multi_select,
      };
 
     if (salesPage) {
       updateMutation.mutate(
         { id: salesPage.id, ...payload },
         { onSuccess: () => onOpenChange(false) }
       );
     } else {
       createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
     }
   };
 
   const isSubmitting = createMutation.isPending || updateMutation.isPending;
 
    const triggerUpload = (target: "hero" | "gallery" | "review" | "feature") => {
      setUploadTarget(target);
      fileInputRef.current?.click();
    };
 
   const handleTemplateSelect = (template: SalesPageTemplate) => {
     setFormData((prev) => ({
       ...prev,
       template_id: template.id,
       primary_color: template.primary_color,
       accent_color: template.accent_color,
       background_color: template.background_color,
       text_color: template.text_color,
       feature_card_bg_color: template.feature_card_bg_color,
       feature_icon_bg_color: template.feature_icon_bg_color,
       ...(template.headline_color ? { headline_color: template.headline_color } : {}),
       ...(template.button_color ? { button_color: template.button_color } : {}),
      // Apply template default sections
      show_hero_section: template.defaultSections.hero,
      show_countdown: template.defaultSections.countdown,
      show_gallery_section: template.defaultSections.gallery,
      show_video_section: template.defaultSections.video,
      show_features_section: template.defaultSections.features,
      show_reviews_section: template.defaultSections.reviews,
      show_contact_section: template.defaultSections.contact,
     }));
    toast.success(`"${template.name}" টেমপ্লেট সিলেক্ট হয়েছে!`);
   };
 
   const currentTemplate = getTemplate(formData.template_id);
  
  // Filter only new templates (self-contained components)
  const availableTemplates = salesPageTemplates.filter(t => t.isNew === true);
 
   const toggleSection = (section: string) => {
     setExpandedSections(prev => 
       prev.includes(section) 
         ? prev.filter(s => s !== section)
         : [...prev, section]
     );
   };
 
   // Recommended sizes for each upload target
   const getRecommendedSize = (target: "hero" | "gallery" | "review" | "feature") => {
     switch (target) {
       case "hero": return "রিকমেন্ডেড: 800×500px";
       case "gallery": return "রিকমেন্ডেড: 600×600px";
       case "review": return "রিকমেন্ডেড: 600×800px";
       case "feature": return "রিকমেন্ডেড: 700×400px";
       default: return "";
     }
   };

   // Compact Image Grid
   const ImageGrid = ({ images, target }: { images: string[]; target: "hero" | "gallery" | "review" }) => (
     <div className="space-y-2">
       <div className="flex justify-between items-center">
         <span className="text-xs text-muted-foreground">{images.length}টি ইমেজ</span>
         <Button 
           type="button" 
           variant="outline" 
           size="sm" 
           onClick={() => triggerUpload(target)}
           disabled={uploading}
           className="h-7 text-xs"
         >
           <Upload className="h-3 w-3 mr-1" />
           {uploading ? "..." : "আপলোড"}
         </Button>
       </div>
       {images.length > 0 ? (
         <div className="grid grid-cols-6 gap-1">
           {images.map((img, i) => (
             <div key={i} className="relative group">
               <img src={img} alt="" className="w-full aspect-square object-cover rounded border" />
               <button
                 type="button"
                 onClick={() => removeImage(target, i)}
                 className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X className="h-2.5 w-2.5" />
               </button>
             </div>
           ))}
         </div>
       ) : (
         <div className="border border-dashed rounded p-2 text-center text-xs text-muted-foreground">
           ইমেজ আপলোড করুন
         </div>
       )}
       <p className="text-[10px] text-muted-foreground text-center">{getRecommendedSize(target)}</p>
     </div>
   );
 
   // Section Toggle with Collapsible
   const SectionToggle = ({
     id,
     label,
     enabled,
     onToggle,
     children,
   }: {
     id: string;
     label: string;
     enabled: boolean;
     onToggle: (val: boolean) => void;
     children?: React.ReactNode;
   }) => {
     const isExpanded = expandedSections.includes(id);
     
     return (
       <div className="border rounded-lg overflow-hidden">
         <div 
           className="flex items-center justify-between px-3 py-2 bg-muted/40 cursor-pointer"
           onClick={() => enabled && children && toggleSection(id)}
         >
           <div className="flex items-center gap-2">
             <Switch
               checked={enabled}
               onCheckedChange={(e) => {
                 e && toggleSection(id);
                 onToggle(e);
               }}
               className="scale-75"
               onClick={(e) => e.stopPropagation()}
             />
             <span className={`text-sm font-medium ${enabled ? '' : 'text-muted-foreground'}`}>
               {label}
             </span>
           </div>
           {enabled && children && (
             <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
           )}
         </div>
         {enabled && isExpanded && children && (
           <div className="p-3 border-t space-y-2 bg-background">
             {children}
           </div>
         )}
       </div>
     );
   };
 
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] p-0">
         <DialogHeader className="px-4 py-3 border-b">
           <DialogTitle className="text-base">
             {salesPage ? "সেলস পেজ এডিট করুন" : "নতুন সেলস পেজ"}
           </DialogTitle>
         </DialogHeader>
 
         <input
           ref={fileInputRef}
           type="file"
           accept="image/*"
           multiple
           className="hidden"
           onChange={handleImageUpload}
         />
 
         <ScrollArea className="max-h-[65vh] px-4">
           <div className="space-y-4 py-4">
             {/* Basic Info Row */}
            <div className="grid grid-cols-2 gap-2">
               <div>
                 <Label className="text-xs">পেজ শিরোনাম *</Label>
                 <Input
                   value={formData.title}
                   onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                   placeholder="স্পেশাল অফার"
                   className="h-8 text-sm"
                 />
               </div>
               <div>
                 <Label className="text-xs">স্লাগ (URL) *</Label>
                 <Input
                   value={formData.slug}
                   onChange={(e) => setFormData(prev => ({
                     ...prev,
                     slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                   }))}
                   placeholder="special-offer"
                   className="h-8 text-sm"
                 />
               </div>
             </div>
 
            {/* Template Selector - Primary Selection */}
            <div className="border rounded-lg overflow-hidden bg-gradient-to-r from-primary/5 to-accent/5">
              <div 
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                onClick={() => toggleSection("template")}
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">টেমপ্লেট: {currentTemplate.name}</span>
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {availableTemplates.length}/১৫
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes("template") ? 'rotate-180' : ''}`} />
              </div>
              {expandedSections.includes("template") && (
                <div className="p-2 border-t bg-background">
                  <div className="grid grid-cols-3 gap-2">
                    {availableTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className={`relative p-2 rounded-lg border-2 transition-all text-left ${
                          formData.template_id === template.id
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-0.5 mb-1.5">
                          <div className="h-1.5 flex-1 rounded-full" style={{ background: template.primary_color }} />
                          <div className="h-1.5 flex-1 rounded-full" style={{ background: template.accent_color }} />
                          <div className="h-1.5 flex-1 rounded-full" style={{ background: template.background_color }} />
                        </div>
                        <p className="font-medium text-[10px] truncate">{template.name}</p>
                        <p className="text-[8px] text-muted-foreground">{template.category}</p>
                        {formData.template_id === template.id && (
                          <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground rounded-full w-3 h-3 flex items-center justify-center text-[8px]">✓</div>
                        )}
                      </button>
                    ))}
                    
                    {/* Coming Soon Placeholders */}
                    {Array.from({ length: Math.min(3, 15 - availableTemplates.length) }).map((_, i) => (
                      <div
                        key={`placeholder-${i}`}
                        className="p-2 rounded-lg border-2 border-dashed border-muted/50 bg-muted/10 opacity-40"
                      >
                        <div className="flex gap-0.5 mb-1.5">
                          <div className="h-1.5 flex-1 rounded-full bg-muted" />
                          <div className="h-1.5 flex-1 rounded-full bg-muted" />
                          <div className="h-1.5 flex-1 rounded-full bg-muted" />
                        </div>
                        <p className="font-medium text-[10px] text-muted-foreground">শীঘ্রই...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
 
            {/* Products (only via multi-product picker) */}
            <div className="space-y-2 rounded-lg border p-2.5">
              <MultiProductPicker
                items={formData.multi_products}
                products={products}
                onChange={(items) => setFormData(prev => ({ ...prev, multi_products: items }))}
              />
            </div>

            {/* Allow ordering multiple products together */}
            <div className="flex items-start gap-2 rounded-lg border p-2.5">
              <div className="flex-1">
                <Label className="text-xs">একসাথে একাধিক প্রোডাক্ট অর্ডার</Label>
                <p className="text-[10px] text-muted-foreground">
                  {formData.allow_multi_select
                    ? "হ্যাঁ — কাস্টমার একাধিক প্রোডাক্ট বেছে নিয়ে একসাথে অর্ডার করতে পারবে"
                    : "না — কাস্টমার শুধু একটি প্রোডাক্ট বেছে নিতে পারবে"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={formData.allow_multi_select}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_multi_select: checked }))}
                  className="scale-75"
                />
                <span className="text-[10px] text-muted-foreground">{formData.allow_multi_select ? "Yes" : "No"}</span>
              </div>
            </div>
             
             {/* Active Status */}
             <div className="flex items-center gap-2">
               <Switch
                 checked={formData.is_active}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                 className="scale-75"
               />
               <Label className="text-xs">সক্রিয়</Label>
             </div>
 
             {/* Sections */}
             <div className="space-y-2">
               <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">সেকশনসমূহ</Label>
               
              {/* Section Order Manager - Draggable sections */}
              <SectionOrderManager
                sectionOrder={formData.section_order}
                formData={formData as Record<string, unknown>}
                onOrderChange={(newOrder) => setFormData(prev => ({ ...prev, section_order: newOrder }))}
                onToggle={(key, value) => setFormData(prev => ({ ...prev, [key]: value }))}
                onSectionClick={(id) => setExpandedSection(expandedSection === id ? null : id)}
                expandedSection={expandedSection}
                customSections={
                  formData.template_id === 'template-15-universal'
                    ? (((formData.template_styles as any)?.customSections || []) as CustomSection[]).map(cs => ({
                        id: cs.id,
                        title: cs.title || 'কাস্টম সেকশন',
                        type: cs.type,
                      } as CustomSectionInfo))
                    : []
                }
                onRemoveCustomSection={(sectionId) => {
                  const currentCustom = ((formData.template_styles as any)?.customSections || []) as CustomSection[];
                  const updated = currentCustom.filter(s => s.id !== sectionId);
                  setFormData(prev => ({
                    ...prev,
                    template_styles: { ...prev.template_styles, customSections: updated } as any,
                    section_order: prev.section_order.filter(id => id !== sectionId),
                  }));
                }}
                 renderSectionContent={(sectionId) => {
                   switch (sectionId) {
                     case 'hero':
                       // Template 05 (Health) has unique hero
                       const isTemplate05 = formData.template_id === 'template-05-countdown';
                       // Template 04 (Gadget) has unique hero with offer box
                       const isTemplate04 = formData.template_id === 'template-04-gadget';
                       
                       if (isTemplate05) {
                         return (
                           <div className="p-3 bg-muted/30 space-y-2">
                             <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (হেলথ)</Label>
                             <Textarea
                               value={formData.hero_headline}
                               onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                               placeholder="হেডলাইন (হলুদ টেক্সট)"
                               className="min-h-[50px] text-sm"
                             />
                             <Textarea
                               value={formData.hero_subheadline}
                               onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                               placeholder="সর্ট ডিসক্রিপশন (সাদা টেক্সট)"
                               className="min-h-[50px] text-sm"
                             />
                             <div>
                               <Label className="text-xs text-muted-foreground">হিরো ভিডিও URL (YouTube)</Label>
                               <Input
                                 value={formData.hero_video_url}
                                 onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                 placeholder="https://www.youtube.com/watch?v=..."
                                 className="h-8 text-sm"
                               />
                             </div>
                             <Input
                               value={formData.cta_button_text}
                               onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                               placeholder="CTA বাটন টেক্সট (যেমন: অর্ডার করতে ক্লিক করুন)"
                               className="h-8 text-sm"
                             />
                           </div>
                         );
                       }

                       if (isTemplate04) {
                         return (
                           <div className="p-3 bg-muted/30 space-y-2">
                             <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (গ্যাজেট)</Label>
                             
                             {/* Offer Heading */}
                             <div>
                               <Label className="text-xs text-muted-foreground">অফার হেডিং (ব্যাজ টেক্সট)</Label>
                               <Input
                                 value={formData.hero_badge_text}
                                 onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                 placeholder="✨ ধামাকা ক্লিয়ারেন্স অফার ✨"
                                 className="h-8 text-sm"
                               />
                             </div>
                             
                             {/* Offer Details Box */}
                             <div className="border rounded-lg p-2 space-y-2 bg-background">
                               <Label className="text-xs font-medium text-muted-foreground">📦 অফার বক্স (ড্যাশড বর্ডার)</Label>
                               <div>
                                 <Label className="text-xs text-muted-foreground">প্রাইস লাইন (গোল্ডেন টেক্সট)</Label>
                                 <Input
                                   value={formData.discount_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, discount_text: e.target.value }))}
                                   placeholder="মাত্র ২০০০ টাকায়"
                                   className="h-8 text-sm"
                                 />
                               </div>
                               <div>
                                 <Label className="text-xs text-muted-foreground">অফার আইটেম (সাদা টেক্সট)</Label>
                                 <Input
                                   value={formData.offer_details}
                                   onChange={(e) => setFormData(prev => ({ ...prev, offer_details: e.target.value }))}
                                   placeholder="৪ সেট কোয়ালিটি থ্রি-পিস"
                                   className="h-8 text-sm"
                                 />
                               </div>
                             </div>

                             {/* Countdown Toggle */}
                             <div className="flex items-center gap-2">
                               <Switch
                                 checked={formData.show_countdown}
                                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_countdown: checked }))}
                                 className="scale-75"
                               />
                               <Label className="text-xs">কাউন্টডাউন টাইমার দেখান</Label>
                             </div>
                             {formData.show_countdown && (
                               <div>
                                 <Label className="text-xs text-muted-foreground">কাউন্টডাউন শেষ তারিখ</Label>
                                 <Input
                                   type="datetime-local"
                                   value={formData.countdown_end_date}
                                   onChange={(e) => setFormData(prev => ({ ...prev, countdown_end_date: e.target.value }))}
                                   className="h-8 text-sm"
                                 />
                               </div>
                             )}

                             {/* CTA Button Text */}
                             <div>
                               <Label className="text-xs text-muted-foreground">CTA বাটন টেক্সট</Label>
                               <Input
                                 value={formData.cta_button_text}
                                 onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                 placeholder="অর্ডার করতে এখানে ক্লিক করুন 🛒"
                                 className="h-8 text-sm"
                               />
                             </div>

                             {/* Urgency Text */}
                             <div>
                               <Label className="text-xs text-muted-foreground">আর্জেন্সি টেক্সট (বাটনের নিচে)</Label>
                               <Input
                                 value={formData.cta_urgency_text}
                                 onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                 placeholder="⚠️ অফারটি শেষ হওয়ার আগেই লুফে নিন!"
                                 className="h-8 text-sm"
                               />
                             </div>
                           </div>
                         );
                       }
                       
                        // Template 07 (Gadget) specific hero editor
                        const isTemplate07 = formData.template_id === 'template-07-gadget';
                        
                        if (isTemplate07) {
                          return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (গ্যাজেট)</Label>
                              
                              {/* Badge/Small Title */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ছোট টাইটেল (ব্যাজ)</Label>
                                <Input
                                  value={formData.hero_badge_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                  placeholder="🔥 স্পেশাল গ্যাজেট অফার 🔥"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Countdown */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={formData.show_countdown}
                                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_countdown: checked }))}
                                  className="scale-75"
                                />
                                <Label className="text-xs">কাউন্টডাউন টাইমার দেখান</Label>
                              </div>
                              {formData.show_countdown && (
                                <>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">কাউন্টডাউন শেষ তারিখ</Label>
                                    <Input
                                      type="datetime-local"
                                      value={formData.countdown_end_date}
                                      onChange={(e) => setFormData(prev => ({ ...prev, countdown_end_date: e.target.value }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">কাউন্টডাউন উপরের টেক্সট</Label>
                                    <Input
                                      value={formData.cta_urgency_text}
                                      onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                      placeholder="⏰ অফার শেষ হতে বাকি"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </>
                              )}

                              {/* Main Heading */}
                              <div>
                                <Label className="text-xs text-muted-foreground">মেইন হেডলাইন</Label>
                                <Textarea
                                  value={formData.hero_headline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                  placeholder="প্রিমিয়াম গ্যাজেট"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Sub Headline / Product Name */}
                              <div>
                                <Label className="text-xs text-muted-foreground">সাবহেডলাইন / প্রোডাক্ট নেম</Label>
                                <Input
                                  value={formData.hero_subheadline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                  placeholder="হাই কোয়ালিটি ব্লুটুথ ইয়ারবাড"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Discount Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ডিসকাউন্ট ব্যাজ (লাল)</Label>
                                <Input
                                  value={formData.discount_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, discount_text: e.target.value }))}
                                  placeholder="৩০% অফ"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* CTA Button */}
                              <div>
                                <Label className="text-xs text-muted-foreground">CTA বাটন টেক্সট</Label>
                                <Input
                                  value={formData.cta_button_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                  placeholder="🛒 এখনই অর্ডার করুন"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Hero Image */}
                              <ImageGrid images={formData.hero_images} target="hero" />
                            </div>
                          );
                         }

                        // Template 09 (Super Food) specific hero editor
                        const isTemplate09 = formData.template_id === 'template-09-superfood';
                        
                        if (isTemplate09) {
                          return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (সুপার ফুড)</Label>
                              
                              {/* Main Heading */}
                              <div>
                                <Label className="text-xs text-muted-foreground">মেইন হেডলাইন</Label>
                                <Textarea
                                  value={formData.hero_headline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                  placeholder="গ্যারান্টি সহকারে উচ্চরক্তচাপ ও ফ্যাটি লিভার কমাবে"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Badge (Free Delivery etc) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ব্যাজ টেক্সট (পালস এনিমেশন সহ)</Label>
                                <Input
                                  value={formData.hero_badge_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                  placeholder="ডেলিভারি চার্জ একদম ফ্রি!"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Video URL */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ভিডিও URL (YouTube)</Label>
                                <Input
                                  value={formData.hero_video_url}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Sub Headline (Short Title) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">শর্ট টাইটেল (ভিডিওর নিচে)</Label>
                                <Input
                                  value={formData.hero_subheadline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                  placeholder="প্রাকৃতিক উপায়ে সুস্থ থাকুন প্রতিদিন"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* CTA Button Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">অর্ডার বাটন টেক্সট</Label>
                                <Input
                                  value={formData.cta_button_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                  placeholder="অর্ডার করতে চাই"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Colors */}
                              <div className="border rounded-lg p-2 space-y-2 bg-background">
                                <Label className="text-xs font-medium text-muted-foreground">🎨 কালার সেটিংস</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">কার্ড ব্যাকগ্রাউন্ড</Label>
                                    <div className="flex gap-1">
                                      <Input type="color" value={formData.background_color} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                      <Input value={formData.background_color} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">ব্যাজ কালার</Label>
                                    <div className="flex gap-1">
                                      <Input type="color" value={formData.accent_color} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                      <Input value={formData.accent_color} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">হেডলাইন কালার</Label>
                                    <div className="flex gap-1">
                                      <Input type="color" value={formData.headline_color} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                      <Input value={formData.headline_color} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">বাটন কালার</Label>
                                    <div className="flex gap-1">
                                      <Input type="color" value={formData.button_color} onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                      <Input value={formData.button_color} onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Hero Image (fallback when no video) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">প্রোডাক্ট ইমেজ (ভিডিও না থাকলে দেখাবে)</Label>
                                <ImageGrid images={formData.hero_images} target="hero" />
                              </div>
                            </div>
                          );
                        }

                        // Template 08 (Minimal/Promo Card) specific hero editor
                        const isTemplate08 = formData.template_id === 'template-08-minimal';
                        
                        if (isTemplate08) {
                          return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (প্রোমো কার্ড)</Label>
                              
                              {/* Header Heading */}
                              <div>
                                <Label className="text-xs text-muted-foreground">হেডিং (অরেঞ্জ হেডার টেক্সট)</Label>
                                <Textarea
                                  value={formData.hero_headline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                  placeholder="ঘরে বসে মুহূর্তেই তৈরি করুন নির্ভেজাল সুস্বাদু দই"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Colors */}
                              <div className="border rounded-lg p-2 space-y-2 bg-background">
                                <Label className="text-xs font-medium text-muted-foreground">🎨 কালার সেটিংস</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">হেডার ব্যাকগ্রাউন্ড</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">কার্ড ব্যাকগ্রাউন্ড</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.background_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">বর্ডার কালার</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.accent_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.accent_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">বাটন কালার</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.button_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.button_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">টাইটেল কালার</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.headline_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.headline_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">সাবটাইটেল কালার</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={formData.text_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                                        className="h-8 w-10 p-0.5"
                                      />
                                      <Input
                                        value={formData.text_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Title (টাইটেল) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">টাইটেল (গাঢ় টেক্সট)</Label>
                                <Textarea
                                  value={formData.hero_subheadline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                  placeholder="তীব্র গরমে শরীরে প্রয়োজনীয় পুষ্টি জোগাতে"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Subtitle (সাবটাইটেল / হাইলাইট) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">সাবটাইটেল (হাইলাইট টেক্সট)</Label>
                                <Textarea
                                  value={formData.hero_badge_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                  placeholder="অটোমেটিক দই মেকার!"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Video URL */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ভিডিও URL (YouTube)</Label>
                                <Input
                                  value={formData.hero_video_url}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Offer Box */}
                              <div className="border rounded-lg p-2 space-y-2 bg-background">
                                <Label className="text-xs font-medium text-muted-foreground">📦 অফার বক্স (বর্ডার বক্সের মধ্যে)</Label>
                                <Textarea
                                  value={formData.offer_details}
                                  onChange={(e) => setFormData(prev => ({ ...prev, offer_details: e.target.value }))}
                                  placeholder="৩০% ডিসকাউন্ট সাথে ফ্রি ডেলিভারি শুধুমাত্র আজকের জন্য! ১ টাকা অগ্রীম ছাড়া এখনি অর্ডার করুন।"
                                  className="min-h-[60px] text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">HTML সাপোর্টেড: &lt;span style="color:#f39c12"&gt;গোল্ডেন টেক্সট&lt;/span&gt;</p>
                              </div>
                              
                              {/* CTA Button Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">অর্ডার বাটন টেক্সট</Label>
                                <Input
                                  value={formData.cta_button_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                  placeholder="অর্ডার করতে চাই"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Hero Image (fallback when no video) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">প্রোডাক্ট ইমেজ (ভিডিও না থাকলে দেখাবে)</Label>
                                <ImageGrid images={formData.hero_images} target="hero" />
                              </div>
                            </div>
                          );
                        }

                        // Template 06 (Attar/Perfume) specific hero editor
                         const isTemplate06 = formData.template_id === 'template-06-panjabi';
                         
                         if (isTemplate06) {
                          return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (আতর)</Label>
                              
                              {/* Badge Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ব্যাজ টেক্সট (উপরে ছোট লেখা)</Label>
                                <Input
                                  value={formData.hero_badge_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                  placeholder="প্রিমিয়াম পারফিউম কালেকশন"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* Main Headline - Line 1 (Dark/Primary color) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">মেইন হেডলাইন (১ম লাইন - প্রাইমারি কালার)</Label>
                                <Textarea
                                  value={formData.hero_headline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                  placeholder="আপনার ব্যক্তিত্বকে করুন"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>
                              
                              {/* Sub Headline - Line 2 (Accent/Green color) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">সাবহেডলাইন (২য় লাইন - অ্যাকসেন্ট কালার)</Label>
                                <Input
                                  value={formData.hero_subheadline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                  placeholder="মায়াবী ও অতুলনীয়"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* Offer Details (Free Delivery Badge) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">অফার ডিটেইলস (সবুজ ব্যাজ)</Label>
                                <Input
                                  value={formData.offer_details}
                                  onChange={(e) => setFormData(prev => ({ ...prev, offer_details: e.target.value }))}
                                  placeholder="সারা বাংলাদেশে ফ্রি হোম ডেলিভারি"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* Discount Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ডিসকাউন্ট টেক্সট (লাল ব্যাজ)</Label>
                                <Input
                                  value={formData.discount_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, discount_text: e.target.value }))}
                                  placeholder="৩৫% অফ"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* CTA Button Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">CTA বাটন টেক্সট</Label>
                                <Input
                                  value={formData.cta_button_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                  placeholder="অর্ডার করতে চাই"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* Urgency Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">আর্জেন্সি টেক্সট (বাটনের নিচে)</Label>
                                <Input
                                  value={formData.cta_urgency_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                  placeholder="সীমিত স্টক! মিস করবেন না"
                                  className="h-8 text-sm"
                                />
                              </div>
                              
                              {/* Hero Image */}
                              <ImageGrid images={formData.hero_images} target="hero" />
                            </div>
                          );
                        }

                         // Template 10 (Super Food 2) specific hero editor
                         const isTemplate10 = formData.template_id === 'template-10-superfood2';
                         
                         if (isTemplate10) {
                           return (
                             <div className="p-3 bg-muted/30 space-y-2">
                               <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (সুপার ফুড ২)</Label>
                               
                               {/* Badge Text (Short Subheading) */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">ব্যাজ টেক্সট (ছোট সাবহেডিং)</Label>
                                 <Input
                                   value={formData.hero_badge_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                   placeholder="🌱 ১০০% প্রাকৃতিক সুপারফুড"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Main Headline */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">মেইন হেডলাইন (১ম লাইন)</Label>
                                 <Textarea
                                   value={formData.hero_headline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                   placeholder="সুস্বাস্থ্য নিশ্চিত করুন"
                                   className="min-h-[50px] text-sm"
                                 />
                               </div>

                               {/* Headline 2nd Line (Accent Color) */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">হেডলাইন ২য় লাইন (অ্যাকসেন্ট কালারে দেখাবে)</Label>
                                 <Input
                                   value={formData.discount_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, discount_text: e.target.value }))}
                                   placeholder="সেরা সুপারফুডে"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Subheadline / Description */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">সাবহেডিং / সর্ট ডিস্ক্রিপশন</Label>
                                 <Textarea
                                   value={formData.hero_subheadline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                   placeholder="শরীরের রোগ প্রতিরোধ ক্ষমতা বাড়াতে আমাদের প্রিমিয়াম পণ্যগুলো কার্যকরী।"
                                   className="min-h-[50px] text-sm"
                                 />
                               </div>

                               {/* CTA Button Text */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">অর্ডার বাটন টেক্সট</Label>
                                 <Input
                                   value={formData.cta_button_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                   placeholder="এখনই কিনুন"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Colors */}
                               <div className="border rounded-lg p-2 space-y-2 bg-background">
                                 <Label className="text-xs font-medium text-muted-foreground">🎨 কালার সেটিংস</Label>
                                 <div className="grid grid-cols-2 gap-2">
                                   <div>
                                     <Label className="text-xs text-muted-foreground">গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড</Label>
                                     <div className="flex gap-1">
                                       <Input type="color" value={formData.background_color} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                       <Input value={formData.background_color} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                     </div>
                                   </div>
                                   <div>
                                     <Label className="text-xs text-muted-foreground">গ্রেডিয়েন্ট প্রাইমারি</Label>
                                     <div className="flex gap-1">
                                       <Input type="color" value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                       <Input value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                     </div>
                                   </div>
                                   <div>
                                     <Label className="text-xs text-muted-foreground">অ্যাকসেন্ট / বাটন কালার</Label>
                                     <div className="flex gap-1">
                                       <Input type="color" value={formData.accent_color} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                       <Input value={formData.accent_color} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                     </div>
                                   </div>
                                   <div>
                                     <Label className="text-xs text-muted-foreground">হেডলাইন কালার</Label>
                                     <div className="flex gap-1">
                                       <Input type="color" value={formData.headline_color} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                       <Input value={formData.headline_color} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} className="h-8 text-xs flex-1" />
                                     </div>
                                   </div>
                                 </div>
                               </div>

                                  {/* Product Grid in Hero (uses hero_images) */}
                                  <div className="border rounded-lg p-2 space-y-2 bg-background mt-2">
                                    <Label className="text-xs font-medium text-muted-foreground">📦 প্রোডাক্ট গ্রিড (হিরো সেকশনে দেখাবে)</Label>
                                    <Input
                                      value={formData.gallery_title}
                                      onChange={(e) => setFormData(prev => ({ ...prev, gallery_title: e.target.value }))}
                                      placeholder="হেডিং (যেমন: আমাদের প্রডাক্ট সমূহ)"
                                      className="h-8 text-sm"
                                    />
                                    <div>
                                      <Label className="text-xs text-muted-foreground">মুদ্রা চিহ্ন</Label>
                                      <Input
                                        value={formData.price_unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_unit: e.target.value }))}
                                        placeholder="৳"
                                        className="h-8 text-sm w-20"
                                      />
                                    </div>
                                    <ImageGrid images={formData.hero_images} target="hero" />
                                    
                                    {/* Per-image price tags */}
                                    {formData.hero_images.length > 0 && (
                                      <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground">💰 প্রতিটি ইমেজের প্রাইস ট্যাগ</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                          {formData.hero_images.map((img, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                              </div>
                                              <Input
                                                type="number"
                                                value={formData.gallery_product_prices[idx] || ''}
                                                onChange={(e) => {
                                                  const newPrices = [...formData.gallery_product_prices];
                                                  while (newPrices.length <= idx) newPrices.push(0);
                                                  newPrices[idx] = Number(e.target.value);
                                                  setFormData(prev => ({ ...prev, gallery_product_prices: newPrices }));
                                                }}
                                                placeholder={`ইমেজ ${idx + 1} প্রাইস`}
                                                className="h-7 text-xs flex-1"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                               </div>
                             );
                           }
                         // Template 11 (Super Food 3) specific hero editor
                         const isTemplate11 = formData.template_id === 'template-11-superfood3';
                         
                         if (isTemplate11) {
                           return (
                             <div className="p-3 bg-muted/30 space-y-2">
                               <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (সুপার ফুড ৩)</Label>
                               
                               {/* Offer Badge Text */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">🔥 অফার ব্যাজ টেক্সট</Label>
                                 <Input
                                   value={formData.hero_badge_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                   placeholder="🔥 ৫০% ডিসকাউন্ট অফার!"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Urgency Text */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">⚡ আর্জেন্সি টেক্সট</Label>
                                 <Input
                                   value={formData.cta_urgency_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                   placeholder="সীমিত স্টক! মিস করবেন না"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Countdown Toggle */}
                               <div className="flex items-center gap-2">
                                 <Switch
                                   checked={formData.show_countdown}
                                   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_countdown: checked }))}
                                   className="scale-75"
                                 />
                                 <Label className="text-xs">⏰ কাউন্টডাউন টাইমার দেখান</Label>
                               </div>
                               {formData.show_countdown && (
                                 <div>
                                   <Label className="text-xs text-muted-foreground">কাউন্টডাউন শেষ তারিখ</Label>
                                   <Input
                                     type="datetime-local"
                                     value={formData.countdown_end_date}
                                     onChange={(e) => setFormData(prev => ({ ...prev, countdown_end_date: e.target.value }))}
                                     className="h-8 text-sm"
                                   />
                                 </div>
                               )}

                               {/* Headline */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">📝 হেডলাইন</Label>
                                 <Textarea
                                   value={formData.hero_headline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                   placeholder="আপনার প্রিমিয়াম প্রোডাক্টের আকর্ষণীয় নাম দিন"
                                   className="min-h-[50px] text-sm"
                                 />
                               </div>

                               {/* Short Description */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">📄 শর্ট ডেসক্রিপশন</Label>
                                 <Textarea
                                   value={formData.hero_subheadline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                   placeholder="সেরা মানের এবং আধুনিক ডিজাইনের এই প্রোডাক্টটি..."
                                   className="min-h-[40px] text-sm"
                                 />
                               </div>

                               {/* Hero Image */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">🖼️ প্রোডাক্ট ইমেজ</Label>
                                 <ImageGrid images={formData.hero_images} target="hero" />
                               </div>

                               {/* Video URL (embedded in hero) */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">🎬 ভিডিও URL (হিরোতে দেখাবে)</Label>
                                 <Input
                                   value={formData.hero_video_url}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                   placeholder="https://www.youtube.com/watch?v=..."
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* CTA Button Text */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">🛒 অর্ডার বাটন টেক্সট</Label>
                                 <Input
                                   value={formData.cta_button_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                   placeholder="অর্ডার করুন"
                                   className="h-8 text-sm"
                                 />
                               </div>
                             </div>
                           );
                          }

                          // Template 12 (Gadget 3) specific hero editor - Fullscreen BG Image
                          const isTemplate12 = formData.template_id === 'template-12-gadget3';
                          
                          if (isTemplate12) {
                            return (
                              <div className="p-3 bg-muted/30 space-y-2">
                                <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (গ্যাজেট ৩)</Label>

                                {/* Header Title Text */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">🏷️ হেডার টাইটেল (GadgetStore)</Label>
                                  <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="GadgetStore"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                
                                {/* Badge Text */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">🔥 ব্যাজ টেক্সট (পালস অ্যানিমেশন)</Label>
                                  <Input
                                    value={formData.hero_badge_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                    placeholder="সীমিত সময়ের অফার!"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {/* Main Heading (white text) */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">📝 মেইন হেডলাইন (সাদা টেক্সট)</Label>
                                  <Textarea
                                    value={formData.hero_headline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                    placeholder="আপনার গেমিং অভিজ্ঞতাকে করুন"
                                    className="min-h-[50px] text-sm"
                                  />
                                </div>

                                {/* Highlighted Text (gradient color) */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">✨ হাইলাইটেড টেক্সট (গ্রাডিয়েন্ট কালার)</Label>
                                  <Input
                                    value={formData.hero_subheadline}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                    placeholder="আরো স্মার্ট!"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {/* Description */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">📄 ডিসক্রিপশন</Label>
                                  <Textarea
                                    value={formData.offer_details}
                                    onChange={(e) => setFormData(prev => ({ ...prev, offer_details: e.target.value }))}
                                    placeholder="সেরা কোয়ালিটি এবং প্রিমিয়াম ডিজাইনের ব্লুটুথ হেডফোন, এখন বিশেষ ডিসকাউন্টে।"
                                    className="min-h-[50px] text-sm"
                                  />
                                </div>

                                {/* CTA Button Text */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">🛒 CTA বাটন টেক্সট</Label>
                                  <Input
                                    value={formData.cta_button_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                    placeholder="অফারটি লুফে নিন"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {/* Phone Number for Header */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">📞 হেডারে ফোন নাম্বার</Label>
                                  <Input
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                    placeholder="01XXXXXXXXX"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">📞 ফোন লিংক (tel:)</Label>
                                  <Input
                                    value={formData.contact_phone_link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_link: e.target.value }))}
                                    placeholder="tel:01XXXXXXXXX"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {/* Color Settings */}
                                <div className="border rounded-lg p-2 space-y-2 bg-background">
                                  <Label className="text-xs font-medium text-muted-foreground">🎨 কালার সেটিংস</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">হেডার কালার</Label>
                                      <div className="flex gap-1">
                                        <Input type="color" value={formData.primary_color || '#0f172a'} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                        <Input value={formData.primary_color || '#0f172a'} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} placeholder="#0f172a" className="h-8 text-xs flex-1" />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">ব্যাকগ্রাউন্ড কালার</Label>
                                      <div className="flex gap-1">
                                        <Input type="color" value={formData.background_color || '#0f172a'} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                        <Input value={formData.background_color || '#0f172a'} onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))} placeholder="#0f172a" className="h-8 text-xs flex-1" />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">বাটন কালার</Label>
                                      <div className="flex gap-1">
                                        <Input type="color" value={formData.button_color || '#ff4757'} onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                        <Input value={formData.button_color || '#ff4757'} onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))} placeholder="#ff4757" className="h-8 text-xs flex-1" />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">অ্যাকসেন্ট কালার</Label>
                                      <div className="flex gap-1">
                                        <Input type="color" value={formData.accent_color || '#ff4757'} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                        <Input value={formData.accent_color || '#ff4757'} onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))} placeholder="#ff4757" className="h-8 text-xs flex-1" />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">হেডলাইন কালার</Label>
                                      <div className="flex gap-1">
                                        <Input type="color" value={formData.headline_color || '#ffffff'} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} className="h-8 w-10 p-0.5" />
                                        <Input value={formData.headline_color || '#ffffff'} onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))} placeholder="#ffffff" className="h-8 text-xs flex-1" />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Hero Images */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">🖼️ হিরো ইমেজ (স্লাইডার)</Label>
                                  <ImageGrid images={formData.hero_images} target="hero" />
                                </div>

                                {/* Hero Video URL */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">🎬 হিরো ভিডিও URL (YouTube)</Label>
                                  <Input
                                    value={formData.hero_video_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            );
                          }

                         // Template 13 (Natural Card) specific hero editor
                         const isTemplate13 = formData.template_id === 'template-13-natural-card';
                         
                         if (isTemplate13) {
                           return (
                             <div className="p-3 bg-muted/30 space-y-2">
                               <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (ন্যাচারাল কার্ড)</Label>
                               
                               {/* Main Heading */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">মেইন হেডলাইন</Label>
                                 <Textarea
                                   value={formData.hero_headline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                   placeholder="☘️রূপচর্চায় ব্যবহার করুন প্রাকৃতিক উপাদান☘️"
                                   className="min-h-[50px] text-sm"
                                 />
                               </div>

                               {/* Sub Headline (accent color text) */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">সাবহেডলাইন (অ্যাকসেন্ট কালারে দেখাবে)</Label>
                                 <Input
                                   value={formData.hero_subheadline}
                                   onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                   placeholder="প্রকৃতির মধ্যে রয়েছে সকল সমস্যার সমাধান"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Badge & Urgency */}
                               <div className="grid grid-cols-2 gap-2">
                                 <div>
                                   <Label className="text-xs text-muted-foreground">ব্যাজ টেক্সট</Label>
                                   <Input
                                     value={formData.hero_badge_text}
                                     onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                     placeholder="🌿 ১০০% অর্গানিক ও প্রাকৃতিক"
                                     className="h-8 text-sm"
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-xs text-muted-foreground">আর্জেন্সি টেক্সট</Label>
                                   <Input
                                     value={formData.cta_urgency_text}
                                     onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                     placeholder="সীমিত স্টক! মিস করবেন না"
                                     className="h-8 text-sm"
                                   />
                                 </div>
                               </div>

                               {/* CTA Button Text */}
                               <div>
                                 <Label className="text-xs text-muted-foreground">CTA বাটন টেক্সট</Label>
                                 <Input
                                   value={formData.cta_button_text}
                                   onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                   placeholder="অর্ডার করুন"
                                   className="h-8 text-sm"
                                 />
                               </div>

                               {/* Hero Images */}
                               <ImageGrid images={formData.hero_images} target="hero" />
                             </div>
                           );
                         }

                        // Template 14 (Video Organic) specific hero editor
                        const isTemplate14 = formData.template_id === 'template-14-video-organic';
                        
                        if (isTemplate14) {
                          return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস (ভিডিও অর্গানিক)</Label>
                              
                              {/* Main Heading */}
                              <div>
                                <Label className="text-xs text-muted-foreground">মেইন হেডিং (গ্রিন হেডার বক্স)</Label>
                                <Textarea
                                  value={formData.hero_headline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                  placeholder="পুষ্টির ঘাটতি পূরণ, শারীরিক শক্তি ও রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি..."
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* Sub Heading */}
                              <div>
                                <Label className="text-xs text-muted-foreground">সাব হেডিং (গ্রিন টেক্সট)</Label>
                                <Input
                                  value={formData.hero_subheadline}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                                  placeholder="আমাদের 11 টি প্রোডাক্ট আপনি কীভাবে হাতে পাবেন দেখুন"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Video URL */}
                              <div>
                                <Label className="text-xs text-muted-foreground">ভিডিও লিঙ্ক (YouTube)</Label>
                                <Input
                                  value={formData.hero_video_url}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Short Description */}
                              <div>
                                <Label className="text-xs text-muted-foreground">সর্ট ডিস্ক্রিপশন (ভিডিওর নিচে)</Label>
                                <Textarea
                                  value={formData.offer_details}
                                  onChange={(e) => setFormData(prev => ({ ...prev, offer_details: e.target.value }))}
                                  placeholder="সম্পূর্ণ অর্গানিক উপাদান দিয়ে তৈরি (কোন পার্শ্ব প্রতিক্রিয়া নেই)"
                                  className="min-h-[50px] text-sm"
                                />
                              </div>

                              {/* CTA Button Text */}
                              <div>
                                <Label className="text-xs text-muted-foreground">অর্ডার বাটন টেক্সট</Label>
                                <Input
                                  value={formData.cta_button_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                                  placeholder="অর্ডার করুন"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Hero Image (fallback when no video) */}
                              <div>
                                <Label className="text-xs text-muted-foreground">প্রোডাক্ট ইমেজ (ভিডিও না থাকলে দেখাবে)</Label>
                                <ImageGrid images={formData.hero_images} target="hero" />
                              </div>
                            </div>
                          );
                        }

                             // Default hero editor for all other templates (unchanged)
                         return (
                            <div className="p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs font-medium">হিরো সেকশন সেটিংস</Label>
                              <Textarea
                                value={formData.hero_headline}
                                onChange={(e) => setFormData(prev => ({ ...prev, hero_headline: e.target.value }))}
                                placeholder="হেডলাইন"
                                className="min-h-[50px] text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={formData.hero_badge_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                                  placeholder="ব্যাজ টেক্সট"
                                  className="h-8 text-sm"
                                />
                                <Input
                                  value={formData.cta_urgency_text}
                                  onChange={(e) => setFormData(prev => ({ ...prev, cta_urgency_text: e.target.value }))}
                                  placeholder="আর্জেন্সি টেক্সট"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <ImageGrid images={formData.hero_images} target="hero" />
                            </div>
                          );
                     case 'video':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">ভিডিও সেকশন সেটিংস</Label>
                          <Input
                            value={formData.hero_video_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, hero_video_url: e.target.value }))}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="h-8 text-sm"
                          />
                        </div>
                      );
                    case 'gallery':
                      // Template 10: Simple gallery (product grid is in hero)
                      if (formData.template_id === 'template-10-superfood2') {
                        return (
                          <div className="p-3 bg-muted/30 space-y-2">
                            <Label className="text-xs font-medium">🖼️ গ্যালারি সেকশন (ইমেজ শোকেস)</Label>
                            <Input
                              value={formData.gallery_title}
                              onChange={(e) => setFormData(prev => ({ ...prev, gallery_title: e.target.value }))}
                              placeholder="গ্যালারি শিরোনাম"
                              className="h-8 text-sm"
                            />
                            <Input
                              value={formData.gallery_subtitle}
                              onChange={(e) => setFormData(prev => ({ ...prev, gallery_subtitle: e.target.value }))}
                              placeholder="গ্যালারি সাবটাইটেল"
                              className="h-8 text-sm"
                            />
                            <ImageGrid images={formData.gallery_images} target="gallery" />
                          </div>
                        );
                      }
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">গ্যালারি সেকশন</Label>
                          <Input
                            value={formData.gallery_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, gallery_title: e.target.value }))}
                            placeholder="গ্যালারি শিরোনাম (যেমন: আমাদের সার্টিফিকেশন)"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={formData.gallery_subtitle}
                            onChange={(e) => setFormData(prev => ({ ...prev, gallery_subtitle: e.target.value }))}
                            placeholder="গ্যালারি সাবটাইটেল"
                            className="h-8 text-sm"
                          />
                          <ImageGrid images={formData.gallery_images} target="gallery" />
                        </div>
                      );
                    case 'features':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">ফিচার সেকশন</Label>
                          <Input
                            value={formData.features_headline}
                            onChange={(e) => setFormData(prev => ({ ...prev, features_headline: e.target.value }))}
                            placeholder="হেডলাইন (যেমন: কি কি থাকছে?)"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={formData.features_subheadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, features_subheadline: e.target.value }))}
                            placeholder="সাবহেডলাইন (যেমন: আমাদের বিশেষত্ব ও গ্যারান্টি)"
                            className="h-8 text-sm"
                          />
                          {formData.feature_points.map((feature, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={feature.icon}
                                onChange={(e) => {
                                  const newFeatures = [...formData.feature_points];
                                  newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                                  setFormData(prev => ({ ...prev, feature_points: newFeatures }));
                                }}
                                className="w-12 h-7 text-center text-sm"
                                placeholder="✅"
                              />
                              <Input
                                value={feature.text}
                                onChange={(e) => {
                                  const newFeatures = [...formData.feature_points];
                                  newFeatures[index] = { ...newFeatures[index], text: e.target.value };
                                  setFormData(prev => ({ ...prev, feature_points: newFeatures }));
                                }}
                                className="flex-1 h-7 text-sm"
                                placeholder="ফিচার টেক্সট"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const newFeatures = formData.feature_points.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, feature_points: newFeatures }));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              feature_points: [...prev.feature_points, { icon: '✅', text: '', description: '' }]
                            }))}
                          >
                             + ফিচার যোগ করুন
                          </Button>

                          {/* Feature Section Image - Single (Template 08) */}
                          {(formData.template_id === 'template-08-minimal' || formData.template_id === 'template-14-video-organic') && (
                            <div className="border rounded-lg p-2 space-y-2 bg-background">
                              <Label className="text-xs font-medium text-muted-foreground">🖼️ ফিচার সেকশন ইমেজ</Label>
                              {formData.feature_section_image ? (
                                <div className="relative group">
                                  <img 
                                    src={formData.feature_section_image} 
                                    alt="Feature" 
                                    className="w-full rounded border object-cover max-h-40" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, feature_section_image: "" }))}
                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="border border-dashed rounded p-3 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/50"
                                  onClick={() => triggerUpload("feature")}
                                >
                                   <Upload className="h-4 w-4 mx-auto mb-1" />
                                   ইমেজ আপলোড করুন
                                   <p className="text-[10px] mt-1 opacity-70">{getRecommendedSize("feature")}</p>
                                 </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-xs"
                                onClick={() => triggerUpload("feature")}
                                disabled={uploading}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {uploading ? "..." : "ইমেজ পরিবর্তন করুন"}
                              </Button>
                            </div>
                          )}

                          {/* Feature Section Images - Multiple/Carousel (Template 09) */}
                          {formData.template_id === 'template-09-superfood' && (
                            <div className="border rounded-lg p-2 space-y-2 bg-background">
                              <Label className="text-xs font-medium text-muted-foreground">🖼️ ফিচার ক্যারোসেল ইমেজ</Label>
                              {formData.feature_section_images.length > 0 && (
                                <div className="grid grid-cols-3 gap-1">
                                  {formData.feature_section_images.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                      <img 
                                        src={img} 
                                        alt={`Feature ${idx + 1}`} 
                                        className="w-full rounded border object-cover h-20" 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ 
                                          ...prev, 
                                          feature_section_images: prev.feature_section_images.filter((_, i) => i !== idx) 
                                        }))}
                                        className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-xs"
                                onClick={() => triggerUpload("feature")}
                                disabled={uploading}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {uploading ? "..." : "ইমেজ যুক্ত করুন"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    case 'reviews':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">রিভিউ সেকশন</Label>
                          <Input
                            value={formData.reviews_headline}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviews_headline: e.target.value }))}
                            placeholder="রিভিউ শিরোনাম (যেমন: সম্মানিত কাস্টমারদের মতামত)"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={formData.reviews_subheadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, reviews_subheadline: e.target.value }))}
                            placeholder="রিভিউ সাবটাইটেল"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={formData.review_video_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, review_video_url: e.target.value }))}
                            placeholder="রিভিউ ভিডিও URL (YouTube)"
                            className="h-8 text-sm"
                          />
                          <ImageGrid images={formData.review_images} target="review" />
                        </div>
                      );
                    case 'contact':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">কন্টাক্ট সেকশন</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={formData.contact_phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                              placeholder="ফোন নম্বর"
                              className="h-8 text-sm"
                            />
                            <Input
                              value={formData.contact_whatsapp}
                              onChange={(e) => setFormData(prev => ({ ...prev, contact_whatsapp: e.target.value }))}
                              placeholder="হোয়াটসঅ্যাপ"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      );
                    case 'spec':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">টেকনিক্যাল স্পেসিফিকেশন সেকশন</Label>
                          <div>
                            <Label className="text-xs text-muted-foreground">সেকশন হেডিং</Label>
                            <Input
                              value={formData.spec_section_heading}
                              onChange={(e) => setFormData(prev => ({ ...prev, spec_section_heading: e.target.value }))}
                              placeholder="টেকনিক্যাল স্পেসিফিকেশন"
                              className="h-8 text-sm"
                            />
                          </div>
                          {formData.spec_items.map((item, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={item.label}
                                onChange={(e) => {
                                  const newItems = [...formData.spec_items];
                                  newItems[index] = { ...newItems[index], label: e.target.value };
                                  setFormData(prev => ({ ...prev, spec_items: newItems }));
                                }}
                                placeholder="লেবেল (যেমন: পাওয়ার)"
                                className="flex-1 h-7 text-sm"
                              />
                              <Input
                                value={item.value}
                                onChange={(e) => {
                                  const newItems = [...formData.spec_items];
                                  newItems[index] = { ...newItems[index], value: e.target.value };
                                  setFormData(prev => ({ ...prev, spec_items: newItems }));
                                }}
                                placeholder="মান (যেমন: ১৪০০ ওয়াট)"
                                className="flex-1 h-7 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const newItems = formData.spec_items.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, spec_items: newItems }));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              spec_items: [...prev.spec_items, { label: '', value: '' }]
                            }))}
                          >
                            + স্পেক যোগ করুন
                          </Button>
                        </div>
                      );
                    case 'extra1':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">এক্সট্রা সেকশন ১</Label>
                          <Input
                            value={formData.extra_section_1_heading}
                            onChange={(e) => setFormData(prev => ({ ...prev, extra_section_1_heading: e.target.value }))}
                            placeholder="হেডিং"
                            className="h-8 text-sm"
                          />
                          {formData.extra_section_1_points.map((point, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...formData.extra_section_1_points];
                                  newPoints[index] = e.target.value;
                                  setFormData(prev => ({ ...prev, extra_section_1_points: newPoints }));
                                }}
                                placeholder={`পয়েন্ট ${index + 1}`}
                                className="flex-1 h-7 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const newPoints = formData.extra_section_1_points.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, extra_section_1_points: newPoints }));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              extra_section_1_points: [...prev.extra_section_1_points, '']
                            }))}
                          >
                            + পয়েন্ট যোগ করুন
                          </Button>
                        </div>
                      );
                    case 'extra2':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">এক্সট্রা সেকশন ২</Label>
                          <Input
                            value={formData.extra_section_2_heading}
                            onChange={(e) => setFormData(prev => ({ ...prev, extra_section_2_heading: e.target.value }))}
                            placeholder="হেডিং"
                            className="h-8 text-sm"
                          />
                          {formData.extra_section_2_points.map((point, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...formData.extra_section_2_points];
                                  newPoints[index] = e.target.value;
                                  setFormData(prev => ({ ...prev, extra_section_2_points: newPoints }));
                                }}
                                placeholder={`পয়েন্ট ${index + 1}`}
                                className="flex-1 h-7 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const newPoints = formData.extra_section_2_points.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, extra_section_2_points: newPoints }));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              extra_section_2_points: [...prev.extra_section_2_points, '']
                            }))}
                          >
                            + পয়েন্ট যোগ করুন
                          </Button>
                        </div>
                      );
                    case 'extra3':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium">এক্সট্রা সেকশন ৩</Label>
                          <Input
                            value={formData.extra_section_3_heading}
                            onChange={(e) => setFormData(prev => ({ ...prev, extra_section_3_heading: e.target.value }))}
                            placeholder="হেডিং"
                            className="h-8 text-sm"
                          />
                          {formData.extra_section_3_points.map((point, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...formData.extra_section_3_points];
                                  newPoints[index] = e.target.value;
                                  setFormData(prev => ({ ...prev, extra_section_3_points: newPoints }));
                                }}
                                placeholder={`পয়েন্ট ${index + 1}`}
                                className="flex-1 h-7 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const newPoints = formData.extra_section_3_points.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, extra_section_3_points: newPoints }));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              extra_section_3_points: [...prev.extra_section_3_points, '']
                            }))}
                          >
                            + পয়েন্ট যোগ করুন
                          </Button>
                        </div>
                      );
                    case 'checkout':
                      return (
                        <div className="p-3 bg-muted/30 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">চেকআউট সেকশন - কাস্টমাইজেশন নেই</Label>
                        </div>
                      );
                    default:
                      // Handle custom sections (cs-xxx)
                      if (sectionId.startsWith('cs-')) {
                        const customSections = ((formData.template_styles as any)?.customSections || []) as CustomSection[];
                        const cs = customSections.find(c => c.id === sectionId);
                        if (cs) {
                          const updateCS = (updates: Partial<CustomSection>) => {
                            const updated = customSections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
                            setFormData(prev => ({
                              ...prev,
                              template_styles: { ...prev.template_styles, customSections: updated } as any
                            }));
                          };
                          const updateCSStyle = (key: string, value: string | boolean) => {
                            const updated = customSections.map(s => s.id === sectionId ? { ...s, styles: { ...s.styles, [key]: value } } : s);
                            setFormData(prev => ({
                              ...prev,
                              template_styles: { ...prev.template_styles, customSections: updated } as any
                            }));
                          };
                          return (
                            <CustomSectionInlineEditor
                              section={cs}
                              onUpdate={updateCS}
                              onUpdateStyle={updateCSStyle}
                            />
                          );
                        }
                      }
                      return null;
                  }
                }}
              />

              {/* Template 15 Universal Style Customization */}
              {formData.template_id === 'template-15-universal' && (
                <Template15StyleEditor
                  templateStyles={formData.template_styles}
                  onChange={(styles) => setFormData(prev => ({ ...prev, template_styles: styles }))}
                />
              )}

              {/* Template 15 - Add Custom Section Buttons */}
              {formData.template_id === 'template-15-universal' && (
                <div className="space-y-2 pt-2 border-t mt-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    ➕ কাস্টম সেকশন যোগ করুন
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { type: "text" as const, label: "📝 টেক্সট" },
                      { type: "image-text" as const, label: "🖼️ ইমেজ+টেক্সট" },
                      { type: "bullet-points" as const, label: "✅ বুলেট" },
                      { type: "image-grid" as const, label: "🎨 ইমেজ গ্রিড" },
                      { type: "banner" as const, label: "🏷️ ব্যানার" },
                      { type: "gallery" as const, label: "🖼️ গ্যালারি" },
                      { type: "slider" as const, label: "🔄 স্লাইডার" },
                      { type: "image" as const, label: "📷 ইমেজ" },
                      { type: "video" as const, label: "🎬 ভিডিও" },
                      { type: "faq" as const, label: "❓ FAQ" },
                      { type: "divider" as const, label: "➖ ডিভাইডার" },
                      { type: "html" as const, label: "🔧 HTML" },
                      { type: "testimonial" as const, label: "💬 টেস্টিমোনিয়াল" },
                      { type: "pricing" as const, label: "💰 প্রাইসিং" },
                      { type: "countdown-timer" as const, label: "⏰ কাউন্টডাউন" },
                      { type: "feature-icons" as const, label: "🎯 ফিচার গ্রিড" },
                      { type: "cta-banner" as const, label: "🔥 CTA ব্যানার" },
                      { type: "comparison" as const, label: "⚖️ তুলনা" },
                    ]).map(({ type, label }) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] justify-start"
                        onClick={() => {
                          const newSection: CustomSection = {
                            id: `cs-${Date.now()}`,
                            type,
                            title: "",
                            content: "",
                            videoUrl: "",
                            points: [],
                            images: [],
                            faqItems: [],
                            testimonials: [],
                            pricingData: { originalPrice: "", offerPrice: "", badgeText: "অফার", unit: "৳", features: [] },
                            countdownEndDate: "",
                            featureItems: [],
                            comparisonItems: [],
                            styles: {
                              backgroundColor: "#065f46",
                              textColor: "#ffffff",
                              headingColor: "#ffffff",
                              headingFontSize: "22",
                              headingAlignment: "center" as const,
                              headingBold: true,
                              contentFontSize: "15",
                              contentAlignment: "left" as const,
                              padding: "24",
                              borderRadius: "15",
                              borderColor: "#00000000",
                              borderWidth: "0",
                              shadow: "none" as const,
                              imageBorderRadius: "8",
                              ctaBgColor: "#064e3b",
                              ctaTextColor: "#ffffff",
                              ctaBorderRadius: "50",
                              showCta: true,
                              ctaText: "এখনই অর্ডার করুন",
                              imagePosition: "top" as const,
                            },
                          };
                          const currentCustom = ((formData.template_styles as any)?.customSections || []) as CustomSection[];
                          setFormData(prev => ({
                            ...prev,
                            template_styles: { ...prev.template_styles, customSections: [...currentCustom, newSection] } as any,
                            section_order: [...prev.section_order, newSection.id],
                          }));
                          setExpandedSection(newSection.id);
                        }}
                      >
                        <span className="truncate">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Styling Section */}
              <div className="pt-2 border-t mt-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">স্টাইলিং ও কালার</Label>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">প্রাইমারি</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">অ্যাকসেন্ট</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">ব্যাকগ্রাউন্ড</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">টেক্সট</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">হেডলাইন</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.headline_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.headline_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, headline_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">বাটন</Label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Texts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">CTA বাটন টেক্সট</Label>
                  <Input
                    value={formData.cta_button_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_button_text: e.target.value }))}
                    placeholder="এখনই অর্ডার করুন"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">সাবহেডলাইন</Label>
                  <Input
                    value={formData.hero_subheadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, hero_subheadline: e.target.value }))}
                    placeholder="অতিরিক্ত বিবরণ..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <Label className="text-xs">ফুটার টেক্সট (ঐচ্ছিক)</Label>
                <Textarea
                  value={formData.footer_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="পেজের নিচে দেখাবে এমন কাস্টম টেক্সট লিখুন..."
                  className="min-h-[60px] text-sm"
                />
              </div>
             </div>
           </div>
         </ScrollArea>
 
         {/* Actions */}
         <div className="flex justify-end gap-2 px-4 py-3 border-t">
           <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
             বাতিল
           </Button>
           <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
             {isSubmitting ? "সেভ হচ্ছে..." : salesPage ? "আপডেট করুন" : "তৈরি করুন"}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default SimplifiedSalesPageEditor;