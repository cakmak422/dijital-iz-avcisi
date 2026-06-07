/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { getCyberNewsItems, type CyberNewsRiskLevel } from "@/lib/newsStore";

const riskStyles: Record<CyberNewsRiskLevel, string> = {
  "Düşük": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Orta: "border-amber-200 bg-amber-50 text-amber-700",
  "Yüksek": "border-red-200 bg-red-50 text-red-700"
};

export default function NewsPage() {
  const news = getCyberNewsItems();

  return (
    <CyberPageShell className="news-reference-page" variant="news">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Güncel Siber Haberler" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <NewsReferenceHero />

      <section className="px-4 py-8 sm:px-6 lg:px-8" id="haber-akisi">
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
                    Detayı Oku
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </CyberPageShell>
  );
}

function NewsReferenceHero() {
  return (
    <section className="news-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-100">
            Güncel Siber Haberler
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Kaynaklı siber güvenlik haberleri.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
          Haberler kaynak başlığı korunarak, metin birebir kopyalanmadan vatandaş için sade risk notuna dönüştürülür.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="#haber-akisi">
              Haberleri İncele
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
