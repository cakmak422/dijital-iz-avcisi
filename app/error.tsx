"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata izleme servisi entegrasyonu için yer tutucu
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-400">Bir sorun oluştu</p>
      <h1 className="mt-4 text-3xl font-bold">Sayfa yüklenirken hata oluştu.</h1>
      <p className="mt-4 max-w-md text-slate-400">
        Geçici bir teknik sorun yaşandı. Lütfen sayfayı yenilemeyi deneyin.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-600">Hata kodu: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          className="inline-flex min-h-10 items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 px-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/25"
          onClick={reset}
          type="button"
        >
          Yeniden dene
        </button>
        <a
          className="inline-flex min-h-10 items-center rounded-md border border-slate-600 px-5 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
          href="/"
        >
          Ana sayfaya dön
        </a>
      </div>
    </div>
  );
}
