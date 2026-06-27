"use client";

import { useMemo, useState } from "react";
import { getCurrentDemoUser } from "@/lib/auth";
import { resetEditableContent, saveEditableContent } from "@/lib/contentStore";
import type { EditableContent, EditableContentKey } from "@/types/content";

type SaveState = "idle" | "saving" | "saved" | "reset" | "error";

/** Key tipine göre makul karakter sınırı — aşılınca uyarı rengi */
function maxLengthFor(key: EditableContentKey): number {
  if (key.endsWith("Email") || key.endsWith("email")) return 120;
  if (key.endsWith(".title") || key.endsWith(".eyebrow") || key.endsWith(".copyright")) return 80;
  if (key.endsWith(".banner") || key.endsWith(".text")) return 400;
  return 320; // açıklama / paragraf
}

export function ContentEditorCard({ item, onReset }: { item: EditableContent; onReset?: () => void }) {
  const [value, setValue] = useState(item.content);
  const [status, setStatus] = useState<SaveState>("idle");
  const limit = maxLengthFor(item.key);
  const isOverLimit = value.length > limit;

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(item.updatedAt));
  }, [item.updatedAt]);

  function getAdminName() {
    const user = getCurrentDemoUser();
    return user?.username ?? "admin";
  }

  function handleSave() {
    setStatus("saving");
    try {
      saveEditableContent(item.key, value.trim(), getAdminName());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("saving");
    try {
      const resetItem = resetEditableContent(item.key, getAdminName());
      setValue(resetItem.content);
      setStatus("reset");
      onReset?.();
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{item.title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.key}</p>
        </div>
        {/* Karakter sayacı — sınır aşılınca amber uyarı */}
        <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold ${
          isOverLimit
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
            : "border-sky-400/30 bg-sky-400/10 text-sky-300"
        }`}>
          {value.length} / {limit} karakter{isOverLimit ? " ⚠" : ""}
        </span>
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-300" htmlFor={item.id}>
        İçerik metni
      </label>
      <textarea
        className="mt-2 min-h-36 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-300/10"
        id={item.id}
        onChange={(event) => {
          setValue(event.target.value);
          setStatus("idle");
        }}
        value={value}
      />

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Canlı önizleme</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">{value || "Önizleme için metin girin."}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Son güncelleme: {formattedDate} · {item.updatedBy}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "saving"}
            onClick={handleReset}
            type="button"
          >
            Sıfırla
          </button>
          <button
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "saving"}
            onClick={handleSave}
            type="button"
          >
            {status === "saving" ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {status === "saved" && (
        <p className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-300">
          İçerik başarıyla güncellendi.
        </p>
      )}
      {status === "reset" && (
        <p className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-300">
          İçerik varsayılan değerlere döndürüldü.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-300">
          Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.
        </p>
      )}
    </article>
  );
}
