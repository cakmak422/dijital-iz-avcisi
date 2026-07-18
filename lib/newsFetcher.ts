import { filterRssItemsByKeywords, parseRssItems, rssSources } from "@/lib/rssSources";
import {
  getCyberNewsItems,
  inferNewsVisualType,
  isRelevantCyberNews,
  upsertUniqueNewsItems,
  type CyberNewsImageSource,
  type CyberNewsItem
} from "@/lib/newsStore";
import { persistRuntimeNewsItems } from "@/lib/newsRuntimeStore";
import { summarizeCyberNews, type RawCyberNews } from "@/lib/newsSummarizer";
import { localizeCyberNewsText } from "@/lib/newsTranslation";
import { getAiStats, isNewsAiTranslatorConfigured, resetAiStats, translateNewsWithAi } from "@/lib/newsAiTranslator";

const MAX_ITEMS_PER_SOURCE = 10;
const MAX_TOTAL_ITEMS = 30;
const MAX_IMAGE_URL_LENGTH = 2000;
const IMAGE_FETCH_TIMEOUT_MS = 3500;
// Fetch başına Gemini'ye giden toplam item sayısı (dil bazında, tüm kaynaklar toplamı)
const MAX_ENGLISH_ITEMS_PER_FETCH = Number(process.env.MAX_ENGLISH_ITEMS_PER_FETCH ?? "3");
const MAX_TR_ITEMS_PER_FETCH = Number(process.env.MAX_TR_ITEMS_PER_FETCH ?? "3");
// RSS description bu uzunluğun altındaysa kaynak sayfadan paragraf çekilir;
// üzerindeyse RSS snippet'i doğrudan kullanılır (ekstra fetch atlanır, süre kazanılır).
const LEAD_PARAGRAPH_MIN_SNIPPET_LENGTH = 200;
// Fetch başına toplam Gemini süresi bu tavanı aşarsa kalan çağrılar
// retry'sız tek deneme yapar (item düşürülmez, sadece retry hakkı kaybedilir).
const AI_TOTAL_BUDGET_MS = Number(process.env.AI_TOTAL_BUDGET_MS ?? "45000");

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
  processedLimit: {
    perSource: number;
    total: number;
    processed: number;
  };
  inserted: number;
  skipped: number;
  failed: number;
  errors: string[];
  items: CyberNewsItem[];
  fetchedItems?: CyberNewsItem[];
  sources: NewsSourceFetchReport[];
  cache?: {
    persisted: number;
    enabled: boolean;
  };
  imageStats?: Record<CyberNewsImageSource, number>;
  aiStats: { attempted: number; ok: number };
  truncationCount: number;
};

