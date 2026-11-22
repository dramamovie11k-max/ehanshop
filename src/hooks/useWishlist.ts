import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/dataApi";

export interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  name?: string;
  name_bn?: string;
  price?: number;
  image_url?: string | null;
  slug?: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["wishlist", user?.id];

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchWishlist();
      return (Array.isArray(data) ? data : []) as WishlistItem[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => {
      if (!user) throw new Error("Must be logged in");
      return addToWishlist(productId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("উইশলিস্টে যোগ হয়েছে!"); },
    onError: () => toast.error("উইশলিস্টে যোগ করতে সমস্যা হয়েছে"),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => {
      if (!user) throw new Error("Must be logged in");
      return removeFromWishlist(productId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("উইশলিস্ট থেকে সরানো হয়েছে"); },
    onError: () => toast.error("উইশলিস্ট থেকে সরাতে সমস্যা হয়েছে"),
  });

  const isInWishlist = (productId: string) => wishlistItems.some((item) => item.product_id === productId);
  const toggleWishlist = (productId: string) => {
    if (!user) { toast.error("উইশলিস্ট ব্যবহার করতে লগইন করুন"); return; }
    if (isInWishlist(productId)) removeMutation.mutate(productId);
    else addMutation.mutate(productId);
  };

  return {
    wishlistItems, isLoading, isInWishlist, toggleWishlist,
    addToWishlist: addMutation.mutate, removeFromWishlist: removeMutation.mutate,
  };
};
