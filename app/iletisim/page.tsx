import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Şüpheli link, sahte SMS bildirimi, iş birliği ve öneri için Dijital İz Avcısı iletişim formu.",
  alternates: { canonical: "/iletisim" },
  openGraph: { title: "İletişim | Dijital İz Avcısı", description: "Güvenli iletişim merkezi.", url: "/iletisim" }
};
import { ContactInfoCard } from "@/components/ContactInfoCard";
import { CyberPageShell } from "@/components/CyberPageShell";
import { EditableContent } from "@/components/admin/content/EditableContent";
import { SiteFooter } from "@/components/SiteFooter";

export default function ContactPage() {
  return (
    <CyberPageShell className="contact-reference-page" variant="contact">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="İletişim" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <ContactReferenceHero />

      <section id="iletisim-formu" className="cyber-pattern-radar px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5">
          <ContactInfoCard />
          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}

function ContactReferenceHero() {
  return (
    <section className="contact-reference-hero relative overflow-hidden border-b border-cyan-300/15 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
            İletişim
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            <EditableContent as="span" contentKey="contact.page.title" />
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            <EditableContent as="span" contentKey="contact.page.description" />
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-11 px-5" href="#iletisim-formu">
              Mesaj Gönder
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
