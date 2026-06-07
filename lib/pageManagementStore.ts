"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ManagedBanner,
  ManagedCard,
  ManagedGuide,
  ManagedHomeBlock,
  ManagedNavigationItem,
  ManagedPageSettings,
  ManagedThemeSettings,
  PageManagementState
} from "@/types/pageManagement";

const storageKey = "dijital-iz-avcisi:page-management:v1";
const changedEventName = "dijital-iz-avcisi-page-management-changed";
const initialUpdatedAt = "2026-06-07T00:00:00.000Z";

const defaultHomeBlocks: ManagedHomeBlock[] = [
  {
    id: "home-block-hero",
    type: "hero",
    status: "active",
    title: "Hero",
    subtitle: "Ana vitrin alanı",
    buttonLabel: "Sorgu Paneli",
    buttonHref: "/sorgu-paneli",
    backgroundImage: "/awareness/anasayfa.png",
    icon: "shield",
    order: 10
  },
  {
    id: "home-block-announcement",
    type: "risk-notes",
    status: "active",
    title: "Dijital risk notları",
    subtitle: "Ana sayfa duyuru ve kısa risk bilgilendirme alanı",
    buttonLabel: "Detayı incele",
    buttonHref: "/sorgu-paneli",
    backgroundImage: "",
    icon: "alert",
    order: 20
  },
  {
    id: "home-block-news",
    type: "news",
    status: "active",
    title: "Güncel haberler",
    subtitle: "Kaynaklı siber güvenlik haberleri",
    buttonLabel: "Haberleri gör",
    buttonHref: "/haberler",
    backgroundImage: "/awareness/haberler.png",
    icon: "broadcast",
    order: 30
  },
  {
    id: "home-block-cyber-event",
    type: "cyber-event",
    status: "active",
    title: "Siber kırılma noktaları",
    subtitle: "Bugünün siber olayı ve tarihsel arşiv bağlantısı",
    buttonLabel: "Arşivi aç",
    buttonHref: "/siber-arsiv",
    backgroundImage: "/awareness/arsiv.png",
    icon: "timeline",
    order: 40
  },
  {
    id: "home-block-contact",
    type: "contact",
    status: "active",
    title: "İletişim / ihbar çağrısı",
    subtitle: "Şüpheli link, sahte SMS ve analiz geri bildirimi alanı",
    buttonLabel: "İletişime geç",
    buttonHref: "/iletisim",
    backgroundImage: "/awareness/iletisim.png",
    icon: "message",
    order: 50
  },
  {
    id: "home-block-guides",
    type: "guides",
    status: "active",
    title: "Rehberler",
    subtitle: "Vatandaş odaklı siber farkındalık içerikleri",
    buttonLabel: "Rehberleri oku",
    buttonHref: "/rehberler",
    backgroundImage: "/awareness/rehberler.png",
    icon: "book",
    order: 60
  },
  {
    id: "home-block-about",
    type: "about",
    status: "active",
    title: "Hakkımızda özeti",
    subtitle: "Platform vizyonu, misyonu ve hukuki güven dili",
    buttonLabel: "Hakkımızda",
    buttonHref: "/hakkimizda",
    backgroundImage: "/awareness/Hakkımızda.png",
    icon: "network",
    order: 70
  }
];

const defaultCards: ManagedCard[] = [
  {
    id: "card-site-safety",
    type: "security",
    title: "Site Güvenlik Kontrolü",
    description: "Domain, SSL, DNS ve mail güvenliği sinyallerini sade rapora dönüştürür.",
    icon: "globe",
    backgroundColor: "#0f172a",
    backgroundImage: "",
    buttonLabel: "Sorgula",
    buttonHref: "/sorgu-paneli?module=site",
    status: "active",
    order: 10,
    tag: "Aktif MVP",
    featured: true
  },
  {
    id: "card-phishing",
    type: "security",
    title: "Phishing Kontrolü",
    description: "URL, marka taklidi ve kısa link örüntülerini temkinli dille değerlendirir.",
    icon: "hook",
    backgroundColor: "#0b1120",
    backgroundImage: "",
    buttonLabel: "Kontrol et",
    buttonHref: "/sorgu-paneli?module=phishing",
    status: "active",
    order: 20,
    tag: "Aktif MVP",
    featured: false
  }
];

