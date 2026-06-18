import type { CyberNewsImageSource, CyberNewsItem, CyberNewsRiskLevel, CyberNewsVisualType } from "@/lib/newsStore";
import { inferNewsVisualType } from "@/lib/newsStore";
import { buildTurkishNewsDisplay, cleanNewsDisplayText } from "@/lib/newsTranslation";

type RawNewsItem = Partial<CyberNewsItem> & Record<string, unknown>;

export function normalizeNewsItem(value: unknown): CyberNewsItem {
  const item = isRecord(value) ? (value as RawNewsItem) : {};
  const title = readRawString(item.title) || readRawString(item.originalTitle) || readRawString(item.original_title) || "Siber haber";
  const titleTr = readString(item.titleTr) || readString(item.title_tr);
  const summary = readRawString(item.summary) || readRawString(item.summaryShortTr) || readRawString(item.summary_short_tr) || title;
  const sourceUrl = readRawString(item.sourceUrl) || readRawString(item.source_url) || readRawString(item.originalUrl) || readRawString(item.original_url) || "https://www.usom.gov.tr/";
  const sourceName = readString(item.sourceName) || readString(item.source_name) || "Kaynak";
  const category = normalizeCategory(readString(item.category), `${title} ${summary}`);
  const imageUrl = readString(item.imageUrl) || readString(item.image_url) || undefined;
  const fallbackVisualType = normalizeVisualType(readString(item.fallbackVisualType) || readString(item.fallback_visual_type), `${category} ${title} ${summary}`);
  const display = buildTurkishNewsDisplay({
    originalSummary: readRawString(item.originalSummary) || readRawString(item.original_summary) || summary,
    originalTitle: readRawString(item.originalTitle) || readRawString(item.original_title) || title,
    summary,
    summaryShortTr: readString(item.summaryShortTr) || readString(item.summary_short_tr),
    title,
    titleTr
  });

  return {
    id: readRawString(item.id) || sourceUrl || slugifyNewsText(title),
    title,
    displayTitle: display?.displayTitle,
    displaySummary: display?.displaySummary,
    translationStatus: display?.translationStatus ?? "missing",
    titleTr,
    originalTitle: readRawString(item.originalTitle) || readRawString(item.original_title) || title,
    originalUrl: readRawString(item.originalUrl) || readRawString(item.original_url) || sourceUrl,
    slug: readRawString(item.slug) || slugifyNewsText(title),
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
    imageAltTr: readString(item.imageAltTr) || readString(item.image_alt_tr) || `${display?.displayTitle || titleTr || "Haber"} haber g\u00f6rseli`,
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
  return typeof value === "string" ? cleanNewsDisplayText(value) : "";
}

function readRawString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const normalized = cleanNewsDisplayText(value).toLocaleLowerCase("tr-TR");
  if (normalized === "d\u00fc\u015f\u00fck") return "D\u00fc\u015f\u00fck" as CyberNewsRiskLevel;
  if (normalized === "y\u00fcksek") return "Y\u00fcksek" as CyberNewsRiskLevel;
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
  const cleanedValue = cleanNewsDisplayText(value);
  const haystack = cleanNewsDisplayText(`${cleanedValue} ${fallbackText}`).toLocaleLowerCase("tr-TR");
  const isGeneric = !cleanedValue || haystack.includes("siber g\u00fcndem") || cleanedValue.toLocaleLowerCase("tr-TR") === "general";

  if (haystack.includes("bahis") || haystack.includes("sanal bahis") || haystack.includes("kumar")) {
    return "Yasa D\u0131\u015f\u0131 Bahis / Doland\u0131r\u0131c\u0131l\u0131k";
  }
  if (haystack.includes("oltalama") || haystack.includes("phishing")) return "Oltalama";
  if (haystack.includes("fidye") || haystack.includes("ransomware")) return "Fidye Yaz\u0131l\u0131m\u0131";
  if (haystack.includes("veri s\u0131z\u0131nt\u0131s\u0131") || haystack.includes("data breach") || haystack.includes("breach")) return "Veri S\u0131z\u0131nt\u0131s\u0131";
  if (haystack.includes("malware") || haystack.includes("zararl\u0131 yaz\u0131l\u0131m")) return "Zararl\u0131 Yaz\u0131l\u0131m";

  return isGeneric ? "Siber G\u00fcndem" : cleanedValue;
}

function slugifyNewsText(value: string) {
  return cleanNewsDisplayText(value)
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
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "siber-haber";
}
