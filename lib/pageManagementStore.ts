"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultAwarenessBanners } from "@/lib/awarenessBanners";
import type {
  ManagedBanner,
  ManagedCard,
  ManagedGuide,
  ManagedHomeBlock,
  ManagedNavigationItem,
  ManagedPageKey,
  ManagedPageSettings,
  ManagedThemeSettings,
  PageManagementState
} from "@/types/pageManagement";

const storageKey = "dijital-iz-avcisi:page-management:v1";
const changedEventName = "dijital-iz-avcisi-page-management-changed";
const initialUpdatedAt = "2026-06-07T00:00:00.000Z";

const pageSlugMap: Record<string, ManagedPageKey> = {
  hakkimizda: "about",
  "hakkımızda": "about",
  "siber-arsiv": "archive",
  "siber-arşiv": "archive",
  haberler: "news",
  "sorgu-paneli": "query",
  "dijital-arac-merkezi": "tools",
  "dijital-araç-merkezi": "tools",
  rehberler: "guides"
};

export type ManagedPageTextFallback = {
  description: string;
  title: string;
};

export type ManagedPageHeroFallback = {
  description: string;
  image?: string;
  title: string;
};

export type ManagedPageHeroContent = ManagedPageHeroFallback & {
  pageDescription: string;
  pageTitle: string;
  seoDescription: string;
  seoTitle: string;
};

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

const defaultBanners: ManagedBanner[] = defaultAwarenessBanners;

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
    slug: "",
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
    slug: "hakkimizda",
    title: "Hakkımızda",
    description: "Platform vizyonu, misyonu ve güvenli dil yaklaşımı.",
    heroTitle: "Güvenilir dijital analiz için sade ve sorumlu teknoloji.",
    heroDescription:
      "Dijital İz Avcısı; alışveriş güvenliği, siber farkındalık ve risk sinyallerini halkın anlayabileceği sade raporlara dönüştürmek için geliştirilen kurumsal bir platformdur.",
    heroImage: "/awareness/Hakkımızda.png",
    seoTitle: "Hakkımızda | Dijital İz Avcısı",
    seoDescription: "Dijital İz Avcısı platformunun amacı, vizyonu ve hukuki bilgilendirme yaklaşımı.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-guides",
    pageKey: "guides",
    slug: "rehberler",
    title: "Rehberler",
    description: "Siber farkındalık ve güvenli internet rehberleri.",
    heroTitle: "Güvenlik bilgisi herkes için.",
    heroDescription: "Teknik tehditleri sade, uygulanabilir ve anlaşılır rehberlere dönüştüren siber farkındalık alanı.",
    heroImage: "/awareness/rehberler.png",
    seoTitle: "Rehberler | Dijital İz Avcısı",
    seoDescription: "Sahte site, riskli SMS, fake yorum ve hesap güvenliği için sade rehberler.",
    status: "active",
    activeBlockIds: [],
    cardIds: []
  },
  {
    id: "page-archive",
    pageKey: "archive",
    slug: "siber-arsiv",
    title: "Siber Arşiv",
    description: "Siber olay geçmişi ve kırılma noktaları.",
    heroTitle: "Siber Kırılma Noktaları",
    heroDescription: "Tarihte iz bırakan siber olayları; kaynak, etki ve güvenlik dersiyle birlikte sade bir arşivde topluyoruz.",
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
    slug: "haberler",
    title: "Güncel Siber Haberler",
    description: "Kaynaklı siber güvenlik haberleri.",
    heroTitle: "Kaynaklı siber güvenlik haberleri.",
    heroDescription: "Haberler kaynak başlığı korunarak, metin birebir kopyalanmadan vatandaş için sade risk notuna dönüştürülür.",
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
    slug: "sorgu-paneli",
    title: "Sorgu Paneli",
    description: "Ürün, site, phishing, IP, EXIF ve SMS analiz laboratuvarı.",
    heroTitle: "Analiz türünü seç ve sorguyu başlat.",
    heroDescription: "Ürün analizi, phishing kontrolü, site güvenliği, IP istihbaratı, EXIF ve SMS analizi aynı profesyonel rapor formatında toplanır.",
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
    slug: "dijital-arac-merkezi",
    title: "Dijital Araç Merkezi",
    description: "Dijital güvenlik araçları ve hızlı erişim paneli.",
    heroTitle: "Tek panelden güvenlik kontrolleri.",
    heroDescription:
      "Link, domain, QR, veri sızıntısı ve mahremiyet kontrollerini planlı bir servis merkezi altında topluyoruz. İlk hedef kalabalık bir link listesi değil, güvenilir ve sade araç deneyimi.",
    heroImage: "/awareness/Dijital Arac Merkezi.png",
    seoTitle: "Dijital Araç Merkezi | Dijital İz Avcısı",
    seoDescription: "Dijital risk kontrolü için araç merkezi ve güvenlik servisleri vitrini.",
    status: "active",
    activeBlockIds: [],
    cardIds: defaultCards.map((card) => card.id)
  },
  {
    id: "page-contact",
    pageKey: "contact",
    slug: "iletisim",
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

function normalizePages(pages: ManagedPageSettings[]) {
  const storedByKey = new Map(pages.map((page) => [page.pageKey, page]));

  return defaultPages.map((fallback) => {
    const stored = storedByKey.get(fallback.pageKey);
    return stored
      ? {
          ...fallback,
          ...stored,
          id: fallback.id,
          pageKey: fallback.pageKey,
          slug: fallback.slug,
          activeBlockIds: Array.isArray(stored.activeBlockIds) ? stored.activeBlockIds : fallback.activeBlockIds,
          cardIds: Array.isArray(stored.cardIds) ? stored.cardIds : fallback.cardIds
        }
      : fallback;
  });
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
    pages: Array.isArray(value.pages) ? normalizePages(value.pages) : defaultPages
  };
}

