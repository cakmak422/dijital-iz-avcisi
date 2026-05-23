"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  analyzeProduct,
  AnalysisHistoryItem,
  AnalysisResult,
  fetchAnalysisHistory,
  RiskLevel
} from "@/lib/api";

type Theme = "light" | "dark";

type ModuleId = "product" | "site" | "ip" | "message" | "guides";

type Module = {
  id: ModuleId;
  title: string;
  shortTitle: string;
  description: string;
  status: string;
  inputLabel: string;
  placeholder: string;
  checks: string[];
};

const modules: Module[] = [
  {
    id: "product",
    title: "Urun Analizi",
    shortTitle: "Urun",
    description: "Trendyol, Hepsiburada, N11 ve Amazon TR urun linkleri icin satici, yorum ve fiyat sinyallerini inceler.",
    status: "Aktif MVP",
    inputLabel: "Urun linki",
    placeholder: "https://www.trendyol.com/...",
    checks: ["Satici adi", "Puan", "Negatif yorum sinyali", "Sahte yorum paterni", "Fiyat anomalisi", "AI yorum ozeti"]
  },
  {
    id: "site",
    title: "Site Guvenlik Kontrolu",
    shortTitle: "Site",
    description: "Domain, SSL, redirect, typo domain ve phishing paternleri icin sade bir risk ozeti uretir.",
    status: "Planlandi",
    inputLabel: "URL veya domain",
    placeholder: "ornek-site.com",
    checks: ["Domain yasi", "SSL sertifikasi", "WHOIS", "Phishing riski", "Redirect kontrolu", "Blacklist kontrolu"]
  },
  {
    id: "ip",
    title: "IP Analizi",
    shortTitle: "IP",
    description: "IP adresinin ulke, ASN, abuse kaydi ve veri merkezi/VPN sinyallerini degerlendirir.",
    status: "Planlandi",
    inputLabel: "IP adresi",
    placeholder: "8.8.8.8",
    checks: ["Ulke", "ASN", "Hosting firmasi", "VPN/TOR olasiligi", "Abuse kayitlari", "Veri merkezi sinyali"]
  },
  {
    id: "message",
    title: "SMS / Mesaj Analizi",
    shortTitle: "SMS",
    description: "Korku dili, aciliyet baskisi, kurum taklidi ve sahte kargo paternlerini AI ile aciklar.",
    status: "Planlandi",
    inputLabel: "SMS veya mesaj metni",
    placeholder: "Kargonuz bekletiliyor, hemen odeme yapin...",
    checks: ["Aciliyet baskisi", "Kurum taklidi", "Phishing paterni", "Sahte kargo", "Risk seviyesi", "Kullanici onerisi"]
  },
  {
    id: "guides",
    title: "Dijital Guvenlik Rehberleri",
    shortTitle: "Rehber",
    description: "Vatandaslar icin sade, SEO uyumlu ve uygulanabilir dijital guvenlik icerikleri.",
    status: "Icerik sistemi",
    inputLabel: "Konu ara",
    placeholder: "Sahte site nasil anlasilir?",
    checks: ["Sahte site", "Riskli SMS", "Fake yorum", "Instagram guvenligi", "Cocuklar icin guvenlik", "SEO uyumlu rehber"]
  }
];

const platformStats = [
  { label: "Analiz edilen link", value: "12.480", detail: "demo veri" },
  { label: "Riskli sinyal yakalandi", value: "1.936", detail: "site ve satici" },
  { label: "Gunluk analiz", value: "420", detail: "ortalama demo" }
];

const howItWorks = [
  {
    title: "Link yapistir",
    body: "Urun, site, IP veya mesaj bilgisini tek alana gir. Sistem hangi sinyallere bakacagini belirler."
  },
  {
    title: "AI analiz etsin",
    body: "Parser, guvenlik kontrolleri ve AI ozetleme katmani risk paternlerini sade bir dile cevirir."
  },
  {
    title: "Risk sonucunu ogren",
    body: "Guven skoru, gorulen sinyaller ve kullanici icin pratik oneriler tek raporda listelenir."
  }
];

