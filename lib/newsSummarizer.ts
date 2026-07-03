import type { CyberNewsItem } from "@/lib/newsStore";

export type RawCyberNews = {
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  language?: "tr" | "en";
  imageUrl?: string;
  imageSource?: "rss" | "og" | "twitter" | "jsonld" | "article" | "fallback";
  imageCheckedAt?: string;
  fetchImageFailureReason?: string;
  textSnippet: string;
};

export function summarizeCyberNews(
  raw: RawCyberNews
): Pick<
  CyberNewsItem,
  | "summary"
  | "riskNote"
  | "publicAdvice"
  | "riskLevel"
  | "summaryShortTr"
  | "summaryLongTr"
  | "whyItMattersTr"
  | "affectedGroupsTr"
  | "recommendationsTr"
  | "technicalSignalsTr"
> {
  // TODO: OpenAI entegrasyonu ile haber metnini kopyalamadan kısa özet, risk notu ve vatandaş önerileri üret.
  // Üretim ortamında kaynak metnin tamamı saklanmamalı; kısa alıntı ve kaynak linki yeterli olmalı.
  const cleanedSnippet = stripTrailingSourceName(cleanNewsText(raw.textSnippet), raw.sourceName);
  const safeSnippet = cleanedSnippet || "Kaynak haber siber güvenlik gündemiyle ilişkili bir başlık içeriyor.";
  const summary = trimToSentence(safeSnippet, 260);

  return {
    summary,
    summaryShortTr: trimToSentence(summary, 180),
    summaryLongTr: `${summary} Haber kaynağı korunarak, içerik vatandaşın anlayacağı kısa bir risk notuna dönüştürülmüştür.`,
    riskNote: "Bu içerik siber güvenlik farkındalığı açısından izlenmesi gereken bir risk sinyali içeriyor olabilir.",
    whyItMattersTr:
      "Benzer başlıklar vatandaşları sahte linklere, kimlik bilgisi paylaşımına veya hatalı güven kararlarına yönlendirebilir. Bu nedenle kaynağın ve bağlantının doğrulanması önemlidir.",
    affectedGroupsTr: ["Bireysel kullanıcılar", "Kurum çalışanları", "Online işlem yapan vatandaşlar"],
    recommendationsTr: [
      "Kaynağı kontrol edin ve resmi kanallardan doğrulama yapın.",
      "Şüpheli link, SMS veya ödeme talebi varsa kişisel bilgi paylaşmayın.",
      "Gerekirse ilgili kurumun resmi ihbar kanalına bildirim yapın."
    ],
    technicalSignalsTr: ["RSS kaynağından alındı.", "Siber güvenlik anahtar kelime filtresinden geçti.", "Orijinal kaynak bağlantısı korundu."],
    publicAdvice: [
      "Kaynağı kontrol edin ve resmi kanallardan doğrulama yapın.",
      "Şüpheli link, SMS veya ödeme talebi varsa kişisel bilgi paylaşmayın.",
      "Gerekirse ilgili kurumun resmi ihbar kanalına bildirim yapın."
    ],
    riskLevel: "Orta"
  };
}

// Google News gibi kaynaklar description sonuna yayın adını iliştiriyor
// (ör: "...başlık metni. Mersin Haber"). Sadece cümle sonu noktalamasından
// hemen sonra, metnin en sonunda birebir kaynak adı geçiyorsa kırp — emin
// olunamayan durumda metne dokunma.
function stripTrailingSourceName(value: string, sourceName: string) {
  const trimmedSource = sourceName?.trim();
  if (!trimmedSource || trimmedSource.length < 2) return value;

  const escapedSource = trimmedSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const trailingPattern = new RegExp(`([.!?])\\s+${escapedSource}\\s*$`, "i");
  const match = value.match(trailingPattern);
  if (!match || match.index === undefined) return value;

  return value.slice(0, match.index + match[1].length).trim();
}

function trimToSentence(value: string, maxLength: number) {
  const normalized = cleanNewsText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
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
