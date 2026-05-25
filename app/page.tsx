"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { CyberNewsCenter } from "@/components/CyberNewsCenter";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ParserHealth } from "@/components/ParserHealth";
import { SecurityCenter } from "@/components/SecurityCenter";
import { getTodayCyberEvent } from "@/lib/cyberArchive";

type Theme = "light" | "dark";

const platformStats = [
  { label: "Analiz edilen link", value: "12.480", detail: "demo veri" },
  { label: "Riskli sinyal yakalandi", value: "1.936", detail: "site ve satici" },
  { label: "Gunluk analiz", value: "420", detail: "ortalama demo" }
];

const howItWorks = [
  {
    title: "Link yapistir",
    body: "Urun, site, IP veya mesaj bilgisini ilgili analiz paneline gir."
  },
  {
    title: "AI analiz etsin",
    body: "Parser, guvenlik kontrolleri ve AI ozetleme katmani risk paternlerini sade dile cevirir."
  },
  {
    title: "Risk sonucunu ogren",
    body: "Guven skoru, gorulen sinyaller ve kullanici onerileri tek raporda listelenir."
  }
];

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
        <Navbar theme={theme} setTheme={setTheme} />
        <SecurityCenter />
        <Hero />
        <StatsBand />
        <CyberNewsCenter />
        <ParserHealth />
        <TodayCyberEvent />
        <HowItWorks />
        <FeedbackForm />
        <GuidesPreview />
        <Footer />
      </div>
    </main>
  );
}

function Navbar({
  theme,
  setTheme
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-900/10 bg-white/92 shadow-sm shadow-cyan-950/5 backdrop-blur dark:border-cyan-300/10 dark:bg-slate-950/90">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo subtitle="AI guvenlik platformu" />

          <div className="flex items-center gap-2">
            <Link className="hidden rounded-md border border-cyan-900/12 px-3 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10 sm:inline-flex" href="/giris-yap">
              Giriş Yap
            </Link>
            <Link className="hidden rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100 sm:inline-flex" href="/kayit-ol">
              Kayıt Ol
            </Link>
            <button
              aria-label="Tema degistir"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-900/15 bg-white text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 hover:text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:text-cyan-100 dark:hover:bg-cyan-300/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
            >
              {theme === "dark" ? "L" : "D"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link className="shrink-0 rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50" href="/hakkimizda">
            Hakkimizda
          </Link>
          <Link className="shrink-0 rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50" href="/siber-arsiv">
            Siber Arsiv
          </Link>
          <Link className="shrink-0 rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50" href="/sorgu-paneli">
            Sorgu Paneli
          </Link>
          <Link className="shrink-0 rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50" href="/dijital-arac-merkezi">
            Dijital Arac Merkezi
          </Link>
          <a className="shrink-0 rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50" href="#rehberler">
            Rehberler
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="max-w-4xl">
          <p className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200">
            Vatandaslar icin AI destekli dijital guvenlik
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Dijital riskleri herkesin anlayacagi guven raporlarina cevir.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Sahte site, phishing link, riskli satici ve supheli mesaj sinyallerini sade bir dille aciklayan modern guvenlik platformu.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="flex min-h-12 items-center justify-center rounded-md bg-slate-900 px-5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" href="/sorgu-paneli">
              Sorgu Panelini Ac
            </Link>
            <Link className="flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" href="/siber-arsiv">
              Siber Arsivi Incele
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-6 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
        {platformStats.map((stat) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5" key={stat.label}>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TodayCyberEvent() {
  const event = getTodayCyberEvent();

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">
            Bugunun Siber Olayi
          </p>
          <h2 className="mt-2 text-3xl font-bold">Siber Kirilma Noktalari</h2>
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{event.dateLabel}</p>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            <span className="font-bold">Etkisi: </span>
            {event.impact}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link className="flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" href={`/siber-arsiv#${event.slug}`}>
              Detayini Oku
            </Link>
            <a className="flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" href={event.sourceUrl} rel="noreferrer" target="_blank">
              Kaynak: {event.sourceName}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Nasil calisir?</p>
          <h2 className="mt-2 text-3xl font-bold">Uc adimda sade risk sonucu.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Teknik kontroller arka planda calisir; kullanici yalnizca neye dikkat etmesi gerektigini gorur.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuidesPreview() {
  const guides = [
    "Sahte site nasil anlasilir?",
    "Riskli SMS nasil tespit edilir?",
    "Fake yorum nasil anlasilir?",
    "Instagram hesabi nasil korunur?"
  ];

  return (
    <section id="rehberler" className="border-t border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Rehberler</p>
          <h2 className="mt-2 text-3xl font-bold">Halkin anlayacagi guvenlik dili.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Teknik tehditleri sade, uygulanabilir ve SEO uyumlu rehberlere donusturen icerik alani.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {guides.map((guide) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5" key={guide}>
              <h3 className="font-bold">{guide}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Kisa kontrol listesi, risk sinyalleri ve guvenli hareket onerileriyle hazirlanacak.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg font-bold">Dijital Iz Avcisi</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            AI destekli analizler bilgilendirme amaclidir. Platform kesin suclama yapmaz; riskli davranis, phishing paterni ve supheli sinyal dilini kullanir.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
          <Link className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="/hakkimizda">Hakkimizda</Link>
          <Link className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="/kvkk">KVKK</Link>
          <Link className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="/gizlilik">Gizlilik</Link>
          <Link className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="/yasal-uyari">Yasal Uyari</Link>
          <Link className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="/iletisim">Iletisim</Link>
        </nav>
      </div>
    </footer>
  );
}
