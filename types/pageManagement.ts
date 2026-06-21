export type ManagedStatus = "active" | "inactive";

export type ManagedViewport = "mobile" | "tablet" | "desktop";

export type ManagedHomeBlockType =
  | "hero"
  | "security-center"
  | "awareness"
  | "news"
  | "risk-notes"
  | "cyber-event"
  | "guides"
  | "about"
  | "contact"
  | "footer-cta";

export type ManagedCardType = "security" | "tool" | "guide" | "risk" | "footer" | "custom";

export type ManagedPageKey = "home" | "about" | "archive" | "news" | "query" | "tools" | "guides" | "contact";

export type ManagedImageFormat = "jpg" | "jpeg" | "png" | "webp" | "url";

export type ManagedHomeBlock = {
  id: string;
  type: ManagedHomeBlockType;
  status: ManagedStatus;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  backgroundImage: string;
  icon: string;
  order: number;
};

export type ManagedCard = {
  id: string;
  type: ManagedCardType;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  backgroundImage: string;
  buttonLabel: string;
  buttonHref: string;
  status: ManagedStatus;
  order: number;
  tag: string;
  featured: boolean;
};

export type ManagedBanner = {
  id: string;
  title: string;
  description: string;
  altText: string;
  category: string;
  imageUrl: string;
  format: ManagedImageFormat;
  status: ManagedStatus;
  order: number;
  pageKey: ManagedPageKey;
};

export type ManagedGuide = {
  id: string;
  title: string;
  summary: string;
  body: string;
  coverImage: string;
  category: string;
  tags: string;
  readingTime: string;
  status: ManagedStatus;
  order: number;
  featured: boolean;
};

export type ManagedNavigationItem = {
  id: string;
  label: string;
  href: string;
  status: ManagedStatus;
  order: number;
  openInNewTab: boolean;
  icon: string;
};

export type ManagedThemeSettings = {
  siteName: string;
  logoText: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundTheme: string;
  cardStyle: string;
  heroBackgroundImage: string;
  pageBackgroundImage: string;
  footerText: string;
  supportEmail: string;
  reportEmail: string;
  /** Font çifti: "system" | "mono" | "editorial" */
  fontPairing: string;
  /** Yazı boyutu ölçeği: "compact" | "normal" | "wide" */
  sizeScale: string;
  /** Köşe yuvarlaklığı: "sharp" | "soft" | "round" */
  radiusStyle: string;
  /** Bölüm/kart boşluğu: "tight" | "normal" | "airy" */
  spacingStyle: string;
  /** Ana sayfa hero başlığı (siteSettingsStore'dan taşındı) */
  siteHeroTitle: string;
  /** Ana sayfa hero alt açıklaması (siteSettingsStore'dan taşındı) */
  siteHeroSubtitle: string;
};

export type ManagedPageSettings = {
  id: string;
  pageKey: ManagedPageKey;
  slug: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  status: ManagedStatus;
  activeBlockIds: string[];
  cardIds: string[];
};

export type PageManagementState = {
  version: 1;
  updatedAt: string;
  homeBlocks: ManagedHomeBlock[];
  cards: ManagedCard[];
  banners: ManagedBanner[];
  guides: ManagedGuide[];
  navigation: ManagedNavigationItem[];
  theme: ManagedThemeSettings;
  pages: ManagedPageSettings[];
};
