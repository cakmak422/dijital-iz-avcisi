"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentDemoUser } from "@/lib/auth";
import type { DbUser } from "@/lib/userDb";
import { dbUserToUser } from "@/lib/userDb";
import type { UserStatus } from "@/lib/users";

const statusLabels: Record<UserStatus, string> = {
  active:  "Aktif",
  pending: "Beklemede",
  blocked: "Bloke",
};
const statusStyles: Record<UserStatus, string> = {
  active:  "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  blocked: "border-red-400/30 bg-red-400/10 text-red-300",
};

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

function InfoRow({ label, value, note }: { label: string; value?: string | number | null; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-100">{value ?? "—"}</span>
      {note && <span className="text-xs leading-5 text-slate-500">{note}</span>}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser]       = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveTone, setSaveTone] = useState<"ok" | "err">("ok");
  const [saving, setSaving]   = useState(false);

  // Mevcut admin bilgisi — güvenlik kontrolleri için (localStorage'dan, admin auth değişmedi)
  const currentAdmin = typeof window !== "undefined" ? getCurrentDemoUser() : null;

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then((d: { ok: boolean; user?: DbUser; error?: string }) => {
        if (d.ok && d.user) setUser(d.user);
      })
      .catch(() => {/* bağlantı hatası — kullanıcı bulunamadı göster */})
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: UserStatus) {
    if (!user) return;

    // ── GÜVENLİK: kendi hesabını bloke edememe ──────────────────────────────
    if (currentAdmin && currentAdmin.id === user.id) {
      setSaveTone("err");
      setSaveMsg("Kendi hesabınızın durumunu bu panelden değiştiremezsiniz (kendini kilitleme riski).");
      return;
    }
    // ── GÜVENLİK: seed admin koruması ───────────────────────────────────────
    if (user.id === "demo-admin") {
      setSaveTone("err");
      setSaveMsg("Seed admin hesabı (demo-admin) bu panelden değiştirilemez.");
      return;
    }

    setSaving(true);
    setSaveMsg("");
    try {
      const res  = await fetch(`/api/admin/users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        setUser(prev => prev ? { ...prev, status: newStatus } : prev);
        setSaveTone("ok");
        setSaveMsg(`Durum "${statusLabels[newStatus]}" olarak güncellendi.`);
      } else {
        setSaveTone("err");
        setSaveMsg(data.error ?? "Durum güncellenemedi.");
      }
    } catch {
      setSaveTone("err");
      setSaveMsg("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const isSeedAdmin = user?.id === "demo-admin";
  const isSelf      = currentAdmin?.id === user?.id;

  return (
    <AdminGate>
      <AdminShell activeItem="users">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <p className="text-slate-400">Yükleniyor…</p>
          ) : !user ? (
            <p className="text-slate-400">Kullanıcı bulunamadı.</p>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Üye Detayı</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-100">{user.username}</h1>
                <p className="mt-1 text-sm text-slate-500">{user.id}</p>
              </div>

              {/* Kişisel bilgiler */}
              <article className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-3 text-base font-bold text-slate-100">Kişisel Bilgiler</h2>
                <InfoRow label="Ad Soyad"          value={`${user.first_name} ${user.last_name}`} />
                <InfoRow label="E-posta"            value={user.email} />
                <InfoRow label="Kullanıcı Adı"      value={user.username} />
                <InfoRow label="Telefon"            value={user.phone || "—"} />
                <InfoRow label="Doğum Tarihi"       value={user.birth_date || "—"} />
                <InfoRow label="E-posta Doğrulandı" value={user.email_verified ? "Evet ✓" : "Hayır"} />
                <InfoRow
                  label="Rol"
                  value={user.role}
                  note="Bu alan şu an sadece görüntüleme amaçlıdır. Gerçek admin yetkisi ayrı bir sunucu doğrulaması (ADMIN_PASSPHRASE_HASH) gerektirir ve bu arayüzden verilememez."
                />
              </article>

              {/* Oturum bilgileri */}
              <article className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-3 text-base font-bold text-slate-100">Oturum ve Giriş Bilgileri</h2>
                <InfoRow label="Kayıt Tarihi/Saati" value={formatDateTime(user.created_at)} />
                <InfoRow label="Son Giriş"          value={formatDateTime(user.last_login_at)} />
                <InfoRow label="Giriş Sayısı"       value={user.login_count ?? 0} />
                <InfoRow
                  label="Son Bilinen IP"
                  value={user.last_known_ip ?? "—"}
                  note="IP bilgisi sunucu/hosting yapılandırmasına bağlıdır, kesin doğrulanmış kimlik bilgisi değildir."
                />
              </article>

              {/* Durum değiştirme */}
              <article className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-1 text-base font-bold text-slate-100">Hesap Durumu</h2>
                <p className="mb-4 text-sm text-slate-400">
                  Mevcut durum:{" "}
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${statusStyles[user.status]}`}>
                    {statusLabels[user.status]}
                  </span>
                </p>

                {/* Güvenlik uyarıları — korumaları AYNEN korudum */}
                {(isSeedAdmin || isSelf) && (
                  <div className="mb-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">
                    {isSelf
                      ? "Kendi hesabınızın durumunu bu panelden değiştiremezsiniz (kendini kilitleme riski)."
                      : "Seed admin hesabı (demo-admin) bu panelden değiştirilemez."}
                  </div>
                )}

                {!isSeedAdmin && !isSelf && (
                  <div className="flex flex-wrap gap-2">
                    {(["active", "pending", "blocked"] as UserStatus[]).map(s => (
                      <button
                        key={s}
                        className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                          user.status === s
                            ? `${statusStyles[s]} cursor-default`
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                        disabled={user.status === s || saving}
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
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/30 bg-red-400/10 text-red-300"
                  }`}>
                    {saveMsg}
                  </p>
                )}
              </article>
            </>
          )}
        </div>
      </AdminShell>
    </AdminGate>
  );
}

// dbUserToUser export'u uyeler/page.tsx'te de kullanılabilmesi için yeniden export
export { dbUserToUser };