const riskLabels: Record<RiskLevel, string> = {
  safe: "Guvenli",
  caution: "Dikkatli Ol",
  risk: "Riskli"
};

const riskStyles: Record<RiskLevel, string> = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  caution: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  risk: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
};

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [activeModule, setActiveModule] = useState<ModuleId>("product");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState("");

  const currentModule = modules.find((module) => module.id === activeModule) ?? modules[0];
  const canAnalyze = useMemo(() => url.trim().length > 8 && !isLoading, [url, isLoading]);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    const items = await fetchAnalysisHistory();
    setHistory(items);
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (activeModule !== "product") {
      setError("Bu analiz modulu yakinda aktif olacak. Simdilik urun analizi calisiyor.");
      return;
    }

    if (!url.trim()) {
      setError("Analiz icin bir urun linki yapistirin.");
      return;
    }

    setIsLoading(true);
    const analysis = await analyzeProduct(url.trim());
    setResult(analysis);
    await refreshHistory();
    setIsLoading(false);
  }

  function selectModule(moduleId: ModuleId) {
    setActiveModule(moduleId);
    document.getElementById("analiz")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
        <Navbar activeModule={activeModule} setActiveModule={selectModule} theme={theme} setTheme={setTheme} />
        <Hero activeModule={currentModule} setActiveModule={selectModule} />
        <StatsBand />
        <HowItWorks />

        <section id="analiz" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
          <ModuleCards activeModule={activeModule} setActiveModule={setActiveModule} />

          <div className="grid gap-6">
            <AnalyzerPanel
              activeModule={currentModule}
              error={error}
              isLoading={isLoading}
              result={result}
              setUrl={setUrl}
              url={url}
              onSubmit={handleAnalyze}
              canAnalyze={canAnalyze}
            />
            <HistoryPanel history={history} />
          </div>
        </section>

        <GuidesPreview />
        <Footer />
      </div>
    </main>
  );
}

