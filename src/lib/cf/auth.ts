// ============================================================
// Cloudflare অথেনটিকেশন ক্লায়েন্ট
// /api/auth/* (Pages Functions + D1 + HS256 JWT) এর সাথে কথা বলে।
// Supabase auth এর মতো একই ইন্টারফেস দেয়, তাই UI কোড অপরিবর্তিত থাকে।
// ============================================================

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  role?: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
  name: string;
}

export type AuthChangeEvent =
  | "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED";

const STORAGE_KEY = "cf-auth-session";

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStored(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* প্রাইভেট মোডে স্টোরেজ না থাকলে উপেক্ষা */
  }
}

function authError(message: string, status?: number): AuthError {
  return { message, status, name: "AuthError" };
}

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: AuthError | null }> {
  try {
    const res = await fetch(`/api/auth/${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: authError(body?.error || `ত্রুটি (${res.status})`, res.status) };
    return { data: (body?.data ?? body) as T, error: null };
  } catch (err) {
    return { data: null, error: authError(err instanceof Error ? err.message : "নেটওয়ার্ক ত্রুটি") };
  }
}

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

class CfAuth {
  private session: Session | null = readStored();
  private listeners = new Set<Listener>();
  private refreshing: Promise<Session | null> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.scheduleRefresh();
      // অন্য ট্যাবে লগইন/লগআউট হলে সিঙ্ক
      window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEY) return;
        this.session = readStored();
        this.emit(this.session ? "SIGNED_IN" : "SIGNED_OUT");
      });
    }
  }

  /* ---------------- অভ্যন্তরীণ ---------------- */
  private emit(event: AuthChangeEvent) {
    for (const l of this.listeners) {
      try { l(event, this.session); } catch { /* লিসেনারের ত্রুটি উপেক্ষা */ }
    }
  }

  private setSession(session: Session | null, event: AuthChangeEvent) {
    this.session = session;
    writeStored(session);
    this.scheduleRefresh();
    this.emit(event);
  }

  private scheduleRefresh() {
    if (this.timer) clearTimeout(this.timer);
    if (!this.session?.expires_at) return;
    // মেয়াদ শেষের ১ মিনিট আগে রিফ্রেশ
    const ms = this.session.expires_at * 1000 - Date.now() - 60_000;
    this.timer = setTimeout(() => void this.refresh(), Math.max(ms, 5_000));
  }

  private expired(): boolean {
    return !!this.session && this.session.expires_at * 1000 - 30_000 < Date.now();
  }

  private async refresh(): Promise<Session | null> {
    if (!this.session?.refresh_token) return null;
    if (this.refreshing) return this.refreshing;

    const token = this.session.refresh_token;
    this.refreshing = call<Session>("refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: token }),
    }).then(({ data, error }) => {
      this.refreshing = null;
      if (error || !data) {
        this.setSession(null, "SIGNED_OUT");
        return null;
      }
      this.setSession(data, "TOKEN_REFRESHED");
      return data;
    });
    return this.refreshing;
  }

  /** বৈধ অ্যাকসেস টোকেন (দরকার হলে রিফ্রেশ করে) — অন্য মডিউল ব্যবহার করে */
  async accessToken(): Promise<string | null> {
    if (this.session && this.expired()) await this.refresh();
    return this.session?.access_token ?? null;
  }

  /* ---------------- পাবলিক API (Supabase-সদৃশ) ---------------- */
  async getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }> {
    if (this.session && this.expired()) await this.refresh();
    return { data: { session: this.session }, error: null };
  }

  async getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }> {
    const token = await this.accessToken();
    if (!token) return { data: { user: null }, error: null };
    const { data, error } = await call<{ user: User }>("me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error || !data?.user) {
      if (error?.status === 401) this.setSession(null, "SIGNED_OUT");
      return { data: { user: null }, error };
    }
    return { data: { user: data.user }, error: null };
  }

  onAuthStateChange(cb: Listener) {
    this.listeners.add(cb);
    // Supabase এর মতো শুরুতেই বর্তমান অবস্থা জানানো হয়
    setTimeout(() => cb("INITIAL_SESSION", this.session), 0);
    return {
      data: {
        subscription: {
          id: crypto.randomUUID(),
          unsubscribe: () => { this.listeners.delete(cb); },
        },
      },
    };
  }

  async signUp(credentials: {
    email: string;
    password: string;
    options?: { data?: Record<string, any>; emailRedirectTo?: string };
  }) {
    const { data, error } = await call<Session>("signup", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.options?.data?.full_name,
        phone: credentials.options?.data?.phone,
      }),
    });
    if (error || !data) return { data: { user: null, session: null }, error };
    this.setSession(data, "SIGNED_IN");
    return { data: { user: data.user, session: data }, error: null };
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    const { data, error } = await call<Session>("login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (error || !data) return { data: { user: null, session: null }, error };
    this.setSession(data, "SIGNED_IN");
    return { data: { user: data.user, session: data }, error: null };
  }

  async signOut() {
    const token = this.session?.refresh_token;
    this.setSession(null, "SIGNED_OUT");
    if (token) await call("logout", { method: "POST", body: JSON.stringify({ refresh_token: token }) });
    return { error: null as AuthError | null };
  }

  async updateUser(attrs: { email?: string; password?: string; data?: Record<string, any> }) {
    const token = await this.accessToken();
    if (!token) return { data: { user: null }, error: authError("লগইন প্রয়োজন", 401) };
    const { data, error } = await call<{ user: User }>("user", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: attrs.email,
        password: attrs.password,
        full_name: attrs.data?.full_name,
        phone: attrs.data?.phone,
      }),
    });
    if (error || !data) return { data: { user: null }, error };
    if (this.session) this.setSession({ ...this.session, user: data.user }, "USER_UPDATED");
    return { data: { user: data.user }, error: null };
  }

  /** পাসওয়ার্ড রিসেট রিকোয়েস্ট — টোকেন সহ লিংক তৈরি হয় */
  async resetPasswordForEmail(email: string, opts?: { redirectTo?: string }) {
    const { data, error } = await call<{ success: boolean; reset_token?: string; message?: string }>(
      "forgot-password",
      { method: "POST", body: JSON.stringify({ email, redirect_to: opts?.redirectTo }) },
    );
    return { data, error };
  }

  /** রিসেট টোকেন দিয়ে নতুন পাসওয়ার্ড সেট */
  async resetPasswordWithToken(token: string, password: string) {
    return call<{ success: boolean }>("reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }
}

export const cfAuth = new CfAuth();
