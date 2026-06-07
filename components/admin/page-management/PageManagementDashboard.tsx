"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createHomeBlock,
  createManagedBanner,
  createManagedCard,
  createManagedGuide,
  createNavigationItem,
  resetPageManagementState,
  savePageManagementState,
  usePageManagementState
} from "@/lib/pageManagementStore";
import type {
  ManagedBanner,
  ManagedCard,
  ManagedGuide,
  ManagedHomeBlock,
  ManagedNavigationItem,
  ManagedPageSettings,
  ManagedStatus,
  ManagedThemeSettings,
  ManagedViewport,
  PageManagementState
} from "@/types/pageManagement";

type SectionKey = "home" | "cards" | "banners" | "guides" | "navigation" | "theme" | "pages";
type SaveState = "idle" | "saved" | "reset" | "error";

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "home", label: "Ana Sayfa Blokları" },
  { key: "cards", label: "Kartlar" },
  { key: "banners", label: "Afişler" },
  { key: "guides", label: "Rehberler" },
  { key: "navigation", label: "Menü" },
  { key: "theme", label: "Tema" },
  { key: "pages", label: "Sayfalar" }
];

const statusOptions: Array<{ label: string; value: ManagedStatus }> = [
  { label: "Aktif", value: "active" },
  { label: "Pasif", value: "inactive" }
];

const viewportLabels: Array<{ label: string; value: ManagedViewport; width: string }> = [
  { label: "Mobil", value: "mobile", width: "max-w-[360px]" },
  { label: "Tablet", value: "tablet", width: "max-w-[620px]" },
  { label: "Masaüstü", value: "desktop", width: "max-w-full" }
];

