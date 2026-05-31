import {
  getCyberNewsBySlug,
  getCyberNewsItems,
  getLatestCyberNews,
  type CyberNewsItem,
  type CyberNewsRiskLevel
} from "@/lib/newsStore";

type CyberNewsDbRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  risk_note: string | null;
  public_advice: string[] | null;
  category: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
  fetched_at: string | null;
  risk_level: CyberNewsRiskLevel | null;
  created_at?: string | null;
};

export type NewsDbWriteResult = {
  inserted: number;
  skipped: number;
  failed: number;
  items: CyberNewsItem[];
  usingDatabase: boolean;
  errors: string[];
};

const fallbackResult: NewsDbWriteResult = {
  inserted: 0,
  skipped: 0,
  failed: 0,
  items: [],
  usingDatabase: false,
  errors: []
};

export async function getLatestNews(limit = 3): Promise<CyberNewsItem[]> {
  const rows = await fetchRows(`select=*&order=published_at.desc.nullslast,fetched_at.desc&limit=${limit}`);
  if (!rows) return getLatestCyberNews(limit);
  return rows.map(fromDbRow);
}

export async function getAllNews(): Promise<CyberNewsItem[]> {
  const rows = await fetchRows("select=*&order=published_at.desc.nullslast,fetched_at.desc");
  if (!rows) return getCyberNewsItems();
  return rows.map(fromDbRow);
}

export async function getNewsBySlug(slug: string): Promise<CyberNewsItem | undefined> {
  const rows = await fetchRows(`select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!rows) return getCyberNewsBySlug(slug);
  return rows[0] ? fromDbRow(rows[0]) : undefined;
}

export async function upsertNewsItems(items: CyberNewsItem[]): Promise<NewsDbWriteResult> {
  if (!items.length) return { ...fallbackResult, skipped: 0 };
  if (!isSupabaseConfigured()) return { ...fallbackResult, skipped: items.length };

  try {
    const batches = chunkItems(items, 10);
    const insertedItems: CyberNewsItem[] = [];
    const errors: string[] = [];
    let skipped = 0;
    let failed = 0;

    for (const batch of batches) {
      const batchResult = await upsertNewsBatch(batch);
      insertedItems.push(...batchResult.items);
      skipped += batchResult.skipped;
      failed += batchResult.failed;
      errors.push(...batchResult.errors);
    }

    return {
      inserted: insertedItems.length,
      skipped,
      failed,
      items: insertedItems,
      usingDatabase: true,
      errors: errors.slice(0, 5)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase insert hatasi";
    console.error("supabase_cyber_news_upsert_exception", {
      error: errorMessage,
      itemCount: items.length
    });
    return { ...fallbackResult, failed: items.length, errors: [errorMessage] };
  }
}

async function upsertNewsBatch(items: CyberNewsItem[]): Promise<NewsDbWriteResult> {
  try {
    const payload = items.map(toDbRow);
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?on_conflict=source_url`, {
      method: "POST",
      headers: getSupabaseHeaders("resolution=ignore-duplicates,return=representation"),
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      const errorMessage = await readSupabaseError(response);
      console.error("supabase_cyber_news_upsert_failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        itemCount: items.length,
        samplePayload: payload.slice(0, 2)
      });
      return { ...fallbackResult, failed: items.length, errors: [errorMessage].filter(Boolean).slice(0, 5) };
    }

    const insertedRows = (await response.json()) as CyberNewsDbRow[];
    const insertedItems = insertedRows.map(fromDbRow);
    return {
      inserted: insertedItems.length,
      skipped: Math.max(0, items.length - insertedItems.length),
      failed: 0,
      items: insertedItems,
      usingDatabase: true,
      errors: []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase insert hatasi";
    console.error("supabase_cyber_news_batch_exception", {
      error: errorMessage,
      itemCount: items.length
    });
    return { ...fallbackResult, failed: items.length, errors: [errorMessage] };
  }
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function fetchRows(query: string): Promise<CyberNewsDbRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?${query}`, {
      headers: getSupabaseHeaders(),
      cache: "no-store"
    });
    if (!response.ok) return null;
    return (await response.json()) as CyberNewsDbRow[];
  } catch {
    return null;
  }
}

function getSupabaseBaseUrl() {
  return (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
}

function getSupabaseHeaders(prefer?: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

function toDbRow(item: CyberNewsItem) {
  return {
    // id bilerek gonderilmez; Supabase/PostgreSQL gen_random_uuid() uretir.
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    risk_note: item.riskNote,
    public_advice: item.publicAdvice,
    category: item.category,
    source_name: item.sourceName,
    source_url: item.sourceUrl,
    image_url: item.imageUrl ?? null,
    published_at: toTimestamp(item.publishedAt),
    fetched_at: toTimestamp(item.fetchedAt) ?? new Date().toISOString(),
    risk_level: item.riskLevel
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

function fromDbRow(row: CyberNewsDbRow): CyberNewsItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    riskNote: row.risk_note ?? "",
    publicAdvice: Array.isArray(row.public_advice) ? row.public_advice : [],
    category: row.category ?? "Siber GÃ¼ndem",
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    imageUrl: row.image_url ?? "/news-fallback-cyber.svg",
    publishedAt: toDateLabel(row.published_at ?? row.fetched_at),
    fetchedAt: row.fetched_at ?? new Date().toISOString(),
    riskLevel: row.risk_level ?? "Orta"
  };
}

function toTimestamp(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toDateLabel(value: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
