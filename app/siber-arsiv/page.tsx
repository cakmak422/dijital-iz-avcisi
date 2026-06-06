import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { getCyberArchiveEvents, getTodayCyberEvent } from "@/lib/cyberArchive";

export default function CyberArchivePage() {
  const events = getCyberArchiveEvents();
  const todayEvent = getTodayCyberEvent();

  return (
    <CyberPageShell className="archive-reference-page" variant="archive">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLogo subtitle="Siber olay arsivi" />
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
            Ana sayfadaki guncel kart takvim gunune gore gece 00:00 sonrasinda bu arsivden yeni olaya gecer.
          </p>
        </div>
      </section>

      <section id="arsiv-listesi" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {events.map((event) => (
            <article className="grid overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950/70 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-cyan-950/30" id={event.slug} key={event.slug}>
              <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                    {event.dateLabel}
                  </span>
                  <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                    {event.category}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{event.title}</h2>
                <p className="mt-3 leading-7 text-slate-300">{event.summary}</p>
                <div className="mt-4 rounded-md border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                  <span className="font-bold">Etkisi: </span>
                  {event.impact}
                </div>
                <a className="mt-4 inline-flex min-h-10 items-center rounded-md border border-cyan-300/25 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15" href={event.sourceUrl} rel="noreferrer" target="_blank">
                  Kaynagi ac: {event.sourceName}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </CyberPageShell>
  );
}

function ArchiveReferenceHero() {
  return (
    <section className="archive-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Siber Tarih & Dijital Tehdit Arsivi
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Siber Kirilma Noktalari
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Tarihte iz birakan siber olaylari; kaynak, etki ve guvenlik dersiyle birlikte sade bir arsivde topluyoruz.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="#arsiv-listesi">
              Arsivi Incele
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/sorgu-paneli">
              Sorgu Paneli
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
