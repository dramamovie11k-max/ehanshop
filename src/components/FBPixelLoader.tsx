import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  captureFbclid,
  getOrCreateExternalId,
  getPersistedUser,
  buildAdvancedMatching,
} from "@/lib/fbTracking";

declare global {
  interface Window {
    __fbPixelConfig?: { id: string; enabled: boolean };
  }
}

/**
 * Loads the Facebook Pixel base script when admin has configured a Pixel ID
 * and enabled direct Pixel tracking. Browser events still flow through
 * usePixelTracking, which calls fbq() in addition to dataLayer.push().
 */
const FBPixelLoader = () => {
  const { getSetting } = useSiteSettings();
  const pixelId = getSetting("fb_pixel_id", "").trim();
  const enabled = getSetting("fb_pixel_enabled", "false") === "true";

  useEffect(() => {
    window.__fbPixelConfig = { id: pixelId, enabled };
    if (!pixelId || !enabled) return;

    // Capture fbclid → _fbc cookie ASAP for high EMQ
    captureFbclid();
    const externalId = getOrCreateExternalId();

    if ((window as any).fbq) return;

    // Standard Meta Pixel base code
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    const am = buildAdvancedMatching(getPersistedUser(), externalId);
    (window as any).fbq("init", pixelId, am);
    (window as any).fbq("track", "PageView");

    // Re-init advanced matching when the persisted user is enriched
    const onUserUpdated = (e: any) => {
      try {
        const nextAm = buildAdvancedMatching(e?.detail || {}, externalId);
        (window as any).fbq?.("init", pixelId, nextAm);
      } catch {}
    };
    window.addEventListener("fb-user-updated", onUserUpdated);
    return () => window.removeEventListener("fb-user-updated", onUserUpdated);
  }, [pixelId, enabled]);

  return null;
};

export default FBPixelLoader;