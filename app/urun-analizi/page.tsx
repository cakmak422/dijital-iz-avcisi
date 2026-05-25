import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";

export default function ProductAnalysisPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Analiz panelleri" />
          <Link className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>
      <Suspense fallback={<div className="px-4 py-10 text-center">Analiz paneli yukleniyor...</div>}>
        <AnalysisWorkspace />
      </Suspense>
    </main>
  );
}
