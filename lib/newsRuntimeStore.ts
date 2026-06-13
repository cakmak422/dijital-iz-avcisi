import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import {
  getCyberNewsBySlug,
  getCyberNewsItems,
  getLatestCyberNews,
  hasRealNewsImage,
  upsertUniqueNewsItems,
  type CyberNewsItem
} from "@/lib/newsStore";

const CACHE_FILE_PATH = path.join(process.cwd(), ".next", "cache", "dia-cyber-news-cache.json");
const MAX_CACHED_ITEMS = 60;

let memoryNewsItems: CyberNewsItem[] = [];
let cacheLoaded = false;

export type NewsRuntimeStoreResult = {
  items: CyberNewsItem[];
  persisted: number;
  usingRuntimeCache: boolean;
};

export async function persistRuntimeNewsItems(items: CyberNewsItem[]): Promise<NewsRuntimeStoreResult> {
  const validItems = upsertUniqueNewsItems(items.map(normalizeNewsItem)).filter((item) => item.sourceUrl && item.slug);
  if (!validItems.length) {
    return { items: await getCachedRuntimeNewsItems(), persisted: 0, usingRuntimeCache: true };
  }

  const existingItems = await getCachedRuntimeNewsItems();
  const mergedItems = mergeNewsItems(validItems, existingItems).slice(0, MAX_CACHED_ITEMS);
  memoryNewsItems = mergedItems;
  cacheLoaded = true;

  try {
    await mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true });
    await writeFile(CACHE_FILE_PATH, JSON.stringify({ items: mergedItems, updatedAt: new Date().toISOString() }), "utf8");
  } catch (error) {
    console.warn("news_runtime_cache_write_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen cache yazma hatası"
    });
  }

  return { items: mergedItems, persisted: validItems.length, usingRuntimeCache: true };
}

export async function getRuntimeNewsItems() {
  const cachedItems = await getCachedRuntimeNewsItems();
  return mergeNewsItems(cachedItems, getCyberNewsItems()).map(normalizeNewsItem);
}

export async function getCachedRuntimeNewsItems() {
  if (!cacheLoaded) {
    memoryNewsItems = await readCachedNewsItems();
    cacheLoaded = true;
  }

  return upsertUniqueNewsItems(memoryNewsItems.map(normalizeNewsItem));
}

export async function getLatestRuntimeNews(limit = 3) {
  if (!cacheLoaded && !memoryNewsItems.length) {
    const cachedItems = await getRuntimeNewsItems();
    if (cachedItems.length) return rankNewsForVisualFeed(cachedItems).slice(0, limit);
  }

  if (memoryNewsItems.length) {
    return rankNewsForVisualFeed(mergeNewsItems(memoryNewsItems, getCyberNewsItems())).slice(0, limit);
  }

  return getLatestCyberNews(limit);
}

export async function getLatestCachedRuntimeNews(limit = 3) {
  const cachedItems = await getCachedRuntimeNewsItems();
  return rankNewsForVisualFeed(cachedItems).slice(0, limit);
}

export async function getRuntimeNewsBySlug(slug: string) {
  const runtimeItems = await getRuntimeNewsItems();
  return runtimeItems.find((item) => item.slug === slug) ?? getCyberNewsBySlug(slug);
}

export async function getCachedRuntimeNewsBySlug(slug: string) {
  const runtimeItems = await getCachedRuntimeNewsItems();
  return runtimeItems.find((item) => item.slug === slug);
}

async function readCachedNewsItems() {
  try {
    const raw = await readFile(CACHE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    return upsertUniqueNewsItems(parsed.items.filter(isCyberNewsLike).map(normalizeNewsItem));
  } catch {
    return [];
  }
}

function mergeNewsItems(primaryItems: CyberNewsItem[], fallbackItems: CyberNewsItem[]) {
  const seen = new Set<string>();
  return [...primaryItems, ...fallbackItems]
    .filter((item) => {
      const key = item.sourceUrl || item.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function rankNewsForVisualFeed(items: CyberNewsItem[]) {
  return [...items].sort((a, b) => {
    const visualScore = Number(hasRealNewsImage(b)) - Number(hasRealNewsImage(a));
    if (visualScore !== 0) return visualScore;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

function isCyberNewsLike(value: unknown): value is CyberNewsItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CyberNewsItem> & { source_url?: unknown; source_name?: unknown };
  return Boolean(
    typeof item.title === "string" &&
      typeof item.slug === "string" &&
      (typeof item.sourceUrl === "string" || typeof item.source_url === "string") &&
      (typeof item.sourceName === "string" || typeof item.source_name === "string")
  );
}
