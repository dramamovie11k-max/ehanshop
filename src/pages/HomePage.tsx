import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import SalesPageRoute from '@/components/SalesPageRoute';
import { getSiteMode, salesHomepageSetting } from '@/lib/siteMode';
import { getBannerImages, parseHomeBannerConfig, useMobileBanner } from '@/lib/homeBanner';
import { imageSrcSet } from '@/lib/responsiveImage';

const LandingHome = lazy(() => import('./HomeSalesPage'));
const WebsiteHome = lazy(() => import('./WebsiteHome'));
const LoadingHome = () => <div role="status" aria-label="হোমপেজ লোড হচ্ছে" className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

export default function HomePage() {
  const { getSetting, isLoading } = useSiteSettings();
  const mobile = useMobileBanner();
  if (isLoading) return <LoadingHome />;
  const mode = getSiteMode(getSetting('site_mode'));
  const homepageId = mode === 'landing' ? getSetting(salesHomepageSetting).trim() : '';
  const config = parseHomeBannerConfig(getSetting('home_banner_config'), getSetting('home_banner_image'));
  const [banner] = getBannerImages(config, mobile);
  const bannerSources = banner ? imageSrcSet(banner) : undefined;
  const storefront = <>
    {bannerSources && <link rel="preload" as="image" imageSrcSet={bannerSources} imageSizes="100vw" />}
    <Suspense fallback={<LoadingHome />}>
      {mode === 'website' ? <WebsiteHome /> : <LandingHome />}
    </Suspense>
  </>;
  return homepageId ? <SalesPageRoute homepageId={homepageId} fallback={storefront} /> : storefront;
}
