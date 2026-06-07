"use client";

import { useMemo, useState } from "react";
import { resetSiteSettings, saveSiteSettings, SiteSettings, useSiteSettings } from "@/lib/siteSettingsStore";

type SaveState = "idle" | "saved" | "reset" | "error";

const textFields: Array<{
  key: keyof SiteSettings;
  label: string;
  helper: string;
  type: "text" | "color";
  maxLength?: number;
}> = [
  {
    key: "siteName",
    label: "Site adı",
    helper: "Tarayıcı, SEO ve yönetim ekranlarında kullanılacak temel ad.",
    type: "text"
  },
  {
    key: "logoText",
    label: "Logo metni",
    helper: "Logo görseli olmadığında veya metinli kullanımda görünecek ad.",
    type: "text"
  },
  {
    key: "heroTitle",
    label: "Ana sayfa hero başlığı",
    helper: "Ana sayfanın ilk ekranda gösterdiği büyük başlık.",
    type: "text",
    maxLength: 160
  },
  {
    key: "heroSubtitle",
    label: "Ana sayfa hero alt açıklaması",
    helper: "Hero başlığının altında görünen kısa açıklama metni.",
    type: "text",
    maxLength: 320
  },
  {
    key: "favicon",
    label: "Favicon",
    helper: "Public klasöründeki favicon yolu. Örnek: /favicon.ico",
    type: "text"
  },
  {
    key: "primaryColor",
    label: "Ana renk",
    helper: "Marka vurguları ve ana butonlar için temel renk.",
    type: "color"
  },
  {
    key: "secondaryColor",
    label: "İkincil renk",
    helper: "Bilgi, hover ve destekleyici vurgu rengi.",
    type: "color"
  },
  {
    key: "textColor",
    label: "Yazı rengi",
    helper: "Genel metin renginin ileride bağlanacağı değer.",
    type: "color"
  },
  {
    key: "backgroundColor",
    label: "Arka plan rengi",
    helper: "Genel sayfa arka planının ileride bağlanacağı değer.",
    type: "color"
  }
];

export function FullSiteEditor() {
  const currentSettings = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(currentSettings);
  const [status, setStatus] = useState<SaveState>("idle");

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(draft.updatedAt));
  }, [draft.updatedAt]);

  function updateField(key: keyof SiteSettings, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function handleSave() {
    try {
      const saved = saveSiteSettings(draft);
      setDraft(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function handleReset() {
    try {
      const reset = resetSiteSettings();
      setDraft(reset);
      setStatus("reset");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Site Ayarları</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Bu ekran şimdilik sadece admin panelinde izole localStorage ayarı olarak çalışır; public sayfalara bağlanmadı.
            </p>
          </div>
          <span className="w-fit rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
            localStorage
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {textFields.map((field) => (
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200" key={field.key}>
              {field.label}
              <div className={field.type === "color" ? "flex gap-3" : ""}>
                <input
                  className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
                  maxLength={field.maxLength ?? (field.type === "color" ? 32 : 120)}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  type={field.type}
                  value={String(draft[field.key])}
                />
                {field.type === "color" ? (
                  <span
                    aria-hidden="true"
                    className="h-11 w-14 shrink-0 rounded-md border border-slate-200 dark:border-white/10"
                    style={{ backgroundColor: String(draft[field.key]) }}
                  />
                ) : null}
              </div>
              <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">{field.helper}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Son güncelleme: {formattedDate}</p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
              onClick={handleReset}
              type="button"
            >
              Varsayılana Dön
            </button>
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
              onClick={handleSave}
              type="button"
            >
              Kaydet
            </button>
          </div>
        </div>

        {status === "saved" ? (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            Site ayarları kaydedildi.
          </p>
        ) : null}
        {status === "reset" ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            Site ayarları varsayılan değerlere döndürüldü.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
            Ayarlar kaydedilemedi. Lütfen tekrar deneyin.
          </p>
        ) : null}
      </article>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Önizleme</p>
        <div className="mt-4 rounded-lg border border-slate-200 p-5 dark:border-white/10" style={{ backgroundColor: draft.backgroundColor, color: draft.textColor }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white" style={{ backgroundColor: draft.primaryColor }}>
              D
            </span>
            <div>
              <p className="font-bold">{draft.logoText}</p>
              <p className="text-xs opacity-75">{draft.siteName}</p>
            </div>
          </div>
          <button className="mt-5 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: draft.secondaryColor }} type="button">
            Örnek buton
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Bu önizleme sadece admin ekranı içindir. Ayarlar bu fazda public sayfalara uygulanmaz.
        </p>
      </aside>
    </section>
  );
}
