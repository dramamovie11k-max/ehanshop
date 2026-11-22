import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

interface DynamicProductSectionProps {
  sectionNumber: 1 | 2 | 3 | 4 | 5 | 6;
}

const DynamicProductSection = ({ sectionNumber }: DynamicProductSectionProps) => {
  const { getSetting, isLoading: settingsLoading } = useSiteSettings();
  const { t, language } = useLanguage();
  
  const sectionTranslationKeys: Record<number, string> = {
    1: 'section.new_products',
    2: 'section.popular_products',
    3: 'section.special_offers',
    4: 'section.trending',
    5: 'section.best_selling',
    6: 'section.hot_deals',
  };
  
  const dbTitle = getSetting(`product_section_${sectionNumber}_title`, "");
  const title = language === 'en' ? t(sectionTranslationKeys[sectionNumber]) : (dbTitle || t(sectionTranslationKeys[sectionNumber]));
  const subtitle = getSetting(`product_section_${sectionNumber}_subtitle`, "");
  const categorySlug = getSetting(`product_section_${sectionNumber}_category`, "");
  const isEnabled = getSetting(`product_section_${sectionNumber}_enabled`, "true") === "true";
  const rawCount = parseInt(getSetting(`product_section_${sectionNumber}_count`, "10"), 10);
  const productCount = Number.isFinite(rawCount) && rawCount > 0 ? Math.min(rawCount, 50) : 10;

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["dynamic-products", sectionNumber, categorySlug],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(*)")
        .order("created_at", { ascending: false });

      if (categorySlug) {
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();

        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    enabled: isEnabled && !settingsLoading,
  });

  const list = Array.isArray(allProducts) ? allProducts : [];
  const products = list.slice(0, productCount);
  const hasMore = list.length > productCount;


  if (!isEnabled || settingsLoading) return null;

  if (productsLoading) {
    return (
      <section className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-4 w-[calc(100vw-40px)] left-1/2 -translate-x-1/2 relative">
      <div className="w-full">
        <div className="mb-[30px]">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-foreground/40" />
            <h2
              className="text-lg sm:text-2xl font-extrabold text-foreground leading-tight text-center whitespace-nowrap"
              style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
            >
              {title}
            </h2>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-foreground/40" />
          </div>
          {subtitle && (
            <p
              className="text-xs sm:text-sm text-muted-foreground mt-1.5 text-center line-clamp-1"
              style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
            >
              {subtitle}
            </p>
          )}
          {hasMore && (
            <div className="flex justify-center mt-2.5">
              <Link
                to={categorySlug ? `/products?category=${categorySlug}` : '/products'}
                className="text-xs sm:text-sm font-semibold text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors rounded-full px-4 py-1 inline-flex items-center gap-1 whitespace-nowrap"
                style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
              >
                {t('section.see_all')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamicProductSection;
