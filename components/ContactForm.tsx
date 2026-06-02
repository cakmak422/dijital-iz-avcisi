"use client";

import { FormEvent, useState } from "react";
import { saveContactMessage } from "@/lib/contactStore";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

const contactTopics = ["Genel iletisim", "Supheli link bildirimi", "Hatali analiz bildirimi", "Is birligi onerisi"];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");

    const rate = checkClientRateLimit("contact-form", 5, 60_000);
    if (!rate.allowed) {
      setError(`Cok fazla mesaj denemesi. Lutfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = sanitizeText(String(formData.get("name") ?? ""), 80);
    const email = sanitizeText(String(formData.get("email") ?? ""), 120).toLowerCase();
    const topic = sanitizeText(String(formData.get("topic") ?? ""), 80);
    const message = sanitizeMultiline(String(formData.get("message") ?? ""), 1000);

    if (!name || !email || !topic || !message) {
      setError("Lutfen tum alanlari doldurun.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Gecerli bir e-posta adresi girin.");
      return;
    }

    try {
      saveContactMessage({ name, email, topic, message });
    } catch {
      setError("Mesaj kaydedilemedi. Lutfen tekrar deneyin.");
      return;
    }

    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" maxLength={80} name="name" placeholder="Ad soyad" />
        <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" maxLength={120} name="email" placeholder="E-posta" type="email" />
      </div>
      <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" defaultValue={contactTopics[0]} name="topic">
        {contactTopics.map((topic) => (
          <option key={topic}>{topic}</option>
        ))}
      </select>
      <textarea className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950" maxLength={1000} name="message" placeholder="Mesajiniz" />
      <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" type="submit">
        Mesaji Gonder
      </button>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Mesajiniz alindi. Gercek backend baglandiginda kayit altina alinacaktir.</p> : null}
    </form>
  );
}
