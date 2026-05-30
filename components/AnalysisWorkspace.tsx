"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  analyzeProduct,
  analyzeSiteSafety,
  AnalysisHistoryItem,
  AnalysisResult,
  fetchAnalysisHistory,
  RiskLevel,
  SiteSafetyResult
} from "@/lib/api";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { isLikelyUrl, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

type ModuleId = "product" | "phishing" | "site" | "ip" | "message";

type Module = {
  id: ModuleId;
  title: string;
  shortTitle: string;
  description: string;
  status: string;
  icon: string;
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
    icon: "UR",
    inputLabel: "Urun linki",
    placeholder: "https://www.trendyol.com/...",
    checks: ["Satici adi", "Puan", "Yorum sayisi", "Fiyat", "Sahte yorum paterni", "Guven skoru"]
  },
  {
    id: "phishing",
    title: "Phishing Kontrolu",
    shortTitle: "Phishing",
    description: "URL icin marka taklidi, guvensiz protokol, kisa link ve supheli alan adi paternlerini inceler.",
    status: "Aktif MVP",
    icon: "PH",
    inputLabel: "Supheli URL",
    placeholder: "https://ornek-link.com/login",
    checks: ["HTTPS kontrolu", "Marka taklidi", "Kisa link", "Alan adi paterni", "Oltalama sinyali", "AI ozeti"]
  },
  {
    id: "site",
    title: "Site Guvenlik Kontrolu",
    shortTitle: "Site",
    description: "Domain, SSL, DNS, RDAP, mail guvenligi ve redirect sinyallerinden sade bir OSINT raporu uretir.",
    status: "Aktif MVP",
    icon: "SG",
    inputLabel: "URL veya domain",
    placeholder: "ornek-site.com",
    checks: ["Domain yasi", "SSL sertifikasi", "DNS kayitlari", "RDAP/WHOIS", "Mail guvenligi", "Redirect kontrolu"]
  },
  {
    id: "ip",
    title: "IP Istihbarati",
    shortTitle: "IP",
    description: "IP adresinin ulke, ASN, hosting, proxy/VPN/Tor ve kotuye kullanim sinyallerini degerlendirir.",
    status: "Yakinda",
    icon: "IP",
    inputLabel: "IP adresi",
    placeholder: "8.8.8.8",
    // TODO: IP Istihbarati kapsami:
    // - IP ulke bilgisi
    // - ASN / organizasyon
    // - Hosting saglayici
    // - AbuseIPDB entegrasyonu
    // - VPN / Proxy tespiti
    // - Tor exit node kontrolu
    // - Kara liste sinyalleri
    // - Son raporlanma tarihi
    // - Vatandasa sade risk yorumu
    checks: ["Ulke", "ASN", "Hosting firmasi", "VPN/TOR olasiligi", "Abuse kayitlari", "Veri merkezi sinyali"]
  },
  {
    id: "message",
    title: "SMS / Mesaj Analizi",
    shortTitle: "SMS",
    description: "Korku dili, aciliyet baskisi, kurum taklidi ve sahte kargo paternlerini AI ile aciklar.",
    status: "Aktif MVP",
    icon: "SM",
    inputLabel: "SMS veya mesaj metni",
    placeholder: "Kargonuz bekletiliyor, hemen odeme yapin...",
    checks: ["Aciliyet baskisi", "Kurum taklidi", "Phishing paterni", "Sahte kargo", "Risk seviyesi", "Kullanici onerisi"]
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

type PhishingResult = {
  url: string;
  domain: string;
  trustScore: number;
  riskLevel: RiskLevel;
  verdict: string;
  summary: string;
  signals: string[];
  reasons: string[];
  recommendation: string;
};

type MessageResult = {
  message: string;
  trustScore: number;
  riskLevel: RiskLevel;
  verdict: string;
  summary: string;
  signals: string[];
  reasons: string[];
  recommendation: string;
};

export function AnalysisWorkspace() {
  const searchParams = useSearchParams();
  const initialModule = (searchParams.get("module") as ModuleId | null) ?? "product";
  const [activeModule, setActiveModule] = useState<ModuleId>(
    modules.some((module) => module.id === initialModule) ? initialModule : "product"
  );
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [phishingResult, setPhishingResult] = useState<PhishingResult | null>(null);
  const [messageResult, setMessageResult] = useState<MessageResult | null>(null);
  const [siteResult, setSiteResult] = useState<SiteSafetyResult | null>(null);
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

    const rate = checkClientRateLimit(`analysis-${activeModule}`, 10, 60_000);
    if (!rate.allowed) {
      setError(`Cok fazla analiz denemesi. Lutfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const sanitizedInput = activeModule === "message" ? sanitizeMultiline(url, 1500) : sanitizeText(url, 500);
    setUrl(sanitizedInput);

    if (activeModule !== "product" && activeModule !== "phishing" && activeModule !== "message" && activeModule !== "site") {
      setError("Bu sorgu paneli yakinda aktif olacak. Simdilik urun analizi calisiyor.");
      return;
    }

    if (!sanitizedInput) {
      setError(activeModule === "message" ? "Analiz icin bir mesaj metni girin." : "Analiz icin bir URL yapistirin.");
      return;
    }

    if ((activeModule === "product" || activeModule === "phishing" || activeModule === "site") && !isLikelyUrl(sanitizedInput)) {
      setError("Gecerli bir URL girin.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setPhishingResult(null);
    setMessageResult(null);
    setSiteResult(null);

    if (activeModule === "phishing") {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setPhishingResult(analyzePhishingUrl(sanitizedInput));
      setIsLoading(false);
      return;
    }

    if (activeModule === "message") {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setMessageResult(analyzeMessageText(sanitizedInput));
      setIsLoading(false);
      return;
    }

    if (activeModule === "site") {
      try {
        setSiteResult(await analyzeSiteSafety(sanitizedInput));
      } catch {
        setError("Site guvenlik analizi su anda tamamlanamadi. Backend baglantisini ve OSINT servislerini kontrol edin.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const analysis = await analyzeProduct(sanitizedInput);
    setResult(analysis);
    await refreshHistory();
    setIsLoading(false);
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
      <aside className="grid h-fit gap-3 lg:sticky lg:top-24">
        {modules.map((module) => {
          const active = module.id === activeModule;
          return (
            <button
              className={`focus-ring rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                active
                  ? "border-cyan-500 bg-white shadow-cyan-950/10 dark:border-cyan-300 dark:bg-cyan-300/10"
                  : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"}`}>
                    {module.icon}
                  </span>
                  <h2 className="text-base font-bold">{module.title}</h2>
                </div>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                  {module.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{module.description}</p>
            </button>
          );
        })}
      </aside>

      <div className="grid gap-6">
        <AnalyzerPanel
          activeModule={currentModule}
          canAnalyze={canAnalyze}
          error={error}
          isLoading={isLoading}
          messageResult={messageResult}
          onSubmit={handleAnalyze}
          phishingResult={phishingResult}
          siteResult={siteResult}
          result={result}
          setUrl={setUrl}
          url={url}
        />
        <HistoryPanel history={history} />
      </div>
    </section>
  );
}

