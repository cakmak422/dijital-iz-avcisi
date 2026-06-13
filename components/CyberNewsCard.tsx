/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CyberNewsImage } from "@/components/CyberNewsImage";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import {
  getNewsImageFallbackSource,
  getNewsImageSource,
  getNewsSeverity,
  getNewsShortSummary,
  getNewsTitle,
  getNewsVisualType,
  type CyberNewsItem,
  type CyberNewsRiskLevel,
  type CyberNewsVisualType
} from "@/lib/newsStore";

const severityStyles: Record<CyberNewsRiskLevel, string> = {
  Düşük: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  Orta: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  Yüksek: "border-red-300/35 bg-red-300/10 text-red-100"
};

const visualStyles: Record<CyberNewsVisualType, { gradient: string; code: string; label: string }> = {
  "illegal-betting": {
    gradient: "from-amber-950 via-slate-950 to-cyan-950",
    code: "IB",
    label: "Yasa dışı bahis"
  },
  phishing: {
    gradient: "from-cyan-950 via-slate-950 to-emerald-950",
    code: "PH",
    label: "Oltalama"
  },
  sms: {
    gradient: "from-blue-950 via-slate-950 to-cyan-950",
    code: "SMS",
    label: "Sahte mesaj"
  },
  banking: {
    gradient: "from-slate-950 via-indigo-950 to-cyan-950",
    code: "BNK",
    label: "Finansal risk"
  },
  ransomware: {
    gradient: "from-red-950 via-slate-950 to-zinc-950",
    code: "RW",
    label: "Fidye yazılımı"
  },
  breach: {
    gradient: "from-cyan-950 via-slate-950 to-blue-950",
    code: "DB",
    label: "Veri sızıntısı"
  },
  infrastructure: {
    gradient: "from-slate-950 via-blue-950 to-emerald-950",
    code: "CI",
    label: "Kritik altyapı"
  },
  malware: {
    gradient: "from-emerald-950 via-slate-950 to-cyan-950",
    code: "MW",
    label: "Zararlı yazılım"
  },
  "threat-intel": {
    gradient: "from-slate-950 via-cyan-950 to-blue-950",
    code: "TI",
    label: "Tehdit istihbaratı"
  },
  privacy: {
    gradient: "from-indigo-950 via-slate-950 to-cyan-950",
    code: "PR",
    label: "Mahremiyet"
  },
  general: {
    gradient: "from-slate-950 via-cyan-950 to-emerald-950",
    code: "CY",
    label: "Siber gündem"
  }
};

export function CyberNewsCard({ item, compact = false }: { item: CyberNewsItem; compact?: boolean }) {
  const normalizedItem = normalizeNewsItem(item);
  const severity = getNewsSeverity(normalizedItem);
  const title = getNewsTitle(normalizedItem);
  const summary = getNewsShortSummary(normalizedItem);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-950/72 shadow-[0_20px_70px_rgba(2,6,23,0.35)] transition hover:-translate-y-1 hover:border-cyan-300/45 hover:shadow-cyan-950/30">
      <CyberNewsVisual item={normalizedItem} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${severityStyles[severity]}`}>{severity}</span>
          <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
            {normalizedItem.category}
          </span>
          <span className="ml-auto text-xs font-semibold text-slate-400">{normalizedItem.publishedAt}</span>
        </div>
        <h3 className="mt-4 text-lg font-extrabold leading-snug text-white">{title}</h3>
        <p className={`mt-2 text-sm leading-6 text-slate-300 ${compact ? "line-clamp-3" : ""}`}>{summary}</p>
        <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold text-slate-400">Kaynak: {normalizedItem.sourceName}</span>
          <Link className="btn-primary min-h-10 px-4 text-sm" href={`/haberler/${normalizedItem.slug}`}>
            Devamını Oku
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CyberNewsVisual({ item, className = "" }: { item: CyberNewsItem; className?: string }) {
  const normalizedItem = normalizeNewsItem(item);
  const title = normalizedItem.imageAltTr || getNewsTitle(normalizedItem);
  const visual = visualStyles[getNewsVisualType(normalizedItem)];
  const imageSource = getNewsImageSource(normalizedItem);
  const fallbackSource = getNewsImageFallbackSource();

  return (
    <div className={`relative aspect-[16/9] min-h-48 overflow-hidden border-b border-cyan-300/15 bg-gradient-to-br ${visual.gradient} ${className}`}>
      <CyberNewsImage
        alt={title}
        className="h-full w-full object-cover"
        fallbackSrc={fallbackSource}
        src={imageSource}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/12 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[length:38px_38px] opacity-25" />
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
        <p className="rounded-md border border-cyan-200/25 bg-slate-950/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
          {visual.label}
        </p>
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-200/30 bg-slate-950/70 text-xs font-black text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.18)] backdrop-blur">
          {visual.code}
        </span>
      </div>
    </div>
  );
}
