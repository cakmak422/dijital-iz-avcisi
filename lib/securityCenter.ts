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
    title: "Sahte kargo SMS uyarisi",
    category: "Dolandiricilik uyarisi",
    risk: "high",
    badge: "Bugunun riski",
    content:
      "Kargo bekletiliyor, teslimat icin odeme gerekiyor veya adres dogrulama isteniyor gibi mesajlarda linke tiklamadan once resmi kargo uygulamasini kontrol edin.",
    imageLabel: "Kargo SMS"
  },
  {
    title: "Fake e-Devlet sayfalari",
    category: "Phishing paterni",
    risk: "medium",
    badge: "Dikkat",
    content:
      "Resmi kurum taklidi yapan alan adlari kullanici bilgisi toplamayi hedefleyebilir. Alan adinin turkiye.gov.tr ile birebir uyumlu oldugunu kontrol edin.",
    imageLabel: "Resmi alan adi"
  },
  {
    title: "Guvenli alisveris kontrolu",
    category: "Alisveris guvenligi",
    risk: "low",
    badge: "Oneri",
    content:
      "Satin almadan once satici puani, yorum yogunlugu, iade sikayetleri ve fiyat anomalilerini birlikte degerlendirin.",
    imageLabel: "Kontrol listesi"
  }
];

export function getFeaturedSecurityNotice() {
  return securityNotices[0];
}
