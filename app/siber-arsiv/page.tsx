"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import { usePublishedManagedContent } from "@/lib/contentStore";
import { getCyberArchiveEvents, getTodayCyberEvent } from "@/lib/cyberArchive";

export default function CyberArchivePage() {
  const cmsEvents = usePublishedManagedContent("cyber-archive");
  const events = cmsEvents.length
    ? cmsEvents.map((event) => ({
        slug: event.id,
        title: event.title,
        category: event.category,
        visualTone: "breach" as const,
        year: event.publishedAt?.slice(0, 4) || "2026",
        dateLabel: event.publishedAt || event.updatedAt.slice(0, 10),
        summary: event.description,
        impact: event.body || "Bu olay dijital risk farkindaligi icin onemli bir ornek olarak degerlendirilir.",
        sourceUrl: event.ctaHref || "/siber-arsiv",
        sourceName: event.sourceLabel || "Dijital Iz Avcisi",
        dataMode: event.dataMode
      }))
    : getCyberArchiveEvents().map((event) => ({ ...event, dataMode: "demo" as const }));
  const todayEvent = getTodayCyberEvent();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
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
          <div className="max-w-3xl py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Siber Tarih & Dijital Tehdit Arsivi</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Siber Kirilma Noktalari</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Tarihte iz birakan siber olaylari; kaynak, etki ve guvenlik dersiyle birlikte sade bir arsivde topluyoruz.
            </p>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-100 px-4 py-6 dark:border-white/10 dark:bg-white/5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-100">
          <p className="text-sm font-bold">Bugunun secili olayi: {todayEvent.title}</p>
          <p className="text-sm leading-6">
            Ana sayfadaki guncel kart takvim gunune gore gece 00:00 sonrasinda bu arsivden yeni olaya gecer.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {events.map((event) => (
            <article className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5" id={event.slug} key={event.slug}>
              <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                    {event.dateLabel}
                  </span>
                  <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                    {event.category}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold">{event.title}</h2>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
                {event.dataMode === "demo" ? <span className="mt-3 inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">Demo veri</span> : null}
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                  <span className="font-bold">Etkisi: </span>
                  {event.impact}
                </div>
                <a className="mt-4 inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" href={event.sourceUrl} rel="noreferrer" target="_blank">
                  Kaynagi ac: {event.sourceName}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
