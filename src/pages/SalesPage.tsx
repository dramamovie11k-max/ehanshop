import "@/components/salespage/salespage.css";
import { Suspense } from "react";
import { salesPageTemplate } from "@/lib/salesPageTemplate";
import { useNavigate } from "react-router-dom";
import type { useSalesPage } from "@/hooks/useSalesPages";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Button } from "@/components/ui/button";
import { pageWithAvailableDesigns } from "@/lib/salesSectionDesignAvailability";
import { withCustomSectionOrder } from '@/lib/salesCustomSections';
 
import SalesPageEngagementTracker from "@/components/salespage/SalesPageEngagementTracker";


type SalesPageQuery = Pick<ReturnType<typeof useSalesPage>, "data" | "isLoading" | "error">;

const SalesPage = ({ data: page, isLoading, error }: SalesPageQuery) => {
  const navigate = useNavigate();

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

   return <SalesPageContent page={page} />;
 };

type LoadedSalesPage = NonNullable<ReturnType<typeof useSalesPage>['data']>;

export const SalesPageContent = ({ page: rawPage }: { page: LoadedSalesPage }) => {
   const Template = salesPageTemplate(rawPage.template_id);
   const page = withCustomSectionOrder(pageWithAvailableDesigns(rawPage));
 
   return (
     <>
       <SalesPageEngagementTracker page={rawPage} />
       <Suspense fallback={<div className="min-h-screen p-4" role="status" aria-label="পেজ লোড হচ্ছে"><Skeleton className="h-64 max-w-3xl mx-auto" /></div>}><Template page={page} /></Suspense>
     </>
   );
 };
 

export default SalesPage;
