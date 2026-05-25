export type ContentRiskLevel = "safe" | "caution" | "risk" | "info";
export type ContentStatus = "published" | "draft" | "scheduled";

export type PlatformContentItem = {
  id: string;
  title: string;
  category: string;
  summary: string;
  riskLevel: ContentRiskLevel;
  date: string;
  image: string;
  sourceLabel: string;
  status: ContentStatus;
};

export const categories = [
  "Siber Gündem",
  "Siber Arşiv",
  "Duyurular",
  "Alışveriş Güvenliği",
  "Dijital Farkındalık"
];

export const posts: PlatformContentItem[] = [
  {
    id: "post-sahte-kargo-sms",
    title: "Sahte kargo SMS'lerinde artış sinyali",
    category: "Siber Gündem",
    summary:
      "Kargo bekletme ve küçük ödeme talebi içeren mesajlarda linke tıklamadan önce resmi uygulamadan kontrol yapılması önerilir.",
    riskLevel: "risk",
    date: "2026-05-24",
    image: "/logo.png",
    sourceLabel: "Dijital İz Avcısı gözlem notu",
    status: "published"
  },
  {
    id: "post-fake-edevlet",
    title: "Resmi kurum alan adına benzeyen sayfalara dikkat",
    category: "Siber Gündem",
    summary:
      "Kurum adı içeren ancak resmi alan adıyla birebir eşleşmeyen URL'ler kimlik bilgisi toplama amacıyla kullanılabilir.",
    riskLevel: "caution",
    date: "2026-05-24",
    image: "/logo.png",
    sourceLabel: "Mock güvenlik bülteni",
    status: "published"
  },
  {
    id: "post-guvenli-alisveris",
    title: "Alışveriş öncesi satıcı ve yorum kontrolü",
    category: "Alışveriş Güvenliği",
    summary:
      "Satıcı puanı, yorum yoğunluğu, iade şikayetleri ve fiyat anomalileri birlikte değerlendirildiğinde daha sağlıklı karar verilebilir.",
    riskLevel: "info",
    date: "2026-05-24",
    image: "/logo.png",
    sourceLabel: "Platform önerisi",
    status: "published"
  }
];

export const alerts: PlatformContentItem[] = [
  {
    id: "alert-sms-code",
    title: "SMS doğrulama kodu isteyen mesajlara dikkat",
    category: "Duyurular",
    summary:
      "Hiçbir kurumun SMS doğrulama kodunuzu mesajla istememesi gerekir. Böyle bir talep risk sinyali olarak değerlendirilmelidir.",
    riskLevel: "risk",
    date: "2026-05-24",
    image: "/logo.png",
    sourceLabel: "Risk uyarısı",
    status: "published"
  }
];

export const cyberArchiveItems: PlatformContentItem[] = [
  {
    id: "archive-wannacry",
    title: "WannaCry fidye yazılımı",
    category: "Siber Arşiv",
    summary:
      "2017'de dünya genelinde birçok kurumu etkileyen fidye yazılımı olayı, yama yönetimi ve ağ segmentasyonunun önemini gösterdi.",
    riskLevel: "info",
    date: "2017-05-12",
    image: "/logo.png",
    sourceLabel: "Tarihsel olay özeti",
    status: "published"
  }
];

export const parserHealthItems = [
  {
    platform: "Trendyol",
    status: "aktif",
    lastTest: "24.05.2026 22:40",
    successRate: 86,
    note: "Temel ürün adı, satıcı, fiyat ve puan alanları okunabiliyor."
  },
  {
    platform: "Hepsiburada",
    status: "dikkat",
    lastTest: "24.05.2026 21:55",
    successRate: 68,
    note: "Dinamik içeriklerde Playwright fallback gerektirebilir."
  },
  {
    platform: "N11",
    status: "bakımda",
    lastTest: "24.05.2026 20:30",
    successRate: 52,
    note: "Selector sertleştirme ve örnek sayfa testi planlandı."
  }
];

export const aiUsageLogs = [
  { id: "ai-001", model: "openai-ready", area: "Ürün özeti", tokens: 0, status: "fallback" },
  { id: "ai-002", model: "mock-local", area: "Phishing özeti", tokens: 0, status: "mock" },
  { id: "ai-003", model: "mock-local", area: "SMS analizi", tokens: 0, status: "mock" }
];
