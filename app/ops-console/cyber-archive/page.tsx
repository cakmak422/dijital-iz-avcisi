"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { cyberArchiveEvents, type CyberArchiveEvent } from "@/lib/cyberArchive";

type EventWithImage = CyberArchiveEvent & {
  imageUrl?: string | null;
  imageSource?: string;
};

export default function CyberArchiveAdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-cyan-300/10 bg-slate-950/95">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="Siber Arşiv Yönetimi" />
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-cyan-300/15 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-300/15 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-300/10" href="/siber-arsiv">
              Siber Arşiv →
            </Link>
            <AdminSessionMenu />
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Siber Arşiv — Görsel Yönetimi</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Her olay için manuel görsel yükleyebilirsiniz. Admin görseli her zaman AI görseline göre önceliklidir.
                </p>
              </div>
              <SyncFromNewsButton />
            </div>
            <ArchiveImageManager />
          </div>
        </section>
      </AdminGate>
    </main>
  );
}

function friendlyAiError(reason: string | undefined): string {
  if (!reason) return "AI görsel üretilemedi. Daha sonra tekrar deneyin.";
  if (reason.includes("429") || reason.includes("kota")) {
    return "Gemini görsel üretim kotası aşıldı. Daha sonra tekrar deneyin.";
  }
  if (reason.includes("paid")) {
    return "Gemini görsel üretimi için ücretli plan gerekiyor.";
  }
  if (reason.includes("GEMINI_API_KEY")) {
    return "Gemini API anahtarı tanımlı değil.";
  }
  if (reason.includes("inlineData") || reason.includes("görsel üretmedi")) {
    return "Gemini bu olay için görsel oluşturamadı. Farklı bir olay deneyin.";
  }
  if (reason.includes("Ağ") || reason.includes("timeout") || reason.includes("fetch")) {
    return "Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }
  return "AI görsel üretilemedi. Daha sonra tekrar deneyin.";
}

function AiGenerateButton({
  slug,
  onGenerated
}: {
  slug: string;
  onGenerated: (url: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg]       = useState("");

  async function handleGenerate() {
    setStatus("running");
    setMsg("");
    try {
      const res  = await fetch(`/api/cyber-archive/generate-image/${encodeURIComponent(slug)}`, { method: "POST" });
      const data = await res.json() as { ok: boolean; imageUrl?: string; skipped?: boolean; reason?: string };

      if (data.skipped) {
        setStatus("idle");
        setMsg("Admin görseli mevcut — AI atlandı.");
        return;
      }

      if (data.ok && data.imageUrl) {
        setStatus("done");
        setMsg("Görsel başarıyla üretildi.");
        onGenerated(data.imageUrl);
        return;
      }

      // Hata: teknik detay console'a, kullanıcıya temiz mesaj
      console.error("[AI Görsel] Üretim başarısız:", data.reason);
      setStatus("error");
      setMsg(friendlyAiError(data.reason));
    } catch (err) {
      console.error("[AI Görsel] Ağ hatası:", err);
      setStatus("error");
      setMsg("Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className="rounded-md border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-300/20 disabled:opacity-50"
        disabled={status === "running"}
        onClick={handleGenerate}
        type="button"
      >
        {status === "running" ? "AI üretiyor…" : "AI Görsel Üret"}
      </button>
      {status === "error" && msg && (
        <span className="max-w-[220px] rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
          {msg}
        </span>
      )}
      {status === "done" && msg && (
        <span className="text-xs text-emerald-400">{msg}</span>
      )}
      {status === "idle" && msg && (
        <span className="text-xs text-slate-400">{msg}</span>
      )}
    </div>
  );
}

function SyncFromNewsButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg]       = useState("");

  async function handleSync() {
    setStatus("running");
    setMsg("");
    try {
      const res  = await fetch("/api/cyber-archive/sync-from-news", { method: "POST" });
      const data = await res.json() as { ok: boolean; message?: string; error?: string };
      if (data.ok) { setStatus("done"); setMsg(data.message ?? "Senkronizasyon tamamlandı."); }
      else          { setStatus("error"); setMsg(data.error ?? "Senkronizasyon başarısız."); }
    } catch {
      setStatus("error");
      setMsg("Ağ hatası.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50"
        disabled={status === "running"}
        onClick={handleSync}
        type="button"
      >
        {status === "running" ? "Senkronize ediliyor…" : "Haberlerden Arşive Aktar"}
      </button>
      {msg && (
        <p className={`text-xs ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>{msg}</p>
      )}
    </div>
  );
}

function ArchiveImageManager() {
  const [events, setEvents] = useState<EventWithImage[]>([]);

  useEffect(() => {
    // DB'den olayları çek; başarısız olursa seed fallback kullan
    fetch("/api/cyber-timeline/events")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        } else {
          setEvents(cyberArchiveEvents);
        }
      })
      .catch(() => setEvents(cyberArchiveEvents));
  }, []);

  if (!events.length) {
    return <p className="text-slate-400">Olaylar yükleniyor…</p>;
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <ArchiveEventImageRow
          event={event}
          key={event.slug}
          onUploaded={(slug, url) =>
            setEvents((prev) =>
              prev.map((e) => (e.slug === slug ? { ...e, imageUrl: url, imageSource: "admin-upload" } : e))
            )
          }
        />
      ))}
    </div>
  );
}

function ArchiveEventImageRow({
  event,
  onUploaded
}: {
  event: EventWithImage;
  onUploaded: (slug: string, url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "ok" | "warn" | "error">("idle");
  const [uploadMsg, setUploadMsg]       = useState("");
  const [preview, setPreview] = useState<string | null>(event.imageUrl ?? null);
  const [source, setSource]   = useState(event.imageSource ?? "none");

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadStatus("idle");
    setUploadMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", event.slug);

    try {
      const res  = await fetch("/api/cyber-archive/image-upload", { method: "POST", body: fd });
      const data = await res.json() as { ok: boolean; imageUrl?: string; error?: string; warning?: string };
      if (!data.ok) {
        console.error("[Görsel Yükleme] Hata:", data.error);
        setUploadStatus("error");
        setUploadMsg("Görsel yüklenemedi. Tekrar deneyin.");
        return;
      }
      setPreview(data.imageUrl ?? null);
      setSource("admin-upload");
      if (data.imageUrl) onUploaded(event.slug, data.imageUrl);
      if (data.warning) {
        console.warn("[Görsel Yükleme] Uyarı:", data.warning);
        setUploadStatus("warn");
        setUploadMsg("Görsel yüklendi ancak veritabanı güncellenemedi.");
      } else {
        setUploadStatus("ok");
        setUploadMsg("Görsel başarıyla yüklendi.");
      }
    } catch (err) {
      console.error("[Görsel Yükleme] Ağ hatası:", err);
      setUploadStatus("error");
      setUploadMsg("Ağ hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  }

  const sourceLabel: Record<string, string> = {
    "admin-upload":  "Admin yükledi",
    "ai-generated":  "AI üretimi",
    none:            "Görsel yok"
  };

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 sm:flex-row sm:items-start">
      {/* Önizleme */}
      <div className="shrink-0">
        {preview ? (
          <img
            alt={event.title}
            className="h-20 w-32 rounded-md border border-slate-600 object-cover"
            src={preview}
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed border-slate-600 text-xs text-slate-500">
            Görsel yok
          </div>
        )}
      </div>

      {/* Olay bilgisi */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{event.year}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${
            source === "admin-upload" ? "bg-emerald-800/60 text-emerald-200" :
            source === "ai-generated" ? "bg-blue-800/60 text-blue-200" :
            "bg-slate-800 text-slate-400"
          }`}>
            {sourceLabel[source] ?? "Bilinmiyor"}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold">{event.title}</p>
        <p className="text-xs text-slate-400">{event.slug}</p>

        {/* Yükleme ve AI alanı */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            ref={fileRef}
            type="file"
          />
          <button
            className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            {uploading ? "Yükleniyor…" : "Manuel Görsel Yükle"}
          </button>
          {source !== "admin-upload" && (
            <AiGenerateButton
              onGenerated={(url) => {
                setPreview(url);
                setSource("ai-generated");
              }}
              slug={event.slug}
            />
          )}
          {source === "admin-upload" && (
            <span className="text-xs text-slate-500">AI: admin görseli korunuyor</span>
          )}
          {preview && (
            <a
              className="text-xs text-slate-400 underline hover:text-white"
              href={preview}
              rel="noreferrer"
              target="_blank"
            >
              Görseli aç
            </a>
          )}
        </div>
        {uploadStatus === "error" && uploadMsg && (
          <p className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
            {uploadMsg}
          </p>
        )}
        {uploadStatus === "warn" && uploadMsg && (
          <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
            ⚠ {uploadMsg}
          </p>
        )}
        {uploadStatus === "ok" && uploadMsg && (
          <p className="mt-2 text-xs text-emerald-400">{uploadMsg}</p>
        )}
      </div>
    </article>
  );
}
