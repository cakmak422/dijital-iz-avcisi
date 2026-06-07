"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutSection } from "@/components/AboutSection";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { CyberNewsCenter } from "@/components/CyberNewsCenter";
import { CyberPageShell } from "@/components/CyberPageShell";
import { FeedbackForm } from "@/components/FeedbackForm";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";
import { getTodayCyberEvent } from "@/lib/cyberArchive";
import { getCurrentDemoUser } from "@/lib/auth";
import { usePageManagementState } from "@/lib/pageManagementStore";
import type { ManagedHomeBlock, ManagedNavigationItem } from "@/types/pageManagement";
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
  const pageManagement = usePageManagementState();
  const homeBlocks = pageManagement.homeBlocks.filter((block) => block.status === "active").sort((a, b) => a.order - b.order);

  return (
    <main className={theme === "dark" ? "dark" : ""}>
        <CyberPageShell as="div" className="home-reference-page home-general-theme overflow-x-hidden transition-colors" variant="home">
        <Navbar navigation={pageManagement.navigation} theme={theme} setTheme={setTheme} />
        {homeBlocks.map((block) => (
          <HomeBlockRenderer block={block} key={block.id} />
        ))}
        <Footer />
      </CyberPageShell>
    </main>
  );
}

function Navbar({
  navigation,
  theme,
  setTheme
}: {
  navigation: ManagedNavigationItem[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navItems = navigation.filter((item) => item.status === "active").sort((a, b) => a.order - b.order);
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
              <Link
                className={`focus-ring flex min-h-11 items-center rounded-md border px-3 py-2 shadow-sm transition hover:border-cyan-500/45 hover:bg-cyan-50 hover:text-cyan-950 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50 lg:shrink-0 ${active ? "border-cyan-500/40 bg-cyan-50 text-cyan-950 dark:border-cyan-300/30 dark:bg-cyan-300/15 dark:text-cyan-50" : "border-cyan-900/12 bg-white dark:border-cyan-300/15 dark:bg-cyan-300/5"}`}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
                rel={item.openInNewTab ? "noreferrer" : undefined}
                target={item.openInNewTab ? "_blank" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
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

function HomeBlockRenderer({ block }: { block: ManagedHomeBlock }) {
  switch (block.type) {
    case "hero":
      return <Hero />;
    case "risk-notes":
      return (
        <>
          <AnnouncementBanner />
          <StatsBand />
        </>
      );
    case "news":
      return <CyberNewsCenter />;
    case "cyber-event":
      return <TodayCyberEvent />;
    case "contact":
      return <FeedbackForm />;
    case "guides":
      return <GuidesPreview />;
    case "about":
      return <AboutSection wide />;
    case "security-center":
    case "awareness":
    case "footer-cta":
    default:
      return <ManagedHomeBlockSection block={block} />;
  }
}

function ManagedHomeBlockSection({ block }: { block: ManagedHomeBlock }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className={`${HOME_CONTAINER} rounded-2xl border border-cyan-300/15 bg-slate-950/72 p-6 text-white shadow-xl shadow-cyan-950/20 backdrop-blur-xl`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-200">{block.icon || "cms"}</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">{block.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{block.subtitle}</p>
          </div>
          {block.buttonLabel && block.buttonHref ? (
            <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200" href={block.buttonHref}>
              {block.buttonLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
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
    <section className="cyber-section border-b border-slate-200 bg-slate-50 py-5 dark:border-white/10 dark:bg-slate-950">
      <div className={`${HOME_CONTAINER} grid gap-3 sm:grid-cols-3`}>
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
    <section className="cyber-section border-b border-slate-200 bg-white py-8 dark:border-white/10 dark:bg-slate-950">
      <div className={`${HOME_CONTAINER} grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center`}>
        <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">
            Bugünün Siber Olayı
          </p>
          <h2 className="mt-2 text-3xl font-bold">Siber Kırılma Noktaları</h2>
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{event.dateLabel}</p>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
          <EditableContent as="p" className="mt-3 leading-7 text-slate-600 dark:text-slate-300" contentKey="home.todayCyberEvent.text" />
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            <span className="font-bold">Etkisi: </span>
            {event.impact}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link className="flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" href={`/siber-arsiv#${event.slug}`}>
              Detayını Oku
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
    <section id="rehberler" className="cyber-section border-t border-slate-200 bg-white py-8 dark:border-white/10 dark:bg-slate-950">
      <div className={`${HOME_CONTAINER} grid gap-5 lg:grid-cols-[340px_1fr]`}>
        <div>
          <EditableContent as="p" className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200" contentKey="home.guides.eyebrow" />
          <EditableContent as="h2" className="mt-2 text-3xl font-bold" contentKey="home.guides.title" />
          <EditableContent as="p" className="mt-3 leading-7 text-slate-600 dark:text-slate-300" contentKey="home.guides.description" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {guides.map((guide, index) => (
            <article className="premium-card flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-white/5" key={guide.title}>
              <div className={`h-20 bg-gradient-to-br ${index % 2 === 0 ? "from-cyan-950 via-slate-900 to-emerald-900" : "from-slate-950 via-blue-950 to-cyan-900"} p-4 text-white`}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/20 bg-white/10 text-sm font-bold">{index + 1}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">{guide.category}</p>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{guide.readTime}</span>
                </div>
                <h3 className="mt-3 font-bold">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{guide.summary}</p>
                <button className="mt-auto rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10" type="button">
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
    <footer className="border-t border-slate-200 bg-slate-950 py-8 text-white">
      <div className={`${HOME_CONTAINER} grid gap-8 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]`}>
        <div>
          <EditableContent as="p" className="text-lg font-bold" contentKey="home.footer.title" />
          <EditableContent as="p" className="mt-2 max-w-2xl text-sm leading-6 text-slate-300" contentKey="home.footer.description" />
          <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Platform bilgilendirme amacıyla risk sinyalleri üretir; kesin hüküm veya suç isnadı oluşturmaz.
          </p>
        </div>
        <nav className="grid gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Hızlı bağlantılar</p>
          <Link className="transition hover:text-cyan-100" href="/sorgu-paneli">Sorgu Paneli</Link>
          <Link className="transition hover:text-cyan-100" href="/dijital-arac-merkezi">Dijital Araç Merkezi</Link>
          <Link className="transition hover:text-cyan-100" href="/siber-arsiv">Siber Arşiv</Link>
          <Link className="transition hover:text-cyan-100" href="/hakkimizda">Hakkımızda</Link>
        </nav>
        <nav className="grid gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Yasal</p>
          <Link className="transition hover:text-cyan-100" href="/kvkk">KVKK</Link>
          <Link className="transition hover:text-cyan-100" href="/gizlilik">Gizlilik</Link>
          <Link className="transition hover:text-cyan-100" href="/yasal-uyari">Yasal Uyarı</Link>
          <Link className="transition hover:text-cyan-100" href="/iletisim">İletişim</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">İletişim</p>
          <a className="transition hover:text-cyan-100" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <a className="transition hover:text-cyan-100" href={`mailto:${reportEmail}`}>{reportEmail}</a>
          <EditableContent as="p" className="pt-3 text-xs text-slate-500" contentKey="home.footer.copyright" />
        </div>
      </div>
    </footer>
  );
}
