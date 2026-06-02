"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { BrandLogo } from "@/components/BrandLogo";
import { ParserHealth } from "@/components/ParserHealth";
import type { ContactMessage } from "@/lib/contactStore";
import { archiveMessage, getLatestContactMessages, markAsRead, subscribeToContactMessages } from "@/lib/contactStore";
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

export function OpsConsolePage() {
  const [newsUpdateStatus, setNewsUpdateStatus] = useState("Hazir");
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    function syncMessages() {
      setContactMessages(getLatestContactMessages(5));
    }

    syncMessages();
    return subscribeToContactMessages(syncMessages);
  }, []);

  async function handleNewsUpdate() {
    setNewsUpdateStatus("Haber kaynaklari kontrol ediliyor...");
    try {
      // CRON_SECRET client tarafina konmaz. Bu istek admin session cookie ile yetkilendirilir.
      // TODO: Gercek production auth geldiginde bu butonu server action veya signed admin API uzerinden calistir.
      const response = await fetch("/api/news/fetch", { method: "POST" });
      if (!response.ok) throw new Error("Haber guncelleme istegi basarisiz oldu.");
      const result = (await response.json()) as { found: number; inserted: number; skipped: number; failed: number; errors?: string[] };
      const errorSummary = result.errors?.length ? ` Ilk hata: ${result.errors[0]}` : "";
      setNewsUpdateStatus(`${result.found} haber bulundu, ${result.inserted} veritabanina eklendi, ${result.skipped} tekrar/atlanmis, ${result.failed} basarisiz.${errorSummary}`);
    } catch {
      setNewsUpdateStatus("Haberler guncellenemedi. Kaynak veya ag erisimi kontrol edilmeli.");
    }
  }

  function syncContactMessages() {
    setContactMessages(getLatestContactMessages(5));
  }

  function handleMarkContactAsRead(id: string) {
    markAsRead(id);
    syncContactMessages();
  }

  function handleArchiveContactMessage(id: string) {
    archiveMessage(id);
    syncContactMessages();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Ops Console" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Yönetim vitrini</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Platform operasyon paneli.</h1>
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
              <SecurityStatusCard />
              <article className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-400/30 dark:bg-cyan-400/10">
                <h2 className="text-xl font-bold">Icerik duzenleme sistemi</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-cyan-50">
                  Hero, hakkimizda, duyuru, siber gundem ve footer metinlerini panel uzerinden yonetin.
                </p>
                <Link className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" href="/ops-console/content">
                  Icerik panelini ac
                </Link>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h2 className="text-xl font-bold">Site Ayarlari</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  Logo, tema, renk, genel site ayarlari ve CMS temel yonetimi.
                </p>
                <Link className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" href="/ops-console/site-settings">
                  Site ayarlarini ac
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
              <ContactMessagesCard messages={contactMessages} onArchive={handleArchiveContactMessage} onMarkAsRead={handleMarkContactAsRead} />
              <AdminCard title="Kullanıcı geri bildirimleri" items={["Şüpheli link bildirimi", "Hatalı analiz notu", "Yeni araç önerisi"]} />
              <NewsUpdateCard onUpdate={handleNewsUpdate} status={newsUpdateStatus} />
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

function ContactMessagesCard({
  messages,
  onArchive,
  onMarkAsRead
}: {
  messages: ContactMessage[];
  onArchive: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}) {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("tr-TR");
  }
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-bold">İletişim Mesajları</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Local MVP: son 5 form mesajı.</p>
      <div className="mt-4 grid gap-2">
        {messages.length ? (
          messages.map((message) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5" key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">{message.topic}</p>
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                  {message.status}
                </span>
              </div>
              <p className="mt-1 break-words text-slate-700 dark:text-slate-200">{message.name}</p>
              <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{message.email}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{message.message}</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {formatDate(message.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-cyan-300"
                  onClick={() => setOpenMessageId(openMessageId === message.id ? null : message.id)}
                  type="button"
                >
                  Detay
                </button>
                <button
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100"
                  disabled={message.status === "read"}
                  onClick={() => onMarkAsRead(message.id)}
                  type="button"
                >
                  Okundu işaretle
                </button>
                <button
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-amber-300"
                  onClick={() => {
                    onArchive(message.id);
                    if (openMessageId === message.id) setOpenMessageId(null);
                  }}
                  type="button"
                >
                  Arşivle
                </button>
              </div>
              {openMessageId === message.id ? (
                <div className="mt-3 grid gap-2 rounded-md border border-cyan-100 bg-white p-3 text-xs text-slate-700 dark:border-cyan-300/15 dark:bg-slate-950/40 dark:text-slate-200">
                  <DetailRow label="Ad soyad" value={message.name} />
                  <DetailRow label="E-posta" value={message.email} breakAll />
                  <DetailRow label="Konu" value={message.topic} />
                  <DetailRow label="Mesaj içeriği" value={message.message} multiline />
                  <DetailRow label="Tarih" value={formatDate(message.createdAt)} />
                  <DetailRow label="Durum" value={message.status} />
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Henüz mesaj yok
          </p>
        )}
      </div>
    </article>
  );
}

function DetailRow({
  breakAll = false,
  label,
  multiline = false,
  value
}: {
  breakAll?: boolean;
  label: string;
  multiline?: boolean;
  value: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`${breakAll ? "break-all" : "break-words"} ${multiline ? "whitespace-pre-wrap leading-5" : ""}`}>{value}</span>
    </div>
  );
}

function NewsUpdateCard({
  onUpdate,
  status
}: {
  onUpdate: () => void;
  status: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-bold">Guncel Siber Haberler</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        RSS kaynaklarini tarar, uygun haberleri cyber_news tablosuna source_url benzersizligiyle kaydeder.
      </p>
      <button className="btn-primary mt-4 min-h-10 px-4" onClick={onUpdate} type="button">
        Haberleri Guncelle
      </button>
      <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{status}</p>
    </article>
  );
}

function SecurityStatusCard() {
  const items = [
    "Admin erisimi proxy ve role kontrolu ile korunur",
    "Demo bilgiler production arayuzunde gizli",
    "Production OTP ekranda gosterilmez",
    "Security headers aktif",
    "Rate limit hazirligi aktif"
  ];

  return (
    <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10">
      <h2 className="text-xl font-bold">Guvenlik durumu</h2>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <p className="rounded-md border border-emerald-200 bg-white/70 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-100" key={item}>
            {item}
          </p>
        ))}
      </div>
    </article>
  );
}
