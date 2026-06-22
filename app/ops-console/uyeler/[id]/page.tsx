"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import {
  getCurrentDemoUser,
  getDemoUsers,
  saveDemoUser
} from "@/lib/auth";
import type { User, UserStatus } from "@/lib/users";

const statusLabels: Record<UserStatus, string> = {
  active:  "Aktif",
  pending: "Beklemede",
  blocked: "Bloke"
};
const statusStyles: Record<UserStatus, string> = {
  active:  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  blocked: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
};

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({ label, value, note }: { label: string; value?: string | number; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 dark:border-white/5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{value ?? "—"}</span>
      {note && <span className="text-xs leading-5 text-slate-400 dark:text-slate-500">{note}</span>}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser]           = useState<User | null>(null);
  const [password, setPassword]   = useState(""); // DemoAuthRecord.password placeholder
  const [saveMsg, setSaveMsg]     = useState("");
  const [saveTone, setSaveTone]   = useState<"ok" | "err">("ok");
  const currentAdmin              = typeof window !== "undefined" ? getCurrentDemoUser() : null;

  useEffect(() => {
    const records = getDemoUsers();
    const record  = records.find((r) => r.user.id === id);
    if (record) {
      setUser(record.user);
      setPassword(record.password);
    }
  }, [id]);

  function updateStatus(newStatus: UserStatus) {
    if (!user) return;

    // Güvenlik: kendi hesabını devre dışı bırakma
    if (currentAdmin && currentAdmin.id === user.id) {
      setSaveTone("err");
      setSaveMsg("Kendi hesabınızın durumunu bu panelden değiştiremezsiniz (kendini kilitleme riski).");
      return;
    }
    // Güvenlik: seed admin koruması
    if (user.id === "demo-admin") {
      setSaveTone("err");
      setSaveMsg("Seed admin hesabı (demo-admin) bu panelden değiştirilemez.");
      return;
    }

    const updated: User = { ...user, status: newStatus };
    saveDemoUser(updated, password);
    setUser(updated);
    setSaveTone("ok");
    setSaveMsg(`Durum "${statusLabels[newStatus]}" olarak güncellendi.`);
  }

  const isSeedAdmin   = user?.id === "demo-admin";
  const isSelf        = currentAdmin?.id === user?.id;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="Üye Detayı" />
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-300/20 dark:text-cyan-200" href="/ops-console#uyeler">
              ← Üye Listesi
            </Link>
            <AdminSessionMenu />
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">

            {!user ? (
              <p className="text-slate-500">Kullanıcı bulunamadı.</p>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Üye Detayı</p>
                  <h1 className="mt-2 text-3xl font-bold">{user.username}</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.id}</p>
                </div>

                {/* Kişisel bilgiler */}
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h2 className="mb-3 text-base font-bold">Kişisel Bilgiler</h2>
                  <InfoRow label="Ad Soyad" value={`${user.firstName} ${user.lastName}`} />
                  <InfoRow label="E-posta" value={user.email} />
                  <InfoRow label="Kullanıcı Adı" value={user.username} />
                  <InfoRow label="Telefon" value={user.phone || "—"} />
                  <InfoRow label="Doğum Tarihi" value={user.birthDate || "—"} />
                  <InfoRow label="E-posta Doğrulandı" value={user.isEmailVerified ? "Evet ✓" : "Hayır"} />
                  <InfoRow label="Rol" value={user.role} note="Bu alan şu an sadece görüntüleme amaçlıdır. Gerçek admin yetkisi ayrı bir sunucu doğrulaması (ADMIN_PASSPHRASE_HASH) gerektirir ve bu arayüzden verilememez." />
                </article>

                {/* Oturum bilgileri */}
                <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h2 className="mb-3 text-base font-bold">Oturum ve Giriş Bilgileri</h2>
                  <InfoRow label="Kayıt Tarihi/Saati" value={formatDateTime(user.createdAt)} />
                  <InfoRow label="Son Giriş" value={formatDateTime(user.lastLoginAt)} />
                  <InfoRow label="Giriş Sayısı" value={user.loginCount ?? 0} />
                  <InfoRow
                    label="Son Bilinen IP"
                    value={user.lastKnownIp ?? "—"}
                    note="IP bilgisi sunucu/hosting yapılandırmasına bağlıdır, kesin doğrulanmış kimlik bilgisi değildir."
                  />
                </article>

                {/* Durum değiştirme */}
                <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h2 className="mb-1 text-base font-bold">Hesap Durumu</h2>
                  <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                    Mevcut durum:{" "}
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${statusStyles[user.status]}`}>
                      {statusLabels[user.status]}
                    </span>
                  </p>

                  {(isSeedAdmin || isSelf) && (
                    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                      {isSelf
                        ? "Kendi hesabınızın durumunu bu panelden değiştiremezsiniz (kendini kilitleme riski)."
                        : "Seed admin hesabı (demo-admin) bu panelden değiştirilemez."}
                    </div>
                  )}

                  {!isSeedAdmin && !isSelf && (
                    <div className="flex flex-wrap gap-2">
                      {(["active", "pending", "blocked"] as UserStatus[]).map((s) => (
                        <button
                          className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                            user.status === s
                              ? `${statusStyles[s]} cursor-default`
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                          disabled={user.status === s}
                          key={s}
                          onClick={() => updateStatus(s)}
                          type="button"
                        >
                          {statusLabels[s]} olarak ayarla
                        </button>
                      ))}
                    </div>
                  )}

                  {saveMsg && (
                    <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold ${
                      saveTone === "ok"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
                    }`}>
                      {saveMsg}
                    </p>
                  )}
                </article>
              </>
            )}
          </div>
        </section>
      </AdminGate>
    </main>
  );
}
