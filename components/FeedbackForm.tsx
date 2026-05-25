"use client";

import { FormEvent, useState } from "react";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isLikelyUrl, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

const types = ["Supheli link", "Sahte SMS / oltalama", "Yeni ozellik onerisi", "Hatali analiz bildirimi"];

export function FeedbackForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");

    const rate = checkClientRateLimit("feedback-form", 5, 60_000);
    if (!rate.allowed) {
      setError(`Cok fazla bildirim denemesi. Lutfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const type = sanitizeText(String(formData.get("type") ?? ""), 80);
    const target = sanitizeText(String(formData.get("target") ?? ""), 300);
    const description = sanitizeMultiline(String(formData.get("description") ?? ""), 1000);

    if (!type || !target || !description) {
      setError("Lutfen bildirim turu, baslik/link ve aciklama alanlarini doldurun.");
      return;
    }

    if (type === "Supheli link" && !isLikelyUrl(target)) {
      setError("Supheli link bildirimi icin gecerli bir URL girin.");
      return;
    }

    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Oneri ve Bildirim</p>
          <h2 className="mt-2 text-3xl font-bold">Risk sinyali bildir.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Simdilik mock calisir; gercek backend baglandiginda bildirimler inceleme kuyruguna dusecek.
          </p>
        </div>
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
          <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" defaultValue={types[0]} name="type">
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" maxLength={300} name="target" placeholder="Link veya kisa baslik" />
          <textarea className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950" maxLength={1000} name="description" placeholder="Kisa aciklama" />
          <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white dark:bg-white dark:text-slate-950" type="submit">
            Bildirimi Gonder
          </button>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Bildirim alindi. Inceleme kuyruguna eklenecek.</p> : null}
        </form>
      </div>
    </section>
  );
}
