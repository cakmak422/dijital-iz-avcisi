"use client";

import { EditableContent } from "@/components/admin/content/EditableContent";

const HOME_SECTION_CONTAINER = "mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 xl:px-12";

export function AboutSection({ wide = false }: { wide?: boolean }) {
  const analyzedSignals = [
    "Yorum yoğunluğu",
    "Satıcı geçmişi",
    "Puan anomalileri",
    "Kullanıcı geri bildirimleri",
    "AI destekli yorum özeti"
  ];

  const riskLevels = [
    { label: "Güvenli", body: "Belirgin risk sinyali düşük görünür.", style: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200" },
    { label: "Dikkatli Ol", body: "Bazı sinyaller satın alma öncesi kontrol gerektirir.", style: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200" },
    { label: "Riskli", body: "Birden fazla şüpheli sinyal birlikte görünür.", style: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200" }
  ];

  return (
    <section className={`${wide ? "py-8" : "px-4 py-10 sm:px-6 lg:px-8"} cyber-section bg-slate-50 dark:bg-slate-950`}>
      <div className={`grid ${wide ? `${HOME_SECTION_CONTAINER} gap-5` : "mx-auto max-w-7xl gap-6"} lg:grid-cols-[0.9fr_1.1fr]`}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Hakkımızda</p>
          <EditableContent as="h1" className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl lg:text-5xl" contentKey="about.page.title" />
          <EditableContent as="p" className="mt-4 leading-7 text-slate-600 dark:text-slate-300" contentKey="about.page.description" />
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            Platform; sahte yorum, manipüle puan, güven vermeyen satıcı profili ve fake mağaza gibi gerçek sorunlari teknik detaylara boğmadan anlaşılır hale getirmeyi hedefler.
          </p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
            <h2 className="font-bold">Hukuki güven metni</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Sistem kesin hüküm vermez. Sunulan sonuçlar risk sinyalleri ve veri analizi temelinde oluşturulan bilgilendirme çıktılarıdır.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold">Sistem nasıl çalışır?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Ürün linki analiz edilir", "Satıcı sinyalleri incelenir", "Yorum yoğunluğu değerlendirilir", "AI destekli risk özeti oluşturulur"].map((item) => (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold">Neleri analiz ediyoruz?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analyzedSignals.map((signal) => (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold">Risk seviyeleri</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {riskLevels.map((level) => (
                <div className={`rounded-lg border p-4 ${level.style}`} key={level.label}>
                  <p className="font-bold">{level.label}</p>
                  <p className="mt-2 text-sm leading-6">{level.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <EditableContent as="h2" className="text-lg font-bold" contentKey="about.mission.title" />
            <EditableContent as="p" className="mt-2 leading-7 text-slate-600 dark:text-slate-300" contentKey="about.mission.text" />
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <EditableContent as="h2" className="text-lg font-bold" contentKey="about.vision.title" />
            <EditableContent as="p" className="mt-2 leading-7 text-slate-600 dark:text-slate-300" contentKey="about.vision.text" />
          </article>
        </div>
      </div>
    </section>
  );
}
