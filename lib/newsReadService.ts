import { getAllNewsFromDb, getNewsBySlugFromDb, getPagedNewsFromDb } from "@/lib/newsDb";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import { getCachedRuntimeNewsBySlug, getCachedRuntimeNewsItems } from "@/lib/newsRuntimeStore";
import { getCyberNewsBySlug, getCyberNewsItems, hasPublicNewsDisplay, type CyberNewsItem } from "@/lib/newsStore";

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
  filteredMissingCount: number;
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

export type NewsPagedReadResult = {
  items: CyberNewsItem[];
  totalCount: number;
  dbEnabled: boolean;
};

// page 1-tabanli. DB erisilebiliyorsa gercek veri-seviyesi sayfalama
// (limit/offset) kullanilir. DB erisilemezse kucuk fallback setine
// (runtime cache + seed, tipik olarak <15 kayit) duser ve onu dilimler
// — bu senaryoda 260+ kayitlik hacim zaten soz konusu degil.
export async function getPagedNewsForPublic(page: number, pageSize: number): Promise<NewsPagedReadResult> {
  const offset = (page - 1) * pageSize;
  const dbResult = await getPagedNewsFromDb(pageSize, offset);

  if (dbResult.usingDatabase) {
    const items = dbResult.items.map(normalizeNewsItem).filter(hasPublicNewsDisplay);
    return { items, totalCount: dbResult.totalCount, dbEnabled: true };
  }

  const fallback = await getMergedNewsForPublic();
  return {
    items: fallback.items.slice(offset, offset + pageSize),
    totalCount: fallback.items.length,
    dbEnabled: false
  };
}

async function getMergedNewsForPublic(): Promise<NewsReadResult> {
  const dbResult = await getAllNewsFromDb();
  const cachedItems = await getCachedRuntimeNewsItems();
  const seedItems = getCyberNewsItems();
  const merged = mergeUniqueNewsItems([...dbResult.items, ...cachedItems, ...seedItems]);

  return {
    items: merged.items,
    source: "merged",
    dbEnabled: dbResult.usingDatabase,
    filteredMissingCount: merged.filteredMissingCount,
    sourceBreakdown: {
      database: dbResult.items.length,
      runtimeCache: cachedItems.length,
      seedFallback: seedItems.length,
      total: merged.items.length
    }
  };
}

export async function getNewsBySlugForPublic(slug: string): Promise<NewsDetailReadResult> {
  const dbResult = await getNewsBySlugFromDb(slug);
  if (dbResult.items[0]) {
    const item = normalizeNewsItem(dbResult.items[0]);
    return { item: hasPublicNewsDisplay(item) ? item : undefined, source: "database" };
  }

  const cachedItem = await getCachedRuntimeNewsBySlug(slug);
  if (cachedItem) {
    const item = normalizeNewsItem(cachedItem);
    return { item: hasPublicNewsDisplay(item) ? item : undefined, source: "runtime-cache" };
  }

  const seedItem = getCyberNewsBySlug(slug);
  if (!seedItem) return { item: undefined, source: "seed-fallback" };
  const item = normalizeNewsItem(seedItem);
  return { item: hasPublicNewsDisplay(item) ? item : undefined, source: "seed-fallback" };
}

function mergeUniqueNewsItems(items: CyberNewsItem[]) {
  const seen = new Set<string>();
  const publicItems: CyberNewsItem[] = [];
  let filteredMissingCount = 0;

  for (const rawItem of items) {
    const item = normalizeNewsItem(rawItem);
    const key = item.sourceUrl || item.slug;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    if (!hasPublicNewsDisplay(item)) {
      filteredMissingCount += 1;
      continue;
    }

    publicItems.push(item);
  }

  return {
    filteredMissingCount,
    items: publicItems.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  };
}
