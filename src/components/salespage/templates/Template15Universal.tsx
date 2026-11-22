import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Play, ChevronDown, Star } from "lucide-react";
import { SalesPage } from "@/types/salesPage";
import { CustomSection } from "@/components/admin/CustomSectionEditor";
import CheckoutSection from "../CheckoutSection";
import ContactSection from "../ContactSection";
import GallerySection from "../GallerySection";

interface Template15Props {
  page: SalesPage;
}

// Default styles for the universal template
const defaultStyles = {
  global: {
    backgroundColor: "#f4f4f4",
    maxWidth: "650",
    sectionGap: "5",
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  hero: {
    backgroundColor: "#f0fdf4",
    headerBgColor: "#065f46",
    headerTextColor: "#ffffff",
    subheadlineColor: "#16a34a",
    borderRadius: "15",
    cardPadding: "15",
    videoBorderColor: "#4ade80",
    videoBorderWidth: "4",
    offerTextColor: "#16a34a",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
    ctaBorderColor: "#ffffff",
    ctaBorderWidth: "2",
    ctaFontSize: "20",
  },
  features: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    itemBgColor: "rgba(255,255,255,0.1)",
    itemTextColor: "#ffffff",
    itemDescColor: "rgba(255,255,255,0.6)",
    checkBgColor: "#4ade80",
    checkIconColor: "#065f46",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
    ctaBorderColor: "#ffffff",
  },
  reviews: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    imageBorderColor: "#4ade80",
    imageBorderWidth: "3",
  },
  contact: {
    borderRadius: "15",
  },
  checkout: {
    borderRadius: "15",
  },
  extra: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    itemBgColor: "rgba(255,255,255,0.1)",
    itemTextColor: "#ffffff",
    checkBgColor: "#4ade80",
    checkIconColor: "#065f46",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
    ctaBorderColor: "#ffffff",
  },
  gallery: {
    borderRadius: "15",
  },
  video: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    videoBorderColor: "#4ade80",
    videoBorderWidth: "3",
  },
  countdown: {
    backgroundColor: "#064e3b",
    borderRadius: "15",
    textColor: "#ffffff",
    numberBgColor: "rgba(255,255,255,0.15)",
    numberColor: "#ffffff",
    labelColor: "rgba(255,255,255,0.7)",
  },
  footer: {
    backgroundColor: "#065f46",
    textColor: "#ffffff",
  },
};

// Merge user styles with defaults
const getStyles = (page: SalesPage) => {
  const ts = (page.template_styles || {}) as Record<string, Record<string, string>>;
  const merged: Record<string, Record<string, string>> = {};
  for (const key of Object.keys(defaultStyles)) {
    merged[key] = { ...(defaultStyles as any)[key], ...(ts[key] || {}) };
  }
  return merged;
};

