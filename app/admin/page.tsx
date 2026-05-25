"use client";

import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { BrandLogo } from "@/components/BrandLogo";
import { ParserHealth } from "@/components/ParserHealth";
import { aiUsageLogs, alerts, posts } from "@/lib/content";
import { mockUsers, UserStatus } from "@/lib/users";

const stats = [
  { label: "Toplam analiz", value: "12.480" },
  { label: "Risk sinyali", value: "1.936" },
  { label: "Geri bildirim", value: "84" },
  { label: "Aktif içerik", value: "18" }
];

const recentAnalyses = [
  { target: "trendyol.com/urun", type: "Ürün", result: "Dikkat" },
  { target: "bit.ly/ornek", type: "Phishing", result: "Risk" },
  { target: "Kargo SMS metni", type: "SMS", result: "Risk" }
];

const statusStyles: Record<UserStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700"
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Admin Panel" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Yönetim vitrini</p>
            <h1 className="mt-2 text-4xl font-bold">Platform operasyon paneli.</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" key={stat.label}>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[1fr_420px]">
            <div className="grid gap-5">
              <AdminCard title="Son analizler" items={recentAnalyses.map((item) => `${item.type}: ${item.target} - ${item.result}`)} />
              <article className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-400/30 dark:bg-cyan-400/10">
                <h2 className="text-xl font-bold">Icerik duzenleme sistemi</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-cyan-50">
                  Hero, hakkimizda, duyuru, siber gundem ve footer metinlerini panel uzerinden yonetin.
                </p>
                <Link className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" href="/admin/content">
                  Icerik panelini ac
                </Link>
              </article>
              <UsersTable />
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xl font-bold">Parser sağlık durumu</h2>
                <div className="mt-4">
                  <ParserHealth compact />
                </div>
              </div>
              <AdminCard title="AI kullanım logları" items={aiUsageLogs.map((item) => `${item.area} - ${item.model} - ${item.status}`)} />
            </div>
            <div className="grid gap-5">
              <AdminCard title="Siber gündem içerikleri" items={posts.map((post) => `${post.title} - ${post.status}`)} />
              <AdminCard title="Kullanıcı geri bildirimleri" items={["Şüpheli link bildirimi", "Hatalı analiz notu", "Yeni araç önerisi"]} />
              <AdminCard title="Riskli link bildirimleri" items={alerts.map((alert) => `${alert.title} - ${alert.riskLevel}`)} />
            </div>
          </div>
        </section>
      </AdminGate>
    </main>
  );
}

function UsersTable() {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="border-b border-slate-200 p-5 dark:border-white/10">
        <h2 className="text-xl font-bold">Üye listesi</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Telefon doğrulaması kullanılmaz; e-posta doğrulama durumu takip edilir.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Kullanıcı adı</th>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">E-posta doğrulandı mı</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Kayıt tarihi</th>
              <th className="px-4 py-3">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {mockUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-semibold">{user.username}</td>
                <td className="px-4 py-3">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.phone}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${user.isEmailVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {user.isEmailVerified ? "Evet" : "Hayır"}
                  </span>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusStyles[user.status]}`}>{user.status}</span>
                </td>
                <td className="px-4 py-3">{user.createdAt}</td>
                <td className="px-4 py-3">
                  <button className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-white/10" type="button">
                    İncele
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function AdminCard({ items, title }: { items: string[]; title: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" key={item}>
            {item}
          </p>
        ))}
      </div>
    </article>
  );
}
