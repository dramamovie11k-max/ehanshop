import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api } from "@/integrations/cloudflare/client";
import {
  captureFbclid,
  getOrCreateExternalId,
  getPersistedUser,
  buildAdvancedMatching,
  getCookie,
  ensureFbp,
} from "@/lib/fbTracking";

declare global {
  interface Window {
    __fbPixelConfig?: { id: string; enabled: boolean };
  }
}

const skipPageView = (path: string) => path.startsWith("/admin") || path === "/reset-password";

/**
 * Loads the Meta Pixel base script when admin configured a Pixel ID and enabled it.
 * Fires PageView on every route change — browser (fbq) and server (Conversions API)
 * with the same event_id so Meta deduplicates them.
 */
const FBPixelLoader = () => {
  const { getSetting } = useSiteSettings();
  const pixelId = getSetting("fb_pixel_id", "").trim();
  const enabled = getSetting("fb_pixel_enabled", "false") === "true";
  const location = useLocation();
  const initializedPixels = useRef(new Set<string>());
  const lastTracked = useRef<string>("");

  // Load base script + init (once)
  useEffect(() => {
    window.__fbPixelConfig = { id: pixelId, enabled };
    if (!pixelId || !enabled) return;

    captureFbclid();
    const externalId = getOrCreateExternalId();

    if (!(window as any).fbq) {
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
    }
    if (!initializedPixels.current.has(pixelId)) {
      (window as any).fbq("init", pixelId, buildAdvancedMatching(getPersistedUser(), externalId));
      initializedPixels.current.add(pixelId);
    }

    const onUserUpdated = (e: any) => {
      try {
        (window as any).fbq?.("init", pixelId, buildAdvancedMatching(e?.detail || {}, externalId));
      } catch {}
    };
    window.addEventListener("fb-user-updated", onUserUpdated);
    return () => window.removeEventListener("fb-user-updated", onUserUpdated);
  }, [pixelId, enabled]);

  // PageView on every route (browser + server, deduped by event_id)
  useEffect(() => {
    if (!pixelId || !enabled || skipPageView(location.pathname)) return;
    const key = JSON.stringify([pixelId, location.key, location.pathname, location.search]);
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const eventId = crypto.randomUUID();
    try {
      (window as any).fbq?.("trackSingle", pixelId, "PageView", {}, { eventID: eventId });
    } catch {}

    const sourceUrl = window.location.href;
    const u = getPersistedUser();
    api.functions
      .invoke("fb-conversions-api", {
        keepalive: true,
        body: {
          event_name: "PageView",
          event_id: eventId,
          event_source_url: sourceUrl,
          user_data: {
            email: u.email,
            phone: u.phone,
            first_name: u.firstName,
            last_name: u.lastName,
            city: u.city,
            country: u.country || "BD",
            external_id: getOrCreateExternalId(),
            client_user_agent: navigator.userAgent,
            fbp: ensureFbp(),
            fbc: getCookie("_fbc"),
          },
          custom_data: {},
        },
      })
      .then(({ error }) => { if (error) console.warn("[Meta CAPI] PageView delivery failed"); });
  }, [pixelId, enabled, location.pathname, location.search, location.key]);

  return null;
};

export default FBPixelLoader;