export async function fetchLatestCyberNews(): Promise<NewsFetchReport> {
  resetAiStats();
  const fetchedItems: CyberNewsItem[] = [];
  const sourceReports: NewsSourceFetchReport[] = [];
  const imageStats: Record<CyberNewsImageSource, number> = { rss: 0, og: 0, twitter: 0, jsonld: 0, article: 0, fallback: 0 };
  let remainingCapacity = MAX_TOTAL_ITEMS;
  // Gemini'ye giden item sayısı tüm kaynaklar toplamında bu bütçeyle sınırlı (dil başına)
  let englishAiBudget = MAX_ENGLISH_ITEMS_PER_FETCH;
  let turkishAiBudget = MAX_TR_ITEMS_PER_FETCH;
  let totalAiElapsedMs = 0;

  for (const source of rssSources.filter((item) => item.enabled)) {
    if (remainingCapacity <= 0) break;

    try {
      const response = await fetch(source.rssUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": "Dijital-Iz-Avcisi-NewsFetcher/1.0"
        }
      });
      const contentType = response.headers.get("content-type") ?? "";
      const xml = await response.text();
      const parsed = response.ok ? parseRssItems(xml, source) : [];
      const accepted = filterRssItemsByKeywords(parsed, source.keywords).filter((item) => isRecentNews(item.publishedAt));
      const acceptedForProcessing = accepted.slice(0, Math.min(MAX_ITEMS_PER_SOURCE, remainingCapacity));
      const mappableItems = acceptedForProcessing.filter((item) => isValidExternalUrl(item.sourceUrl));
      // Gemini uygunluğu senkron olarak, önceden belirlenir — mapWithConcurrency içindeki
      // eşzamanlı worker'lar arasında bütçe sayacı yarış durumuna düşmesin diye.
      const aiEligibility = mappableItems.map(() => {
        if (source.language === "en") {
          if (englishAiBudget > 0) {
            englishAiBudget -= 1;
            return true;
          }
          return false;
        }
        if (turkishAiBudget > 0) {
          turkishAiBudget -= 1;
          return true;
        }
        return false;
      });
      const mapped = await mapWithConcurrency(mappableItems, 4, async (item, index) => {
        const image = await resolveNewsImageWithArticleSource(item.imageUrl, item.sourceUrl);
        imageStats[image.source] += 1;
        // Bütçe çağrı başında kontrol edilir (kaba taneli) — kümülatif AI süresi
        // tavanı aşmışsa bu çağrı retry hakkını kaybeder, item yine de denenir.
        const allowRetry = totalAiElapsedMs < AI_TOTAL_BUDGET_MS;
        const result = await mapRawNewsToCyberNewsForFetch(
          {
            title: item.title,
            language: source.language,
            sourceName: item.sourceName,
            sourceUrl: image.resolvedSourceUrl || item.sourceUrl,
            imageUrl: image.url,
            imageSource: image.source,
            imageCheckedAt: image.checkedAt,
            fetchImageFailureReason: image.failureReason,
            publishedAt: item.publishedAt,
            textSnippet: item.textSnippet
          },
          aiEligibility[index],
          allowRetry
        );
        totalAiElapsedMs += result.aiMs;
        return result.item;
      });

      fetchedItems.push(...mapped.filter((item): item is CyberNewsItem => Boolean(item)));
      remainingCapacity = Math.max(0, MAX_TOTAL_ITEMS - fetchedItems.length);
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

  console.log("news_fetch_timing", {
    step: "after_ai_translation",
    elapsed_ms: totalAiElapsedMs,
    en_ai_used: MAX_ENGLISH_ITEMS_PER_FETCH - englishAiBudget,
    tr_ai_used: MAX_TR_ITEMS_PER_FETCH - turkishAiBudget
  });

  const uniqueFetched = upsertUniqueNewsItems(fetchedItems).filter((item) => isRelevantCyberNews(`${item.title} ${item.summary} ${item.category}`));
  const cacheResult = await persistRuntimeNewsItems(uniqueFetched);
  const aiStats = getAiStats();
  return {
    found: uniqueFetched.length,
    processedLimit: {
      perSource: MAX_ITEMS_PER_SOURCE,
      total: MAX_TOTAL_ITEMS,
      processed: uniqueFetched.length
    },
    inserted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    items: cacheResult.items.length ? cacheResult.items : getCyberNewsItems(),
    fetchedItems: uniqueFetched,
    sources: sourceReports,
    cache: {
      persisted: cacheResult.persisted,
      enabled: cacheResult.usingRuntimeCache
    },
    imageStats,
    aiStats: { attempted: aiStats.attempted, ok: aiStats.ok },
    truncationCount: aiStats.truncationCount
  };
}

export function getNewsSourceConfig() {
  return rssSources;
}

export function parseCyberNewsRss(xml: string, sourceId: string): CyberNewsItem[] {
  const source = rssSources.find((item) => item.id === sourceId);
  if (!source) return [];

  return filterRssItemsByKeywords(parseRssItems(xml, source), source.keywords)
    .filter((item) => isRecentNews(item.publishedAt) && isValidExternalUrl(item.sourceUrl))
    .map((item) =>
      mapRawNewsToCyberNews({
        title: item.title,
        language: source.language,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        imageUrl: item.imageUrl,
        imageSource: item.imageUrl ? "rss" : "fallback",
        fetchImageFailureReason: item.imageUrl ? undefined : "RSS kaydında görsel alanı bulunamadı.",
        publishedAt: item.publishedAt,
        textSnippet: item.textSnippet
      })
    );
}

