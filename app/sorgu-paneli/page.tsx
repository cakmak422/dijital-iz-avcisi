import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";

export default function QueryPanelPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Sorgu Paneli" />
          <Link className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-8 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Sorgu Paneli</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Analiz turunu sec ve sorguyu baslat.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
            Urun analizi, site guvenligi, IP analizi ve SMS analizi panelleri bu ekranda toplanir.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="px-4 py-10 text-center">Sorgu paneli yukleniyor...</div>}>
        <AnalysisWorkspace />
      </Suspense>
    </main>
  );
}