function Navbar({
  activeModule,
  setActiveModule,
  theme,
  setTheme
}: {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  const navItems = [
    { id: "product" as ModuleId, label: "Urun Analizi" },
    { id: "site" as ModuleId, label: "Site Guvenligi" },
    { id: "ip" as ModuleId, label: "IP Analizi" },
    { id: "message" as ModuleId, label: "SMS Analizi" },
    { id: "guides" as ModuleId, label: "Rehberler" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/88">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-3" href="#top" aria-label="Dijital Iz Avcisi">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
              DI
            </span>
            <span>
              <span className="block text-sm font-bold leading-4">Dijital Iz Avcisi</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">AI guvenlik platformu</span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <button
              aria-label="Tema degistir"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
            >
              {theme === "dark" ? "L" : "D"}
            </button>
            <button
              className="hidden min-h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:flex"
              onClick={() => setActiveModule("product")}
              type="button"
            >
              Analize Basla
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {navItems.map((item) => (
            <button
              className={`shrink-0 rounded-md border px-3 py-2 transition ${
                activeModule === item.id
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Hero({
  activeModule,
  setActiveModule
}: {
  activeModule: Module;
  setActiveModule: (module: ModuleId) => void;
}) {
  return (
    <section id="top" className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200">
            Vatandaslar icin AI destekli dijital guvenlik
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Dijital riskleri herkesin anlayacagi guven raporlarina cevir.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Sahte site, phishing link, riskli satici ve supheli mesaj sinyallerini sade bir dille aciklayan modern guvenlik platformu.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button className="min-h-12 rounded-md bg-slate-900 px-5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" onClick={() => setActiveModule("product")} type="button">
              Urun Analizi Baslat
            </button>
            <button className="min-h-12 rounded-md border border-slate-300 bg-white px-5 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" onClick={() => setActiveModule("site")} type="button">
              Site Guvenlik Kontrolu
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Canli modul</p>
                <p className="mt-1 text-xl font-bold">{activeModule.title}</p>
              </div>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                Risk raporu
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <SignalRow label="Supheli sinyal" value="Orta" tone="caution" />
              <SignalRow label="Kullanici etkisi" value="Kontrol gerekli" tone="neutral" />
              <SignalRow label="AI aciklamasi" value="Sade ozet hazir" tone="safe" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModuleCards({
  activeModule,
  setActiveModule
}: {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
}) {
  return (
    <aside className="grid h-fit gap-3 lg:sticky lg:top-24">
      {modules.map((module) => {
        const active = module.id === activeModule;
        return (
          <button
            className={`rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              active
                ? "border-slate-900 bg-white dark:border-white dark:bg-white/10"
                : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">{module.title}</h2>
              <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                {module.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{module.description}</p>
          </button>
        );
      })}
    </aside>
  );
}

function StatsBand() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-6 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
        {platformStats.map((stat) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5" key={stat.label}>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Nasil calisir?</p>
          <h2 className="mt-2 text-3xl font-bold">Uc adimda sade risk sonucu.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Teknik kontroller arka planda calisir; kullanici yalnizca neye dikkat etmesi gerektigini gorur.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyzerPanel({
  activeModule,
  canAnalyze,
  error,
  isLoading,
  onSubmit,
  result,
  setUrl,
  url
}: {
  activeModule: Module;
  canAnalyze: boolean;
  error: string;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: AnalysisResult | null;
  setUrl: (url: string) => void;
  url: string;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-200 pb-4 dark:border-white/10">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-200">{activeModule.shortTitle} modulu</p>
          <h2 className="mt-2 text-2xl font-bold">{activeModule.title}</h2>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{activeModule.description}</p>
        </div>

        <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="analysis-input">
            {activeModule.inputLabel}
          </label>
          <input
            id="analysis-input"
            className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-400/20"
            placeholder={activeModule.placeholder}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          {error ? <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}
          <button
            className="min-h-12 rounded-md bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-white/20 dark:disabled:text-slate-400"
            disabled={activeModule.id === "product" ? !canAnalyze : false}
            type="submit"
          >
            {isLoading ? "Analiz ediliyor..." : activeModule.id === "product" ? "Urunu Analiz Et" : "Yakinda Aktif"}
          </button>
        </form>

        <div className="mt-6 grid gap-2">
          {activeModule.checks.map((check) => (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10" key={check}>
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-300" />
              {check}
            </div>
          ))}
        </div>
      </div>

      <ResultPanel result={result} isLoading={isLoading} />
    </section>
  );
}

function ResultPanel({
  result,
  isLoading
}: {
  result: AnalysisResult | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-6 grid gap-4">
          <div className="h-24 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
          <div className="h-32 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
          <div className="h-20 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-white/15 dark:bg-white/5">
        <div>
          <p className="text-lg font-semibold">Analiz sonucu burada gorunecek.</p>
          <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">
            Ilk surumde urun analizi aktiftir. Diger moduller ayni rapor dilini kullanacak sekilde hazirlaniyor.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{result.marketplace}</p>
          <h2 className="mt-1 text-2xl font-bold">{result.product_name}</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Satici: {result.seller_name}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.risk_level]}`}>
          <p className="text-sm font-semibold">Guven Skoru</p>
          <p className="text-3xl font-bold">{result.trust_score}</p>
          <p className="text-sm font-semibold">{riskLabels[result.risk_level]}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Puan" value={result.rating.toFixed(1)} />
        <Metric label="Yorum" value={result.review_count.toString()} />
        <Metric label="Negatif yogunluk" value={`%${result.negative_review_density}`} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <DecisionPanel
          title="Neden bu sonuc?"
          body={result.ai_summary.negative}
          footer={`Guven skoru ${result.trust_score}/100 olarak hesaplandi.`}
        />
        <DecisionPanel
          title="Gorulen sinyaller"
          body={`${result.ai_summary.fake_review_pattern} ${result.ai_summary.delivery_complaints}`}
          footer={`Parser ${result.review_snippet_count} yorum ornegi yakaladi.`}
        />
        <DecisionPanel
          title="Kullanici onerisi"
          body={result.ai_summary.recommendation}
          footer={result.parser_notes.length ? result.parser_notes.join(" ") : "Ek parser notu yok."}
        />
      </div>

      <div className="mt-6 grid gap-4">
        <SummaryRow title="Olumlu yorum ozeti" body={result.ai_summary.positive} />
        <SummaryRow title="Olumsuz yorum ozeti" body={result.ai_summary.negative} />
        <SummaryRow title="Sahte yorum paterni ihtimali" body={result.ai_summary.fake_review_pattern} />
        <SummaryRow title="Teslimat sikayetleri" body={result.ai_summary.delivery_complaints} />
        <SummaryRow title="Iade problemleri" body={result.ai_summary.return_issues} />
        <SummaryRow title="AI risk degerlendirmesi" body={result.ai_summary.recommendation} />
      </div>
    </section>
  );
}

function DecisionPanel({
  body,
  footer,
  title
}: {
  body: string;
  footer: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
      <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
        {footer}
      </p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SummaryRow({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-slate-200 p-4 dark:border-white/10">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{body}</p>
    </article>
  );
}

function HistoryPanel({ history }: { history: AnalysisHistoryItem[] }) {
  return (
    <section id="gecmis" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold">Analiz gecmisi</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">PostgreSQL bagliysa son analizler burada listelenir.</p>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{history.length} kayit</p>
      </div>

      {history.length === 0 ? (
        <p className="py-6 text-sm text-slate-600 dark:text-slate-300">Kayitli analiz bulunmuyor veya backend gecmis endpointine ulasilamadi.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold">Urun</th>
                <th className="py-3 pr-4 font-semibold">Pazar yeri</th>
                <th className="py-3 pr-4 font-semibold">Satici</th>
                <th className="py-3 pr-4 font-semibold">Skor</th>
                <th className="py-3 pr-4 font-semibold">Durum</th>
                <th className="py-3 font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr className="border-b border-slate-100 dark:border-white/10" key={item.id}>
                  <td className="max-w-[260px] py-3 pr-4 font-medium">
                    <a className="hover:text-blue-700 dark:hover:text-blue-200" href={item.url} rel="noreferrer" target="_blank">
                      {item.product_name}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{item.marketplace}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{item.seller_name}</td>
                  <td className="py-3 pr-4 font-bold">{item.trust_score}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${riskStyles[item.risk_level]}`}>
                      {riskLabels[item.risk_level]}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GuidesPreview() {
  const guides = [
    "Sahte site nasil anlasilir?",
    "Riskli SMS nasil tespit edilir?",
    "Fake yorum nasil anlasilir?",
    "Instagram hesabi nasil korunur?"
  ];

  return (
    <section id="rehberler" className="border-t border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">Rehberler</p>
          <h2 className="mt-2 text-3xl font-bold">Halkin anlayacagi guvenlik dili.</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Teknik tehditleri sade, uygulanabilir ve SEO uyumlu rehberlere donusturen icerik alani.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {guides.map((guide) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5" key={guide}>
              <h3 className="font-bold">{guide}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Kisa kontrol listesi, risk sinyalleri ve guvenli hareket onerileriyle hazirlanacak.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg font-bold">Dijital Iz Avcisi</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            AI destekli analizler bilgilendirme amaclidir. Platform kesin suclama yapmaz; riskli davranis, phishing paterni ve supheli sinyal dilini kullanir.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
          <a className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="#top">KVKK</a>
          <a className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="#top">Gizlilik</a>
          <a className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="#top">Yasal Uyari</a>
          <a className="rounded-md border border-white/10 px-3 py-2 transition hover:bg-white/10" href="#top">Iletisim</a>
        </nav>
      </div>
    </footer>
  );
}

function SignalRow({
  label,
  tone,
  value
}: {
  label: string;
  tone: "safe" | "caution" | "neutral";
  value: string;
}) {
  const toneClass =
    tone === "safe"
      ? "bg-emerald-500"
      : tone === "caution"
        ? "bg-amber-500"
        : "bg-slate-400 dark:bg-slate-500";

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className={`h-2 w-2 rounded-full ${toneClass}`} />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
