"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { ColorInputField } from "@/components/admin/ColorInputField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { awarenessBannersChangedEventName } from "@/lib/awarenessBanners";
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
  ManagedImageFormat,
  ManagedNavigationItem,
  ManagedPageKey,
  ManagedPageSettings,
  ManagedStatus,
  ManagedThemeSettings,
  ManagedViewport,
  PageManagementState
} from "@/types/pageManagement";

type SectionKey = "home" | "cards" | "banners" | "guides" | "navigation" | "theme" | "pages";
type SaveState = "idle" | "saved" | "reset" | "error";
type BannerUploadState = "idle" | "uploading" | "success" | "error";
type BannerUploadResponse = {
  error?: string;
  format?: ManagedImageFormat;
  imageUrl?: string;
  ok: boolean;
};
type BannerSyncState = "idle" | "loading" | "success" | "warning" | "error";
type AwarenessBannersApiResponse = {
  count?: number;
  error?: string;
  item?: ManagedBanner;
  items?: ManagedBanner[];
  ok: boolean;
  source?: string;
};

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

const pageKeyOptions: Array<{ label: string; value: ManagedPageKey }> = [
  { label: "Ana Sayfa", value: "home" },
  { label: "Hakkımızda", value: "about" },
  { label: "Siber Arşiv", value: "archive" },
  { label: "Haberler", value: "news" },
  { label: "Sorgu Paneli", value: "query" },
  { label: "Dijital Araç Merkezi", value: "tools" },
  { label: "Rehberler", value: "guides" },
  { label: "İletişim", value: "contact" }
];

const imageFormatOptions: Array<{ label: string; value: ManagedImageFormat }> = [
  { label: "URL", value: "url" },
  { label: "JPG", value: "jpg" },
  { label: "JPEG", value: "jpeg" },
  { label: "PNG", value: "png" },
  { label: "WEBP", value: "webp" }
];

