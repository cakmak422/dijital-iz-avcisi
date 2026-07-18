// Haber hattı izleme/uyarı mekanizması için basit throttle deposu.
// Tek satır (alert_key='news_fetch') tutan bir Supabase tablosu —
// aynı sorunun her cron turunda tekrar e-posta üretmesini engeller.
//
// Gerekli tablo (manuel oluşturulmalı, bkz. proje notları):
//   create table if not exists public.system_alerts (
//     alert_key text primary key,
//     last_sent_at timestamptz not null,
//     last_reasons text
//   );

const ALERT_KEY = "news_fetch";
const THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 saat

export type AlertThrottleState = {
  shouldSend: boolean;
  lastSentAt: string | null;
};

export async function checkNewsFetchAlertThrottle(): Promise<AlertThrottleState> {
  const supabaseUrl = getSupabaseBaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !serviceKey) {
    // Supabase yoksa throttle kontrolü yapılamaz — yine de fail-open
    // (gönder), sessizce alarm kaybolmasın.
    return { shouldSend: true, lastSentAt: null };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_alerts?alert_key=eq.${ALERT_KEY}&select=last_sent_at&limit=1`,
      {
        headers: supabaseHeaders(serviceKey),
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }
    );
    if (!response.ok) return { shouldSend: true, lastSentAt: null };

    const rows = (await response.json()) as Array<{ last_sent_at: string }>;
    const lastSentAt = rows[0]?.last_sent_at ?? null;
    if (!lastSentAt) return { shouldSend: true, lastSentAt: null };

    const elapsed = Date.now() - new Date(lastSentAt).getTime();
    return { shouldSend: elapsed >= THROTTLE_MS, lastSentAt };
  } catch (error) {
    console.warn("news_fetch_alert_throttle_check_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
    return { shouldSend: true, lastSentAt: null };
  }
}

export async function recordNewsFetchAlertSent(reasons: string[]): Promise<void> {
  const supabaseUrl = getSupabaseBaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !serviceKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/system_alerts?on_conflict=alert_key`, {
      method: "POST",
      headers: { ...supabaseHeaders(serviceKey), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        alert_key: ALERT_KEY,
        last_sent_at: new Date().toISOString(),
        last_reasons: reasons.join(", ")
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000)
    });
  } catch (error) {
    console.warn("news_fetch_alert_record_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  }
}

function getSupabaseBaseUrl() {
  const rawUrl = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

function supabaseHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
}
