import { cyberNewsKeywords } from "@/lib/newsStore";

export type RssSource = {
  id: string;
  name: string;
  rssUrl: string;
  homepageUrl: string;
  language: "tr" | "en";
  enabled: boolean;
  keywords: string[];
};

export type ParsedRssItem = {
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl?: string;
  textSnippet: string;
};

export const rssSources: RssSource[] = [
  {
    id: "google-news-siber-suc",
    name: "Google News - Siber Suç",
    rssUrl: "https://news.google.com/rss/search?q=%22siber%20su%C3%A7%22%20OR%20%22siber%20doland%C4%B1r%C4%B1c%C4%B1l%C4%B1k%22&hl=tr&gl=TR&ceid=TR:tr",
    homepageUrl: "https://news.google.com/",
    language: "tr",
    enabled: true,
    keywords: cyberNewsKeywords
  },
  {
    id: "google-news-phishing",
    name: "Google News - Oltalama",
    rssUrl: "https://news.google.com/rss/search?q=oltalama%20OR%20phishing%20OR%20%22sahte%20SMS%22%20OR%20%22sahte%20kargo%22&hl=tr&gl=TR&ceid=TR:tr",
    homepageUrl: "https://news.google.com/",
    language: "tr",
    enabled: true,
    keywords: cyberNewsKeywords
  },
  {
    id: "google-news-kurumlar",
    name: "Google News - Kamu Siber",
    rssUrl: "https://news.google.com/rss/search?q=USOM%20OR%20BTK%20OR%20%22Emniyet%20siber%22%20OR%20%22Jandarma%20siber%22&hl=tr&gl=TR&ceid=TR:tr",
    homepageUrl: "https://news.google.com/",
    language: "tr",
    enabled: true,
    keywords: cyberNewsKeywords
  },
  {
    id: "google-news-dolandiricilik",
    name: "Google News - Dijital Dolandırıcılık",
    rssUrl: "https://news.google.com/rss/search?q=%22banka%20doland%C4%B1r%C4%B1c%C4%B1l%C4%B1%C4%9F%C4%B1%22%20OR%20%22kripto%20doland%C4%B1r%C4%B1c%C4%B1l%C4%B1%C4%9F%C4%B1%22%20OR%20%22sosyal%20medya%20hesab%C4%B1%20%C3%A7al%C4%B1nd%C4%B1%22%20OR%20%22yasa%20d%C4%B1%C5%9F%C4%B1%20bahis%22&hl=tr&gl=TR&ceid=TR:tr",
    homepageUrl: "https://news.google.com/",
    language: "tr",
    enabled: true,
    keywords: cyberNewsKeywords
  }
];

export function parseRssItems(xml: string, source: RssSource): ParsedRssItem[] {
  const itemBlocks = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi), (match) => match[0]);
  const entryBlocks = itemBlocks.length ? [] : Array.from(xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi), (match) => match[0]);
  const blocks = itemBlocks.length ? itemBlocks : entryBlocks;

  const parsedItems: Array<ParsedRssItem | null> = blocks.map((block) => {
      const title = decodeXml(readTag(block, "title"));
      const link = decodeXml(readLink(block)) || source.homepageUrl;
      const publishedAt = decodeXml(readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated"));
      const textSnippet = stripHtml(decodeXml(readTag(block, "description") || readTag(block, "summary") || readTag(block, "content:encoded")));
      const imageUrl = readImageUrl(block);

      if (!title || !link) return null;

      return {
        title,
        sourceName: source.name,
        sourceUrl: link,
        publishedAt: normalizePublishedAt(publishedAt),
        ...(imageUrl ? { imageUrl } : {}),
        textSnippet
      };
    });

  return parsedItems.filter((item): item is ParsedRssItem => item !== null);
}

export function filterRssItemsByKeywords(items: ParsedRssItem[], keywords = cyberNewsKeywords) {
  return items.filter((item) => {
    const haystack = `${item.title} ${item.textSnippet}`.toLocaleLowerCase("tr-TR");
    return keywords.some((keyword) => haystack.includes(keyword.toLocaleLowerCase("tr-TR")));
  });
}

function readTag(block: string, tagName: string) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function readLink(block: string) {
  const tagLink = readTag(block, "link");
  if (tagLink) return tagLink;
  const hrefMatch = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return hrefMatch?.[1]?.trim() ?? "";
}

function readImageUrl(block: string) {
  const enclosure = block.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i)?.[1];
  const media = block.match(/<media:content\b[^>]*url=["']([^"']+)["'][^>]*>/i)?.[1];
  const thumbnail = block.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i)?.[1];
  return enclosure || media || thumbnail || undefined;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePublishedAt(value: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