function AnalyzerPanel({
  activeModule,
  canAnalyze,
  error,
  isLoading,
  messageResult,
  onSubmit,
  result,
  phishingResult,
  siteResult,
  setUrl,
  url
}: {
  activeModule: Module;
  canAnalyze: boolean;
  error: string;
  isLoading: boolean;
  messageResult: MessageResult | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: AnalysisResult | null;
  phishingResult: PhishingResult | null;
  siteResult: SiteSafetyResult | null;
  setUrl: (url: string) => void;
  url: string;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="premium-card p-5">
        <div className="border-b border-slate-200 pb-4 dark:border-white/10">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-200">{activeModule.shortTitle} paneli</p>
          <h1 className="mt-2 text-2xl font-bold">{activeModule.title}</h1>
          <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{activeModule.description}</p>
        </div>

        <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="analysis-input">
            {activeModule.inputLabel}
          </label>
          {activeModule.id === "message" ? (
            <textarea
              id="analysis-input"
              className="min-h-36 resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
              placeholder={activeModule.placeholder}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          ) : (
            <input
              id="analysis-input"
              className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-400/20"
              placeholder={activeModule.placeholder}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          )}
          {error ? <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}
          <button
            className="btn-primary min-h-12 text-base"
            disabled={activeModule.id === "product" || activeModule.id === "phishing" || activeModule.id === "message" || activeModule.id === "site" ? !canAnalyze : false}
            type="submit"
          >
            {isLoading
              ? "Analiz ediliyor..."
              : activeModule.id === "product"
                ? "Urunu Analiz Et"
                : activeModule.id === "phishing"
                ? "URL'yi Kontrol Et"
                : activeModule.id === "site"
                  ? "Siteyi Analiz Et"
                : activeModule.id === "message"
                    ? "Mesaji Analiz Et"
                  : "Yakinda Aktif"}
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

      <ResultPanel activeModule={activeModule} messageResult={messageResult} phishingResult={phishingResult} siteResult={siteResult} result={result} isLoading={isLoading} />
    </section>
  );
}

