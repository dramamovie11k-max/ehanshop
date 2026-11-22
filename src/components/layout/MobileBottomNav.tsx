import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, MessageCircle, User, Tag } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { getWhatsAppUrl } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { getSetting } = useSiteSettings();
  const { t } = useLanguage();

  // Hide on sales pages
  if (location.pathname.startsWith("/lp/")) return null;

  // Order: Home, Shop, Offers (center), WhatsApp, Account
  const navItems = [
    {
      key: "home",
      icon: Home,
      label: t('nav.home'),
      href: getSetting("bottom_nav_home_link", "/"),
    },
    {
      key: "shop",
      icon: ShoppingBag,
      label: t('nav.shop'),
      href: getSetting("bottom_nav_shop_link", "/products"),
    },
    {
      key: "offers",
      icon: Tag,
      label: t('nav.offers'),
      href: getSetting("bottom_nav_offers_link", "/products?featured=true"),
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      label: t('nav.whatsapp'),
      href: getWhatsAppUrl(getSetting("bottom_nav_whatsapp_link", "https://wa.me/8801XXXXXXXXX")),
      isExternal: true,
    },
    {
      key: "account",
      icon: User,
      label: t('nav.account'),
      href: getSetting("bottom_nav_account_link", "/dashboard"),
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/40 lg:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isCenter = item.key === "offers";

          if (item.isExternal) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center flex-1 h-full py-2"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-green-600"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </motion.div>
                <span className="text-[10px] text-green-600 font-medium">
                  {item.label}
                </span>
              </a>
            );
          }

          if (isCenter) {
            return (
              <Link
                key={item.key}
                to={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full py-2"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-orange-500"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </motion.div>
                <span className="text-[10px] text-orange-500 font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              to={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-2"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </motion.div>
              <span className={`text-[10px] transition-colors ${
                active ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
