"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutSection } from "@/components/AboutSection";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { AwarenessSlider } from "@/components/AwarenessSlider";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { CyberNewsCenter } from "@/components/CyberNewsCenter";
import { CyberPageShell } from "@/components/CyberPageShell";
import { FeedbackForm } from "@/components/FeedbackForm";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";
import { getTodayCyberEvent, type CyberArchiveEvent } from "@/lib/cyberArchive";
import { getCurrentDemoUser } from "@/lib/auth";
import type { User } from "@/lib/users";

type Theme = "light" | "dark";

const HOME_CONTAINER = "mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 xl:px-12";

const platformStats = [
  { label: "Analiz edilen link", value: "12.480", detail: "demo veri" },
  { label: "Riskli sinyal yakalandı", value: "1.936", detail: "site ve satıcı" },
  { label: "Günlük analiz", value: "420", detail: "ortalama demo" }
];


export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <main className={theme === "dark" ? "dark" : ""}>
        <CyberPageShell as="div" className="home-reference-page home-general-theme overflow-x-hidden transition-colors" variant="home">
        <Navbar theme={theme} setTheme={setTheme} />
        <Hero />
        <AnnouncementBanner />
        <AwarenessSlider backgroundImage="/awareness/afistema.png" />
        <StatsBand />
        <CyberNewsCenter />
        <TodayCyberEvent />
        <FeedbackForm />
        <GuidesPreview />
        <AboutSection wide />
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navItems = [
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/siber-arsiv", label: "Siber Arşiv" },
    { href: "/haberler", label: "Haberler" },
    { href: "/bilinclendirme", label: "Bilinçlendirme" },
    { href: "/sorgu-paneli", label: "Sorgu Paneli" },
    { href: "/dijital-arac-merkezi", label: "Dijital Araç Merkezi" }
  ];
  const authItems = [
    { href: "/giris-yap", label: "Giriş Yap", variant: "secondary" },
    { href: "/kayit-ol", label: "Kayıt Ol", variant: "primary" }
  ];
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    setCurrentUser(getCurrentDemoUser());
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-900/10 bg-white/88 shadow-sm shadow-cyan-950/5 backdrop-blur-xl dark:border-cyan-300/10 dark:bg-slate-950/88">
      <nav className={`${HOME_CONTAINER} grid min-h-16 gap-3 py-3 xl:grid-cols-[auto_1fr_auto] xl:items-center`}>
        <div className="flex w-full items-center justify-between gap-4 xl:contents">
          <BrandLogo subtitle="AI güvenlik platformu" />

          <div className="flex items-center gap-2 xl:order-3">
            {isAdmin ? (
              <AdminSessionMenu className="hidden lg:block" onLogout={() => setCurrentUser(null)} user={currentUser} />
            ) : (
              authItems.map((item) => (
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
              ))
            )}
            <button
              aria-label="Tema değiştir"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-md border border-cyan-900/15 bg-white text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 hover:text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:text-cyan-100 dark:hover:bg-cyan-300/10 sm:flex"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
            >
              {theme === "dark" ? "L" : "D"}
            </button>
            <button
              aria-expanded={menuOpen}
              aria-label="Menüyü aç veya kapat"
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-cyan-900/15 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 hover:text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-300/5 dark:text-cyan-100 dark:hover:bg-cyan-300/10 lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              type="button"
            >
              {menuOpen ? "X" : "☰"}
            </button>
          </div>
        </div>

        <div className={`${menuOpen ? "grid" : "hidden"} gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:flex lg:overflow-visible lg:pb-0 xl:order-2 xl:justify-center`}>
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
            {isAdmin ? (
              <AdminSessionMenu
                fullWidth
                onLogout={() => setCurrentUser(null)}
                onNavigate={() => setMenuOpen(false)}
                user={currentUser}
              />
            ) : (
              authItems.map((item) => (
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
              ))
            )}
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
    <section className="home-reference-hero relative overflow-hidden border-b border-cyan-300/15">
      <div className={`${HOME_CONTAINER} relative z-10 flex min-h-[330px] items-center py-7 sm:min-h-[360px] sm:py-8 lg:min-h-[400px] lg:py-8`}>
        <div className="w-full max-w-[20.5rem] sm:max-w-3xl sm:pr-0">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Vatandaşlar için AI destekli dijital güvenlik
          </p>
          <h1 className="mt-6 max-w-3xl text-[1.7rem] font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-5 max-w-full text-sm leading-7 text-slate-200 sm:max-w-2xl sm:text-lg sm:leading-8">
            {heroDescription}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="/sorgu-paneli">
              Sorgu Panelini Aç
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/siber-arsiv">
              Siber Arşivi İncele
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnnouncementBanner() {
  return (
    <section className="cyber-section border-b border-cyan-900/10 bg-cyan-50 py-3 dark:border-cyan-300/10 dark:bg-cyan-400/10">
      <div className={`${HOME_CONTAINER} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-800 dark:text-cyan-100">Duyuru</p>
        <EditableContent as="p" className="text-sm leading-6 text-slate-700 dark:text-cyan-50 sm:text-right" contentKey="home.announcement.banner" />
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="cyber-section cyber-pattern-dots border-b border-cyan-300/12 py-5">
      <div className={`${HOME_CONTAINER} grid gap-3 sm:grid-cols-3`}>
        {platformStats.map((stat) => (
          <article className="stat-card premium-card p-5" key={stat.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TodayCyberEvent() {
  const [event, setEvent] = useState<CyberArchiveEvent>(() => getTodayCyberEvent());

  useEffect(() => {
    let cancelled = false;

    async function loadTimelineEvent() {
      try {
        const response = await fetch("/api/cyber-timeline/events?today=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { event?: CyberArchiveEvent };
        if (!cancelled && data.event) {
          setEvent(data.event);
        }
      } catch {
        // Timeline DB erişilemezse yerel arşiv fallback'i ekranda kalır.
      }
    }

    loadTimelineEvent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="cyber-section cyber-pattern-section border-b border-cyan-300/12 py-10">
      <div className={`${HOME_CONTAINER} grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center`}>
        <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
        <div>
          <p className="cyber-eyebrow">Bugünün Siber Olayı</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Siber Kırılma Noktaları</h2>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{event.dateLabel}</p>
          <p className="mt-4 leading-7 text-slate-300">{event.summary}</p>
          <EditableContent as="p" className="mt-3 leading-7 text-slate-400" contentKey="home.todayCyberEvent.text" />
          <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            <span className="font-bold text-amber-50">Etkisi: </span>
            {event.impact}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href={`/siber-arsiv#${event.slug}`}>
              Detayını Oku
            </Link>
            <a className="btn-secondary min-h-11 px-5" href={event.sourceUrl} rel="noreferrer" target="_blank">
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
      title: "Sahte site nasıl anlaşılır?",
      category: "Site güvenliği",
      summary: "Alan adı, SSL, marka taklidi ve ödeme sayfası sinyallerini kontrol etmek için pratik rehber.",
      readTime: "4 dk"
    },
    {
      title: "Riskli SMS nasıl tespit edilir?",
      category: "Mesaj analizi",
      summary: "Aciliyet baskısı, kurum taklidi, link yönlendirmesi ve kod talebi gibi paternleri ayırt edin.",
      readTime: "3 dk"
    },
    {
      title: "Sahte yorum nasıl anlaşılır?",
      category: "Alışveriş güvenliği",
      summary: "Tekrarlayan ifade, ani puan artışları ve aşırı benzer yorum sinyallerini sade şekilde okuyun.",
      readTime: "5 dk"
    },
    {
      title: "Instagram hesabı nasıl korunur?",
      category: "Siber farkındalık",
      summary: "2FA, oturum kontrolü, sahte destek mesajları ve hesap kurtarma riskleri için temel kontrol listesi.",
      readTime: "4 dk"
    }
  ];

  return (
    <section id="rehberler" className="cyber-section cyber-pattern-circuit border-t border-cyan-300/12 py-10">
      <div className={`${HOME_CONTAINER} grid gap-6 lg:grid-cols-[320px_1fr]`}>
        <div>
          <EditableContent as="p" className="cyber-eyebrow" contentKey="home.guides.eyebrow" />
          <EditableContent as="h2" className="mt-4 text-3xl font-bold text-white" contentKey="home.guides.title" />
          <EditableContent as="p" className="mt-3 leading-7 text-slate-300" contentKey="home.guides.description" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {guides.map((guide, index) => (
            <article className="premium-card flex h-full flex-col overflow-hidden" key={guide.title}>
              <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${index % 2 === 0 ? "from-cyan-950 via-slate-900 to-emerald-950" : "from-slate-950 via-blue-950 to-cyan-950"} p-4`}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[length:24px_24px]" />
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/25 bg-white/10 text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">{guide.category}</p>
                  <span className="rounded-md border border-cyan-300/18 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100">{guide.readTime}</span>
                </div>
                <h3 className="mt-3 font-bold text-white">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{guide.summary}</p>
                <button className="btn-secondary mt-auto min-h-9 px-3 text-xs" type="button">
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
    <footer className="site-footer-premium border-t border-cyan-300/15 bg-slate-950 py-10 text-white">
      <div className={`${HOME_CONTAINER} grid gap-8 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]`}>
        <div>
          <EditableContent as="p" className="text-lg font-bold" contentKey="home.footer.title" />
          <EditableContent as="p" className="mt-2 max-w-2xl text-sm leading-6 text-slate-300" contentKey="home.footer.description" />
          <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Platform bilgilendirme amacıyla risk sinyalleri üretir; kesin hüküm veya suç isnadı oluşturmaz.
          </p>
        </div>
        <nav className="grid content-start gap-1.5 text-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Hızlı Bağlantılar</p>
          <Link className="footer-link" href="/sorgu-paneli">Sorgu Paneli</Link>
          <Link className="footer-link" href="/dijital-arac-merkezi">Dijital Araç Merkezi</Link>
          <Link className="footer-link" href="/siber-arsiv">Siber Arşiv</Link>
          <Link className="footer-link" href="/hakkimizda">Hakkımızda</Link>
        </nav>
        <nav className="grid content-start gap-1.5 text-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Yasal</p>
          <Link className="footer-link" href="/kvkk">KVKK</Link>
          <Link className="footer-link" href="/gizlilik">Gizlilik</Link>
          <Link className="footer-link" href="/yasal-uyari">Yasal Uyarı</Link>
          <Link className="footer-link" href="/iletisim">İletişim</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm text-slate-400">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">İletişim</p>
          <a className="footer-link" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <a className="footer-link" href={`mailto:${reportEmail}`}>{reportEmail}</a>
          <EditableContent as="p" className="pt-3 text-xs text-slate-600" contentKey="home.footer.copyright" />
        </div>
      </div>
    </footer>
  );
}