const defaultBanners: ManagedBanner[] = [
  {
    id: "banner-phishing-awareness",
    title: "Oltalama Uyarısı",
    description: "Marka taklidi yapan linklere karşı adres çubuğunu kontrol edin.",
    altText: "Oltalama uyarısı farkındalık afişi",
    category: "Oltalama",
    imageUrl: "/awareness/phishing-awareness.png",
    format: "png",
    status: "active",
    order: 10,
    pageKey: "home"
  }
];

const defaultGuides: ManagedGuide[] = [
  {
    id: "guide-fake-site",
    title: "Sahte site nasıl anlaşılır?",
    summary: "Alan adı, SSL ve ödeme sayfası sinyallerini sade kontrol listesiyle inceleyin.",
    body: "Sahte site riskini değerlendirirken alan adını, SSL sertifikasını, iletişim bilgilerini ve ödeme akışını birlikte kontrol edin.",
    coverImage: "/awareness/rehberler.png",
    category: "Siber Farkındalık",
    tags: "sahte site, phishing, güvenli alışveriş",
    readingTime: "4 dk",
    status: "active",
    order: 10,
    featured: true
  }
];

const defaultNavigation: ManagedNavigationItem[] = [
  { id: "nav-about", label: "Hakkımızda", href: "/hakkimizda", status: "active", order: 10, openInNewTab: false, icon: "info" },
  { id: "nav-archive", label: "Siber Arşiv", href: "/siber-arsiv", status: "active", order: 20, openInNewTab: false, icon: "archive" },
  { id: "nav-news", label: "Haberler", href: "/haberler", status: "active", order: 30, openInNewTab: false, icon: "broadcast" },
  { id: "nav-query", label: "Sorgu Paneli", href: "/sorgu-paneli", status: "active", order: 40, openInNewTab: false, icon: "search" },
  { id: "nav-tools", label: "Dijital Araç Merkezi", href: "/dijital-arac-merkezi", status: "active", order: 50, openInNewTab: false, icon: "tool" },
  { id: "nav-guides", label: "Rehberler", href: "/rehberler", status: "active", order: 60, openInNewTab: false, icon: "book" }
];

const defaultTheme: ManagedThemeSettings = {
  siteName: "Dijital İz Avcısı",
  logoText: "Dijital İz Avcısı",
  primaryColor: "#22d3ee",
  secondaryColor: "#10b981",
  backgroundTheme: "/awareness/genelarkaplantema.png",
  cardStyle: "Koyu cam efektli cyber kart",
  heroBackgroundImage: "/awareness/anasayfa.png",
  pageBackgroundImage: "/awareness/genelarkaplantema.png",
  footerText: "Platform bilgilendirme amacıyla risk sinyalleri üretir; kesin hüküm veya suç isnadı oluşturmaz.",
  supportEmail: "iletisim@dijitalizavcisi.com",
  reportEmail: "iletisim@dijitalizavcisi.com"
};

