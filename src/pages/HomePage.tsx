import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getSiteMode } from '@/lib/siteMode';
import { getBannerImages, parseHomeBannerConfig, useMobileBanner } from '@/lib/homeBanner';
import { imageSrcSet } from '@/lib/responsiveImage';

const LandingHome = lazy(() => import('./HomeSalesPage'));
const WebsiteHome = lazy(() => import('./WebsiteHome'));
const LoadingHome = () => <div role="status" aria-label="হোমপেজ লোড হচ্ছে" className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

export default function HomePage() {
  const { getSetting, isLoading } = useSiteSettings();
  const mobile = useMobileBanner();
  if (isLoading) return <LoadingHome />;
  const config = parseHomeBannerConfig(getSetting('home_banner_config'), getSetting('home_banner_image'));
  const [banner] = getBannerImages(config, mobile);
  const bannerSources = banner ? imageSrcSet(banner) : undefined;
  return <>
    {bannerSources && <link rel="preload" as="image" imageSrcSet={bannerSources} imageSizes="100vw" />}
    <Suspense fallback={<LoadingHome />}>
      {getSiteMode(getSetting('site_mode')) === 'website' ? <WebsiteHome /> : <LandingHome />}
    </Suspense>
  </>;
}
