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
    {
      label: "Güvenli",
      body: "Belirgin risk sinyali düşük görünür.",
      style: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
    },
    {
      label: "Dikkatli Ol",
      body: "Bazı sinyaller satın alma öncesi kontrol gerektirir.",
      style: "border-amber-300/30 bg-amber-300/10 text-amber-100"
    },
    {
      label: "Riskli",
      body: "Birden fazla şüpheli sinyal birlikte görünür.",
      style: "border-red-300/30 bg-red-300/10 text-red-100"
    }
  ];

  return (
    <section className={`${wide ? "py-8" : "px-4 py-10 sm:px-6 lg:px-8"} cyber-section cyber-pattern-section`}>
      <div className={`grid ${wide ? `${HOME_SECTION_CONTAINER} gap-5` : "mx-auto max-w-7xl gap-6"} lg:grid-cols-[0.9fr_1.1fr]`}>
        <div className="cyber-card rounded-lg border p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Hakkımızda</p>
          <EditableContent as="h1" className="mt-3 text-3xl font-bold tracking-normal text-white sm:text-4xl lg:text-5xl" contentKey="about.page.title" />
          <EditableContent as="p" className="mt-4 leading-7 text-slate-300" contentKey="about.page.description" />
          <p className="mt-4 leading-7 text-slate-300">
            Platform; sahte yorum, manipüle puan, güven vermeyen satıcı profili ve fake mağaza gibi gerçek sorunları teknik detaylara boğmadan anlaşılır hale getirmeyi hedefler.
          </p>
          <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4">
            <h2 className="font-bold text-amber-100">Hukuki güven metni</h2>
            <p className="mt-2 text-sm leading-6 text-amber-200/80">
              Sistem kesin hüküm vermez. Sunulan sonuçlar risk sinyalleri ve veri analizi temelinde oluşturulan bilgilendirme çıktılarıdır.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="cyber-card rounded-lg border p-5">
            <h2 className="text-lg font-bold text-white">Sistem nasıl çalışır?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Ürün linki analiz edilir", "Satıcı sinyalleri incelenir", "Yorum yoğunluğu değerlendirilir", "AI destekli risk özeti oluşturulur"].map((item) => (
                <p className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-50" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article className="cyber-card rounded-lg border p-5">
            <h2 className="text-lg font-bold text-white">Neleri analiz ediyoruz?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analyzedSignals.map((signal) => (
                <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50" key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </article>

          <article className="cyber-card rounded-lg border p-5">
            <h2 className="text-lg font-bold text-white">Risk seviyeleri</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {riskLevels.map((level) => (
                <div className={`rounded-lg border p-4 ${level.style}`} key={level.label}>
                  <p className="font-bold">{level.label}</p>
                  <p className="mt-2 text-sm leading-6">{level.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="cyber-card rounded-lg border p-5">
            <EditableContent as="h2" className="text-lg font-bold text-white" contentKey="about.mission.title" />
            <EditableContent as="p" className="mt-2 leading-7 text-slate-300" contentKey="about.mission.text" />
          </article>

          <article className="cyber-card rounded-lg border p-5">
            <EditableContent as="h2" className="text-lg font-bold text-white" contentKey="about.vision.title" />
            <EditableContent as="p" className="mt-2 leading-7 text-slate-300" contentKey="about.vision.text" />
          </article>
        </div>
      </div>
    </section>
  );
}
