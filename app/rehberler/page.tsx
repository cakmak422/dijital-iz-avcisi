import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { ManagedPageHero } from "@/components/ManagedPageHero";
import { SiteFooter } from "@/components/SiteFooter";

const guides = [
  {
    category: "Site güvenliği",
    readTime: "4 dk",
    summary: "Alan adı, SSL, marka taklidi ve ödeme sayfası sinyallerini kontrol etmek için pratik rehber.",
    title: "Sahte site nasıl anlaşılır?"
  },
  {
    category: "Mesaj analizi",
    readTime: "3 dk",
    summary: "Aciliyet baskısı, kurum taklidi, link yönlendirmesi ve kod talebi gibi paternleri ayırt edin.",
    title: "Riskli SMS nasıl tespit edilir?"
  },
  {
    category: "Alışveriş güvenliği",
    readTime: "5 dk",
    summary: "Tekrarlayan ifade, ani puan artışları ve aşırı benzer yorum sinyallerini sade şekilde okuyun.",
    title: "Sahte yorum nasıl anlaşılır?"
  },
  {
    category: "Siber farkındalık",
    readTime: "4 dk",
    summary: "2FA, oturum kontrolü, fake destek mesajları ve hesap kurtarma riskleri için temel kontrol listesi.",
    title: "Instagram hesabı nasıl korunur?"
  }
];

export default function GuidesPage() {
  return (
    <CyberPageShell className="guides-reference-page" variant="guides">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Rehberler" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <GuidesReferenceHero />

      <section className="cyber-section px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {guides.map((guide, index) => (
            <article className="cyber-card rounded-lg border p-5 transition hover:-translate-y-0.5" key={guide.title}>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-lg font-bold text-cyan-100">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">{guide.category}</p>
                <span className="rounded-md border border-cyan-300/20 bg-white/5 px-2 py-1 text-xs font-bold text-slate-200">{guide.readTime}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">{guide.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{guide.summary}</p>
              <button className="btn-secondary mt-5 min-h-10 px-4" type="button">
                Rehberi Oku
              </button>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}

function GuidesReferenceHero() {
  return (
    <ManagedPageHero
      actions={[
        { href: "/sorgu-paneli", label: "Sorgu Panelini Aç" },
        { href: "/iletisim", label: "Öneri Gönder", variant: "secondary" }
      ]}
      className="guides-reference-hero"
      fallback={{
        title: "Güvenlik bilgisi herkes için.",
        description: "Teknik tehditleri sade, uygulanabilir ve anlaşılır rehberlere dönüştüren siber farkındalık alanı.",
        image: "/awareness/rehberler.png"
      }}
      slug="rehberler"
    />
  );
}
