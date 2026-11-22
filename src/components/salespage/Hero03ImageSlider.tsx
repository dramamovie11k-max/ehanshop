import { imageSrcSet, imageVariant } from "@/lib/responsiveImage";
import { salesPlainText } from '@/lib/salesRichText';
import { renderSalesText } from '@/components/salespage/SalesRichText';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';

export default function Hero03ImageSlider({ images, title }: { images: string[]; title: string }) {
  const [sliderRef, slider] = useEmblaCarousel({ loop: images.length > 1 });
  const [active, setActive] = useState(0);
  const syncSelection = useCallback(() => setActive(slider?.selectedScrollSnap() ?? 0), [slider]);

  useEffect(() => {
    if (!slider) return;
    syncSelection();
    slider.on('select', syncSelection).on('reInit', syncSelection);
    return () => { slider.off('select', syncSelection).off('reInit', syncSelection); };
  }, [slider, syncSelection]);

  if (!images.length) return null;
  return <div className="sales-hero03-slider" role="region" aria-label="হিরোর ছবির স্লাইডার" aria-roledescription="carousel">
    <div className="sales-hero03-main" ref={sliderRef}>
      <div className="sales-hero03-slides">
        {renderSalesText(images.map((src, index) => <div className="sales-hero03-slide" key={`${src}-${index}`} role="group" aria-label={salesPlainText(`${index + 1} / ${images.length}`)} aria-roledescription="slide">
          <img src={imageVariant(src,960)} srcSet={imageSrcSet(src)} sizes="(min-width: 1024px) 50vw, 100vw" fetchPriority={index === 0 ? "high" : undefined} decoding="async" alt={salesPlainText(`${title} — ${index + 1}`)} loading={index === 0 ? 'eager' : 'lazy'} />
        </div>))}
      </div>
    </div>
    {renderSalesText(images.length > 1 && <div className="sales-hero03-thumbs" aria-label="পণ্যের ছবির স্লাইডার">
      {renderSalesText(images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" size="icon" type="button" className={index === active ? 'is-active' : ''} aria-label={salesPlainText(`ছবি ${index + 1}`)} aria-pressed={index === active} onClick={() => slider?.scrollTo(index)}><img src={imageVariant(src,384)} alt="" loading="lazy" decoding="async" /></Button>))}
    </div>)}
  </div>;
}