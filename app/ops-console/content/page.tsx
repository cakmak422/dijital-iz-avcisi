"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentSection } from "@/components/admin/content/ContentSection";
import { editableContentGroups, defaultEditableContent } from "@/lib/defaultContent";
import type { EditableContent } from "@/types/content";

export default function OpsConsoleContentPage() {
  const [items, setItems]     = useState<EditableContent[]>(defaultEditableContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res  = await fetch("/api/content");
      const data = await res.json() as { ok: boolean; content?: Record<string, string> };
      if (data.ok && data.content) {
        setItems(
          defaultEditableContent.map(item => ({
            ...item,
            content: data.content![item.key] ?? item.content,
          }))
        );
      }
    } catch { /* localStorage fallback — items zaten defaultEditableContent */ }
    finally { setLoading(false); }
  }

  return (
    <AdminGate>
      <AdminShell activeItem="content">
        <div className="mb-6 border-b border-white/10 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Admin CMS</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">İçerik düzenleme sistemi</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Site metinlerini kod açmadan güncelleyin. Değişiklikler Supabase'e kaydedilir ve public sayfalar anında güncellenir.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yükleniyor…</p>
        ) : (
          <div className="grid gap-10">
            {editableContentGroups.map((group) => (
              <ContentSection group={group} items={items} key={group.id} onRefresh={fetchItems} />
            ))}
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}
