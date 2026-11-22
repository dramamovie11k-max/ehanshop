import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";
import { Product, ProductVariation } from "@/types";
import { toast } from "sonner";

interface LocalCartItem {
  product: Product;
  quantity: number;
  variation?: ProductVariation;
}

interface CartContextType {
  cartItems: LocalCartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, variation?: ProductVariation, skipDrawer?: boolean) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  loading: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load cart from localStorage or database
  useEffect(() => {
    if (user) {
      loadCartFromDB();
    } else {
      loadCartFromLocal();
    }
  }, [user]);

  const loadCartFromLocal = () => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  };

  const saveCartToLocal = (items: LocalCartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const loadCartFromDB = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await apiFetch<any[]>("/cart");
      const items: LocalCartItem[] = (Array.isArray(data) ? data : [])
        .filter((item: any) => item?.product_id && item?.name_bn)
        .map((item: any) => ({
          product: {
            ...item,
            id: item.product_id,
            price: item.price,
            image_url: item.image_url,
            slug: item.slug,
          } as Product,
          quantity: Number(item.quantity) || 1,
          variation: item.variation_id
            ? { id: item.variation_id, variation_name: item.variation_name, price: item.variation_price } as ProductVariation
            : undefined,
        }));
      setCartItems(items);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncToDatabase = async (items: LocalCartItem[]) => {
    if (!user) return;
    try {
      await apiFetch("/cart", { method: "DELETE" });
      await Promise.all(items.map((item) => apiFetch("/cart", {
        method: "POST",
        body: JSON.stringify({
          product_id: item.product.id,
          quantity: item.quantity,
          variation_id: item.variation?.id ?? null,
          variation_name: item.variation?.variation_name ?? null,
        }),
      })));
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  };


  const addToCart = (product: Product, quantity = 1, variation?: ProductVariation, skipDrawer = false) => {
    setCartItems((prev) => {
      // For variable products, match by product ID + variation ID
      const existing = prev.find((item) => 
        item.product.id === product.id && 
        (variation ? item.variation?.id === variation.id : !item.variation)
      );
      let newItems: LocalCartItem[];
      
      if (existing) {
        newItems = prev.map((item) =>
          item.product.id === product.id && 
          (variation ? item.variation?.id === variation.id : !item.variation)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...prev, { product, quantity, variation }];
      }

      if (user) {
        syncToDatabase(newItems);
      } else {
        saveCartToLocal(newItems);
      }

      if (!skipDrawer) {
        const lang = localStorage.getItem('language') || 'bn';
        toast.success(lang === 'en' ? 'Added to cart!' : 'কার্টে যোগ হয়েছে!');
        // Auto-open cart drawer only if not skipping
        setIsDrawerOpen(true);
      }
      return newItems;
    });
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCartItems((prev) => {
      const newItems = prev.filter((item) => 
        !(item.product.id === productId && 
          (variationId ? item.variation?.id === variationId : !item.variation))
      );
      
      if (user) {
        syncToDatabase(newItems);
      } else {
        saveCartToLocal(newItems);
      }

      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number, variationId?: string) => {
    if (quantity < 1) {
      removeFromCart(productId, variationId);
      return;
    }

    setCartItems((prev) => {
      const newItems = prev.map((item) =>
        item.product.id === productId && 
        (variationId ? item.variation?.id === variationId : !item.variation)
          ? { ...item, quantity } 
          : item
      );

      if (user) {
        syncToDatabase(newItems);
      } else {
        saveCartToLocal(newItems);
      }

      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      void apiFetch("/cart", { method: "DELETE" });
    } else {
      localStorage.removeItem("cart");
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => {
      const price = item.variation?.price ?? item.product.price;
      return acc + price * item.quantity;
    },
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loading,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
