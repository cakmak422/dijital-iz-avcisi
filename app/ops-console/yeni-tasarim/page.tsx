"use client";

/**
 * /ops-console/yeni-tasarim — Yeni Admin Dashboard (Görsel Prototip)
 *
 * SADECE GÖRSEL — gerçek veri bağlama Faz 2'de yapılacak.
 * Tüm sayılar ve metinler PLACEHOLDER.
 *
 * ThemeStyleInjector NOT: --theme-primary / --theme-secondary değişkenleri
 * .cyber-page scope'unda tanımlı. Bu sayfa CyberPageShell kullanmadığı için
 * o değişkenler buraya ulaşmıyor. Renkler sabit (#0EA5E9, vb.) bırakıldı.
 */

import { useState } from "react";

// ── PLACEHOLDER VERİLER ───────────────────────────────────────────────────────

// PLACEHOLDER - Faz 2'de gerçek veriyle değiştirilecek
const METRICS = [
  { label: "TOPLAM ÜYE",      value: "24.892", change: "↑ 12.5%", sub: "Geçen aya göre",  color: "#0EA5E9", bg: "rgba(14,165,233,0.12)", icon: "👥" },
  { label: "BUGÜNKÜ SORGU",   value: "5.421",  change: "↑ 18.7%", sub: "Dün'e göre",       color: "#22D3EE", bg: "rgba(34,211,238,0.12)", icon: "📡" },
  { label: "RİSKLİ URL",      value: "1.248",  change: "↑ 7.3%",  sub: "Toplam tespit",    color: "#EF4444", bg: "rgba(239,68,68,0.12)",  icon: "⚠️" },
  { label: "GELEN İHBAR",     value: "63",     change: "↑ 31.4%", sub: "Son 24 saat",      color: "#A855F7", bg: "rgba(168,85,247,0.12)", icon: "🚨" },
  { label: "HABER SAYISI",    value: "127",    change: "↑ 9.8%",  sub: "Toplam haber",     color: "#22C55E", bg: "rgba(34,197,94,0.12)",  icon: "📄" },
  { label: "SİSTEM DURUMU",   value: "AKTİF", change: "",         sub: "Tüm sistemler",    color: "#0EA5E9", bg: "rgba(14,165,233,0.12)", icon: "🖥️", isStatus: true as const },
];

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
  { id: 1, query: "http://sahte-site.com",     type: "URL",     result: "RİSKLİ",  date: "21.05.2025 14:32" },
  { id: 2, query: "info@dolandirici.com",      type: "E-POSTA", result: "RİSKLİ",  date: "21.05.2025 14:28" },
  { id: 3, query: "+90 555 123 45 67",         type: "TELEFON", result: "ŞÜPHELİ", date: "21.05.2025 14:21" },
  { id: 4, query: "www.guvenli-site.com",      type: "URL",     result: "GÜVENLİ", date: "21.05.2025 14:15" },
  { id: 5, query: "destek@sirket.com",         type: "E-POSTA", result: "GÜVENLİ", date: "21.05.2025 14:10" },
];

// PLACEHOLDER - Faz 2'de gerçek ihbar sistemiyle değiştirilecek
const RECENT_ALERTS = [
  { title: "Sahte yatırım sitesi",           cat: "Finans / Dolandırıcılık",     time: "14:30" },
  { title: "Kimlik avı (phishing) e-postası", cat: "Phishing",                   time: "14:18" },
  { title: "Sahte ürün satışı",              cat: "E-Ticaret / Dolandırıcılık",  time: "13:55" },
  { title: "Şüpheli telefon araması",        cat: "Telefon Dolandırıcılığı",     time: "13:42" },
  { title: "Sahte kurum sitesi",             cat: "Resmi Kurum Taklidi",         time: "13:20" },
];

