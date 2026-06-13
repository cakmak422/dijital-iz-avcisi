import { getAllNewsFromDb, getNewsBySlugFromDb } from "@/lib/newsDb";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import { getCachedRuntimeNewsBySlug, getCachedRuntimeNewsItems } from "@/lib/newsRuntimeStore";
import { getCyberNewsBySlug, getCyberNewsItems, type CyberNewsItem } from "@/lib/newsStore";

export type NewsReadSource = "merged";

export type NewsSourceBreakdown = {
  database: number;
  runtimeCache: number;
  seedFallback: number;
  total: number;
};

export type NewsReadResult = {
  items: CyberNewsItem[];
  source: NewsReadSource;
  dbEnabled: boolean;
  sourceBreakdown: NewsSourceBreakdown;
};

export type NewsDetailReadResult = {
  item?: CyberNewsItem;
  source: "database" | "runtime-cache" | "seed-fallback";
};

export async function getLatestNewsForPublic(limit = 30): Promise<NewsReadResult> {
  const result = await getMergedNewsForPublic();
  return {
    ...result,
    items: result.items.slice(0, limit)
  };
}

export async function getAllNewsForPublic(): Promise<NewsReadResult> {
  return getMergedNewsForPublic();
}

async function getMergedNewsForPublic(): Promise<NewsReadResult> {
  const dbResult = await getAllNewsFromDb();
  const cachedItems = await getCachedRuntimeNewsItems();
  const seedItems = getCyberNewsItems();
  const items = mergeUniqueNewsItems([...dbResult.items, ...cachedItems, ...seedItems]);

  return {
    items,
    source: "merged",
    dbEnabled: dbResult.usingDatabase,
    sourceBreakdown: {
      database: dbResult.items.length,
      runtimeCache: cachedItems.length,
      seedFallback: seedItems.length,
      total: items.length
    }
  };
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

function mergeUniqueNewsItems(items: CyberNewsItem[]) {
  const seen = new Set<string>();
  return items
    .map(normalizeNewsItem)
    .filter((item) => {
      const key = item.sourceUrl || item.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