export function PageManagementDashboard() {
  const storedState = usePageManagementState();
  const [draft, setDraft] = useState<PageManagementState>(storedState);
  const [activeSection, setActiveSection] = useState<SectionKey>("home");
  const [viewport, setViewport] = useState<ManagedViewport>("desktop");
  const [status, setStatus] = useState<SaveState>("idle");

  useEffect(() => {
    setDraft(storedState);
  }, [storedState.updatedAt]);

  const activeHomeBlocks = useMemo(() => {
    return draft.homeBlocks.filter((block) => block.status === "active").sort((a, b) => a.order - b.order);
  }, [draft.homeBlocks]);

  function setDirty(nextState: PageManagementState) {
    setDraft(nextState);
    setStatus("idle");
  }

  function handleSave() {
    try {
      const saved = savePageManagementState(draft);
      setDraft(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function handleReset() {
    if (!window.confirm("Sayfa yönetimi varsayılan değerlere döndürülsün mü?")) return;

    try {
      const reset = resetPageManagementState();
      setDraft(reset);
      setStatus("reset");
    } catch {
      setStatus("error");
    }
  }

  function addHomeBlock() {
    const order = nextOrder(draft.homeBlocks);
    setDirty({ ...draft, homeBlocks: [...draft.homeBlocks, createHomeBlock(order)] });
  }

  function updateHomeBlock(id: string, patch: Partial<ManagedHomeBlock>) {
    setDirty({
      ...draft,
      homeBlocks: draft.homeBlocks.map((block) => (block.id === id ? { ...block, ...patch } : block))
    });
  }

  function removeHomeBlock(id: string) {
    if (!window.confirm("Bu ana sayfa bloğu silinsin mi?")) return;
    setDirty({ ...draft, homeBlocks: draft.homeBlocks.filter((block) => block.id !== id) });
  }

  function moveHomeBlock(id: string, direction: -1 | 1) {
    setDirty({ ...draft, homeBlocks: moveItem(draft.homeBlocks, id, direction) });
  }

  function addCard() {
    setDirty({ ...draft, cards: [...draft.cards, createManagedCard(nextOrder(draft.cards))] });
  }

  function updateCard(id: string, patch: Partial<ManagedCard>) {
    setDirty({ ...draft, cards: draft.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)) });
  }

  function removeCard(id: string) {
    if (!window.confirm("Bu kart silinsin mi?")) return;
    setDirty({ ...draft, cards: draft.cards.filter((card) => card.id !== id) });
  }

  function moveCard(id: string, direction: -1 | 1) {
    setDirty({ ...draft, cards: moveItem(draft.cards, id, direction) });
  }

  function addBanner() {
    setDirty({ ...draft, banners: [...draft.banners, createManagedBanner(nextOrder(draft.banners))] });
  }

  function updateBanner(id: string, patch: Partial<ManagedBanner>) {
    setDirty({ ...draft, banners: draft.banners.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)) });
  }

  function removeBanner(id: string) {
    if (!window.confirm("Bu afiş kaydı silinsin mi?")) return;
    setDirty({ ...draft, banners: draft.banners.filter((banner) => banner.id !== id) });
  }

  function moveBanner(id: string, direction: -1 | 1) {
    setDirty({ ...draft, banners: moveItem(draft.banners, id, direction) });
  }

  function addGuide() {
    setDirty({ ...draft, guides: [...draft.guides, createManagedGuide(nextOrder(draft.guides))] });
  }

  function updateGuide(id: string, patch: Partial<ManagedGuide>) {
    setDirty({ ...draft, guides: draft.guides.map((guide) => (guide.id === id ? { ...guide, ...patch } : guide)) });
  }

  function removeGuide(id: string) {
    if (!window.confirm("Bu rehber silinsin mi?")) return;
    setDirty({ ...draft, guides: draft.guides.filter((guide) => guide.id !== id) });
  }

  function moveGuide(id: string, direction: -1 | 1) {
    setDirty({ ...draft, guides: moveItem(draft.guides, id, direction) });
  }

  function addNavigationItem() {
    setDirty({ ...draft, navigation: [...draft.navigation, createNavigationItem(nextOrder(draft.navigation))] });
  }

  function updateNavigationItem(id: string, patch: Partial<ManagedNavigationItem>) {
    setDirty({
      ...draft,
      navigation: draft.navigation.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  }

  function removeNavigationItem(id: string) {
    if (!window.confirm("Bu menü öğesi silinsin mi?")) return;
    setDirty({ ...draft, navigation: draft.navigation.filter((item) => item.id !== id) });
  }

  function moveNavigationItem(id: string, direction: -1 | 1) {
    setDirty({ ...draft, navigation: moveItem(draft.navigation, id, direction) });
  }

  function updateTheme(patch: Partial<ManagedThemeSettings>) {
    setDirty({ ...draft, theme: { ...draft.theme, ...patch } });
  }

  function updatePage(id: string, patch: Partial<ManagedPageSettings>) {
    setDirty({ ...draft, pages: draft.pages.map((page) => (page.id === id ? { ...page, ...patch } : page)) });
  }

  const viewportClass = viewportLabels.find((item) => item.value === viewport)?.width ?? "max-w-full";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="grid gap-5">
        <div className="rounded-xl border border-cyan-300/15 bg-slate-950/80 p-5 text-white shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-200">Admin CMS</p>
              <h1 className="mt-2 text-3xl font-black">Sayfa Yönetim Sistemi</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Ana sayfa blokları, kartlar, afişler, rehberler, menü ve temel sayfa ayarları localStorage tabanlı MVP olarak yönetilir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md border border-slate-600 px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10" onClick={handleReset} type="button">
                Varsayılana Dön
              </button>
              <button className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300" onClick={handleSave} type="button">
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>

          {status === "saved" ? <StatusMessage tone="success" text="Değişiklikler local CMS store içine kaydedildi." /> : null}
          {status === "reset" ? <StatusMessage tone="warning" text="Sayfa yönetimi varsayılan değerlere döndürüldü." /> : null}
          {status === "error" ? <StatusMessage tone="danger" text="Kayıt sırasında hata oluştu. LocalStorage erişimini kontrol edin." /> : null}
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-xl border border-cyan-300/15 bg-slate-950/70 p-2">
          {sections.map((section) => (
            <button
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeSection === section.key ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-cyan-300/10 hover:text-white"
              }`}
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === "home" ? (
          <Panel title="Ana Sayfa Blok Yönetimi" actionLabel="Yeni blok ekle" onAction={addHomeBlock}>
            {draft.homeBlocks.map((block, index) => (
              <HomeBlockEditor
                block={block}
                key={block.id}
                onMoveDown={() => moveHomeBlock(block.id, 1)}
                onMoveUp={() => moveHomeBlock(block.id, -1)}
                onRemove={() => removeHomeBlock(block.id)}
                onUpdate={(patch) => updateHomeBlock(block.id, patch)}
                showMoveDown={index < draft.homeBlocks.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "cards" ? (
          <Panel title="Kart Yönetimi" actionLabel="Yeni kart ekle" onAction={addCard}>
            {draft.cards.map((card, index) => (
              <CardEditor
                card={card}
                key={card.id}
                onMoveDown={() => moveCard(card.id, 1)}
                onMoveUp={() => moveCard(card.id, -1)}
                onRemove={() => removeCard(card.id)}
                onUpdate={(patch) => updateCard(card.id, patch)}
                showMoveDown={index < draft.cards.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "banners" ? (
          <Panel title="Afiş / Görsel Yönetimi" actionLabel="Yeni afiş ekle" onAction={addBanner}>
            {draft.banners.map((banner, index) => (
              <BannerEditor
                banner={banner}
                key={banner.id}
                onMoveDown={() => moveBanner(banner.id, 1)}
                onMoveUp={() => moveBanner(banner.id, -1)}
                onRemove={() => removeBanner(banner.id)}
                onUpdate={(patch) => updateBanner(banner.id, patch)}
                showMoveDown={index < draft.banners.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "guides" ? (
          <Panel title="Rehber İçerik Yönetimi" actionLabel="Yeni rehber ekle" onAction={addGuide}>
            {draft.guides.map((guide, index) => (
              <GuideEditor
                guide={guide}
                key={guide.id}
                onMoveDown={() => moveGuide(guide.id, 1)}
                onMoveUp={() => moveGuide(guide.id, -1)}
                onRemove={() => removeGuide(guide.id)}
                onUpdate={(patch) => updateGuide(guide.id, patch)}
                showMoveDown={index < draft.guides.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "navigation" ? (
          <Panel title="Menü / Navigasyon Yönetimi" actionLabel="Yeni menü ekle" onAction={addNavigationItem}>
            {draft.navigation.map((item, index) => (
              <NavigationEditor
                item={item}
                key={item.id}
                onMoveDown={() => moveNavigationItem(item.id, 1)}
                onMoveUp={() => moveNavigationItem(item.id, -1)}
                onRemove={() => removeNavigationItem(item.id)}
                onUpdate={(patch) => updateNavigationItem(item.id, patch)}
                showMoveDown={index < draft.navigation.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "theme" ? (
          <Panel title="Tema Yönetimi">
            <ThemeEditor theme={draft.theme} onUpdate={updateTheme} />
          </Panel>
        ) : null}

        {activeSection === "pages" ? (
          <Panel title="Sayfa Bazlı Yönetim">
            {draft.pages.map((page) => (
              <PageSettingsEditor key={page.id} page={page} onUpdate={(patch) => updatePage(page.id, patch)} />
            ))}
          </Panel>
        ) : null}
      </section>

      <aside className="xl:sticky xl:top-6 xl:h-fit">
        <div className="rounded-xl border border-cyan-300/15 bg-slate-950/80 p-4 text-white shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-200">Önizleme</p>
              <h2 className="mt-1 text-lg font-black">Kaydetmeden önce kontrol</h2>
            </div>
            <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100">
              Local MVP
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {viewportLabels.map((item) => (
              <button
                className={`rounded-md px-2 py-2 text-xs font-bold transition ${
                  viewport === item.value ? "bg-cyan-300 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
                key={item.value}
                onClick={() => setViewport(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={`mx-auto mt-4 overflow-hidden rounded-xl border border-cyan-300/15 bg-slate-900 ${viewportClass}`}>
            <div className="border-b border-cyan-300/10 px-4 py-3">
              <p className="text-sm font-black">{draft.theme.siteName}</p>
              <p className="text-xs text-slate-400">{draft.navigation.filter((item) => item.status === "active").length} aktif menü</p>
            </div>
            <div className="grid gap-3 p-4">
              {activeHomeBlocks.length ? (
                activeHomeBlocks.map((block) => (
                  <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-3" key={block.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold">{block.title}</p>
                      <span className="text-xs text-cyan-200">#{block.order}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{block.subtitle}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  Aktif ana sayfa bloğu yok. Public sayfa default fallback ile boş kalmaz.
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Panel({
  actionLabel,
  children,
  onAction,
  title
}: {
  actionLabel?: string;
  children: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-cyan-300/15 bg-slate-950/70 p-5 text-white shadow-lg shadow-cyan-950/10">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        {actionLabel && onAction ? (
          <button className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200" onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function HomeBlockEditor({
  block,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  showMoveDown,
  showMoveUp
}: {
  block: ManagedHomeBlock;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ManagedHomeBlock>) => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <EditorCard title={block.title} tag={block.type}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Başlık" value={block.title} onChange={(value) => onUpdate({ title: value })} />
        <SelectField label="Durum" value={block.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Alt açıklama" value={block.subtitle} onChange={(value) => onUpdate({ subtitle: value })} />
        <TextField label="İkon" value={block.icon} onChange={(value) => onUpdate({ icon: value })} />
        <TextField label="Buton metni" value={block.buttonLabel} onChange={(value) => onUpdate({ buttonLabel: value })} />
        <TextField label="Buton linki" value={block.buttonHref} onChange={(value) => onUpdate({ buttonHref: value })} />
        <TextField label="Arka plan görseli" value={block.backgroundImage} onChange={(value) => onUpdate({ backgroundImage: value })} />
        <NumberField label="Sıra" value={block.order} onChange={(value) => onUpdate({ order: value })} />
      </div>
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function CardEditor({
  card,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  showMoveDown,
  showMoveUp
}: {
  card: ManagedCard;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ManagedCard>) => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <EditorCard title={card.title} tag={card.tag || card.type}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Kart başlığı" value={card.title} onChange={(value) => onUpdate({ title: value })} />
        <SelectField label="Durum" value={card.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Açıklama" value={card.description} onChange={(value) => onUpdate({ description: value })} />
        <TextField label="İkon adı veya görseli" value={card.icon} onChange={(value) => onUpdate({ icon: value })} />
        <TextField label="Arka plan rengi" value={card.backgroundColor} onChange={(value) => onUpdate({ backgroundColor: value })} />
        <TextField label="Arka plan görseli" value={card.backgroundImage} onChange={(value) => onUpdate({ backgroundImage: value })} />
        <TextField label="Buton metni" value={card.buttonLabel} onChange={(value) => onUpdate({ buttonLabel: value })} />
        <TextField label="Buton linki" value={card.buttonHref} onChange={(value) => onUpdate({ buttonHref: value })} />
        <TextField label="Etiket" value={card.tag} onChange={(value) => onUpdate({ tag: value })} />
        <NumberField label="Sıralama" value={card.order} onChange={(value) => onUpdate({ order: value })} />
      </div>
      <CheckField label="Öne çıkar" checked={card.featured} onChange={(value) => onUpdate({ featured: value })} />
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function BannerEditor({
  banner,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  showMoveDown,
  showMoveUp
}: {
  banner: ManagedBanner;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ManagedBanner>) => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <EditorCard title={banner.title} tag={banner.category}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Görsel başlığı" value={banner.title} onChange={(value) => onUpdate({ title: value })} />
        <SelectField label="Durum" value={banner.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Açıklama" value={banner.description} onChange={(value) => onUpdate({ description: value })} />
        <TextField label="Alternatif metin" value={banner.altText} onChange={(value) => onUpdate({ altText: value })} />
        <TextField label="Kategori" value={banner.category} onChange={(value) => onUpdate({ category: value })} />
        <TextField label="Görsel URL veya base64" value={banner.imageUrl} onChange={(value) => onUpdate({ imageUrl: value })} />
        <TextField label="Format" value={banner.format} onChange={(value) => onUpdate({ format: value as ManagedBanner["format"] })} />
        <TextField label="Gösterileceği sayfa" value={banner.pageKey} onChange={(value) => onUpdate({ pageKey: value as ManagedBanner["pageKey"] })} />
        <NumberField label="Sıralama" value={banner.order} onChange={(value) => onUpdate({ order: value })} />
      </div>
      {banner.imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-900 p-3">
          <p className="mb-2 text-xs font-bold text-slate-400">Görsel önizleme</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={banner.altText} className="max-h-48 w-full rounded-md object-contain" src={banner.imageUrl} />
        </div>
      ) : null}
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function GuideEditor({
  guide,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  showMoveDown,
  showMoveUp
}: {
  guide: ManagedGuide;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ManagedGuide>) => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <EditorCard title={guide.title} tag={guide.category}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Rehber başlığı" value={guide.title} onChange={(value) => onUpdate({ title: value })} />
        <SelectField label="Durum" value={guide.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Kısa açıklama" value={guide.summary} onChange={(value) => onUpdate({ summary: value })} />
        <TextField label="Kapak görseli" value={guide.coverImage} onChange={(value) => onUpdate({ coverImage: value })} />
        <TextField label="Kategori" value={guide.category} onChange={(value) => onUpdate({ category: value })} />
        <TextField label="Etiketler" value={guide.tags} onChange={(value) => onUpdate({ tags: value })} />
        <TextField label="Okuma süresi" value={guide.readingTime} onChange={(value) => onUpdate({ readingTime: value })} />
        <NumberField label="Sıralama" value={guide.order} onChange={(value) => onUpdate({ order: value })} />
      </div>
      <TextareaField label="İçerik metni" value={guide.body} onChange={(value) => onUpdate({ body: value })} />
      <CheckField label="Öne çıkar" checked={guide.featured} onChange={(value) => onUpdate({ featured: value })} />
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function NavigationEditor({
  item,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  showMoveDown,
  showMoveUp
}: {
  item: ManagedNavigationItem;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ManagedNavigationItem>) => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <EditorCard title={item.label} tag={item.href}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Menü adı" value={item.label} onChange={(value) => onUpdate({ label: value })} />
        <SelectField label="Durum" value={item.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Link" value={item.href} onChange={(value) => onUpdate({ href: value })} />
        <TextField label="İkon" value={item.icon} onChange={(value) => onUpdate({ icon: value })} />
        <NumberField label="Sıra" value={item.order} onChange={(value) => onUpdate({ order: value })} />
      </div>
      <CheckField label="Yeni sekmede aç" checked={item.openInNewTab} onChange={(value) => onUpdate({ openInNewTab: value })} />
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function ThemeEditor({ onUpdate, theme }: { onUpdate: (patch: Partial<ManagedThemeSettings>) => void; theme: ManagedThemeSettings }) {
  return (
    <EditorCard title="Tema ve genel ayarlar" tag="global">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Site adı" value={theme.siteName} onChange={(value) => onUpdate({ siteName: value })} />
        <TextField label="Logo metni" value={theme.logoText} onChange={(value) => onUpdate({ logoText: value })} />
        <TextField label="Ana renk" value={theme.primaryColor} onChange={(value) => onUpdate({ primaryColor: value })} />
        <TextField label="İkincil renk" value={theme.secondaryColor} onChange={(value) => onUpdate({ secondaryColor: value })} />
        <TextField label="Arka plan teması" value={theme.backgroundTheme} onChange={(value) => onUpdate({ backgroundTheme: value })} />
        <TextField label="Kart arka plan stili" value={theme.cardStyle} onChange={(value) => onUpdate({ cardStyle: value })} />
        <TextField label="Hero arka plan görseli" value={theme.heroBackgroundImage} onChange={(value) => onUpdate({ heroBackgroundImage: value })} />
        <TextField label="Sayfa genel arka plan görseli" value={theme.pageBackgroundImage} onChange={(value) => onUpdate({ pageBackgroundImage: value })} />
        <TextField label="Destek e-posta" value={theme.supportEmail} onChange={(value) => onUpdate({ supportEmail: value })} />
        <TextField label="İhbar e-posta" value={theme.reportEmail} onChange={(value) => onUpdate({ reportEmail: value })} />
      </div>
      <TextareaField label="Footer metni" value={theme.footerText} onChange={(value) => onUpdate({ footerText: value })} />
    </EditorCard>
  );
}

function PageSettingsEditor({ onUpdate, page }: { onUpdate: (patch: Partial<ManagedPageSettings>) => void; page: ManagedPageSettings }) {
  return (
    <EditorCard title={page.title} tag={page.pageKey}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Sayfa başlığı" value={page.title} onChange={(value) => onUpdate({ title: value })} />
        <SelectField label="Durum" value={page.status} options={statusOptions} onChange={(value) => onUpdate({ status: value as ManagedStatus })} />
        <TextField label="Açıklama" value={page.description} onChange={(value) => onUpdate({ description: value })} />
        <TextField label="Hero metni" value={page.heroTitle} onChange={(value) => onUpdate({ heroTitle: value })} />
        <TextField label="Hero görseli" value={page.heroImage} onChange={(value) => onUpdate({ heroImage: value })} />
        <TextField label="SEO title" value={page.seoTitle} onChange={(value) => onUpdate({ seoTitle: value })} />
      </div>
      <TextareaField label="Hero açıklaması" value={page.heroDescription} onChange={(value) => onUpdate({ heroDescription: value })} />
      <TextareaField label="SEO description" value={page.seoDescription} onChange={(value) => onUpdate({ seoDescription: value })} />
    </EditorCard>
  );
}

function EditorCard({ children, tag, title }: { children: React.ReactNode; tag: string; title: string }) {
  return (
    <article className="rounded-xl border border-cyan-300/15 bg-slate-900/75 p-4 shadow-lg shadow-slate-950/20">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <span className="w-fit rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100">{tag}</span>
      </div>
      {children}
    </article>
  );
}

function EditorActions({
  onMoveDown,
  onMoveUp,
  onRemove,
  showMoveDown,
  showMoveUp
}: {
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  showMoveDown: boolean;
  showMoveUp: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
      <button className="rounded-md border border-slate-600 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40" disabled={!showMoveUp} onClick={onMoveUp} type="button">
        Yukarı taşı
      </button>
      <button className="rounded-md border border-slate-600 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40" disabled={!showMoveDown} onClick={onMoveDown} type="button">
        Aşağı taşı
      </button>
      <button className="rounded-md border border-red-300/25 px-3 py-2 text-sm font-bold text-red-100 transition hover:bg-red-400/10" onClick={onRemove} type="button">
        Sil
      </button>
    </div>
  );
}

function TextField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        className="min-h-11 rounded-md border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        className="min-h-11 rounded-md border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        type="number"
        value={value}
      />
    </label>
  );
}

function TextareaField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="mt-3 grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <textarea
        className="min-h-28 rounded-md border border-white/10 bg-slate-950/80 p-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <select
        className="min-h-11 rounded-md border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-200">
      <input checked={checked} className="h-4 w-4 accent-cyan-300" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function StatusMessage({ text, tone }: { text: string; tone: "success" | "warning" | "danger" }) {
  const classes = {
    success: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    danger: "border-red-300/25 bg-red-300/10 text-red-100"
  }[tone];

  return <p className={`mt-4 rounded-md border px-3 py-2 text-sm font-bold ${classes}`}>{text}</p>;
}

function nextOrder(items: Array<{ order: number }>) {
  const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0);
  return maxOrder + 10;
}

function moveItem<T extends { id: string; order: number }>(items: T[], id: string, direction: -1 | 1) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((item) => item.id === id);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
    return sorted;
  }

  const current = sorted[index];
  const target = sorted[targetIndex];
  sorted[index] = { ...target, order: current.order };
  sorted[targetIndex] = { ...current, order: target.order };

  return sorted.sort((a, b) => a.order - b.order);
}
