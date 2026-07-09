import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberNewsCard } from "@/components/CyberNewsCard";

export const metadata: Metadata = {
  title: "Güncel Siber Haberler",
  description: "Kaynaklı siber güvenlik ve dijital dolandırıcılık haberleri — vatandaş için sade risk notiyle.",
  alternates: { canonical: "/haberler" },
  openGraph: { title: "Güncel Siber Haberler | Dijital İz Avcısı", description: "Kaynaklı siber güvenlik haberleri.", url: "/haberler" }
};
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { getPagedNewsForPublic } from "@/lib/newsReadService";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function NewsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = parsePageParam(resolvedSearchParams.page);

  let { items: news, totalCount } = await getPagedNewsForPublic(requestedPage, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Gecersiz/asiri page degeri icin 404 atmak yerine en yakin gecerli
  // sayfaya sessizce dus — URL degismez, sadece icerik duzeltilir.
  let currentPage = requestedPage;
  if (requestedPage > totalPages) {
    currentPage = totalPages;
    const clamped = await getPagedNewsForPublic(currentPage, PAGE_SIZE);
    news = clamped.items;
    totalCount = clamped.totalCount;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

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
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Kaynaklı akış</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">Son güvenlik başlıkları</h2>
            </div>
            <p className="text-sm text-slate-400">{totalCount} kaynaklı içerik</p>
          </div>
        </div>

        {news.length > 0 ? (
          <>
            <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
              {news.map((item) => (
                <CyberNewsCard item={item} key={item.id} />
              ))}
            </div>
            <NewsPagination currentPage={currentPage} hasNext={hasNext} hasPrev={hasPrev} totalPages={totalPages} />
          </>
        ) : (
          <div className="mx-auto max-w-7xl rounded-xl border border-cyan-300/20 bg-slate-950/60 p-8 text-center">
            <p className="text-sm text-slate-300">Bu sayfada haber yok.</p>
            <Link className="btn-secondary mt-4 inline-flex px-4 py-2" href="/haberler">
              İlk sayfaya dön
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}

function NewsPagination({
  currentPage,
  hasNext,
  hasPrev,
  totalPages
}: {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalPages: number;
}) {
  return (
    <div className="mx-auto mt-8 flex max-w-7xl items-center justify-center gap-4">
      {hasPrev ? (
        <Link className="btn-secondary px-4 py-2" href={`/haberler?page=${currentPage - 1}`}>
          {"‹ Önceki Sayfa"}
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed px-4 py-2 opacity-40">{"‹ Önceki Sayfa"}</span>
      )}
      <p className="text-sm font-semibold text-slate-400">
        Sayfa {currentPage} · {totalPages}
      </p>
      {hasNext ? (
        <Link className="btn-secondary px-4 py-2" href={`/haberler?page=${currentPage + 1}`}>
          {"Sonraki Sayfa ›"}
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed px-4 py-2 opacity-40">{"Sonraki Sayfa ›"}</span>
      )}
    </div>
  );
}

function NewsReferenceHero() {
  return (
    <ManagedPageHero
      actions={[
        { href: "#haber-akisi", label: "Haberleri İncele" },
        { href: "/", label: "Ana Sayfa", variant: "secondary" }
      ]}
      className="news-reference-hero"
      fallback={{
        title: "Kaynaklı siber güvenlik haberleri.",
        description: "Haberler kaynak başlığı korunarak, metin birebir kopyalanmadan vatandaş için sade risk notuna dönüştürülür.",
        image: "/awareness/haberler.png"
      }}
      slug="haberler"
    />
  );
}
