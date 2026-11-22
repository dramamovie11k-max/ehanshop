 import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { getWhatsAppUrl } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { SalesPage } from "@/types/salesPage";
 import { 
   ArrowRight, 
   Check, 
   Phone, 
   MessageCircle,
   Play,
   Leaf,
   Shield,
   Star,
   Sparkles,
   Truck,
   Gift
 } from "lucide-react";
 import CheckoutSection from "../CheckoutSection";
import { usePixelTracking } from "@/hooks/usePixelTracking";
 
// Review Carousel Component - 2 columns sliding  
const ReviewCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Calculate total slides (2 images per slide)
  const imagesPerSlide = 2;
  const totalSlides = Math.ceil(images.length / imagesPerSlide);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Group images into pairs
  const slides: string[][] = [];
  for (let i = 0; i < images.length; i += imagesPerSlide) {
    slides.push(images.slice(i, i + imagesPerSlide));
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl">
        <motion.div
          className="flex"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {slides.map((slideImages, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {slideImages.map((img, imgIndex) => (
                  <div
                    key={imgIndex}
                    className="rounded-xl overflow-hidden border border-green-500/20"
                  >
                    <img
                      src={img}
                      alt={`Review ${slideIndex * imagesPerSlide + imgIndex + 1}`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-green-400 w-6"
                  : "bg-green-400/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

 interface TemplateProps {
   page: SalesPage;
 }
 
 const DEFAULT_ORDER = ['hero', 'video', 'gallery', 'features', 'reviews', 'contact', 'extra1', 'extra2', 'extra3', 'checkout'];
 
 const Template01Organic = ({ page }: TemplateProps) => {
  const { trackAddToCart, trackInitiateCheckout, trackPageView } = usePixelTracking();
  const hasTrackedCheckoutView = useRef(false);

   const scrollToCheckout = () => {
     document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
   };

  // Get product data for pricing
  const product = page.products;
  const productPrice = product?.price || page.offer_price || 0;
  const productOriginalPrice = product?.original_price || null;
  
  // Calculate discount percentage
  const discountPercentage = productOriginalPrice && productOriginalPrice > productPrice 
    ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
    : 0;

  // Track AddToCart on page load (ViewContent + AddToCart for sales pages)
  useEffect(() => {
    const productData = {
      product_id: product?.id,
      product_name: product?.name_bn || product?.name || page.title,
      price: productPrice,
      original_price: productOriginalPrice,
      quantity: 1,
      category: "Sales Page",
    };

    // Fire PageView/ViewContent
    trackPageView(page.title, productData);

    // Fire AddToCart (as per user request - product auto-added to cart on page view)
    trackAddToCart(productData, page.title);
  }, [page.title, product, productPrice, productOriginalPrice, trackPageView, trackAddToCart]);

  // Track InitiateCheckout when checkout section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedCheckoutView.current) {
            hasTrackedCheckoutView.current = true;
            const productData = {
              product_id: product?.id,
              product_name: product?.name_bn || product?.name || page.title,
              price: productPrice,
              original_price: productOriginalPrice,
              quantity: 1,
            };
            trackInitiateCheckout([productData], page.title);
          }
        });
      },
      { threshold: 0.3 } // Fire when 30% of checkout is visible
    );

    const checkoutElement = document.getElementById("checkout");
    if (checkoutElement) {
      observer.observe(checkoutElement);
    }

    return () => {
      if (checkoutElement) {
        observer.unobserve(checkoutElement);
      }
    };
  }, [page.title, product, productPrice, productOriginalPrice, trackInitiateCheckout]);

   const getYouTubeId = (url: string) => {
     const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
     return match?.[1] || null;
   };
 
  // Use new JSONB arrays if available, fallback to old columns for backward compatibility
  const features = (page.feature_points && page.feature_points.length > 0) 
    ? page.feature_points 
    : [
        { text: page.feature_1_text, description: page.feature_1_description, icon: page.feature_1_icon },
        { text: page.feature_2_text, description: page.feature_2_description, icon: page.feature_2_icon },
        { text: page.feature_3_text, description: page.feature_3_description, icon: page.feature_3_icon },
        { text: page.feature_4_text, description: page.feature_4_description, icon: page.feature_4_icon },
        { text: page.feature_5_text, description: page.feature_5_description, icon: page.feature_5_icon },
        { text: page.feature_6_text, description: page.feature_6_description, icon: page.feature_6_icon },
      ].filter(f => f.text);
 
   const sectionOrder = page.section_order?.length > 0 ? page.section_order : DEFAULT_ORDER;
 
   // Section Components as inline render functions
   const renderHero = () => {
     if (!page.show_hero_section) return null;
     return (
       <section key="hero" className="relative overflow-hidden">
         <div className="absolute inset-0 opacity-20">
           <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 rounded-full blur-[120px]" />
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[150px]" />
         </div>
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-20 left-5 text-green-400/30">
             <Leaf className="w-12 h-12" />
           </motion.div>
         </div>
         <div className="relative z-10 px-4 pt-6 pb-8">
           <div className="max-w-lg mx-auto">
             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-5">
               <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md text-white border border-green-400/40 shadow-lg shadow-green-500/20">
                 <Sparkles className="w-4 h-4 text-yellow-400" />
                 {page.hero_badge_text || "১০০% অর্গানিক"}
                 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
               </span>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-5">
               <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 drop-shadow-lg">{page.hero_headline}</h1>
               {page.hero_subheadline && <p className="text-base text-green-100/80">{page.hero_subheadline}</p>}
             </motion.div>
             {page.hero_images?.length > 0 && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-5">
                 <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-green-400/30">
                   <img src={page.hero_images[0]} alt={page.title} className="w-full h-auto object-cover" />
                   <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                     🔥 {page.cta_urgency_text || "সীমিত স্টক!"}
                   </motion.div>
                 </div>
               </motion.div>
             )}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-5">
               <div className="bg-gradient-to-r from-white via-green-50 to-white rounded-2xl p-5 shadow-2xl border border-green-200">
                 <div className="flex items-center justify-between">
                   <div>
                      {productOriginalPrice && productOriginalPrice > productPrice && (
                        <p className="text-base text-gray-400 line-through">আগের দাম: {page.price_unit}{productOriginalPrice}</p>
                      )}
                      <p className="text-3xl font-black text-green-700">{page.price_unit}{productPrice} <span className="text-lg font-bold">টাকা</span></p>
                   </div>
                    {discountPercentage > 0 && (
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                        {discountPercentage}% ছাড়
                      </div>
                    )}
                 </div>
                 <div className="flex items-center gap-4 mt-4 pt-4 border-t border-green-100">
                   <div className="flex items-center gap-1.5 text-xs text-green-700"><Truck className="w-4 h-4" /><span className="font-medium">ফ্রি ডেলিভারি</span></div>
                   <div className="flex items-center gap-1.5 text-xs text-green-700"><Shield className="w-4 h-4" /><span className="font-medium">ক্যাশ অন ডেলিভারি</span></div>
                   <div className="flex items-center gap-1.5 text-xs text-green-700"><Gift className="w-4 h-4" /><span className="font-medium">গ্যারান্টি</span></div>
                 </div>
               </div>
             </motion.div>
             <Button size="lg" onClick={scrollToCheckout} className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] border-2 border-green-400/50">
               <Leaf className="w-6 h-6 mr-2" />{page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-6 w-6" />
             </Button>
           </div>
         </div>
       </section>
     );
   };
 
   const renderVideo = () => {
    const videoUrl = page.video_url || page.hero_video_url;
    if (!page.show_video_section || !videoUrl) return null;
     return (
       <section key="video" className="py-8 px-4 bg-gradient-to-b from-[#0a3d1f] to-[#052e16]">
         <div className="max-w-lg mx-auto">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="rounded-2xl overflow-hidden shadow-2xl border-2 border-green-500/30">
            {getYouTubeId(videoUrl) ? (
               <div className="relative pt-[56.25%]">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?rel=0`} title="Product Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
               </div>
             ) : (
              <video src={videoUrl} controls className="w-full" />
             )}
           </motion.div>
          <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl">
            {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
          </Button>
         </div>
       </section>
     );
   };
 
   const renderGallery = () => {
     if (!page.show_gallery_section || !page.gallery_images?.length) return null;
     return (
       <section key="gallery" className="py-8 px-4 bg-gradient-to-b from-[#052e16] to-[#0a3d1f]">
         <div className="max-w-lg mx-auto">
           <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-5">
             <h2 className="text-xl font-bold text-white mb-1">{page.gallery_title || "আমাদের কালেকশন"}</h2>
             <p className="text-sm text-green-300/60">{page.gallery_subtitle || "যেমন দেখছেন তেমনই পাবেন"}</p>
           </motion.div>
           <div className="grid grid-cols-2 gap-2">
             {page.gallery_images.slice(0, 6).map((img, i) => (
               <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-xl overflow-hidden border border-green-500/20">
                 <img src={img} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
               </motion.div>
             ))}
           </div>
           <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl">
             {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         </div>
       </section>
     );
   };
 
   const renderFeatures = () => {
     if (!page.show_features_section || !features.length) return null;
     return (
       <section key="features" className="py-8 px-4 bg-gradient-to-b from-green-50 to-white">
         <div className="max-w-lg mx-auto">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
             <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg mb-3">
               <Leaf className="w-5 h-5" />
               <h2 className="text-lg font-bold">{page.features_headline || "কেন এই প্রোডাক্ট?"}</h2>
             </div>
             {page.features_subheadline && <p className="text-green-700 text-sm font-medium">{page.features_subheadline}</p>}
           </motion.div>
           <div className="space-y-3">
             {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2.5 py-2.5 px-3 bg-white rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Check className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex-1">
                   <p className="font-bold text-green-800 text-base">{feature.text}</p>
                   {feature.description && <p className="text-sm text-gray-600 mt-1">{feature.description}</p>}
                 </div>
               </motion.div>
             ))}
           </div>
           <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl shadow-green-600/30">
             {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         </div>
       </section>
     );
   };
 
   const renderReviews = () => {
     if (!page.show_reviews_section || !page.review_images?.length) return null;
     return (
      <section key="reviews" className="py-8 px-4 bg-gradient-to-b from-[#052e16] to-[#0a3d1f] overflow-hidden">
         <div className="max-w-lg mx-auto">
           <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-5">
             <h2 className="text-xl font-bold text-white mb-1">{page.reviews_headline || "কাস্টমার ফিডব্যাক"}</h2>
             <p className="text-sm text-green-300/60">{page.reviews_subheadline}</p>
           </motion.div>
          <ReviewCarousel images={page.review_images} />
         </div>
       </section>
     );
   };
 
   const renderContact = () => {
     if (!page.show_contact_section) return null;
     return (
       <section key="contact" className="py-8 px-4 bg-gradient-to-b from-[#041f10] to-[#052e16]">
         <div className="max-w-lg mx-auto">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-green-900/80 to-emerald-900/80 backdrop-blur-sm rounded-3xl p-6 border border-green-500/30 text-center shadow-2xl">
             <h2 className="text-xl font-bold text-white mb-2">{page.contact_headline || "যেকোনো প্রয়োজনে কল করুন"}</h2>
             <p className="text-sm text-green-300/70 mb-4">{page.contact_subheadline}</p>
             <div className="space-y-3">
               <a href={page.contact_phone_link || `tel:${page.contact_phone}`} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all hover:scale-[1.02]">
                 <Phone className="w-5 h-5" />{page.contact_phone}
               </a>
               {page.contact_whatsapp && (
                 <a href={getWhatsAppUrl(page.contact_whatsapp || "")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-[#25D366] to-[#128C7E] shadow-lg transition-all hover:scale-[1.02]">
                   <MessageCircle className="w-5 h-5" />{page.contact_whatsapp_text || "হোয়াটসঅ্যাপ মেসেজ"}
                 </a>
               )}
             </div>
             {page.contact_availability && <p className="text-xs text-green-400/50 mt-4 uppercase tracking-wider">{page.contact_availability}</p>}
           </motion.div>
         </div>
       </section>
     );
   };
 
   const renderExtra1 = () => {
     if (!page.show_extra_section_1) return null;
    // Use new JSONB array if available, fallback to old columns
    const points = (page.extra_section_1_points && page.extra_section_1_points.length > 0) 
      ? page.extra_section_1_points 
      : [page.extra_section_1_point_1, page.extra_section_1_point_2, page.extra_section_1_point_3, page.extra_section_1_point_4, page.extra_section_1_point_5, page.extra_section_1_point_6].filter(Boolean);
     if (points.length === 0) return null;
     return (
      <section key="extra1" className="py-8 px-4 bg-gradient-to-b from-[#052e16] to-[#0a3d1f]">
         <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg mb-3">
              <Shield className="w-5 h-5" />
              <h2 className="text-lg font-bold">{page.extra_section_1_heading || "কেন আমাদের উপর আস্থা রাখবেন?"}</h2>
            </div>
           </motion.div>
          <div className="space-y-3">
            {points.map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2.5 py-2.5 px-3 bg-white/95 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800 text-base">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40">
            {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
          </Button>
         </div>
       </section>
     );
   };
 
   const renderExtra2 = () => {
     if (!page.show_extra_section_2) return null;
    // Use new JSONB array if available, fallback to old columns
    const points = (page.extra_section_2_points && page.extra_section_2_points.length > 0) 
      ? page.extra_section_2_points 
      : [page.extra_section_2_point_1, page.extra_section_2_point_2, page.extra_section_2_point_3, page.extra_section_2_point_4, page.extra_section_2_point_5, page.extra_section_2_point_6].filter(Boolean);
     if (points.length === 0) return null;
     return (
      <section key="extra2" className="py-8 px-4 bg-gradient-to-b from-[#0a3d1f] to-[#052e16]">
         <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg mb-3">
              <Star className="w-5 h-5" />
              <h2 className="text-lg font-bold">{page.extra_section_2_heading || "আমাদের বিশেষত্ব"}</h2>
            </div>
           </motion.div>
          <div className="space-y-3">
            {points.map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2.5 py-2.5 px-3 bg-white/95 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800 text-base">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40">
            {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
          </Button>
         </div>
       </section>
     );
   };
 
   const renderExtra3 = () => {
     if (!page.show_extra_section_3) return null;
    // Use new JSONB array if available, fallback to old columns
    const points = (page.extra_section_3_points && page.extra_section_3_points.length > 0) 
      ? page.extra_section_3_points 
      : [page.extra_section_3_point_1, page.extra_section_3_point_2, page.extra_section_3_point_3, page.extra_section_3_point_4, page.extra_section_3_point_5, page.extra_section_3_point_6].filter(Boolean);
     if (points.length === 0) return null;
     return (
      <section key="extra3" className="py-8 px-4 bg-gradient-to-b from-[#052e16] to-[#0a3d1f]">
         <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg mb-3">
              <Gift className="w-5 h-5" />
              <h2 className="text-lg font-bold">{page.extra_section_3_heading || "গ্রাহক সুবিধা"}</h2>
            </div>
           </motion.div>
          <div className="space-y-3">
            {points.map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2.5 py-2.5 px-3 bg-white/95 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800 text-base">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <Button size="lg" onClick={scrollToCheckout} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40">
            {page.cta_button_text || "এখনই অর্ডার করুন"}<ArrowRight className="ml-2 h-5 w-5" />
          </Button>
         </div>
       </section>
     );
   };
 
   const renderCheckout = () => {
     if (!page.show_checkout_section) return null;
     return <CheckoutSection key="checkout" page={{ ...page, primary_color: '#16a34a', accent_color: '#22c55e' }} />;
   };
 
   const renderSection = (sectionId: string) => {
     switch (sectionId) {
       case 'hero': return renderHero();
       case 'video': return renderVideo();
       case 'gallery': return renderGallery();
       case 'features': return renderFeatures();
       case 'reviews': return renderReviews();
       case 'contact': return renderContact();
       case 'extra1': return renderExtra1();
       case 'extra2': return renderExtra2();
       case 'extra3': return renderExtra3();
       case 'checkout': return renderCheckout();
       default: return null;
     }
  };

  return (
    <div className="min-h-screen font-['Hind_Siliguri'] bg-gradient-to-b from-[#052e16] via-[#0a3d1f] to-[#052e16]">
      {sectionOrder.map(sectionId => renderSection(sectionId))}
      <footer className="py-6 text-center text-sm bg-[#041f10] space-y-2">
        {page.footer_text && (
          <p className="text-green-300/70 text-xs px-4 max-w-lg mx-auto">
            {page.footer_text}
          </p>
        )}
        <p className="text-green-500/40 flex items-center justify-center gap-2">
          <Leaf className="w-4 h-4" />
          © {new Date().getFullYear()} - সকল অধিকার সংরক্ষিত
        </p>
      </footer>
    </div>
  );
};
 
 export default Template01Organic;