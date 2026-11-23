import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePixelTracking } from "@/hooks/usePixelTracking";

export default function TrackingContactLinks() {
  const { pathname } = useLocation();
  const { trackStandardEvent } = usePixelTracking();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const href = event.target.closest("a")?.href;
      if (!href) return;
      const url = new URL(href, window.location.href);
      if (url.protocol === "tel:" || ["wa.me", "api.whatsapp.com"].includes(url.hostname)) {
        trackStandardEvent("Contact");
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, trackStandardEvent]);
  return null;
}