const bannerUploadMaxSize = 5 * 1024 * 1024;
const bannerUploadAcceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

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
  const [bannerSyncState, setBannerSyncState] = useState<BannerSyncState>("idle");
  const [bannerSyncMessage, setBannerSyncMessage] = useState("");
  const [removedBannerIds, setRemovedBannerIds] = useState<string[]>([]);

  useEffect(() => {
    setDraft(storedState);
  }, [storedState.updatedAt]);

  useEffect(() => {
    let cancelled = false;

    async function loadBannersFromApi() {
      setBannerSyncState("loading");
      setBannerSyncMessage("Afişler ortak veritabanından okunuyor...");

      try {
        const response = await fetch("/api/awareness/banners?page_key=all", { cache: "no-store" });
        const data = (await response.json()) as AwarenessBannersApiResponse;

        if (cancelled) return;

        if (response.ok && data.ok && data.source === "database" && Array.isArray(data.items) && data.items.length > 0) {
          setDraft((current) => ({ ...current, banners: data.items ?? current.banners }));
          setBannerSyncState("success");
          setBannerSyncMessage("Afişler Supabase ortak veritabanından yüklendi.");
          return;
        }

        setBannerSyncState("warning");
        setBannerSyncMessage(data.error || "Supabase afiş verisi bulunamadı; mevcut local taslak korunuyor. Kaydet komutu bu taslağı ortak veritabanına aktarır.");
      } catch (error) {
        if (cancelled) return;
        setBannerSyncState("warning");
        setBannerSyncMessage(error instanceof Error ? error.message : "Afiş API okunamadı; mevcut local taslak korunuyor.");
      }
    }

    loadBannersFromApi();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeHomeBlocks = useMemo(() => {
    return draft.homeBlocks.filter((block) => block.status === "active").sort((a, b) => a.order - b.order);
  }, [draft.homeBlocks]);

  function setDirty(nextState: PageManagementState) {
    setDraft(nextState);
    setStatus("idle");
  }

  async function handleSave() {
    try {
      setBannerSyncState("loading");
      setBannerSyncMessage("Afiş değişiklikleri Supabase ortak veritabanına yazılıyor...");
      const syncedBanners = await syncBannersToApi(draft.banners, removedBannerIds);
      const saved = savePageManagementState({ ...draft, banners: syncedBanners });
      setDraft(saved);
      setRemovedBannerIds([]);
      setStatus("saved");
      setBannerSyncState("success");
      setBannerSyncMessage("Afişler Supabase ortak veritabanına kaydedildi.");
      window.dispatchEvent(new Event(awarenessBannersChangedEventName));
    } catch (error) {
      setStatus("error");
      setBannerSyncState("error");
      setBannerSyncMessage(error instanceof Error ? error.message : "Afişler Supabase'e kaydedilemedi.");
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
    setDirty({ ...draft, homeBlocks: [...draft.homeBlocks, createHomeBlock(nextOrder(draft.homeBlocks))] });
  }

  function updateHomeBlock(id: string, patch: Partial<ManagedHomeBlock>) {
    setDirty({ ...draft, homeBlocks: draft.homeBlocks.map((block) => (block.id === id ? { ...block, ...patch } : block)) });
  }

  function removeHomeBlock(id: string) {
    if (!window.confirm("Bu ana sayfa bloğu silinsin mi?")) return;
    setDirty({ ...draft, homeBlocks: draft.homeBlocks.filter((block) => block.id !== id) });
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

  function addBanner() {
    setDirty({ ...draft, banners: [...draft.banners, createManagedBanner(nextOrder(draft.banners))] });
  }

  function updateBanner(id: string, patch: Partial<ManagedBanner>) {
    setDirty({ ...draft, banners: draft.banners.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)) });
  }

  function removeBanner(id: string) {
    if (!window.confirm("Bu afiş kaydı silinsin mi?")) return;
    if (isUuid(id)) setRemovedBannerIds((current) => (current.includes(id) ? current : [...current, id]));
    setDirty({ ...draft, banners: draft.banners.filter((banner) => banner.id !== id) });
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

  function addNavigationItem() {
    setDirty({ ...draft, navigation: [...draft.navigation, createNavigationItem(nextOrder(draft.navigation))] });
  }

  function updateNavigationItem(id: string, patch: Partial<ManagedNavigationItem>) {
    setDirty({ ...draft, navigation: draft.navigation.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function removeNavigationItem(id: string) {
    if (!window.confirm("Bu menü öğesi silinsin mi?")) return;
    setDirty({ ...draft, navigation: draft.navigation.filter((item) => item.id !== id) });
  }

  function updateTheme(patch: Partial<ManagedThemeSettings>) {
    setDirty({ ...draft, theme: { ...draft.theme, ...patch } });
  }

  function updatePage(id: string, patch: Partial<ManagedPageSettings>) {
    setDirty({ ...draft, pages: draft.pages.map((page) => (page.id === id ? { ...page, ...patch } : page)) });
  }

  function moveCollectionItem(collection: "homeBlocks" | "cards" | "banners" | "guides" | "navigation", id: string, direction: -1 | 1) {
    if (collection === "homeBlocks") {
      setDirty({ ...draft, homeBlocks: moveItem(draft.homeBlocks, id, direction) });
      return;
    }

    if (collection === "cards") {
      setDirty({ ...draft, cards: moveItem(draft.cards, id, direction) });
      return;
    }

    if (collection === "banners") {
      setDirty({ ...draft, banners: moveItem(draft.banners, id, direction) });
      return;
    }

    if (collection === "guides") {
      setDirty({ ...draft, guides: moveItem(draft.guides, id, direction) });
      return;
    }

    setDirty({ ...draft, navigation: moveItem(draft.navigation, id, direction) });
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
                Ana sayfa blokları, kartlar, afişler, rehberler, menü, tema ve sayfa hero ayarları localStorage tabanlı MVP olarak yönetilir.
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

        {bannerSyncMessage ? (
          <StatusMessage tone={bannerSyncState === "error" ? "danger" : bannerSyncState === "warning" ? "warning" : "success"} text={bannerSyncMessage} />
        ) : null}

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
          <Panel actionLabel="Yeni blok ekle" onAction={addHomeBlock} title="Ana Sayfa Blok Yönetimi">
            {draft.homeBlocks.map((block, index) => (
              <HomeBlockEditor
                block={block}
                key={block.id}
                onMoveDown={() => moveCollectionItem("homeBlocks", block.id, 1)}
                onMoveUp={() => moveCollectionItem("homeBlocks", block.id, -1)}
                onRemove={() => removeHomeBlock(block.id)}
                onUpdate={(patch) => updateHomeBlock(block.id, patch)}
                showMoveDown={index < draft.homeBlocks.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "cards" ? (
          <Panel actionLabel="Yeni kart ekle" onAction={addCard} title="Kart Yönetimi">
            {draft.cards.map((card, index) => (
              <CardEditor
                card={card}
                key={card.id}
                onMoveDown={() => moveCollectionItem("cards", card.id, 1)}
                onMoveUp={() => moveCollectionItem("cards", card.id, -1)}
                onRemove={() => removeCard(card.id)}
                onUpdate={(patch) => updateCard(card.id, patch)}
                showMoveDown={index < draft.cards.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "banners" ? (
          <Panel actionLabel="Yeni afiş ekle" onAction={addBanner} title="Afiş / Görsel Yönetimi">
            {draft.banners.map((banner, index) => (
              <BannerEditor
                banner={banner}
                key={banner.id}
                onMoveDown={() => moveCollectionItem("banners", banner.id, 1)}
                onMoveUp={() => moveCollectionItem("banners", banner.id, -1)}
                onRemove={() => removeBanner(banner.id)}
                onUpdate={(patch) => updateBanner(banner.id, patch)}
                showMoveDown={index < draft.banners.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "guides" ? (
          <Panel actionLabel="Yeni rehber ekle" onAction={addGuide} title="Rehber İçerik Yönetimi">
            {draft.guides.map((guide, index) => (
              <GuideEditor
                guide={guide}
                key={guide.id}
                onMoveDown={() => moveCollectionItem("guides", guide.id, 1)}
                onMoveUp={() => moveCollectionItem("guides", guide.id, -1)}
                onRemove={() => removeGuide(guide.id)}
                onUpdate={(patch) => updateGuide(guide.id, patch)}
                showMoveDown={index < draft.guides.length - 1}
                showMoveUp={index > 0}
              />
            ))}
          </Panel>
        ) : null}

        {activeSection === "navigation" ? (
          <Panel actionLabel="Yeni menü ekle" onAction={addNavigationItem} title="Menü / Navigasyon Yönetimi">
            {draft.navigation.map((item, index) => (
              <NavigationEditor
                item={item}
                key={item.id}
                onMoveDown={() => moveCollectionItem("navigation", item.id, 1)}
                onMoveUp={() => moveCollectionItem("navigation", item.id, -1)}
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
            <ThemeEditor onUpdate={updateTheme} theme={draft.theme} />
          </Panel>
        ) : null}

        {activeSection === "pages" ? (
          <Panel title="Sayfa Bazlı Yönetim">
            {draft.pages.map((page) => (
              <PageSettingsEditor key={page.id} onUpdate={(patch) => updatePage(page.id, patch)} page={page} />
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
            <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100">Local MVP</span>
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

function Panel({ actionLabel, children, onAction, title }: { actionLabel?: string; children: React.ReactNode; onAction?: () => void; title: string }) {
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
    <EditorCard tag={block.type} title={block.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Başlık" onChange={(value) => onUpdate({ title: value })} value={block.title} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={block.status} />
        <TextField label="Alt açıklama" onChange={(value) => onUpdate({ subtitle: value })} value={block.subtitle} />
        <TextField label="İkon" onChange={(value) => onUpdate({ icon: value })} value={block.icon} />
        <TextField label="Buton metni" onChange={(value) => onUpdate({ buttonLabel: value })} value={block.buttonLabel} />
        <TextField label="Buton linki" onChange={(value) => onUpdate({ buttonHref: value })} value={block.buttonHref} />
        <NumberField label="Sıra" onChange={(value) => onUpdate({ order: value })} value={block.order} />
      </div>
      <ImageUploadField label="Arka plan görseli" onChange={(url) => onUpdate({ backgroundImage: url })} subfolder="blocks" value={block.backgroundImage} />
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
    <EditorCard tag={card.tag || card.type} title={card.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Kart başlığı" onChange={(value) => onUpdate({ title: value })} value={card.title} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={card.status} />
        <TextField label="Açıklama" onChange={(value) => onUpdate({ description: value })} value={card.description} />
        <TextField label="İkon adı veya görseli" onChange={(value) => onUpdate({ icon: value })} value={card.icon} />
        <ColorInputField label="Arka plan rengi" onChange={(value) => onUpdate({ backgroundColor: value })} value={card.backgroundColor} />
      </div>
      <ImageUploadField label="Arka plan görseli" onChange={(url) => onUpdate({ backgroundImage: url })} subfolder="cards" value={card.backgroundImage} />
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Buton metni" onChange={(value) => onUpdate({ buttonLabel: value })} value={card.buttonLabel} />
        <TextField label="Buton linki" onChange={(value) => onUpdate({ buttonHref: value })} value={card.buttonHref} />
        <TextField label="Etiket" onChange={(value) => onUpdate({ tag: value })} value={card.tag} />
        <NumberField label="Sıralama" onChange={(value) => onUpdate({ order: value })} value={card.order} />
      </div>
      <CheckField checked={card.featured} label="Öne çıkar" onChange={(value) => onUpdate({ featured: value })} />
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState<BannerUploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const visibleImageUrl = previewUrl || banner.imageUrl;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateBannerImageFile(file);
    if (validationError) {
      setUploadState("error");
      setUploadMessage(validationError);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState("uploading");
    setUploadMessage("Görsel yükleniyor...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/awareness/upload", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as BannerUploadResponse;

      if (!response.ok || !data.ok || !data.imageUrl) {
        throw new Error(data.error || "Görsel yüklenemedi.");
      }

      onUpdate({
        format: data.format ?? getManagedImageFormatFromMime(file.type),
        imageUrl: data.imageUrl
      });
      setUploadState("success");
      setUploadMessage("Görsel yüklendi. Kalıcı olması için değişiklikleri kaydedin.");
      setPreviewUrl("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Görsel yüklenemedi.";
      setUploadState("error");
      setUploadMessage(message);
    }
  }

  return (
    <EditorCard tag={banner.category} title={banner.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Görsel başlığı" onChange={(value) => onUpdate({ title: value })} value={banner.title} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={banner.status} />
        <TextField label="Açıklama" onChange={(value) => onUpdate({ description: value })} value={banner.description} />
        <TextField label="Alternatif metin" onChange={(value) => onUpdate({ altText: value })} value={banner.altText} />
        <TextField label="Kategori" onChange={(value) => onUpdate({ category: value })} value={banner.category} />
        <TextField label="Görsel URL veya base64" onChange={(value) => onUpdate({ imageUrl: value })} value={banner.imageUrl} />
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Dosya Seç
          <input
            accept="image/png,image/jpeg,image/webp"
            className="min-h-11 rounded-md border border-dashed border-cyan-300/25 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-sm file:font-black file:text-slate-950 hover:border-cyan-300/50"
            onChange={handleFileChange}
            type="file"
          />
          <span className="text-xs font-medium leading-5 text-slate-400">PNG, JPG/JPEG veya WEBP. En fazla 5 MB.</span>
        </label>
        <SelectField label="Format" onChange={(value) => onUpdate({ format: value as ManagedImageFormat })} options={imageFormatOptions} value={banner.format} />
        <SelectField label="Gösterileceği sayfa" onChange={(value) => onUpdate({ pageKey: value as ManagedPageKey })} options={pageKeyOptions} value={banner.pageKey} />
        <NumberField label="Sıralama" onChange={(value) => onUpdate({ order: value })} value={banner.order} />
      </div>
      {uploadMessage ? <UploadStatusMessage state={uploadState} text={uploadMessage} /> : null}
      {visibleImageUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-900 p-3">
          <p className="mb-2 text-xs font-bold text-slate-400">Görsel önizleme</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={banner.altText} className="max-h-48 w-full rounded-md object-contain" src={visibleImageUrl} />
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
    <EditorCard tag={guide.category} title={guide.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Rehber başlığı" onChange={(value) => onUpdate({ title: value })} value={guide.title} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={guide.status} />
        <TextField label="Kısa açıklama" onChange={(value) => onUpdate({ summary: value })} value={guide.summary} />
        <TextField label="Kategori" onChange={(value) => onUpdate({ category: value })} value={guide.category} />
        <TextField label="Etiketler" onChange={(value) => onUpdate({ tags: value })} value={guide.tags} />
        <TextField label="Okuma süresi" onChange={(value) => onUpdate({ readingTime: value })} value={guide.readingTime} />
        <NumberField label="Sıralama" onChange={(value) => onUpdate({ order: value })} value={guide.order} />
      </div>
      <TextareaField label="İçerik metni" onChange={(value) => onUpdate({ body: value })} value={guide.body} />
      <ImageUploadField label="Kapak görseli" onChange={(url) => onUpdate({ coverImage: url })} subfolder="guides" value={guide.coverImage} />
      <CheckField checked={guide.featured} label="Öne çıkar" onChange={(value) => onUpdate({ featured: value })} />
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
    <EditorCard tag={item.href} title={item.label}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Menü adı" onChange={(value) => onUpdate({ label: value })} value={item.label} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={item.status} />
        <TextField label="Link" onChange={(value) => onUpdate({ href: value })} value={item.href} />
        <TextField label="İkon" onChange={(value) => onUpdate({ icon: value })} value={item.icon} />
        <NumberField label="Sıra" onChange={(value) => onUpdate({ order: value })} value={item.order} />
      </div>
      <CheckField checked={item.openInNewTab} label="Yeni sekmede aç" onChange={(value) => onUpdate({ openInNewTab: value })} />
      <EditorActions onMoveDown={onMoveDown} onMoveUp={onMoveUp} onRemove={onRemove} showMoveDown={showMoveDown} showMoveUp={showMoveUp} />
    </EditorCard>
  );
}

function ThemeEditor({ onUpdate, theme }: { onUpdate: (patch: Partial<ManagedThemeSettings>) => void; theme: ManagedThemeSettings }) {
  return (
    <EditorCard tag="global" title="Tema ve genel ayarlar">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Site adı" onChange={(value) => onUpdate({ siteName: value })} value={theme.siteName} />
        <TextField label="Logo metni" onChange={(value) => onUpdate({ logoText: value })} value={theme.logoText} />
        <ColorInputField label="Ana renk" onChange={(value) => onUpdate({ primaryColor: value })} value={theme.primaryColor} />
        <ColorInputField label="İkincil renk" onChange={(value) => onUpdate({ secondaryColor: value })} value={theme.secondaryColor} />

        {/* Font çifti */}
        <SelectField
          label="Yazı tipi"
          onChange={(value) => onUpdate({ fontPairing: value })}
          options={[
            { label: "Varsayılan (Sistem fontu)", value: "system" },
            { label: "Monospace (Terminal hissi)", value: "mono" },
            { label: "Serif (Gazete/dergi hissi)", value: "editorial" }
          ]}
          value={theme.fontPairing ?? "system"}
        />

        {/* Yazı boyutu ölçeği */}
        <SelectField
          label="Yazı boyutu ölçeği"
          onChange={(value) => onUpdate({ sizeScale: value })}
          options={[
            { label: "Kompakt", value: "compact" },
            { label: "Normal (varsayılan)", value: "normal" },
            { label: "Geniş", value: "wide" }
          ]}
          value={theme.sizeScale ?? "normal"}
        />

        {/* Köşe yuvarlaklığı */}
        <SelectField
          label="Köşe yuvarlaklığı"
          onChange={(value) => onUpdate({ radiusStyle: value })}
          options={[
            { label: "Köşeli", value: "sharp" },
            { label: "Yumuşak (varsayılan)", value: "soft" },
            { label: "Yuvarlak", value: "round" }
          ]}
          value={theme.radiusStyle ?? "soft"}
        />

        {/* Boşluk */}
        <SelectField
          label="Bölüm/kart boşluğu"
          onChange={(value) => onUpdate({ spacingStyle: value })}
          options={[
            { label: "Sıkı", value: "tight" },
            { label: "Normal (varsayılan)", value: "normal" },
            { label: "Ferah", value: "airy" }
          ]}
          value={theme.spacingStyle ?? "normal"}
        />

        <TextField label="Arka plan teması (URL)" onChange={(value) => onUpdate({ backgroundTheme: value })} value={theme.backgroundTheme} />
        <TextField label="Kart arka plan stili" onChange={(value) => onUpdate({ cardStyle: value })} value={theme.cardStyle} />
        <TextField label="Destek e-posta" onChange={(value) => onUpdate({ supportEmail: value })} value={theme.supportEmail} />
        <TextField label="İhbar e-posta" onChange={(value) => onUpdate({ reportEmail: value })} value={theme.reportEmail} />
      </div>
      <ImageUploadField label="Hero arka plan görseli" onChange={(url) => onUpdate({ heroBackgroundImage: url })} subfolder="theme" value={theme.heroBackgroundImage} />
      <ImageUploadField label="Sayfa genel arka plan görseli" onChange={(url) => onUpdate({ pageBackgroundImage: url })} subfolder="theme" value={theme.pageBackgroundImage} />
      <TextareaField label="Footer metni" onChange={(value) => onUpdate({ footerText: value })} value={theme.footerText} />
    </EditorCard>
  );
}

function PageSettingsEditor({ onUpdate, page }: { onUpdate: (patch: Partial<ManagedPageSettings>) => void; page: ManagedPageSettings }) {
  return (
    <EditorCard tag={page.slug ? `/${page.slug}` : "/"} title={page.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Sayfa başlığı" onChange={(value) => onUpdate({ title: value })} value={page.title} />
        <SelectField label="Durum" onChange={(value) => onUpdate({ status: value as ManagedStatus })} options={statusOptions} value={page.status} />
        <TextField label="Açıklama" onChange={(value) => onUpdate({ description: value })} value={page.description} />
        <TextField label="Hero metni" onChange={(value) => onUpdate({ heroTitle: value })} value={page.heroTitle} />
        <TextField label="SEO title" onChange={(value) => onUpdate({ seoTitle: value })} value={page.seoTitle} />
      </div>
      <TextareaField label="Hero açıklaması" onChange={(value) => onUpdate({ heroDescription: value })} value={page.heroDescription} />
      <ImageUploadField label="Hero görseli" onChange={(url) => onUpdate({ heroImage: url })} subfolder="pages" value={page.heroImage} />
      <TextareaField label="SEO description" onChange={(value) => onUpdate({ seoDescription: value })} value={page.seoDescription} />
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

function UploadStatusMessage({ state, text }: { state: BannerUploadState; text: string }) {
  const classes = {
    error: "border-red-300/25 bg-red-300/10 text-red-100",
    idle: "border-slate-500/25 bg-slate-500/10 text-slate-200",
    success: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    uploading: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
  }[state];

  return <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-bold ${classes}`}>{text}</p>;
}

function validateBannerImageFile(file: File) {
  if (!bannerUploadAcceptedTypes.has(file.type)) {
    return "Sadece PNG, JPG/JPEG ve WEBP görseller seçilebilir.";
  }

  if (file.size > bannerUploadMaxSize) {
    return `Görsel boyutu en fazla 5 MB olabilir. Seçilen dosya: ${formatFileSize(file.size)}.`;
  }

  return "";
}

function getManagedImageFormatFromMime(type: string): ManagedImageFormat {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

async function syncBannersToApi(banners: ManagedBanner[], removedIds: string[]) {
  const synced: ManagedBanner[] = [];

  for (const banner of banners.sort((first, second) => first.order - second.order)) {
    if (!banner.title.trim()) throw new Error("Afiş başlığı boş bırakılamaz.");
    if (!banner.imageUrl.trim()) throw new Error(`${banner.title} için görsel URL zorunludur.`);

    const endpoint = isUuid(banner.id) ? `/api/awareness/banners/${encodeURIComponent(banner.id)}` : "/api/awareness/banners";
    const response = await fetch(endpoint, {
      body: JSON.stringify(banner),
      headers: { "Content-Type": "application/json" },
      method: isUuid(banner.id) ? "PATCH" : "POST"
    });
    const data = (await response.json().catch(() => null)) as AwarenessBannersApiResponse | null;

    if (!response.ok || !data?.ok || !data.item) {
      throw new Error(data?.error || `${banner.title} afişi kaydedilemedi.`);
    }

    synced.push(data.item);
  }

  for (const id of removedIds) {
    if (!isUuid(id)) continue;

    const response = await fetch(`/api/awareness/banners/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = (await response.json().catch(() => null)) as AwarenessBannersApiResponse | null;

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Afiş pasifleştirilemedi.");
    }
  }

  return synced.sort((first, second) => first.order - second.order);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
