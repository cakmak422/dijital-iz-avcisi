"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentDemoUser } from "@/lib/auth";

// ── PLACEHOLDER VERİLER ───────────────────────────────────────────────────────

// PLACEHOLDER - Faz 2'de gerçek sorgu verileriyle değiştirilecek
const CHART_DATA = [
  { day: "15 May", val: 3100 },
  { day: "16 May", val: 3800 },
  { day: "17 May", val: 3200 },
  { day: "18 May", val: 4800 },
  { day: "19 May", val: 5100 },
  { day: "20 May", val: 5300 },
  { day: "21 May", val: 5421 },
];

// PLACEHOLDER - Faz 2'de gerçek sistem monitöründen alınacak
const SYSTEM_STATUS = [
  { name: "Web Sunucusu",    icon: "🖥️" },
  { name: "Veritabanı",      icon: "🗄️" },
  { name: "Sorgu Motoru",    icon: "🔍" },
  { name: "Mail Servisi",    icon: "📧" },
  { name: "Yedekleme",       icon: "💾" },
  { name: "Güvenlik Duvarı", icon: "🛡️" },
];

// PLACEHOLDER - Faz 2'de gerçek sorgu geçmişiyle değiştirilecek
const RECENT_QUERIES = [
  { id: 1, query: "http://sahte-site.com",  type: "URL",     result: "RİSKLİ",  date: "21.05.2025 14:32" },
  { id: 2, query: "info@dolandirici.com",   type: "E-POSTA", result: "RİSKLİ",  date: "21.05.2025 14:28" },
  { id: 3, query: "+90 555 123 45 67",      type: "TELEFON", result: "ŞÜPHELİ", date: "21.05.2025 14:21" },
  { id: 4, query: "www.guvenli-site.com",   type: "URL",     result: "GÜVENLİ", date: "21.05.2025 14:15" },
  { id: 5, query: "destek@sirket.com",      type: "E-POSTA", result: "GÜVENLİ", date: "21.05.2025 14:10" },
];

// PLACEHOLDER - Faz 2'de gerçek ihbar sistemiyle değiştirilecek
const RECENT_ALERTS = [
  { title: "Sahte yatırım sitesi",            cat: "Finans / Dolandırıcılık",    time: "14:30" },
  { title: "Kimlik avı (phishing) e-postası", cat: "Phishing",                   time: "14:18" },
  { title: "Sahte ürün satışı",               cat: "E-Ticaret / Dolandırıcılık", time: "13:55" },
  { title: "Şüpheli telefon araması",         cat: "Telefon Dolandırıcılığı",    time: "13:42" },
  { title: "Sahte kurum sitesi",              cat: "Resmi Kurum Taklidi",        time: "13:20" },
];

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

