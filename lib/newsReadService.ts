import { getAllNewsFromDb, getLatestNewsFromDb, getNewsBySlugFromDb } from "@/lib/newsDb";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import {
  getCachedRuntimeNewsBySlug,
  getCachedRuntimeNewsItems,
  getLatestCachedRuntimeNews
} from "@/lib/newsRuntimeStore";
import { getCyberNewsBySlug, getCyberNewsItems, getLatestCyberNews, type CyberNewsItem } from "@/lib/newsStore";

export type NewsReadSource = "database" | "runtime-cache" | "seed-fallback";

export type NewsReadResult = {
  items: CyberNewsItem[];
  source: NewsReadSource;
};

export type NewsDetailReadResult = {
  item?: CyberNewsItem;
  source: NewsReadSource;
};

export async function getLatestNewsForPublic(limit = 3): Promise<NewsReadResult> {
  const dbResult = await getLatestNewsFromDb(limit);
  if (dbResult.items.length) {
    return { items: dbResult.items.map(normalizeNewsItem), source: "database" };
  }

  const cachedItems = await getLatestCachedRuntimeNews(limit);
  if (cachedItems.length) {
    return { items: cachedItems.map(normalizeNewsItem), source: "runtime-cache" };
  }

  return { items: getLatestCyberNews(limit).map(normalizeNewsItem), source: "seed-fallback" };
}

export async function getAllNewsForPublic(): Promise<NewsReadResult> {
  const dbResult = await getAllNewsFromDb();
  if (dbResult.items.length) {
    return { items: dbResult.items.map(normalizeNewsItem), source: "database" };
  }

  const cachedItems = await getCachedRuntimeNewsItems();
  if (cachedItems.length) {
    return { items: cachedItems.map(normalizeNewsItem), source: "runtime-cache" };
  }

  return { items: getCyberNewsItems().map(normalizeNewsItem), source: "seed-fallback" };
}

export async function getNewsBySlugForPublic(slug: string): Promise<NewsDetailReadResult> {
  const dbResult = await getNewsBySlugFromDb(slug);
  if (dbResult.items[0]) {
    return { item: normalizeNewsItem(dbResult.items[0]), source: "database" };
  }

  const cachedItem = await getCachedRuntimeNewsBySlug(slug);
  if (cachedItem) {
    return { item: normalizeNewsItem(cachedItem), source: "runtime-cache" };
  }

  const seedItem = getCyberNewsBySlug(slug);
  return { item: seedItem ? normalizeNewsItem(seedItem) : undefined, source: "seed-fallback" };
}
