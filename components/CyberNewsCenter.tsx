"use client";

import Link from "next/link";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { posts, ContentRiskLevel } from "@/lib/content";

const riskStyles: Record<ContentRiskLevel, string> = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-700",
  caution: "border-amber-200 bg-amber-50 text-amber-700",
  risk: "border-red-200 bg-red-50 text-red-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700"
};

const riskLabels: Record<ContentRiskLevel, string> = {
  safe: "Guvenli",
  caution: "Dikkat",
  risk: "Risk",
  info: "Bilgi"
};

export function CyberNewsCenter() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Siber Gundem Merkezi</p>
            <EditableContent as="h2" className="mt-2 text-3xl font-bold" contentKey="home.cyberNews.title" />
            <EditableContent as="p" className="mt-3 leading-7 text-slate-600 dark:text-slate-300" contentKey="home.cyberNews.description" />
          </div>
          <Link className="w-fit rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/dijital-arac-merkezi">
            Arac merkezine git
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {posts.map((post, index) => (
            <article className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" key={post.id}>
              <div className={`h-24 bg-gradient-to-br ${index === 0 ? "from-red-950 via-slate-950 to-cyan-950" : index === 1 ? "from-amber-950 via-slate-950 to-blue-950" : "from-cyan-950 via-slate-950 to-emerald-950"} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-sm font-bold">DI</span>
                  <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-bold">{post.category}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${riskStyles[post.riskLevel]}`}>{riskLabels[post.riskLevel]}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{post.date}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{post.summary}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3 dk okuma</span>
                  <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:group-hover:bg-cyan-100" type="button">
                    Detayi Incele
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
