"use client";

import { useMemo, useState } from "react";
import { getCurrentDemoUser } from "@/lib/auth";
import { resetEditableContent, saveEditableContent } from "@/lib/contentStore";
import type { EditableContent } from "@/types/content";

type SaveState = "idle" | "saving" | "saved" | "reset" | "error";

export function ContentEditorCard({ item }: { item: EditableContent }) {
  const [value, setValue] = useState(item.content);
  const [status, setStatus] = useState<SaveState>("idle");

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
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">{item.title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.key}</p>
        </div>
        <span className="w-fit rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
          {value.length} karakter
        </span>
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor={item.id}>
        Icerik metni
      </label>
      <textarea
        className="mt-2 min-h-36 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10"
        id={item.id}
        onChange={(event) => {
          setValue(event.target.value);
          setStatus("idle");
        }}
        value={value}
      />

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Canli onizleme</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">{value || "Onizleme icin metin girin."}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          Son guncelleme: {formattedDate} / {item.updatedBy}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/10"
            disabled={status === "saving"}
            onClick={handleReset}
            type="button"
          >
            Sifirla
          </button>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
            disabled={status === "saving"}
            onClick={handleSave}
            type="button"
          >
            {status === "saving" ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {status === "saved" ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
          Icerik basariyla guncellendi.
        </p>
      ) : null}
      {status === "reset" ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          Icerik varsayilan degerlere donduruldu.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
          Kayit sirasinda hata olustu. Lutfen tekrar deneyin.
        </p>
      ) : null}
    </article>
  );
}
