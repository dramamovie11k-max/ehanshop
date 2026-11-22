// Facebook tracking helpers — maximize Event Match Quality (EMQ)
// Persists user identifiers across sessions and surfaces them to both the
// browser-side Pixel (advanced matching) and the server-side CAPI.

const LS_USER = "__fb_user_v1";
const LS_EXT_ID = "__fb_external_id";

export interface FBUser {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  dateOfBirth?: string; // YYYYMMDD
  gender?: string; // 'm' | 'f'
  external_id?: string;
}

export const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : undefined;
};

const setCookie = (name: string, value: string, days = 90) => {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
};

// Capture fbclid from URL on landing → write _fbc cookie if missing
export const captureFbclid = () => {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (fbclid && !getCookie("_fbc")) {
      setCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`);
    }
  } catch {}
};

// Stable per-visitor external_id (uuid in localStorage)
export const getOrCreateExternalId = (): string => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(LS_EXT_ID);
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ||
      `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(LS_EXT_ID, id);
  }
  return id;
};

export const getPersistedUser = (): FBUser => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const persistUser = (u: Partial<FBUser>) => {
  if (typeof window === "undefined" || !u) return;
  const cur = getPersistedUser();
  const merged: FBUser = { ...cur };
  (Object.keys(u) as (keyof FBUser)[]).forEach((k) => {
    const v = u[k];
    if (v !== undefined && v !== null && v !== "") (merged as any)[k] = v;
  });
  localStorage.setItem(LS_USER, JSON.stringify(merged));
  // Notify pixel loader to refresh advanced matching
  try {
    window.dispatchEvent(new CustomEvent("fb-user-updated", { detail: merged }));
  } catch {}
};

const norm = (s?: string) =>
  s ? String(s).trim().toLowerCase() : undefined;

// Advanced matching object for fbq('init', id, am) — Meta hashes these client-side
export const buildAdvancedMatching = (u: FBUser, externalId: string) => {
  const am: Record<string, string> = {};
  if (u.email) am.em = norm(u.email)!;
  if (u.phone) am.ph = u.phone.replace(/\D/g, "");
  if (u.firstName) am.fn = norm(u.firstName)!;
  if (u.lastName) am.ln = norm(u.lastName)!;
  if (u.city) am.ct = norm(u.city)!.replace(/\s+/g, "");
  if (u.state) am.st = norm(u.state)!.replace(/\s+/g, "");
  if (u.postcode) am.zp = norm(u.postcode)!;
  if (u.country) am.country = norm(u.country)!.slice(0, 2);
  if (u.dateOfBirth) am.db = u.dateOfBirth.replace(/\D/g, "");
  if (u.gender) am.ge = norm(u.gender)!.slice(0, 1);
  if (externalId) am.external_id = externalId;
  return am;
};
