import { useState, useCallback, useEffect, memo, useMemo } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductMediaProps {
  imageUrl: string | null;
  videoUrl: string | null;
  images?: string[] | null;
  isNew?: boolean;
  discount?: number;
  showVideoFirst?: boolean;
}

// Helper function to extract YouTube video ID
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

type SlideItem = {
  type: "image" | "video";
  src: string;
  videoId?: string;
};

const ProductMedia = memo(({ 
  imageUrl, 
  videoUrl, 
  images = [], 
  isNew, 
  discount, 
  showVideoFirst = false 
}: ProductMediaProps) => {
  const { t } = useLanguage();
  const videoId = videoUrl ? getYoutubeVideoId(videoUrl) : null;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Memoize slides array to prevent unnecessary re-renders
  const allSlides = useMemo(() => {
    const slides: SlideItem[] = [];
    const galleryImages = images?.filter(img => img !== imageUrl) || [];
    const hasVideo = !!videoId;
    
    if (imageUrl) {
      slides.push({ type: "image", src: imageUrl });
    }
    
    if (hasVideo && videoId) {
      slides.push({ 
        type: "video", 
        src: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        videoId: videoId
      });
    }
    
    galleryImages.forEach(img => {
      slides.push({ type: "image", src: img });
    });
    
    return slides;
  }, [imageUrl, videoUrl, images, videoId]);

  const showThumbNav = allSlides.length > 5;

  // Embla Carousel for main display
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    dragFree: false,
  });

  // Embla Carousel for thumbnails
  const [thumbEmblaRef, thumbEmblaApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    
    if (thumbEmblaApi) {
      thumbEmblaApi.scrollTo(Math.max(0, index - 1));
    }
  }, [emblaApi, thumbEmblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollThumbPrev = useCallback(() => {
    if (thumbEmblaApi) thumbEmblaApi.scrollPrev();
  }, [thumbEmblaApi]);

  const scrollThumbNext = useCallback(() => {
    if (thumbEmblaApi) thumbEmblaApi.scrollNext();
  }, [thumbEmblaApi]);

  return (
    <div className="space-y-2 w-full max-w-full overflow-hidden">
      {/* Main Media Display - Full Width */}
      <div className="relative w-full">
        {allSlides.length > 0 ? (
          <div className="relative w-full">
            <div className="overflow-hidden rounded-xl w-full" ref={emblaRef}>
              <div className="flex">
                {allSlides.map((slide, idx) => (
                  <div 
                    key={idx} 
                    className="flex-[0_0_100%] min-w-0"
                  >
                    {slide.type === "video" && slide.videoId ? (
                      <div className="aspect-square bg-black flex items-center justify-center overflow-hidden w-full">
                        {/* Only load iframe when video slide is selected */}
                        {selectedIndex === idx ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${slide.videoId}?autoplay=0`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Product Video"
                            loading="lazy"
                          />
                        ) : (
                          <img
                            src={slide.src}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square bg-secondary/50 flex items-center justify-center overflow-hidden w-full">
                        <img
                          src={slide.src}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding={idx === 0 ? "sync" : "async"}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Inside Image */}
            {allSlides.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
                  onClick={scrollPrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
                  onClick={scrollNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Badges */}
            {isNew && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground z-10 text-xs">
                {t('card.new')}
              </Badge>
            )}
            {discount && discount > 0 && (
              <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground z-10 text-xs">
                {discount}{t('card.discount')}
              </Badge>
            )}

            {/* Dot Indicators */}
            {allSlides.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {allSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollTo(idx)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      idx === selectedIndex 
                        ? "bg-white w-3" 
                        : "bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden w-full">
            <span className="text-9xl">📦</span>
          </div>
        )}
      </div>

      {/* Thumbnails Row - With Carousel */}
      {allSlides.length > 1 && (
        <div className="relative w-full">
          {showThumbNav && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background shadow-sm"
              onClick={scrollThumbPrev}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}
          
          <div 
            className={cn(
              "overflow-hidden",
              showThumbNav && "mx-7"
            )}
            ref={thumbEmblaRef}
          >
            <div className="flex gap-1.5">
              {allSlides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-md overflow-hidden border-2 transition-colors relative",
                    selectedIndex === idx 
                      ? "border-primary" 
                      : "border-transparent hover:border-primary/50"
                  )}
                >
                  <img
                    src={slide.src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {slide.type === "video" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {showThumbNav && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background shadow-sm"
              onClick={scrollThumbNext}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

ProductMedia.displayName = "ProductMedia";

export default ProductMedia;