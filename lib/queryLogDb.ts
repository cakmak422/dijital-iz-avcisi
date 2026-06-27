/**
 * queryLogDb.ts — Supabase query_logs tablosu için sunucu taraflı CRUD.
 * SADECE sunucu ortamında çalışır (API route'ları).
 *
 * query_value saklama politikası:
 *   phishing / site / product  → HAM (URL, kişisel veri yok)
 *   ip / exif / message        → SHA-256 hash (kişisel/hassas olabilir)
 */

import crypto from "node:crypto";

// ── Tipler ────────────────────────────────────────────────────────────────────

export const QUERY_TYPES = ["product", "phishing", "site", "ip", "exif", "message"] as const;
export type QueryType = (typeof QUERY_TYPES)[number];

export const RISK_LEVELS = ["Düşük", "Orta", "Yüksek"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type QueryLogRow = {
  id:          string;
  query_type:  QueryType;
  query_value: string;
  risk_level:  RiskLevel | null;
  user_id:     string | null;
  created_at:  string;
};

export type DailyCount = {
  date:  string; // "YYYY-MM-DD"
  count: number;
};

export type QueryStats = {
  todayTotal:    number;
  riskyUrlCount: number;          // phishing|site + risk_level='Yüksek'
  last7Days:     DailyCount[];    // her zaman 7 eleman, eksik günler 0
  recentLogs:    QueryLogRow[];   // son 10 kayıt
};

// ── Sabitler ──────────────────────────────────────────────────────────────────

/** Ham saklanan query_type'lar — kişisel veri riski yok */
const RAW_TYPES = new Set<QueryType>(["phishing", "site", "product"]);

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sanitizeValue(type: QueryType, value: string): string {
  if (RAW_TYPES.has(type)) return value.slice(0, 500);
  return sha256(value.slice(0, 500));
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

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
  };
  if (method !== "GET") headers["Prefer"] = "return=representation";
  Object.assign(headers, options.headers ?? {});

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

// ── Insert ────────────────────────────────────────────────────────────────────

export async function insertQueryLog(
  type:      QueryType,
  value:     string,
  riskLevel: RiskLevel | null,
  userId?:   string | null
): Promise<{ error: string | null }> {
  const { error } = await sbFetch<unknown>("query_logs", {
    method: "POST",
    body: {
      query_type:  type,
      query_value: sanitizeValue(type, value),
      risk_level:  riskLevel ?? null,
      user_id:     userId ?? null,
    },
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getQueryStats(): Promise<QueryStats> {
  // Bugünün başlangıcı (UTC)
  const now       = new Date();
  const todayISO  = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const todayStart = `${todayISO}T00:00:00Z`;

  // Son 7 günün tarihlerini oluştur — sıfır-değerli hazır liste
  const days: DailyCount[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
  const sevenDaysAgo = `${days[0].date}T00:00:00Z`;

  // 4 sorguyu paralel çalıştır — biri başarısız olsa diğerleri devam eder
  const [totalRes, riskyRes, chartRes, recentRes] = await Promise.allSettled([
    // 1 — Bugünkü toplam
    sbFetch<Array<{ count: number }>>(
      `query_logs?select=count&created_at=gte.${todayStart}`,
      { headers: { "Prefer": "count=exact" } }
    ),
    // 2 — Riskli URL (phishing|site, Yüksek)
    sbFetch<Array<{ count: number }>>(
      `query_logs?select=count&query_type=in.(phishing,site)&risk_level=eq.Yüksek`,
      { headers: { "Prefer": "count=exact" } }
    ),
    // 3 — Son 7 gün günlük dağılım
    sbFetch<Array<{ created_at: string }>>(
      `query_logs?select=created_at&created_at=gte.${sevenDaysAgo}&order=created_at.asc&limit=5000`
    ),
    // 4 — Son 10 kayıt
    sbFetch<QueryLogRow[]>(
      `query_logs?select=id,query_type,query_value,risk_level,user_id,created_at&order=created_at.desc&limit=10`
    ),
  ]);

  // ── Bugünkü toplam ────────────────────────────────────────────────────────
  let todayTotal = 0;
  if (totalRes.status === "fulfilled" && !totalRes.value.error) {
    // Supabase count=exact → Content-Range header yerine select=count kullandık;
    // aslında count sonucu header'dan gelir, ama basit yaklaşım için
    // tüm today kayıtlarını saymak yerine RPC tercih edilebilir.
    // Şimdilik: select ile tüm bugünkü satır sayısını çekiyoruz.
    // Alternatif: limit=0 + Content-Range header parsing — fazla karmaşık.
    // Bu yaklaşım yerine count=exact ile head:true kullanacağız.
    todayTotal = 0; // aşağıda tekrar hesaplanıyor
  }

  // Daha güvenilir count: son 7 gün verisindekileri filtrele
  let chartData: Array<{ created_at: string }> = [];
  if (chartRes.status === "fulfilled" && !chartRes.value.error && chartRes.value.data) {
    chartData = chartRes.value.data;
  }

  // Günlük sayıları doldur
  for (const row of chartData) {
    const rowDate = row.created_at.slice(0, 10);
    const dayEntry = days.find(d => d.date === rowDate);
    if (dayEntry) dayEntry.count++;
    if (rowDate === todayISO) todayTotal++;
  }

  // ── Riskli URL ────────────────────────────────────────────────────────────
  let riskyUrlCount = 0;
  if (riskyRes.status === "fulfilled" && !riskyRes.value.error) {
    // count=exact ile header'dan okumak yerine tüm satırları çekip sayıyoruz (basitlik için)
    // Gerçek büyük veri için RPC veya HEAD + Content-Range kullanılmalı
    riskyUrlCount = 0; // placeholder — aşağıda doğrudan sorgu yapılacak
  }

  // Riskli URL için ayrı basit sorgu (limit=1000 yeterli)
  const riskyDirect = await sbFetch<QueryLogRow[]>(
    `query_logs?select=id&query_type=in.(phishing,site)&risk_level=eq.Yüksek&limit=1000`
  );
  if (!riskyDirect.error && riskyDirect.data) {
    riskyUrlCount = riskyDirect.data.length;
  }

  // ── Son kayıtlar ──────────────────────────────────────────────────────────
  let recentLogs: QueryLogRow[] = [];
  if (recentRes.status === "fulfilled" && !recentRes.value.error && recentRes.value.data) {
    recentLogs = recentRes.value.data;
  }

  return { todayTotal, riskyUrlCount, last7Days: days, recentLogs };
}
