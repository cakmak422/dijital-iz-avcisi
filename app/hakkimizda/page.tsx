import type { Metadata } from "next";
import Link from "next/link";
import { AboutSection } from "@/components/AboutSection";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Dijital İz Avcısı platformunun amacı, vizyonu ve hukuki bilgilendirme yaklaşımı.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: { title: "Hakkımızda | Dijital İz Avcısı", description: "Güvenilir dijital analiz için sade ve sorumlu teknoloji yaklaşımı.", url: "/hakkimizda" }
};
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { SiteFooter } from "@/components/SiteFooter";

export default function AboutPage() {
  return (
    <CyberPageShell className="about-reference-page" variant="about">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Hakkımızda" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>
      <AboutReferenceHero />
      <AboutSection />

      <SiteFooter />
    </CyberPageShell>
  );
}

function AboutReferenceHero() {
  return (
    <ManagedPageHero
      actions={[
        { href: "/sorgu-paneli", label: "Sorgu Panelini Aç" },
        { href: "/iletisim", label: "İletişime Geç", variant: "secondary" }
      ]}
      className="about-reference-hero"
      fallback={{
        title: "Güvenilir dijital analiz için sade ve sorumlu teknoloji.",
        description:
          "Dijital İz Avcısı; alışveriş güvenliği, siber farkındalık ve risk sinyallerini halkın anlayabileceği sade raporlara dönüştürmek için geliştirilen kurumsal bir platformdur.",
        image: "/awareness/Hakkımızda.png"
      }}
      slug="hakkimizda"
    />
  );
}