const defaultPages: ManagedPageSettings[] = [
  {
    id: "page-home",
    pageKey: "home",
    title: "Ana Sayfa",
    description: "Dijital riskleri sade raporlara dönüştüren ana vitrin.",
    heroTitle: "Dijital tehditleri sade risk sinyallerine dönüştür.",
    heroDescription: "Sahte site, phishing link, riskli satıcı ve şüpheli SMS sinyallerini herkesin anlayacağı raporlara çevirir.",
    heroImage: "/awareness/anasayfa.png",
    seoTitle: "Dijital İz Avcısı | AI destekli dijital güvenlik platformu",
    seoDescription: "Alışveriş linkleri, satıcı sinyalleri ve dijital risk göstergelerini analiz eden farkındalık platformu.",
    status: "active",
    activeBlockIds: defaultHomeBlocks.map((block) => block.id),
    cardIds: defaultCards.map((card) => card.id)
  },
  {
    id: "page-about",
    pageKey: "about",
    title: "Hakkımızda",
    description: "Platform vizyonu, misyonu ve güvenli dil yaklaşımı.",
    heroTitle: "Siber farkındalık için sade risk analizi.",
    heroDescription: "Dijital İz Avcısı, vatandaş odaklı güvenlik farkındalığı üretir.",
    heroImage: "/awareness/Hakkımızda.png",
    seoTitle: "Hakkımızda | Dijital İz Avcısı",
    seoDescription: "Dijital İz Avcısı platformunun amacı, vizyonu ve hukuki bilgilendirme yaklaşımı.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-archive",
    pageKey: "archive",
    title: "Siber Arşiv",
    description: "Siber olay geçmişi ve kırılma noktaları.",
    heroTitle: "Siber Kırılma Noktaları",
    heroDescription: "Dijital güvenlik tarihindeki önemli olayları kaynaklı ve sade bir dille inceleyin.",
    heroImage: "/awareness/arsiv.png",
    seoTitle: "Siber Arşiv | Dijital İz Avcısı",
    seoDescription: "Siber güvenlik tarihindeki önemli olaylar, veri sızıntıları ve dijital tehdit arşivi.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-news",
    pageKey: "news",
    title: "Haberler",
    description: "Kaynaklı siber güvenlik haberleri.",
    heroTitle: "Kaynaklı siber güvenlik haberleri",
    heroDescription: "Dijital dolandırıcılık, oltalama ve siber güvenlik gündemini sade özetlerle takip edin.",
    heroImage: "/awareness/haberler.png",
    seoTitle: "Güncel Siber Haberler | Dijital İz Avcısı",
    seoDescription: "Siber güvenlik ve dijital dolandırıcılık haberleri için kaynaklı haber merkezi.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-query",
    pageKey: "query",
    title: "Sorgu Paneli",
    description: "Ürün, site, phishing, IP, EXIF ve SMS analiz laboratuvarı.",
    heroTitle: "Analiz türünü seç ve sorguyu başlat.",
    heroDescription: "Sorgu panelindeki analiz modülleri sade risk raporları üretir.",
    heroImage: "/awareness/sorgu-paneli-reference.png",
    seoTitle: "Sorgu Paneli | Dijital İz Avcısı",
    seoDescription: "Site güvenliği, phishing, IP istihbaratı, ürün ve mesaj analizi için sorgu paneli.",
    status: "active",
    activeBlockIds: [],
    cardIds: defaultCards.map((card) => card.id)
  },
  {
    id: "page-tools",
    pageKey: "tools",
    title: "Dijital Araç Merkezi",
    description: "Dijital güvenlik araçları ve hızlı erişim paneli.",
    heroTitle: "Dijital güvenlik araçları tek merkezde.",
    heroDescription: "Sahte link, domain, QR ve metadata kontrolleri için modüler araç vitrini.",
    heroImage: "/awareness/Dijital Arac Merkezi.png",
    seoTitle: "Dijital Araç Merkezi | Dijital İz Avcısı",
    seoDescription: "Dijital risk kontrolü için araç merkezi ve güvenlik servisleri vitrini.",
    status: "active",
    activeBlockIds: [],
    cardIds: defaultCards.map((card) => card.id)
  },
  {
    id: "page-guides",
    pageKey: "guides",
    title: "Rehberler",
    description: "Siber farkındalık ve güvenli internet rehberleri.",
    heroTitle: "Güvenlik bilgisi herkes için.",
    heroDescription: "Teknik tehditleri sade ve uygulanabilir rehberlere dönüştüren eğitim alanı.",
    heroImage: "/awareness/rehberler.png",
    seoTitle: "Rehberler | Dijital İz Avcısı",
    seoDescription: "Sahte site, riskli SMS, fake yorum ve hesap güvenliği için sade rehberler.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-contact",
    pageKey: "contact",
    title: "İletişim",
    description: "İletişim, ihbar, öneri ve iş birliği talepleri.",
    heroTitle: "Güvenli iletişim merkezi.",
    heroDescription: "Şüpheli link, sahte SMS, hatalı analiz ve iş birliği taleplerini paylaşın.",
    heroImage: "/awareness/iletisim.png",
    seoTitle: "İletişim | Dijital İz Avcısı",
    seoDescription: "Dijital İz Avcısı iletişim, ihbar, öneri ve iş birliği kanalı.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  }
];

export const defaultPageManagementState: PageManagementState = {
  version: 1,
  updatedAt: initialUpdatedAt,
  homeBlocks: defaultHomeBlocks,
  cards: defaultCards,
  banners: defaultBanners,
  guides: defaultGuides,
  navigation: defaultNavigation,
  theme: defaultTheme,
  pages: defaultPages
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function byOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function normalizeState(value: Partial<PageManagementState> | null | undefined): PageManagementState {
  if (!value || typeof value !== "object") return defaultPageManagementState;

  return {
    ...defaultPageManagementState,
    ...value,
    version: 1,
    updatedAt: value.updatedAt ?? defaultPageManagementState.updatedAt,
    homeBlocks: Array.isArray(value.homeBlocks) ? byOrder(value.homeBlocks) : defaultHomeBlocks,
    cards: Array.isArray(value.cards) ? byOrder(value.cards) : defaultCards,
    banners: Array.isArray(value.banners) ? byOrder(value.banners) : defaultBanners,
    guides: Array.isArray(value.guides) ? byOrder(value.guides) : defaultGuides,
    navigation: Array.isArray(value.navigation) ? byOrder(value.navigation) : defaultNavigation,
    theme: { ...defaultTheme, ...(value.theme ?? {}) },
    pages: Array.isArray(value.pages) ? value.pages : defaultPages
  };
}

export function getPageManagementState(): PageManagementState {
  if (!canUseStorage()) return defaultPageManagementState;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultPageManagementState;
    return normalizeState(JSON.parse(raw) as Partial<PageManagementState>);
  } catch {
    return defaultPageManagementState;
  }
}

export function savePageManagementState(state: PageManagementState) {
  const nextState = normalizeState({
    ...state,
    updatedAt: new Date().toISOString()
  });

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    window.dispatchEvent(new Event(changedEventName));
  }

  // TODO: Supabase/PostgreSQL tablolarına taşınırken bu store servis katmanına ayrılacak.
  // TODO: Görsel URL alanları Supabase Storage veya Hostinger storage ile değiştirilecek.
  // TODO: Değişiklik geçmişi için kim, neyi, eski/yeni değer ve IP kaydı tutulacak.
  return nextState;
}

