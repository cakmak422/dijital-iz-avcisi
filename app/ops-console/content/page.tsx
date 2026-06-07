"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { ContentSection } from "@/components/admin/content/ContentSection";
import { editableContentGroups } from "@/lib/defaultContent";
import { useEditableContentItems } from "@/lib/contentStore";

export default function OpsConsoleContentPage() {
  const items = useEditableContentItems();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="İçerik Yönetimi" />
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
              Ana sayfa
            </Link>
            <AdminSessionMenu />
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">İçerik düzenleme sistemi.</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
          Site metinlerini kod açmadan güncelleyin. Bu demo sürüm localStorage ile çalışır; yapı ileride PostgreSQL tabanlı CMS sistemine taşınmaya hazırdır.
            </p>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10">
            {editableContentGroups.map((group) => (
              <ContentSection group={group} items={items} key={group.id} />
            ))}
          </div>
        </section>
      </AdminGate>
    </main>
  );
}
