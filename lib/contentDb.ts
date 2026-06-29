/**
 * contentDb.ts — Supabase site_content tablosu için sunucu taraflı CRUD.
 * SADECE sunucu ortamında çalışır (API route'ları, Server Components).
 *
 * Cache tag: "site-content"
 * Yazma sonrası revalidateTag("site-content") çağrısı BURADAN DEĞİL,
 * ilgili API route'undan yapılır (Next.js server context gerektirir).
 */

import type { EditableContentKey } from "@/types/content";
import { defaultEditableContent } from "@/lib/defaultContent";

export const CONTENT_CACHE_TAG = "site-content";

export type DbSiteContent = {
  key:        string;
  content:    string;
  updated_by: string;
  updated_at: string;
};

// ── Supabase fetch ────────────────────────────────────────────────────────────

function getSupabase() {
  const url        = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !serviceKey) throw new Error("Supabase yapılandırması eksik.");
  return { url, serviceKey };
}

async function sbFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; nextOptions?: RequestInit["next"] } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { url, serviceKey } = getSupabase();
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type":  "application/json",
    "apikey":        serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    ...(options.headers ?? {}),
  };
  if (method !== "GET") headers["Prefer"] = "return=representation";

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      next: options.nextOptions,
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { /* ignore */ }
      return { data: null, error: msg };
    }
    if (!text) return { data: null, error: null };
    return { data: JSON.parse(text) as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ── Okuma ─────────────────────────────────────────────────────────────────────

/**
 * Tüm içerikleri getirir.
 * next.tags ile cache'lenir — revalidateTag("site-content") ile geçersiz kılınır.
 * revalidate: 3600 → 1 saatte bir otomatik yenilenir (backup).
 */
export async function getAllContent(): Promise<Record<string, string>> {
  const { data, error } = await sbFetch<DbSiteContent[]>(
    "site_content?select=key,content&order=key.asc",
    { nextOptions: { tags: [CONTENT_CACHE_TAG], revalidate: 3600 } }
  );

  if (error || !data) {
    // Supabase erişilemezse defaultlar döner (graceful fallback)
    console.warn("[contentDb] Supabase okunamadı, default içerik kullanılıyor:", error);
    return Object.fromEntries(defaultEditableContent.map(item => [item.key, item.content]));
  }

  // Supabase'den gelen değerleri default'larla birleştir
  // (DB'de olmayan key varsa default değer korunur)
  const fromDb = Object.fromEntries(data.map(row => [row.key, row.content]));
  const defaults = Object.fromEntries(defaultEditableContent.map(item => [item.key, item.content]));
  return { ...defaults, ...fromDb };
}

/**
 * Tek bir key'in içeriğini getirir.
 * Cache'lenmez — admin paneli için anlık okuma.
 */
export async function getContentByKey(key: EditableContentKey): Promise<{ content: string; updatedBy: string; updatedAt: string } | null> {
  const { data, error } = await sbFetch<DbSiteContent[]>(
    `site_content?key=eq.${encodeURIComponent(key)}&select=key,content,updated_by,updated_at&limit=1`
  );

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { content: row.content, updatedBy: row.updated_by, updatedAt: row.updated_at };
}

// ── Yazma ─────────────────────────────────────────────────────────────────────

/**
 * İçeriği günceller (UPSERT — key yoksa INSERT, varsa UPDATE).
 * Başarı sonrası çağıran API route'u revalidateTag("site-content") yapmalı.
 */
export async function updateContent(
  key: EditableContentKey,
  content: string,
  updatedBy: string
): Promise<{ error: string | null }> {
  const { error } = await sbFetch(
    `site_content?key=eq.${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body:   { content, updated_by: updatedBy, updated_at: new Date().toISOString() },
      headers: { "Prefer": "return=minimal" },
    }
  );
  return { error };
}

/**
 * İçeriği varsayılan değere döndürür.
 */
export async function resetContent(
  key: EditableContentKey,
  updatedBy: string
): Promise<{ error: string | null; defaultContent: string }> {
  const fallback = defaultEditableContent.find(item => item.key === key);
  const defaultValue = fallback?.content ?? "";
  const { error } = await updateContent(key, defaultValue, updatedBy);
  return { error, defaultContent: defaultValue };
}