const Template15Universal = ({ page }: Template15Props) => {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const s = getStyles(page);

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  // Build section order including custom sections
  const customSections = ((page.template_styles as any)?.customSections || []) as CustomSection[];
  const baseSectionOrder = page.section_order || ['hero', 'countdown', 'video', 'gallery', 'features', 'extra1', 'extra2', 'extra3', 'reviews', 'contact', 'checkout'];
  // Append any custom section IDs not already in the order
  const customIds = customSections.map(c => c.id);
  const existingIds = new Set(baseSectionOrder);
  const missingCustomIds = customIds.filter(id => !existingIds.has(id));
  const sectionOrder = [...baseSectionOrder, ...missingCustomIds];

  const wrapSection = (key: string, content: React.ReactNode) => (
    <div key={key} className="px-3 md:px-4">
      <div className="mx-auto" style={{ maxWidth: `${s.global.maxWidth}px` }}>
        {content}
      </div>
    </div>
  );

  const renderSection = (sectionKey: string) => {
    switch (sectionKey) {
      case 'hero':
        return page.show_hero_section !== false && (
          <Universal15Hero key="hero" page={page} s={s} onOrderClick={scrollToCheckout} getYoutubeEmbedUrl={getYoutubeEmbedUrl} />
        );
      case 'countdown':
        return page.show_countdown && wrapSection('countdown',
          <Universal15Countdown page={page} s={s} />
        );
      case 'video':
        return page.show_video_section && page.video_url && wrapSection('video',
          <Universal15Video page={page} s={s} getYoutubeEmbedUrl={getYoutubeEmbedUrl} />
        );
      case 'gallery':
        return page.show_gallery_section && wrapSection('gallery',
          <div style={{ borderRadius: `${s.gallery.borderRadius}px`, overflow: 'hidden' }}>
            <GallerySection page={page} onOrderClick={scrollToCheckout} />
          </div>
        );
      case 'features':
        return page.show_features_section && wrapSection('features',
          <Universal15Features page={page} s={s} onOrderClick={scrollToCheckout} />
        );
      case 'reviews':
        return page.show_reviews_section && wrapSection('reviews',
          <Universal15Reviews page={page} s={s} />
        );
      case 'contact':
        return page.show_contact_section && wrapSection('contact',
          <div style={{ borderRadius: `${s.contact.borderRadius}px`, overflow: 'hidden' }}>
            <ContactSection page={page} />
          </div>
        );
      case 'extra1':
        return page.show_extra_section_1 && wrapSection('extra1',
          <Universal15Extra page={page} s={s} sectionNumber={1} onOrderClick={scrollToCheckout} />
        );
      case 'extra2':
        return page.show_extra_section_2 && wrapSection('extra2',
          <Universal15Extra page={page} s={s} sectionNumber={2} onOrderClick={scrollToCheckout} />
        );
      case 'extra3':
        return page.show_extra_section_3 && wrapSection('extra3',
          <Universal15Extra page={page} s={s} sectionNumber={3} onOrderClick={scrollToCheckout} />
        );
      case 'checkout':
        return page.show_checkout_section !== false && (
          <div key="checkout" ref={checkoutRef} id="checkout" className="px-3 md:px-4">
            <div className="mx-auto" style={{ maxWidth: `${s.global.maxWidth}px` }}>
              <div style={{ borderRadius: `${s.checkout.borderRadius}px ${s.checkout.borderRadius}px 0 0`, overflow: 'hidden' }}>
                <CheckoutSection page={page} />
              </div>
            </div>
          </div>
        );
      default:
        // Check for custom sections (cs-xxx)
        if (sectionKey.startsWith('cs-')) {
          const customSections = ((page.template_styles as any)?.customSections || []) as CustomSection[];
          const cs = customSections.find(c => c.id === sectionKey);
          if (cs) {
            return wrapSection(sectionKey,
              <Universal15CustomSection section={cs} s={s} onOrderClick={scrollToCheckout} />
            );
          }
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundColor: s.global.backgroundColor,
      fontFamily: s.global.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      gap: `${s.global.sectionGap}px`,
    }}>
      {sectionOrder.map(renderSection)}

      {/* Footer */}
      <div className="py-6 text-center text-sm" style={{ backgroundColor: s.footer.backgroundColor, color: s.footer.textColor }}>
        <p className="opacity-70">{page.footer_text || `© ${new Date().getFullYear()} - সকল অধিকার সংরক্ষিত`}</p>
      </div>
    </div>
  );
};

