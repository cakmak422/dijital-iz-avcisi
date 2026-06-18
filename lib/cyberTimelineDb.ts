import {
  cyberArchiveEvents,
  type CyberArchiveEvent,
  type CyberArchiveSeverity,
  type CyberVisualTone
} from "@/lib/cyberArchive";

type CyberTimelineEventRow = {
  slug: string;
  title: string;
  date_label: string;
  month_day: string;
  year: string;
  category: string;
  threat_type: string;
  severity: string;
  summary: string;
  impact: string;
  details: string;
  affected_groups: string[] | null;
  recommendations: string[] | null;
  source_name: string;
  source_url: string;
  visual_tone: string;
  tags: string[] | null;
  status?: string | null;
  sort_order?: number | null;
};

export type CyberTimelineReadSource = "database" | "seed-fallback";

export type CyberTimelineReadResult = {
  events: CyberArchiveEvent[];
  source: CyberTimelineReadSource;
  usingDatabase: boolean;
  error?: string;
};

const timelineFallback: CyberTimelineReadResult = {
  events: cyberArchiveEvents,
  source: "seed-fallback",
  usingDatabase: false
};

export async function getCyberTimelineEventsForPublic(): Promise<CyberTimelineReadResult> {
  const rows = await fetchTimelineRows();
  if (!rows?.length) return timelineFallback;

  return {
    events: rows.map(fromTimelineRow),
    source: "database",
    usingDatabase: true
  };
}

export async function getTodayCyberTimelineEventForPublic(date = new Date()) {
  const result = await getCyberTimelineEventsForPublic();
  return {
    event: pickTodayTimelineEvent(result.events, date),
    source: result.source
  };
}

export function pickTodayTimelineEvent(events: CyberArchiveEvent[], date = new Date()) {
  if (!events.length) return cyberArchiveEvents[0];

  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const exactEvent = events.find((event) => event.monthDay === monthDay);
  if (exactEvent) return exactEvent;

  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return events[dayOfYear % events.length];
}

async function fetchTimelineRows(): Promise<CyberTimelineEventRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const response = await fetch(
      `${getSupabaseBaseUrl()}/rest/v1/cyber_timeline_events?select=*&status=eq.active&order=sort_order.asc,year.desc,month_day.asc`,
      {
        headers: getSupabaseHeaders(),
        cache: "no-store",
        signal: AbortSignal.timeout(3500)
      }
    );

    if (!response.ok) {
      console.error("supabase_cyber_timeline_read_failed", {
        status: response.status,
        error: await readSupabaseError(response)
      });
      return null;
    }

    const data = (await response.json()) as unknown;
    return Array.isArray(data) ? (data as CyberTimelineEventRow[]) : null;
  } catch (error) {
    console.error("supabase_cyber_timeline_read_exception", {
      error: error instanceof Error ? error.message : "Bilinmeyen timeline okuma hatasi"
    });
    return null;
  }
}

function fromTimelineRow(row: CyberTimelineEventRow): CyberArchiveEvent {
  return {
    slug: row.slug,
    title: row.title,
    dateLabel: row.date_label,
    monthDay: row.month_day,
    year: row.year,
    category: row.category,
    threatType: row.threat_type,
    severity: normalizeSeverity(row.severity),
    summary: row.summary,
    impact: row.impact,
    details: row.details,
    affectedGroups: Array.isArray(row.affected_groups) ? row.affected_groups : [],
    recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    visualTone: normalizeVisualTone(row.visual_tone),
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

function normalizeSeverity(value: string): CyberArchiveSeverity {
  if (value === "Kritik" || value === "Yüksek" || value === "Orta") return value;
  return "Orta";
}

function normalizeVisualTone(value: string): CyberVisualTone {
  const allowed: CyberVisualTone[] = ["infrastructure", "ransomware", "privacy", "worm", "darkweb", "sabotage", "breach"];
  return allowed.includes(value as CyberVisualTone) ? (value as CyberVisualTone) : "infrastructure";
}

function isSupabaseConfigured() {
  return Boolean(getSupabaseBaseUrl() && (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());
}

function getSupabaseBaseUrl() {
  const rawUrl = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.origin;
  } catch {
    console.error("supabase_url_invalid_for_cyber_timeline");
    return "";
  }
}

function getSupabaseHeaders() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
}

async function readSupabaseError(response: Response) {
  const raw = await response.text();
  if (!raw) return `${response.status} ${response.statusText}`;

  try {
    const parsed = JSON.parse(raw) as { message?: string; details?: string; hint?: string; code?: string };
    return [parsed.code, parsed.message, parsed.details, parsed.hint].filter(Boolean).join(" | ");
  } catch {
    return raw.slice(0, 600);
  }
}
