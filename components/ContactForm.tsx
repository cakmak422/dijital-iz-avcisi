"use client";

import { FormEvent, useState } from "react";
import { saveContactMessage } from "@/lib/contactStore";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

const contactTopics = ["Genel iletişim", "Şüpheli link bildirimi", "Hatalı analiz bildirimi", "İş birliği önerisi"];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");

    const rate = checkClientRateLimit("contact-form", 5, 60_000);
    if (!rate.allowed) {
      setError(`Çok fazla mesaj denemesi. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = sanitizeText(String(formData.get("name") ?? ""), 80);
    const email = sanitizeText(String(formData.get("email") ?? ""), 120).toLowerCase();
    const topic = sanitizeText(String(formData.get("topic") ?? ""), 80);
    const message = sanitizeMultiline(String(formData.get("message") ?? ""), 1000);

    if (!name || !email || !topic || !message) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    try {
      saveContactMessage({ name, email, topic, message });
    } catch {
      setError("Mesaj kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <form className="cyber-card grid gap-4 rounded-lg border p-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 dark:border-cyan-300/20 dark:bg-slate-950/80"
          maxLength={80}
          name="name"
          placeholder="Ad soyad"
        />
        <input
          className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 dark:border-cyan-300/20 dark:bg-slate-950/80"
          maxLength={120}
          name="email"
          placeholder="E-posta"
          type="email"
        />
      </div>
      <select
        className="min-h-11 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300/50 dark:border-cyan-300/20 dark:bg-slate-950/80"
        defaultValue={contactTopics[0]}
        name="topic"
      >
        {contactTopics.map((topic) => (
          <option key={topic}>{topic}</option>
        ))}
      </select>
      <textarea
        className="min-h-32 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 dark:border-cyan-300/20 dark:bg-slate-950/80"
        maxLength={1000}
        name="message"
        placeholder="Mesajınız"
      />
      <button className="btn-primary min-h-11" type="submit">
        Mesajı Gönder
      </button>
      {error ? (
        <p className="rounded-md border border-red-300/30 bg-red-300/10 px-3 py-2 text-sm font-semibold text-red-200">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
          Mesajınız alındı. Gerçek backend bağlandığında kayıt altına alınacaktır.
        </p>
      ) : null}
    </form>
  );
}
