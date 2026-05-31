/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getAllNews } from "@/lib/newsDb";
import { type CyberNewsRiskLevel } from "@/lib/newsStore";

const riskStyles: Record<CyberNewsRiskLevel, string> = {
  Düşük: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Orta: "border-amber-200 bg-amber-50 text-amber-700",
  Yüksek: "border-red-200 bg-red-50 text-red-700"
};

export default async function NewsPage() {
  const news = await getAllNews();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Guncel Siber Haberler" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-8 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Guncel Siber Haberler</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Kaynakli siber guvenlik haberleri.</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
            Haberler kaynak basligi korunarak, metin birebir kopyalanmadan vatandas icin sade risk notuna donusturulur.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {news.map((item) => (
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-white/10 dark:bg-white/5" key={item.id}>
              {item.imageUrl ? (
                <img alt={item.title} className="h-40 w-full object-cover" loading="lazy" src={item.imageUrl} />
              ) : (
                <div className="h-40 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950" />
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${riskStyles[item.riskLevel]}`}>{item.riskLevel}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.publishedAt}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.sourceName}</span>
                  <Link className="btn-primary min-h-10 px-4" href={`/haberler/${item.slug}`}>
                    Detayi Oku
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