// ─── Hero Section ────────────────────────────────────────────────
const Universal15Hero = ({ page, s, onOrderClick, getYoutubeEmbedUrl }: {
  page: SalesPage; s: Record<string, Record<string, string>>; onOrderClick: () => void; getYoutubeEmbedUrl: (url: string) => string;
}) => {
  const h = s.hero;
  return (
    <section className="flex justify-center px-[10px] md:px-[15px] pt-[15px] md:pt-[30px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center"
        style={{
          maxWidth: `${s.global.maxWidth}px`,
          backgroundColor: h.backgroundColor,
          padding: `${h.cardPadding}px`,
          borderRadius: `${h.borderRadius}px`,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5 md:mb-6"
          style={{
            backgroundColor: h.headerBgColor,
            color: h.headerTextColor,
            padding: '15px 20px',
            fontSize: '17px',
            lineHeight: '1.6',
            fontWeight: 700,
            borderRadius: '10px',
          }}
        >
          <p className="md:text-[20px]">{page.hero_headline}</p>
        </motion.div>

        {/* Sub Header */}
        {page.hero_subheadline && (
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[18px] md:text-[22px] font-bold mb-4 md:mb-5 px-2"
            style={{ color: h.subheadlineColor }}
          >
            {page.hero_subheadline}
          </motion.h2>
        )}

        {/* Video */}
        {page.hero_video_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative mb-5 md:mb-6 overflow-hidden"
            style={{
              paddingBottom: '56.25%',
              height: 0,
              border: `${h.videoBorderWidth}px solid ${h.videoBorderColor}`,
              borderRadius: '12px',
              background: '#000',
            }}
          >
            <iframe
              src={getYoutubeEmbedUrl(page.hero_video_url)}
              title="Product Video"
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        )}

        {/* Product Image (fallback) */}
        {!page.hero_video_url && page.hero_images?.[0] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-5 md:mb-6"
          >
            <img
              src={page.hero_images[0]}
              alt={page.hero_headline}
              className="w-full object-contain mx-auto"
              style={{
                maxHeight: '400px',
                border: `${h.videoBorderWidth}px solid ${h.videoBorderColor}`,
                borderRadius: '12px',
              }}
            />
          </motion.div>
        )}

        {/* Offer Details */}
        {page.offer_details && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[18px] md:text-[22px] font-bold mb-5 md:mb-6 leading-snug"
            style={{ color: h.offerTextColor }}
          >
            {page.offer_details}
          </motion.p>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <button
            onClick={onOrderClick}
            className="w-full md:w-auto inline-block font-bold transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: h.ctaBgColor,
              color: h.ctaTextColor,
              padding: '12px 30px',
              borderRadius: `${h.ctaBorderRadius}px`,
              boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
              border: `${h.ctaBorderWidth}px solid ${h.ctaBorderColor}`,
              fontSize: `${h.ctaFontSize}px`,
            }}
          >
            {page.cta_button_text || 'অর্ডার করুন'}
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

// ─── Features Section ───────────────────────────────────────────
const Universal15Features = ({ page, s, onOrderClick }: {
  page: SalesPage; s: Record<string, Record<string, string>>; onOrderClick: () => void;
}) => {
  const f = s.features;
  const features = [
    { text: page.feature_1_text, icon: page.feature_1_icon, desc: page.feature_1_description },
    { text: page.feature_2_text, icon: page.feature_2_icon, desc: page.feature_2_description },
    { text: page.feature_3_text, icon: page.feature_3_icon, desc: page.feature_3_description },
    { text: page.feature_4_text, icon: page.feature_4_icon, desc: page.feature_4_description },
    { text: page.feature_5_text, icon: page.feature_5_icon, desc: page.feature_5_description },
    { text: page.feature_6_text, icon: page.feature_6_icon, desc: page.feature_6_description },
  ].filter(ft => ft.text);

  if (features.length === 0) return null;

  return (
    <section
      className="py-6 px-4 overflow-hidden"
      style={{ backgroundColor: f.backgroundColor, borderRadius: `${f.borderRadius}px` }}
    >
      {(page.feature_section_image || page.feature_section_images?.[0]) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-5 -mx-4 -mt-6"
        >
          <img
            src={page.feature_section_image || page.feature_section_images[0]}
            alt={page.features_headline}
            className="w-full object-cover"
            style={{ maxHeight: '350px' }}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: f.headingColor }}>
          {page.features_headline}
        </h2>
        {page.features_subheadline && (
          <p className="text-base md:text-lg" style={{ color: f.subheadingColor }}>
            {page.features_subheadline}
          </p>
        )}
      </motion.div>

      <div className="space-y-2">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: f.itemBgColor }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: f.checkBgColor }}
            >
              {feature.icon ? (
                <span className="text-sm">{feature.icon}</span>
              ) : (
                <Check className="w-4 h-4" style={{ color: f.checkIconColor }} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: f.itemTextColor }}>
                {feature.text}
              </h3>
              {feature.desc && (
                <p className="text-xs mt-0.5" style={{ color: f.itemDescColor }}>
                  {feature.desc}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-5"
      >
        <button
          onClick={onOrderClick}
          className="w-full md:w-auto inline-block text-[20px] md:text-[24px] font-bold transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: f.ctaBgColor,
            color: f.ctaTextColor,
            padding: '12px 30px',
            borderRadius: `${f.ctaBorderRadius}px`,
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            border: `2px solid ${f.ctaBorderColor}`,
          }}
        >
          {page.cta_button_text || 'অর্ডার করুন'}
        </button>
      </motion.div>
    </section>
  );
};

