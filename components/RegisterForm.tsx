"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { saveDemoUser } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeText } from "@/lib/sanitize";
import { User } from "@/lib/users";

type RegisterStep = "form" | "otp" | "done";

type RegistrationForm = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  password: string;
  passwordRepeat: string;
};

const initialForm: RegistrationForm = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  password: "",
  passwordRepeat: ""
};

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const showDemoOtp = process.env.NODE_ENV === "development";

function cleanForm(form: RegistrationForm): RegistrationForm {
  return {
    username: sanitizeText(form.username, 40),
    email: sanitizeText(form.email, 120).toLowerCase(),
    firstName: sanitizeText(form.firstName, 60),
    lastName: sanitizeText(form.lastName, 60),
    birthDate: sanitizeText(form.birthDate, 20),
    phone: sanitizeText(form.phone, 30),
    password: form.password.trim().slice(0, 128),
    passwordRepeat: form.passwordRepeat.trim().slice(0, 128)
  };
}

export function RegisterForm() {
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [step, setStep] = useState<RegisterStep>("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [resendLeft, setResendLeft] = useState(0);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0;

  useEffect(() => {
    if (step !== "otp") return;

    const timer = window.setInterval(() => {
      setResendLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step]);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const rate = checkClientRateLimit("register-form", 4, 60_000);
    if (!rate.allowed) {
      setError(`Cok fazla kayit denemesi. Lutfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const cleaned = cleanForm(form);
    setForm(cleaned);

    if (!cleaned.username || !cleaned.email || !cleaned.firstName || !cleaned.lastName || !cleaned.birthDate || !cleaned.phone || !cleaned.password) {
      setError("Lutfen tum kayit alanlarini doldurun.");
      return;
    }

    if (!isValidEmail(cleaned.email)) {
      setError("Gecerli bir e-posta adresi girin.");
      return;
    }

    if (cleaned.password.length < 8) {
      setError("Sifre en az 8 karakter olmalidir.");
      return;
    }

    if (cleaned.password !== cleaned.passwordRepeat) {
      setError("Sifre ve sifre tekrar alanlari eslesmiyor.");
      return;
    }

    await issueOtp(cleaned.email);
    setStep("otp");
  }

  async function issueOtp(email: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpCode(code);
    setExpiresAt(Date.now() + OTP_TTL_MS);
    setAttempts(0);
    setOtpInput("");
    setResendLeft(RESEND_SECONDS);
    await sendOtpEmail(email, code);
  }

  async function handleResend() {
    if (resendLeft > 0) return;
    setError("");
    await issueOtp(cleanForm(form).email);
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (Date.now() > expiresAt) {
      setError("Kod suresi doldu. Lutfen yeni kod isteyin.");
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError("En fazla 5 yanlis deneme hakki kullanildi. Lutfen kodu tekrar gonderin.");
      return;
    }

    if (otpInput !== otpCode) {
      setAttempts((value) => value + 1);
      setError(`Dogrulama kodu hatali. Kalan deneme: ${Math.max(0, MAX_ATTEMPTS - attempts - 1)}`);
      return;
    }

    const cleaned = cleanForm(form);
    const user: User = {
      id: `usr-${Date.now()}`,
      username: cleaned.username,
      email: cleaned.email,
      firstName: cleaned.firstName,
      lastName: cleaned.lastName,
      birthDate: cleaned.birthDate,
      phone: cleaned.phone,
      role: "user",
      isEmailVerified: true,
      createdAt: new Date().toLocaleDateString("tr-TR"),
      status: "active"
    };

    setCreatedUser(user);
    saveDemoUser(user, cleaned.password);
    setStep("done");
  }

  function updateField(field: keyof RegistrationForm, value: string) {
    const maxLength = field === "password" || field === "passwordRepeat" ? 128 : field === "email" ? 120 : 80;
    setForm((current) => ({ ...current, [field]: value.slice(0, maxLength) }));
  }

  if (step === "done" && createdUser) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.14em]">E-posta dogrulandi</p>
        <h2 className="mt-2 text-2xl font-bold">Uyeliginiz basariyla olusturuldu.</h2>
        <p className="mt-3 leading-7">E-posta adresiniz dogrulandi. Kullanici durumu <span className="font-bold">active</span> olarak ayarlandi.</p>
        <Link className="mt-5 inline-flex rounded-md bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700" href="/giris-yap">
          Giris Yap
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSendCode}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Kayit Ol</p>
          <h2 className="mt-2 text-2xl font-bold">E-posta dogrulamali uyelik.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Telefon numarasina SMS kodu gonderilmez. Dogrulama, kayit sirasinda girilen e-posta adresi uzerinden yapilir.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kullanici adi" value={form.username} onChange={(value) => updateField("username", value)} />
          <Field label="E-posta" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
          <Field label="Ad" value={form.firstName} onChange={(value) => updateField("firstName", value)} />
          <Field label="Soyad" value={form.lastName} onChange={(value) => updateField("lastName", value)} />
          <Field label="Dogum tarihi" type="date" value={form.birthDate} onChange={(value) => updateField("birthDate", value)} />
          <Field label="Telefon numarasi" type="tel" value={form.phone} onChange={(value) => updateField("phone", value)} />
          <Field label="Sifre" type="password" value={form.password} onChange={(value) => updateField("password", value)} />
          <Field label="Sifre tekrar" type="password" value={form.passwordRepeat} onChange={(value) => updateField("passwordRepeat", value)} />
        </div>

        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

        <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" type="submit">
          E-posta Dogrulama Kodu Gonder
        </button>
      </form>

      <aside className="grid h-fit gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div>
          <h3 className="font-bold">Dogrulama durumu</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Kod gonderildiginde kullanici demo ortaminda <span className="font-semibold">pending</span> kabul edilir. Kod dogru girilirse durum <span className="font-semibold">active</span> olur.
          </p>
        </div>

        {step === "otp" ? (
          <form className="grid gap-3" onSubmit={handleVerify}>
            {showDemoOtp ? (
              <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
                <p className="font-bold">Development OTP Kodu</p>
                <p className="mt-1 text-2xl font-bold tracking-[0.25em]">{otpCode}</p>
                <p className="mt-2 text-xs">Canli sistemde OTP kodu ekranda gosterilmez.</p>
              </div>
            ) : (
              <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100">
                E-posta dogrulama kodu gonderildi. Canli ortamda kod yalnizca e-posta kutusunda gorunur.
              </div>
            )}
            <label className="text-sm font-semibold" htmlFor="otp-code">
              E-posta adresinize gonderilen 6 haneli dogrulama kodunu girin
            </label>
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-center text-lg font-bold tracking-[0.22em] dark:border-white/10 dark:bg-slate-950"
              id="otp-code"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Kod gecerlilik suresi: {remainingSeconds} saniye. Yanlis deneme: {attempts}/{MAX_ATTEMPTS}</p>
            <button className="min-h-11 rounded-md bg-slate-900 px-4 font-semibold text-white dark:bg-white dark:text-slate-950" type="submit">
              Kodu Dogrula
            </button>
            <button className="min-h-11 rounded-md border border-slate-300 px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10" disabled={resendLeft > 0} onClick={handleResend} type="button">
              {resendLeft > 0 ? `Kodu tekrar gonder (${resendLeft})` : "Kodu tekrar gonder"}
            </button>
          </form>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            Formu doldurup e-posta dogrulama kodu gonderdiginizde OTP alani burada acilir.
          </p>
        )}
      </aside>
    </section>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
