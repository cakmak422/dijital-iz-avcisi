import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Bakim Modu | Dijital Iz Avcisi",
  robots: {
    index: false,
    follow: false
  }
};

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-2xl rounded-lg border border-cyan-300/15 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/30 sm:p-8">
        <BrandLogo subtitle="Bakim modu" />
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Gecici bakim</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Dijital Iz Avcisi gecici olarak bakim modunda.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Dijital Iz Avcisi altyapi ve guvenlik gelistirmeleri nedeniyle gecici olarak bakim modundadir.
        </p>
        <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          Bu ekran bilgilendirme amaclidir. Sistem hazir oldugunda public erisim tekrar acilacaktir.
        </p>
        <Link className="mt-6 inline-flex rounded-md border border-cyan-200/25 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/10" href="/giris-yap">
          Yonetici girisi
        </Link>
      </section>
    </main>
  );
}
