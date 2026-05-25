import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";

export default function QueryPanelPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Sorgu Paneli" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-8 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="cyber-grid absolute inset-0 opacity-60" />
        <div className="absolute right-10 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/10" />
        <div className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Sorgu Paneli</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Analiz turunu sec ve sorguyu baslat.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              Urun analizi, phishing kontrolu ve SMS analizi ayni profesyonel rapor formatinda toplanir.
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950 shadow-sm dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-50">
            Risk sonuclari bilgilendirme amaclidir; kesin hukum veya suc isnadi olusturmaz.
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="px-4 py-10 text-center">Sorgu paneli yukleniyor...</div>}>
        <AnalysisWorkspace />
      </Suspense>
    </main>
  );
}
