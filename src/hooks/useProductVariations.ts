import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductVariation } from "@/types";
import { apiFetch } from "@/lib/apiClient";

export const useProductVariations = (productId: string | null) => useQuery({
  queryKey: ["productVariations", productId],
  queryFn: () => productId
    ? apiFetch<ProductVariation[]>(`/variations?product_id=${encodeURIComponent(productId)}`)
    : Promise.resolve([]),
  enabled: !!productId,
});

export const useSaveVariations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variations, variationType }: {
      productId: string;
      variations: { variation_name: string; price: number; stock: number | null; is_default: boolean; image_url?: string | null; shipping_inside_dhaka?: number | null; shipping_outside_dhaka?: number | null; free_shipping?: boolean }[];
      variationType: string;
    }) => {
      await apiFetch(`/db`, {
        method: "POST",
        body: JSON.stringify({ table: "product_variations", action: "delete", filters: [{ op: "eq", column: "product_id", value: productId }], returning: false }),
      });
      if (variations.length) {
        // একবারেই সব ভ্যারিয়েশন ইনসার্ট (জেনেরিক রুট অ্যারে সাপোর্ট করে)
        await apiFetch(`/db`, {
          method: "POST",
          body: JSON.stringify({
            table: "product_variations",
            action: "insert",
            returning: false,
            values: variations.map((v, index) => ({
              product_id: productId, variation_type: variationType, variation_name: v.variation_name,
              price: v.price, stock: v.stock ?? 0, sort_order: index, is_default: v.is_default || index === 0,
              image_url: v.image_url ?? null, shipping_inside_dhaka: v.shipping_inside_dhaka ?? null,
              shipping_outside_dhaka: v.shipping_outside_dhaka ?? null, free_shipping: v.free_shipping ?? false,
            })),
          }),
        });
      }
      await apiFetch(`/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        body: JSON.stringify({ has_variations: variations.length > 0, variation_type: variations.length ? variationType : null }),
      });
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productVariations", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
    },
  });
};
