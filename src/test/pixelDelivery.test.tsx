import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Link, MemoryRouter } from "react-router-dom";
import FBPixelLoader from "@/components/FBPixelLoader";
import TikTokPixelLoader from "@/components/TikTokPixelLoader";
import { usePixelTracking } from "@/hooks/usePixelTracking";

const invoke = vi.hoisted(() => vi.fn(async (_name: string, _options: { body: Record<string, unknown> }) => ({ error: null })));
vi.mock("@/integrations/cloudflare/client", () => ({ api: { functions: { invoke } } }));
vi.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => ({
    getSetting: (key: string) => ({
      fb_pixel_enabled: "true", fb_pixel_id: "123456", tiktok_pixel_enabled: "true", tiktok_pixel_id: "TIKTOK123",
    })[key] || "",
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("uses the same ID in the browser SDK and server API on SPA navigation and search", () => {
  const meta = vi.fn();
  const tiktokTrack = vi.fn();
  vi.stubGlobal("fbq", meta);
  vi.stubGlobal("ttq", { load: vi.fn(), track: tiktokTrack });
  const SearchButton = () => {
    const { trackStandardEvent } = usePixelTracking();
    return <button onClick={() => trackStandardEvent("Search", { search_string: "Shoes" })}>Search</button>;
  };
  render(<MemoryRouter><FBPixelLoader /><TikTokPixelLoader /><Link to="/products">Products</Link><SearchButton /></MemoryRouter>);
  fireEvent.click(screen.getByRole("link", { name: "Products" }));
  fireEvent.click(screen.getByRole("button", { name: "Search" }));

  const metaCalls = meta.mock.calls.filter(([command]) => command === "trackSingle");
  expect(metaCalls.map(call => call[2])).toEqual(["PageView", "PageView", "Search"]);
  expect(tiktokTrack.mock.calls.map(call => call[0])).toEqual(["Pageview", "Pageview", "Search"]);
  expect(invoke.mock.calls.filter(([name]) => name === "fb-conversions-api").map(([, options]) => options.body.event_id)).toEqual(metaCalls.map(call => call[4].eventID));
  expect(invoke.mock.calls.filter(([name]) => name === "tiktok-events-api").map(([, options]) => options.body.event_id)).toEqual(tiktokTrack.mock.calls.map(call => call[2].event_id));
});
