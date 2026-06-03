"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { CyberNewsCenter } from "@/components/CyberNewsCenter";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ParserHealth } from "@/components/ParserHealth";
import { SecurityCenter } from "@/components/SecurityCenter";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";
import { getTodayCyberEvent } from "@/lib/cyberArchive";
import { useDeviceType } from "@/lib/useDeviceType";

type Theme = "light" | "dark";

const platformStats = [
  { label: "Analiz edilen link", value: "12.480", detail: "demo veri" },
  { label: "Riskli sinyal yakalandi", value: "1.936", detail: "site ve satici" },
  { label: "Gunluk analiz", value: "420", detail: "ortalama demo" }
];

const howItWorks = [
  {
    title: "Link yapistir",
    icon: "01",
    body: "Urun, site, IP veya mesaj bilgisini ilgili analiz paneline gir."
  },
  {
    title: "AI analiz etsin",
    icon: "AI",
    body: "Parser, guvenlik kontrolleri ve AI ozetleme katmani risk paternlerini sade dile cevirir."
  },
  {
    title: "Risk sonucunu ogren",
    icon: "✓",
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
        <AnnouncementBanner />
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
  const pathname = usePathname();
  const deviceType = useDeviceType();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = deviceType === "desktop";
  const navItems = [
    { href: "/hakkimizda", label: "Hakkimizda" },
    { href: "/siber-arsiv", label: "Siber Arsiv" },
    { href: "/haberler", label: "Haberler" },
    { href: "/sorgu-paneli", label: "Sorgu Paneli" },
    { href: "/dijital-arac-merkezi", label: "Dijital Arac Merkezi" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-900/10 bg-white/88 shadow-sm shadow-cyan-950/5 backdrop-blur-xl dark:border-cyan-300/10 dark:bg-slate-950/88">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo subtitle="AI guvenlik platformu" />

          <div className="flex items-center gap-2">
            <Link className="focus-ring hidden rounded-md border border-cyan-900/12 px-3 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10 lg:inline-flex" href="/giris-yap">
              Giriş Yap
            </Link>
            <Link className="focus-ring hidden rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100 lg:inline-flex" href="/kayit-ol">
              Kayıt Ol
            </Link>
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

        <div className={`${isDesktop || menuOpen ? "grid" : "hidden"} gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:flex lg:overflow-visible lg:pb-0`}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link className={`focus-ring flex min-h-11 items-center rounded-md border px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50 lg:shrink-0 ${active ? "border-cyan-500/40 bg-cyan-50 text-cyan-950 dark:border-cyan-300/30 dark:bg-cyan-300/15 dark:text-cyan-50" : "border-cyan-900/12 bg-white dark:border-cyan-300/15 dark:bg-cyan-300/5"}`} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            );
          })}
          <a className="focus-ring flex min-h-11 items-center rounded-md border border-cyan-900/12 bg-white px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50 lg:shrink-0" href="#rehberler" onClick={() => setMenuOpen(false)}>
            Rehberler
          </a>
          <div className="grid gap-2 border-t border-slate-200 pt-2 dark:border-white/10 lg:hidden">
            <Link className="focus-ring flex min-h-11 items-center justify-center rounded-md border border-cyan-900/12 px-3 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/giris-yap" onClick={() => setMenuOpen(false)}>
              Giris Yap
            </Link>
            <Link className="focus-ring flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" href="/kayit-ol" onClick={() => setMenuOpen(false)}>
              Kayit Ol
            </Link>
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
    <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="cyber-grid absolute inset-0 opacity-70" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/10" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-14">
        <div className="max-w-4xl">
          <p className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200">
            Vatandaslar icin AI destekli dijital guvenlik
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-6xl dark:text-white">{heroTitle}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">{heroDescription}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-12 w-full text-base sm:w-auto" href="/sorgu-paneli">
              Sorgu Panelini Ac
            </Link>
            <Link className="btn-secondary min-h-12 w-full text-base sm:w-auto" href="/siber-arsiv">
              Siber Arsivi Incele
            </Link>
          </div>
        </div>
        <div className="premium-card relative min-h-72 overflow-hidden p-5 dark:bg-slate-900/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.18),transparent_36%)]" />
          <div className="relative grid h-full content-between">
            <div className="flex items-center justify-between">
              <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100">Risk radari</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Canli demo</span>
            </div>
            <div className="my-8 grid place-items-center">
              <div className="relative h-36 w-36 rounded-full border border-cyan-300/50 bg-slate-950 shadow-2xl shadow-cyan-950/20">
                <div className="absolute inset-4 rounded-full border border-cyan-300/35" />
                <div className="absolute inset-10 rounded-full border border-emerald-300/45 bg-cyan-300/10" />
                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200" />
                <div className="absolute left-1/2 top-1/2 h-0.5 w-16 origin-left -translate-y-1/2 rotate-45 bg-cyan-200" />
              </div>
            </div>
            <div className="grid gap-2">
              {["Phishing paterni", "Satici sinyali", "Mesaj riski"].map((item, index) => (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" key={item}>
                  <span>{item}</span>
                  <span className={index === 0 ? "font-bold text-amber-600 dark:text-amber-200" : "font-bold text-cyan-700 dark:text-cyan-200"}>{index === 0 ? "Dikkat" : "Izleniyor"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnnouncementBanner() {
  return (
    <section className="border-b border-cyan-900/10 bg-cyan-50 px-4 py-3 dark:border-cyan-300/10 dark:bg-cyan-400/10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-800 dark:text-cyan-100">Duyuru</p>
        <EditableContent as="p" className="text-sm leading-6 text-slate-700 dark:text-cyan-50 sm:text-right" contentKey="home.announcement.banner" />
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-6 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
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
            <article className="premium-card bg-slate-50 p-5 dark:bg-white/5" key={step.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white shadow-sm shadow-cyan-950/20 dark:bg-white dark:text-slate-950">
                {step.icon}
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
    <section id="rehberler" className="border-t border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
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
