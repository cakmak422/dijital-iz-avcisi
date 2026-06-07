"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { BrandLogo } from "@/components/BrandLogo";
import type { ContactMessage, ContactMessageStatus } from "@/lib/contactStore";
import { archiveMessage, getAllContactMessages, markAsRead, subscribeToContactMessages } from "@/lib/contactStore";

type MessageFilter = "all" | ContactMessageStatus;

const filters: Array<{ label: string; value: MessageFilter }> = [
  { label: "Tümü", value: "all" },
  { label: "Yeni", value: "new" },
  { label: "Okundu", value: "read" },
  { label: "Arşiv", value: "archived" }
];

export default function OpsConsoleMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    function syncMessages() {
      setMessages(getAllContactMessages());
    }

    syncMessages();
    return subscribeToContactMessages(syncMessages);
  }, []);

  const filteredMessages = useMemo(() => {
    if (filter === "all") return messages;
    return messages.filter((message) => message.status === filter);
  }, [filter, messages]);

  const selectedMessage = filteredMessages.find((message) => message.id === selectedId) ?? filteredMessages[0] ?? null;

  function refreshMessages() {
    setMessages(getAllContactMessages());
  }

  function handleMarkAsRead(id: string) {
    markAsRead(id);
    refreshMessages();
  }

  function handleArchive(id: string) {
    archiveMessage(id);
    refreshMessages();
    if (filter !== "archived") setSelectedId(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Ops Console" />
          <div className="flex items-center gap-2">
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
              Ana sayfa
            </Link>
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Local MVP</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">İletişim mesajları.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Bu ekran iletişim formundan localStorage'a kaydedilen mesajları listeler. Gerçek e-posta, API veya veritabanı bağlantısı bu fazda eklenmedi.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    filter === item.value
                      ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-cyan-300/40 dark:bg-cyan-300/10 dark:text-cyan-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
                  key={item.value}
                  onClick={() => {
                    setFilter(item.value);
                    setSelectedId(null);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
              <MessageList messages={filteredMessages} onSelect={setSelectedId} selectedId={selectedMessage?.id ?? null} />
              <MessageDetail message={selectedMessage} onArchive={handleArchive} onMarkAsRead={handleMarkAsRead} />
            </div>
          </div>
        </section>
      </AdminGate>
    </main>
  );
}

function MessageList({
  messages,
  onSelect,
  selectedId
}: {
  messages: ContactMessage[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (!messages.length) {
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bu filtrede mesaj yok.</p>
      </article>
    );
  }

  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <button
          className={`rounded-lg border p-4 text-left shadow-sm transition hover:border-cyan-300 ${
            selectedId === message.id
              ? "border-cyan-400 bg-cyan-50 dark:border-cyan-300/40 dark:bg-cyan-300/10"
              : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
          }`}
          key={message.id}
          onClick={() => onSelect(message.id)}
          type="button"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-slate-900 dark:text-white">{message.topic}</p>
            <StatusBadge status={message.status} />
          </div>
          <p className="mt-1 break-words text-sm text-slate-700 dark:text-slate-200">{message.name}</p>
          <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{message.email}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{message.message}</p>
          <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{formatDate(message.createdAt)}</p>
        </button>
      ))}
    </div>
  );
}

function MessageDetail({
  message,
  onArchive,
  onMarkAsRead
}: {
  message: ContactMessage | null;
  onArchive: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}) {
  if (!message) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Detay görüntulemek için bir mesaj secin.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 lg:sticky lg:top-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-bold">Mesaj detayi</h2>
        <StatusBadge status={message.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="Ad soyad" value={message.name} />
        <DetailRow label="E-posta" value={message.email} breakAll />
        <DetailRow label="Konu" value={message.topic} />
        <DetailRow label="Mesaj" value={message.message} multiline />
        <DetailRow label="Tarih" value={formatDate(message.createdAt)} />
        <DetailRow label="Durum" value={message.status} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100"
          disabled={message.status === "read"}
          onClick={() => onMarkAsRead(message.id)}
          type="button"
        >
          Okundu isaretle
        </button>
        <button
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-amber-300"
          disabled={message.status === "archived"}
          onClick={() => onArchive(message.id)}
          type="button"
        >
          Arşivle
        </button>
      </div>
    </aside>
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
    <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`${breakAll ? "break-all" : "break-words"} ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  const classes = {
    archived: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300",
    new: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100",
    read: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100"
  } satisfies Record<ContactMessageStatus, string>;

  return (
    <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${classes[status]}`}>
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR");
}
