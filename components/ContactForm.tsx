"use client";

import { FormEvent, useState } from "react";

const contactTopics = ["Genel iletişim", "Şüpheli link bildirimi", "Hatalı analiz bildirimi", "İş birliği önerisi"];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" placeholder="Ad soyad" />
        <input className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" placeholder="E-posta" type="email" />
      </div>
      <select className="min-h-11 rounded-md border border-slate-300 bg-white px-3 dark:border-white/10 dark:bg-slate-950" defaultValue={contactTopics[0]}>
        {contactTopics.map((topic) => (
          <option key={topic}>{topic}</option>
        ))}
      </select>
      <textarea className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950" placeholder="Mesajınız" />
      <button className="min-h-11 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-cyan-700 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100" type="submit">
        Mesajı Gönder
      </button>
      {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Mesajınız alındı. Gerçek backend bağlandığında kayıt altına alınacaktır.</p> : null}
    </form>
  );
}
