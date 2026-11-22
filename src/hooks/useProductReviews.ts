import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductReview } from "@/types";
import { apiFetch } from "@/lib/apiClient";

export const useProductReviews = (productId: string) => useQuery({
  queryKey: ["product-reviews", productId],
  queryFn: async () => {
    const data = await apiFetch<ProductReview[]>(`/reviews?product_id=${encodeURIComponent(productId)}`);
    return Array.isArray(data) ? data : [];
  },
  enabled: !!productId,
});

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { product_id: string; customer_name: string; customer_phone?: string; rating: number; review_text?: string }) =>
      apiFetch<ProductReview>("/reviews", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["product-reviews", variables.product_id] }),
  });
};

export const useAdminReviews = () => useQuery({
  queryKey: ["admin-reviews"],
  queryFn: () => apiFetch<ProductReview[]>("/reviews"),
});

export const useApproveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => apiFetch(`/reviews/${encodeURIComponent(reviewId)}`, { method: "PATCH", body: JSON.stringify({ is_approved: true }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); queryClient.invalidateQueries({ queryKey: ["product-reviews"] }); },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => apiFetch(`/reviews/${encodeURIComponent(reviewId)}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); queryClient.invalidateQueries({ queryKey: ["product-reviews"] }); },
  });
};