export function mapRawNewsToCyberNews(raw: RawCyberNews): CyberNewsItem {
  const originalTitle = cleanNewsText(raw.title);
  const localized = localizeCyberNewsText({
    language: raw.language,
    title: originalTitle,
    textSnippet: raw.textSnippet
  });
  const title = localized.titleTr;
  const snippet = cleanNewsText(localized.summaryTr);
  const summary = summarizeCyberNews({
    ...raw,
    title,
    textSnippet: snippet
  });
  const category = inferCyberNewsCategory(`${title} ${snippet} ${originalTitle} ${raw.textSnippet}`);
  const fallbackVisualType = inferNewsVisualType(`${category} ${title} ${snippet} ${originalTitle}`);

  return {
    id: raw.sourceUrl,
    title,
    titleTr: title,
    originalTitle,
    originalUrl: raw.sourceUrl,
    slug: slugify(title),
    category,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    ...(raw.imageUrl ? { imageUrl: raw.imageUrl } : {}),
    imageSource: raw.imageSource ?? (raw.imageUrl ? "rss" : "fallback"),
    imageCheckedAt: raw.imageCheckedAt,
    imageAltTr: `${title} haber görseli`,
    fetchImageFailureReason: raw.fetchImageFailureReason,
    publishedAt: raw.publishedAt,
    fetchedAt: new Date().toISOString(),
    severity: summary.riskLevel,
    fallbackVisualType,
    isFeatured: false,
    isArchived: false,
    tags: ["rss", "güncel haber"],
    ...summary
  };
}

type FetchMapResult = { item: CyberNewsItem | null; aiMs: number };

async function mapRawNewsToCyberNewsForFetch(raw: RawCyberNews, useAi: boolean, allowRetry: boolean): Promise<FetchMapResult> {
  const deterministicItem = mapRawNewsToCyberNews(raw);
  if (!useAi || !isNewsAiTranslatorConfigured()) return { item: deterministicItem, aiMs: 0 };

  const sourceLanguage: "tr" | "en" = raw.language === "en" ? "en" : "tr";
  let originalSummary = raw.textSnippet;

  const tStart = Date.now();

  if (sourceLanguage === "tr" && cleanNewsText(originalSummary).length < LEAD_PARAGRAPH_MIN_SNIPPET_LENGTH) {
    const leadText = await fetchArticleLeadParagraphs(raw.sourceUrl);
    if (leadText) originalSummary = leadText;
  }

  const translation = await translateNewsWithAi({
    category: deterministicItem.category,
    originalTitle: deterministicItem.originalTitle || raw.title,
    originalSummary,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    sourceLanguage
  }, { allowRetry });
  const aiMs = Date.now() - tStart;
  console.log("news_fetch_timing", { step: sourceLanguage === "tr" ? "gemini_tr_item" : "gemini_en_item", elapsed_ms: aiMs });

  if (!translation.ok) {
    console.warn("news_ai_translation_failed", {
      reason: translation.reason,
      sourceName: raw.sourceName,
      sourceUrl: raw.sourceUrl,
      language: sourceLanguage
    });
    // Fail-soft: T\u00fcrk\u00e7e haberde Gemini ba\u015far\u0131s\u0131z olsa da ak\u0131\u015f k\u0131r\u0131lmas\u0131n,
    // deterministic (\u015fablon) s\u00fcr\u00fcm kullan\u0131ls\u0131n \u2014 Ad\u0131m 1.5 filtresi zaten
    // ziyaret\u00e7iye \u015fablon metni g\u00f6stermez. \u0130ngilizce davran\u0131\u015f\u0131 de\u011fi\u015fmedi (item atlan\u0131r).
    return { item: sourceLanguage === "tr" ? deterministicItem : null, aiMs };
  }

  const translated = translation.data;
  return {
    item: {
      ...deterministicItem,
      title: translated.title_tr,
      titleTr: translated.title_tr,
      slug: slugify(translated.title_tr),
      summary: translated.summary_short_tr,
      summaryShortTr: translated.summary_short_tr,
      summaryLongTr: translated.summary_long_tr,
      riskNote: translated.summary_short_tr,
      whyItMattersTr: translated.why_it_matters_tr,
      riskLevel: translated.risk_level,
      severity: translated.risk_level,
      publicAdvice: translated.public_advice,
      affectedGroupsTr: translated.affected_groups_tr,
      recommendationsTr: translated.recommendations_tr,
      imageAltTr: `${translated.title_tr} haber g\u00f6rseli`,
      tags: Array.from(new Set([...(deterministicItem.tags ?? []), "ai-ceviri"]))
    },
    aiMs
  };
}

