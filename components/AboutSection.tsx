export function AboutSection() {
  const analyzedSignals = [
    "Yorum yogunlugu",
    "Satici gecmisi",
    "Puan anomalileri",
    "Kullanici geri bildirimleri",
    "AI destekli yorum ozeti"
  ];

  const riskLevels = [
    { label: "Guvenli", body: "Belirgin risk sinyali dusuk gorunur.", style: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200" },
    { label: "Dikkatli Ol", body: "Bazi sinyaller satin alma oncesi kontrol gerektirir.", style: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200" },
    { label: "Riskli", body: "Birden fazla supheli sinyal birlikte gorunur.", style: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200" }
  ];

  return (
    <section className="bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Hakkimizda</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">Siber farkindalik ve alisveris guvenligi icin sade risk analizi.</h1>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            Dijital Iz Avcisi, cevrim ici alisverislerde kullanicilarin urun ve satici risk sinyallerini daha hizli gorebilmesi icin gelistirilen AI destekli analiz platformudur.
          </p>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            Platform; sahte yorum, manipule puan, guven vermeyen satici profili ve fake magaza gibi gercek sorunlari teknik detaylara bogmadan anlasilir hale getirmeyi hedefler.
          </p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
            <h2 className="font-bold">Hukuki guven metni</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Sistem kesin hukum vermez. Sunulan sonuclar risk sinyalleri ve veri analizi temelinde olusturulan bilgilendirme ciktilaridir.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold">Sistem nasil calisir?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Urun linki analiz edilir", "Satici sinyalleri incelenir", "Yorum yogunlugu degerlendirilir", "AI destekli risk ozeti olusturulur"].map((item) => (
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
            <h2 className="text-lg font-bold">Gizlilik yaklasimi</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Kullanici verisi satilmaz, odeme bilgisi alinmaz ve girilen bilgiler yalnizca analiz amaciyla islenir.
            </p>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Vizyonumuz, Turkiye genelinde alisveris guven farkindaligini artirmak ve dijital riskleri herkes icin daha okunabilir hale getirmektir.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
