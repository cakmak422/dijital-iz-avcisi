import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberArchiveExplorer } from "@/components/CyberArchiveExplorer";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { getCyberArchiveEvents, getTodayCyberEvent } from "@/lib/cyberArchive";

export default function CyberArchivePage() {
  const events = getCyberArchiveEvents();
  const todayEvent = getTodayCyberEvent();

  return (
    <CyberPageShell className="archive-reference-page" variant="archive">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo subtitle="Siber olay arşivi" />
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" href="/">
                Ana Sayfa
              </Link>
              <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" href="/sorgu-paneli">
                Sorgu Paneli
              </Link>
            </div>
          </div>
        </div>
      </header>

      <ArchiveReferenceHero />

      <section className="archive-status-band border-b border-cyan-300/15 px-4 py-6 sm:px-6 lg:px-8">
        <div className="archive-status-card mx-auto flex max-w-7xl flex-col gap-2 rounded-lg border p-4 text-cyan-50">
          <p className="text-sm font-bold">Bugunun secili olayi: {todayEvent.title}</p>
          <p className="text-sm leading-6">
            Ana sayfadaki güncel kart takvim gününe göre gece 00:00 sonrasında bu arşivden yeni olaya geçer.
          </p>
        </div>
      </section>

      <section id="arsiv-listesi" className="px-4 py-10 sm:px-6 lg:px-8">
        <CyberArchiveExplorer events={events} />
      </section>
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