// ─── Reviews Section ────────────────────────────────────────────
const Universal15Reviews = ({ page, s }: { page: SalesPage; s: Record<string, Record<string, string>> }) => {
  const r = s.reviews;
  const hasImages = page.review_images && page.review_images.length > 0;
  const hasVideo = !!page.review_video_url;

  if (!hasImages && !hasVideo) return null;

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <section
      className="py-6 px-4 overflow-hidden"
      style={{ backgroundColor: r.backgroundColor, borderRadius: `${r.borderRadius}px` }}
    >
      {page.reviews_headline && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: r.headingColor }}>
            {page.reviews_headline}
          </h2>
          {page.reviews_subheadline && (
            <p className="text-base md:text-lg mt-1" style={{ color: r.subheadingColor }}>
              {page.reviews_subheadline}
            </p>
          )}
        </motion.div>
      )}

      {hasVideo && page.review_video_url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mb-4 overflow-hidden"
          style={{
            paddingBottom: '56.25%', height: 0,
            border: `${r.imageBorderWidth}px solid ${r.imageBorderColor}`,
            borderRadius: '12px',
          }}
        >
          <iframe
            src={getYoutubeEmbedUrl(page.review_video_url)}
            title="Review Video"
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      )}

      {hasImages && (
        <div className="grid grid-cols-2 gap-3">
          {page.review_images.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <img
                src={img}
                alt={`Review ${index + 1}`}
                className="w-full object-cover"
                style={{
                  border: `${r.imageBorderWidth}px solid ${r.imageBorderColor}`,
                  borderRadius: '10px',
                }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

// ─── Extra Section ──────────────────────────────────────────────
const Universal15Extra = ({ page, s, sectionNumber, onOrderClick }: {
  page: SalesPage; s: Record<string, Record<string, string>>; sectionNumber: number; onOrderClick: () => void;
}) => {
  const e = s.extra;
  const heading = (page as any)[`extra_section_${sectionNumber}_heading`] as string;
  const pointsArray = (page as any)[`extra_section_${sectionNumber}_points`] as string[] | null;
  const legacyPoints = [1, 2, 3, 4, 5, 6]
    .map(i => (page as any)[`extra_section_${sectionNumber}_point_${i}`] as string)
    .filter(Boolean);

  const points = (pointsArray && pointsArray.length > 0) ? pointsArray : legacyPoints;
  if (points.length === 0) return null;

  return (
    <section
      className="py-6 px-4 overflow-hidden"
      style={{ backgroundColor: e.backgroundColor, borderRadius: `${e.borderRadius}px` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-5"
      >
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: e.headingColor }}>
          {heading || 'বিশেষ সুবিধা'}
        </h2>
      </motion.div>

      <div className="space-y-2">
        {points.map((point, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: e.itemBgColor }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: e.checkBgColor }}
            >
              <Check className="w-4 h-4" style={{ color: e.checkIconColor }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: e.itemTextColor }}>{point}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-5"
      >
        <button
          onClick={onOrderClick}
          className="w-full md:w-auto inline-block text-[20px] md:text-[24px] font-bold transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: e.ctaBgColor,
            color: e.ctaTextColor,
            padding: '12px 30px',
            borderRadius: `${e.ctaBorderRadius}px`,
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            border: `2px solid ${e.ctaBorderColor}`,
          }}
        >
          {page.cta_button_text || 'অর্ডার করুন'}
        </button>
      </motion.div>
    </section>
  );
};

// ─── Countdown Section ──────────────────────────────────────────
const Universal15Countdown = ({ page, s }: { page: SalesPage; s: Record<string, Record<string, string>> }) => {
  const c = s.countdown;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!page.countdown_end_date) return;
    const target = new Date(page.countdown_end_date).getTime();
    
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [page.countdown_end_date]);

  if (!page.countdown_end_date) return null;

  const items = [
    { value: timeLeft.days, label: page.countdown_label_days || 'দিন' },
    { value: timeLeft.hours, label: page.countdown_label_hours || 'ঘণ্টা' },
    { value: timeLeft.minutes, label: page.countdown_label_minutes || 'মিনিট' },
    { value: timeLeft.seconds, label: page.countdown_label_seconds || 'সেকেন্ড' },
  ];

  return (
    <section
      className="py-6 px-4 overflow-hidden"
      style={{ backgroundColor: c.backgroundColor, borderRadius: `${c.borderRadius}px` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex justify-center gap-3"
      >
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <div
              className="text-2xl md:text-3xl font-bold px-4 py-3 rounded-xl min-w-[60px]"
              style={{ backgroundColor: c.numberBgColor, color: c.numberColor }}
            >
              {String(item.value).padStart(2, '0')}
            </div>
            <p className="text-xs mt-1 font-medium" style={{ color: c.labelColor }}>
              {item.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

// ─── Video Section ──────────────────────────────────────────────
const Universal15Video = ({ page, s, getYoutubeEmbedUrl }: {
  page: SalesPage; s: Record<string, Record<string, string>>; getYoutubeEmbedUrl: (url: string) => string;
}) => {
  const v = s.video;
  if (!page.video_url) return null;

  return (
    <section
      className="py-6 px-4 overflow-hidden"
      style={{ backgroundColor: v.backgroundColor, borderRadius: `${v.borderRadius}px` }}
    >
      {(page.video_title || page.video_subtitle) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Play className="w-4 h-4" style={{ color: v.headingColor }} />
            <span className="text-sm font-medium" style={{ color: v.headingColor, opacity: 0.8 }}>ভিডিও দেখুন</span>
          </div>
          {page.video_title && (
            <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: v.headingColor }}>
              {page.video_title}
            </h2>
          )}
          {page.video_subtitle && (
            <p className="text-base" style={{ color: v.subheadingColor }}>
              {page.video_subtitle}
            </p>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden"
        style={{
          paddingBottom: '56.25%', height: 0,
          border: `${v.videoBorderWidth}px solid ${v.videoBorderColor}`,
          borderRadius: '12px',
        }}
      >
        <iframe
          src={getYoutubeEmbedUrl(page.video_url)}
          title={page.video_title || 'Video'}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    </section>
  );
};

// ─── Custom Section Renderer ────────────────────────────────────
const Universal15CustomSection = ({ section, s, onOrderClick }: {
  section: CustomSection; s: Record<string, Record<string, string>>; onOrderClick: () => void;
}) => {
  const cs = section.styles;
  const [sliderIndex, setSliderIndex] = useState(0);

  // Auto-advance slider
  useEffect(() => {
    if (section.type !== 'slider' || section.images.length <= 1) return;
    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % section.images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [section.type, section.images.length]);

  const headingStyle: React.CSSProperties = {
    color: cs.headingColor,
    fontSize: `${cs.headingFontSize || '22'}px`,
    textAlign: (cs.headingAlignment as any) || 'center',
    fontWeight: cs.headingBold !== false ? 'bold' : 'normal',
  };

  const renderHeading = () => {
    if (!section.title) return null;
    return <h2 className="mb-4" style={headingStyle}>{section.title}</h2>;
  };

  const renderCta = () => {
    if (!cs.showCta) return null;
    return (
      <motion.button whileTap={{ scale: 0.97 }} onClick={onOrderClick}
        className="w-full py-3 mt-4 font-bold text-base"
        style={{ backgroundColor: cs.ctaBgColor, color: cs.ctaTextColor, borderRadius: `${cs.ctaBorderRadius || '50'}px` }}>
        {cs.ctaText || 'এখনই অর্ডার করুন'}
      </motion.button>
    );
  };

  const contentFontSize = `${cs.contentFontSize || '15'}px`;
  const contentAlign = (cs.contentAlignment as any) || 'left';
  const imgBorderRadius = `${cs.imageBorderRadius || '8'}px`;

  const renderContent = () => {
    if (!section.content) return null;
    return <p className="leading-relaxed mt-2" style={{ color: cs.textColor, fontSize: contentFontSize, textAlign: contentAlign }}>{section.content}</p>;
  };

  const renderPoints = () => {
    if (!section.points.length) return null;
    return (
      <div className="space-y-2 mt-3">
        {section.points.filter(p => p.trim()).map((point, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.extra?.checkBgColor || '#4ade80' }}>
              <Check className="w-3 h-3" style={{ color: s.extra?.checkIconColor || '#065f46' }} />
            </div>
            <p style={{ color: cs.textColor, fontSize: contentFontSize }}>{point}</p>
          </div>
        ))}
      </div>
    );
  };

  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 12px rgba(0,0,0,0.15)',
    lg: '0 10px 30px rgba(0,0,0,0.2)',
  };

  const wrapSection = (children: React.ReactNode) => (
    <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="overflow-hidden"
      style={{
        backgroundColor: cs.backgroundColor,
        borderRadius: `${cs.borderRadius}px`,
        fontFamily: "'Hind Siliguri', sans-serif",
        padding: `${cs.padding || '24'}px`,
        border: cs.borderWidth && cs.borderWidth !== '0' ? `${cs.borderWidth}px solid ${cs.borderColor || 'transparent'}` : undefined,
        boxShadow: shadowMap[cs.shadow || 'none'] || 'none',
      }}>
      {children}
    </motion.section>
  );

  // ── Divider ──
  if (section.type === 'divider') {
    return (
      <div className="py-2 px-4">
        <hr style={{ borderColor: cs.headingColor || '#ccc' }} />
      </div>
    );
  }

  // ── Video ──
  if (section.type === 'video') {
    const videoUrl = section.videoUrl || '';
    const getEmbedUrl = (url: string) => {
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
      return url;
    };
    return wrapSection(
      <>
        {renderHeading()}
        {videoUrl && (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe src={getEmbedUrl(videoUrl)} className="absolute inset-0 w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        )}
        {renderContent()}
        {renderCta()}
      </>
    );
  }

  // ── Gallery (grid with lightbox feel) ──
  if (section.type === 'gallery') {
    return wrapSection(
      <>
        {renderHeading()}
        {section.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {section.images.map((img, i) => (
              <motion.img key={i} src={img} alt=""
                className="w-full object-cover aspect-square"
                style={{ borderRadius: imgBorderRadius }}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }} />
            ))}
          </div>
        )}
        {renderContent()}
        {renderCta()}
      </>
    );
  }

  // ── Slider ──
  if (section.type === 'slider') {
    return wrapSection(
      <>
        {renderHeading()}
        {section.images.length > 0 && (
          <div className="relative overflow-hidden" style={{ borderRadius: imgBorderRadius }}>
            <div className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
              {section.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full flex-shrink-0 object-cover" />
              ))}
            </div>
            {section.images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {section.images.map((_, i) => (
                  <button key={i} type="button" onClick={() => setSliderIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === sliderIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                ))}
              </div>
            )}
          </div>
        )}
        {renderContent()}
        {renderCta()}
      </>
    );
  }

  // ── Single Image ──
  if (section.type === 'image') {
    return wrapSection(
      <>
        {renderHeading()}
        {section.images[0] && (
          <img src={section.images[0]} alt="" className="w-full object-cover" style={{ borderRadius: imgBorderRadius }} />
        )}
        {renderContent()}
        {renderCta()}
      </>
    );
  }

  // ── HTML ──
  if (section.type === 'html') {
    return wrapSection(
      <>
        {renderHeading()}
        {section.content && (
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        )}
        {renderCta()}
      </>
    );
  }

  // ── Testimonial ──
  if (section.type === 'testimonial') {
    return wrapSection(
      <>
        {renderHeading()}
        <div className="space-y-3 mt-3">
          {(section.testimonials || []).filter(t => t.name.trim()).map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl" style={{ backgroundColor: `${cs.textColor}10` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: cs.ctaBgColor, color: cs.ctaTextColor }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: cs.headingColor }}>{t.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating || 5 }).map((_, si) => (
                      <Star key={si} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ color: cs.textColor, fontSize: contentFontSize }} className="leading-relaxed">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── Pricing ──
  if (section.type === 'pricing') {
    const pd = section.pricingData || { originalPrice: "", offerPrice: "", badgeText: "অফার", unit: "৳", features: [] };
    return wrapSection(
      <>
        {renderHeading()}
        <div className="text-center mt-3">
          {pd.badgeText && (
            <span className="inline-block px-4 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: cs.ctaBgColor, color: cs.ctaTextColor }}>
              {pd.badgeText}
            </span>
          )}
          <div className="flex items-center justify-center gap-3 mb-4">
            {pd.originalPrice && (
              <span className="text-xl line-through opacity-50" style={{ color: cs.textColor }}>
                {pd.unit}{pd.originalPrice}
              </span>
            )}
            <span className="text-4xl font-bold" style={{ color: cs.headingColor }}>
              {pd.unit}{pd.offerPrice}
            </span>
          </div>
          {pd.features.length > 0 && (
            <div className="space-y-2 text-left">
              {pd.features.filter(f => f.trim()).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: s.extra?.checkBgColor || '#4ade80' }}>
                    <Check className="w-3 h-3" style={{ color: s.extra?.checkIconColor || '#065f46' }} />
                  </div>
                  <p style={{ color: cs.textColor, fontSize: contentFontSize }}>{f}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── Countdown Timer ──
  if (section.type === 'countdown-timer') {
    return wrapSection(
      <>
        {renderHeading()}
        <CustomCountdown endDate={section.countdownEndDate || ""} cs={cs} />
        {renderContent()}
        {renderCta()}
      </>
    );
  }

  // ── Feature Icons Grid ──
  if (section.type === 'feature-icons') {
    return wrapSection(
      <>
        {renderHeading()}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {(section.featureItems || []).filter(f => f.title.trim()).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="text-center p-4 rounded-xl" style={{ backgroundColor: `${cs.textColor}10` }}>
              <div className="text-3xl mb-2">{item.icon || '✅'}</div>
              <h4 className="font-bold text-sm mb-1" style={{ color: cs.headingColor }}>{item.title}</h4>
              {item.description && (
                <p className="text-xs opacity-80" style={{ color: cs.textColor }}>{item.description}</p>
              )}
            </motion.div>
          ))}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── CTA Banner ──
  if (section.type === 'cta-banner') {
    return wrapSection(
      <div className="text-center">
        {renderHeading()}
        {section.content && (
          <p className="leading-relaxed mb-4" style={{ color: cs.textColor, fontSize: contentFontSize, textAlign: 'center' }}>{section.content}</p>
        )}
        {cs.showCta && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onOrderClick}
            className="w-full py-4 font-bold text-lg animate-pulse"
            style={{ backgroundColor: cs.ctaBgColor, color: cs.ctaTextColor, borderRadius: `${cs.ctaBorderRadius || '50'}px`, boxShadow: '0 5px 20px rgba(0,0,0,0.25)' }}>
            {cs.ctaText || 'এখনই অর্ডার করুন'}
          </motion.button>
        )}
      </div>
    );
  }

  // ── Comparison ──
  if (section.type === 'comparison') {
    return wrapSection(
      <>
        {renderHeading()}
        <div className="mt-3 overflow-hidden rounded-xl" style={{ border: `1px solid ${cs.textColor}20` }}>
          <div className="grid grid-cols-3 text-center font-bold text-xs p-2" style={{ backgroundColor: `${cs.textColor}15`, color: cs.headingColor }}>
            <span></span>
            <span>❌ ছাড়া</span>
            <span>✅ সাথে</span>
          </div>
          {(section.comparisonItems || []).filter(c => c.label.trim()).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="grid grid-cols-3 text-center p-2 text-xs" style={{ borderTop: `1px solid ${cs.textColor}10`, color: cs.textColor, fontSize: contentFontSize }}>
              <span className="font-medium text-left" style={{ color: cs.headingColor }}>{item.label}</span>
              <span className="opacity-60">{item.before}</span>
              <span className="font-semibold">{item.after}</span>
            </motion.div>
          ))}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── FAQ ──
  if (section.type === 'faq') {
    return wrapSection(
      <>
        {renderHeading()}
        <div className="space-y-2">
          {(section.faqItems || []).filter(f => f.question.trim()).map((faq, i) => (
            <details key={i} className="rounded-lg overflow-hidden group" style={{ backgroundColor: `${cs.textColor}15` }}>
              <summary className="px-3 py-2 cursor-pointer font-medium flex items-center justify-between" style={{ color: cs.headingColor, fontSize: contentFontSize }}>
                <span>{faq.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" style={{ color: cs.headingColor }} />
              </summary>
              <div className="px-3 pb-2" style={{ color: cs.textColor, fontSize: contentFontSize }}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── Image-Text with position ──
  if (section.type === 'image-text') {
    const isHorizontal = cs.imagePosition === 'left' || cs.imagePosition === 'right';
    const imageFirst = cs.imagePosition === 'top' || cs.imagePosition === 'left';
    const imageBlock = section.images[0] ? <img src={section.images[0]} alt="" className="w-full object-cover" style={{ borderRadius: imgBorderRadius }} /> : null;
    const textBlock = <div>{renderContent()}{renderPoints()}</div>;

    return wrapSection(
      <>
        {renderHeading()}
        <div className={isHorizontal ? "flex gap-4 items-start" : "space-y-3"}
          style={isHorizontal ? { flexDirection: imageFirst ? 'row' : 'row-reverse' } : undefined}>
          {imageFirst ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
        </div>
        {renderCta()}
      </>
    );
  }

  // ── Default: text, bullet-points, image-grid, banner ──
  return wrapSection(
    <>
      {renderHeading()}
      {section.type === 'banner' && section.images[0] && (
        <img src={section.images[0]} alt="" className="w-full object-cover" style={{ borderRadius: imgBorderRadius }} />
      )}
      {renderContent()}
      {section.type === 'image-grid' && section.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {section.images.map((img, i) => (
            <motion.img key={i} src={img} alt="" className="w-full object-cover"
              style={{ borderRadius: imgBorderRadius }}
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} />
          ))}
        </div>
      )}
      {renderPoints()}
      {renderCta()}
    </>
  );
};

// ─── Custom Countdown ───────────────────────────────────────────
const CustomCountdown = ({ endDate, cs }: { endDate: string; cs: CustomSection["styles"] }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return null;

  const items = [
    { value: timeLeft.days, label: 'দিন' },
    { value: timeLeft.hours, label: 'ঘণ্টা' },
    { value: timeLeft.minutes, label: 'মিনিট' },
    { value: timeLeft.seconds, label: 'সেকেন্ড' },
  ];

  return (
    <div className="flex justify-center gap-3 mt-3">
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-2xl font-bold px-3 py-2 rounded-xl min-w-[50px]"
            style={{ backgroundColor: `${cs.textColor}15`, color: cs.headingColor }}>
            {String(item.value).padStart(2, '0')}
          </div>
          <p className="text-[10px] mt-1 font-medium" style={{ color: cs.textColor, opacity: 0.7 }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default Template15Universal;
