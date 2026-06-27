"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import type { DbUser } from "@/lib/userDb";
import type { UserStatus } from "@/lib/users";

const PAGE_SIZE = 20;

const statusStyles: Record<UserStatus, string> = {
  active:  "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  blocked: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default function OpsConsoleUyelerPage() {
  const [users, setUsers]   = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [page, setPage]     = useState(1);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then((d: { ok: boolean; users?: DbUser[]; error?: string }) => {
        if (d.ok && d.users) setUsers(d.users);
        else setError(d.error ?? "Kullanıcı listesi alınamadı.");
      })
      .catch(() => setError("Bağlantı hatası."))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const pageUsers  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminGate>
      <AdminShell activeItem="users">

        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Üye Yönetimi</p>
          <h1 className="mt-1 text-slate-100" style={{ fontSize: 22, fontWeight: 700 }}>Üye listesi</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Yükleniyor…" : `${users.length} kayıt — Supabase'den, tüm cihazlarda aynı liste.`}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(8,20,45,0.82)", border: "1px solid rgba(56,189,248,0.18)" }}>
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-slate-500">Yükleniyor…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-sm text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-500">
              Henüz kayıtlı kullanıcı yok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.1)" }}>
                    {["Kullanıcı Adı", "Ad Soyad", "E-posta", "Telefon", "E-posta ✓", "Rol", "Durum", "Kayıt", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-slate-400"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
                      <td className="px-4 py-3 font-semibold text-slate-100">{user.username}</td>
                      <td className="px-4 py-3 text-slate-300">{user.first_name} {user.last_name}</td>
                      <td className="px-4 py-3 text-slate-400">{user.email}</td>
                      <td className="px-4 py-3 text-slate-400">{user.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                          user.email_verified
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                        }`}>
                          {user.email_verified ? "Evet" : "Hayır"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                          user.role === "admin"
                            ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                            : "border-white/10 bg-white/5 text-slate-400"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${statusStyles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ops-console/uyeler/${user.id}`}
                          className="rounded border border-white/10 px-3 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10"
                        >
                          İncele →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "rgba(56,189,248,0.1)" }}>
              <p className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)} / {users.length} kayıt
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
