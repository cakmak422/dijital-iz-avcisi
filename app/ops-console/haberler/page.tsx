"use client";

// NOT: limit=60 sabit, haber sayısı bunu aşarsa server-side pagination'a geçilmeli

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import type { CyberNewsItem } from "@/lib/newsStore";

const PAGE_SIZE = 20;

const riskColors: Record<string, { border: string; bg: string; color: string }> = {
  "Yüksek": { border: "rgba(239,68,68,0.4)",   bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  "Orta":   { border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  "Düşük":  { border: "rgba(34,197,94,0.4)",   bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function OpsConsoleHaberlerPage() {
  const [news, setNews]             = useState<CyberNewsItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [updateStatus, setUpdateStatus] = useState("Hazır");
  const [updating, setUpdating]     = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    try {
      // NOT: limit=60 sabit, haber sayısı bunu aşarsa server-side pagination'a geçilmeli
      const res  = await fetch("/api/news/latest?limit=60");
      const data = await res.json() as { items: CyberNewsItem[] };
      setNews(data.items ?? []);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setUpdating(true);
    setUpdateStatus("Haber kaynakları kontrol ediliyor...");
    try {
      const res    = await fetch("/api/news/fetch", { method: "POST" });
      if (!res.ok) throw new Error();
      const result = await res.json() as { found: number; inserted: number; skipped: number; failed: number; errors?: string[] };
      const errNote = result.errors?.length ? ` İlk hata: ${result.errors[0]}` : "";
      setUpdateStatus(`${result.found} haber bulundu, ${result.inserted} eklendi, ${result.skipped} atlandı.${errNote}`);
      fetchNews(); // listeyi yenile
    } catch {
      setUpdateStatus("Güncelleme başarısız. Kaynak veya ağ erişimini kontrol edin.");
    } finally {
      setUpdating(false);
    }
  }

  const totalPages = Math.ceil(news.length / PAGE_SIZE);
  const pageNews   = news.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminGate>
      <AdminShell activeItem="haberler">

        {/* Başlık + Güncelle butonu */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Haber Yönetimi</p>
            <h1 className="mt-1 text-slate-100" style={{ fontSize: 22, fontWeight: 700 }}>
              Siber Haberler
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Yükleniyor…" : `${news.length} haber listeleniyor.`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.4)", color: "#38BDF8" }}
              disabled={updating}
              onClick={handleUpdate}
              type="button"
            >
              {updating ? "Güncelleniyor…" : "Haberleri Güncelle"}
            </button>
            {updateStatus !== "Hazır" && (
              <p className="max-w-xs text-right text-xs text-slate-400">{updateStatus}</p>
            )}
          </div>
        </div>

        {/* Haber tablosu */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-slate-500">Haberler yükleniyor…</div>
          ) : news.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-500">
              Henüz haber yok. "Haberleri Güncelle" butonuyla kaynakları tarayın.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.1)" }}>
                    {["Başlık", "Kategori", "Risk", "Tarih", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-slate-400"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageNews.map((item) => {
                    const risk = riskColors[item.riskLevel] ?? riskColors["Orta"];
                    const title = item.titleTr || item.title;
                    return (
                      <tr key={item.slug} style={{ borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
                        <td className="max-w-[380px] px-4 py-3">
                          <p className="truncate text-sm font-medium text-slate-200" title={title}>{title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded border px-2 py-0.5 text-[10px] font-bold"
                            style={{ border: `1px solid ${risk.border}`, background: risk.bg, color: risk.color }}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                          {formatDate(item.publishedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/haberler/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-white/10 px-3 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10"
                          >
                            Görüntüle ↗
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination — sadece 20'den fazla haber varsa */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "rgba(56,189,248,0.1)" }}>
              <p className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, news.length)} / {news.length} haber
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="rounded px-3 py-1 text-xs font-semibold transition"
                    style={p === page ? {
                      background: "rgba(14,165,233,0.25)",
                      border: "1px solid rgba(14,165,233,0.4)",
                      color: "#38BDF8",
                    } : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#94A3B8",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </AdminShell>
    </AdminGate>
  );
}
