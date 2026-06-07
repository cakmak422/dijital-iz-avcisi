"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCurrentDemoUser, logoutDemoUser } from "@/lib/auth";
import type { User } from "@/lib/users";

type AdminSessionMenuProps = {
  className?: string;
  fullWidth?: boolean;
  onLogout?: () => void;
  onNavigate?: () => void;
  user?: User | null;
};

export function AdminSessionMenu({
  className = "",
  fullWidth = false,
  onLogout,
  onNavigate,
  user: providedUser
}: AdminSessionMenuProps) {
  const [open, setOpen] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(providedUser ?? null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const user = providedUser ?? localUser;

  useEffect(() => {
    if (providedUser !== undefined) {
      setLocalUser(providedUser);
      return;
    }

    setLocalUser(getCurrentDemoUser());
  }, [providedUser]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!user || user.role !== "admin") return null;

  function handleLogout() {
    logoutDemoUser();
    setLocalUser(null);
    onLogout?.();
    window.location.assign("/giris-yap");
  }

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""} ${className}`} ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-50 shadow-sm shadow-cyan-950/20 transition hover:border-cyan-200/60 hover:bg-cyan-300/20 ${
          fullWidth ? "w-full" : ""
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md border border-cyan-200/35 bg-slate-950/70 text-xs text-cyan-100">
          A
        </span>
        <span>Admin</span>
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-50 mt-2 grid min-w-44 overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950/95 p-1 text-sm font-semibold text-slate-100 shadow-xl shadow-cyan-950/30 backdrop-blur-xl ${
            fullWidth ? "left-0 right-auto w-full" : ""
          }`}
          role="menu"
        >
          <Link
            className="rounded-md px-3 py-2 transition hover:bg-cyan-300/10 hover:text-cyan-100"
            href="/ops-console"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            role="menuitem"
          >
            Ops Console
          </Link>
          <button
            className="rounded-md px-3 py-2 text-left text-red-100 transition hover:bg-red-400/10 hover:text-red-50"
            onClick={handleLogout}
            role="menuitem"
            type="button"
          >
            Çıkış Yap
          </button>
        </div>
      ) : null}
    </div>
  );
}
