/**
 * contactDb.ts — Supabase contact_messages tablosu için sunucu taraflı CRUD.
 * SADECE sunucu ortamında çalışır (API route'ları).
 */

export type DbContactMessage = {
  id:         string;
  name:       string;
  email:      string;
  topic:      string;
  message:    string;
  status:     "new" | "read" | "archived";
  created_at: string;
};

export type ContactMessageInput = {
  name:    string;
  email:   string;
  topic:   string;
  message: string;
};

function getSupabase() {
  const url        = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !serviceKey) throw new Error("Supabase yapılandırması eksik.");
  return { url, serviceKey };
}

async function sbFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
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
    const res  = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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

/** Yeni mesaj ekler (iletişim formu → herkese açık endpoint). */
export async function insertContactMessage(
  input: ContactMessageInput
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await sbFetch<DbContactMessage[]>("contact_messages", {
    method: "POST",
    body: {
      name:    input.name,
      email:   input.email,
      topic:   input.topic,
      message: input.message,
      status:  "new",
    },
  });
  if (error || !data || data.length === 0) return { id: null, error: error ?? "Kaydedilemedi." };
  return { id: data[0].id, error: null };
}

const MSG_COLUMNS = "id,name,email,topic,message,status,created_at";

/** Tüm mesajları getirir (admin-korumalı). */
export async function getAllContactMessages(): Promise<{ messages: DbContactMessage[]; error: string | null }> {
  const { data, error } = await sbFetch<DbContactMessage[]>(
    `contact_messages?select=${MSG_COLUMNS}&order=created_at.desc`
  );
  return { messages: data ?? [], error };
}

/** Son N mesajı getirir, archived hariç (dashboard özeti için). */
export async function getLatestContactMessages(limit = 3): Promise<DbContactMessage[]> {
  const { data } = await sbFetch<DbContactMessage[]>(
    `contact_messages?select=${MSG_COLUMNS}&status=neq.archived&order=created_at.desc&limit=${limit}`
  );
  return data ?? [];
}

/** Mesaj istatistikleri (dashboard). */
export async function getContactMessageStats(): Promise<{ total: number; new: number; read: number; archived: number }> {
  const { data } = await sbFetch<DbContactMessage[]>(
    `contact_messages?select=status`
  );
  const msgs = data ?? [];
  return {
    total:    msgs.length,
    new:      msgs.filter(m => m.status === "new").length,
    read:     msgs.filter(m => m.status === "read").length,
    archived: msgs.filter(m => m.status === "archived").length,
  };
}

/** Durum güncelleme (admin-korumalı PATCH). */
export async function updateContactMessageStatus(
  id: string,
  status: "new" | "read" | "archived"
): Promise<{ error: string | null }> {
  const { error } = await sbFetch(`contact_messages?id=eq.${encodeURIComponent(id)}`, {
    method:  "PATCH",
    body:    { status },
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}
