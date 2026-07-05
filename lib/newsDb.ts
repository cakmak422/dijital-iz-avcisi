import {
  getCyberNewsBySlug,
  getCyberNewsItems,
  getLatestCyberNews,
  type CyberNewsItem,
  type CyberNewsImageSource,
  type CyberNewsRiskLevel
} from "@/lib/newsStore";

type CyberNewsDbRow = {
  id: string;
  title: string;
  title_tr?: string | null;
  original_title?: string | null;
  original_url?: string | null;
  slug: string;
  summary: string;
  summary_short_tr?: string | null;
  summary_long_tr?: string | null;
  risk_note: string | null;
  why_it_matters_tr?: string | null;
  public_advice: string[] | null;
  affected_groups_tr?: string[] | null;
  recommendations_tr?: string[] | null;
  technical_signals_tr?: string[] | null;
  category: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  image_source: CyberNewsImageSource | null;
  image_checked_at: string | null;
  image_alt_tr: string | null;
  fetch_image_failure_reason?: string | null;
  published_at: string | null;
  fetched_at: string | null;
  risk_level: CyberNewsRiskLevel | null;
  severity?: CyberNewsRiskLevel | null;
  fallback_visual_type?: CyberNewsItem["fallbackVisualType"] | null;
  is_featured?: boolean | null;
  is_archived?: boolean | null;
  tags?: string[] | null;
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

export type NewsDbReadResult = {
  items: CyberNewsItem[];
  usingDatabase: boolean;
};

export type NewsDbDebugState = {
  supabaseUrlPresent: boolean;
  supabaseServiceRolePresent: boolean;
  dbReadOk: boolean | null;
  dbReadStatus: number | null;
  dbReadError: string | null;
  dbWriteOk: boolean | null;
  dbWriteStatus: number | null;
  dbWriteError: string | null;
};

const dbOperationDebugState = {
  dbReadOk: null as boolean | null,
  dbReadStatus: null as number | null,
  dbReadError: null as string | null,
  dbWriteOk: null as boolean | null,
  dbWriteStatus: null as number | null,
  dbWriteError: null as string | null
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

export async function getLatestNewsFromDb(limit = 3): Promise<NewsDbReadResult> {
  const rows = await fetchRows(`select=*&order=published_at.desc.nullslast,fetched_at.desc&limit=${limit}`);
  return {
    items: rows ? rows.map(fromDbRow) : [],
    usingDatabase: Boolean(rows)
  };
}

export async function getAllNews(): Promise<CyberNewsItem[]> {
  const rows = await fetchRows("select=*&order=published_at.desc.nullslast,fetched_at.desc");
  if (!rows) return getCyberNewsItems();
  return rows.map(fromDbRow);
}

export async function getAllNewsFromDb(): Promise<NewsDbReadResult> {
  const rows = await fetchRows("select=*&order=published_at.desc.nullslast,fetched_at.desc");
  return {
    items: rows ? rows.map(fromDbRow) : [],
    usingDatabase: Boolean(rows)
  };
}

export async function getNewsBySlug(slug: string): Promise<CyberNewsItem | undefined> {
  const rows = await fetchRows(`select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!rows) return getCyberNewsBySlug(slug);
  return rows[0] ? fromDbRow(rows[0]) : undefined;
}

export async function getNewsBySlugFromDb(slug: string): Promise<NewsDbReadResult> {
  const rows = await fetchRows(`select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return {
    items: rows && rows[0] ? [fromDbRow(rows[0])] : [],
    usingDatabase: Boolean(rows)
  };
}

export function getNewsDbDebugState(): NewsDbDebugState {
  return {
    supabaseUrlPresent: Boolean((process.env.SUPABASE_URL ?? "").trim()),
    supabaseServiceRolePresent: Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()),
    ...dbOperationDebugState
  };
}

export async function upsertNewsItems(items: CyberNewsItem[]): Promise<NewsDbWriteResult> {
  if (!items.length) {
    setDbWriteDebug(true, null, null);
    return { ...fallbackResult, skipped: 0 };
  }
  if (!isSupabaseConfigured()) {
    const errorMessage = getSupabaseConfigurationError();
    setDbWriteDebug(false, null, errorMessage);
    return { ...fallbackResult, skipped: items.length, errors: [errorMessage] };
  }

  try {
    // DB'ye karşı slug dedup — aynı slug DB'de FARKLI bir source_url ile
    // zaten varsa (ör. Google News yönlendirme URL'si değişmiş, başlık
    // aynı kalmış) bu item'ı hiç yazma listesine sokmadan ele; aksi halde
    // slug unique constraint'i (23505) ile tüm batch düşer.
    const existingSlugMap = await fetchExistingSlugSourceMap(items.map((item) => item.slug));
    let dedupBySlugCount = 0;
    const itemsToWrite = items.filter((item) => {
      const existingSourceUrl = existingSlugMap.get(item.slug);
      if (existingSourceUrl && existingSourceUrl !== item.sourceUrl) {
        dedupBySlugCount += 1;
        return false;
      }
      return true;
    });

    console.log("news_db_upsert_dedup", { dedup_by_slug: dedupBySlugCount, checked: items.length });

    const batches = chunkItems(itemsToWrite, 10);
    const insertedItems: CyberNewsItem[] = [];
    const errors: string[] = [];
    let skipped = dedupBySlugCount;
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
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase insert hatası";
    setDbWriteDebug(false, null, errorMessage);
    console.error("supabase_cyber_news_upsert_exception", {
      error: errorMessage,
      itemCount: items.length
    });
    return { ...fallbackResult, failed: items.length, errors: [errorMessage] };
  }
}

async function fetchExistingSlugSourceMap(slugs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueSlugs = Array.from(new Set(slugs)).filter(Boolean);
  if (!uniqueSlugs.length || !isSupabaseConfigured()) return map;

  try {
    const query = `slug=in.(${uniqueSlugs.map((slug) => encodeURIComponent(slug)).join(",")})&select=slug,source_url`;
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?${query}`, {
      headers: getSupabaseHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return map;

    const rows = (await response.json()) as Array<{ slug: string; source_url: string }>;
    for (const row of rows) map.set(row.slug, row.source_url);
    return map;
  } catch (error) {
    // Sorgu başarısız olursa dedup katmanı atlanır (fail-open) — akış kırılmasın,
    // en kötü ihtimalle eski davranış (batch izolasyonu yine devrede) geçerli olur.
    console.warn("supabase_cyber_news_slug_lookup_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
    return map;
  }
}

function isDuplicateKeyError(errorMessage: string) {
  const normalized = errorMessage.toLocaleLowerCase("en-US");
  return normalized.includes("23505") || normalized.includes("duplicate key value violates unique constraint");
}

async function upsertNewsItemsIndividually(items: CyberNewsItem[]): Promise<NewsDbWriteResult> {
  const insertedItems: CyberNewsItem[] = [];
  const errors: string[] = [];
  let failed = 0;

  for (const item of items) {
    try {
      const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?on_conflict=source_url`, {
        method: "POST",
        headers: getSupabaseHeaders("resolution=merge-duplicates,return=representation"),
        body: JSON.stringify([toDbRow(item, true)]),
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errorMessage = await readSupabaseError(response);
        failed += 1;
        errors.push(errorMessage);
        console.error("supabase_cyber_news_item_upsert_failed", {
          slug: item.slug,
          sourceUrl: item.sourceUrl,
          status: response.status,
          error: errorMessage
        });
        continue;
      }

      const insertedRows = (await response.json()) as CyberNewsDbRow[];
      insertedItems.push(...insertedRows.map(fromDbRow));
    } catch (error) {
      failed += 1;
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase tekil insert hatası";
      errors.push(errorMessage);
      console.error("supabase_cyber_news_item_upsert_exception", {
        slug: item.slug,
        sourceUrl: item.sourceUrl,
        error: errorMessage
      });
    }
  }

  setDbWriteDebug(failed === 0, null, failed > 0 ? (errors[0] ?? null) : null);
  return {
    inserted: insertedItems.length,
    skipped: 0,
    failed,
    items: insertedItems,
    usingDatabase: true,
    errors: errors.slice(0, 5)
  };
}

async function upsertNewsBatch(items: CyberNewsItem[]): Promise<NewsDbWriteResult> {
  try {
    const payload = items.map((item) => toDbRow(item, true));
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?on_conflict=source_url`, {
      method: "POST",
      headers: getSupabaseHeaders("resolution=merge-duplicates,return=representation"),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errorMessage = await readSupabaseError(response);
      if (isExtendedNewsSchemaMissing(errorMessage)) {
        console.warn("supabase_cyber_news_extended_schema_missing", {
          error: errorMessage,
          itemCount: items.length
        });
        return upsertNewsBatchWithLegacyPayload(items, errorMessage);
      }

      if (isDuplicateKeyError(errorMessage)) {
        // Batch tek POST'la atomik yazıldığı için tek çakışma tüm batch'i
        // düşürür — item item tekrar deneyerek masum kayıtları kurtarıyoruz.
        console.warn("supabase_cyber_news_batch_duplicate_key_isolate", {
          error: errorMessage,
          itemCount: items.length
        });
        return upsertNewsItemsIndividually(items);
      }

      setDbWriteDebug(false, response.status, errorMessage);
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
    setDbWriteDebug(true, response.status, null);
    return {
      inserted: insertedItems.length,
      skipped: Math.max(0, items.length - insertedItems.length),
      failed: 0,
      items: insertedItems,
      usingDatabase: true,
      errors: []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase insert hatası";
    setDbWriteDebug(false, null, errorMessage);
    console.error("supabase_cyber_news_batch_exception", {
      error: errorMessage,
      itemCount: items.length
    });
    return { ...fallbackResult, failed: items.length, errors: [errorMessage] };
  }
}

async function upsertNewsBatchWithLegacyPayload(items: CyberNewsItem[], originalError: string): Promise<NewsDbWriteResult> {
  try {
    const payload = items.map((item) => toDbRow(item, false));
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?on_conflict=source_url`, {
      method: "POST",
      headers: getSupabaseHeaders("resolution=merge-duplicates,return=representation"),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errorMessage = await readSupabaseError(response);
      setDbWriteDebug(false, response.status, errorMessage);
      return { ...fallbackResult, failed: items.length, errors: [originalError, errorMessage].filter(Boolean).slice(0, 5) };
    }

    const insertedRows = (await response.json()) as CyberNewsDbRow[];
    const insertedItems = insertedRows.map(fromDbRow);
    setDbWriteDebug(true, response.status, null);
    return {
      inserted: insertedItems.length,
      skipped: Math.max(0, items.length - insertedItems.length),
      failed: 0,
      items: insertedItems,
      usingDatabase: true,
      errors: [`Turkce haber kolonlari migration bekliyor: ${originalError}`].slice(0, 5)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase legacy insert hatasi";
    setDbWriteDebug(false, null, errorMessage);
    return { ...fallbackResult, failed: items.length, errors: [originalError, errorMessage].filter(Boolean).slice(0, 5) };
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
  return Boolean(getSupabaseBaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function fetchRows(query: string): Promise<CyberNewsDbRow[] | null> {
  if (!isSupabaseConfigured()) {
    setDbReadDebug(false, null, getSupabaseConfigurationError());
    return null;
  }

  try {
    const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/cyber_news?${query}`, {
      headers: getSupabaseHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok) {
      const errorMessage = await readSupabaseError(response);
      setDbReadDebug(false, response.status, errorMessage);
      return null;
    }
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      setDbReadDebug(false, response.status, "Supabase response array formatinda degil.");
      return null;
    }
    setDbReadDebug(true, response.status, null);
    return data as CyberNewsDbRow[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Supabase okuma hatasi";
    setDbReadDebug(false, null, errorMessage);
    console.error("supabase_cyber_news_read_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen Supabase okuma hatası"
    });
    return null;
  }
}

function setDbReadDebug(ok: boolean, status: number | null, error: string | null) {
  dbOperationDebugState.dbReadOk = ok;
  dbOperationDebugState.dbReadStatus = status;
  dbOperationDebugState.dbReadError = sanitizeDbDebugError(error);
}

function setDbWriteDebug(ok: boolean, status: number | null, error: string | null) {
  dbOperationDebugState.dbWriteOk = ok;
  dbOperationDebugState.dbWriteStatus = status;
  dbOperationDebugState.dbWriteError = sanitizeDbDebugError(error);
}

function sanitizeDbDebugError(error: string | null) {
  if (!error) return null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return (serviceKey ? error.replace(serviceKey, "[redacted]") : error).slice(0, 600);
}

function getSupabaseConfigurationError() {
  if (!(process.env.SUPABASE_URL ?? "").trim()) return "SUPABASE_URL tanimli degil.";
  if (!getSupabaseBaseUrl()) return "SUPABASE_URL gecerli http/https URL formatinda degil.";
  if (!(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()) return "SUPABASE_SERVICE_ROLE_KEY tanimli degil.";
  return "Supabase konfigrasyonu tamamlanamadi.";
}

function getSupabaseBaseUrl() {
  const rawUrl = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.origin;
  } catch {
    console.error("supabase_url_invalid");
    return "";
  }
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

function toDbRow(item: CyberNewsItem, includeExtendedFields: boolean) {
  const baseRow = {
    // id bilerek gönderilmez; Supabase/PostgreSQL gen_random_uuid() üretir.
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    risk_note: item.riskNote,
    public_advice: item.publicAdvice,
    category: item.category,
    source_name: item.sourceName,
    source_url: item.sourceUrl,
    image_url: item.imageUrl ?? null,
    image_source: item.imageSource ?? null,
    image_checked_at: toTimestamp(item.imageCheckedAt),
    image_alt_tr: item.imageAltTr ?? null,
    published_at: toTimestamp(item.publishedAt),
    fetched_at: toTimestamp(item.fetchedAt) ?? new Date().toISOString(),
    risk_level: item.riskLevel
  };

  if (!includeExtendedFields) return baseRow;

  return {
    ...baseRow,
    title_tr: item.titleTr ?? item.title,
    original_title: item.originalTitle ?? item.title,
    original_url: item.originalUrl ?? item.sourceUrl,
    summary_short_tr: item.summaryShortTr ?? item.summary,
    summary_long_tr: item.summaryLongTr ?? item.summary,
    why_it_matters_tr: item.whyItMattersTr ?? item.riskNote,
    affected_groups_tr: item.affectedGroupsTr ?? [],
    recommendations_tr: item.recommendationsTr ?? item.publicAdvice ?? [],
    technical_signals_tr: item.technicalSignalsTr ?? [],
    severity: item.severity ?? item.riskLevel,
    fallback_visual_type: item.fallbackVisualType ?? null,
    is_featured: Boolean(item.isFeatured),
    is_archived: Boolean(item.isArchived),
    tags: item.tags ?? [],
    fetch_image_failure_reason: item.fetchImageFailureReason ?? null
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
    titleTr: row.title_tr ?? row.title,
    originalTitle: row.original_title ?? row.title,
    originalUrl: row.original_url ?? row.source_url,
    slug: row.slug,
    summary: row.summary,
    summaryShortTr: row.summary_short_tr ?? row.summary,
    summaryLongTr: row.summary_long_tr ?? row.summary,
    riskNote: row.risk_note ?? "",
    whyItMattersTr: row.why_it_matters_tr ?? undefined,
    affectedGroupsTr: Array.isArray(row.affected_groups_tr) ? row.affected_groups_tr : [],
    recommendationsTr: Array.isArray(row.recommendations_tr) ? row.recommendations_tr : [],
    technicalSignalsTr: Array.isArray(row.technical_signals_tr) ? row.technical_signals_tr : [],
    publicAdvice: Array.isArray(row.public_advice) ? row.public_advice : [],
    category: row.category ?? "Siber Gündem",
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    imageUrl: row.image_url ?? "/news-fallback-cyber.svg",
    imageSource: row.image_source ?? (row.image_url ? "og" : "fallback"),
    imageCheckedAt: row.image_checked_at ?? undefined,
    imageAltTr: row.image_alt_tr ?? undefined,
    fetchImageFailureReason: row.fetch_image_failure_reason ?? undefined,
    publishedAt: toDateLabel(row.published_at ?? row.fetched_at),
    fetchedAt: row.fetched_at ?? new Date().toISOString(),
    riskLevel: row.risk_level ?? "Orta",
    severity: row.severity ?? row.risk_level ?? "Orta",
    fallbackVisualType: row.fallback_visual_type ?? undefined,
    isFeatured: Boolean(row.is_featured),
    isArchived: Boolean(row.is_archived),
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

function isExtendedNewsSchemaMissing(errorMessage: string) {
  const normalized = errorMessage.toLocaleLowerCase("en-US");
  return (
    normalized.includes("pgrst204") &&
    [
      "title_tr",
      "original_title",
      "summary_short_tr",
      "summary_long_tr",
      "why_it_matters_tr",
      "affected_groups_tr",
      "recommendations_tr",
      "technical_signals_tr",
      "fallback_visual_type",
      "fetch_image_failure_reason"
    ].some((columnName) => normalized.includes(columnName))
  );
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
