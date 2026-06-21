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
      setError("Lütfen bildirim türü, başlık/link ve açıklama alanlarını doldurun.");
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
    <section className="cyber-section cyber-pattern-circuit border-b border-cyan-300/15 py-10">
      <div className={`${HOME_SECTION_CONTAINER} grid gap-6 lg:grid-cols-[minmax(280px,400px)_1fr] lg:items-start`}>
        <div>
          <p className="cyber-eyebrow">Öneri ve Bildirim</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Risk sinyali bildir.</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Şimdilik mock çalışır; gerçek backend bağlandığında bildirimler inceleme kuyruğuna düşecek.
          </p>
          <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
            <span className="font-bold text-cyan-50">İpucu: </span>
            Şüpheli link bildirimi için tam URL; SMS bildirimi için mesaj metnini kısaca özetleyin.
          </div>
        </div>
        <form className="cyber-card grid gap-4 rounded-xl border p-6" onSubmit={handleSubmit}>
          <select
            className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300/50"
            defaultValue={types[0]}
            name="type"
          >
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input
            className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
            maxLength={300}
            name="target"
            placeholder="Link veya kısa başlık"
          />
          <textarea
            className="min-h-28 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
            maxLength={1000}
            name="description"
            placeholder="Kısa açıklama"
          />
          <button className="btn-primary min-h-11" type="submit">
            Bildirimi Gönder
          </button>
          {error ? (
            <p className="rounded-md border border-red-300/30 bg-red-300/10 px-3 py-2 text-sm font-semibold text-red-200">
              {error}
            </p>
          ) : null}
          {sent ? (
            <p className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              Bildirim alındı. İnceleme kuyruğuna eklenecek.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
