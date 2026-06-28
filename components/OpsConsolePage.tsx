"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentDemoUser } from "@/lib/auth";

// ── PLACEHOLDER VERİLER ───────────────────────────────────────────────────────

// Grafik verisi artık API'den geliyor — bu sabit kaldırıldı

// PLACEHOLDER - Faz 2'de gerçek sistem monitöründen alınacak
const SYSTEM_STATUS = [
  { name: "Web Sunucusu",    icon: "🖥️" },
  { name: "Veritabanı",      icon: "🗄️" },
  { name: "Sorgu Motoru",    icon: "🔍" },
  { name: "Mail Servisi",    icon: "📧" },
  { name: "Yedekleme",       icon: "💾" },
  { name: "Güvenlik Duvarı", icon: "🛡️" },
];

// Sorgu geçmişi ve ihbar listesi kaldırıldı — gerçek veri API'den geliyor

// Hızlı İşlemler — gerçek href'ler bağlandı, geri kalanlar placeholder
const QUICK_ACTIONS = [
  { label: "Haberler",       icon: "📰", color: "#0EA5E9", bg: "rgba(14,165,233,0.15)", href: "/ops-console/haberler" },
  { label: "Rehber Ekle",    icon: "📘", color: "#22C55E", bg: "rgba(34,197,94,0.15)",  href: "/ops-console/page-management" },
  { label: "Duyuru Yayınla", icon: "📢", color: "#A855F7", bg: "rgba(168,85,247,0.15)", href: "/ops-console/content" },
  { label: "Kullanıcı Ekle", icon: "👤", color: "#0EA5E9", bg: "rgba(14,165,233,0.15)", href: "/ops-console/uyeler" },
  { label: "Sistem Logları", icon: "📊", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", href: null }, // PLACEHOLDER - gerçek sayfa yok
  { label: "Ayarlar",        icon: "⚙️", color: "#94A3B8", bg: "rgba(148,163,184,0.15)",href: "/ops-console/site-settings" },
];

// ── BADGE YARDIMCILAR ─────────────────────────────────────────────────────────

function resultStyle(r: string) {
  if (r === "RİSKLİ")  return { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", border: "rgba(239,68,68,0.4)"  };
  if (r === "ŞÜPHELİ") return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.4)" };
  return                       { bg: "rgba(34,197,94,0.15)",  color: "#22C55E", border: "rgba(34,197,94,0.4)"  };
}
function typeStyle(t: string) {
  if (t === "URL")     return { bg: "rgba(14,165,233,0.15)", color: "#38BDF8" };
  if (t === "E-POSTA") return { bg: "rgba(168,85,247,0.15)", color: "#A855F7" };
  return                      { bg: "rgba(34,197,94,0.15)",  color: "#22C55E" };
}

// ── SVG ÇİZGİ GRAFİĞİ ────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  const [tip, setTip] = useState<number | null>(null);
  const W = 460, H = 180;
  const pad = { l: 44, r: 20, t: 20, b: 32 };
  const maxV = Math.max(...data.map(d => d.count), 1); // en az 1, sıfır bölmeyi engeller

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-slate-500">
        Henüz sorgu verisi yok
      </div>
    );
  }

  const xs = data.map((_, i) => pad.l + (i / Math.max(data.length - 1, 1)) * (W - pad.l - pad.r));
  const ys = data.map(d => pad.t + (1 - d.count / maxV) * (H - pad.t - pad.b));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const fillPath = linePath + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`;
  const yMax = Math.ceil(maxV / 5) * 5 || 5;
  const yLabels = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

  // Tarihi kısa "15 Haz" formatına çevir
  function shortDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(iso));
    } catch { return iso.slice(5); }
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0EA5E9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {yLabels.map((v, i) => {
          const y = pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(56,189,248,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
              <text x={pad.l - 4} y={y + 4} fill="#94A3B8" fontSize="11" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={xs[i]} y={H - 4} fill="#94A3B8" fontSize="10" textAnchor="middle">{shortDate(d.date)}</text>
        ))}
        <path d={fillPath} fill="url(#lg)"/>
        <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="2.5" filter="url(#glow)"/>
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]}
            r={i === xs.length - 1 ? 5 : 3}
            fill={i === xs.length - 1 ? "#fff" : "#0EA5E9"}
            stroke={i === xs.length - 1 ? "#0EA5E9" : "transparent"}
            strokeWidth="2" className="cursor-pointer"
            onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)}
          />
        ))}
        {tip !== null && (
          <g>
            <rect x={xs[tip]-52} y={ys[tip]-44} width="104" height="38" rx="6"
              fill="rgba(8,20,45,0.95)" stroke="rgba(14,165,233,0.6)" strokeWidth="1"/>
            <text x={xs[tip]} y={ys[tip]-28} fill="#94A3B8" fontSize="9" textAnchor="middle">
              {shortDate(data[tip].date)}
            </text>
            <text x={xs[tip]} y={ys[tip]-12} fill="#F8FAFC" fontSize="10" textAnchor="middle" fontWeight="bold">
              {data[tip].count.toLocaleString("tr-TR")} Sorgu
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── ANA BILEŞEN ───────────────────────────────────────────────────────────────

type QueryLogRow = {
  id: string; query_type: string; query_value: string;
  risk_level: string | null; created_at: string;
};
type DailyCount = { date: string; count: number };

export function OpsConsolePage() {
  const [adminName, setAdminName]       = useState("Pro Admin");
  const [userCount, setUserCount]       = useState<number | null>(null);
  const [newsCount, setNewsCount]       = useState<number | null>(null);
  const [todayTotal, setTodayTotal]     = useState<number | null>(null);
  const [riskyUrl, setRiskyUrl]         = useState<number | null>(null);
  const [chartData, setChartData]       = useState<DailyCount[]>([]);
  const [recentLogs, setRecentLogs]     = useState<QueryLogRow[]>([]);
  const [msgTotal, setMsgTotal]         = useState<number | null>(null);
  const [msgNew, setMsgNew]             = useState<number | null>(null);
  const [recentMsgs, setRecentMsgs]     = useState<Array<{ id: string; topic: string; name: string; status: string }>>([]);

  useEffect(() => {
    const me = getCurrentDemoUser();
    if (me) setAdminName(me.firstName ? `${me.firstName} ${me.lastName ?? ""}`.trim() : me.username);

    fetch("/api/admin/users")
      .then(r => r.json())
      .then((d: { ok: boolean; users?: unknown[] }) => {
        if (d.ok && Array.isArray(d.users)) setUserCount(d.users.length);
      })
      .catch(() => {});

    fetch("/api/news/latest?limit=1")
      .then(r => r.json())
      .then(d => { if (typeof d.count === "number") setNewsCount(d.count); })
      .catch(() => {});

    // Gerçek mesaj sayıları ve son mesajlar
    fetch("/api/admin/contact-messages")
      .then(r => r.json())
      .then((d: { ok: boolean; messages?: Array<{ id: string; topic: string; name: string; status: string }> }) => {
        if (!d.ok || !d.messages) return;
        setMsgTotal(d.messages.length);
        setMsgNew(d.messages.filter(m => m.status === "new").length);
        setRecentMsgs(d.messages.slice(0, 3));
      })
      .catch(() => {});

    // Gerçek sorgu istatistikleri
    fetch("/api/admin/query-stats")
      .then(r => r.json())
      .then((d: { ok: boolean; todayTotal?: number; riskyUrlCount?: number; last7Days?: DailyCount[]; recentLogs?: QueryLogRow[] }) => {
        if (!d.ok) return;
        if (typeof d.todayTotal === "number")   setTodayTotal(d.todayTotal);
        if (typeof d.riskyUrlCount === "number") setRiskyUrl(d.riskyUrlCount);
        if (Array.isArray(d.last7Days))         setChartData(d.last7Days);
        if (Array.isArray(d.recentLogs))        setRecentLogs(d.recentLogs);
      })
      .catch(() => {});
  }, []);

  // 5 metrik kart — "Gelen İhbar" kaldırıldı (gerçek özellik yok)
  const METRICS = [
    {
      label: "TOPLAM ÜYE",
      value: userCount !== null ? String(userCount) : "…",
      change: "", sub: "Kayıtlı kullanıcı",
      color: "#0EA5E9", bg: "rgba(14,165,233,0.12)", icon: "👥"
    },
    {
      label: "BUGÜNKÜ SORGU",
      value: todayTotal !== null ? String(todayTotal) : "…",
      change: "", sub: "Bugün yapılan sorgu",
      color: "#22D3EE", bg: "rgba(34,211,238,0.12)", icon: "📡"
    },
    {
      label: "RİSKLİ URL",
      value: riskyUrl !== null ? String(riskyUrl) : "…",
      change: "", sub: "Yüksek riskli phishing/site",
      color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: "⚠️"
    },
    {
      label: "GELEN MESAJ",
      value: msgTotal !== null ? String(msgTotal) : "…",
      change: "", sub: msgNew !== null ? `${msgNew} yeni mesaj` : "Yeni mesajlar",
      color: "#A855F7", bg: "rgba(168,85,247,0.12)", icon: "✉️"
    },
    {
      label: "HABER SAYISI",
      value: newsCount !== null ? String(newsCount) : "…",
      change: "", sub: "Veritabanındaki haber",
      color: "#22C55E", bg: "rgba(34,197,94,0.12)", icon: "📄"
    },
    {
      label: "SİSTEM DURUMU",
      value: "AKTİF", change: "", sub: "Tüm sistemler",
      color: "#0EA5E9", bg: "rgba(14,165,233,0.12)", icon: "🖥️", isStatus: true as const
    },
  ];

  return (
    <AdminGate>
      <AdminShell activeItem="dashboard">

        {/* Başlık */}
        <div className="mb-5">
          <h1 className="text-slate-100" style={{ fontSize: 22, fontWeight: 700 }}>Hoş geldin, {adminName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Dijital İz Avcısı Operasyon Merkezi</p>
        </div>

        {/* 6 METRİK KARTI — mobil:2, tablet:3, masaüstü:6 */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {METRICS.map((m, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-2xl p-3.5 backdrop-blur-md"
              style={{
                background: "rgba(8,20,45,0.82)",
                border: `1px solid ${m.color}30`,
                boxShadow: `0 0 12px ${m.color}10`,
              }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-lg"
                style={{
                  background: m.bg,
                  border: `1px solid ${m.color}70`,
                  boxShadow: `0 0 24px ${m.color}88, inset 0 0 12px ${m.color}40`,
                }}>
                <span style={{ filter: `drop-shadow(0 0 6px ${m.color}99)` }}>{m.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold tracking-wide text-slate-500">{m.label}</div>
                <div style={{ color: m.isStatus ? "#22C55E" : "#F8FAFC", fontSize: m.isStatus ? 16 : 20, fontWeight: 800, lineHeight: 1.2 }}>
                  {m.value}
                </div>
                {m.isStatus ? (
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: "#22C55E" }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#22C55E" }}/>
                    {m.sub}
                  </div>
                ) : (
                  <>
                    {m.change ? <div className="text-[10px] font-semibold" style={{ color: m.color }}>{m.change}</div> : null}
                    <div className="text-[10px] text-slate-500">{m.sub}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ORTA SATIR: Grafik | Harita | Sistem Durumu — mobil:tek kolon, masaüstü:3 kolon */}
        <div className="mb-4 grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_0.65fr_0.45fr]">

          {/* Grafik — PLACEHOLDER */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold tracking-wide text-slate-100">
                SORGU İSTATİSTİKLERİ <span className="text-slate-500">ⓘ</span>
              </div>
              <div className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] text-slate-400"
                style={{ background: "rgba(8,20,45,0.8)", border: "1px solid rgba(56,189,248,0.2)" }}>
                Son 7 Gün ▾ {/* PLACEHOLDER */}
              </div>
            </div>
            <LineChart data={chartData} />
          </div>

          {/* Tehdit haritası — PLACEHOLDER */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold tracking-wide text-slate-100">TEHDİT HARİTASI</div>
              <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-slate-400"
                style={{ background: "rgba(8,20,45,0.8)", border: "1px solid rgba(56,189,248,0.2)" }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#22C55E" }}/>Canlı ▾
              </div>
            </div>
            {/* PLACEHOLDER - ileride gerçek tehdit haritasıyla bağlanacak */}
            <div className="flex h-44 items-center justify-center rounded-lg"
              style={{ background: "rgba(2,6,23,0.6)", border: "1px dashed rgba(56,189,248,0.2)" }}>
              <div className="text-center">
                <div className="text-2xl">🗺️</div>
                <div className="mt-2 text-xs text-slate-500">Tehdit Haritası</div>
                <div className="text-[10px] text-slate-600">Yakında aktif olacak</div>
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400">
              {[["#0EA5E9","Düşük Risk"],["#F59E0B","Orta Risk"],["#EF4444","Yüksek Risk"]].map(([c,l],i)=>(
                <div key={i} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: c }}/>
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Sistem durumu — PLACEHOLDER */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">SİSTEM DURUMU</div>
            {SYSTEM_STATUS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5"
                style={{ borderBottom: i < SYSTEM_STATUS.length - 1 ? "1px solid rgba(56,189,248,0.07)" : "none" }}>
                <span className="text-sm">{s.icon}</span>
                <span className="flex-1 text-xs text-slate-300">{s.name}</span>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 4px #22C55E" }}/>
                  <span className="text-[11px] font-semibold" style={{ color: "#22C55E" }}>Aktif</span> {/* PLACEHOLDER */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALT SATIR: Sorgular | Mesajlar | Hızlı İşlemler — mobil:tek kolon, masaüstü:3 kolon */}
        <div className="mb-4 grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_0.65fr_0.55fr]">

          {/* Son sorgular — GERÇEK VERİ */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">SON SORGULAR</div>
            {recentLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">Henüz sorgu kaydı yok.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {["SORGULANAN","TÜR","RİSK","TARİH"].map(h => (
                      <th key={h} className="pb-2 text-slate-400"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderBottom: "1px solid rgba(56,189,248,0.1)", paddingRight: 6, paddingLeft: 4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((q) => {
                    const riskColor = q.risk_level === "Yüksek"
                      ? { bg: "rgba(239,68,68,0.15)", color: "#EF4444", border: "rgba(239,68,68,0.4)" }
                      : q.risk_level === "Orta"
                      ? { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.4)" }
                      : { bg: "rgba(34,197,94,0.15)", color: "#22C55E", border: "rgba(34,197,94,0.4)" };
                    const shortDate = (() => { try { return new Intl.DateTimeFormat("tr-TR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }).format(new Date(q.created_at)); } catch { return q.created_at.slice(0,16); } })();
                    return (
                      <tr key={q.id} style={{ borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
                        <td className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pr-2 pl-1 text-[11px] text-slate-300">{q.query_value}</td>
                        <td className="py-1.5 pr-1">
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                            style={{ background: "rgba(14,165,233,0.15)", color: "#38BDF8" }}>{q.query_type}</span>
                        </td>
                        <td className="py-1.5 pr-1">
                          {q.risk_level ? (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                              style={{ background: riskColor.bg, color: riskColor.color, border: `1px solid ${riskColor.border}` }}>{q.risk_level}</span>
                          ) : <span className="text-[10px] text-slate-600">—</span>}
                        </td>
                        <td className="whitespace-nowrap py-1.5 text-[10px] text-slate-500">{shortDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Son mesajlar — GERÇEK VERİ */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold tracking-wide text-slate-100">SON MESAJLAR</div>
              <Link href="/ops-console/messages" className="text-[11px] transition hover:text-sky-300" style={{ color: "#0EA5E9" }}>
                Tümünü Gör
              </Link>
            </div>
            {recentMsgs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">Henüz mesaj yok.</p>
            ) : (
              recentMsgs.map((m) => (
                <div key={m.id} className="flex items-start gap-2 py-2"
                  style={{ borderBottom: "1px solid rgba(56,189,248,0.07)" }}>
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: m.status === "new" ? "#F59E0B" : "#64748B" }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-300">{m.topic}</div>
                    <div className="text-[10px] text-slate-500">{m.name}</div>
                  </div>
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                    style={m.status === "new"
                      ? { background: "rgba(245,158,11,0.15)", color: "#F59E0B" }
                      : { background: "rgba(100,116,139,0.15)", color: "#94A3B8" }}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Hızlı işlemler — gerçek linkler bağlandı */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">HIZLI İŞLEMLER</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_ACTIONS.map((a, i) => {
                const inner = (
                  <>
                    <span style={{ fontSize: 22, filter: `drop-shadow(0 0 6px ${a.color}99)` }}>{a.icon}</span>
                    <span className="text-center text-[9px] font-semibold leading-tight text-slate-300">{a.label}</span>
                  </>
                );
                const style = {
                  background: a.bg,
                  border: `1px solid ${a.color}70`,
                  boxShadow: `0 0 20px ${a.color}55, inset 0 0 8px ${a.color}20`,
                };
                return a.href ? (
                  <Link key={i} href={a.href}
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:opacity-90"
                    style={style}>
                    {inner}
                  </Link>
                ) : (
                  // PLACEHOLDER - ileride gerçek aksiyonla bağlanacak
                  <div key={i} className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl p-3 opacity-50"
                    style={style}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-3.5 text-[11px] text-slate-500"
          style={{ borderColor: "rgba(56,189,248,0.1)" }}>
          <span>Dijital İz Avcısı © 2025 | Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-2 font-semibold tracking-widest text-slate-400">
            <span>🛡️</span><span>SİBER GÜVENLİK BİLİNÇ PLATFORMU</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "#22C55E" }}>
            <span>🔒</span>
            <span>v2.5.0 | Güvenli Bağlantı</span>
          </div>
        </div>

      </AdminShell>
    </AdminGate>
  );
}
