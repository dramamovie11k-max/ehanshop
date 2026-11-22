// ============================================================
// স্টোরেজ ক্লায়েন্ট — Cloudflare R2 (/api/upload, /api/files)
// Supabase storage এর মতো ইন্টারফেস: from(bucket).upload/getPublicUrl/remove
// ============================================================

import { cfAuth } from "./auth";

/** আপলোড করা path → আসল URL (getPublicUrl সঠিক লিংক দিতে পারে) */
const urlCache = new Map<string, string>();

function publicUrlFor(bucket: string, path: string): string {
  const key = `${bucket}/${path}`.replace(/^\/+/, "");
  return urlCache.get(key) || `/api/files/${key}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await cfAuth.accessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class BucketApi {
  constructor(private bucket: string) {}

  async upload(path: string, file: File | Blob, _opts?: Record<string, unknown>) {
    const key = `${this.bucket}/${path}`.replace(/^\/+/, "");
    const form = new FormData();
    form.append("file", file as File, (file as File).name || path.split("/").pop() || "file");
    form.append("key", key);
    form.append("folder", this.bucket);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: await authHeaders(),
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: { message: body?.error || `আপলোড ব্যর্থ (${res.status})`, name: "StorageError" } };
      }
      const result = body?.data || body;
      if (result?.url) urlCache.set(key, result.url);
      return { data: { path, id: result?.key ?? key, fullPath: result?.key ?? key }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "আপলোড ব্যর্থ", name: "StorageError" },
      };
    }
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: publicUrlFor(this.bucket, path) } };
  }

  async remove(paths: string[]) {
    const errors: string[] = [];
    for (const p of paths) {
      const key = `${this.bucket}/${p}`.replace(/^\/+/, "");
      try {
        const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
          method: "DELETE",
          headers: await authHeaders(),
        });
        if (!res.ok) errors.push(p);
        else urlCache.delete(key);
      } catch {
        errors.push(p);
      }
    }
    return errors.length
      ? { data: null, error: { message: `মুছতে ব্যর্থ: ${errors.join(", ")}`, name: "StorageError" } }
      : { data: paths.map((p) => ({ name: p })), error: null };
  }
}

export const storage = {
  from: (bucket: string) => new BucketApi(bucket),
};
