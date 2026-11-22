import { useQuery } from "@tanstack/react-query";
import { cf } from "@/lib/cf/client";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await cf
        .rpc("has_role", { _user_id: user.id, _role: "admin" });

      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!user,
  });

  return { isAdmin, isLoading };
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const stats = await apiFetch<any>("/admin/stats");
      return {
        totalOrders: Number(stats?.totalOrders ?? 0),
        totalProducts: Number(stats?.totalProducts ?? 0),
        pendingOrders: Number(stats?.pendingOrders ?? 0),
        blockedUsers: Number(stats?.blockedUsers ?? 0),
        todayRevenue: Number(stats?.todayRevenue ?? 0),
        weekRevenue: Number(stats?.weekRevenue ?? 0),
        monthRevenue: Number(stats?.monthRevenue ?? 0),
        todayOrders: Number(stats?.todayOrders ?? 0),
        weekOrders: Number(stats?.weekOrders ?? 0),
        monthOrders: Number(stats?.monthOrders ?? 0),
      };
    },
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => apiFetch<any[]>("/orders"),
  });
};

export const useAdminProducts = () => {
  return useQuery({
    queryKey: ["adminProducts"],
    queryFn: () => apiFetch<any[]>("/products?limit=200"),
  });
};

export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ["blockedUsers"],
    queryFn: () => apiFetch<any[]>("/blocked-users"),
  });
};

export const useAbandonedCarts = () => {
  return useQuery({
    queryKey: ["abandonedCarts"],
    queryFn: () => apiFetch<any[]>("/abandoned-carts"),
  });
};
