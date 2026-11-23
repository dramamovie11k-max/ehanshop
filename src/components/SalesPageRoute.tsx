import { Suspense, useEffect, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSalesPage } from "@/hooks/useSalesPages";
import { imageSrcSet, imageVariant, organicSalesHeroSizes } from "@/lib/responsiveImage";
import { lazyRoute } from "@/lib/lazyRoute";
import { preloadSalesPageTemplate } from "@/lib/salesPageTemplate";

const SalesPage = lazyRoute(() => import("@/pages/SalesPage"));

export default function SalesPageRoute({ homepageId, fallback }: { homepageId?: string; fallback?: ReactNode }) {
  const { slug } = useParams();
  const query = useSalesPage(homepageId ?? slug ?? "", homepageId ? "id" : "slug");
  const page = query.data;
  const templateId = page?.template_id;
  useEffect(() => {
    if (templateId) void preloadSalesPageTemplate(templateId).catch(() => {});
  }, [templateId]);
  const isOrganic = page?.template_id === "template-01-organic" || page?.template_id === "nature-fresh";
  const heroImage = isOrganic && page.show_hero_section && !page.template_styles?.hero?.design
    ? page.hero_images?.[0]
    : undefined;
  const sources = heroImage ? imageSrcSet(heroImage) : undefined;

  if (homepageId && !query.isLoading && (!page || query.error)) return fallback;

  const content = <>
    {heroImage && (sources
      ? <link rel="preload" as="image" imageSrcSet={sources} imageSizes={organicSalesHeroSizes} />
      : <link rel="preload" as="image" href={imageVariant(heroImage, 960)} />)}
    <Suspense fallback={<div className="min-h-screen grid place-items-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SalesPage data={page} isLoading={query.isLoading} error={query.error} />
    </Suspense>
  </>;
  return homepageId ? <div className="contents" data-sales-page-home>{content}</div> : content;
}
