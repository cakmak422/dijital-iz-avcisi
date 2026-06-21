import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";

export const metadata: Metadata = {
  title: "Dijital Araç Merkezi",
  description: "Link, domain, QR, veri sızıntısı ve mahremiyet kontrollerini tek panelde toplayan dijital güvenlik araç merkezi.",
  alternates: { canonical: "/dijital-arac-merkezi" },
  openGraph: { title: "Dijital Araç Merkezi | Dijital İz Avcısı", description: "Tek panelden güvenlik kontrolleri.", url: "/dijital-arac-merkezi" }
};
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { primaryDigitalTools, roadmapDigitalTools, statusLabels, ToolStatus } from "@/lib/digitalTools";

const statusStyles: Record<ToolStatus, string> = {
  active: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  planned: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  research: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
};

export default function DigitalToolsPage() {
  return (
    <CyberPageShell className="tools-reference-page" variant="tools">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Dijital Araç Merkezi" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:border-cyan-500/45 hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <ToolsReferenceHero />

      <section className="border-b border-slate-200 px-4 py-10 dark:border-white/10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">İlk 5 araç</p>
            <h2 className="mt-2 text-3xl font-bold">Çekirdek servisler.</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {primaryDigitalTools.map((tool) => (
              <ToolCard key={tool.title} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Yol haritası</p>
          <h2 className="mt-2 text-3xl font-bold">Sonraki güvenlik araçları.</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roadmapDigitalTools.map((tool) => (
              <ToolCard compact key={tool.title} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}

function ToolsReferenceHero() {
  return (
    <ManagedPageHero
      actions={[{ href: "/sorgu-paneli", label: "Sorgu Panelini Aç" }]}
      className="tools-reference-hero"
      fallback={{
        title: "Tek panelden güvenlik kontrolleri.",
        description:
          "Link, domain, QR, veri sızıntısı ve mahremiyet kontrollerini planlı bir servis merkezi altında topluyoruz. İlk hedef kalabalık bir link listesi değil, güvenilir ve sade araç deneyimi.",
        image: "/awareness/Dijital Arac Merkezi.png"
      }}
      slug="dijital-arac-merkezi"
    />
  );
}

function ToolCard({ compact = false, tool }: { compact?: boolean; tool: (typeof primaryDigitalTools)[number] }) {
  const content = (
    <>
      <div className="mb-4 h-16 rounded-lg border border-cyan-300/25 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-3 text-white shadow-[0_0_28px_rgba(34,211,238,0.10)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-xs font-bold">
          {tool.title.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">{tool.category}</p>
          <h3 className="mt-2 text-lg font-bold text-white">{tool.title}</h3>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusStyles[tool.status]}`}>
          {statusLabels[tool.status]}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tool.checks.slice(0, compact ? 3 : 5).map((check) => (
          <span className="rounded-md border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-50/90" key={check}>
            {check}
          </span>
        ))}
      </div>
      {tool.href ? (
        <span className="mt-5 inline-flex min-h-10 items-center rounded-md border border-cyan-300/25 bg-cyan-300/15 px-4 text-sm font-semibold text-cyan-50 transition group-hover:border-cyan-200 group-hover:bg-cyan-300/20">
          Aracı aç
        </span>
      ) : null}
    </>
  );

  const className =
    "tools-card group rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:shadow-cyan-950/30";

  if (tool.href) {
    return (
      <Link className={className} href={tool.href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
