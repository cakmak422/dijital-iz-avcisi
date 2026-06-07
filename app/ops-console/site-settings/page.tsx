"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { BrandLogo } from "@/components/BrandLogo";
import { FullSiteEditor } from "@/components/admin/site-settings/FullSiteEditor";

export default function OpsConsoleSiteSettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="Site Ayarlari" />
          <div className="flex gap-2">
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console/content">
              İçerik CMS
            </Link>
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Site ayarlari iskeleti.</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
          Logo, renk ve temel site kimliği ayarları için izole bir localStorage iskeleti. Bu fazda public sayfalara bağlanmaz.
            </p>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <FullSiteEditor />
          </div>
        </section>
      </AdminGate>
    </main>
  );
}
