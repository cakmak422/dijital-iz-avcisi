"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutSection } from "@/components/AboutSection";
import { AwarenessSlider } from "@/components/AwarenessSlider";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { CyberNewsCenter } from "@/components/CyberNewsCenter";
import { CyberPageShell } from "@/components/CyberPageShell";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SecurityCenter } from "@/components/SecurityCenter";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";
import { getTodayCyberEvent } from "@/lib/cyberArchive";

type Theme = "light" | "dark";

const platformStats = [
  { label: "Analiz edilen link", value: "12.480", detail: "demo veri" },
  { label: "Riskli sinyal yakalandi", value: "1.936", detail: "site ve satici" },
  { label: "Gunluk analiz", value: "420", detail: "ortalama demo" }
];


export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <main className={theme === "dark" ? "dark" : ""}>
        <CyberPageShell as="div" className="home-reference-page transition-colors" variant="home">
        <Navbar theme={theme} setTheme={setTheme} />
        <Hero />
        <SecurityCenter />
        <AnnouncementBanner />
        <AwarenessSlider />
        <StatsBand />
        <CyberNewsCenter />
        <TodayCyberEvent />
        <FeedbackForm />
        <GuidesPreview />
        <AboutSection />
        <Footer />
      </CyberPageShell>
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { href: "/hakkimizda", label: "Hakkimizda" },
    { href: "/siber-arsiv", label: "Siber Arsiv" },
    { href: "/haberler", label: "Haberler" },
    { href: "/sorgu-paneli", label: "Sorgu Paneli" },
    { href: "/dijital-arac-merkezi", label: "Dijital Arac Merkezi" }
  ];
  const authItems = [
    { href: "/giris-yap", label: "Giris Yap", variant: "secondary" },
    { href: "/kayit-ol", label: "Kayit Ol", variant: "primary" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-900/10 bg-white/88 shadow-sm shadow-cyan-950/5 backdrop-blur-xl dark:border-cyan-300/10 dark:bg-slate-950/88">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo subtitle="AI guvenlik platformu" />

          <div className="flex items-center gap-2">
            {authItems.map((item) => (
              <Link
                className={`focus-ring hidden rounded-md px-3 py-2 text-sm font-semibold transition lg:inline-flex ${
                  item.variant === "primary"
                    ? "bg-slate-900 text-white hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
                    : "border border-cyan-900/12 hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            <button
              aria-label="Tema degistir"
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-cyan-900/15 bg-white text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 hover:text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:text-cyan-100 dark:hover:bg-cyan-300/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
            >
              {theme === "dark" ? "L" : "D"}
            </button>
            <button
              aria-expanded={menuOpen}
              aria-label="Menuyu ac veya kapat"
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-cyan-900/15 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 hover:text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:text-cyan-100 dark:hover:bg-cyan-300/10 lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              type="button"
            >
              {menuOpen ? "X" : "☰"}
            </button>
          </div>
        </div>

        <div className={`${menuOpen ? "grid" : "hidden"} gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:flex lg:overflow-visible lg:pb-0`}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link className={`focus-ring flex min-h-11 items-center rounded-md border px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50 lg:shrink-0 ${active ? "border-cyan-500/40 bg-cyan-50 text-cyan-950 dark:border-cyan-300/30 dark:bg-cyan-300/15 dark:text-cyan-50" : "border-cyan-900/12 bg-white dark:border-cyan-300/15 dark:bg-cyan-300/5"}`} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            );
          })}
          <Link className="focus-ring flex min-h-11 items-center rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50 lg:shrink-0" href="/rehberler" onClick={() => setMenuOpen(false)}>
            Rehberler
          </Link>
          <div className="grid gap-2 border-t border-slate-200 pt-2 dark:border-white/10 lg:hidden">
            {authItems.map((item) => (
              <Link
                className={`focus-ring flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition ${
                  item.variant === "primary"
                    ? "bg-slate-900 text-white hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
                    : "border border-cyan-900/12 hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const heroTitle = useEditableContent("home.hero.title").content;
  const heroDescription = useEditableContent("home.hero.description").content;

  return (
    <section className="home-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Vatandaslar icin AI destekli dijital guvenlik
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            {heroDescription}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="/sorgu-paneli">
              Sorgu Panelini Ac
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/siber-arsiv">
              Siber Arsivi Incele
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnnouncementBanner() {
  return (
    <section className="cyber-section border-b border-cyan-900/10 bg-cyan-50 px-4 py-3 dark:border-cyan-300/10 dark:bg-cyan-400/10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-800 dark:text-cyan-100">Duyuru</p>
        <EditableContent as="p" className="text-sm leading-6 text-slate-700 dark:text-cyan-50 sm:text-right" contentKey="home.announcement.banner" />
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="cyber-section border-b border-slate-200 bg-slate-50 px-4 py-6 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
        {platformStats.map((stat) => (
            <article className="premium-card p-5" key={stat.label}>
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
    <section className="cyber-section border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">
            Bugunun Siber Olayi
          </p>
          <h2 className="mt-2 text-3xl font-bold">Siber Kirilma Noktalari</h2>
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{event.dateLabel}</p>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
          <EditableContent as="p" className="mt-3 leading-7 text-slate-600 dark:text-slate-300" contentKey="home.todayCyberEvent.text" />
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

function GuidesPreview() {
  const guides = [
    {
      title: "Sahte site nasil anlasilir?",
      category: "Site guvenligi",
      summary: "Alan adi, SSL, marka taklidi ve odeme sayfasi sinyallerini kontrol etmek icin pratik rehber.",
      readTime: "4 dk"
    },
    {
      title: "Riskli SMS nasil tespit edilir?",
      category: "Mesaj analizi",
      summary: "Aciliyet baskisi, kurum taklidi, link yonlendirmesi ve kod talebi gibi paternleri ayirt edin.",
      readTime: "3 dk"
    },
    {
      title: "Fake yorum nasil anlasilir?",
      category: "Alisveris guvenligi",
      summary: "Tekrarlayan ifade, ani puan artisları ve asiri benzer yorum sinyallerini sade sekilde okuyun.",
      readTime: "5 dk"
    },
    {
      title: "Instagram hesabi nasil korunur?",
      category: "Siber farkindalik",
      summary: "2FA, oturum kontrolu, fake destek mesajlari ve hesap kurtarma riskleri icin temel kontrol listesi.",
      readTime: "4 dk"
    }
  ];

  return (
    <section id="rehberler" className="cyber-section border-t border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <EditableContent as="p" className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200" contentKey="home.guides.eyebrow" />
          <EditableContent as="h2" className="mt-2 text-3xl font-bold" contentKey="home.guides.title" />
          <EditableContent as="p" className="mt-3 leading-7 text-slate-600 dark:text-slate-300" contentKey="home.guides.description" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {guides.map((guide, index) => (
            <article className="premium-card overflow-hidden bg-slate-50 dark:bg-white/5" key={guide.title}>
              <div className={`h-20 bg-gradient-to-br ${index % 2 === 0 ? "from-cyan-950 via-slate-900 to-emerald-900" : "from-slate-950 via-blue-950 to-cyan-900"} p-4 text-white`}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/20 bg-white/10 text-sm font-bold">{index + 1}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">{guide.category}</p>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{guide.readTime}</span>
                </div>
                <h3 className="mt-3 font-bold">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{guide.summary}</p>
                <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10" type="button">
                  Rehberi Oku
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const supportEmail = useEditableContent("home.footer.supportEmail").content;
  const reportEmail = useEditableContent("home.footer.reportEmail").content;

  return (
    <footer className="border-t border-slate-200 bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
        <div>
          <EditableContent as="p" className="text-lg font-bold" contentKey="home.footer.title" />
          <EditableContent as="p" className="mt-2 max-w-2xl text-sm leading-6 text-slate-300" contentKey="home.footer.description" />
          <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Platform bilgilendirme amaciyla risk sinyalleri uretir; kesin hukum veya suc isnadi olusturmaz.
          </p>
        </div>
        <nav className="grid gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Hizli baglantilar</p>
          <Link className="transition hover:text-cyan-100" href="/sorgu-paneli">Sorgu Paneli</Link>
          <Link className="transition hover:text-cyan-100" href="/dijital-arac-merkezi">Dijital Arac Merkezi</Link>
          <Link className="transition hover:text-cyan-100" href="/siber-arsiv">Siber Arsiv</Link>
          <Link className="transition hover:text-cyan-100" href="/hakkimizda">Hakkimizda</Link>
        </nav>
        <nav className="grid gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Yasal</p>
          <Link className="transition hover:text-cyan-100" href="/kvkk">KVKK</Link>
          <Link className="transition hover:text-cyan-100" href="/gizlilik">Gizlilik</Link>
          <Link className="transition hover:text-cyan-100" href="/yasal-uyari">Yasal Uyari</Link>
          <Link className="transition hover:text-cyan-100" href="/iletisim">Iletisim</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Iletisim</p>
          <a className="transition hover:text-cyan-100" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <a className="transition hover:text-cyan-100" href={`mailto:${reportEmail}`}>{reportEmail}</a>
          <EditableContent as="p" className="pt-3 text-xs text-slate-500" contentKey="home.footer.copyright" />
        </div>
      </div>
    </footer>
  );
}
