export type EditableContentKey =
  | "home.hero.title"
  | "home.hero.description"
  | "home.about.text"
  | "home.cyberNews.title"
  | "home.cyberNews.description"
  | "home.securityCenter.description"
  | "home.footer.description"
  | "contact.intro.text"
  | "home.announcement.banner"
  | "home.todayCyberEvent.text";

export type EditableContent = {
  id: string;
  key: EditableContentKey;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
};

export type EditableContentGroup = {
  id: string;
  title: string;
  description: string;
  keys: EditableContentKey[];
};

export type ManagedContentStatus = "published" | "draft" | "hidden";

export type ManagedContentType =
  | "hero"
  | "navbar"
  | "stat"
  | "cyber-news"
  | "parser-health"
  | "cyber-archive"
  | "how-it-works"
  | "guide"
  | "about"
  | "contact"
  | "legal"
  | "footer"
  | "announcement"
  | "blog"
  | "banner"
  | "tool"
  | "useful-link"
  | "cyber-event-settings";

export type ManagedContentDataMode = "demo" | "real" | "hidden";

export type ManagedContentItem = {
  id: string;
  type: ManagedContentType;
  title: string;
  subtitle: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  imageUrl: string;
  altText: string;
  icon: string;
  ctaLabel: string;
  ctaHref: string;
  status: ManagedContentStatus;
  order: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  dataMode?: ManagedContentDataMode;
  value?: string;
  detail?: string;
  riskLevel?: "safe" | "caution" | "risk" | "info";
  readTime?: string;
  publishedAt?: string;
  sourceLabel?: string;
};

export type ContentAuditEvent = {
  id: string;
  action: "create" | "update" | "delete" | "hide" | "publish" | "draft" | "reset" | "feature" | "reorder";
  itemId: string;
  itemTitle: string;
  actor: string;
  createdAt: string;
};
