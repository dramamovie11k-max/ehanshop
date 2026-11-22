import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";

export interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const usePages = () => useQuery({
  queryKey: ["pages"],
  queryFn: () => apiFetch<PageData[]>("/pages"),
});

export const usePage = (slug: string) => useQuery({
  queryKey: ["page", slug],
  queryFn: () => apiFetch<PageData>(`/pages/${encodeURIComponent(slug)}`),
  enabled: !!slug,
  retry: false,
});

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (page: Partial<PageData>) => apiFetch<PageData>("/pages", {
      method: "POST", body: JSON.stringify(page),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); toast.success("পেজ তৈরি হয়েছে!"); },
    onError: (error: Error) => toast.error(error.message || "পেজ তৈরি করতে সমস্যা হয়েছে"),
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PageData> & { id: string }) => {
      return apiFetch<PageData>(`/pages/${encodeURIComponent(id)}`, {
        method: "PATCH", body: JSON.stringify(updates),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); toast.success("পেজ আপডেট হয়েছে!"); },
    onError: (error: Error) => toast.error(error.message || "আপডেট করতে সমস্যা হয়েছে"),
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/pages/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); toast.success("পেজ ডিলিট হয়েছে!"); },
    onError: (error: Error) => toast.error(error.message || "ডিলিট করতে সমস্যা হয়েছে"),
  });
};
