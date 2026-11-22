 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { fetchSiteSettings, saveSiteSettings } from "@/lib/dataApi";
 import { apiFetch } from "@/lib/apiClient";
 
 interface SiteSetting {
   id: string;
   setting_key: string;
   setting_value: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export const useSiteSettings = () => {
   const queryClient = useQueryClient();
 
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    // D1 প্রাইমারি, Lovable Cloud ফলব্যাক
    queryFn: async () => (await fetchSiteSettings()) as SiteSetting[],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const settings: SiteSetting[] = Array.isArray(data) ? data : [];

  const getSetting = (key: string, defaultValue: string = ""): string => {
    const setting = settings.find((s) => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

 
   const updateSettingMutation = useMutation({
     mutationFn: async ({ key, value }: { key: string; value: string }) => {
       // এক রিকোয়েস্টে সেভ — Cloudflare /api/settings (D1)
       await saveSiteSettings({ [key]: value });
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["site-settings"] });
     },
   });


    const updateSetting = (key: string, value: string) => {
      return updateSettingMutation.mutateAsync({ key, value });
    };

    const bulkUpdateSettings = async (settingsToUpdate: Record<string, string>) => {
      // এক রিকোয়েস্টে সব কী সেভ — প্রতি কী-তে আলাদা রাউন্ডট্রিপ নয়
      await saveSiteSettings(settingsToUpdate);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    };
 
   return {
     settings,
     isLoading,
     getSetting,
     updateSetting,
     bulkUpdateSettings,
     isUpdating: updateSettingMutation.isPending,
   };
 };