// Pure: HTML -> ilk 2-3 anlaml\u0131 <p> paragraf\u0131n\u0131n temizlenmi\u015f metni.
function extractLeadParagraphs(html: string, maxParagraphs = 3, maxLength = 1200): string {
  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) => cleanNewsText(match[1]))
    .filter((text) => text.length > 40);

  const joined = paragraphs.slice(0, maxParagraphs).join(" ");
  if (!joined) return "";
  if (joined.length <= maxLength) return joined;
  return `${joined.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

// Lead-paragraph fetch'i i\u00e7in sert bellek tavan\u0131 \u2014 response.text() t\u00fcm body'yi
// belle\u011fe al\u0131p SONRA k\u0131rpar, bu y\u00fczden burada stream'den okuyup limite
// ula\u015f\u0131nca durduran ayr\u0131 bir okuyucu kullan\u0131l\u0131yor (ger\u00e7ek peak bellek s\u0131n\u0131r\u0131).
const LEAD_FETCH_MAX_BYTES = 120_000;

// Pure olmayan yard\u0131mc\u0131: response body'sini stream'den okuyup maxBytes'a
// ula\u015f\u0131nca durur, geri kalan body'yi indirmez/belle\u011fe almaz.
async function readBoundedResponseText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, maxBytes);

  const decoder = new TextDecoder("utf-8");
  let receivedBytes = 0;
  let text = "";

  try {
    while (receivedBytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // ba\u011flant\u0131 zaten kapanm\u0131\u015f olabilir, yok say
    }
  }

  return text.slice(0, maxBytes);
}

// T\u00fcrk\u00e7e haberlerde RSS description \u00e7ok k\u0131sa oldu\u011funda kaynak sayfadan
// ilk paragraflar\u0131 \u00e7eker. resolveNewsImageWithArticleSource()'tan ba\u011f\u0131ms\u0131z,
// ayr\u0131 bir fetch \u2014 g\u00f6rsel \u00e7\u00f6z\u00fcmleme mant\u0131\u011f\u0131na dokunmaz. Gemini AI b\u00fct\u00e7esi
// (MAX_TR_ITEMS_PER_FETCH) zaten bu fonksiyonun fetch ba\u015f\u0131na en fazla ka\u00e7
// kez \u00e7a\u011fr\u0131laca\u011f\u0131n\u0131 s\u0131n\u0131rlar; burada tekrar bir kilit gerekmiyor.
async function fetchArticleLeadParagraphs(sourceUrl: string): Promise<string> {
  if (!isValidExternalUrl(sourceUrl) || isBlockedInternalHost(sourceUrl)) return "";

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.6",
        "User-Agent": "Dijital-Iz-Avcisi-NewsImageFetcher/1.0"
      }
    });
    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLocaleLowerCase("en-US").includes("text/html")) return "";

    const html = await readBoundedResponseText(response, LEAD_FETCH_MAX_BYTES);
    return extractLeadParagraphs(html);
  } catch (error) {
    console.warn("news_lead_paragraph_fetch_failed", {
      sourceUrl,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
    return "";
  }
}

type ResolvedNewsImage = {
  checkedAt: string;
  source: CyberNewsImageSource;
  resolvedSourceUrl?: string;
  url?: string;
  failureReason?: string;
};

type ImageValidationResult = {
  url?: string;
  reason?: string;
};

type MetaImageResult = {
  source?: CyberNewsImageSource;
  url?: string;
  failureReason?: string;
};

async function resolveNewsImage(rssImageUrl: string | undefined, sourceUrl: string): Promise<ResolvedNewsImage> {
  const checkedAt = new Date().toISOString();
  const rssImage = await normalizeAndValidateImageUrl(rssImageUrl, sourceUrl, "RSS görseli");
  if (rssImage.url) return { checkedAt, source: "rss", url: rssImage.url };

  const metaImage = await fetchMetaImageFromSource(sourceUrl);
  if (metaImage.url && metaImage.source) {
    return { checkedAt, source: metaImage.source, url: metaImage.url };
  }

  return {
    checkedAt,
    source: "fallback",
    failureReason: [rssImage.reason, metaImage.failureReason].filter(Boolean).join(" | ") || "Doğrulanabilir haber görseli bulunamadı."
  };
}

async function resolveNewsImageWithArticleSource(rssImageUrl: string | undefined, sourceUrl: string): Promise<ResolvedNewsImage> {
  const checkedAt = new Date().toISOString();
  const resolvedSource = await resolveArticleSourceUrl(sourceUrl);
  const targetSourceUrl = resolvedSource.url || sourceUrl;
  const rssImage = await normalizeAndValidateImageUrl(rssImageUrl, targetSourceUrl, "RSS görseli");
  if (rssImage.url) return { checkedAt, source: "rss", resolvedSourceUrl: resolvedSource.url, url: rssImage.url };

  const metaImage = await fetchMetaImageFromSource(targetSourceUrl);
  if (metaImage.url && metaImage.source) {
    return { checkedAt, source: metaImage.source, resolvedSourceUrl: resolvedSource.url, url: metaImage.url };
  }

  return {
    checkedAt,
    source: "fallback",
    resolvedSourceUrl: resolvedSource.url,
    failureReason: [resolvedSource.reason, rssImage.reason, metaImage.failureReason].filter(Boolean).join(" | ") || "Doğrulanabilir haber görseli bulunamadı."
  };
}

async function resolveArticleSourceUrl(sourceUrl: string): Promise<{ url?: string; reason?: string }> {
  if (!isGoogleNewsArticleUrl(sourceUrl)) return { url: sourceUrl };

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.6",
        "User-Agent": "Dijital-Iz-Avcisi-NewsImageFetcher/1.0"
      }
    });

    if (!response.ok) return { reason: `Google News gerçek kaynak çözümü ${response.status} döndü.` };
    // TODO(adim-3): readBoundedResponseText() ile değiştir — .slice() burada
    // sadece sonucu kırpıyor, tüm body zaten belleğe alınmış oluyor.
    const html = (await response.text()).slice(0, 700_000);
    const id = extractAttribute(html, "data-n-a-id") || extractGoogleNewsArticleId(sourceUrl);
    const timestamp = extractAttribute(html, "data-n-a-ts");
    const signature = extractAttribute(html, "data-n-a-sg");
    if (!id || !timestamp || !signature) {
      return { reason: "Google News gerçek kaynak URL tokenları bulunamadı." };
    }

    const requestPayload = [
      "garturlreq",
      [
        ["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "US:en", null, 180, null, null, null, null, null, 0, null, null, [Number(timestamp), signature]],
        "en-US",
        "US",
        1,
        [2, 3, 4, 8],
        1,
        0,
        "655000234",
        0,
        0,
        null,
        0
      ],
      id
    ];
    const body = new URLSearchParams({
      "f.req": JSON.stringify([[["Fbv4je", JSON.stringify(requestPayload), null, "generic"]]])
    });
    const batchResponse = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Dijital-Iz-Avcisi-NewsImageFetcher/1.0",
        Referer: sourceUrl
      }
    });
    const text = await batchResponse.text();
    if (!batchResponse.ok) {
      return { reason: `Google News gerçek kaynak çözümü batchexecute ${batchResponse.status} döndü.` };
    }

    const decodedUrl = extractFirstExternalArticleUrl(text);
    if (decodedUrl) return { url: decodedUrl };
    return { reason: "Google News gerçek kaynak URL çözülemedi; batchexecute sonuç üretmedi." };
  } catch (error) {
    return { reason: `Google News gerçek kaynak URL çözüm hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}` };
  }
}

async function fetchMetaImageFromSource(sourceUrl: string): Promise<MetaImageResult> {
  if (!isValidExternalUrl(sourceUrl)) return { failureReason: "Kaynak URL geçerli http/https formatında değil." };
  if (isBlockedInternalHost(sourceUrl)) return { failureReason: "Kaynak URL iç ağ/private host olarak engellendi." };

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.6",
        "User-Agent": "Dijital-Iz-Avcisi-NewsImageFetcher/1.0"
      }
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) return { failureReason: `Kaynak sayfa fetch ${response.status} döndü.` };
    if (!contentType.toLocaleLowerCase("en-US").includes("text/html")) {
      return { failureReason: `Kaynak sayfa HTML dönmedi: ${contentType || "content-type yok"}.` };
    }

    const finalUrl = response.url || sourceUrl;
    // TODO(adim-3): readBoundedResponseText() ile değiştir — .slice() burada
    // sadece sonucu kırpıyor, tüm body zaten belleğe alınmış oluyor.
    const html = (await response.text()).slice(0, 260_000);

    const ogImage = extractMetaImage(html, ["og:image", "og:image:url", "og:image:secure_url"]);
    const validatedOg = await normalizeAndValidateImageUrl(ogImage, finalUrl, "og:image");
    if (validatedOg.url) return { source: "og", url: validatedOg.url };

    const twitterImage = extractMetaImage(html, ["twitter:image", "twitter:image:src"]);
    const validatedTwitter = await normalizeAndValidateImageUrl(twitterImage, finalUrl, "twitter:image");
    if (validatedTwitter.url) return { source: "twitter", url: validatedTwitter.url };

    const jsonLdImage = extractJsonLdImage(html);
    const validatedJsonLd = await normalizeAndValidateImageUrl(jsonLdImage, finalUrl, "JSON-LD image");
    if (validatedJsonLd.url) return { source: "jsonld", url: validatedJsonLd.url };

    const articleImage = extractMetaImage(html, ["article:image", "image"]) || extractItempropImage(html);
    const validatedArticle = await normalizeAndValidateImageUrl(articleImage, finalUrl, "article image");
    if (validatedArticle.url) return { source: "article", url: validatedArticle.url };

    const googleNote = new URL(finalUrl).hostname.includes("news.google.com") ? " Google News ara sayfası gerçek haber görselini sağlamadı." : "";
    return {
      failureReason:
        [validatedOg.reason, validatedTwitter.reason, validatedJsonLd.reason, validatedArticle.reason].filter(Boolean).join(" | ") ||
        `Kaynak sayfada og:image, twitter:image, JSON-LD veya article image bulunamadı.${googleNote}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen görsel meta hatası";
    console.warn("news_image_meta_fetch_failed", { sourceUrl, error: message });
    return { failureReason: `Kaynak sayfa fetch/timeout hatası: ${message}` };
  }
}

