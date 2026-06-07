import { ReactNode } from "react";
import Link from "next/link";
import { CyberCard } from "@/components/CyberCard";
import { CyberPageVariant } from "@/components/CyberPageShell";

type CyberHeroAction = {
  href: string;
  label: string;
};

const heroVisuals: Record<CyberPageVariant, {
  code: string;
  label: string;
  metric: string;
  nodes: string[];
  title: string;
}> = {
  archive: {
    code: "ARC",
    label: "Zaman cizelgesi",
    metric: "Kaynaklı olay arşivi",
    nodes: ["1988", "2010", "2017", "2026"],
    title: "Dijital arşiv halkası"
  },
  auth: {
    code: "OTP",
    label: "Güvenli erişim",
    metric: "Kimlik doğrulama kapısı",
    nodes: ["KEY", "OTP", "ROLE", "LOCK"],
    title: "Token kontrol katmani"
  },
  contact: {
    code: "MSG",
    label: "Şifreli iletişim",
    metric: "Güvenli mesaj kanalı",
    nodes: ["MAIL", "TLS", "SAFE", "LOG"],
    title: "İletişim merkezi"
  },
  guides: {
    code: "EDU",
    label: "Farkındalık",
    metric: "Sade güvenlik bilgisi",
    nodes: ["READ", "LEARN", "CHECK", "ACT"],
    title: "Egitim modulu"
  },
  home: {
    code: "DI",
    label: "Dijital güvenlik merkezi",
    metric: "Risk radari aktif",
    nodes: ["URL", "SMS", "IP", "AI"],
    title: "Siber güvenlik ağı"
  },
  news: {
    code: "RSS",
    label: "Siber haber merkezi",
    metric: "Kaynaklı bülten akışı",
    nodes: ["CISA", "USOM", "BTK", "CVE"],
    title: "Yayin sinyali"
  },
  query: {
    code: "SCAN",
    label: "Analiz laboratuvari",
    metric: "Sorgu motoru hazır",
    nodes: ["URL", "DNS", "EXIF", "IP"],
    title: "Veri tarama halkasi"
  },
  tools: {
    code: "TOOL",
    label: "Araç merkezi",
    metric: "Modüler güvenlik paneli",
    nodes: ["QR", "WHOIS", "HASH", "META"],
    title: "Kontrol modulleri"
  },
  about: {
    code: "TRUST",
    label: "Kurumsal güven",
    metric: "Misyon ve farkındalık",
    nodes: ["SAFE", "RISK", "AI", "TR"],
    title: "Güven katmanı"
  }
};

export function CyberHero({
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  title,
  variant
}: {
  description: ReactNode;
  eyebrow: ReactNode;
  primaryAction?: CyberHeroAction;
  secondaryAction?: CyberHeroAction;
  title: ReactNode;
  variant: CyberPageVariant;
}) {
  const visual = heroVisuals[variant];

  return (
    <section className="cyber-hero border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="max-w-4xl">
          <div className="w-fit rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-normal text-white sm:text-4xl lg:text-6xl">{title}</h1>
          <div className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">{description}</div>
          {(primaryAction || secondaryAction) ? (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {primaryAction ? (
                <Link className="btn-primary min-h-12 w-full text-base sm:w-auto" href={primaryAction.href}>
                  {primaryAction.label}
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link className="btn-secondary min-h-12 w-full text-base sm:w-auto" href={secondaryAction.href}>
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <CyberHeroVisual visual={visual} />
      </div>
    </section>
  );
}

function CyberHeroVisual({
  visual
}: {
  visual: {
    code: string;
    label: string;
    metric: string;
    nodes: string[];
    title: string;
  };
}) {
  return (
    <CyberCard ariaLabel={visual.title} as="aside" className="cyber-hero-visual cyber-glow relative min-h-[320px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_24%,rgba(34,211,238,0.26),transparent_28%),radial-gradient(circle_at_78%_68%,rgba(16,185,129,0.18),transparent_34%)]" />
      <div className="absolute inset-0 cyber-bg-network opacity-60" />
      <div className="relative flex h-full min-h-[280px] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-100">{visual.label}</span>
          <span className="text-xs font-semibold text-slate-300">{visual.metric}</span>
        </div>

        <div className="my-8 grid place-items-center">
          <div className="relative h-44 w-44 rounded-full border border-cyan-300/45 bg-slate-950/74 shadow-2xl shadow-cyan-950/40">
            <div className="absolute inset-3 rounded-full border border-cyan-300/30" />
            <div className="absolute inset-8 rounded-full border border-emerald-300/35 bg-cyan-300/10" />
            <div className="absolute inset-16 rounded-full border border-cyan-200/30" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-lg shadow-cyan-300/60" />
            <div className="absolute left-1/2 top-1/2 h-0.5 w-20 origin-left -translate-y-1/2 rotate-45 bg-cyan-200/80" />
            <div className="absolute left-1/2 top-1/2 h-0.5 w-16 origin-left -translate-y-1/2 -rotate-[28deg] bg-emerald-200/70" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-8 text-xs font-bold tracking-[0.18em] text-cyan-100">{visual.code}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {visual.nodes.map((node) => (
            <span className="rounded-md border border-cyan-300/18 bg-white/5 px-3 py-2 text-center text-xs font-bold tracking-[0.08em] text-cyan-50" key={node}>
              {node}
            </span>
          ))}
        </div>
      </div>
    </CyberCard>
  );
}
