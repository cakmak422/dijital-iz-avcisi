import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <CyberPageShell className="auth-reference-page" variant="auth">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Kayit Ol" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <AuthReferenceHero />

      <section id="kayit-formu" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <RegisterForm />
        </div>
      </section>
    </CyberPageShell>
  );
}

function AuthReferenceHero() {
  return (
    <section className="auth-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            Uyelik
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            E-posta dogrulamali kayit.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Dogrulama kodu canli sistemde yalnizca e-posta uzerinden iletilir; hassas bilgiler arayuzde gosterilmez.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="#kayit-formu">
              Kayit Formuna Git
            </Link>
            <Link className="btn-secondary min-h-11 px-5" href="/giris-yap">
              Giris Yap
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
