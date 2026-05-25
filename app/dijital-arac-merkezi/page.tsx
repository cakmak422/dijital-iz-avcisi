import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { primaryDigitalTools, roadmapDigitalTools, statusLabels, ToolStatus } from "@/lib/digitalTools";

const statusStyles: Record<ToolStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100",
  planned: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100",
  research: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100"
};

export default function DigitalToolsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Dijital Arac Merkezi" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:border-cyan-500/45 hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Dijital Arac Merkezi</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold sm:text-5xl">Tek panelden guvenlik kontrolleri.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Link, domain, QR, veri sizintisi ve mahremiyet kontrollerini planli bir servis merkezi altinda topluyoruz.
              Ilk hedef kalabalik bir link listesi degil, guvenilir ve sade arac deneyimi.
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-50">
            <p className="text-sm font-bold">Oncelik sirasi</p>
            <p className="mt-2 text-sm leading-6">
              Ilk 5 arac modern, paylasilabilir ve surekli kullanilabilir servisler olarak secildi. Hazir olmayanlar net sekilde planli durumda gosterilir.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 px-4 py-10 dark:border-white/10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Ilk 5 arac</p>
            <h2 className="mt-2 text-3xl font-bold">Cekirdek servisler.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Yol haritasi</p>
            <h2 className="mt-2 text-3xl font-bold">Sonraki guvenlik araclari.</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roadmapDigitalTools.map((tool) => (
              <ToolCard compact key={tool.title} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ToolCard({ compact = false, tool }: { compact?: boolean; tool: (typeof primaryDigitalTools)[number] }) {
  const content = (
    <>
      <div className="mb-4 h-16 rounded-lg border border-cyan-200/60 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-3 text-white dark:border-cyan-300/20">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-xs font-bold">
          {tool.title.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">{tool.category}</p>
          <h3 className="mt-2 text-lg font-bold">{tool.title}</h3>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusStyles[tool.status]}`}>
          {statusLabels[tool.status]}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tool.checks.slice(0, compact ? 3 : 5).map((check) => (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" key={check}>
            {check}
          </span>
        ))}
      </div>
      {tool.href ? (
        <span className="mt-5 inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition group-hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:group-hover:bg-cyan-100">
          Araci ac
        </span>
      ) : null}
    </>
  );

  const className =
    "group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10";

  if (tool.href) {
    return (
      <Link className={className} href={tool.href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
