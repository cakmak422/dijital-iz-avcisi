import Link from "next/link";
import { AboutSection } from "@/components/AboutSection";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";

export default function AboutPage() {
  return (
    <CyberPageShell className="about-reference-page" variant="about">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Hakkimizda" />
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
    <section className="about-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Hakkimizda
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Guvenilir dijital analiz icin sade ve sorumlu teknoloji.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Dijital Iz Avcisi; alisveris guvenligi, siber farkindalik ve risk sinyallerini halkin anlayabilecegi sade raporlara donusturmek icin gelistirilen kurumsal bir platformdur.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="/sorgu-paneli">
              Sorgu Panelini Ac
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/iletisim">
              Iletisime Gec
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
