/**
 * pageManagementDb.ts — Supabase page_management_* tabloları için CRUD.
 * SADECE sunucu ortamında çalışır.
 * Supabase erişilemezse her fonksiyon default değerlere graceful fallback yapar.
 */

import type {
  ManagedHomeBlock,
  ManagedCard,
  ManagedGuide,
  ManagedNavigationItem,
  ManagedPageKey,
  ManagedPageSettings,
  ManagedThemeSettings,
  PageManagementState,
} from "@/types/pageManagement";

// NOT: defaultPageManagementState store'dan import EDİLMEZ (server/client boundary sorunu)
// Fallback ihtiyacı olan fonksiyonlar için dynamic import kullanılır

export const PAGE_MGMT_CACHE_TAG = "page-management";

// ── Supabase fetch ────────────────────────────────────────────────────────────

function getSupabase() {
  const url        = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !serviceKey) throw new Error("Supabase yapılandırması eksik.");
  return { url, serviceKey };
}

async function sbFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    nextOptions?: RequestInit["next"];
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { url, serviceKey } = getSupabase();
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type":  "application/json",
    "apikey":        serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    // Varsayılan Prefer — options.headers ile override edilebilmesi için önce tanımlanır
    ...(method !== "GET" ? { "Prefer": "return=representation" } : {}),
    ...(options.headers ?? {}),
  };

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      next: options.nextOptions,
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { /* ignore */ }
      return { data: null, error: msg };
    }
    if (!text) return { data: null, error: null };
    return { data: JSON.parse(text) as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ── Tip dönüştürücüler ────────────────────────────────────────────────────────

type DbTheme = {
  site_name: string; logo_text: string;
  primary_color: string; secondary_color: string;
  background_theme: string; card_style: string;
  hero_background_image: string; page_background_image: string;
  footer_text: string; support_email: string; report_email: string;
  font_pairing: string; size_scale: string; radius_style: string; spacing_style: string;
  site_hero_title: string; site_hero_subtitle: string;
};

type DbBlock = {
  id: string; type: string; status: string; title: string; subtitle: string;
  button_label: string; button_href: string; background_image: string; icon: string; sort_order: number;
};

type DbCard = {
  id: string; type: string; title: string; description: string; icon: string;
  background_color: string; background_image: string; button_label: string; button_href: string;
  status: string; sort_order: number; tag: string; featured: boolean;
};

type DbGuide = {
  id: string; title: string; summary: string; body: string; cover_image: string;
  category: string; tags: string; reading_time: string; status: string; sort_order: number; featured: boolean;
};

type DbNav = {
  id: string; label: string; href: string; status: string;
  sort_order: number; open_in_new_tab: boolean; icon: string;
};

type DbPage = {
  page_key: string; slug: string; title: string; description: string;
  hero_title: string; hero_description: string; hero_image: string;
  seo_title: string; seo_description: string; status: string;
  active_block_ids: string[]; card_ids: string[];
};

function dbToTheme(db: DbTheme): ManagedThemeSettings {
  return {
    siteName: db.site_name, logoText: db.logo_text,
    primaryColor: db.primary_color, secondaryColor: db.secondary_color,
    backgroundTheme: db.background_theme, cardStyle: db.card_style,
    heroBackgroundImage: db.hero_background_image,
    pageBackgroundImage: db.page_background_image,
    footerText: db.footer_text, supportEmail: db.support_email, reportEmail: db.report_email,
    fontPairing: db.font_pairing as ManagedThemeSettings["fontPairing"],
    sizeScale: db.size_scale as ManagedThemeSettings["sizeScale"],
    radiusStyle: db.radius_style as ManagedThemeSettings["radiusStyle"],
    spacingStyle: db.spacing_style as ManagedThemeSettings["spacingStyle"],
    siteHeroTitle: db.site_hero_title, siteHeroSubtitle: db.site_hero_subtitle,
  };
}

function dbToBlock(db: DbBlock): ManagedHomeBlock {
  return {
    id: db.id, type: db.type as ManagedHomeBlock["type"],
    status: db.status as ManagedHomeBlock["status"],
    title: db.title, subtitle: db.subtitle,
    buttonLabel: db.button_label, buttonHref: db.button_href,
    backgroundImage: db.background_image,
    icon: db.icon as ManagedHomeBlock["icon"], order: db.sort_order,
  };
}

function dbToCard(db: DbCard): ManagedCard {
  return {
    id: db.id, type: db.type as ManagedCard["type"],
    title: db.title, description: db.description, icon: db.icon,
    backgroundColor: db.background_color, backgroundImage: db.background_image,
    buttonLabel: db.button_label, buttonHref: db.button_href,
    status: db.status as ManagedCard["status"], order: db.sort_order,
    tag: db.tag, featured: db.featured,
  };
}

function dbToGuide(db: DbGuide): ManagedGuide {
  return {
    id: db.id, title: db.title, summary: db.summary, body: db.body,
    coverImage: db.cover_image, category: db.category, tags: db.tags,
    readingTime: db.reading_time, status: db.status as ManagedGuide["status"],
    order: db.sort_order, featured: db.featured,
  };
}

function dbToNav(db: DbNav): ManagedNavigationItem {
  return {
    id: db.id, label: db.label, href: db.href,
    status: db.status as ManagedNavigationItem["status"],
    order: db.sort_order, openInNewTab: db.open_in_new_tab,
    icon: db.icon as ManagedNavigationItem["icon"],
  };
}

function dbToPage(db: DbPage): ManagedPageSettings {
  return {
    id:               `page-${db.page_key}`,
    pageKey:          db.page_key as ManagedPageKey,
    slug:             db.slug,
    title:            db.title, description: db.description,
    heroTitle:        db.hero_title, heroDescription: db.hero_description, heroImage: db.hero_image,
    seoTitle:         db.seo_title, seoDescription: db.seo_description,
    status:           db.status as ManagedPageSettings["status"],
    activeBlockIds:   db.active_block_ids ?? [],
    cardIds:          db.card_ids ?? [],
  };
}

// ── Ana okuma fonksiyonu ──────────────────────────────────────────────────────

/**
 * Tüm page management verisini tek seferde çeker.
 * Cache: tag "page-management", 1 saatlik fallback.
 * Herhangi bir tablo hata verirse o bölüm için default kullanılır (graceful fallback).
 */
export async function getAllPageManagementData(): Promise<PageManagementState> {
  const cacheOpts = { nextOptions: { tags: [PAGE_MGMT_CACHE_TAG], revalidate: 3600 } };

  const [themeRes, blocksRes, cardsRes, guidesRes, navRes, pagesRes] = await Promise.allSettled([
    sbFetch<DbTheme[]>   ("page_management_theme?select=*&limit=1",                         cacheOpts),
    sbFetch<DbBlock[]>   ("page_management_blocks?select=*&order=sort_order.asc",           cacheOpts),
    sbFetch<DbCard[]>    ("page_management_cards?select=*&order=sort_order.asc",            cacheOpts),
    sbFetch<DbGuide[]>   ("page_management_guides?select=*&order=sort_order.asc",           cacheOpts),
    sbFetch<DbNav[]>     ("page_management_nav?select=*&order=sort_order.asc",              cacheOpts),
    sbFetch<DbPage[]>    ("page_management_pages?select=*&order=page_key.asc",              cacheOpts),
  ]);

  // Fallback için store'u dynamic import (server/client boundary'yi aşmak için)
  const { defaultPageManagementState: D } = await import("@/lib/pageManagementStore");

  const theme = (themeRes.status === "fulfilled" && !themeRes.value.error && themeRes.value.data?.[0])
    ? dbToTheme(themeRes.value.data[0]) : D.theme;

  const blocks = (blocksRes.status === "fulfilled" && !blocksRes.value.error && blocksRes.value.data?.length)
    ? blocksRes.value.data.map(dbToBlock) : D.homeBlocks;

  const cards = (cardsRes.status === "fulfilled" && !cardsRes.value.error && cardsRes.value.data?.length)
    ? cardsRes.value.data.map(dbToCard) : D.cards;

  const guides = (guidesRes.status === "fulfilled" && !guidesRes.value.error && guidesRes.value.data?.length)
    ? guidesRes.value.data.map(dbToGuide) : D.guides;

  const navigation = (navRes.status === "fulfilled" && !navRes.value.error && navRes.value.data?.length)
    ? navRes.value.data.map(dbToNav) : D.navigation;

  const pages = (pagesRes.status === "fulfilled" && !pagesRes.value.error && pagesRes.value.data?.length)
    ? pagesRes.value.data.map(dbToPage) : D.pages;

  return {
    version:    1,
    updatedAt:  new Date().toISOString(),
    homeBlocks: blocks,
    cards,
    banners:    D.banners, // banners zaten Supabase'de (awarenessBannersDb), bu taşımanın dışında
    guides,
    navigation,
    theme,
    pages,
  };
}

// ── Tema yazma ────────────────────────────────────────────────────────────────

export async function updateTheme(
  patch: Partial<ManagedThemeSettings>
): Promise<{ error: string | null }> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.siteName             !== undefined) body.site_name              = patch.siteName;
  if (patch.logoText             !== undefined) body.logo_text              = patch.logoText;
  if (patch.primaryColor         !== undefined) body.primary_color          = patch.primaryColor;
  if (patch.secondaryColor       !== undefined) body.secondary_color        = patch.secondaryColor;
  if (patch.backgroundTheme      !== undefined) body.background_theme       = patch.backgroundTheme;
  if (patch.cardStyle            !== undefined) body.card_style             = patch.cardStyle;
  if (patch.heroBackgroundImage  !== undefined) body.hero_background_image  = patch.heroBackgroundImage;
  if (patch.pageBackgroundImage  !== undefined) body.page_background_image  = patch.pageBackgroundImage;
  if (patch.footerText           !== undefined) body.footer_text            = patch.footerText;
  if (patch.supportEmail         !== undefined) body.support_email          = patch.supportEmail;
  if (patch.reportEmail          !== undefined) body.report_email           = patch.reportEmail;
  if (patch.fontPairing          !== undefined) body.font_pairing           = patch.fontPairing;
  if (patch.sizeScale            !== undefined) body.size_scale             = patch.sizeScale;
  if (patch.radiusStyle          !== undefined) body.radius_style           = patch.radiusStyle;
  if (patch.spacingStyle         !== undefined) body.spacing_style          = patch.spacingStyle;
  if (patch.siteHeroTitle        !== undefined) body.site_hero_title        = patch.siteHeroTitle;
  if (patch.siteHeroSubtitle     !== undefined) body.site_hero_subtitle     = patch.siteHeroSubtitle;

  const { error } = await sbFetch("page_management_theme?id=eq.1", {
    method: "PATCH", body,
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Blok yazma ────────────────────────────────────────────────────────────────

export async function upsertBlock(block: ManagedHomeBlock): Promise<{ error: string | null }> {
  const { error } = await sbFetch("page_management_blocks", {
    method: "POST",
    body: {
      id: block.id, type: block.type, status: block.status,
      title: block.title, subtitle: block.subtitle,
      button_label: block.buttonLabel, button_href: block.buttonHref,
      background_image: block.backgroundImage, icon: block.icon,
      sort_order: block.order, updated_at: new Date().toISOString(),
    },
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}

export async function upsertBlocks(blocks: ManagedHomeBlock[]): Promise<{ error: string | null }> {
  const rows = blocks.map(b => ({
    id: b.id, type: b.type, status: b.status,
    title: b.title, subtitle: b.subtitle,
    button_label: b.buttonLabel, button_href: b.buttonHref,
    background_image: b.backgroundImage, icon: b.icon,
    sort_order: b.order, updated_at: new Date().toISOString(),
  }));
  const { error } = await sbFetch("page_management_blocks", {
    method: "POST", body: rows,
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}

export async function deleteBlocks(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null };
  const list = ids.map(id => `"${id}"`).join(",");
  const { error } = await sbFetch(`page_management_blocks?id=in.(${list})`, {
    method: "DELETE",
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Kart yazma ────────────────────────────────────────────────────────────────

export async function upsertCards(cards: ManagedCard[]): Promise<{ error: string | null }> {
  const rows = cards.map(c => ({
    id: c.id, type: c.type, title: c.title, description: c.description, icon: c.icon,
    background_color: c.backgroundColor, background_image: c.backgroundImage,
    button_label: c.buttonLabel, button_href: c.buttonHref,
    status: c.status, sort_order: c.order, tag: c.tag, featured: c.featured,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sbFetch("page_management_cards", {
    method: "POST", body: rows,
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}

export async function deleteCards(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null };
  const list = ids.map(id => `"${id}"`).join(",");
  const { error } = await sbFetch(`page_management_cards?id=in.(${list})`, {
    method: "DELETE",
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Rehber yazma ─────────────────────────────────────────────────────────────

export async function upsertGuides(guides: ManagedGuide[]): Promise<{ error: string | null }> {
  const rows = guides.map(g => ({
    id: g.id, title: g.title, summary: g.summary, body: g.body,
    cover_image: g.coverImage, category: g.category, tags: g.tags,
    reading_time: g.readingTime, status: g.status, sort_order: g.order, featured: g.featured,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sbFetch("page_management_guides", {
    method: "POST", body: rows,
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}

export async function deleteGuides(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null };
  const list = ids.map(id => `"${id}"`).join(",");
  const { error } = await sbFetch(`page_management_guides?id=in.(${list})`, {
    method: "DELETE",
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Navigasyon yazma ─────────────────────────────────────────────────────────

export async function upsertNavItems(items: ManagedNavigationItem[]): Promise<{ error: string | null }> {
  const rows = items.map(n => ({
    id: n.id, label: n.label, href: n.href, status: n.status,
    sort_order: n.order, open_in_new_tab: n.openInNewTab, icon: n.icon,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sbFetch("page_management_nav", {
    method: "POST", body: rows,
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}

export async function deleteNavItems(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null };
  const list = ids.map(id => `"${id}"`).join(",");
  const { error } = await sbFetch(`page_management_nav?id=in.(${list})`, {
    method: "DELETE",
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

// ── Sayfa ayarları yazma ──────────────────────────────────────────────────────

export async function upsertPage(page: ManagedPageSettings): Promise<{ error: string | null }> {
  const { error } = await sbFetch("page_management_pages", {
    method: "POST",
    body: {
      page_key: page.pageKey, slug: page.slug, title: page.title,
      description: page.description, hero_title: page.heroTitle,
      hero_description: page.heroDescription, hero_image: page.heroImage,
      seo_title: page.seoTitle, seo_description: page.seoDescription,
      status: page.status,
      active_block_ids: page.activeBlockIds, card_ids: page.cardIds,
      updated_at: new Date().toISOString(),
    },
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
  });
  return { error };
}
