"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, loginDemoUser } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!identifier.trim() || !password) {
      setError("E-posta/kullanici adi ve sifre alanlarini doldurun.");
      return;
    }

    const user = loginDemoUser(identifier, password);
    if (!user) {
      setError("Giris bilgileri eslesmedi veya e-posta dogrulamasi tamamlanmamis.");
      return;
    }

    const targetPath = user.role === "admin" ? "/admin" : "/kullanici-paneli";
    setSuccess(user.role === "admin" ? "Admin girisi basarili. Admin paneline yonlendiriliyorsunuz." : "Giris basarili. Kullanici paneline yonlendiriliyorsunuz.");
    window.setTimeout(() => router.push(targetPath), 650);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Giris Yap</p>
          <h2 className="mt-2 text-2xl font-bold">Hesabiniza giris yapin.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Kayit olurken e-posta dogrulamasini tamamlayan kullanicilar demo oturum acabilir.
          </p>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          E-posta veya kullanici adi
          <input
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Sifre
          <input
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
        {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{success}</p> : null}

        <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" type="submit">
          Giris Yap
        </button>
      </form>

      <aside className="grid h-fit gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h3 className="font-bold">Demo hesap bilgisi</h3>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Yeni kayit olusturup OTP kodunu dogruladiginizda ayni e-posta/kullanici adi ve sifreyle giris yapabilirsiniz.
        </p>
        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
          <p className="font-semibold">Hazir demo kullanici</p>
          <p className="mt-1">demo@dijitalizavcisi.com</p>
          <p>Sifre: Demo12345</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          <p className="font-semibold">Demo admin</p>
          <p className="mt-1">{DEMO_ADMIN_EMAIL}</p>
          <p>Sifre: {DEMO_ADMIN_PASSWORD}</p>
        </div>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10" href="/kayit-ol">
          Yeni hesap olustur
        </Link>
      </aside>
    </section>
  );
}
