import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesPage, MultiProductItem } from "@/types/salesPage";
 import { ProductVariation } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createOrder, saveOrderTracking } from "@/lib/dataApi";
import { toast } from "sonner";
import { CheckCircle, Minus, Plus, MapPin, Truck, Wallet, CreditCard, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
 import VariationSelector from "./VariationSelector";
 import { useProductVariations } from "@/hooks/useProductVariations";
import { useDuplicateOrderBlock } from "@/hooks/useDuplicateOrderBlock";
import DuplicateOrderBlockAlert from "@/components/checkout/DuplicateOrderBlockAlert";
import CouponField from "@/components/checkout/CouponField";
import { useAuth } from "@/contexts/AuthContext";
import { useRef, useCallback } from "react";
import { usePixelTracking } from "@/hooks/usePixelTracking";

interface CheckoutSectionProps {
  page: SalesPage;
}

const CheckoutSection = ({ page }: CheckoutSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackPurchase } = usePixelTracking();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
   const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const multiProducts: MultiProductItem[] = (page.show_multi_products ? page.multi_products || [] : []).filter(
    (item) => item.is_active !== false
  );
  const multiSelectMode = !!page.allow_multi_select && multiProducts.length > 0;
  const defaultMultiIndex = (() => {
    const i = multiProducts.findIndex((item) => item.is_default);
    return i >= 0 ? i : 0;
  })();
  const [selectedMultiIndex, setSelectedMultiIndex] = useState<number>(defaultMultiIndex);
  // Multi-select mode: first entry is the primary product, the rest are extra line items
  const [selectedIndices, setSelectedIndices] = useState<number[]>([defaultMultiIndex]);
  const [extraLineState, setExtraLineState] = useState<Record<number, { variationId?: string | null; qty: number }>>({});
  const primaryIndex = multiSelectMode ? (selectedIndices[0] ?? defaultMultiIndex) : selectedMultiIndex;
  const selectedMultiProduct = multiProducts.length > 0 ? multiProducts[primaryIndex] || multiProducts[0] : null;

  const toggleMultiIndex = (index: number) => {
    if (!multiSelectMode) {
      setSelectedMultiIndex(index);
      return;
    }
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        const next = prev.filter((i) => i !== index);
        return next.length > 0 ? next : prev; // keep at least one product
      }
      return [...prev, index];
    });
  };
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState({ remainingMinutes: 0, message: "", whatsappNumber: "" });
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    offerText: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "ঢাকার বাইরে",
  });

  // Session ID for abandoned cart tracking
  const sessionId = useRef<string>(
    localStorage.getItem("session_id") || crypto.randomUUID()
  );

   const activeProductId = selectedMultiProduct?.product_id || page.product_id;
   const { data: variations = [] } = useProductVariations(activeProductId);

   // Always take price & shipping from the product record itself
   const { data: activeProduct } = useQuery({
     queryKey: ["salespage-product", activeProductId],
     enabled: !!activeProductId,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("products")
         .select("id, name, name_bn, price, original_price, image_url, shipping_inside_dhaka, shipping_outside_dhaka, free_shipping")
         .eq("id", activeProductId as string)
         .maybeSingle();
       if (error) throw error;
       return data;
     },
   });
 
   // Bulk product + variation data for multi-select mode (extra line items)
   const multiIds = multiProducts.map((m) => m.product_id).filter(Boolean) as string[];
   const { data: multiProductRecords = [] } = useQuery({
     queryKey: ["salespage-multi-products", multiIds],
     enabled: multiSelectMode && multiIds.length > 0,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("products")
         .select("id, name, name_bn, price, image_url")
         .in("id", multiIds);
       if (error) throw error;
       return data || [];
     },
   });
   const { data: multiVariations = [] } = useQuery({
     queryKey: ["salespage-multi-variations", multiIds],
     enabled: multiSelectMode && multiIds.length > 0,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("product_variations")
         .select("*")
         .in("product_id", multiIds)
         .order("sort_order", { ascending: true });
       if (error) throw error;
       return (data || []) as ProductVariation[];
     },
   });

   // Reset the selected variation whenever the chosen product changes
   useEffect(() => {
     setSelectedVariation(null);
   }, [activeProductId]);
  const { checkBlockStatus, markOrderPlaced, getUserIP } = useDuplicateOrderBlock();
 
  // Save session ID to localStorage
  useEffect(() => {
    localStorage.setItem("session_id", sessionId.current);
  }, []);

  // Block status is only checked on form submit (handleSubmit), not on phone change

  useEffect(() => {
    const saved = localStorage.getItem("checkoutFormData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({
        name: parsed.name || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
        city: parsed.city || "ঢাকার বাইরে",
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Real-time phone validation
    if (name === "phone") {
      if (value.length === 0) {
        setPhoneValidation(null);
      } else if (value.length < 11) {
        setPhoneValidation({ isValid: false, message: "ফোন নম্বর অসম্পূর্ণ" });
      } else if (!validatePhone(value)) {
        setPhoneValidation({ isValid: false, message: "সঠিক বাংলাদেশি ফোন নম্বর দিন" });
      } else {
        setPhoneValidation({ isValid: true, message: "সঠিক ফোন নম্বর" });
      }
    }
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    const bdPattern = /^(?:\+?88)?01[3-9]\d{8}$/;
    return bdPattern.test(cleaned);
  };

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (cleaned.startsWith("+88")) cleaned = cleaned.slice(3);
    if (cleaned.startsWith("88")) cleaned = cleaned.slice(2);
    return cleaned;
  };

  const isDhaka = formData.city === "ঢাকার ভিতরে";
  const product = activeProduct || page.products;
   
   // Price always comes from the product (or its variation) — never from the sales page
   const unitPrice = selectedVariation 
     ? selectedVariation.price 
     : (product?.price ?? selectedMultiProduct?.price ?? page.offer_price);

   // Display name used for order item / cart tracking
   const baseProductName = selectedMultiProduct
     ? (product?.name_bn || product?.name || selectedMultiProduct.name)
     : (product?.name_bn || product?.name || page.offer_details || page.title);
   const orderProductId = selectedMultiProduct ? selectedMultiProduct.product_id : (product?.id || null);
   
   // Get original price for discount calculation
   const originalPrice = product?.original_price || null;
   
   // Calculate discount percentage
   const discountPercentage = originalPrice && originalPrice > unitPrice 
     ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
     : 0;
  
  let shippingCost = isDhaka ? 60 : 120;
  const shipInside = selectedVariation?.shipping_inside_dhaka ?? product?.shipping_inside_dhaka;
  const shipOutside = selectedVariation?.shipping_outside_dhaka ?? product?.shipping_outside_dhaka;
  const isFreeShip = selectedVariation
    ? (selectedVariation.free_shipping ?? false) || (!selectedVariation.free_shipping && product?.free_shipping && selectedVariation.shipping_inside_dhaka == null && selectedVariation.shipping_outside_dhaka == null)
    : product?.free_shipping;
  if (isFreeShip) shippingCost = 0;
  else if (isDhaka && shipInside) shippingCost = shipInside;
  else if (!isDhaka && shipOutside) shippingCost = shipOutside;

   // Extra line items (multi-select mode)
   const variationsForProduct = (productId?: string | null) =>
     productId ? multiVariations.filter((v) => v.product_id === productId) : [];

   const extraLines = multiSelectMode
     ? selectedIndices.slice(1).map((index) => {
         const item = multiProducts[index];
         const record = multiProductRecords.find((p) => p.id === item?.product_id);
         const vars = variationsForProduct(item?.product_id);
         const state = extraLineState[index];
         const variation =
           vars.find((v) => v.id === state?.variationId) ||
           vars.find((v) => v.is_default) ||
           vars[0] ||
           null;
         const qty = state?.qty ?? 1;
         const price = variation?.price ?? record?.price ?? item?.price ?? 0;
         const name = record?.name_bn || record?.name || item?.name || "";
         return { index, item, record, vars, variation, qty, price, name };
       })
     : [];
   const extrasSubtotal = extraLines.reduce((sum, line) => sum + line.price * line.qty, 0);

   const subtotal = unitPrice * quantity + extrasSubtotal;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const effectiveShipping = appliedCoupon?.discountType === "free_shipping" ? 0 : shippingCost;
  const total = Math.max(0, subtotal - couponDiscount) + effectiveShipping;

  // Abandoned cart tracking - save when phone is valid
  const saveAbandonedCart = useCallback(async (phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length !== 11) return;

    const cartData = {
      items: [{
        product_id: orderProductId,
        product_name: selectedVariation 
          ? `${baseProductName} (${selectedVariation.variation_name})`
          : baseProductName,
        price: unitPrice,
        quantity: quantity,
      }],
      total: total,
      form: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      },
      salesPage: page.title,
    };

    try {
      const { error } = await supabase
        .from("abandoned_carts")
        .upsert(
          {
            session_id: sessionId.current,
            user_id: user?.id || null,
            customer_phone: normalizedPhone,
            cart_data: cartData,
            checkout_step: "sales_page_checkout",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "customer_phone",
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error("Error saving abandoned cart:", error);
      }
    } catch (error) {
      console.error("Error saving abandoned cart:", error);
    }
  }, [orderProductId, baseProductName, selectedVariation, page.title, unitPrice, quantity, total, formData, user?.id]);

  // Effect to save abandoned cart when phone changes
  useEffect(() => {
    if (validatePhone(formData.phone)) {
      const timeoutId = setTimeout(() => {
        saveAbandonedCart(formData.phone);
      }, 500); // Debounce 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [formData.phone, formData.name, formData.address, saveAbandonedCart]);

  // Delete abandoned cart when order is placed
  const deleteAbandonedCart = async () => {
    try {
      const normalizedPhone = normalizePhone(formData.phone);
      await supabase
        .from("abandoned_carts")
        .delete()
        .or(`session_id.eq.${sessionId.current},customer_phone.eq.${normalizedPhone}`);
    } catch (error) {
      console.error("Error deleting abandoned cart:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(formData.phone)) {
      toast.error("সঠিক ফোন নম্বর দিন (১১ ডিজিট)");
      return;
    }

    // Get IP early for both blocking check and order saving
    const userIP = await getUserIP();

    // Check duplicate order block before submitting
    const blockStatus = await checkBlockStatus(formData.phone, userIP);
    if (blockStatus.isBlocked) {
      setIsBlocked(true);
      setBlockInfo({
        remainingMinutes: blockStatus.remainingMinutes,
        message: blockStatus.message,
        whatsappNumber: blockStatus.whatsappNumber,
      });
      toast.error("আপনি ইতিমধ্যে একটি অর্ডার করেছেন");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhone(formData.phone);
      const createdOrder: any = await createOrder({
        customer_name: formData.name,
        customer_phone: normalizedPhone,
        customer_address: formData.address,
        customer_city: formData.city,
        shipping_cost: effectiveShipping,
        payment_method: paymentMethod,
        notes: `সেলস পেজ: ${page.title}`,
        order_source: "sales_page",
        coupon_code: appliedCoupon?.couponCode || undefined,
        items: [
          {
            product_id: orderProductId || undefined,
            product_name: selectedVariation
              ? `${baseProductName} (${selectedVariation.variation_name})`
              : baseProductName,
            product_price: unitPrice,
            quantity,
            variation_id: selectedVariation?.id || undefined,
            variation_name: selectedVariation?.variation_name || undefined,
          },
          ...extraLines.map((line) => ({
            product_id: line.item?.product_id || undefined,
            product_name: line.variation ? `${line.name} (${line.variation.variation_name})` : line.name,
            product_price: line.price,
            quantity: line.qty,
            variation_id: line.variation?.id || undefined,
            variation_name: line.variation?.variation_name || undefined,
          })),
        ],
      });
      const generatedOrderId = createdOrder?.id as string;
      if (!generatedOrderId) throw new Error("অর্ডার তৈরি হয়নি");

      // Mark order as placed for duplicate blocking (localStorage)
      markOrderPlaced();

      // Delete abandoned cart after successful order
      await deleteAbandonedCart();

      // Track Purchase event for Facebook Pixel / GA4
      const eventId = trackPurchase(
        {
          order_id: generatedOrderId,
          total: total,
          shipping: shippingCost,
          items: [
            {
              product_id: orderProductId || undefined,
              product_name: selectedVariation
                ? `${baseProductName} (${selectedVariation.variation_name})`
                : baseProductName,
              price: unitPrice,
              quantity: quantity,
              variation_name: selectedVariation?.variation_name,
            },
            ...extraLines.map((line) => ({
              product_id: line.item?.product_id || undefined,
              product_name: line.variation ? `${line.name} (${line.variation.variation_name})` : line.name,
              price: line.price,
              quantity: line.qty,
              variation_name: line.variation?.variation_name,
            })),
          ],
        },
        page.title
      );

      // Save purchase_event_id for cancellation tracking
      if (eventId) {
        const fbp = (document.cookie.match(/(?:^|; )_fbp=([^;]+)/) || [])[1];
        const fbc = (document.cookie.match(/(?:^|; )_fbc=([^;]+)/) || [])[1];
        const ttp = (document.cookie.match(/(?:^|; )_ttp=([^;]+)/) || [])[1];
        const ttclid = (document.cookie.match(/(?:^|; )ttclid=([^;]+)/) || [])[1];
        const externalId = localStorage.getItem("__fb_external_id") || undefined;
        await saveOrderTracking(generatedOrderId, {
          purchase_event_id: eventId,
          tracking_data: {
            fbp: fbp ? decodeURIComponent(fbp) : null,
            fbc: fbc ? decodeURIComponent(fbc) : null,
            ttp: ttp ? decodeURIComponent(ttp) : null,
            ttclid: ttclid ? decodeURIComponent(ttclid) : null,
            user_agent: navigator.userAgent,
            external_id: externalId,
            source_url: window.location.href,
          },
        });
      }

      localStorage.setItem("checkoutFormData", JSON.stringify(formData));

      toast.success("অর্ডার সফল হয়েছে!");
      window.scrollTo({ top: 0 });
      navigate(`/lp-order-success?orderId=${generatedOrderId}`);
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error(err.message || "অর্ডার করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="checkout" className="py-8 md:py-12 px-3 bg-slate-950 relative">
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: page.primary_color }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md mx-auto"
      >
        {/* Card */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header - Compact */}
          <div 
            className="px-4 py-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${page.primary_color}, ${page.accent_color})`
            }}
          >
            <h2 className="text-xl font-bold text-white">
              অর্ডার করুন
            </h2>
            <p className="text-white/80 text-xs flex items-center justify-center gap-1.5 mt-1">
              <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {page.cta_urgency_text}
            </p>
          </div>

          {/* Product Card - Compact */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              {(selectedMultiProduct?.image_url || product?.image_url || (page.gallery_images && page.gallery_images.length > 0)) && (
                <img
                  src={selectedMultiProduct?.image_url || product?.image_url || page.gallery_images?.[0]}
                  alt={baseProductName}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  style={{ border: `2px solid ${page.primary_color}40` }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {baseProductName}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold" style={{ color: page.accent_color }}>
                    {page.price_unit}{unitPrice}
                  </p>
                  {originalPrice && originalPrice > unitPrice && (
                    <>
                      <span className="text-sm text-white/50 line-through">
                        {page.price_unit}{originalPrice}
                      </span>
                      <span 
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${page.accent_color}30`,
                          color: page.accent_color
                        }}
                      >
                        {discountPercentage}% ছাড়
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Quantity - Compact */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105"
                  style={{ background: page.primary_color }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all hover:scale-105"
                  style={{ background: page.primary_color }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Multiple Product Selector */}
          {multiProducts.length > 0 && (
            <div className="px-4 py-3 border-b border-white/10 space-y-2">
              <p className="text-xs text-white/70">
                {multiSelectMode ? "প্রোডাক্ট বেছে নিন (একাধিক নেওয়া যাবে)" : "প্রোডাক্ট বেছে নিন"}
              </p>
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {multiProducts.map((item, index) => {
                  const isPrimary = index === primaryIndex;
                  const isSelected = multiSelectMode ? selectedIndices.includes(index) : isPrimary;
                  const extraLine = extraLines.find((line) => line.index === index);
                  const lineVariations = isPrimary ? variations : extraLine?.vars || [];
                  const displayPrice = isPrimary
                    ? unitPrice
                    : extraLine?.price ?? item.price;
                  return (
                    <div
                      key={`${item.product_id}-${index}`}
                      className="rounded-xl transition-all"
                      style={{
                        background: isSelected ? `${page.primary_color}25` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSelected ? page.primary_color : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleMultiIndex(index)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left"
                      >
                        <span
                          className={cn(
                            "w-4 h-4 flex items-center justify-center flex-shrink-0",
                            multiSelectMode ? "rounded-[4px]" : "rounded-full"
                          )}
                          style={{
                            border: `1.5px solid ${isSelected ? page.primary_color : "rgba(255,255,255,0.3)"}`,
                            background: isSelected ? page.primary_color : "transparent",
                          }}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            loading="lazy"
                          />
                        )}
                        <span className="flex-1 min-w-0 text-sm text-white truncate">{item.name}</span>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: page.accent_color }}>
                          {page.price_unit}{displayPrice}
                        </span>
                      </button>

                      {isSelected && lineVariations.length > 0 && (
                        <div className="px-2.5 pb-2 pt-0.5">
                          <VariationSelector
                            key={`${item.product_id}-${index}-vars`}
                            variations={lineVariations}
                            variationType={lineVariations[0]?.variation_type || "size"}
                            selectedVariationId={
                              isPrimary ? selectedVariation?.id || null : extraLine?.variation?.id || null
                            }
                            onSelect={(variation) => {
                              if (isPrimary) setSelectedVariation(variation);
                              else
                                setExtraLineState((prev) => ({
                                  ...prev,
                                  [index]: { qty: prev[index]?.qty ?? 1, variationId: variation.id },
                                }));
                            }}
                            primaryColor={page.primary_color}
                            accentColor={page.accent_color}
                            priceUnit={page.price_unit}
                          />
                        </div>
                      )}

                      {/* Per-product quantity (multi-select mode, extra items) */}
                      {multiSelectMode && isSelected && !isPrimary && (
                        <div className="flex items-center justify-end gap-1 px-2.5 pb-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExtraLineState((prev) => ({
                                ...prev,
                                [index]: {
                                  variationId: prev[index]?.variationId,
                                  qty: Math.max(1, (prev[index]?.qty ?? 1) - 1),
                                },
                              }))
                            }
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                            style={{ background: page.primary_color }}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">
                            {extraLine?.qty ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExtraLineState((prev) => ({
                                ...prev,
                                [index]: {
                                  variationId: prev[index]?.variationId,
                                  qty: (prev[index]?.qty ?? 1) + 1,
                                },
                              }))
                            }
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                            style={{ background: page.primary_color }}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

           {/* Variation Selector (single product pages) */}
           {multiProducts.length === 0 && variations.length > 0 && (
             <div className="px-4 py-3 border-b border-white/10">
               <VariationSelector
                 key={activeProductId || "none"}
                 variations={variations}
                 variationType={variations[0]?.variation_type || "size"}
                 selectedVariationId={selectedVariation?.id || null}
                 onSelect={setSelectedVariation}
                 primaryColor={page.primary_color}
                 accentColor={page.accent_color}
                 priceUnit={page.price_unit}
               />
             </div>
           )}
 
          {/* Form - Compact */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* Duplicate Order Block Alert */}
            {isBlocked && (
              <DuplicateOrderBlockAlert
                message={blockInfo.message}
                whatsappNumber={blockInfo.whatsappNumber}
                productName={product?.name_bn || product?.name || page.title}
              />
            )}

            <div className="space-y-1">
              <Label htmlFor="name" className="text-white/80 text-xs font-medium">
                আপনার নাম
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="আপনার পুরো নাম"
                required
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-lg text-sm focus:border-white/30 focus:ring-0"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-white/80 text-xs font-medium">
                মোবাইল নম্বর
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="01XXXXXXXXX"
                  required
                  className={cn(
                    "h-10 bg-white/5 text-white placeholder:text-white/40 rounded-lg text-sm focus:ring-0 pr-10",
                    phoneValidation === null 
                      ? "border-white/10 focus:border-white/30"
                      : phoneValidation.isValid 
                        ? "border-green-500/50 focus:border-green-500"
                        : "border-red-500/50 focus:border-red-500"
                  )}
                />
                {phoneValidation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneValidation.isValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {phoneValidation && !phoneValidation.isValid && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {phoneValidation.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="address" className="text-white/80 text-xs font-medium flex items-center gap-1.5">
                <MapPin className="h-3 w-3" style={{ color: page.accent_color }} />
                সম্পূর্ণ ঠিকানা
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="বাড়ি নং, রোড, এলাকা, থানা"
                required
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-lg text-sm focus:border-white/30 focus:ring-0"
              />
            </div>

            {/* Delivery Area - Compact */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-xs font-medium flex items-center gap-1.5">
                <Truck className="h-3 w-3" style={{ color: page.accent_color }} />
                ডেলিভারি এলাকা
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {["ঢাকার ভিতরে", "ঢাকার বাইরে"].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, city: area }))}
                    className={cn(
                      "py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border",
                      formData.city === area
                        ? "text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    )}
                    style={formData.city === area ? { 
                      background: `linear-gradient(135deg, ${page.primary_color}, ${page.accent_color})`,
                      borderColor: 'transparent'
                    } : {}}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method - Compact */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-xs font-medium flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" style={{ color: page.accent_color }} />
                পেমেন্ট মেথড
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-1.5",
                    paymentMethod === "cod"
                      ? "text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                  style={paymentMethod === "cod" ? { 
                    background: `linear-gradient(135deg, ${page.primary_color}, ${page.accent_color})`,
                    borderColor: 'transparent'
                  } : {}}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  ক্যাশ অন ডেলিভারি
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-1.5",
                    paymentMethod === "bkash"
                      ? "text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                  style={paymentMethod === "bkash" ? { 
                    background: 'linear-gradient(135deg, #E2136E, #D4145A)',
                    borderColor: 'transparent'
                  } : {}}
                >
                  <span className="font-bold">bKash</span>
                </button>
              </div>
            </div>

            {/* Coupon Field */}
            <CouponField
              cartTotal={subtotal}
              onApply={setAppliedCoupon}
              appliedCoupon={appliedCoupon}
              accentColor={page.accent_color || '#f472b6'}
            />

            {/* Order Summary - Compact */}
            <div 
              className="rounded-xl p-3 space-y-2"
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex justify-between text-white/70 text-sm">
                <span>সাবটোটাল:</span>
                <span className="font-medium text-white">{page.price_unit}{subtotal}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">কুপন ছাড়:</span>
                  <span className="font-medium text-emerald-400">-{page.price_unit}{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-white/70 text-sm">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-medium text-white">
                  {effectiveShipping === 0 ? (
                    <span className="text-green-400">ফ্রি</span>
                  ) : (
                    `${page.price_unit}${effectiveShipping}`
                  )}
                </span>
              </div>
              <div 
                className="flex justify-between font-bold text-base pt-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-white">মোট:</span>
                <span style={{ color: page.accent_color }}>
                  {page.price_unit}{total}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isBlocked}
              className="w-full h-11 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white"
              style={{ 
                background: `linear-gradient(135deg, ${page.primary_color}, ${page.accent_color})`,
                boxShadow: `0 10px 25px -8px ${page.primary_color}50`,
                opacity: isBlocked ? 0.5 : 1
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  প্রসেস হচ্ছে...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  অর্ডার কনফার্ম করুন
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-white/50">
              {paymentMethod === "cod" 
                ? "📦 পণ্য হাতে পেয়ে পেমেন্ট করুন"
                : "💳 বিকাশে পেমেন্ট করে অর্ডার কনফার্ম করুন"
              }
            </p>
          </form>
        </div>
      </motion.div>
    </section>
  );
};

export default CheckoutSection;