function ResultPanel({
  activeModule,
  messageResult,
  phishingResult,
  siteResult,
  result,
  isLoading
}: {
  activeModule: Module;
  messageResult: MessageResult | null;
  phishingResult: PhishingResult | null;
  siteResult: SiteSafetyResult | null;
  result: AnalysisResult | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="premium-card p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-6 grid gap-4">
          <div className="h-24 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
          <div className="h-32 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
          <div className="h-20 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
        </div>
      </section>
    );
  }

  if (activeModule.id === "phishing" && phishingResult) {
    return <PhishingResultPanel result={phishingResult} />;
  }

  if (activeModule.id === "message" && messageResult) {
    return <MessageResultPanel result={messageResult} />;
  }

  if (activeModule.id === "site" && siteResult) {
    return <SiteSafetyResultPanel result={siteResult} />;
  }

  if (!result) {
    return (
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-white/15 dark:bg-white/5">
        <div className="cyber-grid absolute inset-0 opacity-70" />
        <div className="absolute h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/10" />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-xl font-bold text-cyan-800 shadow-sm dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100">
            DI
          </div>
          <p className="text-lg font-semibold">Analiz sonucu burada gorunecek.</p>
          <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">
            Sorgu panelinden bir analiz turu secip URL girdiginde sonuc burada gorunur.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-card p-5">
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
        <DecisionPanel title="Neden bu sonuc?" body={result.ai_summary.negative} footer={`Guven skoru ${result.trust_score}/100 olarak hesaplandi.`} />
        <DecisionPanel title="Gorulen sinyaller" body={`${result.ai_summary.fake_review_pattern} ${result.ai_summary.delivery_complaints}`} footer={`Parser ${result.review_snippet_count} yorum ornegi yakaladi.`} />
        <DecisionPanel title="Kullanici onerisi" body={result.ai_summary.recommendation} footer={result.parser_notes.length ? result.parser_notes.join(" ") : "Ek parser notu yok."} />
      </div>
    </section>
  );
}

function PhishingResultPanel({ result }: { result: PhishingResult }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Phishing Kontrolu</p>
          <h2 className="mt-1 break-words text-2xl font-bold">{result.domain}</h2>
          <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">{result.url}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.riskLevel]}`}>
          <p className="text-sm font-semibold">Guven Skoru</p>
          <p className="text-3xl font-bold">{result.trustScore}</p>
          <p className="text-sm font-semibold">{result.verdict}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.summary}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <DecisionPanel title="Neden bu sonuc?" body={result.reasons.join(" ")} footer={`Guven skoru ${result.trustScore}/100 olarak hesaplandi.`} />
        <DecisionPanel title="Gorulen sinyaller" body={result.signals.join(" ")} footer={`${result.signals.length} sinyal degerlendirildi.`} />
        <DecisionPanel title="Kullanici onerisi" body={result.recommendation} footer="Kesin hukum degil, bilgilendirme amacli risk degerlendirmesidir." />
      </div>
    </section>
  );
}

