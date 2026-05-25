import Link from "next/link";
import { posts, ContentRiskLevel } from "@/lib/content";

const riskStyles: Record<ContentRiskLevel, string> = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-700",
  caution: "border-amber-200 bg-amber-50 text-amber-700",
  risk: "border-red-200 bg-red-50 text-red-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700"
};

const riskLabels: Record<ContentRiskLevel, string> = {
  safe: "Güvenli",
  caution: "Dikkat",
  risk: "Risk",
  info: "Bilgi"
};

export function CyberNewsCenter() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Siber Gündem Merkezi</p>
            <h2 className="mt-2 text-3xl font-bold">Güncel dijital risk notları.</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
              Türkiye odaklı kısa, net ve aksiyon alınabilir güvenlik bültenleri.
            </p>
          </div>
          <Link className="w-fit rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/dijital-arac-merkezi">
            Araç merkezine git
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {posts.map((post) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" key={post.id}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${riskStyles[post.riskLevel]}`}>{riskLabels[post.riskLevel]}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{post.date}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{post.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{post.summary}</p>
              <button className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" type="button">
                Detayı İncele
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
