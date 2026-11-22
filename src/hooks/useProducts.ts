import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProduct, fetchProducts } from "@/lib/dataApi";
import { Product, Category } from "@/types";

export const useProducts = (options?: { featured?: boolean; limit?: number; categorySlug?: string }) => {
  return useQuery({
    queryKey: ["products", options],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const data = await fetchProducts({
        featured: options?.featured,
        limit: options?.limit,
        category: options?.categorySlug,
      });
      return (Array.isArray(data) ? data : []) as Product[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const data = await fetchProduct(slug);
      if (!data) throw new Error("প্রোডাক্ট পাওয়া যায়নি");
      return data as Product;
    },
    enabled: !!slug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const data = await fetchCategories();
      return (Array.isArray(data) ? data : []) as Category[];
    },
  });
};

