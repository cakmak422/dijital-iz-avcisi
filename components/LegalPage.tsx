import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberHero } from "@/components/CyberHero";
import { CyberPageShell } from "@/components/CyberPageShell";
import { SiteFooter } from "@/components/SiteFooter";

export type LegalSection = {
  title: string;
  body: string;
};

export function LegalPage({
  description,
  sections,
  title
}: {
  description: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <CyberPageShell variant="about">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle={title} />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <CyberHero
        description={description}
        eyebrow="Bilgilendirme"
        primaryAction={{ href: "/", label: "Ana Sayfa" }}
        title={title}
        variant="about"
      />

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-4">
          {sections.map((section) => (
            <article className="cyber-card rounded-lg border p-5" key={section.title}>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}
