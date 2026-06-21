import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberArchiveExplorer } from "@/components/CyberArchiveExplorer";

export const metadata: Metadata = {
  title: "Siber Arşiv",
  description: "Tarihte iz bırakan siber olaylar, veri sızıntıları ve dijital tehdit arşivi.",
  alternates: { canonical: "/siber-arsiv" },
  openGraph: { title: "Siber Arşiv | Dijital İz Avcısı", description: "Siber kırılma noktaları ve dijital güvenlik tarihi.", url: "/siber-arsiv" }
};
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { getCyberTimelineEventsForPublic, pickTodayTimelineEvent } from "@/lib/cyberTimelineDb";

export const dynamic = "force-dynamic";

export default async function CyberArchivePage() {
  const { events } = await getCyberTimelineEventsForPublic();
  const todayEvent = pickTodayTimelineEvent(events);

  return (
    <CyberPageShell className="archive-reference-page" variant="archive">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Siber Olay Arşivi" />
          <div className="flex gap-2">
            <Link className="btn-secondary px-4 py-2 text-sm" href="/sorgu-paneli">
              Sorgu Paneli
            </Link>
            <Link className="btn-secondary px-4 py-2 text-sm" href="/">
              Ana Sayfa
            </Link>
          </div>
        </nav>
      </header>

      <ArchiveReferenceHero />

      <section className="archive-status-band border-b border-cyan-300/15 px-4 py-6 sm:px-6 lg:px-8">
        <div className="archive-status-card mx-auto flex max-w-7xl flex-col gap-2 rounded-lg border p-4 text-cyan-50">
          <p className="text-sm font-bold">Bugünün seçili olayı: {todayEvent.title}</p>
          <p className="text-sm leading-6">
            Ana sayfadaki güncel kart takvim gününe göre gece 00:00 sonrasında bu arşivden yeni olaya geçer.
          </p>
        </div>
      </section>

      <section id="arsiv-listesi" className="px-4 py-10 sm:px-6 lg:px-8">
        <CyberArchiveExplorer events={events} />
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}

function ArchiveReferenceHero() {
  return (
    <ManagedPageHero
      actions={[
        { href: "#arsiv-listesi", label: "Arşivi İncele" },
        { href: "/sorgu-paneli", label: "Sorgu Paneli", variant: "secondary" }
      ]}
      className="archive-reference-hero"
      fallback={{
        title: "Siber Kırılma Noktaları",
        description: "Tarihte iz bırakan siber olayları; kaynak, etki ve güvenlik dersiyle birlikte sade bir arşivde topluyoruz.",
        image: "/awareness/arsiv.png"
      }}
      slug="siber-arsiv"
    />
  );
}
