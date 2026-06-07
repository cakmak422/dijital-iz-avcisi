"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useManagedPageHero } from "@/lib/pageManagementStore";

type ManagedPageHeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type ManagedPageHeroProps = {
  actions?: ManagedPageHeroAction[];
  className: string;
  fallback: {
    description: string;
    image?: string;
    title: string;
  };
  slug: string;
};

export function ManagedPageHero({ actions = [], className, fallback, slug }: ManagedPageHeroProps) {
  const hero = useManagedPageHero(slug, fallback);
  const heroImage = sanitizeCssImageUrl(hero.image);
  const style = heroImage ? ({ "--managed-hero-image": `url("${heroImage}")` } as CSSProperties) : undefined;

  return (
    <section className={`${className} managed-page-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8`} style={style}>
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            {hero.pageTitle}
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            {hero.description}
          </p>
          {actions.length ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => (
                <Link
                  className={`${action.variant === "secondary" ? "btn-secondary" : "btn-primary"} min-h-11 px-5`}
                  href={action.href}
                  key={`${action.href}-${action.label}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function sanitizeCssImageUrl(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(javascript|data:text\/html)/i.test(trimmed)) return "";
  return trimmed.replaceAll("\"", "%22");
}
