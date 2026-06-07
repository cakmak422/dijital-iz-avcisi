"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { PageManagementDashboard } from "@/components/admin/page-management/PageManagementDashboard";

export default function OpsConsolePageManagementPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-cyan-300/10 bg-slate-950/95">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="Sayfa Yönetimi" />
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-cyan-300/15 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-300/15 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-300/10" href="/">
              Ana sayfa
            </Link>
            <AdminSessionMenu />
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1560px]">
            <PageManagementDashboard />
          </div>
        </section>
      </AdminGate>
    </main>
  );
}
