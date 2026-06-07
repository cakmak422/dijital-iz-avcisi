import Link from "next/link";
import { AboutSection } from "@/components/AboutSection";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";

export default function AboutPage() {
  return (
    <CyberPageShell className="about-reference-page" variant="about">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Hakkımızda" />
          <Link className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>
      <AboutReferenceHero />
      <AboutSection />
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
