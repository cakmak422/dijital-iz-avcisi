"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createManagedContentItem,
  deleteManagedContentItem,
  getContentAuditEvents,
  resetManagedContent,
  saveManagedContentItem,
  updateManagedContentStatus,
  useManagedContentItems
} from "@/lib/contentStore";
import type { ManagedContentItem, ManagedContentStatus, ManagedContentType } from "@/types/content";

const contentTypes: { label: string; value: ManagedContentType }[] = [
  { label: "Ana Sayfa Hero", value: "hero" },
  { label: "Navbar menuleri", value: "navbar" },
  { label: "Sayaç kartlari", value: "stat" },
  { label: "Siber Gundem", value: "cyber-news" },
  { label: "Parser saglik", value: "parser-health" },
  { label: "Siber kirilma", value: "cyber-archive" },
  { label: "Nasil calisir", value: "how-it-works" },
  { label: "Rehber / Blog", value: "guide" },
  { label: "Hakkimizda", value: "about" },
  { label: "Iletisim", value: "contact" },
  { label: "KVKK / Gizlilik / Yasal", value: "legal" },
  { label: "Footer", value: "footer" },
  { label: "Duyuru", value: "announcement" },
  { label: "Gorsel afis", value: "banner" },
  { label: "Dijital arac", value: "tool" },
  { label: "Faydali link", value: "useful-link" },
  { label: "Siber olay ayarlari", value: "cyber-event-settings" }
];

const statusLabels: Record<ManagedContentStatus, string> = {
  published: "Yayinda",
  draft: "Taslak",
  hidden: "Gizli"
};

function getAdminName() {
  return "ops-admin";
}

