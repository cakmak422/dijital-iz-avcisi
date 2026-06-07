import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";

export default function QueryPanelPage() {
  return (
    <CyberPageShell className="query-reference-page" variant="query">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Sorgu Paneli" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <QueryReferenceHero />

      <div id="analysis-workspace">
        <Suspense fallback={<div className="px-4 py-10 text-center">Sorgu paneli yukleniyor...</div>}>
          <AnalysisWorkspace />
        </Suspense>
      </div>
    </CyberPageShell>
  );
}

function QueryReferenceHero() {
  return (
    <section className="query-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="w-fit rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
            Güvenlik laboratuvari
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-normal text-white sm:text-4xl lg:text-6xl">
            Analiz türünü seç ve sorguyu başlat.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Ürün analizi, phishing kontrolü, site güvenliği, IP istihbaratı, EXIF ve SMS analizi aynı profesyonel rapor formatında toplanır.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-12 w-full text-base sm:w-auto" href="#analysis-workspace">
              Analize Basla
            </Link>
            <Link className="btn-secondary min-h-12 w-full text-base sm:w-auto" href="/">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
