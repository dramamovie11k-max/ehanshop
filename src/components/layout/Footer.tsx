import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, MessageCircle, Phone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWhatsAppUrl } from "@/lib/utils";

interface FooterLink {
  id: string;
  label: string;
  url: string;
}

const defaultQuickLinks: FooterLink[] = [
  { id: "1", label: "Home", url: "/" },
  { id: "2", label: "All Products", url: "/products" },
  { id: "3", label: "About Us", url: "/about" },
  { id: "4", label: "Contact", url: "/contact" },
];

const defaultCustomerServiceLinks: FooterLink[] = [
  { id: "1", label: "Delivery Rules", url: "/delivery-rules" },
  { id: "2", label: "Return Policy", url: "/return-policy" },
  { id: "3", label: "Refund Policy", url: "/refund-policy" },
  { id: "4", label: "Terms & Conditions", url: "/terms" },
];

const Footer = () => {
  const { getSetting } = useSiteSettings();
  const { t } = useLanguage();

  const siteName = getSetting("site_name", "সাজিব");
  const logoUrl = getSetting("site_logo_url", "");
  const facebookUrl = getSetting("social_facebook", "#");
  const instagramUrl = getSetting("social_instagram", "#");
  const youtubeUrl = getSetting("social_youtube", "#");
  const footerPhone = getSetting("footer_phone", "01700-000000");
  const footerAddress = getSetting("footer_address", "");
  const whatsappNumber = getSetting("whatsapp_number", "") || footerPhone;
  const developerText = getSetting("developer_text", "Developed by Rebuild It");

  let quickLinks: FooterLink[] = defaultQuickLinks;
  let customerServiceLinks: FooterLink[] = defaultCustomerServiceLinks;

  try {
    const ql = getSetting("footer_quick_links", "");
    if (ql) quickLinks = JSON.parse(ql);
  } catch (e) {}

  try {
    const cs = getSetting("footer_customer_service_links", "");
    if (cs) customerServiceLinks = JSON.parse(cs);
  } catch (e) {}

  const socials = [
    { href: facebookUrl, icon: Facebook, label: "Facebook" },
    { href: youtubeUrl, icon: Youtube, label: "YouTube" },
    { href: instagramUrl, icon: Instagram, label: "Instagram" },
  ];

  return (
    <footer
      className="pb-20 lg:pb-0"
      style={{ fontFamily: "'Hind Siliguri', sans-serif", backgroundColor: '#07391C', color: '#cbd5e1' }}
    >
      <div className="max-w-[1240px] mx-auto px-5 pt-10 pb-0.5">
        {/* Top grid: 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-20 md:h-16 mb-3" />
            ) : (
              <h3 className="text-3xl md:text-2xl font-bold tracking-wide mb-3" style={{ color: '#ffffff' }}>{siteName}</h3>
            )}
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#cbd5e1' }}>
              {getSetting('footer_description', '২০১৬ সাল থেকে সেরা মানের পণ্য সাশ্রয়ী মূল্যে আপনার দোরগোড়ায়। সরাসরি ফ্যাক্টরি থেকে গ্রাহকের কাছে।')}
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold mb-4" style={{ color: '#ffffff' }}>
              {t('footer.quick_links')}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link to={link.url} className="text-sm hover:text-white transition-colors" style={{ color: '#cbd5e1' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service / Policy */}
          <div>
            <h4 className="text-base font-bold mb-4" style={{ color: '#ffffff' }}>
              {t('footer.customer_service')}
            </h4>
            <ul className="space-y-2.5">
              {customerServiceLinks.map((link) => (
                <li key={link.id}>
                  <Link to={link.url} className="text-sm hover:text-white transition-colors" style={{ color: '#cbd5e1' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h4 className="text-base font-bold mb-4" style={{ color: '#ffffff' }}>
              যোগাযোগ
            </h4>
            {footerAddress && (
              <div className="flex items-start justify-center lg:justify-start gap-2 text-sm mb-4" style={{ color: '#cbd5e1' }}>
                <span className="mt-0.5">📍</span>
                <span>{footerAddress}</span>
              </div>
            )}
            <div className="space-y-2.5 w-full max-w-xs">
              <a
                href={`tel:${footerPhone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center justify-center lg:justify-start gap-2 text-sm rounded-full px-4 py-2 transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
              >
                <Phone className="w-4 h-4" />
                <span>কল করুন — {footerPhone}</span>
              </a>
              <a
                href={getWhatsAppUrl(whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-start gap-2 text-sm rounded-full px-4 py-2 transition-colors"
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp — {whatsappNumber}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            © 2025 <span style={{ color: '#ffffff' }}>{siteName}</span>. {t('footer.all_rights')}
          </p>
          <p className="text-[11px]" style={{ color: '#64748b' }}>{developerText}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