// PLACEHOLDER - Faz 2'de gerçek aksiyonlarla değiştirilecek
const QUICK_ACTIONS = [
  { label: "Yeni Haber",      icon: "📰", color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  { label: "Rehber Ekle",     icon: "📘", color: "#22C55E", bg: "rgba(34,197,94,0.15)"  },
  { label: "Duyuru Yayınla",  icon: "📢", color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  { label: "Kullanıcı Ekle",  icon: "👤", color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  { label: "Sistem Logları",  icon: "📊", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  { label: "Ayarlar",         icon: "⚙️", color: "#94A3B8", bg: "rgba(148,163,184,0.15)"},
];

// PLACEHOLDER - Faz 2'de gerçek menü/router sistemiyle değiştirilecek
const NAV_GENERAL = [
  { label: "Dashboard",       icon: "🏠", active: true  },
  { label: "Kullanıcılar",    icon: "👥"                },
  { label: "Sorgu Kayıtları", icon: "📋"                },
  { label: "Haberler",        icon: "📰"                },
  { label: "Rehberler",       icon: "📘"                },
  { label: "Bilinçlendirme",  icon: "🛡️"               },
  { label: "İhbarlar",        icon: "🔔", badge: 12     },
];
const NAV_SYSTEM = [
  { label: "Sistem Logları",  icon: "📊" },
  { label: "Ayarlar",         icon: "⚙️" },
  { label: "Yetki Yönetimi",  icon: "🔐" },
  { label: "Yedeklemeler",    icon: "☁️" },
];

// ── BADGE YARDIMCILAR ─────────────────────────────────────────────────────────

function resultStyle(r: string) {
  if (r === "RİSKLİ")  return { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", border: "rgba(239,68,68,0.4)"  };
  if (r === "ŞÜPHELİ") return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.4)" };
  return                       { bg: "rgba(34,197,94,0.15)",  color: "#22C55E", border: "rgba(34,197,94,0.4)"  };
}
function typeStyle(t: string) {
  if (t === "URL")     return { bg: "rgba(14,165,233,0.15)",  color: "#38BDF8" };
  if (t === "E-POSTA") return { bg: "rgba(168,85,247,0.15)", color: "#A855F7" };
  return                      { bg: "rgba(34,197,94,0.15)",   color: "#22C55E" };
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
              <text x={pad.l - 4} y={y + 4} fill="#64748B" fontSize="9" textAnchor="end">{v >= 1000 ? `${v/1000}K` : v}</text>
            </g>
          );
        })}
        {CHART_DATA.map((d, i) => (
          <text key={i} x={xs[i]} y={H - 4} fill="#64748B" fontSize="9" textAnchor="middle">{d.day}</text>
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

// ── ANA SAYFA ─────────────────────────────────────────────────────────────────

export default function YeniTasarimPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden text-slate-100"
      style={{ background: "#020617", fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >
      {/* Arka plan grid dokusu */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(14,165,233,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambiyans glow */}
      <div className="pointer-events-none fixed z-0"
        style={{ top:"20%", left:"30%", width:600, height:600, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(14,165,233,0.06) 0%,transparent 70%)" }}
      />

      {/* ── SIDEBAR ── */}
      <aside
        className="relative z-10 flex h-screen shrink-0 flex-col overflow-hidden transition-all duration-300"
        style={{
          width: sidebarOpen ? 240 : 0,
          minWidth: sidebarOpen ? 240 : 0,
          background: "rgba(5,11,30,0.98)",
          borderRight: "1px solid rgba(56,189,248,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b px-4 py-5"
          style={{ borderColor:"rgba(56,189,248,0.1)" }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ background:"linear-gradient(135deg,#0284C7,#0EA5E9)", boxShadow:"0 0 12px rgba(14,165,233,0.4)" }}>
            🔍
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest text-slate-100">DİJİTAL İZ AVCISI</div>
            <div className="text-[9px] font-semibold tracking-[2px]" style={{ color:"#0EA5E9" }}>OPERASYON MERKEZİ</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3" style={{ scrollbarWidth:"none" }}>
          <div className="mb-1 px-2 pt-1 text-[9px] font-bold tracking-[2px] text-slate-600">GENEL</div>
          {NAV_GENERAL.map((item, i) => (
            <div key={i} className="mb-0.5 flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-all"
              style={item.active ? {
                background:"linear-gradient(90deg,rgba(14,165,233,0.25),rgba(14,165,233,0.08))",
                border:"1px solid rgba(14,165,233,0.35)",
                boxShadow:"0 0 8px rgba(14,165,233,0.15)",
                color:"#38BDF8", fontWeight:600,
              } : {
                border:"1px solid transparent", color:"#94A3B8",
              }}>
              <span
                className="w-6 text-center"
                style={{
                  fontSize: 20,
                  filter: item.active ? "drop-shadow(0 0 6px rgba(14,165,233,0.8))" : "none",
                }}
              >{item.icon}</span>
              <span>{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="ml-auto rounded-full px-1.5 py-0 text-[10px] font-bold text-white"
                  style={{ background:"#EF4444", minWidth:18, textAlign:"center" }}>
                  {item.badge} {/* PLACEHOLDER - Faz 2'de gerçek sayı */}
                </span>
              )}
            </div>
          ))}
          <div className="mb-1 mt-3 px-2 text-[9px] font-bold tracking-[2px] text-slate-600">SİSTEM</div>
          {NAV_SYSTEM.map((item, i) => (
            <div key={i} className="mb-0.5 flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-400 transition-all hover:text-slate-200">
              <span className="w-6 text-center" style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Admin card */}
        <div className="m-2.5 flex items-center gap-2.5 rounded-xl p-3"
          style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.15)" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
            style={{ background:"linear-gradient(135deg,#0EA5E9,#0284C7)", border:"2px solid rgba(14,165,233,0.4)" }}>
            👤
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Pro Admin</div> {/* PLACEHOLDER */}
            <div className="text-[11px] text-slate-500">Sistem Yöneticisi</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background:"#22C55E", boxShadow:"0 0 6px #22C55E" }}/>
              <span className="text-[10px]" style={{ color:"#22C55E" }}>Çevrimiçi</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── ANA ALAN ── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 px-5"
          style={{ background:"rgba(5,11,30,0.95)", borderBottom:"1px solid rgba(56,189,248,0.12)" }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="text-lg text-slate-400 hover:text-white">☰</button>
          <div className="flex h-9 max-w-sm flex-1 items-center gap-2 rounded-lg px-3"
            style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.2)" }}>
            <span className="text-sm text-slate-500">🔍</span>
            <input className="flex-1 bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-600"
              placeholder="Hızlı arama yap..." readOnly/>
          </div>
          <div className="flex-1"/>
          {/* Bildirim/mesaj ikonları */}
          {[
            { icon: "🔔", badge: 8 },   // PLACEHOLDER
            { icon: "✉️", badge: 4 },   // PLACEHOLDER
          ].map((btn, i) => (
            <div key={i} className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base"
              style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.15)" }}>
              {btn.icon}
              <span className="absolute -right-1 -top-1 rounded-full px-1 text-[9px] font-bold text-white"
                style={{ background:"#EF4444", minWidth:14, textAlign:"center" }}>{btn.badge}</span>
            </div>
          ))}
          <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base"
            style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.15)" }}>⛶</div>
          <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base"
            style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.15)" }}>☀️</div>
          {/* Profil */}
          <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1"
            style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.15)" }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
              style={{ background:"linear-gradient(135deg,#0EA5E9,#0284C7)" }}>👤</div>
            <div>
              <div className="text-xs font-bold">Pro Admin</div> {/* PLACEHOLDER */}
              <div className="text-[10px] text-slate-500">Sistem Yöneticisi</div>
            </div>
            <div className="h-2 w-2 rounded-full" style={{ background:"#22C55E", boxShadow:"0 0 6px #22C55E" }}/>
          </div>
        </header>

        {/* İçerik */}
        <main className="flex-1 overflow-y-auto px-5 py-5"
          style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(14,165,233,0.2) transparent" }}>

          {/* Başlık */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-slate-100">Hoş geldin, Pro Admin 👋</h1> {/* PLACEHOLDER */}
            <p className="mt-1 text-sm text-slate-500">Dijital İz Avcısı Operasyon Merkezi</p>
          </div>

          {/* 6 METRİK KARTI */}
          <div className="mb-4 grid grid-cols-6 gap-2.5">
            {METRICS.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-2xl p-3.5 backdrop-blur-md"
                style={{
                  background:"rgba(8,20,45,0.82)",
                  border:`1px solid ${m.color}30`,
                  boxShadow:`0 0 12px ${m.color}10`,
                }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-lg"
                  style={{
                    background:m.bg,
                    border:`1px solid ${m.color}50`,
                    boxShadow:`0 0 24px ${m.color}59, inset 0 0 12px ${m.color}26`,
                  }}>
                  <span style={{ filter:`drop-shadow(0 0 6px ${m.color}99)` }}>{m.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-semibold tracking-wide text-slate-500">{m.label}</div>
                  <div className="text-lg font-extrabold leading-tight"
                    style={{ color: m.isStatus ? "#22C55E" : "#F8FAFC", fontSize: m.isStatus ? 15 : undefined }}>
                    {m.value} {/* PLACEHOLDER */}
                  </div>
                  {m.isStatus ? (
                    <div className="flex items-center gap-1 text-[10px]" style={{ color:"#22C55E" }}>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background:"#22C55E" }}/>
                      {m.sub}
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] font-semibold" style={{ color:m.color }}>{m.change}</div> {/* PLACEHOLDER */}
                      <div className="text-[10px] text-slate-500">{m.sub}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ORTA SATIR: Grafik | Harita | Sistem Durumu */}
          <div className="mb-4 grid gap-2.5" style={{ gridTemplateColumns:"1fr 0.65fr 0.45fr" }}>

            {/* Grafik */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold tracking-wide text-slate-100">
                  SORGU İSTATİSTİKLERİ <span className="text-slate-500">ⓘ</span>
                </div>
                <div className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] text-slate-400"
                  style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.2)" }}>
                  Son 7 Gün ▾ {/* PLACEHOLDER */}
                </div>
              </div>
              <LineChart /> {/* PLACEHOLDER - Faz 2'de gerçek veriyle */}
            </div>

            {/* Tehdit haritası — PLACEHOLDER */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold tracking-wide text-slate-100">TEHDİT HARİTASI</div>
                <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-slate-400"
                  style={{ background:"rgba(8,20,45,0.8)", border:"1px solid rgba(56,189,248,0.2)" }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background:"#22C55E" }}/>Canlı ▾
                </div>
              </div>
              {/* PLACEHOLDER - Faz 2'de gerçek tehdit haritasıyla değiştirilecek */}
              <div className="flex h-44 items-center justify-center rounded-lg"
                style={{ background:"rgba(2,6,23,0.6)", border:"1px dashed rgba(56,189,248,0.2)" }}>
                <div className="text-center">
                  <div className="text-2xl">🗺️</div>
                  <div className="mt-2 text-xs text-slate-500">Tehdit Haritası</div>
                  <div className="text-[10px] text-slate-600">Yakında aktif olacak</div>
                </div>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400">
                {[["#0EA5E9","Düşük Risk"],["#F59E0B","Orta Risk"],["#EF4444","Yüksek Risk"]].map(([c,l],i)=>(
                  <div key={i} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ background:c }}/>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Sistem durumu */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">SİSTEM DURUMU</div>
              {SYSTEM_STATUS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: i < SYSTEM_STATUS.length-1 ? "1px solid rgba(56,189,248,0.07)" : "none" }}>
                  <span className="text-sm">{s.icon}</span>
                  <span className="flex-1 text-xs text-slate-300">{s.name}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background:"#22C55E", boxShadow:"0 0 4px #22C55E" }}/>
                    <span className="text-[11px] font-semibold" style={{ color:"#22C55E" }}>Aktif</span> {/* PLACEHOLDER */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALT SATIR: Sorgular | İhbarlar | Hızlı İşlemler */}
          <div className="mb-4 grid gap-2.5" style={{ gridTemplateColumns:"1fr 0.75fr 0.55fr" }}>

            {/* Son sorgular */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">SON SORGULAR</div>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    {["#","SORGULANAN","TÜR","SONUÇ","TARİH"].map(h => (
                      <th key={h} className="pb-2 text-[9px] font-bold tracking-widest text-slate-600"
                        style={{ borderBottom:"1px solid rgba(56,189,248,0.1)", paddingRight:6, paddingLeft:4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_QUERIES.map((q, i) => { // PLACEHOLDER - Faz 2'de gerçek veri
                    const rc = resultStyle(q.result);
                    const tc = typeStyle(q.type);
                    return (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(56,189,248,0.06)" }}>
                        <td className="py-1.5 pl-1 text-[11px] text-slate-500">{q.id}</td>
                        <td className="max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pr-2 text-[11px] text-slate-300">{q.query}</td>
                        <td className="py-1.5 pr-1">
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                            style={{ background:tc.bg, color:tc.color }}>{q.type}</span>
                        </td>
                        <td className="py-1.5 pr-1">
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
                            style={{ background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>{q.result}</span>
                        </td>
                        <td className="whitespace-nowrap py-1.5 text-[10px] text-slate-500">{q.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3 cursor-pointer text-center text-xs" style={{ color:"#0EA5E9" }}>
                Tüm sorguları görüntüle → {/* PLACEHOLDER */}
              </div>
            </div>

            {/* Son ihbarlar */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold tracking-wide text-slate-100">SON İHBARLAR</div>
                <span className="cursor-pointer text-[11px]" style={{ color:"#0EA5E9" }}>Tümünü Gör</span>
              </div>
              {RECENT_ALERTS.map((a, i) => ( // PLACEHOLDER - Faz 2'de gerçek ihbar verisi
                <div key={i} className="flex items-center gap-2.5 py-2"
                  style={{ borderBottom: i < RECENT_ALERTS.length-1 ? "1px solid rgba(56,189,248,0.07)" : "none" }}>
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background:"#EF4444", boxShadow:"0 0 6px #EF4444" }}/>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-300">{a.title}</div>
                    <div className="text-[10px] text-slate-500">{a.cat}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-slate-500">{a.time}</div>
                </div>
              ))}
              <div className="mt-3 cursor-pointer text-center text-xs" style={{ color:"#0EA5E9" }}>
                Tüm ihbarları görüntüle → {/* PLACEHOLDER */}
              </div>
            </div>

            {/* Hızlı işlemler */}
            <div className="rounded-2xl p-4 backdrop-blur-md"
              style={{ background:"rgba(8,20,45,0.82)", border:"1px solid rgba(56,189,248,0.18)" }}>
              <div className="mb-3 text-xs font-bold tracking-wide text-slate-100">HIZLI İŞLEMLER</div>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_ACTIONS.map((a, i) => (
                  <div key={i} className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:opacity-90"
                    style={{
                      background:a.bg,
                      border:`1px solid ${a.color}4D`,
                      boxShadow:`0 0 16px ${a.color}26`,
                    }}>
                    <span style={{ fontSize:22, filter:`drop-shadow(0 0 6px ${a.color}99)` }}>{a.icon}</span>
                    <span className="text-center text-[9px] font-semibold leading-tight text-slate-300">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3.5 text-[11px] text-slate-500"
            style={{ borderColor:"rgba(56,189,248,0.1)" }}>
            <span>Dijital İz Avcısı © 2025 | Tüm hakları saklıdır.</span>
            <div className="flex items-center gap-2 font-semibold tracking-widest text-slate-400">
              <span>🛡️</span><span>SİBER GÜVENLİK BİLİNÇ PLATFORMU</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color:"#22C55E" }}>
              <span>🔒</span>
              <span>v2.5.0 | Güvenli Bağlantı</span> {/* PLACEHOLDER */}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
