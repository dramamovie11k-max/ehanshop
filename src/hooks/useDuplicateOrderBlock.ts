import { useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api } from "@/integrations/cloudflare/client";

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
    digits = digits.slice(2);
  }
  if (digits.length === 10) {
    digits = "0" + digits;
  }
  return digits;
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
  const { getSetting, isLoading: loading } = useSiteSettings();
  const enabled = getSetting("duplicate_block_enabled") === "true";
  const blockTimeMinutes = parseInt(getSetting("duplicate_block_time"), 10) || defaultSettings.blockTimeMinutes;
  const message = getSetting("duplicate_block_message", defaultSettings.message);
  const whatsappNumber = getSetting("duplicate_block_whatsapp", defaultSettings.whatsappNumber);
  const settings = { enabled, blockTimeMinutes, message, whatsappNumber };

  const checkBlockStatus = useCallback(
    async (phone: string): Promise<BlockStatus> => {
      if (loading || !enabled) {
        return { isBlocked: false, remainingMinutes: 0, message: "", whatsappNumber: "" };
      }

      // 1. Check localStorage first (fastest - like WooCommerce cookie check)
      const localBlock = checkLocalStorageBlock();
      if (localBlock.isBlocked) {
        return {
          isBlocked: true,
          remainingMinutes: localBlock.remainingMinutes,
          message,
          whatsappNumber,
        };
      }

      const { data, error } = await api.rpc("duplicate_status", { phone: normalizePhoneNumber(phone) });
      if (error) throw error;
      if (data?.isBlocked) {
        saveOrderBlock(data.remainingMinutes);
        return data;
      }

      return { isBlocked: false, remainingMinutes: 0, message: "", whatsappNumber: "" };
    },
    [enabled, loading, message, whatsappNumber]
  );

  // Call after successful order to set localStorage block
  const markOrderPlaced = useCallback(() => {
    if (enabled) {
      saveOrderBlock(blockTimeMinutes);
    }
  }, [enabled, blockTimeMinutes]);

  return {
    settings,
    loading,
    checkBlockStatus,
    markOrderPlaced,
  };
};
