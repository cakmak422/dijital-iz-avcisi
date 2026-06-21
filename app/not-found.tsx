import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  description: "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-400">404</p>
      <h1 className="mt-4 text-4xl font-bold">Sayfa bulunamadı.</h1>
      <p className="mt-4 max-w-md text-slate-400">
        Aradığınız sayfa mevcut değil, taşınmış veya kaldırılmış olabilir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 px-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/25"
          href="/"
        >
          Ana sayfaya dön
        </Link>
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-slate-600 px-5 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
          href="/sorgu-paneli"
        >
          Sorgu panelini aç
        </Link>
      </div>
    </div>
  );
}
