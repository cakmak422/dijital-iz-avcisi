export type SecurityNoticeRisk = "high" | "medium" | "low" | "info";

export type SecurityNotice = {
  title: string;
  category: string;
  risk: SecurityNoticeRisk;
  badge: string;
  content: string;
  imageLabel: string;
};

export const securityNotices: SecurityNotice[] = [
  {
    title: "Sahte kargo SMS uyarısı",
    category: "Dolandırıcılık uyarısı",
    risk: "high",
    badge: "Bugunun riski",
    content:
      "Kargo bekletiliyor, teslimat için ödeme gerekiyor veya adres doğrulama isteniyor gibi mesajlarda linke tıklamadan önce resmi kargo uygulamasını kontrol edin.",
    imageLabel: "Kargo SMS"
  },
  {
    title: "Fake e-Devlet sayfalari",
    category: "Phishing paterni",
    risk: "medium",
    badge: "Dikkat",
    content:
      "Resmi kurum taklidi yapan alan adlari kullanıcı bilgisi toplamayi hedefleyebilir. Alan adinin turkiye.gov.tr ile birebir uyumlu oldugunu kontrol edin.",
    imageLabel: "Resmi alan adi"
  },
  {
    title: "Güvenli alışveriş kontrolü",
    category: "Alışveriş güvenliği",
    risk: "low",
    badge: "Öneri",
    content:
      "Satın almadan önce satıcı puanı, yorum yoğunluğu, iade şikayetleri ve fiyat anomalilerini birlikte değerlendirin.",
    imageLabel: "Kontrol listesi"
  }
];

export function getFeaturedSecurityNotice() {
  return securityNotices[0];
}