export function resetPageManagementState() {
  const nextState = {
    ...defaultPageManagementState,
    updatedAt: new Date().toISOString()
  };

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    window.dispatchEvent(new Event(changedEventName));
  }

  return nextState;
}

export function createHomeBlock(order: number): ManagedHomeBlock {
  return {
    id: uid("home-block"),
    type: "footer-cta",
    status: "active",
    title: "Yeni blok",
    subtitle: "Bu alanı düzenleyerek ana sayfa blok yönetimine ekleyin.",
    buttonLabel: "Detayı aç",
    buttonHref: "/",
    backgroundImage: "",
    icon: "spark",
    order
  };
}

export function createManagedCard(order: number): ManagedCard {
  return {
    id: uid("card"),
    type: "custom",
    title: "Yeni kart",
    description: "Kart açıklamasını buradan yönetin.",
    icon: "square",
    backgroundColor: "#0f172a",
    backgroundImage: "",
    buttonLabel: "İncele",
    buttonHref: "/",
    status: "active",
    order,
    tag: "Yeni",
    featured: false
  };
}

export function createManagedBanner(order: number): ManagedBanner {
  return {
    id: uid("banner"),
    title: "Yeni afiş",
    description: "Afiş açıklamasını buradan yönetin.",
    altText: "Dijital güvenlik afişi",
    category: "Farkındalık",
    imageUrl: "",
    format: "url",
    status: "active",
    order,
    pageKey: "home"
  };
}

export function createManagedGuide(order: number): ManagedGuide {
  return {
    id: uid("guide"),
    title: "Yeni rehber",
    summary: "Rehberin kısa açıklamasını yazın.",
    body: "Rehber içeriği burada yönetilir.",
    coverImage: "",
    category: "Siber Farkındalık",
    tags: "güvenlik, farkındalık",
    readingTime: "3 dk",
    status: "active",
    order,
    featured: false
  };
}

export function createNavigationItem(order: number): ManagedNavigationItem {
  return {
    id: uid("nav"),
    label: "Yeni menü",
    href: "/",
    status: "active",
    order,
    openInNewTab: false,
    icon: "link"
  };
}

export function usePageManagementState() {
  const [state, setState] = useState<PageManagementState>(() => getPageManagementState());

  useEffect(() => {
    const refresh = () => setState(getPageManagementState());

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEventName, refresh);
    };
  }, []);

  return useMemo(() => state, [state]);
}
