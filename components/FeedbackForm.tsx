"use client";

import { FormEvent, useState } from "react";

const types = ["Şüpheli link", "Sahte SMS / oltalama", "Yeni özellik önerisi", "Hatalı analiz bildirimi"];

export function FeedbackForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Öneri ve Bildirim</p>
          <h2 className="mt-2 text-3xl font-bold">Risk sinyali bildir.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Şimdilik mock çalışır; gerçek backend bağlandığında bildirimler inceleme kuyruğuna düşecek.
          </p>
        </div>
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
          <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" defaultValue={types[0]}>
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" placeholder="Link veya kısa başlık" />
          <textarea className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950" placeholder="Kısa açıklama" />
          <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white dark:bg-white dark:text-slate-950" type="submit">
            Bildirimi Gönder
          </button>
          {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Bildirim alındı. İnceleme kuyruğuna eklenecek.</p> : null}
        </form>
      </div>
    </section>
  );
}
