import type { CyberNewsItem } from "@/lib/newsStore";

export type RawCyberNews = {
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl?: string;
  textSnippet: string;
};

export function summarizeCyberNews(raw: RawCyberNews): Pick<CyberNewsItem, "summary" | "riskNote" | "publicAdvice" | "riskLevel"> {
  // TODO: OpenAI entegrasyonu ile haber metnini kopyalamadan kısa özet, risk notu ve vatandaş önerileri üret.
  // Üretim ortamında kaynak metnin tamamı saklanmamalı; kısa alıntı ve kaynak linki yeterli olmalı.
  return {
    summary: raw.textSnippet,
    riskNote: "Bu içerik siber güvenlik farkındalığı açısından izlenmesi gereken bir risk sinyali içeriyor olabilir.",
    publicAdvice: [
      "Kaynağı kontrol edin ve resmi kanallardan doğrulama yapın.",
      "Şüpheli link, SMS veya ödeme talebi varsa kişisel bilgi paylaşmayın.",
      "Gerekirse ilgili kurumun resmi ihbar kanalına bildirim yapın."
    ],
    riskLevel: "Orta"
  };
}