function extractMetaImage(html: string, properties: string[]) {
  for (const property of properties) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const propertyFirst = new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${escaped}["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>`, "i");
    const contentFirst = new RegExp(`<meta\\b(?=[^>]*content=["']([^"']+)["'])(?=[^>]*(?:property|name)=["']${escaped}["'])[^>]*>`, "i");
    const match = html.match(propertyFirst) || html.match(contentFirst);
    const value = match?.[1]?.trim();
    if (value) return decodeHtmlEntities(value);
  }

  return undefined;
}

function extractItempropImage(html: string) {
  const itempropFirst = html.match(/<meta\b(?=[^>]*itemprop=["']image["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>/i);
  const contentFirst = html.match(/<meta\b(?=[^>]*content=["']([^"']+)["'])(?=[^>]*itemprop=["']image["'])[^>]*>/i);
  return decodeHtmlEntities(itempropFirst?.[1] || contentFirst?.[1] || "");
}

function extractJsonLdImage(html: string) {
  const scriptBlocks = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi), (match) => match[1]);
  for (const block of scriptBlocks) {
    const cleaned = decodeHtmlEntities(block).trim();
    if (!cleaned) continue;
    try {
      const parsed = JSON.parse(cleaned);
      const image = findJsonLdImage(parsed);
      if (image) return image;
    } catch {
      continue;
    }
  }
  return undefined;
}

function findJsonLdImage(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonLdImage(item);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const image = record.image || record.thumbnailUrl;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return findJsonLdImage(image);
  if (image && typeof image === "object") {
    const imageRecord = image as Record<string, unknown>;
    if (typeof imageRecord.url === "string") return imageRecord.url;
    const foundNested = findJsonLdImage(imageRecord);
    if (foundNested) return foundNested;
  }

  const graph = record["@graph"];
  if (graph) return findJsonLdImage(graph);
  return undefined;
}

async function normalizeAndValidateImageUrl(value: string | undefined, baseUrl: string, label: string): Promise<ImageValidationResult> {
  if (!value) return { reason: `${label} yok.` };

  const normalized = normalizeImageUrl(value, baseUrl);
  if (!normalized) return { reason: `${label} geçerli veya desteklenen http/https URL değil.` };
  if (isBlockedInternalHost(normalized)) return { reason: `${label} private/local host olduğu için engellendi.` };
  if (hasKnownImageExtension(normalized)) return { url: normalized };

  const contentType = await fetchImageContentType(normalized);
  if (contentType?.startsWith("image/")) return { url: normalized };
  return { reason: contentType ? `${label} content-type image değil: ${contentType}.` : `${label} doğrulaması başarısız veya timeout.` };
}

function normalizeImageUrl(value: string, baseUrl: string) {
  const trimmed = decodeHtmlEntities(value).trim();
  if (!trimmed || trimmed.length > MAX_IMAGE_URL_LENGTH) return undefined;

  try {
    const parsed = new URL(trimmed, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;
    if (parsed.href.length > MAX_IMAGE_URL_LENGTH) return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

async function fetchImageContentType(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*;q=0.8,*/*;q=0.4",
        "User-Agent": "Dijital-Iz-Avcisi-NewsImageFetcher/1.0"
      }
    });
    if (!response.ok) return undefined;
    return response.headers.get("content-type")?.toLocaleLowerCase("en-US").split(";")[0].trim();
  } catch {
    return undefined;
  }
}

function hasKnownImageExtension(url: string) {
  try {
    const pathname = new URL(url).pathname.toLocaleLowerCase("en-US");
    return /\.(avif|webp|png|jpe?g|gif|svg)$/.test(pathname);
  } catch {
    return false;
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function inferCyberNewsCategory(text: string) {
  const normalized = cleanNewsText(text).toLocaleLowerCase("tr-TR");
  if (normalized.includes("bahis") || normalized.includes("sanal bahis") || normalized.includes("kumar")) {
    return "Yasa Dışı Bahis / Dolandırıcılık";
  }
  if (normalized.includes("oltalama") || normalized.includes("phishing")) return "Oltalama";
  if (normalized.includes("fidye") || normalized.includes("ransomware")) return "Fidye Yazılımı";
  if (normalized.includes("veri sızıntısı") || normalized.includes("data breach") || normalized.includes("breach")) return "Veri Sızıntısı";
  if (normalized.includes("malware") || normalized.includes("zararlı yazılım")) return "Zararlı Yazılım";
  if (normalized.includes("banka") || normalized.includes("kart") || normalized.includes("iban") || normalized.includes("finans")) return "Finansal Risk";
  if (normalized.includes("tehdit istihbaratı") || normalized.includes("threat intel") || normalized.includes("ioc")) return "Tehdit İstihbaratı";
  return "Siber Gündem";
}

function isGoogleNewsArticleUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname === "news.google.com" && parsed.pathname.includes("/articles/");
  } catch {
    return false;
  }
}

function extractGoogleNewsArticleId(value: string) {
  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const articleIndex = parts.indexOf("articles");
    return articleIndex >= 0 ? parts[articleIndex + 1] : undefined;
  } catch {
    return undefined;
  }
}

function extractAttribute(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decodeHtmlEntities(html.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"))?.[1] || "");
}

function extractFirstExternalArticleUrl(value: string) {
  const decoded = decodeHtmlEntities(value.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&").replace(/\\"/g, "\""));
  const urls = Array.from(decoded.matchAll(/https?:\/\/[^"\\\]\s]+/g), (match) => match[0]);
  return urls.find((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname !== "news.google.com" && !parsed.hostname.endsWith(".google.com") && !parsed.hostname.endsWith(".gstatic.com");
    } catch {
      return false;
    }
  });
}

function isBlockedInternalHost(value: string) {
  try {
    const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return true;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return isPrivateIpv4(hostname);
    if (hostname === "::1" || hostname.startsWith("[::1]")) return true;
    return false;
  } catch {
    return true;
  }
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  );
}

function cleanNewsText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function slugify(value: string) {
  return cleanNewsText(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isRecentNews(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const ageMs = Date.now() - date.getTime();
  return ageMs <= 48 * 60 * 60 * 1000;
}

function isValidExternalUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
