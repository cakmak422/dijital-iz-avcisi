"use client";

import { FormEvent, useState } from "react";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isLikelyUrl, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

const types = ["Şüpheli link", "Sahte SMS / oltalama", "Yeni özellik önerisi", "Hatalı analiz bildirimi"];

const HOME_SECTION_CONTAINER = "mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 xl:px-12";

export function FeedbackForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");

    const rate = checkClientRateLimit("feedback-form", 5, 60_000);
    if (!rate.allowed) {
      setError(`Çok fazla bildirim denemesi. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const type = sanitizeText(String(formData.get("type") ?? ""), 80);
    const target = sanitizeText(String(formData.get("target") ?? ""), 300);
    const description = sanitizeMultiline(String(formData.get("description") ?? ""), 1000);

    if (!type || !target || !description) {
      setError("Lütfen bildirim turu, başlık/link ve açıklama alanlarıni doldÜrün.");
      return;
    }

    if (type === "Şüpheli link" && !isLikelyUrl(target)) {
      setError("Şüpheli link bildirimi için geçerli bir URL girin.");
      return;
    }

    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <section className="cyber-section border-b border-slate-200 bg-slate-50 py-8 dark:border-white/10 dark:bg-slate-950">
      <div className={`${HOME_SECTION_CONTAINER} grid gap-5 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-start`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Öneri ve Bildirim</p>
          <h2 className="mt-2 text-3xl font-bold">Risk sinyali bildir.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Şimdilik mock çalışır; gerçek backend bağlandığında bildirimler inceleme kuyruğuna düşecek.
          </p>
        </div>
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
          <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" defaultValue={types[0]} name="type">
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" maxLength={300} name="target" placeholder="Link veya kısa başlık" />
          <textarea className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950" maxLength={1000} name="description" placeholder="Kısa açıklama" />
          <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white dark:bg-white dark:text-slate-950" type="submit">
            Bildirimi Gönder
          </button>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Bildirim alındı. İnceleme kuyruğuna eklenecek.</p> : null}
        </form>
      </div>
    </section>
  );
}
