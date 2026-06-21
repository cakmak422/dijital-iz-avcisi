"use client";

import { useMemo, useState } from "react";
import { CyberEventVisual } from "@/components/CyberEventVisual";
import type { CyberArchiveEvent } from "@/lib/cyberArchive";

const severityStyles: Record<CyberArchiveEvent["severity"], string> = {
  Orta: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "Y\u00fcksek": "border-orange-300/30 bg-orange-300/10 text-orange-100",
  Kritik: "border-red-300/30 bg-red-300/10 text-red-100"
};

export function CyberArchiveExplorer({ events }: { events: CyberArchiveEvent[] }) {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [threatType, setThreatType] = useState("all");
  const [severity, setSeverity] = useState("all");

  const years = useMemo(() => uniqueValues(events.map((event) => event.year)), [events]);
  const categories = useMemo(() => uniqueValues(events.map((event) => event.category)), [events]);
  const threatTypes = useMemo(() => uniqueValues(events.map((event) => event.threatType)), [events]);
  const severities = useMemo(() => uniqueValues(events.map((event) => event.severity)), [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.toLocaleLowerCase("tr-TR").trim();

    return events.filter((event) => {
      const haystack = `${event.title} ${event.summary} ${event.impact} ${event.category} ${event.threatType} ${event.tags.join(" ")}`.toLocaleLowerCase("tr-TR");
      return (
        (!normalizedSearch || haystack.includes(normalizedSearch)) &&
        (year === "all" || event.year === year) &&
        (category === "all" || event.category === category) &&
        (threatType === "all" || event.threatType === threatType) &&
        (severity === "all" || event.severity === severity)
      );
    });
  }, [category, events, search, severity, threatType, year]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 rounded-xl border border-cyan-300/20 bg-slate-950/72 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.32)]">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Arama
            <input
              className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Olay, kaynak, tehdit tipi ara"
              value={search}
            />
          </label>
          <ArchiveSelect label="Yıl" onChange={setYear} options={years} value={year} />
          <ArchiveSelect label="Kategori" onChange={setCategory} options={categories} value={category} />
          <ArchiveSelect label="Tehdit tipi" onChange={setThreatType} options={threatTypes} value={threatType} />
          <ArchiveSelect label="Önem" onChange={setSeverity} options={severities} value={severity} />
        </div>
        <p className="mt-3 text-sm text-slate-400">{filteredEvents.length} olay listeleniyor.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {filteredEvents.map((event) => (
          <article
            className="grid overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-950/72 shadow-[0_20px_70px_rgba(2,6,23,0.32)] transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:shadow-cyan-950/30"
            id={event.slug}
            key={event.slug}
          >
            {event.imageUrl ? (
              <img
                alt={event.title}
                className="h-48 w-full object-cover"
                loading="lazy"
                src={event.imageUrl}
              />
            ) : (
              <CyberEventVisual category={event.category} title={event.title} tone={event.visualTone} year={event.year} />
            )}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                  {event.dateLabel}
                </span>
                <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                  {event.threatType}
                </span>
                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${severityStyles[event.severity]}`}>
                  {event.severity}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight text-white">{event.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{event.summary}</p>
              <div className="mt-4 rounded-md border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                <span className="font-bold">Etkisi: </span>
                {event.impact}
              </div>
              <details className="mt-4 rounded-md border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm leading-6 text-slate-200">
                <summary className="cursor-pointer font-bold text-cyan-100">Detaylı açıklama, etki ve öneriler</summary>
                <div className="mt-4 grid gap-4">
                  <ArchiveInfoBlock title="Detaylı açıklama">{event.details}</ArchiveInfoBlock>
                  <ArchiveInfoBlock title="Etkisi">{event.impact}</ArchiveInfoBlock>
                  <ArchiveBulletList title="Kimleri etkileyebilir?" items={event.affectedGroups} />
                  <ArchiveBulletList title="Öneriler" items={event.recommendations} />
                </div>
              </details>
              <a
                className="mt-4 inline-flex min-h-10 items-center rounded-md border border-cyan-300/25 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
                href={event.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Kaynağı aç: {event.sourceName}
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ArchiveSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-200">
      {label}
      <select
        className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-200"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">Tümü</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ArchiveBulletList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="font-bold text-cyan-100">{title}</h3>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li className="rounded-md border border-cyan-300/15 bg-slate-950/40 p-3" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


function ArchiveInfoBlock({ children, title }: { children: string; title: string }) {
  return (
    <section className="rounded-md border border-cyan-300/15 bg-slate-950/45 p-4">
      <h3 className="font-bold text-cyan-100">{title}</h3>
      <p className="mt-2 text-slate-200">{children}</p>
    </section>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "tr"));
}