function resolvePageKey(slug: string): ManagedPageKey | null {
  const normalized = slug.trim().toLocaleLowerCase("tr-TR").replace(/^\/+|\/+$/g, "");
  return pageSlugMap[normalized] ?? null;
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

export function getManagedPageBySlug(slug: string): ManagedPageSettings | null {
  const pageKey = resolvePageKey(slug);
  if (!pageKey) return null;

  return getPageManagementState().pages.find((page) => page.pageKey === pageKey) ?? null;
}

export function getManagedPageText(slug: string, fallback: ManagedPageTextFallback): ManagedPageTextFallback {
  const page = getManagedPageBySlug(slug);
  if (!page || page.status !== "active") return fallback;

  return {
    title: page.title || fallback.title,
    description: page.description || fallback.description
  };
}

export function getManagedPageHero(slug: string, fallback: ManagedPageHeroFallback): ManagedPageHeroContent {
  const page = getManagedPageBySlug(slug);
  if (!page || page.status !== "active") {
    return {
      ...fallback,
      pageTitle: fallback.title,
      pageDescription: fallback.description,
      seoTitle: fallback.title,
      seoDescription: fallback.description
    };
  }

  return {
    title: page.heroTitle || page.title || fallback.title,
    description: page.heroDescription || page.description || fallback.description,
    image: page.heroImage || fallback.image,
    pageTitle: page.title || fallback.title,
    pageDescription: page.description || fallback.description,
    seoTitle: page.seoTitle || page.title || fallback.title,
    seoDescription: page.seoDescription || page.description || fallback.description
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

export function useManagedPageHero(slug: string, fallback: ManagedPageHeroFallback) {
  const [hero, setHero] = useState<ManagedPageHeroContent>(() => ({
    ...fallback,
    pageTitle: fallback.title,
    pageDescription: fallback.description,
    seoTitle: fallback.title,
    seoDescription: fallback.description
  }));

  useEffect(() => {
    const refresh = () => setHero(getManagedPageHero(slug, fallback));

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEventName, refresh);
    };
  }, [fallback.description, fallback.image, fallback.title, slug]);

  return hero;
}
