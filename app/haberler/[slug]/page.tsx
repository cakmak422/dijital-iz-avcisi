import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberNewsVisual } from "@/components/CyberNewsCard";
import { CyberPageShell } from "@/components/CyberPageShell";
import { getNewsBySlugForPublic } from "@/lib/newsReadService";
import {
  getCyberNewsItems,
  getNewsAffectedGroups,
  getNewsLongSummary,
  getNewsRecommendations,
  getNewsSeverity,
  getNewsShortSummary,
  getNewsTechnicalSignals,
  getNewsTitle,
  getNewsWhyItMatters,
  type CyberNewsRiskLevel
} from "@/lib/newsStore";

const riskStyles: Record<CyberNewsRiskLevel, string> = {
  Düşük: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  Orta: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  Yüksek: "border-red-300/35 bg-red-300/10 text-red-100"
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getCyberNewsItems().map((item) => ({ slug: item.slug }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item } = await getNewsBySlugForPublic(slug);
  if (!item) notFound();

  const title = getNewsTitle(item);
  const severity = getNewsSeverity(item);

  return (
    <CyberPageShell variant="news">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Haber Detayı" />
          <Link className="btn-secondary px-4 py-2" href="/haberler">
            Haberler
          </Link>
        </nav>
      </header>

      <section className="news-detail-hero border-b border-cyan-300/15 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${riskStyles[severity]}`}>{severity}</span>
              <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                {item.category}
              </span>
              <span className="text-xs font-semibold text-slate-400">{item.publishedAt}</span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">{getNewsShortSummary(item)}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a className="btn-primary min-h-11 px-5" href={item.sourceUrl} rel="noreferrer" target="_blank">
                Orijinal kaynağı aç
              </a>
              <Link className="btn-secondary min-h-11 px-5" href="/haberler">
                Tüm Haberler
              </Link>
            </div>
          </div>
          <CyberNewsVisual className="min-h-[320px] rounded-xl border border-cyan-300/20" item={item} />
        </div>
      </section>

      <article className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4">
            <NewsDetailSection title="Olayın Özeti">
              <p>{getNewsLongSummary(item)}</p>
            </NewsDetailSection>

            <NewsDetailSection title="Neden Önemli?">
              <p>{getNewsWhyItMatters(item)}</p>
            </NewsDetailSection>

            <NewsDetailSection title="Kimleri Etkileyebilir?">
              <BulletList items={getNewsAffectedGroups(item)} />
            </NewsDetailSection>

            <NewsDetailSection title="Teknik Sinyaller">
              <BulletList items={getNewsTechnicalSignals(item)} />
            </NewsDetailSection>

            <NewsDetailSection title="Kullanıcı/Kurum İçin Öneriler">
              <BulletList items={getNewsRecommendations(item)} />
            </NewsDetailSection>
          </div>

          <aside className="h-fit rounded-xl border border-cyan-300/20 bg-slate-950/72 p-5 shadow-[0_20px_70px_rgba(2,6,23,0.35)]">
            <h2 className="text-xl font-extrabold text-white">Kaynaklar</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              <p>
                <span className="font-bold text-cyan-100">Kaynak adı: </span>
                {item.sourceName}
              </p>
              <p>
                <span className="font-bold text-cyan-100">Orijinal başlık: </span>
                {item.originalTitle || item.title}
              </p>
              <p>
                <span className="font-bold text-cyan-100">Yayın tarihi: </span>
                {item.publishedAt}
              </p>
              <p>
                <span className="font-bold text-cyan-100">Çekilme zamanı: </span>
                {item.fetchedAt}
              </p>
            </div>
            <a className="btn-primary mt-5 min-h-11 w-full px-5" href={item.originalUrl || item.sourceUrl} rel="noreferrer" target="_blank">
              Orijinal haberi oku
            </a>
            <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
              Bu sayfa kaynak metni birebir kopyalamaz; başlığı ve bağlantıyı koruyarak kısa, bilgilendirici bir özet sunar.
            </p>
          </aside>
        </div>
      </article>
    </CyberPageShell>
  );
}

function NewsDetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-xl border border-cyan-300/20 bg-slate-950/72 p-5 text-slate-300 shadow-[0_20px_70px_rgba(2,6,23,0.32)]">
      <h2 className="text-xl font-extrabold text-white">{title}</h2>
      <div className="mt-3 leading-7">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li className="rounded-lg border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm leading-6" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}
