import { CyberVisualTone } from "@/lib/cyberArchive";

const toneStyles: Record<CyberVisualTone, { gradient: string; accent: string; dot: string }> = {
  infrastructure: {
    gradient: "from-slate-950 via-blue-950 to-slate-900",
    accent: "rgba(96, 165, 250, 0.75)",
    dot: "bg-blue-300"
  },
  ransomware: {
    gradient: "from-slate-950 via-red-950 to-slate-900",
    accent: "rgba(252, 165, 165, 0.75)",
    dot: "bg-red-300"
  },
  privacy: {
    gradient: "from-slate-950 via-indigo-950 to-slate-900",
    accent: "rgba(165, 180, 252, 0.75)",
    dot: "bg-indigo-300"
  },
  worm: {
    gradient: "from-slate-950 via-emerald-950 to-slate-900",
    accent: "rgba(110, 231, 183, 0.75)",
    dot: "bg-emerald-300"
  },
  darkweb: {
    gradient: "from-slate-950 via-zinc-900 to-slate-900",
    accent: "rgba(212, 212, 216, 0.60)",
    dot: "bg-zinc-300"
  },
  sabotage: {
    gradient: "from-slate-950 via-amber-950 to-slate-900",
    accent: "rgba(252, 211, 77, 0.70)",
    dot: "bg-amber-300"
  },
  breach: {
    gradient: "from-slate-950 via-cyan-950 to-slate-900",
    accent: "rgba(103, 232, 249, 0.75)",
    dot: "bg-cyan-300"
  }
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
  const style = toneStyles[tone];

  return (
    <div
      className={`relative min-h-[280px] overflow-hidden rounded-xl bg-gradient-to-br ${style.gradient} p-5 text-white`}
      style={{
        boxShadow: `0 24px 80px rgba(2,6,23,0.50), 0 0 0 1px ${style.accent.replace("0.75", "0.18")}, inset 0 1px 0 rgba(255,255,255,0.07)`
      }}
    >
      {/* Arka plan grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:36px_36px] opacity-40" />

      {/* Köşe radyal glow */}
      <div
        className="absolute -right-12 -top-12 h-52 w-52 rounded-full blur-3xl"
        style={{ background: style.accent.replace("0.75", "0.18") }}
      />

      {/* Sağ alt diagonal çizgiler */}
      <div className="absolute bottom-0 right-0 h-40 w-40 overflow-hidden opacity-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            className="absolute h-px w-full origin-right -rotate-45 bg-white"
            key={i}
            style={{ top: `${i * 14}px`, right: `${i * 4}px` }}
          />
        ))}
      </div>

      {/* Alt glow çizgisi */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${style.accent}, transparent)` }}
      />

      {/* Alt overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

      {/* İçerik */}
      <div className="relative flex h-full min-h-[240px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
            {category}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${style.dot} flex-shrink-0 mt-1`}
            style={{ boxShadow: `0 0 16px 4px ${style.accent}` }}
          />
        </div>

        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: style.accent }}
          >
            {year}
          </p>
          <p className="mt-2 max-w-md text-2xl font-extrabold leading-tight">{title}</p>
        </div>
      </div>
    </div>
  );
}
