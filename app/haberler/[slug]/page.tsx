/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { getAllNews, getNewsBySlug } from "@/lib/newsDb";
import { type CyberNewsRiskLevel } from "@/lib/newsStore";

const riskStyles: Record<CyberNewsRiskLevel, string> = {
  Düşük: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Orta: "border-amber-200 bg-amber-50 text-amber-700",
  Yüksek: "border-red-200 bg-red-50 text-red-700"
};

export async function generateStaticParams() {
  const news = await getAllNews();
  return news.map((item) => ({ slug: item.slug }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Haber Detayi" />
          <Link className="btn-secondary px-4 py-2" href="/haberler">
            Haberler
          </Link>
        </nav>
      </header>

      <article className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-bold ${riskStyles[item.riskLevel]}`}>{item.riskLevel}</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.category}</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.publishedAt}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{item.title}</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Kaynak: <a className="font-semibold text-cyan-700 underline dark:text-cyan-200" href={item.sourceUrl} rel="noreferrer" target="_blank">{item.sourceName}</a>
          </p>

          {item.imageUrl ? (
            <img alt={item.title} className="mt-6 max-h-[420px] w-full rounded-lg border border-slate-200 object-cover shadow-sm dark:border-white/10" loading="lazy" src={item.imageUrl} />
          ) : null}

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-bold">Kisa ozet</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{item.summary}</p>
          </section>

          <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            <h2 className="text-xl font-bold">Bu haber neden onemli?</h2>
            <p className="mt-3 leading-7">{item.riskNote}</p>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-bold">Vatandas ne yapmali?</h2>
            <ul className="mt-3 grid gap-2">
              {item.publicAdvice.map((advice) => (
                <li className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" key={advice}>
                  {advice}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a className="btn-primary min-h-11 px-5" href={item.sourceUrl} rel="noreferrer" target="_blank">
              Orijinal haberi oku
            </a>
            <Link className="btn-secondary min-h-11 px-5" href="/haberler">
              Tum haberler
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
