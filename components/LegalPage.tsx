import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberHero } from "@/components/CyberHero";
import { CyberPageShell } from "@/components/CyberPageShell";

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
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
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
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </CyberPageShell>
  );
}
