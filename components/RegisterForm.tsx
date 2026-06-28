"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeText } from "@/lib/sanitize";

type RegisterStep = "form" | "otp" | "done";

type RegistrationForm = {
  username:       string;
  email:          string;
  firstName:      string;
  lastName:       string;
  birthDate:      string;
  phone:          string;
  password:       string;
  passwordRepeat: string;
};

const initialForm: RegistrationForm = {
  username: "", email: "", firstName: "", lastName: "",
  birthDate: "", phone: "", password: "", passwordRepeat: ""
};

const RESEND_SECONDS = 60;

function cleanForm(form: RegistrationForm): RegistrationForm {
  return {
    username:       sanitizeText(form.username, 40),
    email:          sanitizeText(form.email, 120).toLowerCase(),
    firstName:      sanitizeText(form.firstName, 60),
    lastName:       sanitizeText(form.lastName, 60),
    birthDate:      sanitizeText(form.birthDate, 20),
    phone:          sanitizeText(form.phone, 30),
    password:       form.password.trim().slice(0, 128),
    passwordRepeat: form.passwordRepeat.trim().slice(0, 128),
  };
}

export function RegisterForm() {
  const [form, setForm]           = useState<RegistrationForm>(initialForm);
  const [step, setStep]           = useState<RegisterStep>("form");
  const [otpInput, setOtpInput]   = useState("");
  const [resendLeft, setResendLeft] = useState(0);
  const [verifying, setVerifying]     = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (step !== "otp") return;
    const timer = window.setInterval(() => {
      setResendLeft(v => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  // ── Adım 1: form submit → kodu gönder ──────────────────────────────────────

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const rate = checkClientRateLimit("register-form", 4, 60_000);
    if (!rate.allowed) {
      setError(`Çok fazla kayıt denemesi. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const cleaned = cleanForm(form);
    setForm(cleaned);

    if (!cleaned.username || !cleaned.email || !cleaned.firstName || !cleaned.lastName || !cleaned.birthDate || !cleaned.phone || !cleaned.password) {
      setError("Lütfen tüm kayıt alanlarını doldurun.");
      return;
    }
    if (!isValidEmail(cleaned.email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (cleaned.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (cleaned.password !== cleaned.passwordRepeat) {
      setError("Şifre ve Şifre tekrar alanları eşleşmiyor.");
      return;
    }
    if (!consentGiven) {
      setError("Devam etmek için KVKK metnini okuduğunuzu onaylamanız gerekiyor.");
      return;
    }

    await sendOtp(cleaned.email);
  }

  async function sendOtp(email: string) {
    // Kodu artık sunucu üretiyor — client sadece e-posta gönderir
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Doğrulama kodu gönderilemedi.");
        return;
      }
      setOtpInput("");
      setResendLeft(RESEND_SECONDS);
      setStep("otp");
    } catch {
      setError("Doğrulama kodu gönderilemedi: Bağlantı hatası.");
    }
  }

  async function handleResend() {
    if (resendLeft > 0) return;
    setError("");
    await sendOtp(cleanForm(form).email);
  }

  // ── Adım 2: OTP girişi → kayıt tamamla (Faz 3'te /api/auth/register'a bağlanacak) ──

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (otpInput.length !== 6) {
      setError("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }

    setVerifying(true);
    try {
      const cleaned = cleanForm(form);
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:        cleaned.email,
          code:         otpInput,
          username:     cleaned.username,
          firstName:    cleaned.firstName,
          lastName:     cleaned.lastName,
          birthDate:    cleaned.birthDate,
          phone:        cleaned.phone,
          password:     cleaned.password,
          consentGiven: true, // OTP adımına ulaşıldıysa form adımında onaylandı
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Kayıt tamamlanamadı.");
        return;
      }
      setStep("done");
    } catch {
      setError("Kayıt tamamlanamadı: Bağlantı hatası.");
    } finally {
      setVerifying(false);
    }
  }

  function updateField(field: keyof RegistrationForm, value: string) {
    const maxLen = field === "password" || field === "passwordRepeat" ? 128 : field === "email" ? 120 : 80;
    setForm(cur => ({ ...cur, [field]: value.slice(0, maxLen) }));
  }

  // ── Tamamlandı ekranı ────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.14em]">E-posta doğrulandı</p>
        <h2 className="mt-2 text-2xl font-bold">Üyeliğiniz başarıyla oluşturuldu.</h2>
        <p className="mt-3 leading-7">E-posta adresiniz doğrulandı. Hesabınız aktif.</p>
        <Link className="mt-5 inline-flex rounded-md bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700" href="/giris-yap">
          Giriş Yap
        </Link>
      </section>
    );
  }

  // ── Kayıt formu ──────────────────────────────────────────────────────────────

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSendCode}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Kayıt Ol</p>
          <h2 className="mt-2 text-2xl font-bold">E-posta doğrulamalı üyelik.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Telefon numarasına SMS kodu gönderilmez. Doğrulama, kayıt sırasında girilen e-posta adresi üzerinden yapılır.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kullanıcı adı"    value={form.username}       onChange={v => updateField("username", v)} />
          <Field label="E-posta" type="email" value={form.email}      onChange={v => updateField("email", v)} />
          <Field label="Ad"                value={form.firstName}      onChange={v => updateField("firstName", v)} />
          <Field label="Soyad"             value={form.lastName}       onChange={v => updateField("lastName", v)} />
          <Field label="Doğum tarihi" type="date" value={form.birthDate} onChange={v => updateField("birthDate", v)} />
          <Field label="Telefon numarası" type="tel" value={form.phone} onChange={v => updateField("phone", v)} />
          <Field label="Şifre" type="password"      value={form.password}       onChange={v => updateField("password", v)} />
          <Field label="Şifre tekrar" type="password" value={form.passwordRepeat} onChange={v => updateField("passwordRepeat", v)} />
        </div>

        {/* KVKK onay kutusu */}
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={e => setConsentGiven(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cyan-600"
          />
          <span className="text-sm leading-5 text-slate-700 dark:text-slate-300">
            <a
              href="/kvkk"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-100"
            >
              KVKK Aydınlatma ve Rıza Metni
            </a>
            &apos;ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.
          </span>
        </label>

        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

        <button
          className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
          disabled={!consentGiven}
          type="submit"
        >
          E-posta Doğrulama Kodu Gönder
        </button>
      </form>

      {/* OTP paneli */}
      <aside className="grid h-fit gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div>
          <h3 className="font-bold">Doğrulama durumu</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Kodu girdikten sonra hesabınız <span className="font-semibold">aktif</span> olarak oluşturulur.
          </p>
        </div>

        {step === "otp" ? (
          <form className="grid gap-3" onSubmit={handleVerify}>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
              E-posta doğrulama kodu gönderildi. Gelen kutunuzu kontrol edin.
            </div>

            <label className="text-sm font-semibold" htmlFor="otp-code">
              6 haneli doğrulama kodunu girin
            </label>
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-center text-lg font-bold tracking-[0.22em] dark:border-white/10 dark:bg-slate-950"
              id="otp-code"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />

            {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

            <button
              className="min-h-11 rounded-md bg-slate-900 px-4 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
              disabled={verifying}
              type="submit"
            >
              {verifying ? "Doğrulanıyor…" : "Kodu Doğrula ve Kayıt Ol"}
            </button>

            <button
              className="min-h-11 rounded-md border border-slate-300 px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10"
              disabled={resendLeft > 0}
              onClick={handleResend}
              type="button"
            >
              {resendLeft > 0 ? `Kodu tekrar gönder (${resendLeft})` : "Kodu tekrar gönder"}
            </button>
          </form>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            Formu doldurup kodu gönderdikten sonra OTP alanı burada açılır.
          </p>
        )}
      </aside>
    </section>
  );
}

function Field({
  label, onChange, type = "text", value
}: {
  label: string; onChange: (v: string) => void; type?: string; value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
