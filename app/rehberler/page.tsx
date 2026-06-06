import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";

const guides = [
  {
    category: "Site guvenligi",
    readTime: "4 dk",
    summary: "Alan adi, SSL, marka taklidi ve odeme sayfasi sinyallerini kontrol etmek icin pratik rehber.",
    title: "Sahte site nasil anlasilir?"
  },
  {
    category: "Mesaj analizi",
    readTime: "3 dk",
    summary: "Aciliyet baskisi, kurum taklidi, link yonlendirmesi ve kod talebi gibi paternleri ayirt edin.",
    title: "Riskli SMS nasil tespit edilir?"
  },
  {
    category: "Alisveris guvenligi",
    readTime: "5 dk",
    summary: "Tekrarlayan ifade, ani puan artisleri ve asiri benzer yorum sinyallerini sade sekilde okuyun.",
    title: "Fake yorum nasil anlasilir?"
  },
  {
    category: "Siber farkindalik",
    readTime: "4 dk",
    summary: "2FA, oturum kontrolu, fake destek mesajlari ve hesap kurtarma riskleri icin temel kontrol listesi.",
    title: "Instagram hesabi nasil korunur?"
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
    </CyberPageShell>
  );
}

function GuidesReferenceHero() {
  return (
    <section className="guides-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Rehberler
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Guvenlik bilgisi herkes icin.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Teknik tehditleri sade, uygulanabilir ve anlasilir rehberlere donusturen siber farkindalik alani.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="/sorgu-paneli">
              Sorgu Panelini Ac
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/iletisim">
              Oneri Gonder
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
