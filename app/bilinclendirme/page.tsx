import type { Metadata } from "next";
import Link from "next/link";
import { AwarenessSlider } from "@/components/AwarenessSlider";

export const metadata: Metadata = {
  title: "Bilinçlendirme",
  description: "Dijital güvenlik farkındalığı için görsel ve bilgilendirici içerik afişleri.",
  alternates: { canonical: "/bilinclendirme" },
  openGraph: { title: "Bilinçlendirme | Dijital İz Avcısı", description: "Dijital güvenlik farkındalık materyalleri.", url: "/bilinclendirme" }
};
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { SiteFooter } from "@/components/SiteFooter";

export default function AwarenessPage() {
  return (
    <CyberPageShell className="home-general-theme overflow-x-hidden" variant="guides">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Bilinçlendirme" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="cyber-section cyber-pattern-dots px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Dijital farkındalık merkezi</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-normal text-white sm:text-5xl">
            Siber Farkındalık Afişleri
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            Admin konsolda yönetilen afişler, dolandırıcılık yöntemlerine karşı kısa ve anlaşılır bilgilendirme vitrini olarak burada listelenir.
          </p>
        </div>
      </section>

      <AwarenessSlider
        description="Admin panelde aktif olan afişler burada kaynak vitrini olarak gösterilir."
        scope="all"
        title="Yayınlanan Bilinçlendirme Afişleri"
      />

      <SiteFooter />
    </CyberPageShell>
  );
}
