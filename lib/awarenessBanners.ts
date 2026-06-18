import type { ManagedBanner, ManagedPageKey } from "@/types/pageManagement";

export type AwarenessBannerScope = ManagedPageKey | "all";

export const awarenessBannersChangedEventName = "dijital-iz-avcisi-awareness-banners-changed";

export const defaultAwarenessBanners: ManagedBanner[] = [
  {
    id: "banner-phishing-awareness",
    title: "Oltalama Uyarısı",
    description: "Marka taklidi yapan bağlantılara karşı adres çubuğunu ve alan adını kontrol edin.",
    altText: "Oltalama uyarısı farkındalık afişi",
    category: "Oltalama",
    imageUrl: "/awareness/phishing-awareness.png",
    format: "png",
    status: "active",
    order: 10,
    pageKey: "home"
  },
  {
    id: "banner-illegal-betting-awareness",
    title: "Yasa Dışı Sanal Bahislere Karşı Farkındalık",
    description: "Yüksek kazanç vaadi, hızlı para baskısı ve kimlik bilgisi isteyen bahis bağlantılarına karşı dikkatli olun.",
    altText: "Yasa dışı sanal bahis farkındalık afişi",
    category: "Yasa Dışı Bahis",
    imageUrl: "/awareness/afistema.png",
    format: "png",
    status: "active",
    order: 20,
    pageKey: "home"
  },
  {
    id: "banner-agri-tools-fraud-awareness",
    title: "Tarım Aletleri Dolandırıcılığı",
    description: "Piyasanın çok altında fiyat, kapora baskısı ve doğrulanamayan satıcı bilgileri dolandırıcılık sinyali olabilir.",
    altText: "Tarım aletleri dolandırıcılığı farkındalık afişi",
    category: "Alışveriş Güvenliği",
    imageUrl: "/awareness/genelarkaplantema.png",
    format: "png",
    status: "active",
    order: 30,
    pageKey: "home"
  }
];

export function filterAwarenessBannersByScope(banners: ManagedBanner[], scope: AwarenessBannerScope = "home") {
  return [...banners]
    .filter((banner) => banner.status === "active")
    .filter((banner) => scope === "all" || banner.pageKey === scope)
    .sort((first, second) => first.order - second.order);
}
