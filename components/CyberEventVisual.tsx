import { CyberVisualTone } from "@/lib/cyberArchive";

const toneStyles: Record<CyberVisualTone, string> = {
  infrastructure: "from-slate-950 via-blue-950 to-slate-900",
  ransomware: "from-slate-950 via-red-950 to-slate-900",
  privacy: "from-slate-950 via-indigo-950 to-slate-900",
  worm: "from-slate-950 via-emerald-950 to-slate-900",
  darkweb: "from-slate-950 via-zinc-900 to-slate-900",
  sabotage: "from-slate-950 via-amber-950 to-slate-900",
  breach: "from-slate-950 via-cyan-950 to-slate-900"
};

const accentStyles: Record<CyberVisualTone, string> = {
  infrastructure: "bg-blue-300/80",
  ransomware: "bg-red-300/80",
  privacy: "bg-indigo-300/80",
  worm: "bg-emerald-300/80",
  darkweb: "bg-zinc-200/80",
  sabotage: "bg-amber-300/80",
  breach: "bg-cyan-300/80"
};

export function CyberEventVisual({
  category,
  title,
  tone,
  year
}: {
  category: string;
  title: string;
  tone: CyberVisualTone;
  year: string;
}) {
  return (
    <div className={`relative min-h-[260px] overflow-hidden rounded-lg bg-gradient-to-br ${toneStyles[tone]} p-5 text-white shadow-lg shadow-slate-900/20`}>
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_70%)]" />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/12 blur-2xl" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute inset-x-6 top-24 grid grid-cols-6 gap-2 opacity-25">
        {Array.from({ length: 24 }).map((_, index) => (
          <span className="h-px bg-white" key={index} />
        ))}
      </div>
      <div className="relative flex h-full min-h-[220px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
            {category}
          </span>
          <span className={`h-3 w-3 rounded-full ${accentStyles[tone]} shadow-[0_0_28px_currentColor]`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/70">{year}</p>
          <p className="mt-2 max-w-md text-2xl font-bold leading-tight">{title}</p>
        </div>
      </div>
    </div>
  );
}
