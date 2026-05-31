import { filterRssItemsByKeywords, parseRssItems, rssSources } from "@/lib/rssSources";
import { getCyberNewsItems, isRelevantCyberNews, upsertUniqueNewsItems, type CyberNewsItem } from "@/lib/newsStore";
import { summarizeCyberNews, type RawCyberNews } from "@/lib/newsSummarizer";
import { upsertNewsItems } from "@/lib/newsDb";

export type NewsSourceFetchReport = {
  sourceId: string;
  sourceName: string;
  url: string;
  ok: boolean;
  status?: number;
  contentType?: string;
  parsedItems: number;
  acceptedItems: number;
  firstItems: string[];
  error?: string;
};

export type NewsFetchReport = {
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
  items: CyberNewsItem[];
  sources: NewsSourceFetchReport[];
};

export async function fetchLatestCyberNews(): Promise<NewsFetchReport> {
  const fetchedItems: CyberNewsItem[] = [];
  const sourceReports: NewsSourceFetchReport[] = [];

  for (const source of rssSources.filter((item) => item.enabled)) {
    try {
      const response = await fetch(source.rssUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": "Dijital-Iz-Avcisi-NewsFetcher/1.0"
        }
      });
      const contentType = response.headers.get("content-type") ?? "";
      const xml = await response.text();
      const parsed = response.ok ? parseRssItems(xml, source) : [];
      const accepted = filterRssItemsByKeywords(parsed, source.keywords);
      const mapped = accepted.map((item) =>
        mapRawNewsToCyberNews({
          title: item.title,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          imageUrl: item.imageUrl || "/news-fallback-cyber.svg",
          publishedAt: item.publishedAt,
          textSnippet: item.textSnippet
        })
      );

      fetchedItems.push(...mapped);
      sourceReports.push({
        sourceId: source.id,
        sourceName: source.name,
        url: source.rssUrl,
        ok: response.ok,
        status: response.status,
        contentType,
        parsedItems: parsed.length,
        acceptedItems: accepted.length,
        firstItems: parsed.slice(0, 3).map((item) => item.title)
      });
    } catch (error) {
      console.warn("news_fetch_failed", { source: source.name, error });
      sourceReports.push({
        sourceId: source.id,
        sourceName: source.name,
        url: source.rssUrl,
        ok: false,
        parsedItems: 0,
        acceptedItems: 0,
        firstItems: [],
        error: error instanceof Error ? error.message : "Bilinmeyen hata"
      });
    }
  }

  const uniqueFetched = upsertUniqueNewsItems(fetchedItems).filter((item) => isRelevantCyberNews(`${item.title} ${item.summary} ${item.category}`));
  const dbResult = await upsertNewsItems(uniqueFetched);

  return {
    found: uniqueFetched.length,
    inserted: dbResult.inserted,
    skipped: dbResult.skipped,
    failed: dbResult.failed,
    items: dbResult.items.length ? dbResult.items : getCyberNewsItems(),
    sources: sourceReports
  };
}

export function getNewsSourceConfig() {
  return rssSources;
}

export function parseCyberNewsRss(xml: string, sourceId: string): CyberNewsItem[] {
  const source = rssSources.find((item) => item.id === sourceId);
  if (!source) return [];

  return filterRssItemsByKeywords(parseRssItems(xml, source), source.keywords).map((item) =>
    mapRawNewsToCyberNews({
      title: item.title,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl || "/news-fallback-cyber.svg",
      publishedAt: item.publishedAt,
      textSnippet: item.textSnippet
    })
  );
}

export function mapRawNewsToCyberNews(raw: RawCyberNews): CyberNewsItem {
  const summary = summarizeCyberNews(raw);
  return {
    id: raw.sourceUrl,
    title: raw.title,
    slug: slugify(raw.title),
    category: "Siber Gündem",
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    imageUrl: raw.imageUrl || "/news-fallback-cyber.svg",
    publishedAt: raw.publishedAt,
    fetchedAt: new Date().toISOString(),
    ...summary
  };
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
