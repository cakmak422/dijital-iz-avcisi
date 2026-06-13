import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberNewsCard } from "@/components/CyberNewsCard";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { getAllNewsForPublic } from "@/lib/newsReadService";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const { items: news } = await getAllNewsForPublic();

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
            <p className="text-sm text-slate-400">{news.length} kaynaklı içerik</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {news.map((item) => (
            <CyberNewsCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </CyberPageShell>
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
