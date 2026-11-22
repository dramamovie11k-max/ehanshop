 import { useParams, useNavigate } from "react-router-dom";
 import { useSalesPage } from "@/hooks/useSalesPages";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Button } from "@/components/ui/button";
 
 // Template Components - Self-contained full page templates
 import Template01Organic from "@/components/salespage/templates/Template01Organic";
 import Template02Clothing from "@/components/salespage/templates/Template02Clothing";
import Template03Fashion from "@/components/salespage/templates/Template03Fashion";
import Template04Gadget from "@/components/salespage/templates/Template04Gadget";
import Template05Countdown from "@/components/salespage/templates/Template05Countdown";
import Template06Panjabi from "@/components/salespage/templates/Template06Panjabi";
import Template07Gadget from "@/components/salespage/templates/Template07Gadget";
import Template08Minimal from "@/components/salespage/templates/Template08Minimal";
import Template09SuperFood from "@/components/salespage/templates/Template09SuperFood";
import Template10SuperFood2 from "@/components/salespage/templates/Template10SuperFood2";
import Template11SuperFood3 from "@/components/salespage/templates/Template11SuperFood3";
import Template12Gadget3 from "@/components/salespage/templates/Template12Gadget3";
import Template13NaturalCard from "@/components/salespage/templates/Template13NaturalCard";
import Template14VideoOrganic from "@/components/salespage/templates/Template14VideoOrganic";
import Template15Universal from "@/components/salespage/templates/Template15Universal";

// Legacy Section Components (for backward compatibility)
 import HeroSection from "@/components/salespage/HeroSection";
 import VideoSection from "@/components/salespage/VideoSection";
 import GallerySection from "@/components/salespage/GallerySection";
 import FeaturesSection from "@/components/salespage/FeaturesSection";
 import ReviewsSection from "@/components/salespage/ReviewsSection";
 import ContactSection from "@/components/salespage/ContactSection";
 import CheckoutSection from "@/components/salespage/CheckoutSection";

const SalesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, error } = useSalesPage(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-12 w-full bg-gray-800" />
          <Skeleton className="h-64 w-full bg-gray-800" />
          <Skeleton className="h-32 w-full bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">পেজ পাওয়া যায়নি</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            হোমে ফিরুন
          </Button>
        </div>
      </div>
    );
  }

   // Render template based on template_id
   // New template system: Each template is a self-contained component
   const renderTemplate = () => {
     switch (page.template_id) {
       case 'template-01-organic':
       case 'nature-fresh': // Legacy support
         return <Template01Organic page={page} />;
       
       case 'template-02-clothing':
         return <Template02Clothing page={page} />;
      
      case 'template-03-fashion':
        return <Template03Fashion page={page} />;
       
       case 'template-04-gadget':
         return <Template04Gadget page={page} />;
 
        case 'template-05-countdown':
          return <Template05Countdown page={page} />;

        case 'template-06-panjabi':
          return <Template06Panjabi page={page} />;

        case 'template-07-gadget':
          return <Template07Gadget page={page} />;

        case 'template-08-minimal':
          return <Template08Minimal page={page} />;

        case 'template-09-superfood':
          return <Template09SuperFood page={page} />;

        case 'template-10-superfood2':
          return <Template10SuperFood2 page={page} />;

        case 'template-11-superfood3':
          return <Template11SuperFood3 page={page} />;

        case 'template-12-gadget3':
          return <Template12Gadget3 page={page} />;

          case 'template-13-natural-card':
           return <Template13NaturalCard page={page} />;

          case 'template-14-video-organic':
            return <Template14VideoOrganic page={page} />;

          case 'template-15-universal':
            return <Template15Universal page={page} />;

           // Default: Use legacy section-based rendering for old templates
         default:
           return <LegacySalesPageRenderer page={page} />;
     }
   };
 
   return renderTemplate();
 };
 
 // Legacy renderer for backward compatibility with old templates
 const LegacySalesPageRenderer = ({ page }: { page: ReturnType<typeof useSalesPage>['data'] }) => {
   if (!page) return null;
 
   const scrollToCheckout = () => {
     document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
   };
 
   return (
     <div className="min-h-screen">
       {/* Hero Section */}
       {page.show_hero_section && (
         <HeroSection page={page} onOrderClick={scrollToCheckout} />
       )}
 
       {/* Video Section - After Hero */}
       {page.show_video_section && page.video_url && (
         <VideoSection page={page} />
       )}
 
       {/* Gallery Section */}
       {page.show_gallery_section && (
         <GallerySection page={page} onOrderClick={scrollToCheckout} />
       )}
 
       {/* Features Section */}
       {page.show_features_section && <FeaturesSection page={page} />}
 
       {/* Reviews Section */}
       {page.show_reviews_section && <ReviewsSection page={page} />}
 
       {/* Contact Section */}
       {page.show_contact_section && <ContactSection page={page} />}
 
       {/* Checkout Section */}
       {page.show_checkout_section && <CheckoutSection page={page} />}
 
       {/* Footer */}
       <div
         className="py-8 text-center text-sm"
         style={{
           background: `linear-gradient(180deg, #0f172a, ${page.background_color})`,
           color: page.text_color,
         }}
       >
         <p className="opacity-60">© {new Date().getFullYear()} - সকল অধিকার সংরক্ষিত</p>
       </div>
     </div>
   );
};

export default SalesPage;
