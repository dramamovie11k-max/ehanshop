import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Phone, ChevronDown, ChevronUp, Loader2, Star, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductMedia from "@/components/product/ProductMedia";
import ReviewSection from "@/components/product/ReviewSection";
import VariationSelector from "@/components/product/VariationSelector";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/home/ProductCard";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductVariation } from "@/types";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { Heart } from "lucide-react";
import { cn, getWhatsAppUrl } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug || "");
  const { data: allProducts = [] } = useProducts({ limit: 8 });
  const relatedProducts = useMemo(() => 
    allProducts.filter(p => p.id !== product?.id).slice(0, 4),
    [allProducts, product?.id]
  );
  const { data: variations = [] } = useProductVariations(product?.id || null);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const { trackViewItem, trackAddToCart } = usePixelTracking();
  const { getSetting } = useSiteSettings();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const { t, language } = useLanguage();
  
  const productCallPhone = getSetting("product_call_phone", "");
  const contactPhone = productCallPhone || getSetting("footer_phone", "০১৭XX-XXXXXX");
  const productWhatsappPhone = getSetting("product_whatsapp_phone", "");
  const whatsappNumber = productWhatsappPhone || getSetting("whatsapp_number", "");
  
  // Product Page Button Settings - use t() when English, DB setting when Bengali
  const addToCartBg = getSetting("product_addtocart_bg", "");
  
  const addToCartText = getSetting("product_addtocart_text", "");
  const dbAddToCartLabel = getSetting("product_addtocart_label", "");
  const addToCartLabel = language === 'en' ? t('product.add_to_cart') : (dbAddToCartLabel || t('product.add_to_cart'));
  const orderBg = getSetting("product_order_bg", "");
  const orderText = getSetting("product_order_text", "");
  const dbOrderLabel = getSetting("product_order_label", "");
  const orderLabel = language === 'en' ? t('product.order_now') : (dbOrderLabel || t('product.order_now'));
  const whatsappBorder = getSetting("product_whatsapp_border", "#16a34a");
  const whatsappTextColor = getSetting("product_whatsapp_text", "#16a34a");
  const dbWhatsappLabel = getSetting("product_whatsapp_label", "");
  const whatsappLabel = language === 'en' ? t('product.whatsapp_order') : (dbWhatsappLabel || t('product.whatsapp_order'));
  const whatsappBg = getSetting("product_whatsapp_bg", "transparent");
  const callBorder = getSetting("product_call_border", "#7c3aed");
  const callTextColor = getSetting("product_call_text", "#7c3aed");
  const callBg = getSetting("product_call_bg", "transparent");

  // Check if product has variations
  const hasVariations = product?.has_variations && variations.length > 0;
  
  // Set default variation when variations load
  useEffect(() => {
    if (hasVariations && !selectedVariation) {
      const defaultVariation = variations.find(v => v.is_default) || variations[0];
      setSelectedVariation(defaultVariation);
    }
  }, [variations, hasVariations, selectedVariation]);

  // Get current price based on variation
  const currentPrice = selectedVariation?.price ?? product?.price ?? 0;
  const originalPrice = product?.original_price;

  // Track view_item when product loads
  useEffect(() => {
    if (product) {
      trackViewItem({
        product_id: product.id,
        product_name: product.name_bn,
        price: product.price,
        original_price: product.original_price,
        quantity: 1,
        category: product.categories?.name || product.category_id || undefined,
        image_url: product.image_url || undefined,
        stock: product.stock,
        stock_status: product.stock > 0 ? 'instock' : 'outofstock',
      }, product.name_bn);
    }
  }, [product, trackViewItem]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t('product.not_found')}</h1>
            <Button asChild>
              <Link to="/products">{t('product.view_all')}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      toast.error(t('product.select_option'));
      return;
    }
    addToCart(product, quantity, selectedVariation || undefined);
    trackAddToCart({
      product_id: product.id,
      product_name: product.name_bn,
      price: currentPrice,
      original_price: originalPrice,
      quantity: quantity,
      category: product.category_id || undefined,
    }, product.name_bn);
  };

  const handleOrderNow = () => {
    if (hasVariations && !selectedVariation) {
      toast.error(t('product.select_option'));
      return;
    }
    // Skip drawer opening for direct checkout
    addToCart(product, quantity, selectedVariation || undefined, true);
    trackAddToCart({
      product_id: product.id,
      product_name: product.name_bn,
      price: currentPrice,
      original_price: originalPrice,
      quantity: quantity,
      category: product.category_id || undefined,
    }, product.name_bn);
    navigate("/checkout");
  };

  const handleCall = () => {
    const phoneClean = contactPhone.replace(/[^\d+]/g, '');
    window.location.href = `tel:${phoneClean}`;
  };

  const handleWhatsApp = () => {
    const waInput = whatsappNumber || contactPhone;
    const productName = language === 'en' ? (product.name || product.name_bn) : product.name_bn;
    const variationText = selectedVariation ? `\n🎨 ${selectedVariation.variation_name}` : '';
    const totalPrice = currentPrice * quantity;
    const message = language === 'en' 
      ? `🛒 *Order Request*\n\n📦 Product: *${productName}*${variationText}\n💰 Price: ৳${currentPrice.toLocaleString()}\n🔢 Quantity: ${quantity}\n💵 Total: ৳${totalPrice.toLocaleString()}\n\nI want to order this product.`
      : `🛒 *অর্ডার করতে চাই*\n\n📦 পণ্য: *${productName}*${variationText}\n💰 মূল্য: ৳${currentPrice.toLocaleString()}\n🔢 পরিমাণ: ${quantity}\n💵 মোট: ৳${totalPrice.toLocaleString()}\n\nআমি এই পণ্যটি অর্ডার করতে চাই।`;
    window.open(getWhatsAppUrl(waInput, message), '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <div className="bg-secondary/30 py-2">
          <div className="container">
            <nav className="text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
              <Link to="/" className="hover:text-primary">{t('product.home')}</Link>
              <span className="mx-1 md:mx-2">/</span>
              <Link to="/products" className="hover:text-primary">{t('product.product')}</Link>
              <span className="mx-1 md:mx-2">/</span>
              <span className="text-foreground">{language === 'en' ? (product.name || product.name_bn) : product.name_bn}</span>
            </nav>
          </div>
        </div>

        {/* Product Section */}
        <section className="pt-[2px] pb-4 md:py-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          <div className="container px-2 md:px-4 lg:px-8" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            <div className="grid md:grid-cols-2 gap-4 lg:gap-8">
              {/* Product Media - Image, Gallery then Video */}
              <ProductMedia
                imageUrl={selectedVariation?.image_url || product.image_url}
                videoUrl={product.video_url}
                images={product.images}
                isNew={product.is_new}
                discount={discount}
                showVideoFirst={false}
              />

              {/* Product Info */}
              <div className="space-y-3 max-w-full overflow-hidden">
                {/* Product Name */}
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight break-words flex-1">
                    {language === 'en' ? (product.name || product.name_bn) : product.name_bn}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                      "shrink-0 h-9 w-9 rounded-full transition-all",
                      isInWishlist(product.id)
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-secondary hover:bg-secondary/80 hover:text-destructive"
                    )}
                  >
                    <Heart className={cn("h-5 w-5", isInWishlist(product.id) && "fill-current")} />
                  </Button>
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                  {originalPrice && (
                    <span className="text-lg md:text-xl text-foreground/60 line-through font-medium">
                      ৳{originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-2xl md:text-3xl font-extrabold text-primary">
                    ৳{currentPrice.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-sm font-bold">
                      -{discount}%
                    </Badge>
                  )}
                </div>

                {/* Short Description */}
                {(language === 'en' ? (product.short_description || product.short_description_bn) : (product.short_description_bn || product.short_description)) && (
                  <div className="text-[19px] text-black whitespace-pre-line break-words leading-relaxed">
                    {language === 'en' ? (product.short_description || product.short_description_bn) : (product.short_description_bn || product.short_description)}
                  </div>
                )}

                {/* Variation Selector */}
                {hasVariations && (
                  <VariationSelector
                    variations={variations}
                    variationType={product.variation_type || "custom"}
                    selectedVariationId={selectedVariation?.id || null}
                    onSelect={setSelectedVariation}
                  />
                )}

                {/* Quantity + Add to Cart + Order Now — one row (same on mobile & desktop) */}
                <div className="flex items-stretch gap-2 mt-2">
                  <div className="inline-flex items-center border-2 border-border rounded-xl shrink-0 px-1 h-12">
                    <button
                      className="h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center font-semibold text-sm">{quantity}</span>
                    <button
                      className="h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    className="flex-1 h-12 px-2 sm:px-4 text-xs sm:text-sm md:text-base font-bold gap-1.5 rounded-xl inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50 text-white"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    style={{
                      backgroundColor: addToCartBg || '#22c55e',
                      color: addToCartText || '#ffffff',
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <span className="truncate">{addToCartLabel}</span>
                  </button>
                  <button
                    className="flex-1 h-12 px-2 sm:px-4 text-xs sm:text-sm md:text-base font-bold rounded-xl inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50"
                    onClick={handleOrderNow}
                    disabled={product.stock === 0}
                    style={{
                      backgroundColor: orderBg || '#0b3d2e',
                      color: orderText || '#ffffff',
                    }}
                  >
                    <span className="truncate">{orderLabel}</span>
                  </button>
                </div>

                {/* Order via WhatsApp - Full Width */}
                <button
                  className="w-full h-12 mt-2 flex items-center justify-center gap-2 text-sm sm:text-base font-bold rounded-xl transition-colors text-white"
                  onClick={handleWhatsApp}
                  style={{
                    borderColor: whatsappBorder,
                    backgroundColor: whatsappBg && whatsappBg !== 'transparent' ? whatsappBg : '#0b3d2e',
                  }}
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="truncate">{whatsappLabel}</span>
                </button>

                {/* Call Button - Full Width Outline with number */}
                <button
                  className="w-full h-12 mt-2 flex items-center justify-center gap-2 text-sm sm:text-base font-bold rounded-xl border-2 transition-colors"
                  onClick={handleCall}
                  style={{
                    borderColor: callBorder || '#7c3aed',
                    color: callTextColor || '#7c3aed',
                    backgroundColor: callBg || 'transparent',
                  }}
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{contactPhone}</span>
                </button>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4 py-3 text-sm text-muted-foreground">
                  <span className="shrink-0">{t('product.follow_us')}</span>
                  <div className="flex items-center gap-3">
                    <a href={getSetting("social_facebook", "#")} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-8 w-8 rounded-full bg-[#1877f2] text-white flex items-center justify-center hover:opacity-85 transition-opacity">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a href={getSetting("social_youtube", "#")} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="h-8 w-8 rounded-full bg-[#ff0000] text-white flex items-center justify-center hover:opacity-85 transition-opacity">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                    <a href={getSetting("social_instagram", "#")} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-8 w-8 rounded-full text-white flex items-center justify-center hover:opacity-85 transition-opacity" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Collapsible Cards */}
                <div className="space-y-2 mt-3">
                  <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left border-2 border-green-600/50 rounded-xl bg-green-50 hover:bg-green-100/60 transition-colors data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                      <span className="flex items-center gap-2 font-bold text-green-800 text-base">
                        <span className="text-lg">📋</span>
                        {t('product.description')}
                      </span>
                      {isDescriptionOpen ? <ChevronUp className="h-5 w-5 text-green-700" /> : <ChevronDown className="h-5 w-5 text-green-700" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-2 border-t-0 border-green-600/50 rounded-b-xl bg-white -mt-1">
                      <div className="px-4 py-4 prose prose-base max-w-none text-black whitespace-pre-line text-[17px] leading-relaxed
                        prose-headings:text-green-700 prose-headings:font-bold prose-headings:flex prose-headings:items-center prose-headings:gap-2
                        prose-h2:text-lg prose-h3:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h3:mt-3 prose-h3:mb-2
                        prose-p:text-black prose-p:my-2
                        prose-strong:text-black prose-strong:font-semibold
                        prose-ul:my-2 prose-ul:pl-1 prose-li:my-1 prose-li:text-black prose-li:marker:text-green-600
                        prose-table:border prose-table:border-green-600/40 prose-table:rounded-md prose-table:overflow-hidden
                        prose-thead:bg-green-600 prose-thead:text-white
                        prose-th:px-3 prose-th:py-2 prose-th:text-white prose-th:font-semibold prose-th:border prose-th:border-green-600/40
                        prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-green-600/30 prose-td:text-black"
                        dangerouslySetInnerHTML={{
                          __html: language === 'en'
                            ? (product.description || product.description_bn || t('product.no_description'))
                            : (product.description_bn || product.description || t('product.no_description'))
                        }}
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 text-left border-2 border-green-600/40 rounded-xl bg-white hover:bg-green-50/40 transition-colors">
                      <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
                        <span>🧾</span>
                        Return, Exchange & Cancellation Policy
                      </span>
                      <ChevronDown className="h-4 w-4 text-green-600 group-data-[state=open]:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 border-2 border-t-0 border-green-600/40 rounded-b-xl -mt-1 bg-white">
                      <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                        {getSetting("return_policy", "৭ দিনের মধ্যে রিটার্ন/এক্সচেঞ্জ করা যাবে। পণ্য অবশ্যই অব্যবহৃত ও আসল প্যাকেজিং সহ থাকতে হবে।")}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 text-left border-2 border-green-600/40 rounded-xl bg-white hover:bg-green-50/40 transition-colors">
                      <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
                        <span>⭐</span>
                        রিভিউ দেখুন
                        <span className="flex items-center gap-1 ml-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-foreground">
                            {(product.rating || 0).toFixed(1)}
                          </span>
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-green-600 group-data-[state=open]:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 border-2 border-t-0 border-green-600/40 rounded-b-xl -mt-1 bg-white">
                      <ReviewSection
                        productId={product.id}
                        productName={product.name_bn}
                        totalReviews={product.reviews_count}
                        averageRating={product.rating}
                        embedded
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section className="py-12 bg-secondary/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8">{t('product.related_products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Customer Review Images - bottom of product page, above footer */}
        {(product as any).review_images && (product as any).review_images.length > 0 && (
          <section className="py-8 md:py-10">
            <div className="container">
              <div className="flex flex-row items-center justify-between mb-5 gap-3 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold whitespace-nowrap">কাস্টমার রিভিউ</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">আমাদের সন্তুষ্ট কাস্টমারদের মতামত</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full h-9 px-3 text-xs md:text-sm shrink-0">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      আপনার রিভিউ দিন
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>আপনার রিভিউ দিন</DialogTitle>
                    </DialogHeader>
                    <ReviewSection
                      productId={product.id}
                      productName={product.name_bn}
                      totalReviews={product.reviews_count}
                      averageRating={product.rating}
                      embedded
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <Carousel opts={{ align: "start", loop: false }} className="relative">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {((product as any).review_images as string[]).map((url, idx) => (
                    <CarouselItem
                      key={idx}
                      className="pl-2 md:pl-4 basis-1/2 sm:basis-[45%] md:basis-1/3 lg:basis-1/4"
                    >
                      <div className="rounded-xl md:rounded-2xl border border-emerald-200 bg-emerald-50/40 p-2 md:p-3 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-2 gap-1">
                          <div className="inline-flex items-center gap-0.5 md:gap-1 bg-white border border-emerald-200 text-emerald-700 text-[9px] md:text-[11px] font-medium px-1.5 md:px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            Verified
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg md:rounded-xl overflow-hidden bg-white aspect-[4/5]">
                          <img
                            src={url}
                            alt={`Customer review ${idx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4" />
                <CarouselNext className="hidden md:flex -right-4" />
              </Carousel>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
