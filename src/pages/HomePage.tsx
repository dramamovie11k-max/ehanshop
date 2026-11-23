import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getSiteMode } from '@/lib/siteMode';
import { parseHomeBannerConfig } from '@/lib/homeBanner';
import { imageSrcSet } from '@/lib/responsiveImage';

const LandingHome = lazy(() => import('./HomeSalesPage'));
const WebsiteHome = lazy(() => import('./WebsiteHome'));
const LoadingHome = () => <div role="status" aria-label="হোমপেজ লোড হচ্ছে" className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

export default function HomePage() {
  const { getSetting, isLoading } = useSiteSettings();
  if (isLoading) return <LoadingHome />;
  const mode = getSiteMode(getSetting('site_mode'));
  const [banner] = parseHomeBannerConfig(getSetting('home_banner_config'), getSetting('home_banner_image')).images;
  const bannerSources = banner
    ? imageSrcSet(banner)
    : undefined;
  const preloadedSources = document.querySelector('[data-home-banner-preload]')?.getAttribute('imagesrcset');
  return <>
    {bannerSources && bannerSources !== preloadedSources && <link rel="preload" as="image" imageSrcSet={bannerSources} imageSizes="100vw" />}
    <Suspense fallback={<LoadingHome />}>
      {mode === 'website' ? <WebsiteHome /> : <LandingHome />}
    </Suspense>
  </>;
}