export function ManagedContentPanel() {
  const items = useManagedContentItems();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ManagedContentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ManagedContentStatus | "all">("all");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const auditEvents = getContentAuditEvents();

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = needle
        ? [item.title, item.subtitle, item.description, item.category, item.tags.join(" ")].join(" ").toLowerCase().includes(needle)
        : true;
      const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [items, query, statusFilter, typeFilter]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? items[0];

  function handleCreate() {
    const created = createManagedContentItem(typeFilter === "all" ? "blog" : typeFilter, getAdminName());
    setSelectedId(created.id);
    setNotice("Yeni icerik taslak olarak olusturuldu.");
  }

  function handleResetAll() {
    if (!window.confirm("Tum CMS icerikleri varsayilan degerlere donsun mu?")) {
      return;
    }
    resetManagedContent(getAdminName());
    setNotice("Icerikler varsayilan degerlere donduruldu.");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-cyan-900/10 bg-white p-5 shadow-sm dark:border-cyan-300/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Kapsamli CMS</p>
            <h2 className="mt-2 text-2xl font-bold">Tum gorunen icerikleri tek panelden yonet.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Bu panel localStorage tabanli demo CMS olarak calisir. Gercek yayinda tum islemler server-side yetki kontrolu, veritabani ve audit log ile calismalidir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={handleCreate} type="button">
              Yeni icerik ekle
            </button>
            <button className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100" onClick={handleResetAll} type="button">
              Varsayilana don
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold">
            Ara
            <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => setQuery(event.target.value)} placeholder="Baslik, kategori, etiket..." value={query} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Icerik tipi
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => setTypeFilter(event.target.value as ManagedContentType | "all")} value={typeFilter}>
              <option value="all">Tum tipler</option>
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Durum
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => setStatusFilter(event.target.value as ManagedContentStatus | "all")} value={statusFilter}>
              <option value="all">Tum durumlar</option>
              <option value="published">Yayinda</option>
              <option value="draft">Taslak</option>
              <option value="hidden">Gizli</option>
            </select>
          </label>
        </div>
        {notice ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">{notice}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="grid max-h-[760px] content-start gap-3 overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          {filteredItems.map((item) => (
            <button
              className={`rounded-md border p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-300/10 ${selectedItem?.id === item.id ? "border-cyan-400 bg-cyan-50 dark:border-cyan-300/40 dark:bg-cyan-300/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950"}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">{item.type}</span>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{statusLabels[item.status]}</span>
              </div>
              <h3 className="mt-2 font-bold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              {item.dataMode === "demo" ? <span className="mt-2 inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">Demo veri</span> : null}
            </button>
          ))}
        </div>

        {selectedItem ? <ContentForm item={selectedItem} onNotice={setNotice} /> : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-xl font-bold">Mock degisiklik gecmisi</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          TODO: Gercek backend ile kim, neyi, eski/yeni deger, tarih ve IP bilgileri server-side audit log olarak saklanacak.
        </p>
        <div className="mt-4 grid gap-2">
          {auditEvents.slice(0, 8).map((event) => (
            <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-white/10" key={event.id}>
              <span className="font-bold">{event.action}</span> - {event.itemTitle} - {new Date(event.createdAt).toLocaleString("tr-TR")}
            </div>
          ))}
          {!auditEvents.length ? <p className="text-sm text-slate-500 dark:text-slate-400">Henuz mock audit kaydi yok.</p> : null}
        </div>
      </div>
    </div>
  );
}

function ContentForm({ item, onNotice }: { item: ManagedContentItem; onNotice: (message: string) => void }) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  function update<K extends keyof ManagedContentItem>(key: K, value: ManagedContentItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const saved = saveManagedContentItem(draft, getAdminName());
    setDraft(saved);
    onNotice("Icerik basariyla guncellendi.");
  }

  function handleDelete() {
    if (!window.confirm("Bu icerik silinsin mi?")) {
      return;
    }
    deleteManagedContentItem(draft.id, getAdminName());
    onNotice("Icerik silindi.");
  }

  function handleStatus(status: ManagedContentStatus) {
    const saved = updateManagedContentStatus(draft.id, status, getAdminName());
    if (saved) {
      setDraft(saved);
      onNotice(status === "published" ? "Icerik yayina alindi." : status === "hidden" ? "Icerik gizlendi." : "Icerik taslak yapildi.");
    }
  }

  return (
    <div className="grid gap-5">
      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Hizli duzenle</p>
            <h2 className="mt-2 text-2xl font-bold">{draft.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Son guncelleme: {new Date(draft.updatedAt).toLocaleString("tr-TR")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={handleSave} type="button">
              Kaydet
            </button>
            <button className="btn-secondary" onClick={() => handleStatus("published")} type="button">
              Yayina al
            </button>
            <button className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100" onClick={() => handleStatus("hidden")} type="button">
              Gizle
            </button>
            <button className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100" onClick={handleDelete} type="button">
              Sil
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Baslik" value={draft.title} onChange={(value) => update("title", value)} />
          <Field label="Alt baslik" value={draft.subtitle} onChange={(value) => update("subtitle", value)} />
          <Field label="Kategori" value={draft.category} onChange={(value) => update("category", value)} />
          <Field label="Ikon" value={draft.icon} onChange={(value) => update("icon", value)} />
          <Field label="CTA metni" value={draft.ctaLabel} onChange={(value) => update("ctaLabel", value)} />
          <Field label="CTA linki" value={draft.ctaHref} onChange={(value) => update("ctaHref", value)} />
          <Field label="Gorsel URL" value={draft.imageUrl} onChange={(value) => update("imageUrl", value)} />
          <Field label="Gorsel alt metni" value={draft.altText} onChange={(value) => update("altText", value)} />
          <Field label="Deger / sayac / basari orani" value={draft.value ?? ""} onChange={(value) => update("value", value)} />
          <Field label="Detay / son test / yardimci bilgi" value={draft.detail ?? ""} onChange={(value) => update("detail", value)} />
          <Field label="Okuma suresi" value={draft.readTime ?? ""} onChange={(value) => update("readTime", value)} />
          <Field label="Yayin tarihi" value={draft.publishedAt ?? ""} onChange={(value) => update("publishedAt", value)} />
          <label className="grid gap-1 text-sm font-semibold">
            Tip
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("type", event.target.value as ManagedContentType)} value={draft.type}>
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Durum
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("status", event.target.value as ManagedContentStatus)} value={draft.status}>
              <option value="published">Yayinda</option>
              <option value="draft">Taslak</option>
              <option value="hidden">Gizli</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Veri modu
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("dataMode", event.target.value as ManagedContentItem["dataMode"])} value={draft.dataMode ?? "real"}>
              <option value="real">Gercek veri</option>
              <option value="demo">Demo</option>
              <option value="hidden">Gizli</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Risk seviyesi
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("riskLevel", event.target.value as ManagedContentItem["riskLevel"])} value={draft.riskLevel ?? "info"}>
              <option value="info">Bilgi</option>
              <option value="safe">Guvenli</option>
              <option value="caution">Dikkat</option>
              <option value="risk">Risk</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Sira
            <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("order", Number(event.target.value) || 0)} type="number" value={draft.order} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} type="checkbox" />
            One cikar
          </label>
        </div>

        <label className="mt-4 grid gap-1 text-sm font-semibold">
          Kisa aciklama
          <textarea className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("description", event.target.value)} value={draft.description} />
          <span className="text-xs font-normal text-slate-500">{draft.description.length} karakter</span>
        </label>
        <label className="mt-4 grid gap-1 text-sm font-semibold">
          Govde / blog icerigi
          <textarea className="min-h-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("body", event.target.value)} value={draft.body} />
          <span className="text-xs font-normal text-slate-500">{draft.body.length} karakter</span>
        </label>
        <label className="mt-4 grid gap-1 text-sm font-semibold">
          Etiketler
          <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()))} value={draft.tags.join(", ")} />
        </label>
      </form>

      <article className="rounded-lg border border-cyan-900/10 bg-white p-5 shadow-sm dark:border-cyan-300/10 dark:bg-white/5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Canli onizleme</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950">
          {draft.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={draft.altText || draft.title} className="h-40 w-full object-cover" src={draft.imageUrl} />
          ) : (
            <div className="grid h-32 place-items-center bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950 text-white">
              <span className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold">{draft.icon || "DI"}</span>
            </div>
          )}
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">{draft.category || draft.type}</span>
              {draft.dataMode === "demo" ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">Demo veri</span> : null}
            </div>
            <h3 className="mt-3 text-xl font-bold">{draft.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{draft.description}</p>
            {draft.ctaLabel ? <span className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">{draft.ctaLabel}</span> : null}
          </div>
        </div>
      </article>
    </div>
  );
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}
