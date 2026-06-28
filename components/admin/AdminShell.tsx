"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { getCurrentDemoUser } from "@/lib/auth";
import type { User } from "@/lib/users";

// Sidebar öğe tanımları — route olan öğeler Link, olmayanlar disabled div olarak render edilir
type NavItem =
  | { label: string; icon: string; id: string; href: string; badge?: never; disabled?: never }
  | { label: string; icon: string; id: string; href?: never; badge?: number; disabled: true };

const NAV_GENERAL: NavItem[] = [
  { label: "Dashboard",        icon: "🏠", id: "dashboard",      href: "/ops-console" },
  { label: "Kullanıcılar",     icon: "👥", id: "users",          href: "/ops-console/uyeler" },
  { label: "İçerik CMS",       icon: "✏️", id: "content",        href: "/ops-console/content" },
  { label: "Mesajlar",         icon: "✉️", id: "messages",       href: "/ops-console/messages" },
  { label: "Siber Arşiv",      icon: "🗃️", id: "cyber-archive",  href: "/ops-console/cyber-archive" },
  { label: "Haberler",         icon: "📰", id: "haberler",       href: "/ops-console/haberler" },
  { label: "Bilinçlendirme",   icon: "🛡️", id: "awareness",      href: "/ops-console/page-management" },
  { label: "Rehberler",        icon: "📘", id: "guides",         disabled: true },
  { label: "İhbarlar",         icon: "🔔", id: "ihbarlar",       badge: 0, disabled: true },
];

const NAV_SYSTEM: NavItem[] = [
  { label: "Sayfa Yönetimi",   icon: "📄", id: "page-management", href: "/ops-console/page-management" },
  { label: "Site Ayarları",    icon: "⚙️", id: "site-settings",   href: "/ops-console/site-settings" },
  { label: "Sorgu Kayıtları",  icon: "📋", id: "queries",         disabled: true },
  { label: "Sistem Logları",   icon: "📊", id: "logs",            disabled: true },
  { label: "Yetki Yönetimi",   icon: "🔐", id: "roles",           disabled: true },
  { label: "Yedeklemeler",     icon: "☁️", id: "backups",         disabled: true },
];

const ACTIVE_STYLE: React.CSSProperties = {
  background: "linear-gradient(90deg,rgba(14,165,233,0.25),rgba(14,165,233,0.08))",
  border: "1px solid rgba(14,165,233,0.35)",
  boxShadow: "0 0 8px rgba(14,165,233,0.15)",
  color: "#38BDF8",
  fontWeight: 600,
};

const IDLE_STYLE: React.CSSProperties = {
  border: "1px solid transparent",
  color: "#94A3B8",
};

const DISABLED_STYLE: React.CSSProperties = {
  border: "1px solid transparent",
  color: "#475569",
  cursor: "not-allowed",
  opacity: 0.6,
};

function SidebarItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const inner = (
    <>
      <span
        className="w-6 shrink-0 text-center"
        style={{
          fontSize: 18,
          filter: isActive ? "drop-shadow(0 0 6px rgba(14,165,233,0.8))" : "none",
        }}
      >
        {item.icon}
      </span>
      <span className="flex-1 truncate text-sm">{item.label}</span>
      {item.disabled && (
        <span
          className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide"
          style={{ background: "rgba(71,85,105,0.5)", color: "#64748B" }}
        >
          Yakında
        </span>
      )}
      {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
        <span
          className="ml-auto shrink-0 rounded-full px-1.5 py-0 text-[10px] font-bold text-white"
          style={{ background: "#EF4444", minWidth: 18, textAlign: "center" }}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  const baseClass =
    "mb-0.5 flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 transition-all";

  if (item.disabled) {
    return (
      <div className={baseClass} style={DISABLED_STYLE} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={baseClass}
      style={isActive ? ACTIVE_STYLE : IDLE_STYLE}
    >
      {inner}
    </Link>
  );
}

// ── AdminShell ────────────────────────────────────────────────────────────────

export type AdminShellProps = {
  children: React.ReactNode;
  activeItem?: string; // sidebar öğesinin id'si: "dashboard", "content", "messages" vb.
};

function SidebarUserCard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentDemoUser());
  }, []);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username
    : "—";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="m-2.5 flex items-center gap-2.5 rounded-xl p-3 select-none"
      style={{ background: "rgba(8,20,45,0.8)", border: "1px solid rgba(56,189,248,0.15)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg,#0EA5E9,#0284C7)", border: "2px solid rgba(14,165,233,0.4)" }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-100">{displayName}</div>
        <div className="text-[11px] text-slate-500">Sistem Yöneticisi</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
          <span className="text-[10px]" style={{ color: "#22C55E" }}>Çevrimiçi</span>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children, activeItem }: AdminShellProps) {
  // Masaüstünde (≥1024px) açık, mobilde kapalı başlar — SSR flash yok (AdminShell client-only)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true); // masaüstünde her zaman açık
      // mobilde: ilk açılışta kapalı kalır (useState(false))
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden text-slate-100"
      style={{ background: "#020617", fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >
      {/* Arka plan grid dokusu */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,165,233,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambiyans glow */}
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: "20%",
          left: "30%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(14,165,233,0.06) 0%,transparent 70%)",
        }}
      />

      {/* ── MOBİL BACKDROP — sidebar açıkken karartma ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ──
          Masaüstü (≥1024px): statik kolon, width animasyonlu
          Mobil (<1024px): fixed overlay, translate animasyonlu, z-30
      ── */}
      <aside
        className={`flex h-screen shrink-0 flex-col overflow-hidden transition-all duration-300 ${
          isMobile
            ? "fixed left-0 top-0 z-30"
            : "relative z-10"
        }`}
        style={{
          width:     isMobile ? 240 : (sidebarOpen ? 240 : 0),
          minWidth:  isMobile ? 240 : (sidebarOpen ? 240 : 0),
          transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
          background: "rgba(5,11,30,0.98)",
          borderRight: "1px solid rgba(56,189,248,0.15)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 border-b px-4 py-4"
          style={{ borderColor: "rgba(56,189,248,0.1)" }}
        >
          <div className="relative h-9 w-24 shrink-0 overflow-hidden rounded-md">
            <Image
              alt="Dijital İz Avcısı logosu"
              src="/logo.png"
              fill
              className="object-cover object-left"
              sizes="96px"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest text-slate-100">DİJİTAL İZ AVCISI</div>
            <div
              className="text-[9px] font-semibold tracking-[2px]"
              style={{ color: "#0EA5E9" }}
            >
              OPERASYON MERKEZİ
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3" style={{ scrollbarWidth: "none" }}>
          <div className="mb-1 px-2 pt-1 text-slate-600" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
            GENEL
          </div>
          {NAV_GENERAL.map((item) => (
            <SidebarItem key={item.id} item={item} isActive={activeItem === item.id} />
          ))}

          <div className="mb-1 mt-3 px-2 text-slate-600" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
            SİSTEM
          </div>
          {NAV_SYSTEM.map((item) => (
            <SidebarItem key={item.id} item={item} isActive={activeItem === item.id} />
          ))}
        </nav>

        {/* Görsel kullanıcı bilgi kartı — tıklanamaz, salt bilgi */}
        <SidebarUserCard />
      </aside>

      {/* ── ANA ALAN ── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex h-14 shrink-0 items-center gap-3 px-5"
          style={{
            background: "rgba(5,11,30,0.95)",
            borderBottom: "1px solid rgba(56,189,248,0.12)",
          }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-lg text-slate-400 transition hover:text-white"
            aria-label="Sidebar aç/kapat"
          >
            ☰
          </button>
          <div
            className="flex h-9 max-w-sm flex-1 items-center gap-2 rounded-lg px-3"
            style={{ background: "rgba(8,20,45,0.8)", border: "1px solid rgba(56,189,248,0.2)" }}
          >
            <span className="text-sm text-slate-500">🔍</span>
            <input
              className="flex-1 bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-600"
              placeholder="Hızlı arama yap..."
              readOnly
            />
          </div>
          <div className="flex-1" />
          {/* Oturum menüsü — çıkış butonu burada */}
          <AdminSessionMenu />
        </header>

        {/* İçerik alanı */}
        <main
          className="flex-1 overflow-y-auto px-5 py-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(14,165,233,0.2) transparent" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
