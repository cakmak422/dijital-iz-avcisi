import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";

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
    <ManagedPageHero
      actions={[
        { href: "#analysis-workspace", label: "Analize Başla" },
        { href: "/", label: "Ana Sayfa", variant: "secondary" }
      ]}
      className="query-reference-hero"
      fallback={{
        title: "Analiz türünü seç ve sorguyu başlat.",
        description: "Ürün analizi, phishing kontrolü, site güvenliği, IP istihbaratı, EXIF ve SMS analizi aynı profesyonel rapor formatında toplanır.",
        image: "/awareness/sorgu-paneli-reference.png"
      }}
      slug="sorgu-paneli"
    />
  );
}
