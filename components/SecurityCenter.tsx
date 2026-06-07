"use client";

import Link from "next/link";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { getFeaturedSecurityNotice, securityNotices, SecurityNoticeRisk } from "@/lib/securityCenter";

const riskStyles: Record<SecurityNoticeRisk, string> = {
  high: "border-red-200 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100",
  medium: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100",
  low: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100",
  info: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100"
};

const visualStyles: Record<SecurityNoticeRisk, string> = {
  high: "from-red-950 via-slate-950 to-cyan-950",
  medium: "from-amber-950 via-slate-950 to-cyan-950",
  low: "from-emerald-950 via-slate-950 to-cyan-950",
  info: "from-cyan-950 via-slate-950 to-blue-950"
};

export function SecurityCenter() {
  const featured = getFeaturedSecurityNotice();

  return (
    <section className="border-b border-cyan-900/10 bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <article className="grid overflow-hidden rounded-lg border border-cyan-300/15 bg-white/[0.03] shadow-xl shadow-cyan-950/30 lg:grid-cols-[0.82fr_1fr]">
          <div className={`relative min-h-[240px] bg-gradient-to-br ${visualStyles[featured.risk]} p-5`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(103,232,249,0.28),transparent_34%),linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">Afiş Alani</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight">{featured.imageLabel}</h2>
            </div>
          </div>
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Dijital Güvenlik Merkezi</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</h1>
              <p className="mt-4 leading-7 text-slate-300">{featured.content}</p>
              <EditableContent as="p" className="mt-3 text-sm leading-6 text-cyan-50/85" contentKey="home.securityCenter.description" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="flex min-h-11 items-center justify-center rounded-md bg-cyan-300 px-5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200" href="/sorgu-paneli?module=message">
                Mesaj Analizi Yap
              </Link>
              <Link className="flex min-h-11 items-center justify-center rounded-md border border-cyan-200/25 bg-white/5 px-5 font-semibold text-cyan-50 transition hover:-translate-y-0.5 hover:bg-white/10" href="/sorgu-paneli?module=phishing">
                Link Kontrol Et
              </Link>
            </div>
          </div>
        </article>

        <div className="grid gap-3">
          {securityNotices.map((notice) => (
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.07]" key={notice.title}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${riskStyles[notice.risk]}`}>{notice.badge}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">{notice.category}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold">{notice.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{notice.content}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
