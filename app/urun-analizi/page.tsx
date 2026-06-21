import Link from "next/link";
import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberHero } from "@/components/CyberHero";
import { CyberPageShell } from "@/components/CyberPageShell";
import { SiteFooter } from "@/components/SiteFooter";

export default function ProductAnalysisPage() {
  return (
    <CyberPageShell variant="query">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Ürün Analizi" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>
      <CyberHero
        description="Ürün linki, satıcı sinyali ve yorum örüntülerini sade bir güven raporu formatında değerlendirmek için analiz panelini kullanın."
        eyebrow="Ürün Analizi"
        primaryAction={{ href: "#urun-analiz-paneli", label: "Analize Başla" }}
        secondaryAction={{ href: "/sorgu-paneli", label: "Sorgu Paneli" }}
        title="Alışveriş öncesi dijital izleri inceleyin."
        variant="query"
      />
      <div id="urun-analiz-paneli">
        <Suspense fallback={<div className="px-4 py-10 text-center">Analiz paneli yükleniyor...</div>}>
          <AnalysisWorkspace />
        </Suspense>
      </div>

      <SiteFooter />
    </CyberPageShell>
  );
}
