"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { usePublishedManagedContent } from "@/lib/contentStore";

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
  const slug = title.toLowerCase().includes("kvkk") ? "kvkk" : title.toLowerCase().includes("gizlilik") ? "gizlilik" : "yasal-uyari";
  const cmsPage = usePublishedManagedContent("legal").find((item) => item.category === slug);
  const pageTitle = cmsPage?.title || title;
  const pageDescription = cmsPage?.description || description;
  const pageSections = cmsPage
    ? [
        {
          title: cmsPage.subtitle || "Bilgilendirme",
          body: cmsPage.body
        }
      ]
    : sections;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle={pageTitle} />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Bilgilendirme</p>
          <h1 className="mt-3 text-4xl font-bold">{pageTitle}</h1>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">{pageDescription}</p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-4">
          {pageSections.map((section) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
