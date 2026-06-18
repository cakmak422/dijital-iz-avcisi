import type {
  ManagedBanner,
  ManagedImageFormat,
  ManagedPageKey,
  ManagedStatus
} from "@/types/pageManagement";
import type { AwarenessBannerScope } from "@/lib/awarenessBanners";

type AwarenessBannerRow = {
  alt_text: string | null;
  category: string | null;
  created_at: string | null;
  description: string | null;
  format: string | null;
  id: string;
  image_url: string;
  page_key: string | null;
  sort_order: number | null;
  status: string | null;
  title: string;
  updated_at: string | null;
};

export type AwarenessBannerDbResult = {
  error?: string;
  items: ManagedBanner[];
  status?: number;
  usingDatabase: boolean;
};

export type AwarenessBannerMutationResult = {
  error?: string;
  item?: ManagedBanner;
  status?: number;
  ok: boolean;
};

const requestTimeoutMs = 10000;
const pageKeys: ManagedPageKey[] = ["home", "about", "archive", "news", "query", "tools", "guides", "contact"];
const imageFormats: ManagedImageFormat[] = ["jpg", "jpeg", "png", "webp", "url"];
const statuses: ManagedStatus[] = ["active", "inactive"];

function getSupabaseBaseUrl() {
  return process.env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function isAwarenessSupabaseConfigured() {
  return Boolean(getSupabaseBaseUrl() && getSupabaseServiceRoleKey());
}

function getSupabaseHeaders(prefer?: string) {
  const key = getSupabaseServiceRoleKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

function toRestUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function readSupabaseError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return response.statusText || "Supabase isteği başarısız oldu.";

  try {
    const parsed = JSON.parse(text) as { message?: string; details?: string; hint?: string };
    return [parsed.message, parsed.details, parsed.hint].filter(Boolean).join(" | ");
  } catch {
    return text.slice(0, 500);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAwarenessBanners(scope: AwarenessBannerScope = "home"): Promise<AwarenessBannerDbResult> {
  if (!isAwarenessSupabaseConfigured()) {
    return { items: [], usingDatabase: false, error: "Supabase env değişkenleri tanımlı değil." };
  }

  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("status", "eq.active");
  params.set("order", "sort_order.asc,created_at.asc");
  if (scope !== "all") params.set("page_key", `eq.${scope}`);

  try {
    const response = await fetchWithTimeout(toRestUrl(`awareness_banners?${params.toString()}`), {
      headers: getSupabaseHeaders(),
      method: "GET"
    });

    if (!response.ok) {
      return {
        items: [],
        usingDatabase: true,
        status: response.status,
        error: await readSupabaseError(response)
      };
    }

    const rows = (await response.json()) as AwarenessBannerRow[];
    return {
      items: rows.map(fromDbRow).sort((first, second) => first.order - second.order),
      status: response.status,
      usingDatabase: true
    };
  } catch (error) {
    return {
      items: [],
      usingDatabase: true,
      error: error instanceof Error ? error.message : "Supabase afiş okuma isteği başarısız oldu."
    };
  }
}

export async function createAwarenessBanner(input: Partial<ManagedBanner>): Promise<AwarenessBannerMutationResult> {
  if (!isAwarenessSupabaseConfigured()) {
    return { ok: false, error: "Supabase env değişkenleri tanımlı değil." };
  }

  const payload = toDbPayload(input);
  if (!payload.title || !payload.image_url) {
    return { ok: false, status: 400, error: "Afiş başlığı ve görsel URL alanı zorunludur." };
  }

  try {
    const response = await fetchWithTimeout(toRestUrl("awareness_banners"), {
      body: JSON.stringify(payload),
      headers: getSupabaseHeaders("return=representation"),
      method: "POST"
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: await readSupabaseError(response) };
    }

    const rows = (await response.json()) as AwarenessBannerRow[];
    return { ok: true, item: rows[0] ? fromDbRow(rows[0]) : undefined, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Afiş oluşturma isteği başarısız oldu." };
  }
}

export async function updateAwarenessBanner(id: string, patch: Partial<ManagedBanner>): Promise<AwarenessBannerMutationResult> {
  if (!isAwarenessSupabaseConfigured()) {
    return { ok: false, error: "Supabase env değişkenleri tanımlı değil." };
  }

  const payload = toDbPayload(patch);
  if ("image_url" in payload && !payload.image_url) {
    return { ok: false, status: 400, error: "Görsel URL boş bırakılamaz." };
  }

  try {
    const response = await fetchWithTimeout(toRestUrl(`awareness_banners?id=eq.${encodeURIComponent(id)}`), {
      body: JSON.stringify(payload),
      headers: getSupabaseHeaders("return=representation"),
      method: "PATCH"
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: await readSupabaseError(response) };
    }

    const rows = (await response.json()) as AwarenessBannerRow[];
    return { ok: true, item: rows[0] ? fromDbRow(rows[0]) : undefined, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Afiş güncelleme isteği başarısız oldu." };
  }
}

export async function deactivateAwarenessBanner(id: string): Promise<AwarenessBannerMutationResult> {
  return updateAwarenessBanner(id, { status: "inactive" });
}

function toDbPayload(input: Partial<ManagedBanner>) {
  const payload: Record<string, string | number | null> = {};

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.category !== undefined) payload.category = input.category.trim();
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl.trim();
  if (input.altText !== undefined) payload.alt_text = input.altText.trim();
  if (input.format !== undefined) payload.format = input.format.toUpperCase();
  if (input.pageKey !== undefined) payload.page_key = input.pageKey;
  if (input.status !== undefined) payload.status = input.status;
  if (input.order !== undefined) payload.sort_order = input.order;

  return payload;
}

function fromDbRow(row: AwarenessBannerRow): ManagedBanner {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    altText: row.alt_text ?? "",
    category: row.category ?? "Farkındalık",
    imageUrl: row.image_url,
    format: coerceImageFormat(row.format),
    status: coerceStatus(row.status),
    order: typeof row.sort_order === "number" ? row.sort_order : 100,
    pageKey: coercePageKey(row.page_key)
  };
}

function coerceImageFormat(value: string | null): ManagedImageFormat {
  const normalized = (value ?? "png").toLocaleLowerCase("tr-TR");
  return imageFormats.includes(normalized as ManagedImageFormat) ? (normalized as ManagedImageFormat) : "png";
}

function coercePageKey(value: string | null): ManagedPageKey {
  return pageKeys.includes(value as ManagedPageKey) ? (value as ManagedPageKey) : "home";
}

function coerceStatus(value: string | null): ManagedStatus {
  return statuses.includes(value as ManagedStatus) ? (value as ManagedStatus) : "active";
}