function MessageResultPanel({ result }: { result: MessageResult }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">SMS / Mesaj Analizi</p>
          <h2 className="mt-1 text-2xl font-bold">Mesaj risk ozeti</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{result.message}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.riskLevel]}`}>
          <p className="text-sm font-semibold">Guven Skoru</p>
          <p className="text-3xl font-bold">{result.trustScore}</p>
          <p className="text-sm font-semibold">{result.verdict}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.summary}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <DecisionPanel title="Neden bu sonuc?" body={result.reasons.join(" ")} footer={`Guven skoru ${result.trustScore}/100 olarak hesaplandi.`} />
        <DecisionPanel title="Gorulen sinyaller" body={result.signals.join(" ")} footer={`${result.signals.length} mesaj sinyali degerlendirildi.`} />
        <DecisionPanel title="Kullanici onerisi" body={result.recommendation} footer="Kesin hukum degil, bilgilendirme amacli risk degerlendirmesidir." />
      </div>
    </section>
  );
}

function SiteSafetyResultPanel({ result }: { result: SiteSafetyResult }) {
  const riskBreakdown = result.risk_score_breakdown ?? [];

  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Site Guvenlik Kontrolu</p>
          <h2 className="mt-1 break-words text-2xl font-bold">{result.url_analysis.domain}</h2>
          <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">{result.url_analysis.normalized_url}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.risk_level]}`}>
          <p className="text-sm font-semibold">Risk Skoru</p>
          <p className="text-3xl font-bold">{result.risk_score}</p>
          <p className="text-sm font-semibold">{riskLabels[result.risk_level]}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.citizen_summary}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="HTTP durum" value={result.url_analysis.http_status?.toString() ?? "Yok"} />
        <Metric label="Domain yasi" value={result.domain_info.domain_age_days !== null ? `${result.domain_info.domain_age_days} gun` : "Bilinmiyor"} />
        <Metric label="SSL" value={result.ssl_info.valid ? "Gecerli" : "Kontrol gerekli"} />
        <Metric label="Mail guvenligi" value={result.mail_security.spoofing_risk === "safe" ? "Iyi" : result.mail_security.spoofing_risk === "caution" ? "Dikkat" : "Risk"} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <InfoPanel
          title="Domain bilgileri"
          rows={[
            ["Registrar", result.domain_info.registrar ?? "Bilinmiyor"],
            ["Kayit tarihi", result.domain_info.created_at ?? "Bilinmiyor"],
            ["Bitis tarihi", result.domain_info.expires_at ?? "Bilinmiyor"],
            ["Abuse contact", result.domain_info.abuse_contact ?? "Yok"]
          ]}
        />
        <InfoPanel
          title="SSL guvenligi"
          rows={[
            ["Durum", result.ssl_info.valid ? "Gecerli" : "Kontrol gerekli"],
            ["Issuer", result.ssl_info.issuer ?? "Bilinmiyor"],
            ["Bitis", result.ssl_info.expires_at ?? "Bilinmiyor"],
            ["Kalan gun", result.ssl_info.days_remaining !== null ? result.ssl_info.days_remaining.toString() : "Bilinmiyor"]
          ]}
        />
        <InfoPanel
          title="DNS ozeti"
          rows={[
            ["A", result.dns_info.a.slice(0, 3).join(", ") || "Yok"],
            ["AAAA", result.dns_info.aaaa.slice(0, 2).join(", ") || "Yok"],
            ["MX", result.dns_info.mx.slice(0, 2).join(", ") || "Yok"],
            ["NS", result.dns_info.ns.slice(0, 2).join(", ") || "Yok"]
          ]}
        />
        <InfoPanel
          title="Mail guvenligi"
          rows={[
            ["SPF", yesNo(result.mail_security.has_spf)],
            ["DMARC", yesNo(result.mail_security.has_dmarc)],
            ["DKIM sinyali", yesNo(result.mail_security.has_dkim_signal)],
            ["Spoofing riski", riskLabels[result.mail_security.spoofing_risk]]
          ]}
        />
        <InfoPanel
          title="IP bilgileri"
          rows={[
            ["IP", result.ip_info.ip ?? "Bilinmiyor"],
            ["Ulke", result.ip_info.country ?? "Bilinmiyor"],
            ["ASN", result.ip_info.asn ?? "Bilinmiyor"],
            ["Hosting", result.ip_info.hosting ?? "Bilinmiyor"]
          ]}
        />
        <InfoPanel
          title="URL bulgulari"
          rows={[
            ["Final URL", result.url_analysis.final_url ?? "Yok"],
            ["Redirect", result.url_analysis.redirect_chain.length ? `${result.url_analysis.redirect_chain.length} adim` : "Yok"],
            ["Kisa link", yesNo(result.url_analysis.is_short_link)],
            ["Supheli kelime", result.url_analysis.suspicious_keywords.join(", ") || "Yok"]
          ]}
        />
      </div>

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik detaylar ve bulgular</summary>
        <div className="mt-4 grid gap-3">
          {riskBreakdown.length ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950">
              <p className="font-bold">Risk puani aciklamasi</p>
              <div className="mt-3 grid gap-2">
                {riskBreakdown.map((item) => (
                  <div className="flex flex-col gap-1 rounded-md border border-slate-100 p-3 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between" key={`${item.label}-${item.points}`}>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                    <span className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/10 dark:text-amber-200 sm:mt-0">
                      +{item.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
              Risk puanini artiran belirgin bir teknik madde bulunmadi.
            </p>
          )}
          {result.technical_findings.length ? (
            result.technical_findings.map((finding) => (
              <article className={`rounded-md border p-3 text-sm ${riskStyles[finding.severity]}`} key={`${finding.title}-${finding.detail}`}>
                <p className="font-bold">{finding.title}</p>
                <p className="mt-1 leading-6">{finding.detail}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">Belirgin teknik risk bulgusu listelenmedi.</p>
          )}
          {[...result.dns_info.notes, ...result.domain_info.notes, ...result.ssl_info.notes, ...result.mail_security.notes, ...result.ip_info.notes].map((note) => (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300" key={note}>
              {note}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}

function InfoPanel({ rows, title }: { rows: [string, string][]; title: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div className="grid gap-1 text-sm" key={label}>
            <p className="font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="break-words text-slate-800 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function yesNo(value: boolean) {
  return value ? "Var" : "Yok";
}

function DecisionPanel({ body, footer, title }: { body: string; footer: string; title: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
      <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">{footer}</p>
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

function HistoryPanel({ history }: { history: AnalysisHistoryItem[] }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold">Analiz gecmisi</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">PostgreSQL bagliysa son analizler burada listelenir.</p>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{history.length} kayit</p>
      </div>
      <p className="py-6 text-sm text-slate-600 dark:text-slate-300">
        {history.length === 0 ? "Kayitli analiz bulunmuyor veya backend gecmis endpointine ulasilamadi." : "Son analizler yuklendi."}
      </p>
    </section>
  );
}

function analyzePhishingUrl(input: string): PhishingResult {
  const parsed = parseUserUrl(input);
  const hostname = parsed?.hostname.toLowerCase().replace(/^www\./, "") ?? input.toLowerCase();
  const href = parsed?.href ?? input;
  const signals: string[] = [];
  const reasons: string[] = [];
  let risk = 0;

  if (!parsed) {
    risk += 25;
    signals.push("URL formati net okunamadi.");
    reasons.push("Adres yapisi standart URL formatina uymadigi icin ek kontrol gerekir.");
  }

  if (parsed && parsed.protocol !== "https:") {
    risk += 18;
    signals.push("HTTPS kullanimi gorulmedi.");
    reasons.push("Giris veya odeme isteyen sayfalarda HTTPS olmamasi onemli bir supheli sinyaldir.");
  }

  if (isIpAddress(hostname)) {
    risk += 18;
    signals.push("Alan adi yerine IP adresi kullaniliyor.");
    reasons.push("Marka veya kurum sayfalarinda dogrudan IP kullanimi kullanici icin dogrulama zorlugu olusturur.");
  }

  if (isShortener(hostname)) {
    risk += 14;
    signals.push("Kisa link servisi tespit edildi.");
    reasons.push("Kisa linkler hedef adresi gizleyebildigi icin phishing kampanyalarinda sik kullanilir.");
  }

  if (hostname.includes("@") || href.includes("%40")) {
    risk += 20;
    signals.push("URL icinde yonlendirme/kimlik karistirma paterni var.");
  }

  if ((hostname.match(/-/g) ?? []).length >= 2) {
    risk += 8;
    signals.push("Alan adinda birden fazla tire kullanimi var.");
  }

  if (hostname.split(".").length >= 4) {
    risk += 8;
    signals.push("Cok katmanli alt alan adi yapisi goruldu.");
  }

  const brandSignal = detectBrandImpersonation(hostname);
  if (brandSignal) {
    risk += 26;
    signals.push(brandSignal);
    reasons.push("Alan adi, bilinen bir marka veya kurum adini andiriyor ancak resmi alan adiyla birebir eslesmiyor.");
  }

  const suspiciousWords = ["login", "verify", "secure", "account", "odeme", "kargo", "hediye", "kampanya", "destek", "dogrula"];
  const matchedWords = suspiciousWords.filter((word) => href.toLowerCase().includes(word));
  if (matchedWords.length >= 2) {
    risk += 10;
    signals.push(`URL icinde ${matchedWords.slice(0, 3).join(", ")} gibi ikna/hesap kelimeleri var.`);
  }

  if (signals.length === 0) {
    signals.push("Belirgin phishing paterni gorulmedi.");
    reasons.push("Alan adi ve protokol ilk bakista standart gorunuyor.");
  }

  const trustScore = Math.max(8, Math.min(96, 100 - risk));
  const riskLevel: RiskLevel = trustScore >= 75 ? "safe" : trustScore >= 50 ? "caution" : "risk";
  const verdict = riskLabels[riskLevel];
  const summary =
    riskLevel === "safe"
      ? "AI ozeti: Bu URL'de ilk bakista belirgin bir oltalama paterni gorulmedi. Yine de hassas bilgi girmeden once alan adini ve sayfa icerigini kontrol edin."
      : riskLevel === "caution"
        ? "AI ozeti: Bu URL bazi supheli sinyaller tasiyor. Islem yapmadan once resmi uygulama veya dogrudan bilinen alan adi uzerinden kontrol etmek daha guvenli olur."
        : "AI ozeti: Bu URL yuksek riskli davranis paternleri gosteriyor. Sifre, kart bilgisi veya SMS kodu girmeden once baglantiyi kapatip resmi kanaldan dogrulama yapin.";

  return {
    url: href,
    domain: hostname,
    trustScore,
    riskLevel,
    verdict,
    summary,
    signals,
    reasons,
    recommendation:
      riskLevel === "safe"
        ? "Adres cubugundaki alan adini yine de kontrol edin; hassas islem yapacaksaniz siteye arama motoru yerine kendi kayitli baglantinizdan girin."
        : "Linke tiklamadan once alan adini resmi kaynakla karsilastirin, kisaltma linklerini acmayin ve hicbir dogrulama kodunu bu sayfaya girmeyin."
  };
}

function analyzeMessageText(input: string): MessageResult {
  const text = input.trim();
  const normalized = text.toLowerCase();
  const signals: string[] = [];
  const reasons: string[] = [];
  let risk = 0;

  const urgencyWords = ["hemen", "acil", "son gun", "son saat", "simdi", "iptal edilecek", "kapatilacak", "askiya"];
  const fearWords = ["ceza", "borc", "icra", "bloke", "hesabiniz kapatildi", "kargo bekletiliyor", "teslim edilemedi"];
  const paymentWords = ["odeme", "kart", "iban", "aidat", "ucret", "tahsilat", "para iadesi"];
  const credentialWords = ["sifre", "sms kodu", "dogrulama kodu", "tek kullanimlik", "giris yap", "hesap dogrula"];
  const impersonationWords = ["ptt", "banka", "e-devlet", "edevlet", "trendyol", "hepsiburada", "kargo", "vergi", "sgk"];

  const matchedUrgency = findMatches(normalized, urgencyWords);
  const matchedFear = findMatches(normalized, fearWords);
  const matchedPayment = findMatches(normalized, paymentWords);
  const matchedCredential = findMatches(normalized, credentialWords);
  const matchedImpersonation = findMatches(normalized, impersonationWords);
  const urlMatches = text.match(/https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+\.(com|net|org|tr|info|top|xyz)\S*/gi) ?? [];

  if (matchedUrgency.length) {
    risk += 16;
    signals.push(`Aciliyet baskisi goruldu: ${matchedUrgency.slice(0, 3).join(", ")}.`);
    reasons.push("Mesaj kullaniciyi hizli karar vermeye zorlayan ifadeler iceriyor.");
  }

  if (matchedFear.length) {
    risk += 16;
    signals.push(`Korku veya yaptirim dili goruldu: ${matchedFear.slice(0, 3).join(", ")}.`);
    reasons.push("Ceza, bloke, kargo bekletme veya hesap kapatma gibi baski kuran ifadeler risk sinyalidir.");
  }

  if (matchedPayment.length) {
    risk += 14;
    signals.push(`Odeme/finansal islem dili var: ${matchedPayment.slice(0, 3).join(", ")}.`);
  }

  if (matchedCredential.length) {
    risk += 22;
    signals.push(`Sifre veya dogrulama kodu talebi sinyali var: ${matchedCredential.slice(0, 3).join(", ")}.`);
    reasons.push("Sifre, SMS kodu veya dogrulama kodu isteyen mesajlar yuksek riskli davranis paterni tasir.");
  }

  if (matchedImpersonation.length) {
    risk += 14;
    signals.push(`Kurum/marka taklidi ihtimali: ${matchedImpersonation.slice(0, 3).join(", ")}.`);
    reasons.push("Bilinen kurum adlariyla gelen mesajlarda gonderici ve resmi kanal ayrica dogrulanmalidir.");
  }

  if (urlMatches.length) {
    risk += 18;
    signals.push(`${urlMatches.length} adet link tespit edildi.`);
    reasons.push("Mesaj icindeki linkler phishing sayfasina yonlendirme amaciyla kullanilabilir.");
  }

  if (/[A-ZĞÜŞİÖÇ]{6,}/.test(text)) {
    risk += 5;
    signals.push("Tamamı buyuk harfli baski dili kullanimi goruldu.");
  }

  if (signals.length === 0) {
    signals.push("Belirgin scam/phishing paterni gorulmedi.");
    reasons.push("Mesajda aciliyet, link, sifre talebi veya kurum taklidi gibi guclu sinyaller tespit edilmedi.");
  }

  const trustScore = Math.max(8, Math.min(96, 100 - risk));
  const riskLevel: RiskLevel = trustScore >= 75 ? "safe" : trustScore >= 50 ? "caution" : "risk";
  const verdict = riskLabels[riskLevel];
  const summary =
    riskLevel === "safe"
      ? "AI ozeti: Bu mesajda ilk bakista belirgin bir dolandiricilik veya oltalama paterni gorulmedi. Yine de link ve ekleri resmi kanaldan kontrol etmek iyi olur."
      : riskLevel === "caution"
        ? "AI ozeti: Mesaj bazi supheli sinyaller tasiyor. Linke tiklamadan ve bilgi girmeden once gondericiyi resmi kanaldan dogrulayin."
        : "AI ozeti: Mesaj yuksek riskli davranis paternleri gosteriyor. Linke tiklamayin, sifre veya SMS kodu paylasmayin ve kurumu resmi uygulama/telefon uzerinden kontrol edin.";

  return {
    message: text,
    trustScore,
    riskLevel,
    verdict,
    summary,
    signals,
    reasons,
    recommendation:
      riskLevel === "safe"
        ? "Yine de mesajdaki linkleri manuel yazmak yerine resmi uygulama veya bilinen web sitesi uzerinden kontrol edin."
        : "Linke tiklamayin, kart/sifre/SMS kodu girmeyin; gerekiyorsa kurumun resmi numarasi veya uygulamasi uzerinden dogrulama yapin."
  };
}

function findMatches(text: string, words: string[]) {
  return words.filter((word) => text.includes(word));
}

function parseUserUrl(input: string): URL | null {
  try {
    return new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return null;
  }
}

function isIpAddress(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isShortener(hostname: string) {
  return ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "lnkd.in"].includes(hostname);
}

function detectBrandImpersonation(hostname: string) {
  const officialDomains = [
    "trendyol.com",
    "hepsiburada.com",
    "n11.com",
    "amazon.com.tr",
    "sahibinden.com",
    "turkiye.gov.tr",
    "ptt.gov.tr",
    "ziraatbank.com.tr",
    "garantibbva.com.tr",
    "akbank.com"
  ];

  const normalized = hostname.replace(/^www\./, "");
  const exactMatch = officialDomains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
  if (exactMatch) return "";

  const brand = officialDomains
    .map((domain) => domain.split(".")[0])
    .find((name) => normalized.includes(name) || levenshteinDistance(normalized.split(".")[0], name) <= 2);

  return brand ? `"${brand}" adini andiran ama resmi alan adiyla eslesmeyen yapi goruldu.` : "";
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let column = 0; column <= a.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      matrix[row][column] =
        b[row - 1] === a[column - 1]
          ? matrix[row - 1][column - 1]
          : Math.min(matrix[row - 1][column - 1] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column] + 1);
    }
  }

  return matrix[b.length][a.length];
}
