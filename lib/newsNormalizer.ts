import type { CyberNewsImageSource, CyberNewsItem, CyberNewsRiskLevel, CyberNewsVisualType } from "@/lib/newsStore";
import { inferNewsVisualType } from "@/lib/newsStore";

type RawNewsItem = Partial<CyberNewsItem> & Record<string, unknown>;

export function normalizeNewsItem(value: unknown): CyberNewsItem {
  const item = isRecord(value) ? (value as RawNewsItem) : {};
  const title = readString(item.title) || readString(item.originalTitle) || readString(item.original_title) || "Siber haber";
  const titleTr = readString(item.titleTr) || readString(item.title_tr) || title;
  const summary = readString(item.summary) || readString(item.summaryShortTr) || readString(item.summary_short_tr) || title;
  const sourceUrl = readString(item.sourceUrl) || readString(item.source_url) || readString(item.originalUrl) || readString(item.original_url) || "https://www.usom.gov.tr/";
  const sourceName = readString(item.sourceName) || readString(item.source_name) || "Kaynak";
  const category = normalizeCategory(readString(item.category), `${title} ${summary}`);
  const imageUrl = readString(item.imageUrl) || readString(item.image_url) || undefined;
  const fallbackVisualType = normalizeVisualType(readString(item.fallbackVisualType) || readString(item.fallback_visual_type), `${category} ${title} ${summary}`);

  return {
    id: readString(item.id) || sourceUrl || slugifyNewsText(title),
    title,
    titleTr,
    originalTitle: readString(item.originalTitle) || readString(item.original_title) || title,
    originalUrl: readString(item.originalUrl) || readString(item.original_url) || sourceUrl,
    slug: readString(item.slug) || slugifyNewsText(title),
    summary,
    summaryShortTr: readString(item.summaryShortTr) || readString(item.summary_short_tr) || summary,
    summaryLongTr: readString(item.summaryLongTr) || readString(item.summary_long_tr) || summary,
    riskNote: readString(item.riskNote) || readString(item.risk_note) || "",
    whyItMattersTr: readString(item.whyItMattersTr) || readString(item.why_it_matters_tr) || undefined,
    affectedGroupsTr: readStringArray(item.affectedGroupsTr ?? item.affected_groups_tr),
    recommendationsTr: readStringArray(item.recommendationsTr ?? item.recommendations_tr),
    technicalSignalsTr: readStringArray(item.technicalSignalsTr ?? item.technical_signals_tr),
    publicAdvice: readStringArray(item.publicAdvice ?? item.public_advice),
    category,
    sourceName,
    sourceUrl,
    imageUrl,
    imageSource: normalizeImageSource(readString(item.imageSource) || readString(item.image_source) || (imageUrl ? "og" : "fallback")),
    imageCheckedAt: readString(item.imageCheckedAt) || readString(item.image_checked_at) || undefined,
    imageAltTr: readString(item.imageAltTr) || readString(item.image_alt_tr) || `${titleTr} haber görseli`,
    fetchImageFailureReason: readString(item.fetchImageFailureReason) || readString(item.fetch_image_failure_reason) || undefined,
    publishedAt: readString(item.publishedAt) || readString(item.published_at) || new Date().toISOString().slice(0, 10),
    fetchedAt: readString(item.fetchedAt) || readString(item.fetched_at) || new Date().toISOString(),
    riskLevel: normalizeRiskLevel(readString(item.riskLevel) || readString(item.risk_level)),
    severity: normalizeRiskLevel(readString(item.severity) || readString(item.riskLevel) || readString(item.risk_level)),
    fallbackVisualType,
    isFeatured: readBoolean(item.isFeatured ?? item.is_featured),
    isArchived: readBoolean(item.isArchived ?? item.is_archived),
    tags: readStringArray(item.tags)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown) {
  return typeof value === "string" ? cleanVisibleText(value) : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(readString).filter((item): item is string => item.length > 0);
}

function normalizeImageSource(value: string): CyberNewsImageSource {
  if (value === "rss" || value === "og" || value === "twitter" || value === "jsonld" || value === "article" || value === "fallback") return value;
  return "fallback";
}

function normalizeRiskLevel(value: string): CyberNewsRiskLevel {
  if (value === "Düşük" || value === "DÃ¼ÅŸÃ¼k" || value === "DÃƒÂ¼Ã…Å¸ÃƒÂ¼k") return "DÃ¼ÅŸÃ¼k" as CyberNewsRiskLevel;
  if (value === "Yüksek" || value === "YÃ¼ksek" || value === "YÃƒÂ¼ksek") return "YÃ¼ksek" as CyberNewsRiskLevel;
  return "Orta";
}

function normalizeVisualType(value: string, fallbackText: string): CyberNewsVisualType {
  const allowed: CyberNewsVisualType[] = [
    "illegal-betting",
    "phishing",
    "sms",
    "banking",
    "ransomware",
    "breach",
    "infrastructure",
    "malware",
    "threat-intel",
    "privacy",
    "general"
  ];
  const inferred = inferNewsVisualType(fallbackText);
  if (inferred !== "general") return inferred;
  return allowed.includes(value as CyberNewsVisualType) ? (value as CyberNewsVisualType) : inferred;
}

function normalizeCategory(value: string, fallbackText: string) {
  const haystack = `${value} ${fallbackText}`.toLocaleLowerCase("tr-TR");
  const isGeneric = !value || haystack.includes("siber gündem") || haystack.includes("siber gã¼ndem") || value.toLocaleLowerCase("tr-TR") === "general";

  if (haystack.includes("bahis") || haystack.includes("sanal bahis") || haystack.includes("kumar")) {
    return "Yasa Dışı Bahis / Dolandırıcılık";
  }
  if (haystack.includes("oltalama") || haystack.includes("phishing")) return "Oltalama";
  if (haystack.includes("fidye") || haystack.includes("ransomware")) return "Fidye Yazılımı";
  if (haystack.includes("veri sızıntısı") || haystack.includes("data breach") || haystack.includes("breach")) return "Veri Sızıntısı";
  if (haystack.includes("malware") || haystack.includes("zararlı yazılım")) return "Zararlı Yazılım";

  return isGeneric ? "Siber Gündem" : value;
}

function cleanVisibleText(value: string) {
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

function slugifyNewsText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ÄŸ/g, "g")
    .replace(/Ã¼/g, "u")
    .replace(/ÅŸ/g, "s")
    .replace(/Ä±/g, "i")
    .replace(/Ã¶/g, "o")
    .replace(/Ã§/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "siber-haber";
}
