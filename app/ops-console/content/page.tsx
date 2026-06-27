"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentSection } from "@/components/admin/content/ContentSection";
import { editableContentGroups } from "@/lib/defaultContent";
import { useEditableContentItems } from "@/lib/contentStore";

export default function OpsConsoleContentPage() {
  const items = useEditableContentItems();

  return (
    <AdminGate>
      <AdminShell activeItem="content">
        <div className="mb-6 border-b border-white/10 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Admin CMS</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">İçerik düzenleme sistemi</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Site metinlerini kod açmadan güncelleyin. Bu demo sürüm localStorage ile çalışır; yapı ileride PostgreSQL tabanlı CMS sistemine taşınmaya hazırdır.
          </p>
        </div>

        <div className="grid gap-10">
          {editableContentGroups.map((group) => (
            <ContentSection group={group} items={items} key={group.id} />
          ))}
        </div>
      </AdminShell>
    </AdminGate>
  );
}
