import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DuplicateBlockSettings {
  enabled: boolean;
  blockTimeMinutes: number;
  message: string;
  whatsappNumber: string;
}

interface BlockStatus {
  isBlocked: boolean;
  remainingMinutes: number;
  message: string;
  whatsappNumber: string;
}

const LOCAL_STORAGE_KEY = "last_order_block";
const IP_CACHE_KEY = "user_server_ip";

const defaultSettings: DuplicateBlockSettings = {
  enabled: false,
  blockTimeMinutes: 30,
  message: "আপনি ইতিমধ্যে একটি অর্ডার করেছেন। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।",
  whatsappNumber: "",
};

// Normalize phone number to standard 11-digit format
const normalizePhoneNumber = (phone: string): string => {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("88")) {
    digits = "0" + digits.slice(2);
  }
  if (digits.length === 10) {
    digits = "0" + digits;
  }
  return digits;
};

// Get user's IP via edge function (server-side detection like PHP REMOTE_ADDR)
const getUserIP = async (): Promise<string | null> => {
  try {
    // Check cache first (valid for 5 minutes)
    const cached = localStorage.getItem(IP_CACHE_KEY);
    if (cached) {
      const { ip, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000 && ip) {
        return ip;
      }
    }

    const { data, error } = await supabase.functions.invoke("get-client-ip");
    
    if (!error && data?.ip) {
      localStorage.setItem(IP_CACHE_KEY, JSON.stringify({ ip: data.ip, timestamp: Date.now() }));
      return data.ip;
    }
  } catch (error) {
    console.error("Error fetching IP via edge function:", error);
  }

  // Fallback: try ipify
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        localStorage.setItem(IP_CACHE_KEY, JSON.stringify({ ip: data.ip, timestamp: Date.now() }));
        return data.ip;
      }
    }
  } catch {
    console.error("Fallback IP fetch also failed");
  }

  return null;
};

// Save block info to localStorage after successful order (like WooCommerce cookie)
const saveOrderBlock = (blockTimeMinutes: number) => {
  const blockData = {
    timestamp: Date.now(),
    blockUntil: Date.now() + blockTimeMinutes * 60 * 1000,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(blockData));
};

// Check if blocked by localStorage (equivalent to WooCommerce cookie check)
const checkLocalStorageBlock = (): { isBlocked: boolean; remainingMinutes: number } => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return { isBlocked: false, remainingMinutes: 0 };

    const { blockUntil } = JSON.parse(stored);
    const now = Date.now();

    if (blockUntil > now) {
      const remainingMs = blockUntil - now;
      return { isBlocked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
    }

    // Expired, clean up
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  return { isBlocked: false, remainingMinutes: 0 };
};

export const useDuplicateOrderBlock = () => {
  const [settings, setSettings] = useState<DuplicateBlockSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_key, setting_value")
          .in("setting_key", [
            "duplicate_block_enabled",
            "duplicate_block_time",
            "duplicate_block_message",
            "duplicate_block_whatsapp",
          ]);

        if (!error && data) {
          const newSettings: DuplicateBlockSettings = { ...defaultSettings };
          data.forEach((item) => {
            switch (item.setting_key) {
              case "duplicate_block_enabled":
                newSettings.enabled = item.setting_value === "true";
                break;
              case "duplicate_block_time":
                newSettings.blockTimeMinutes = parseInt(item.setting_value || "30") || 30;
                break;
              case "duplicate_block_message":
                newSettings.message = item.setting_value || defaultSettings.message;
                break;
              case "duplicate_block_whatsapp":
                newSettings.whatsappNumber = item.setting_value || "";
                break;
            }
          });
          setSettings(newSettings);
        }
      } catch (error) {
        console.error("Error fetching duplicate block settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check if blocked by localStorage / phone / IP
  // Accepts optional pre-fetched IP to avoid duplicate calls
  const checkBlockStatus = useCallback(
    async (phone: string, preloadedIP?: string | null): Promise<BlockStatus> => {
      if (loading || !settings.enabled) {
        return { isBlocked: false, remainingMinutes: 0, message: "", whatsappNumber: "" };
      }

      // 1. Check localStorage first (fastest - like WooCommerce cookie check)
      const localBlock = checkLocalStorageBlock();
      if (localBlock.isBlocked) {
        return {
          isBlocked: true,
          remainingMinutes: localBlock.remainingMinutes,
          message: settings.message,
          whatsappNumber: settings.whatsappNumber,
        };
      }

      const blockTimeAgo = new Date(Date.now() - settings.blockTimeMinutes * 60 * 1000);

      // 2. Check by phone number in DB
      const normalizedPhone = normalizePhoneNumber(phone);
      if (normalizedPhone && normalizedPhone.length === 11) {
        try {
          const { data: recentOrders, error } = await supabase
            .from("orders")
            .select("created_at, status")
            .eq("customer_phone", normalizedPhone)
            .gte("created_at", blockTimeAgo.toISOString())
            .not("status", "eq", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1);

          if (!error && recentOrders && recentOrders.length > 0) {
            const lastOrderTime = new Date(recentOrders[0].created_at);
            const unblockTime = new Date(lastOrderTime.getTime() + settings.blockTimeMinutes * 60 * 1000);
            const now = new Date();

            if (unblockTime > now) {
              const remainingMs = unblockTime.getTime() - now.getTime();
              const remainingMinutes = Math.ceil(remainingMs / 60000);
              saveOrderBlock(remainingMinutes);
              return {
                isBlocked: true,
                remainingMinutes,
                message: settings.message,
                whatsappNumber: settings.whatsappNumber,
              };
            }
          }
        } catch (error) {
          console.error("Error checking phone block:", error);
        }
      }

      // 3. Check by IP address in DB (like WooCommerce transient check)
      // Use preloaded IP if available, otherwise fetch fresh
      try {
        const userIP = preloadedIP !== undefined ? preloadedIP : await getUserIP();
        if (userIP) {
          const { data: ipOrders, error } = await supabase
            .from("orders")
            .select("created_at, status")
            .eq("customer_ip", userIP)
            .gte("created_at", blockTimeAgo.toISOString())
            .not("status", "eq", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1);

          if (!error && ipOrders && ipOrders.length > 0) {
            const lastOrderTime = new Date(ipOrders[0].created_at);
            const unblockTime = new Date(lastOrderTime.getTime() + settings.blockTimeMinutes * 60 * 1000);
            const now = new Date();

            if (unblockTime > now) {
              const remainingMs = unblockTime.getTime() - now.getTime();
              const remainingMinutes = Math.ceil(remainingMs / 60000);
              saveOrderBlock(remainingMinutes);
              return {
                isBlocked: true,
                remainingMinutes,
                message: settings.message,
                whatsappNumber: settings.whatsappNumber,
              };
            }
          }
        }
      } catch (error) {
        console.error("Error checking IP block:", error);
      }

      return { isBlocked: false, remainingMinutes: 0, message: "", whatsappNumber: "" };
    },
    [settings, loading]
  );

  // Call after successful order to set localStorage block
  const markOrderPlaced = useCallback(() => {
    if (settings.enabled) {
      saveOrderBlock(settings.blockTimeMinutes);
    }
  }, [settings]);

  return {
    settings,
    loading,
    checkBlockStatus,
    markOrderPlaced,
    getUserIP,
  };
};
