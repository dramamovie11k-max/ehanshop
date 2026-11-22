import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "user";

export const useStaffAccess = () => {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // রোল সার্ভার থেকেই যাচাই হয় (JWT + D1) — টেবিল পড়ার অনুমতির উপর নির্ভর নয়
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      const role = (data?.user as { role?: AppRole } | undefined)?.role;
      return role && role !== "user" ? role : null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator";
  const isStaff = isAdmin || isModerator;

  return {
    userRole,
    isAdmin,
    isModerator,
    isStaff,
    isLoading,
  };
};
