"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import type { DbContactMessage } from "@/lib/contactDb";

type MessageFilter = "all" | "new" | "read" | "archived";

const filters: Array<{ label: string; value: MessageFilter }> = [
  { label: "Tümü",   value: "all"      },
  { label: "Yeni",   value: "new"      },
  { label: "Okundu", value: "read"     },
  { label: "Arşiv",  value: "archived" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR");
}

export default function OpsConsoleMessagesPage() {
  const [messages, setMessages]   = useState<DbContactMessage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<MessageFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/contact-messages");
      const data = await res.json() as { ok: boolean; messages?: DbContactMessage[] };
      if (data.ok && data.messages) setMessages(data.messages);
    } catch { /* sessiz hata */ }
    finally { setLoading(false); }
  }

  async function handleMarkAsRead(id: string) {
    await fetch(`/api/admin/contact-messages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "read" }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
  }

  async function handleArchive(id: string) {
    await fetch(`/api/admin/contact-messages/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "archived" }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "archived" } : m));
    if (filter !== "archived") setSelectedId(null);
  }

  const filteredMessages = useMemo(() => {
    if (filter === "all") return messages;
    return messages.filter(m => m.status === filter);
  }, [filter, messages]);

  const selectedMessage = filteredMessages.find(m => m.id === selectedId) ?? filteredMessages[0] ?? null;

  return (
    <AdminGate>
      <AdminShell activeItem="messages">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-400">İletişim Mesajları</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-100">Gelen mesajlar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          İletişim formundan gönderilen mesajlar. Filtrele, okundu işaretle veya arşivle.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map(item => (
            <button
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                filter === item.value
                  ? "border-sky-500/60 bg-sky-500/15 text-sky-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-sky-500/30 hover:text-slate-200"
              }`}
              key={item.value}
              onClick={() => { setFilter(item.value); setSelectedId(null); }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-500">Yükleniyor…</p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
            <MessageList
              messages={filteredMessages}
              onSelect={setSelectedId}
              selectedId={selectedMessage?.id ?? null}
            />
            <MessageDetail
              message={selectedMessage}
              onArchive={handleArchive}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}

function MessageList({
  messages, onSelect, selectedId
}: {
  messages: DbContactMessage[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (!messages.length) {
    return (
      <article className="rounded-lg border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-slate-400">Bu filtrede mesaj yok.</p>
      </article>
    );
  }

  return (
    <div className="grid gap-3">
      {messages.map(message => (
        <button
          className={`rounded-lg border p-4 text-left transition hover:border-sky-500/40 ${
            selectedId === message.id
              ? "border-sky-500/50 bg-sky-500/10"
              : "border-white/10 bg-white/5"
          }`}
          key={message.id}
          onClick={() => onSelect(message.id)}
          type="button"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-slate-100">{message.topic}</p>
            <StatusBadge status={message.status} />
          </div>
          <p className="mt-1 break-words text-sm text-slate-300">{message.name}</p>
          <p className="mt-1 break-all text-xs text-slate-400">{message.email}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{message.message}</p>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">{formatDate(message.created_at)}</p>
        </button>
      ))}
    </div>
  );
}

function MessageDetail({
  message, onArchive, onMarkAsRead
}: {
  message: DbContactMessage | null;
  onArchive: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}) {
  if (!message) {
    return (
      <aside className="rounded-lg border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-slate-400">Detay görüntülemek için bir mesaj seçin.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-white/10 bg-white/5 p-5 lg:sticky lg:top-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-100">Mesaj detayı</h2>
        <StatusBadge status={message.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="Ad soyad" value={message.name} />
        <DetailRow label="E-posta"  value={message.email} breakAll />
        <DetailRow label="Konu"     value={message.topic} />
        <DetailRow label="Mesaj"    value={message.message} multiline />
        <DetailRow label="Tarih"    value={formatDate(message.created_at)} />
        <DetailRow label="Durum"    value={message.status} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={message.status === "read"}
          onClick={() => onMarkAsRead(message.id)}
          type="button"
        >
          Okundu işaretle
        </button>
        <button
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
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

function DetailRow({ breakAll = false, label, multiline = false, value }: {
  breakAll?: boolean; label: string; multiline?: boolean; value: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`text-slate-200 ${breakAll ? "break-all" : "break-words"} ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    archived: "border-white/10 bg-white/10 text-slate-300",
    new:      "border-amber-400/30 bg-amber-400/10 text-amber-300",
    read:     "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  };
  return (
    <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${classes[status] ?? classes.new}`}>
      {status}
    </span>
  );
}
