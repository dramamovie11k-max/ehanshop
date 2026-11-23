import { lazy as reactLazy, type ComponentType } from "react";

// After a new version is published, old page files disappear. If loading one fails,
// reload once so the browser picks up the latest version instead of a blank screen.
export const lazyRoute = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
  reactLazy(async () => {
    const key = "chunk-reload-at";
    try {
      const mod = await factory();
      sessionStorage.removeItem(key);
      return mod;
    } catch (error) {
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
