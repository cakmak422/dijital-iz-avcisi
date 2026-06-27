"use client";

import { useState } from "react";
import { getCurrentDemoUser } from "@/lib/auth";
import { resetEditableContent } from "@/lib/contentStore";
import { ContentEditorCard } from "@/components/admin/content/ContentEditorCard";
import type { EditableContent, EditableContentGroup } from "@/types/content";

export function ContentSection({
  group,
  items
}: {
  group: EditableContentGroup;
  items: EditableContent[];
}) {
  const groupItems = group.keys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is EditableContent => Boolean(item));

  const [resetKey, setResetKey] = useState(0); // kartları yeniden mount etmek için
  const [resetting, setResetting] = useState(false);

  function handleResetAll() {
    const confirmed = window.confirm(
      `"${group.description}" bölümündeki ${groupItems.length} içeriğin tamamı varsayılan değerlere dönecek. Emin misiniz?`
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const admin = getCurrentDemoUser()?.username ?? "admin";
      for (const item of groupItems) {
        resetEditableContent(item.key, admin);
      }
      // Tüm kartları sıfırlanmış içerikle yeniden render et
      setResetKey((k) => k + 1);
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">{group.title}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-100">{group.description}</h2>
        </div>
        {groupItems.length > 1 && (
          <button
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
            disabled={resetting}
            onClick={handleResetAll}
            type="button"
          >
            {resetting ? "Sıfırlanıyor…" : "Tümünü sıfırla"}
          </button>
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {groupItems.map((item) => (
          <ContentEditorCard item={item} key={`${item.key}-${resetKey}`} />
        ))}
      </div>
    </section>
  );
}