function LineChart() {
  const [tip, setTip] = useState<number | null>(null);
  const W = 460, H = 180, maxV = 6000;
  const pad = { l: 44, r: 20, t: 20, b: 32 };
  const xs = CHART_DATA.map((_, i) => pad.l + (i / (CHART_DATA.length - 1)) * (W - pad.l - pad.r));
  const ys = CHART_DATA.map(d => pad.t + (1 - d.val / maxV) * (H - pad.t - pad.b));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const fillPath = linePath + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`;
  const yLabels = [6000, 5000, 4000, 3000, 2000, 1000, 0];

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
          const y = pad.t + (1 - v / maxV) * (H - pad.t - pad.b);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(56,189,248,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
              <text x={pad.l - 4} y={y + 4} fill="#94A3B8" fontSize="11" textAnchor="end">{v >= 1000 ? `${v/1000}K` : v}</text>
            </g>
          );
        })}
        {CHART_DATA.map((d, i) => (
          <text key={i} x={xs[i]} y={H - 4} fill="#94A3B8" fontSize="10" textAnchor="middle">{d.day}</text>
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
              {CHART_DATA[tip].day} 2025
            </text>
            <text x={xs[tip]} y={ys[tip]-12} fill="#F8FAFC" fontSize="10" textAnchor="middle" fontWeight="bold">
              {CHART_DATA[tip].val.toLocaleString("tr-TR")} Sorgu {/* PLACEHOLDER */}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── ANA BILEŞEN ───────────────────────────────────────────────────────────────

export function OpsConsolePage() {
  const [adminName, setAdminName] = useState("Pro Admin");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [newsCount, setNewsCount] = useState<number | null>(null);

  useEffect(() => {
    // Gerçek kullanıcı adı
    const me = getCurrentDemoUser();
    if (me) setAdminName(me.firstName ? `${me.firstName} ${me.lastName ?? ""}`.trim() : me.username);

    // Gerçek üye sayısı — Supabase'den (admin-korumalı endpoint)
    fetch("/api/admin/users")
      .then(r => r.json())
      .then((d: { ok: boolean; users?: unknown[] }) => {
        if (d.ok && Array.isArray(d.users)) setUserCount(d.users.length);
      })
      .catch(() => {});

    // Gerçek haber sayısı
    fetch("/api/news/latest?limit=1")
      .then(r => r.json())
      .then(d => { if (typeof d.count === "number") setNewsCount(d.count); })
      .catch(() => {});
  }, []);

  // 6 metrik kart — gerçek veri olan 2 slot güncellendi, geri kalan PLACEHOLDER
  const METRICS = [
    {
      label: "TOPLAM ÜYE",
      value: userCount !== null ? String(userCount) : "…", // GERÇEK
      change: "", sub: "Bu tarayıcıda kayıtlı",
      color: "#0EA5E9", bg: "rgba(14,165,233,0.12)", icon: "👥"
    },
    {
      label: "BUGÜNKÜ SORGU",
      value: "5.421", change: "↑ 18.7%", sub: "Dün'e göre", // PLACEHOLDER - gerçek sorgu logu yok
      color: "#22D3EE", bg: "rgba(34,211,238,0.12)", icon: "📡"
    },
    {
      label: "RİSKLİ URL",
      value: "1.248", change: "↑ 7.3%", sub: "Toplam tespit", // PLACEHOLDER
      color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: "⚠️"
    },
    {
      label: "GELEN İHBAR",
      value: "63", change: "↑ 31.4%", sub: "Son 24 saat", // PLACEHOLDER
      color: "#A855F7", bg: "rgba(168,85,247,0.12)", icon: "🚨"
    },
    {
      label: "HABER SAYISI",
      value: newsCount !== null ? String(newsCount) : "…", // GERÇEK
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

        {/* 6 METRİK KARTI */}
        <div className="mb-4 grid grid-cols-6 gap-2.5">
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

        {/* ORTA SATIR: Grafik | Harita | Sistem Durumu */}
        <div className="mb-4 grid gap-2.5" style={{ gridTemplateColumns: "1fr 0.65fr 0.45fr" }}>

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
            <LineChart /> {/* PLACEHOLDER - ileride gerçek veriyle bağlanacak */}
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

        {/* ALT SATIR: Sorgular | İhbarlar | Hızlı İşlemler */}
        <div className="mb-4 grid gap-2.5" style={{ gridTemplateColumns: "1fr 0.75fr 0.55fr" }}>

          {/* Son sorgular — PLACEHOLDER */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">SON SORGULAR</div>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {["#","SORGULANAN","TÜR","SONUÇ","TARİH"].map(h => (
                    <th key={h} className="pb-2 text-slate-400"
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderBottom: "1px solid rgba(56,189,248,0.1)", paddingRight: 6, paddingLeft: 4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* PLACEHOLDER - ileride gerçek veriyle bağlanacak */}
                {RECENT_QUERIES.map((q, i) => {
                  const rc = resultStyle(q.result);
                  const tc = typeStyle(q.type);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
                      <td className="py-1.5 pl-1 text-[11px] text-slate-500">{q.id}</td>
                      <td className="max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pr-2 text-[11px] text-slate-300">{q.query}</td>
                      <td className="py-1.5 pr-1">
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                          style={{ background: tc.bg, color: tc.color }}>{q.type}</span>
                      </td>
                      <td className="py-1.5 pr-1">
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                          style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>{q.result}</span>
                      </td>
                      <td className="whitespace-nowrap py-1.5 text-[10px] text-slate-500">{q.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 cursor-pointer text-center text-xs" style={{ color: "#0EA5E9" }}>
              Tüm sorguları görüntüle → {/* PLACEHOLDER */}
            </div>
          </div>

          {/* Son ihbarlar — PLACEHOLDER */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold tracking-wide text-slate-100">SON İHBARLAR</div>
              <span className="cursor-pointer text-[11px]" style={{ color: "#0EA5E9" }}>Tümünü Gör</span>
            </div>
            {/* PLACEHOLDER - ileride gerçek veriyle bağlanacak */}
            {RECENT_ALERTS.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2"
                style={{ borderBottom: i < RECENT_ALERTS.length - 1 ? "1px solid rgba(56,189,248,0.07)" : "none" }}>
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#EF4444", boxShadow: "0 0 6px #EF4444" }}/>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-300">{a.title}</div>
                  <div className="text-[10px] text-slate-500">{a.cat}</div>
                </div>
                <div className="shrink-0 text-[11px] text-slate-500">{a.time}</div>
              </div>
            ))}
            <div className="mt-3 cursor-pointer text-center text-xs" style={{ color: "#0EA5E9" }}>
              Tüm ihbarları görüntüle → {/* PLACEHOLDER */}
            </div>
          </div>

          {/* Hızlı işlemler — gerçek linkler bağlandı */}
          <div className="rounded-2xl p-4 backdrop-blur-md"
            style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
            <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">HIZLI İŞLEMLER</div>
            <div className="grid grid-cols-3 gap-2">
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
