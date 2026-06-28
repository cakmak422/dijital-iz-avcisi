"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  analyzeExifImage,
  analyzeIpIntelligence,
  analyzePhishing,
  analyzeProduct,
  analyzeSiteSafety,
  AnalysisHistoryItem,
  AnalysisResult,
  ExifAnalysisResult,
  fetchAnalysisHistory,
  IpIntelligenceResult,
  PhishingAnalysisResult,
  RiskLevel,
  SiteSafetyResult
} from "@/lib/api";
import { checkClientRateLimit } from "@/lib/rateLimit";
import { getCurrentDemoUser } from "@/lib/auth";

// Backend risk_level ("safe"/"caution"/"risk") → DB değeri ("Düşük"/"Orta"/"Yüksek")
function toDbRisk(level?: RiskLevel | string | null): string | null {
  if (level === "safe")    return "Düşük";
  if (level === "caution") return "Orta";
  if (level === "risk")    return "Yüksek";
  return null;
}

// Fire-and-forget: analiz sonucu logla, kullanıcıyı beklettirme
function logQuery(type: string, value: string, riskLevel?: RiskLevel | string | null) {
  const user = getCurrentDemoUser();
  void fetch("/api/query-log", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      query_type:  type,
      query_value: value,
      risk_level:  toDbRisk(riskLevel),
      user_id:     user?.id ?? null,
    }),
  }).catch(() => { /* loglama başarısız olsa kullanıcı akışı etkilenmiyor */ });
}
import { isLikelyUrl, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

type ModuleId = "product" | "phishing" | "site" | "exif" | "ip" | "message";

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
    title: "Ürün Analizi",
    shortTitle: "Ürün",
    description: "Trendyol, Hepsiburada, N11 ve Amazon TR ürün linkleri için satıcı, yorum ve fiyat sinyallerini inceler.",
    status: "Aktif MVP",
    icon: "UR",
    inputLabel: "Ürün linki",
    placeholder: "https://www.trendyol.com/...",
    checks: ["Satıcı adi", "Puan", "Yorum sayisi", "Fiyat", "Sahte yorum paterni", "Güven skoru"]
  },
  {
    id: "phishing",
    title: "Phishing Kontrolü",
    shortTitle: "Phishing",
    description: "URL için marka taklidi, güvensiz protokol, kısa link ve Şüpheli alan adi paternlerini inceler.",
    status: "Aktif MVP",
    icon: "PH",
    inputLabel: "Şüpheli URL",
    placeholder: "https://örnek-link.com/login",
    checks: ["HTTPS kontrolü", "Marka taklidi", "Kısa link", "Alan adi paterni", "Oltalama sinyali", "AI özeti"]
  },
  {
    id: "site",
    title: "Site Güvenlik Kontrolü",
    shortTitle: "Site",
    description: "Domain, SSL, DNS, RDAP, mail güvenliği ve redirect sinyallerinden sade bir OSINT raporu üretir.",
    status: "Aktif MVP",
    icon: "SG",
    inputLabel: "URL veya domain",
    placeholder: "örnek-site.com",
    checks: ["Domain yaşı", "SSL sertifikası", "DNS kayıtları", "RDAP/WHOIS", "Mail güvenliği", "Redirect kontrolü"]
  },
  {
    id: "exif",
    title: "Fotoğraf EXIF Analizi",
    shortTitle: "EX",
    description: "Fotoğraftaki çekim tarihi, cihaz modeli, GPS konumu ve gizlilik risklerini analiz eder.",
    status: "Yakinda",
    icon: "EX",
    inputLabel: "Fotoğraf dosyası",
    placeholder: "",
    checks: ["Çekim tarihi", "Cihaz modeli", "GPS konumu", "Yazılım bilgisi", "Gizlilik riski", "Metadata durumu"]
  },
  {
    id: "ip",
    title: "IP Istihbarati",
    shortTitle: "IP",
    description: "IP adresinin ülke, ASN, hosting, proxy/VPN/Tor ve kötüye kullanım sinyallerini değerlendirir.",
    status: "Aktif MVP",
    icon: "IP",
    inputLabel: "IP adresi",
    placeholder: "8.8.8.8",
    // TODO: IP Istihbarati kapsami:
    // - IP ulke bilgisi
    // - ASN / organizasyon
// - Hosting sağlayıcı
    // - AbuseIPDB entegrasyonu
    // - VPN / Proxy tespiti
    // - Tor exit node kontrolü
    // - Kara liste sinyalleri
    // - Son raporlanma tarihi
    // - Vatandaça sade risk yorumu
    checks: ["Ülke", "ASN", "Hosting firması", "VPN/TOR olasılığı", "Abuse kayıtları", "Veri merkezi sinyali"]
  },
  {
    id: "message",
    title: "SMS / Mesaj Analizi",
    shortTitle: "SMS",
    description: "Korku dili, aciliyet baskısı, kurum taklidi ve sahte kargo paternlerini AI ile açıklar.",
    status: "Aktif MVP",
    icon: "SM",
    inputLabel: "SMS veya mesaj metni",
    placeholder: "Kargonuz bekletiliyor, hemen ödeme yapin...",
    checks: ["Aciliyet baskısı", "Kurum taklidi", "Phishing paterni", "Sahte kargo", "Risk seviyesi", "Kullanıcı önerisi"]
  }
];

const riskLabels: Record<RiskLevel, string> = {
  safe: "Güvenli",
  caution: "Dikkatli Ol",
  risk: "Riskli"
};

const ipRiskLabels: Record<RiskLevel, string> = {
  safe: "Düşük Risk",
  caution: "Dikkat",
  risk: "Riskli"
};

const riskStyles: Record<RiskLevel, string> = {
  safe: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  caution: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  risk: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
};

type PhishingResult = PhishingAnalysisResult;

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
  const [ipResult, setIpResult] = useState<IpIntelligenceResult | null>(null);
  const [exifResult, setExifResult] = useState<ExifAnalysisResult | null>(null);
  const [selectedExifFile, setSelectedExifFile] = useState<File | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [showAuthGate, setShowAuthGate] = useState(false);

  const currentModule = modules.find((module) => module.id === activeModule) ?? modules[0];
  const canAnalyze = useMemo(() => {
    const trimmed = url.trim();
    if (isLoading) return false;
    if (activeModule === "exif") return Boolean(selectedExifFile);
    if (!trimmed) return false;
    if (activeModule === "ip") return isLikelyIpInput(trimmed);
    return trimmed.length > 8;
  }, [activeModule, isLoading, selectedExifFile, url]);

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

    // Giriş kontrolü — giriş yapılmamışsa auth gate göster, analizi çalıştırma
    if (!getCurrentDemoUser()) {
      setShowAuthGate(true);
      return;
    }

    const rate = checkClientRateLimit(`analysis-${activeModule}`, 10, 60_000);
    if (!rate.allowed) {
      setError(`Çok fazla analiz denemesi. Lütfen ${rate.retryAfterSeconds} saniye sonra tekrar deneyin.`);
      return;
    }

    const sanitizedInput = activeModule === "message" ? sanitizeMultiline(url, 1500) : sanitizeText(url, 500);
    setUrl(sanitizedInput);

    if (activeModule === "exif") {
      if (!selectedExifFile) {
      setError("Analiz için bir JPG/JPEG/PNG fotoğraf seçin.");
        return;
      }
      setIsLoading(true);
      setResult(null);
      setPhishingResult(null);
      setMessageResult(null);
      setSiteResult(null);
      setIpResult(null);
      setExifResult(null);
      try {
        const exif = await analyzeExifImage(selectedExifFile);
        setExifResult(exif);
        // ai_risk_level serbest string olduğu için önce onu dene, tanınmıyorsa privacy_risk'e düş
        // privacy_risk: "safe"|"caution" — "risk" değeri yok, "caution" → "Orta" olarak loglanır
        const exifRisk = (exif?.ai_risk_level as RiskLevel | undefined) ?? exif?.privacy_risk;
        logQuery("exif", selectedExifFile.name, exifRisk);
      } catch (error) {
      setError(error instanceof Error ? error.message : "EXIF analizi tamamlanamadı. JPG/JPEG/PNG dosyası seçtiğinizden emin olun.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (activeModule !== "product" && activeModule !== "phishing" && activeModule !== "message" && activeModule !== "site" && activeModule !== "ip") {
      setError("Bu sorgu paneli yakinda aktif olacak. Simdilik Ürün analizi calisiyor.");
      return;
    }

    if (!sanitizedInput) {
    setError(activeModule === "message" ? "Analiz için bir mesaj metni girin." : "Analiz için bir URL yapıştırın.");
      return;
    }

    if ((activeModule === "product" || activeModule === "phishing" || activeModule === "site") && !isLikelyUrl(sanitizedInput)) {
      setError("Geçerli bir URL girin.");
      return;
    }

    if (activeModule === "ip" && !isLikelyIpInput(sanitizedInput)) {
      setError("Geçerli bir IP adresi girin.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setPhishingResult(null);
    setMessageResult(null);
    setSiteResult(null);
    setIpResult(null);
    setExifResult(null);

    if (activeModule === "phishing") {
      try {
        const phishing = await analyzePhishing(sanitizedInput);
        setPhishingResult(phishing);
        logQuery("phishing", sanitizedInput, phishing?.risk_level ?? phishing?.riskLevel);
      } catch {
        setError("Phishing analizi tamamlanamadı. Backend bağlantısını ve OSINT servislerini kontrol edin.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (activeModule === "message") {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const msg = analyzeMessageText(sanitizedInput);
      setMessageResult(msg);
      logQuery("message", sanitizedInput, msg?.riskLevel);
      setIsLoading(false);
      return;
    }

    if (activeModule === "site") {
      try {
        const site = await analyzeSiteSafety(sanitizedInput);
        setSiteResult(site);
        logQuery("site", sanitizedInput, site?.risk_level);
      } catch {
      setError("Site güvenlik analizi şu anda tamamlanamadı. Backend bağlantısını ve OSINT servislerini kontrol edin.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (activeModule === "ip") {
      try {
        const ip = await analyzeIpIntelligence(sanitizedInput);
        setIpResult(ip);
        logQuery("ip", sanitizedInput, ip?.risk_level);
      } catch {
      setError("IP istihbaratı analizi şu anda tamamlanamadı. Backend bağlantısını ve RDAP servislerini kontrol edin.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const analysis = await analyzeProduct(sanitizedInput);
      setResult(analysis);
      logQuery("product", sanitizedInput, analysis?.risk_level);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürün analizi tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[1680px] gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="grid h-fit gap-3 xl:sticky xl:top-24">
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
        {showAuthGate ? (
          <AuthGateCard onDismiss={() => setShowAuthGate(false)} />
        ) : (
          <AnalyzerPanel
            activeModule={currentModule}
            canAnalyze={canAnalyze}
            error={error}
            isLoading={isLoading}
            messageResult={messageResult}
            ipResult={ipResult}
            exifResult={exifResult}
            onSubmit={handleAnalyze}
            phishingResult={phishingResult}
            siteResult={siteResult}
            result={result}
            setUrl={setUrl}
            selectedExifFile={selectedExifFile}
            setSelectedExifFile={setSelectedExifFile}
            url={url}
          />
        )}
        {history.length ? <HistoryPanel history={history} /> : null}
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
  ipResult,
  exifResult,
  onSubmit,
  result,
  phishingResult,
  siteResult,
  setUrl,
  selectedExifFile,
  setSelectedExifFile,
  url
}: {
  activeModule: Module;
  canAnalyze: boolean;
  error: string;
  isLoading: boolean;
  messageResult: MessageResult | null;
  ipResult: IpIntelligenceResult | null;
  exifResult: ExifAnalysisResult | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: AnalysisResult | null;
  phishingResult: PhishingResult | null;
  siteResult: SiteSafetyResult | null;
  setUrl: (url: string) => void;
  selectedExifFile: File | null;
  setSelectedExifFile: (file: File | null) => void;
  url: string;
}) {
  return (
    <section className={activeModule.id === "site" ? "grid gap-6" : "grid gap-6 2xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.22fr)]"}>
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
          {activeModule.id === "exif" ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-white/15 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dosya yukleme alanı</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  JPG, JPEG ve PNG aktif. HEIC için hazırlık devam ediyor.
              </p>
              <input
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="mt-4 block w-full cursor-pointer rounded-md border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-white dark:file:text-slate-950"
                id="analysis-input"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    console.log("exif_file_selected", {
                      name: file.name,
                      size: file.size,
                      type: file.type
                    });
                  }
                  setSelectedExifFile(file);
                }}
                type="file"
              />
              {selectedExifFile ? <p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">{selectedExifFile.name}</p> : null}
            </div>
          ) : activeModule.id === "message" ? (
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
            disabled={activeModule.id === "product" || activeModule.id === "phishing" || activeModule.id === "message" || activeModule.id === "site" || activeModule.id === "ip" || activeModule.id === "exif" ? !canAnalyze : false}
            type="submit"
          >
            {isLoading
              ? "Analiz ediliyor..."
              : activeModule.id === "product"
                ? "Ürünü Analiz Et"
                : activeModule.id === "phishing"
                ? "URL'yi Kontrol Et"
                : activeModule.id === "site"
                  ? "Siteyi Analiz Et"
                : activeModule.id === "ip"
                  ? "IP'yi Analiz Et"
                : activeModule.id === "exif"
                  ? "EXIF'i Analiz Et"
                : activeModule.id === "message"
                    ? "Mesajı Analiz Et"
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

        {activeModule.id === "product" && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-400/30 dark:bg-blue-400/10">
            <span className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300">ℹ</span>
            <p className="text-xs leading-5 text-blue-800 dark:text-blue-200">
              <span className="font-bold">Beta:</span>{" "}
              Ürün Analizi modülü aktif geliştirme sürecindedir. Sonuçlar bilgilendirme amaçlıdır. Satıcı güven motoru, kategori analizi ve sahte ürün risk tespiti üzerinde geliştirmeler devam etmektedir.
            </p>
          </div>
        )}
      </div>

        <ResultPanel activeModule={activeModule} messageResult={messageResult} ipResult={ipResult} exifResult={exifResult} phishingResult={phishingResult} siteResult={siteResult} result={result} isLoading={isLoading} />
    </section>
  );
}

function AuthGateCard({ onDismiss }: { onDismiss: () => void }) {
  // Mevcut sayfayı + query string'i dinamik olarak yakala
  const nextPath = typeof window !== "undefined"
    ? encodeURIComponent(window.location.pathname + window.location.search)
    : encodeURIComponent("/sorgu-paneli");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/5 px-6 py-12 text-center">
      <div className="mb-4 text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-slate-100">Sorgu yapmak için giriş yapın</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        Analiz araçlarını kullanmak için ücretsiz bir hesap oluşturabilir veya mevcut hesabınızla giriş yapabilirsiniz.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={`/giris-yap?next=${nextPath}`}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Giriş Yap
        </a>
        <a
          href="/kayit-ol"
          className="rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Kayıt Ol
        </a>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:text-slate-200"
          type="button"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  activeModule,
  messageResult,
  ipResult,
  exifResult,
  phishingResult,
  siteResult,
  result,
  isLoading
}: {
  activeModule: Module;
  messageResult: MessageResult | null;
  ipResult: IpIntelligenceResult | null;
  exifResult: ExifAnalysisResult | null;
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
    return <EnhancedSiteSafetyResultPanel result={siteResult} />;
  }

  if (activeModule.id === "ip" && ipResult) {
    return <IpIntelligenceResultPanel result={ipResult} />;
  }

  if (activeModule.id === "exif") {
    return exifResult ? <ExifResultPanelV2 result={exifResult} /> : <ExifPreviewPanel />;
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
          <p className="text-lg font-semibold">Analiz sonucu burada görünecek.</p>
          <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">
            Sorgu panelinden bir analiz türü seçip URL girdiğinizde sonuç burada görünür.
          </p>
        </div>
      </section>
    );
  }

  const ds = result.detailed_summary;
  const breakdown = result.trust_score_breakdown ?? [];
  const flags = result.data_quality_flags ?? [];
  const badges = result.risk_badges ?? [];
  const decision = result.decision ?? null;
  const strengths = result.strengths ?? [];
  const weaknesses = result.weaknesses ?? [];
  const isSignalBased = result.analysis_mode === "signal_based" || (!ds && result.review_snippet_count === 0);

  const decisionStyles: Record<string, string> = {
    safe:      "border-emerald-400 bg-emerald-100 dark:border-emerald-400/60 dark:bg-emerald-400/20",
    recommend: "border-emerald-300 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-400/10",
    caution:   "border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10",
    avoid:     "border-red-400 bg-red-100 dark:border-red-400/60 dark:bg-red-400/20",
  };
  const decisionTextStyles: Record<string, string> = {
    safe:      "text-emerald-900 dark:text-emerald-100",
    recommend: "text-emerald-800 dark:text-emerald-200",
    caution:   "text-amber-800 dark:text-amber-200",
    avoid:     "text-red-900 dark:text-red-100",
  };
  const decisionIcons: Record<string, string> = {
    safe:      "🟢",
    recommend: "🟢",
    caution:   "🟡",
    avoid:     "🔴",
  };

  const badgeToneStyles: Record<string, string> = {
    safe:    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-100",
    caution: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100",
    risk:    "border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-100",
    neutral: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200",
  };

  const verdictStyles: Record<string, string> = {
    buy: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200",
    caution: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200",
    avoid: "border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200",
  };
  const verdictIcons: Record<string, string> = { buy: "✓", caution: "!", avoid: "✕" };
  const fakeRiskStyles: Record<string, string> = {
    "düşük": riskStyles.safe,
    "orta": riskStyles.caution,
    "yüksek": riskStyles.risk,
  };

  return (
    <section className="premium-card p-5">
      {/* Başlık + Skor + Net Tavsiye */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{result.marketplace}</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight">{result.product_name}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            {result.brand_name && (
              <span>Marka: <span className="font-semibold">{result.brand_name}</span></span>
            )}
            <span>
              Satıcı:{" "}
              <span className="font-semibold">
                {result.seller_name ? result.seller_name : "Satıcı doğrulanamadı"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:items-center">
          <div className={`rounded-lg border px-5 py-3 text-center ${riskStyles[result.risk_level]}`}>
            <p className="text-xs font-bold uppercase tracking-widest">Güven Skoru</p>
            <p className="text-4xl font-bold">{result.trust_score}</p>
            <p className="text-sm font-semibold">{riskLabels[result.risk_level]}</p>
          </div>
        </div>
      </div>

      {/* V4: Karar Kutusu */}
      {decision && (
        <div className={`mt-5 rounded-xl border-2 p-5 ${decisionStyles[decision.decision_level]}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{decisionIcons[decision.decision_level]}</span>
            <div>
              <p className={`text-xl font-bold ${decisionTextStyles[decision.decision_level]}`}>
                {decision.decision_label}
              </p>
              <p className={`mt-0.5 text-sm font-medium ${decisionTextStyles[decision.decision_level]}`}>
                {decision.decision_reason}
              </p>
            </div>
          </div>
          {decision.decision_points.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-current/20 pt-4">
              {decision.decision_points.map((pt, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm font-medium leading-6 ${decisionTextStyles[decision.decision_level]}`}>
                  <span className="mt-0.5 shrink-0 font-bold">›</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* V4: Risk Özeti Kutusu */}
      {result.risk_summary_level && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
          <span className={`text-sm font-bold ${
            result.risk_summary_level === "Yüksek Risk" ? "text-red-600 dark:text-red-400" :
            result.risk_summary_level === "Orta Risk"   ? "text-amber-600 dark:text-amber-400" :
            "text-emerald-600 dark:text-emerald-400"
          }`}>
            {result.risk_summary_level}
          </span>
          {(result.risk_summary_reasons ?? []).map((r, i) => (
            <span key={i} className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-white/15 dark:text-slate-200">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Sinyal bazlı analiz modu bandı */}
      {isSignalBased && (
        <div className="mt-4 rounded-lg border border-slate-300 bg-slate-100 p-4 dark:border-white/20 dark:bg-white/5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Sinyal Bazlı Analiz</p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            Yorum metni alınamadığı için AI yorum analizi çalışmadı. Bu analiz yalnızca <strong>ürün puanı, yorum sayısı, satıcı ve URL sinyallerine</strong> dayanıyor. Gerçek yorumlar için ürünün yorum sayfasını ziyaret edin.
          </p>
        </div>
      )}

      {/* Eksik veri uyarıları */}
      {flags.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/40 dark:bg-amber-400/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Eksik Veri Uyarıları</p>
          <ul className="space-y-1">
            {flags.map((flag, i) => (
              <li className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200" key={i}>
                <span className="mt-0.5 shrink-0 font-bold">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rozet bandı */}
      {badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${badgeToneStyles[badge.tone]}`}
              title={badge.detail}
            >
              {badge.tone === "safe" && "✓ "}
              {badge.tone === "risk" && "⚠ "}
              {badge.tone === "caution" && "! "}
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* V4: Güçlü / Zayıf Yönler */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {strengths.length > 0 && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-400/40 dark:bg-emerald-400/10">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-200">Güçlü Yönler</p>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-medium leading-6 text-emerald-900 dark:text-emerald-100">
                    <span className="shrink-0 font-bold text-emerald-700 dark:text-emerald-300">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Zayıf Yönler</p>
              <ul className="space-y-1.5">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">
                    <span className="shrink-0 font-bold text-red-600 dark:text-red-400">✗</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metrik satırı */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Ürün Puanı" value={result.rating > 0 ? result.rating.toFixed(1) : "—"} />
        <Metric label="Yorum Sayısı" value={result.review_count > 0 ? result.review_count.toString() : "—"} />
        <Metric label="Negatif Yoğunluk" value={`%${result.negative_review_density}`} />
        {result.data_confidence_grade && (
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">Veri Güvenilirliği</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{result.data_confidence_grade}</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {result.data_confidence_grade === "A" ? "Çok güçlü veri" :
               result.data_confidence_grade === "B" ? "Yeterli veri" :
               result.data_confidence_grade === "C" ? "Sınırlı veri" : "Zayıf veri"}
            </p>
          </div>
        )}
        {result.rating_trust_signal ? (
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">Puan Güvenilirliği</p>
            <p className="mt-2 text-sm font-medium leading-7 text-slate-800 dark:text-slate-200">{result.rating_trust_signal}</p>
          </div>
        ) : null}
      </div>

      {/* V3 Pro sinyal kartları */}
      {(result.category_risk_level || result.brand_trust_signal || result.price_performance_signal || (result.data_confidence_score !== undefined)) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {result.category_risk_level && (
            <ProductDetailCard
              title={result.category_risk_level !== "belirsiz"
                ? `Kategori Riski — ${result.category_risk_level}`
                : "Kategori Riski — belirsiz"}
              body={result.category_risk_level !== "belirsiz"
                ? (result.category_risk_reason ?? "")
                : "Kategori URL veya ürün adından tespit edilemedi — manuel kontrol önerilir."}
            />
          )}
          {result.brand_trust_signal && (
            <ProductDetailCard
              title={`Marka Güveni — ${result.brand_trust_score ?? 50}/100`}
              body={result.brand_trust_signal}
            />
          )}
          {result.price_performance_signal && (
            <ProductDetailCard
              title="Fiyat / Performans"
              body={result.price_performance_signal}
            />
          )}
          {result.fake_product_risk_level && result.fake_product_risk_level !== "düşük" && (
            <div className={`min-w-0 rounded-lg border p-4 ${
              result.fake_product_risk_level === "yüksek"
                ? "border-red-300 bg-red-50 dark:border-red-400/40 dark:bg-red-400/10"
                : "border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10"
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${
                result.fake_product_risk_level === "yüksek"
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              }`}>
                Sahte Ürün Riski — {result.fake_product_risk_level}
              </h3>
              <p className={`mt-2 text-sm font-medium leading-6 ${
                result.fake_product_risk_level === "yüksek"
                  ? "text-red-900 dark:text-red-100"
                  : "text-amber-900 dark:text-amber-100"
              }`}>
                {result.fake_product_risk_reason}
              </p>
            </div>
          )}
          {result.data_confidence_score !== undefined && (
            <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Veri Güvenilirliği — {result.data_confidence_score}/100
              </h3>
              <ul className="mt-2 space-y-1">
                {(result.data_confidence_reasons ?? []).map((r, i) => (
                  <li className="text-xs font-medium leading-5 text-slate-700 dark:text-slate-300" key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* V4: Skor Özeti — her zaman görünür */}
      {result.score_summary && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium italic leading-7 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          {result.score_summary}
        </p>
      )}

      {/* V4: Kategori Karşılaştırması */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Kategori Karşılaştırması</p>
        <p className="mt-1.5 text-sm font-medium leading-7 text-slate-800 dark:text-slate-200">
          {result.category_comparison
            ? result.category_comparison.category_position_text
            : "Kategori bilgisi tespit edilemedi — URL veya ürün adından kategori çıkarılamadı."}
        </p>
      </div>

      {ds ? (
        <>
          {/* Olumlu / Olumsuz özet */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DecisionPanel
              title="Olumlu Yorum Özeti"
              body={ds.positive_summary}
              footer={`${result.review_snippet_count} yorum örneği değerlendirildi.`}
            />
            <DecisionPanel
              title="Olumsuz Yorum Özeti"
              body={ds.negative_summary}
              footer={`Güven skoru ${result.trust_score}/100 olarak hesaplandı.`}
            />
          </div>

          {/* En sık şikayetler */}
          {ds.top_complaints.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">En Sık Şikayet Konuları</h3>
              <ul className="space-y-1.5">
                {ds.top_complaints.map((complaint, i) => (
                  <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300" key={i}>
                    <span className="mt-0.5 shrink-0 font-bold text-red-500">{i + 1}.</span>
                    <span>{complaint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detay grid — 3 sütun */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProductDetailCard title="Kargo / Teslimat" body={ds.delivery_issues} />
            <ProductDetailCard title="Paketleme" body={ds.packaging_issues} />
            <ProductDetailCard title="Satıcı Güvenilirliği" body={ds.seller_reliability} />
            <div className={`min-w-0 rounded-lg border p-4 ${fakeRiskStyles[ds.fake_review_risk] ?? riskStyles.caution}`}>
              <h3 className="text-xs font-bold uppercase tracking-widest">Sahte Yorum İhtimali</h3>
              <p className="mt-1 text-sm font-bold capitalize">{ds.fake_review_risk}</p>
              <p className="mt-2 text-sm leading-6">{ds.repetitive_pattern}</p>
            </div>
            <ProductDetailCard title="Fiyat / Performans" body={ds.price_performance} />
            <ProductDetailCard title="İade / Değişim" body={ds.return_problems} />
          </div>

          {/* Veri kalitesi notu */}
          {ds.data_quality && (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Veri kalitesi: </span>{ds.data_quality}
            </p>
          )}
        </>
      ) : (
        /* detailed_summary yoksa — sinyal bazlı veya fallback kartlar */
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <DecisionPanel
            title={isSignalBased ? "Risk Sinyalleri" : "Neden bu sonuç?"}
            body={result.ai_summary.negative}
            footer={isSignalBased ? "Yorum metni olmadan sinyal bazlı değerlendirme." : `Güven skoru ${result.trust_score}/100 olarak hesaplandı.`}
          />
          <DecisionPanel
            title={isSignalBased ? "Analiz Kapsamı" : "Görülen sinyaller"}
            body={isSignalBased ? result.ai_summary.fake_review_pattern : `${result.ai_summary.fake_review_pattern} ${result.ai_summary.delivery_complaints}`}
            footer={isSignalBased ? "Yorum metni alınamadı — sahte yorum ve teslimat analizi mevcut değil." : `Parser ${result.review_snippet_count} yorum örneği yakaladı.`}
          />
          <DecisionPanel
            title="Kullanıcı Önerisi"
            body={result.ai_summary.recommendation}
            footer={result.parser_notes.length ? result.parser_notes.join(" ") : "Ek parser notu yok."}
          />
        </div>
      )}

      {/* Güven skoru kırılımı */}
      {breakdown.length > 0 && (
        <details className="mt-5 rounded-lg border border-slate-200 dark:border-white/10">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            Güven Skoru Kırılımı — neden {result.trust_score}?
          </summary>
          <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-4">Faktör</th>
                  <th className="pb-2 pr-4 text-right">Puan</th>
                  <th className="pb-2">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {breakdown.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-200">{item.label}</td>
                    <td className={`py-2 pr-4 text-right font-bold ${item.points > 0 ? "text-emerald-600 dark:text-emerald-400" : item.points < 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </details>
      )}

      {/* Parser notları */}
      {result.parser_notes.length > 0 && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {result.parser_notes.join(" ")}
        </p>
      )}
    </section>
  );
}

function ProductDetailCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{body}</p>
    </article>
  );
}

function PhishingResultPanel({ result }: { result: PhishingResult }) {
  const riskScore =
    typeof result.phishing_risk_score === "number"
      ? result.phishing_risk_score
      : typeof result.trustScore === "number"
        ? Math.max(0, 100 - result.trustScore)
        : 0;
  const riskDisplay = phishingRiskDisplay(riskScore);
  const normalizedUrl = result.normalized_url ?? result.url ?? "";
  const finalUrl = result.final_url ?? normalizedUrl;
  const phishingSignals = result.phishing_signals ?? result.signals ?? [];
  const positiveSignals = result.positive_signals ?? [];
  const uncertainSignals = result.uncertain_signals ?? [];
  const technicalNotes = result.technical_notes ?? result.reasons ?? [];
  const sortedPhishingSignals = sortPhishingSignals(phishingSignals);
  const prioritizedPhishingSignals = buildPrioritizedPhishingSignals(result, sortedPhishingSignals);
  const officialMatch = Boolean(result.official_domain_match);
  const brandValue = result.suspected_brand ?? "Tespit edilmedi";
  const brandStatusValue = result.brand_impersonation_risk
    ? `🔴 Marka Taklidi: ${brandValue}`
    : officialMatch && result.suspected_brand
      ? `🟢 Resmi Marka: ${brandValue}`
      : brandValue;
  const topSummary = phishingTopSummary(riskScore);
  const scoreExplanation = phishingScoreExplanation(sortedPhishingSignals, result.brand_impersonation_risk, result.is_short_link);
  const citizenSummary = result.citizen_summary ?? result.summary ?? "Bu bağlantı için otomatik phishing özeti üretildi.";
  const citizenRecommendation =
    result.citizen_recommendation ?? result.recommendation ?? "Adres çubuğundaki alan adını kontrol edin ve hassas bilgi girmeden önce resmi kaynağı doğrulayın.";

  return (
    <section className="premium-card min-w-0 p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Phishing Kontrolü</p>
          <h2 className="mt-1 break-words text-2xl font-bold [overflow-wrap:break-word] [word-break:normal]">{result.domain}</h2>
          <p className="mt-2 whitespace-normal break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere] [word-break:normal] dark:text-slate-300">
            {normalizedUrl}
          </p>
        </div>
        <div className={`w-full rounded-lg border px-4 py-3 text-center sm:w-auto sm:min-w-64 ${phishingRiskStyle(riskScore)}`}>
          <p className="text-sm font-semibold">{riskDisplay.icon} Oltalama Riski</p>
          <p className="mt-1 text-3xl font-black tracking-wide">{riskDisplay.label}</p>
          <p className="text-xs font-semibold opacity-90">Risk Skoru: {riskScore}/100</p>
          <p className="mt-2 text-xs font-medium leading-5 opacity-90">{scoreExplanation}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_260px]">
        <article className={`min-w-0 rounded-lg border p-4 shadow-sm ${phishingRiskStyle(riskScore)}`}>
          <p className="text-sm font-bold">Kısa Özet</p>
          <p className="mt-2 text-sm leading-6">{topSummary}</p>
        </article>
        <StatusBadge label="Resmi Domain Eşleşmesi" value={officialMatch ? "🟢 Evet" : "🔴 Hayır"} tone={officialMatch ? "safe" : "risk"} />
        <StatusBadge label="Marka Durumu" value={brandStatusValue} tone={result.brand_impersonation_risk ? "risk" : officialMatch ? "safe" : "caution"} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Site kategorisi" value={result.site_category ?? "Bilinmeyen / Genel site"} />
        <Metric label="Redirect sayısı" value={`${result.redirect_count ?? result.redirect_chain?.length ?? 0}`} />
        <Metric label="Kısa link" value={result.is_short_link ? `Var${result.short_link_provider ? `: ${result.short_link_provider}` : ""}` : "Yok"} />
        <Metric label="HTTPS" value={result.is_https ? "Var" : "Yok"} />
      </div>

      <article className="mt-5 rounded-lg border border-cyan-200/60 bg-cyan-50/80 p-4 shadow-sm sm:p-5 dark:border-cyan-300/20 dark:bg-cyan-300/10">
        <p className="text-sm font-bold text-cyan-800 dark:text-cyan-100">Vatandaş Özeti</p>
        <p className="mt-2 whitespace-normal break-words text-sm leading-7 text-slate-700 [overflow-wrap:break-word] [word-break:normal] sm:text-base dark:text-slate-200">
          {citizenSummary}
        </p>
      </article>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <DecisionPanel title="Neden bu sonuç?" body={prioritizedPhishingSignals.join(" ") || "Belirgin oltalama sinyali görülmedi."} footer={`${prioritizedPhishingSignals.length} oltalama sinyali değerlendirildi.`} />
        <DecisionPanel title="Olumlu sinyaller" body={positiveSignals.join(" ") || "Olumlu sinyaller sınırlı; bu durum tek başına risk anlamına gelmez."} footer="Pozitif sinyaller marka taklidi varsa riski düşürmez." />
        <DecisionPanel title="Kullanıcı Önerisi" body={citizenRecommendation} footer="Kesin hüküm değil, bilgilendirme amaçlı risk değerlendirmesidir." />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <InfoPanel
          title="URL ve yönlendirme"
          rows={[
            ["Normalize URL", displayValue(normalizedUrl)],
            ["Final URL", displayValue(finalUrl)],
            ["Root domain", displayValue(result.root_domain)],
            ["HTTPS", result.is_https ? "Var" : "Yok"],
            ["Resmi domain eşleşmesi", result.official_domain_match ? "Var" : "Yok"],
            ["Marka taklidi", result.brand_impersonation_risk ? "Var" : "Yok"]
          ]}
        />
        <InfoPanel
          title="Şüpheli ve belirsiz sinyaller"
          rows={[
            ["Şüpheli path/query", joinValues(phishingSignals, "Belirgin şüpheli sinyal yok", 5)],
            ["Belirsiz bilgiler", joinValues(uncertainSignals, "Belirsiz bilgi yok", 5)],
            ["Teknik notlar", joinValues(technicalNotes, "Ek teknik not yok", 5)]
          ]}
        />
      </div>

      {result.redirect_chain?.length ? (
        <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <summary className="cursor-pointer font-bold">Redirect zinciri</summary>
          <div className="mt-4 grid gap-2">
            {result.redirect_chain.map((hop, index) => (
              <p className="whitespace-normal break-words rounded-md border border-slate-100 p-3 text-sm leading-6 [overflow-wrap:anywhere] [word-break:normal] dark:border-white/10" key={`${hop.url}-${index}`}>
                {index + 1}. adım: {hop.status_code ?? "Durum yok"} · {hop.url}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function MessageResultPanel({ result }: { result: MessageResult }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">SMS / Mesaj Analizi</p>
          <h2 className="mt-1 text-2xl font-bold">Mesaj risk özeti</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{result.message}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.riskLevel]}`}>
          <p className="text-sm font-semibold">Güven Skoru</p>
          <p className="text-3xl font-bold">{result.trustScore}</p>
          <p className="text-sm font-semibold">{result.verdict}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.summary}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <DecisionPanel title="Neden bu sonuç?" body={result.reasons.join(" ")} footer={`Güven skoru ${result.trustScore}/100 olarak hesaplandı.`} />
        <DecisionPanel title="Görülen sinyaller" body={result.signals.join(" ")} footer={`${result.signals.length} mesaj sinyali değerlendirildi.`} />
        <DecisionPanel title="Kullanıcı Önerisi" body={result.recommendation} footer="Kesin hüküm değil, bilgilendirme amaçlı risk değerlendirmesidir." />
      </div>
    </section>
  );
}

function ExifPreviewPanel() {
  return (
    <section className="premium-card p-5">
      <div className="border-b border-slate-200 pb-5 dark:border-white/10">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Yakinda</p>
        <h2 className="mt-1 text-2xl font-bold">Fotograf EXIF Analizi</h2>
        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
          Fotoğraf dosyalarındaki EXIF metadata bilgilerini okuyarak çekim tarihi, cihaz modeli, konum ve paylaşım risklerini sade bir rapor haline getirir.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-white/15 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dosya yukleme hazirligi</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Desteklenen format hazırlığı: JPG, JPEG, PNG, HEIC. Bu MVP adımında dosya yüklenmez ve analiz yapılmaz.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {["Çekim tarihi", "Cihaz modeli", "GPS konumu", "Yazılım bilgisi", "Gizlilik riski", "Metadata durumu"].map((item) => (
          <article className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5" key={item}>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Yakinda analiz edilecek</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExifResultPanel({ result }: { result: ExifAnalysisResult }) {
  const metadataStatus = getExifMetadataStatus(result);
  const photoTypeSignal = getPhotoTypeSignal(result);

  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fotograf EXIF Analizi</p>
          <h2 className="mt-1 break-words text-2xl font-bold">{result.file_name}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {result.image_width && result.image_height ? `${result.image_width} x ${result.image_height}` : "Görsel boyutu okunamadı"} · {formatBytes(result.file_size)}
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.privacy_risk]}`}>
          <p className="text-sm font-semibold">Gizlilik Riski</p>
          <p className="text-xl font-bold">{result.privacy_risk === "caution" ? "Dikkat" : "Güvenli"}</p>
          <p className="text-sm font-semibold">GPS {result.gps_present ? "Var" : "Yok"}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.citizen_summary}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CompactMetric label="Çekim tarihi" value={formatExifDate(result.datetime_original)} />
        <CompactMetric label="Marka" value={result.camera_make ?? "Veri Yok"} />
        <CompactMetric label="Model" value={result.camera_model ?? "Veri Yok"} />
        <CompactMetric label="Firmware / Yazılım" value={result.software ?? "Veri Yok"} />
        <CompactMetric label="GPS durumu" value={result.gps_present ? "Konum verisi var" : "Konum verisi yok"} />
        <CompactMetric label="Gizlilik riski" value={result.privacy_risk === "caution" ? "Dikkat" : "Güvenli"} />
        <CompactMetric label="Metadata durumu" value={metadataStatus} />
        <CompactMetric label="Fotoğraf türü sinyali" value={photoTypeSignal} />
      </div>

      {result.gps_present ? (
        <InfoPanel
          title="GPS koordinatlari"
          rows={[
            ["Enlem", result.gps_latitude?.toString() ?? "Yok"],
            ["Boylam", result.gps_longitude?.toString() ?? "Yok"]
          ]}
        />
      ) : null}

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik bulgular</summary>
        <div className="mt-4 grid gap-3">
          {result.technical_findings.map((finding) => (
            <article className={`rounded-md border p-3 text-sm ${riskStyles[finding.severity]}`} key={`${finding.title}-${finding.detail}`}>
              <p className="font-bold">{finding.title}</p>
              <p className="mt-1 leading-6">{finding.detail}</p>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}

function ExifResultPanelV2({ result }: { result: ExifAnalysisResult }) {
  const metadataStatus = result.metadata_status ?? getExifMetadataStatus(result);
  const general = result.general_summary;
  const overallLabel = general?.overall_label ?? exifOverallLabel(result.overall_result, result.privacy_risk);
  const confidenceScore = general?.confidence_score ?? result.confidence_score ?? (result.privacy_risk === "caution" ? 78 : 92);
  const riskScore = general?.risk_score ?? result.risk_score ?? (result.privacy_risk === "caution" ? 15 : 0);
  const aiRiskScore = general?.ai_risk_score ?? result.ai_risk_score ?? 0;
  const aiRiskLevel = general?.ai_risk_level ?? result.ai_risk_level ?? exifAiRiskLevel(aiRiskScore);
  const aiLikelihood = general?.ai_generation_likelihood ?? result.ai_generation_likelihood ?? "low";
  const editingTrace = Boolean(general?.editing_trace_present ?? result.editing_trace_present);
  const sourceEstimate = general?.source_estimate ?? result.source_estimate ?? getPhotoTypeSignal(result);
  const trustIndicators = general?.trust_indicators ?? result.trust_indicators ?? [];
  const reviewPoints = general?.review_points ?? result.review_points ?? [];

  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fotoğraf EXIF Analizi</p>
          <h2 className="mt-1 break-words text-2xl font-bold">{result.file_name}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {result.image_width && result.image_height ? `${result.image_width} x ${result.image_height}` : "Görsel boyutu okunamadı"} · {formatBytes(result.file_size)}
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${exifOverallStyle(result.overall_result, result.privacy_risk)}`}>
          <p className="text-sm font-semibold">Genel Sonuç</p>
          <p className="text-xl font-bold">{overallLabel}</p>
          <p className="text-sm font-semibold">Risk {riskScore}/100</p>
        </div>
      </div>

      <ExifSection title="Genel Özet" tone={result.overall_result === "suspicious" ? "risk" : result.overall_result === "review" || result.privacy_risk === "caution" ? "caution" : "safe"}>
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          {general?.citizen_comment ?? result.citizen_summary}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactMetric label="Dosya türü" value={general?.file_type ?? result.file_type ?? "Tespit Edilemedi"} />
          <CompactMetric label="Güven skoru" value={`${confidenceScore}/100`} />
          <CompactMetric label="Risk skoru" value={`${riskScore}/100`} />
          <CompactMetric label="AI risk skoru" value={`${aiRiskScore}/100 (${aiRiskLevel})`} />
          <CompactMetric label="AI üretim olasılığı" value={exifLikelihoodLabel(aiLikelihood)} />
          <CompactMetric label="Düzenleme izi" value={editingTrace ? "Var" : "Yok"} />
          <CompactMetric label="Kaynak tahmini" value={sourceEstimate} />
          <CompactMetric label="GPS" value={result.gps_present ? "Var" : "Yok"} />
          <CompactMetric label="EXIF" value={metadataStatus} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <SignalList title="Güven göstergeleri" items={trustIndicators.length ? trustIndicators : ["Hash üretildi", metadataStatus]} emptyText="Güven göstergesi sınırlı." />
          <SignalList title="İnceleme gerektiren noktalar" items={reviewPoints} emptyText="İnceleme gerektiren güçlü bir sinyal tespit edilmedi." />
        </div>
      </ExifSection>

      <ExifSection title="EXIF Bilgileri">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <CompactMetric label="Çekim tarihi" value={formatExifDate(result.datetime_original)} />
          <CompactMetric label="Marka" value={result.camera_make ?? "Veri Yok"} />
          <CompactMetric label="Model" value={result.camera_model ?? "Veri Yok"} />
          <CompactMetric label="Firmware / Yazılım" value={result.software ?? "Veri Yok"} />
          <CompactMetric label="GPS durumu" value={result.gps_present ? "Konum verisi var" : "Konum verisi yok"} />
          <CompactMetric label="Metadata durumu" value={metadataStatus} />
        </div>
      </ExifSection>

      {result.gps_present ? (
        <InfoPanel
          title="GPS koordinatları"
          rows={[
            ["Enlem", result.gps_latitude?.toString() ?? "Yok"],
            ["Boylam", result.gps_longitude?.toString() ?? "Yok"]
          ]}
        />
      ) : null}

      <ExifSection title="Manipülasyon Analizi" tone={result.manipulation_analysis?.ela_suspicion || editingTrace || aiLikelihood !== "low" ? "caution" : "safe"}>
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          {result.manipulation_analysis?.summary ?? "Manipülasyon veya AI üretimi için güçlü bir teknik sinyal tespit edilmedi."}
        </p>
        <div className="mt-4 grid gap-3">
          <SignalList title="Manipülasyon sinyalleri" items={result.manipulation_analysis?.signals ?? []} emptyText="Belirgin manipülasyon sinyali yok." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CompactMetric label="AI olasılığı" value={exifLikelihoodLabel(aiLikelihood)} />
            <CompactMetric label="AI risk skoru" value={`${aiRiskScore}/100`} />
            <CompactMetric label="Düzenleme izi" value={editingTrace ? "Var" : "Yok"} />
            <CompactMetric label="Düzenleme yazılımı" value={joinValues(result.manipulation_analysis?.editing_software_found ?? [], "Tespit edilmedi", 4)} />
            <CompactMetric label="C2PA / Content Credentials" value={result.manipulation_analysis?.content_credentials_present ? "Sinyal var" : "Tespit edilmedi"} />
          </div>
        </div>
      </ExifSection>

      <ExifSection title="Görsel İçerik Analizi" tone={result.visual_content_analysis?.ai_content_signal === "high" ? "risk" : result.visual_content_analysis?.ai_content_signal === "medium" ? "caution" : "safe"}>
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          {result.visual_content_analysis?.pixel_comment ?? "Piksel istatistikleri belirgin AI/manipülasyon sinyali üretmedi."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <CompactMetric label="AI içerik sinyali" value={exifLikelihoodLabel(result.visual_content_analysis?.ai_content_signal ?? "low")} />
          <CompactMetric label="Kamera gürültüsü" value={result.visual_content_analysis?.camera_noise ?? "Belirsiz"} />
          <CompactMetric label="Kenar tutarlılığı" value={result.visual_content_analysis?.edge_consistency ?? "Belirsiz"} />
          <CompactMetric label="Doku pürüzsüzlüğü" value={result.visual_content_analysis?.texture_smoothness ?? "Belirsiz"} />
          <CompactMetric label="Renk/histogram sinyali" value={result.visual_content_analysis?.color_histogram_signal ?? "Belirsiz"} />
          <CompactMetric label="Piksel skorları" value={exifPixelScoreSummary(result)} />
        </div>
        <SignalList title="Piksel/görsel sinyaller" items={result.visual_content_analysis?.signals ?? []} emptyText="Piksel tabanlı güçlü bir anomali sinyali tespit edilmedi." />
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Bu bölüm piksel istatistiklerine dayalı ön incelemedir. Tek başına kesin AI/manipülasyon tespiti değildir.
        </p>
      </ExifSection>

      <ExifSection title="Kaynak Tahmini">
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          {result.source_analysis?.summary ?? "Kaynak türü için güçlü bir özel sinyal bulunamadı."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactMetric label="Kamera fotoğrafı" value={`${result.source_analysis?.camera_photo_probability ?? 0}%`} />
          <CompactMetric label="Ekran görüntüsü" value={`${result.source_analysis?.screenshot_probability ?? 0}%`} />
          <CompactMetric label="İndirilmiş olabilir" value={`${result.source_analysis?.downloaded_probability ?? 0}%`} />
          <CompactMetric label="WhatsApp aktarımı" value={`${result.source_analysis?.whatsapp_probability ?? 0}%`} />
          <CompactMetric label="Telegram aktarımı" value={`${result.source_analysis?.telegram_probability ?? 0}%`} />
          <CompactMetric label="Sosyal medya sıkıştırması" value={`${result.source_analysis?.social_media_probability ?? 0}%`} />
          <CompactMetric label="AI üretimi" value={`${result.source_analysis?.ai_generated_probability ?? 0}%`} />
          <CompactMetric label="En güçlü tahmin" value={result.source_analysis?.likely_source ?? sourceEstimate} />
        </div>
        <SignalList title="Kaynak sinyalleri" items={result.source_analysis?.signals ?? []} emptyText="Kaynak için güçlü sinyal bulunamadı." />
      </ExifSection>

      <ExifSection title="ELA Haritası" tone={result.manipulation_analysis?.ela_suspicion ? "caution" : "safe"}>
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          {result.ela_warning ?? "ELA ön inceleme sinyalidir; tek başına kesin delil değildir."}
        </p>
        {result.ela_image_base64 ? (
          <img alt="ELA fark haritası" className="mt-4 max-h-[420px] w-full rounded-lg border border-slate-200 object-contain dark:border-white/10" src={result.ela_image_base64} />
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
            Bu dosya için ELA görseli üretilemedi veya format JPEG değil.
          </p>
        )}
        <div className="mt-4">
          <CompactMetric label="ELA fark skoru" value={result.ela_difference_score !== null && result.ela_difference_score !== undefined ? `${result.ela_difference_score}/100` : "Uygulanmadı"} />
        </div>
      </ExifSection>

      <ExifSection title="Adli Bilişim Bilgileri">
        <div className="grid gap-3">
          <InfoPanel
            title="Dosya hash değerleri"
            rows={[
              ["MD5", result.forensic_hashes?.md5 ?? "Üretilmedi"],
              ["SHA1", result.forensic_hashes?.sha1 ?? "Üretilmedi"],
              ["SHA256", result.forensic_hashes?.sha256 ?? "Üretilmedi"]
            ]}
          />
          <InfoPanel
            title="Dosya tutarlılığı"
            rows={[
              ["Uzantı", result.file_integrity?.file_extension ?? "Tespit edilemedi"],
              ["MIME type", result.file_integrity?.declared_content_type ?? "Tespit edilemedi"],
              ["Tespit edilen format", result.file_integrity?.detected_format ?? "Tespit edilemedi"],
              ["Uzantı / içerik uyumu", result.file_integrity?.extension_matches_content === false ? "Uyumsuz" : "Uyumlu"],
              ["MIME / imza uyumu", result.file_integrity?.mime_matches_signature === false ? "Uyumsuz" : "Uyumlu"]
            ]}
          />
          <SignalList title="Tutarlılık uyarıları" items={result.file_integrity?.warnings ?? []} emptyText="Dosya yapısında belirgin uyumsuzluk tespit edilmedi." />
        </div>
      </ExifSection>

      <ExifSection title="OSINT Kontrol Önerileri">
        <p className="leading-7 text-slate-700 dark:text-slate-200">
          Görsel otomatik olarak üçüncü taraf servislere yüklenmez. Aşağıdaki bağlantılar yalnızca manuel kontrol için sunulur.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-secondary" href={result.osint_links?.google_lens ?? "https://lens.google.com/"} rel="noreferrer" target="_blank">Google Lens</a>
          <a className="btn-secondary" href={result.osint_links?.yandex_images ?? "https://yandex.com/images/"} rel="noreferrer" target="_blank">Yandex Images</a>
          <a className="btn-secondary" href={result.osint_links?.bing_visual_search ?? "https://www.bing.com/visualsearch"} rel="noreferrer" target="_blank">Bing Visual Search</a>
        </div>
        <SignalList title="Manuel kontrol notları" items={result.osint_links?.notes ?? []} emptyText="OSINT önerisi bulunamadı." />
      </ExifSection>

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik Detaylar</summary>
        <div className="mt-4 grid gap-3">
          {result.risk_score_breakdown?.length ? (
            <InfoPanel
              title="Risk puanı kırılımı"
              rows={result.risk_score_breakdown.map((item) => [item.label, `${item.points} puan - ${item.detail}`])}
            />
          ) : null}
          {result.ai_signal_breakdown?.length ? (
            <InfoPanel
              title="AI risk puanı kırılımı"
              rows={result.ai_signal_breakdown.map((item) => [
                item.signal,
                `${item.points} puan - Kaynak: ${item.source}. ${item.detail}`
              ])}
            />
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            <SignalList title="Dosya adı sinyalleri" items={result.filename_ai_signals ?? []} emptyText="Dosya adında AI üretim kalıbı görülmedi." />
            <SignalList title="Metadata sinyalleri" items={result.metadata_ai_signals ?? []} emptyText="Metadata içinde AI/prompt/model sinyali görülmedi." />
            <SignalList title="Piksel/gürültü sinyalleri" items={result.pixel_ai_signals ?? []} emptyText="Piksel/gürültü tarafında güçlü sinyal yok." />
            <SignalList title="Kaynak tahmini sinyalleri" items={result.source_analysis?.signals ?? []} emptyText="Kaynak tahmini için güçlü sinyal yok." />
          </div>
          {result.technical_findings.map((finding) => (
            <article className={`rounded-md border p-3 text-sm ${riskStyles[finding.severity]}`} key={`${finding.title}-${finding.detail}`}>
              <p className="font-bold">{finding.title}</p>
              <p className="mt-1 leading-6">{finding.detail}</p>
            </article>
          ))}
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            Bu analiz ön inceleme niteliğindedir. Kesin adli delil niteliği için uzman incelemesi gerekir.
          </p>
        </div>
      </details>
    </section>
  );
}

function IpIntelligenceResultPanel({ result }: { result: IpIntelligenceResult }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">IP Istihbarati</p>
          <h2 className="mt-1 break-words text-2xl font-bold">{result.ip ?? result.input}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {result.is_public ? "Genel IP tehdit istihbaratı" : "Genel olmayan IP / bilgi modu"}
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${riskStyles[result.risk_level]}`}>
          <p className="text-sm font-semibold">Risk Skoru</p>
          <p className="text-3xl font-bold">{result.risk_score ?? 0}</p>
          <p className="text-sm font-semibold">{ipRiskLabels[result.risk_level]}</p>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {result.citizen_summary}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetric label="IP" value={result.ip ?? result.input} />
        <CompactMetric
          helper={!result.ip_info.country ? "RDAP kaynağı ülke bilgisi döndürmedi." : undefined}
          label="Ülke"
          value={result.ip_info.country ?? "Tespit Edilemedi"}
        />
        <CompactMetric label="ASN / Handle" value={result.ip_info.asn ?? "Bilinmiyor"} clamp />
        <CompactMetric label="VPN/Proxy" value={privacyLabel(result.privacy_signals.vpn_proxy_possibility)} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <InfoPanel
          title="IP bilgileri"
          rows={[
            ["Organizasyon", result.ip_info.organization ?? "Bilinmiyor"],
            ["Network", result.ip_info.network_name ?? "Bilinmiyor"],
            ["Abuse contact", result.ip_info.abuse_contact ?? "Yok"],
            ["Public IP", yesNo(result.is_public)]
          ]}
        />
        <InfoPanel
          title="Altyapi sinyalleri"
          rows={[
            ["Sağlayıcı", result.infrastructure.provider ?? "Bilinmiyor"],
            ["CDN", yesNo(result.infrastructure.is_cdn)],
            ["Hosting", yesNo(result.infrastructure.is_hosting)],
            ["Veri merkezi", yesNo(result.infrastructure.is_datacenter)]
          ]}
        />
      </div>

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik detaylar ve risk kirilimi</summary>
        <div className="mt-4 grid gap-3">
          {result.risk_score_breakdown.length ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950">
              <p className="font-bold">Risk puani açıklaması</p>
              <div className="mt-3 grid gap-2">
                {result.risk_score_breakdown.map((item) => (
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
              Risk puanini artiran belirgin bir IP istihbarati maddesi bulunmadi.
            </p>
          )}

          {result.technical_findings.map((finding) => (
            <article className={`rounded-md border p-3 text-sm ${riskStyles[finding.severity]}`} key={`${finding.title}-${finding.detail}`}>
              <p className="font-bold">{finding.title}</p>
              <p className="mt-1 leading-6">{finding.detail}</p>
            </article>
          ))}

          {result.privacy_signals.notes.map((note) => (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300" key={note}>
              {note}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}

function EnhancedSiteSafetyResultPanel({ result }: { result: SiteSafetyResult }) {
  const riskBreakdown = result.risk_score_breakdown ?? [];
  const securityHeaders = result.security_headers;
  const threatIntel = result.threat_intel;
  const generalEvaluation = buildSiteSafetyGeneralEvaluation(result);
  const technicalRiskLabel = result.technical_risk_label ?? result.risk_label ?? riskLabels[result.risk_level];
  const citizenRiskLevel = result.citizen_risk_level ?? "Düşük teknik risk, yine de doğrula";
  const siteCategory = result.site_category ?? "Genel / Bilgilendirme";
  const brandLabel = result.brand_impersonation_risk && result.suspected_brand ? result.suspected_brand : null;
  const allNotes = [
    ...(result.url_analysis.notes ?? []),
    ...result.dns_info.notes,
    ...result.domain_info.notes,
    ...result.ssl_info.notes,
    ...result.mail_security.notes,
    ...result.ip_info.notes,
    ...(securityHeaders?.notes ?? []),
    ...(threatIntel?.notes ?? [])
  ];

  return (
    <section className="premium-card min-w-0 p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Site Güvenlik Kontrolü</p>
          <h2 className="mt-1 break-words text-2xl font-bold [overflow-wrap:break-word] [word-break:normal]">{result.url_analysis.domain}</h2>
          <p className="mt-2 whitespace-normal break-words text-sm leading-6 text-slate-600 [overflow-wrap:break-word] [word-break:normal] dark:text-slate-300">
            {result.url_analysis.normalized_url}
          </p>
        </div>
        <div className={`grid w-full min-w-0 gap-2 sm:w-auto ${brandLabel ? "sm:min-w-[520px] sm:grid-cols-2 lg:grid-cols-4" : "sm:min-w-[420px] sm:grid-cols-3"}`}>
          <SummaryBadge label="Teknik Risk" tone={result.risk_level} value={`${result.risk_score} / ${technicalRiskLabel}`} />
          <SummaryBadge label="Vatandaş Riski" tone={citizenRiskTone(citizenRiskLevel)} value={citizenRiskLevel} />
          <SummaryBadge label="Site Türü" tone="caution" value={siteCategory} />
          {brandLabel ? <SummaryBadge label="Marka Taklidi" tone="risk" value={brandLabel} /> : null}
        </div>
      </div>

      <article className="mt-5 rounded-lg border border-cyan-200/60 bg-cyan-50/80 p-4 shadow-sm sm:p-5 dark:border-cyan-300/20 dark:bg-cyan-300/10">
        <p className="text-sm font-bold text-cyan-800 dark:text-cyan-100">Genel Değerlendirme</p>
        <div className="mt-2 grid max-w-5xl gap-3 whitespace-normal break-words text-sm leading-7 text-slate-700 [overflow-wrap:break-word] [word-break:normal] sm:text-base dark:text-slate-200">
          {generalEvaluation.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DecisionPanel
          title="Bu site neden güvenli görünüyor?"
          body={result.safe_summary ?? "Güvenli görünen sinyaller sınırlı; bu durum tek başına risk anlamına gelmez."}
          footer="Bu alan kesin hüküm değil, teknik sinyal özetidir."
        />
        <DecisionPanel
          title="Hangi noktalar riskli?"
          body={result.risk_summary ?? "Risk puanını artıran belirgin bir teknik sinyal görülmedi."}
          footer={`${riskBreakdown.length} risk puanı maddesi değerlendirildi.`}
        />
        <DecisionPanel
          title="Vatandaş ne yapmalı?"
          body={(result.public_advice ?? ["Adres çubuğundaki domaini işlem yapmadan önce tekrar kontrol edin."]).join(" ")}
          footer="Şifre, ödeme veya kimlik bilgisi paylaşmadan önce resmi kaynağı doğrulayın."
        />
      </div>

      <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="HTTP durum" value={httpStatusLabel(result.url_analysis.http_status)} />
        <Metric label="Alan adı yaşı" value={result.domain_info.domain_age_days !== null ? `${result.domain_info.domain_age_days} gün` : "Tespit Edilemedi"} />
        <Metric label="SSL/TLS" value={result.ssl_info.status ?? (result.ssl_info.valid ? "Geçerli" : "Tespit Edilemedi")} />
        <Metric
          label="Posta güvenliği"
          value={result.mail_security.spoofing_risk === "safe" ? "Temel kayıtlar mevcut" : result.mail_security.has_mx ? "Kontrol önerilir" : "Mail hizmeti belirsiz"}
        />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <InfoPanel
          title="URL ve yönlendirme"
          rows={[
            ["İlk URL", displayValue(result.url_analysis.original_url ?? result.url_analysis.normalized_url)],
            ["Normalize URL", displayValue(result.url_analysis.normalized_url)],
            ["Final URL", displayValue(result.url_analysis.final_url)],
            ["Redirect sayısı", result.url_analysis.redirect_chain.length ? `${result.url_analysis.redirect_chain.length} adım` : "Yönlendirme görülmedi"],
            ["Kısa link", yesNo(result.url_analysis.is_short_link)],
            ["Şüpheli kelimeler", joinValues(result.url_analysis.suspicious_keywords, "Şüpheli kelime görülmedi")]
          ]}
        />
        <InfoPanel
          title="HTTP güvenlik başlıkları"
          rows={[
            ["HSTS", displayValue(securityHeaders?.hsts, "Tespit Edilemedi")],
            ["CSP", displayValue(securityHeaders?.content_security_policy, "Tespit Edilemedi")],
            ["X-Frame-Options", displayValue(securityHeaders?.x_frame_options, "Tespit Edilemedi")],
            ["X-Content-Type-Options", displayValue(securityHeaders?.x_content_type_options, "Tespit Edilemedi")],
            ["Referrer-Policy", displayValue(securityHeaders?.referrer_policy, "Tespit Edilemedi")],
            ["Eksikler", joinValues(securityHeaders?.missing ?? [], "Eksik başlık görülmedi")]
          ]}
        />
        <InfoPanel
          title="Alan adı bilgileri"
          rows={[
            ["Registrar", displayValue(result.domain_info.registrar)],
            ["Registrar IANA ID", displayValue(result.domain_info.registrar_iana_id)],
            ["Kayıt tarihi", displayValue(result.domain_info.created_at)],
            ["Güncelleme tarihi", displayValue(result.domain_info.updated_at)],
            ["Bitiş tarihi", displayValue(result.domain_info.expires_at)],
            ["Abuse contact", displayValue(result.domain_info.abuse_contact, "Tespit Edilemedi")],
            ["Durum kodları", joinValues(result.domain_info.status_codes ?? [], "Veri Yok")]
          ]}
        />
        <InfoPanel
          title="SSL/TLS güvenliği"
          rows={[
            ["Durum", result.ssl_info.status ?? (result.ssl_info.valid ? "Geçerli" : "Tespit Edilemedi")],
            ["Issuer", displayValue(result.ssl_info.issuer)],
            ["Subject", displayValue(result.ssl_info.subject)],
            ["Başlangıç", displayValue(result.ssl_info.valid_from)],
            ["Bitiş", displayValue(result.ssl_info.expires_at)],
            ["Kalan gün", result.ssl_info.days_remaining !== null ? result.ssl_info.days_remaining.toString() : "Tespit Edilemedi"],
            ["TLS sürümü", displayValue(result.ssl_info.tls_version)]
          ]}
        />
        <InfoPanel
          title="DNS özeti"
          rows={[
            ["A", joinValues(result.dns_info.a, "A kaydı yok", 4)],
            ["AAAA", joinValues(result.dns_info.aaaa, "AAAA kaydı yok", 3)],
            ["CNAME", joinValues(result.dns_info.cname ?? [], "CNAME kaydı yok", 3)],
            ["MX", joinValues(result.dns_info.mx, "MX kaydı yok", 3)],
            ["NS", joinValues(result.dns_info.ns, "NS kaydı yok", 4)],
            ["CDN/WAF", result.dns_info.waf_provider ?? result.dns_info.cdn_provider ?? "Tespit Edilemedi"]
          ]}
        />
        <InfoPanel
          title="E-posta güvenliği"
          rows={[
            ["MX", result.mail_security.has_mx ? "E-posta sunucusu tanımlı" : "Bu alan adına tanımlı e-posta sunucusu bulunamadı"],
            ["SPF", yesNo(result.mail_security.has_spf)],
            ["DMARC", yesNo(result.mail_security.has_dmarc)],
            ["DKIM", result.mail_security.has_dkim_signal ? "DKIM sinyali görüldü" : "Doğrulanamadı"],
            ["Spoofing riski", riskLabels[result.mail_security.spoofing_risk]]
          ]}
        />
        <InfoPanel
          title="IP bilgileri"
          rows={[
            ["IP", displayValue(result.ip_info.ip)],
            ["Ülke", displayValue(result.ip_info.country, "Tespit Edilemedi")],
            ["ASN", displayValue(result.ip_info.asn)],
            ["Organizasyon", displayValue(result.ip_info.organization)],
            ["Network", displayValue(result.ip_info.network_name)],
            ["Hosting/CDN/ISP tahmini", displayValue(result.ip_info.hosting)]
          ]}
        />
        <InfoPanel
          title="Tehdit istihbaratı"
          rows={[
            ["Kontrol edilen kaynaklar", joinValues(threatIntel?.checked_sources ?? [], "Aktif kaynak yok")],
            ["Atlanan kaynaklar", joinValues(threatIntel?.skipped_sources ?? [], "Atlanan kaynak yok")],
            ["Zararlı kayıt", threatIntel?.malicious_count?.toString() ?? "0"],
            ["Şüpheli kayıt", threatIntel?.suspicious_count?.toString() ?? "0"]
          ]}
        />
      </div>

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik detaylar, DNS kayıtları ve bulgular</summary>
        <div className="mt-4 grid gap-3">
          {riskBreakdown.length ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950">
              <p className="font-bold">Risk puanı açıklaması</p>
              <div className="mt-3 grid gap-2">
                {riskBreakdown.map((item) => (
                  <div className="flex flex-col gap-2 rounded-md border border-slate-100 p-3 dark:border-white/10 md:flex-row md:items-start md:justify-between" key={`${item.label}-${item.points}`}>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="mt-1 whitespace-normal break-words leading-6 text-slate-600 [overflow-wrap:break-word] [word-break:normal] dark:text-slate-300">{item.detail}</p>
                    </div>
                    <span className="w-fit shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">
                      +{item.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
              Risk puanını artıran belirgin bir teknik madde bulunmadı.
            </p>
          )}
          <InfoPanel
            title="Detaylı DNS kayıtları"
            rows={[
              ["TXT", joinValues(result.dns_info.txt, "TXT kaydı yok")],
              ["SOA", joinValues(result.dns_info.soa ?? [], "SOA kaydı yok")],
              ["CAA", joinValues(result.dns_info.caa ?? [], "CAA kaydı yok")],
              ["PTR", joinValues(result.dns_info.ptr ?? [], "PTR kaydı yok")],
              ["SAN", joinValues(result.ssl_info.san ?? [], "SAN alanı okunamadı")]
            ]}
          />
          {result.ip_records?.length ? (
            <InfoPanel
              title="IP / ASN kayıtları"
              rows={result.ip_records.map((record) => [
                record.ip,
                [record.asn, record.organization, record.network_name, record.provider, record.country].filter(Boolean).join(" · ") || "Detay tespit edilemedi"
              ])}
            />
          ) : null}
          {result.url_analysis.redirect_chain.length ? (
            <InfoPanel
              title="Redirect zinciri"
              rows={result.url_analysis.redirect_chain.map((hop, index) => [`${index + 1}. adım`, `${hop.status_code ?? "Durum yok"} · ${hop.url}`])}
            />
          ) : null}
          {result.technical_findings.length ? (
            result.technical_findings.map((finding) => (
              <article className={`rounded-md border p-3 text-sm ${riskStyles[finding.severity]}`} key={`${finding.title}-${finding.detail}`}>
                <p className="font-bold">{finding.title}</p>
                <p className="mt-1 whitespace-normal break-words leading-6 [overflow-wrap:break-word] [word-break:normal]">{finding.detail}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">Belirgin teknik risk bulgusu listelenmedi.</p>
          )}
          {allNotes.length ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950">
              <p className="font-bold">Bilgi Notları / Doğrulanamayan Bilgiler</p>
              <div className="mt-3 grid gap-2">
                {allNotes.map((note) => (
                  <p className="whitespace-normal break-words rounded-md border border-slate-100 p-3 text-slate-600 [overflow-wrap:break-word] [word-break:normal] dark:border-white/10 dark:text-slate-300" key={note}>
                    {note}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function SiteSafetyResultPanel({ result }: { result: SiteSafetyResult }) {
  const riskBreakdown = result.risk_score_breakdown ?? [];

  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Site Güvenlik Kontrolü</p>
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
        <Metric label="HTTP durum" value={httpStatusLabel(result.url_analysis.http_status)} />
        <Metric label="Domain yaşı" value={result.domain_info.domain_age_days !== null ? `${result.domain_info.domain_age_days} gün` : "Bilinmiyor"} />
        <Metric label="SSL" value={result.ssl_info.valid ? "Geçerli" : "Kontrol gerekli"} />
        <Metric label="Mail güvenliği" value={result.mail_security.spoofing_risk === "safe" ? "İyi" : result.mail_security.spoofing_risk === "caution" ? "Dikkat" : "Risk"} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <InfoPanel
          title="Domain bilgileri"
          rows={[
            ["Registrar", result.domain_info.registrar ?? "Bilinmiyor"],
            ["Kayıt tarihi", result.domain_info.created_at ?? "Bilinmiyor"],
            ["Bitiş tarihi", result.domain_info.expires_at ?? "Bilinmiyor"],
            ["Abuse contact", result.domain_info.abuse_contact ?? "Yok"]
          ]}
        />
        <InfoPanel
          title="SSL güvenliği"
          rows={[
            ["Durum", result.ssl_info.valid ? "Geçerli" : "Kontrol gerekli"],
            ["Issuer", result.ssl_info.issuer ?? "Bilinmiyor"],
            ["Bitiş", result.ssl_info.expires_at ?? "Bilinmiyor"],
            ["Kalan gün", result.ssl_info.days_remaining !== null ? result.ssl_info.days_remaining.toString() : "Bilinmiyor"]
          ]}
        />
        <InfoPanel
          title="DNS özeti"
          rows={[
            ["A", result.dns_info.a.slice(0, 3).join(", ") || "Yok"],
            ["AAAA", result.dns_info.aaaa.slice(0, 2).join(", ") || "Yok"],
            ["MX", result.dns_info.mx.slice(0, 2).join(", ") || "Yok"],
            ["NS", result.dns_info.ns.slice(0, 2).join(", ") || "Yok"]
          ]}
        />
        <InfoPanel
          title="Mail güvenliği"
          rows={[
            ["SPF", yesNo(result.mail_security.has_spf)],
            ["DMARC", yesNo(result.mail_security.has_dmarc)],
            ["DKIM", result.mail_security.has_dkim_signal ? "DKIM sinyali görüldü" : "Doğrulanamadı"],
            ["Spoofing riski", riskLabels[result.mail_security.spoofing_risk]]
          ]}
        />
        <InfoPanel
          title="IP bilgileri"
          rows={[
            ["IP", result.ip_info.ip ?? "Bilinmiyor"],
            ["Ülke", result.ip_info.country ?? "Bilinmiyor"],
            ["ASN", result.ip_info.asn ?? "Bilinmiyor"],
            ["Hosting", result.ip_info.hosting ?? "Bilinmiyor"]
          ]}
        />
        <InfoPanel
          title="URL bulguları"
          rows={[
            ["Final URL", result.url_analysis.final_url ?? "Yok"],
            ["Redirect", result.url_analysis.redirect_chain.length ? `${result.url_analysis.redirect_chain.length} adım` : "Yok"],
            ["Kısa link", yesNo(result.url_analysis.is_short_link)],
            ["Şüpheli kelime", result.url_analysis.suspicious_keywords.join(", ") || "Yok"]
          ]}
        />
      </div>

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <summary className="cursor-pointer font-bold">Teknik detaylar ve bulgular</summary>
        <div className="mt-4 grid gap-3">
          {riskBreakdown.length ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950">
              <p className="font-bold">Risk puani açıklaması</p>
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
    <article className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-bold sm:text-base">{title}</h3>
      <div className="mt-3 grid gap-3">
        {rows.map(([label, value]) => (
          <div className="grid min-w-0 gap-1 text-sm" key={label}>
            <p className="font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="whitespace-normal break-words text-sm leading-6 text-slate-800 [overflow-wrap:break-word] [word-break:normal] sm:text-[15px] dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function CompactMetric({ clamp = false, helper, label, value }: { clamp?: boolean; helper?: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-2 min-w-0 whitespace-normal break-words text-sm font-semibold leading-6 text-slate-900 [overflow-wrap:break-word] [word-break:normal] dark:text-slate-100 ${
          clamp ? "line-clamp-3" : ""
        }`}
        title={value}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? "Var" : "Yok";
}

function displayValue(value: string | null | undefined, fallback = "Tespit Edilemedi") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function httpStatusLabel(status: number | null | undefined) {
  if (status === 403) {
    return "403 - Koruma sistemi veya bot engeli nedeniyle otomatik analiz sınırlanmış olabilir.";
  }
  if (status === 429) {
    return "429 - Çok fazla istek nedeniyle geçici sınırlama uygulanmış olabilir.";
  }
  if (status === null || typeof status === "undefined") {
    return "Otomatik analiz sırasında HTTP durumu doğrulanamadı.";
  }
  return status.toString();
}

function joinValues(values: string[], fallback: string, limit?: number) {
  const cleanValues = values.map((value) => value.trim()).filter(Boolean);
  if (!cleanValues.length) return fallback;
  const visible = typeof limit === "number" ? cleanValues.slice(0, limit) : cleanValues;
  const suffix = typeof limit === "number" && cleanValues.length > limit ? ` (+${cleanValues.length - limit} kayıt teknik detayda)` : "";
  return `${visible.join(", ")}${suffix}`;
}

function buildSiteSafetyGeneralEvaluation(result: SiteSafetyResult) {
  const siteCategory = result.site_category ?? "Genel / Bilgilendirme";
  const citizenRiskLevel = result.citizen_risk_level ?? "Düşük teknik risk, yine de doğrula";
  const categoryWarning =
    result.category_warning ??
    "SSL/TLS veya HTTP erişimi tek başına sitenin güvenilir, yasal ya da resmi olduğu anlamına gelmez.";
  const categoryIntro = categoryIntroForSiteSafety(siteCategory, result.risk_score);
  const paragraphs: string[] = [];

  if (result.brand_impersonation_risk && result.brand_warning) {
    paragraphs.push(result.brand_warning);
  }

  paragraphs.push(`Site türü: ${siteCategory}`);
  paragraphs.push(`Vatandaş riski: ${citizenRiskLevel}`);
  paragraphs.push(categoryIntro);

  if (!result.brand_impersonation_risk) {
    paragraphs.push(categoryWarning);
  }

  const positiveSignals: string[] = [];
  if (result.ssl_info.valid || result.ssl_info.status === "Geçerli") {
    positiveSignals.push("SSL/TLS sertifikası geçerli görünüyor.");
  }

  if (result.mail_security.has_spf && result.mail_security.has_dmarc) {
    positiveSignals.push("E-posta sahteciliğine karşı SPF ve DMARC kayıtları görüldü.");
  } else if (result.mail_security.has_spf || result.mail_security.has_dmarc) {
    positiveSignals.push("E-posta güvenlik kayıtları mevcut.");
  }

  if (result.dns_info.waf_provider || result.dns_info.cdn_provider) {
    positiveSignals.push("Cloudflare/CDN koruma katmanı kullanıldığı görüldü.");
  }

  const domainAgeText = domainAgeLabel(result.domain_info.domain_age_days);
  if (typeof result.domain_info.domain_age_days === "number" && result.domain_info.domain_age_days > 365) {
    positiveSignals.push(domainAgeText);
  }

  const unverifiedSignals: string[] = [];
  if (!result.ssl_info.valid && result.ssl_info.status === "Tespit Edilemedi") {
    unverifiedSignals.push("SSL/TLS bağlantı testi doğrulanamadı.");
  }
  if (result.domain_info.domain_age_days === null) {
    unverifiedSignals.push(domainAgeText);
  }
  if (!result.mail_security.has_dkim_signal) {
    unverifiedSignals.push("DKIM selector bilinmediği için doğrulanamadı.");
  }

  const riskSignals = (result.risk_score_breakdown ?? [])
    .filter((item) => !/RDAP|WHOIS|DKIM/i.test(item.label))
    .slice(0, 3)
    .map((item) => item.label);

  paragraphs.push("Teknik sinyaller:");
  if (positiveSignals.length) {
    positiveSignals.forEach((signal) => paragraphs.push(`• ${signal}`));
  } else {
    paragraphs.push("• Olumlu teknik sinyaller sınırlı görünüyor; bu durum tek başına risk anlamına gelmez.");
  }
  if (riskSignals.length) {
    paragraphs.push(`• Teknik risk puanını artıran başlıca sinyaller: ${riskSignals.join(", ")}.`);
  }

  if (unverifiedSignals.length) {
    paragraphs.push("Doğrulanamayan bilgiler:");
    unverifiedSignals.forEach((signal) => paragraphs.push(`• ${signal}`));
  }

  paragraphs.push(
    "Bu değerlendirme kesin hüküm değildir; teknik sinyallerin otomatik özetidir. İşlem yapmadan önce adres bilgisini doğrulamanız tavsiye edilir."
  );
  return paragraphs;
}

function categoryIntroForSiteSafety(category: string, score: number) {
  if (category === "Bahis / Kumar") {
    return "🎰 Bu alan adı çevrim içi bahis/kumar hizmeti sunuyor gibi görünmektedir.";
  }
  if (category === "Kripto") {
    return "🪙 Bu site kripto para veya dijital varlık hizmeti sunuyor gibi görünmektedir.";
  }
  if (category === "Yatırım / Forex") {
    return "📈 Bu site yatırım/forex hizmeti sunuyor gibi görünmektedir.";
  }
  if (category === "Kargo / Teslimat") {
    return "📦 Bu site kargo/teslimat işlemiyle ilişkili görünüyor.";
  }
  if (category === "Banka / Finans") {
    return "🏦 Bu site finansal işlem veya banka hizmetiyle ilişkili görünüyor.";
  }
  if (category === "E-Ticaret") {
    return "🛒 Bu site alışveriş/e-ticaret hizmeti sunuyor gibi görünmektedir.";
  }
  if (category === "Bilgilendirme / Güvenlik Portalı") {
    return "🛡️ Bu site bilgilendirme veya siber güvenlik farkındalığı içeriği sunuyor gibi görünmektedir.";
  }
  if (category === "Resmi kurum taklidi / Şüpheli") {
    return "🚨 Bu alan adı resmi kamu hizmeti izlenimi veriyor ancak resmi .gov.tr alan adıyla eşleşmiyor.";
  }
  if (score <= 20) {
    return "🟢 Bu site için yapılan teknik incelemede belirgin bir tehdit göstergesi tespit edilmedi.";
  }
  if (score <= 49) {
    return "🟡 Bu sitede dikkat gerektiren bazı teknik sinyaller tespit edildi.";
  }
  return "🔴 Bu siteyle ilgili birden fazla teknik risk göstergesi bulundu.";
}

function domainAgeLabel(ageDays: number | null) {
  if (ageDays === null) return "Alan adı kayıt tarihi doğrulanamadı.";
  if (ageDays <= 30) return "Alan adı çok yeni oluşturulmuş görünüyor.";
  if (ageDays <= 90) return "Alan adı yeni sayılabilecek bir süredir aktif görünüyor.";
  if (ageDays <= 365) return "Alan adı bir süredir aktif görünüyor.";
  return "Alan adı uzun süredir aktif görünüyor.";
}

function privacyLabel(value: IpIntelligenceResult["privacy_signals"]["vpn_proxy_possibility"]) {
  if (value === "possible") return "Olasi";
  if (value === "low") return "Düşük";
  return "Bilinmiyor";
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExifDate(value: string | null) {
  if (!value) return "Tespit Edilemedi";
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})\s+(.+)$/);
  if (!match) return value;
  return `${match[3]}.${match[2]}.${match[1]} ${match[4]}`;
}

function getExifMetadataStatus(result: ExifAnalysisResult) {
  const presentFields = [
    result.camera_make,
    result.camera_model,
    result.software,
    result.datetime_original,
    result.gps_present ? "gps" : null
  ].filter(Boolean).length;

  if (presentFields >= 2) return "EXIF mevcut";
  if (presentFields === 1) return "Sınırlı metadata";
  return "Metadata bulunamadi";
}

function getPhotoTypeSignal(result: ExifAnalysisResult) {
  if (result.camera_make || result.camera_model) {
    return "Kamera fotografi olabilir";
  }
  const lowResolution = Boolean(result.image_width && result.image_height && result.image_width <= 1280 && result.image_height <= 1280);
  if (lowResolution && getExifMetadataStatus(result) === "Metadata bulunamadi") {
  return "Ekran görüntüsü veya düzenlenmiş görsel olabilir";
  }
  return "Kaynak turu net değil";
}

function exifOverallLabel(overallResult: ExifAnalysisResult["overall_result"], privacyRisk: ExifAnalysisResult["privacy_risk"]) {
  if (overallResult === "suspicious") return "Manipülasyon Şüphesi";
  if (overallResult === "review") return "İncelenmeli";
  return privacyRisk === "caution" ? "İncelenmeli" : "Orijinal Görünüyor";
}

function exifOverallStyle(overallResult: ExifAnalysisResult["overall_result"], privacyRisk: ExifAnalysisResult["privacy_risk"]) {
  if (overallResult === "suspicious") return riskStyles.risk;
  if (overallResult === "review" || privacyRisk === "caution") return riskStyles.caution;
  return riskStyles.safe;
}

function exifLikelihoodLabel(value: ExifAnalysisResult["ai_generation_likelihood"]) {
  if (value === "high") return "Yüksek";
  if (value === "medium") return "Orta";
  return "Düşük";
}

function exifAiRiskLevel(score: number) {
  if (score >= 50) return "Yüksek";
  if (score >= 25) return "Orta";
  return "Düşük";
}

function exifPixelScoreSummary(result: ExifAnalysisResult) {
  const analysis = result.visual_content_analysis;
  if (!analysis) return "Veri yok";
  return `Gürültü ${analysis.noise_score ?? "-"} · Kenar ${analysis.edge_score ?? "-"} · Doku ${analysis.texture_score ?? "-"}`;
}

function ExifSection({ children, title, tone = "safe" }: { children: ReactNode; title: string; tone?: RiskLevel }) {
  return (
    <section className={`mt-5 rounded-lg border p-4 sm:p-5 ${tone === "risk" ? riskStyles.risk : tone === "caution" ? riskStyles.caution : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}>
      <h3 className="text-base font-bold text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SignalList({ emptyText, items, title }: { emptyText: string; items: string[]; title: string }) {
  const visibleItems = items.filter(Boolean);
  return (
    <article className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
      {visibleItems.length ? (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {visibleItems.map((item) => (
            <li className="break-words [overflow-wrap:anywhere]" key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{emptyText}</p>
      )}
    </article>
  );
}

function DecisionPanel({ body, footer, title }: { body: string; footer: string; title: string }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-bold leading-6 text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 whitespace-normal break-words text-sm leading-7 text-slate-600 [overflow-wrap:break-word] [word-break:normal] dark:text-slate-300">{body}</p>
      <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">{footer}</p>
    </article>
  );
}

function SummaryBadge({ label, tone, value }: { label: string; tone: RiskLevel; value: string }) {
  return (
    <div className={`min-w-0 rounded-lg border px-3 py-3 text-left ${riskStyles[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.06em]">{label}</p>
      <p className="mt-1 whitespace-normal break-words text-sm font-bold leading-5 [overflow-wrap:break-word] [word-break:normal]">{value}</p>
    </div>
  );
}

function StatusBadge({ label, tone, value }: { label: string; tone: RiskLevel; value: string }) {
  return (
    <div className={`min-w-0 rounded-lg border px-4 py-3 shadow-sm ${riskStyles[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.06em]">{label}</p>
      <p className="mt-2 whitespace-normal break-words text-base font-bold leading-6 [overflow-wrap:break-word] [word-break:normal]">{value}</p>
    </div>
  );
}

function phishingRiskStyle(score: number) {
  if (score <= 20) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200";
  }
  if (score <= 49) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200";
  }
  if (score <= 79) {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200";
  }
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200";
}

function phishingRiskDisplay(score: number) {
  if (score <= 20) return { icon: "🟢", label: "DÜŞÜK" };
  if (score <= 49) return { icon: "🟡", label: "ŞÜPHELİ" };
  return { icon: "🔴", label: "YÜKSEK" };
}

function phishingTopSummary(score: number) {
  if (score <= 20) return "Belirgin oltalama sinyali görülmedi.";
  if (score <= 49) return "Bağlantı dikkatli incelenmelidir.";
  return "Bu bağlantı oltalama amacı taşıyor olabilir.";
}

function phishingScoreExplanation(signals: string[], brandRisk?: boolean, isShortLink?: boolean) {
  const reasons: string[] = [];
  if (brandRisk) reasons.push("marka taklidi");
  if (signals.some((signal) => /ödeme|odeme|kart|iban|payment/i.test(signal))) reasons.push("ödeme kelimeleri");
  if (signals.some((signal) => /sms|otp|kod/i.test(signal))) reasons.push("kimlik doğrulama sinyalleri");
  if (signals.some((signal) => /login|verify|giriş|giris|hesap/i.test(signal))) reasons.push("giriş/hesap sinyalleri");
  if (isShortLink) reasons.push("kısa link kullanımı");
  if (!reasons.length && signals.length) reasons.push("teknik sinyaller");
  if (!reasons.length) return "Risk puanı; belirgin oltalama sinyali görülmediği için düşük hesaplanmıştır.";
  return `Risk puanı; ${reasons.slice(0, 4).join(", ")} üzerinden hesaplanmıştır.`;
}

function buildPrioritizedPhishingSignals(result: PhishingResult, signals: string[]) {
  const brand = result.suspected_brand;
  if (!result.brand_impersonation_risk || !brand) return signals;

  const criticalSignals = [
    `🚨 ${brand} marka taklidi tespit edildi.`,
    brand === "PTT" ? "🚨 Resmi PTT alan adıyla eşleşmiyor." : "🚨 Resmi alan adıyla eşleşmiyor."
  ];
  const remainingSignals = signals.filter((signal) => !signal.toLocaleLowerCase("tr-TR").includes("marka/resmi kurum taklidi"));
  return [...criticalSignals, ...remainingSignals];
}

function sortPhishingSignals(signals: string[]) {
  const priority = (signal: string) => {
    const lowered = signal.toLocaleLowerCase("tr-TR");
    if (lowered.includes("marka") && lowered.includes("taklidi")) return 1;
    if (["banka", "resmi", "kurum", "e-devlet", "edevlet"].some((word) => lowered.includes(word))) return 2;
    if (["ödeme", "odeme", "kart", "iban", "payment"].some((word) => lowered.includes(word))) return 3;
    if (["sms", "otp", "kod"].some((word) => lowered.includes(word))) return 4;
    if (["login", "verify", "giriş", "giris", "hesap"].some((word) => lowered.includes(word))) return 5;
    if (["kargo", "teslimat", "cargo", "delivery"].some((word) => lowered.includes(word))) return 6;
    if (lowered.includes("kısa link")) return 7;
    if (["redirect", "yönlendirme"].some((word) => lowered.includes(word))) return 8;
    return 9;
  };
  return [...signals].sort((first, second) => priority(first) - priority(second));
}

function citizenRiskTone(value: string): RiskLevel {
  const normalized = value.toLocaleLowerCase("tr-TR");
  if (normalized.includes("yüksek")) return "risk";
  if (normalized.includes("dikkat")) return "caution";
  return "safe";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 whitespace-normal break-words text-base font-bold leading-7 text-slate-950 [overflow-wrap:break-word] [word-break:normal] sm:text-lg dark:text-white">{value}</p>
    </div>
  );
}

function HistoryPanel({ history }: { history: AnalysisHistoryItem[] }) {
  return (
    <section className="premium-card p-5">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold">Analiz geçmişi</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">PostgreSQL bagliysa son analizler burada listelenir.</p>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{history.length} kayıt</p>
      </div>
      <p className="py-6 text-sm text-slate-600 dark:text-slate-300">
        {history.length === 0 ? "Kayıtlı analiz bulunmuyor veya backend geçmiş endpointine ulaşılamadı." : "Son analizler yüklendi."}
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
    reasons.push("Adres yapısı standart URL formatına uymadığı için ek kontrol gerekir.");
  }

  if (parsed && parsed.protocol !== "https:") {
    risk += 18;
    signals.push("HTTPS kullanımı görülmedi.");
    reasons.push("Giriş veya ödeme isteyen sayfalarda HTTPS olmaması önemli bir şüpheli sinyaldir.");
  }

  if (isIpAddress(hostname)) {
    risk += 18;
    signals.push("Alan adı yerine IP adresi kullanılıyor.");
    reasons.push("Marka veya kurum sayfalarında doğrudan IP kullanımı kullanıcı için doğrulama zorluğu oluşturur.");
  }

  if (isShortener(hostname)) {
    risk += 14;
    signals.push("Kısa link servisi tespit edildi.");
    reasons.push("Kısa linkler hedef adresi gizleyebildiği için phishing kampanyalarında sık kullanılır.");
  }

  if (hostname.includes("@") || href.includes("%40")) {
    risk += 20;
    signals.push("URL içinde yönlendirme/kimlik karıştırma paterni var.");
  }

  if ((hostname.match(/-/g) ?? []).length >= 2) {
    risk += 8;
    signals.push("Alan adında birden fazla tire kullanımı var.");
  }

  if (hostname.split(".").length >= 4) {
    risk += 8;
    signals.push("Çok katmanlı alt alan adı yapısı görüldü.");
  }

  const brandSignal = detectBrandImpersonation(hostname);
  if (brandSignal) {
    risk += 26;
    signals.push(brandSignal);
    reasons.push("Alan adı, bilinen bir marka veya kurum adını andırıyor ancak resmi alan adıyla birebir eşleşmiyor.");
  }

  const suspiciousWords = ["login", "verify", "secure", "account", "ödeme", "kargo", "hediye", "kampanya", "destek", "doğrula"];
  const matchedWords = suspiciousWords.filter((word) => href.toLowerCase().includes(word));
  if (matchedWords.length >= 2) {
    risk += 10;
    signals.push(`URL içinde ${matchedWords.slice(0, 3).join(", ")} gibi ikna/hesap kelimeleri var.`);
  }

  if (signals.length === 0) {
    signals.push("Belirgin phishing paterni görülmedi.");
    reasons.push("Alan adı ve protokol ilk bakışta standart görünüyor.");
  }

  const trustScore = Math.max(8, Math.min(96, 100 - risk));
  const riskLevel: RiskLevel = trustScore >= 75 ? "safe" : trustScore >= 50 ? "caution" : "risk";
  const verdict = riskLabels[riskLevel];
  const summary =
    riskLevel === "safe"
      ? "AI özeti: Bu URL'de ilk bakışta belirgin bir oltalama paterni görülmedi. Yine de hassas bilgi girmeden önce alan adını ve sayfa içeriğini kontrol edin."
      : riskLevel === "caution"
        ? "AI özeti: Bu URL bazı şüpheli sinyaller taşıyor. İşlem yapmadan önce resmi uygulama veya doğrudan bilinen alan adı üzerinden kontrol etmek daha güvenli olur."
        : "AI özeti: Bu URL yüksek riskli davranış paternleri gösteriyor. Şifre, kart bilgisi veya SMS kodu girmeden önce bağlantıyı kapatıp resmi kanaldan doğrulama yapın.";

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
        ? "Adres çubuğundaki alan adını yine de kontrol edin; hassas işlem yapacaksanız siteye arama motoru yerine kendi kayıtlı bağlantınızdan girin."
        : "Linke tıklamadan önce alan adını resmi kaynakla karşılaştırın, kısaltma linklerini açmayın ve hiçbir doğrulama kodunu bu sayfaya girmeyin."
  };
}

function analyzeMessageText(input: string): MessageResult {
  const text = input.trim();
  const normalized = text.toLowerCase();
  const signals: string[] = [];
  const reasons: string[] = [];
  let risk = 0;

  const urgencyWords = ["hemen", "acil", "son gün", "son saat", "şimdi", "iptal edilecek", "kapatılacak", "askıya"];
  const fearWords = ["ceza", "borç", "icra", "bloke", "hesabınız kapatıldı", "kargo bekletiliyor", "teslim edilemedi"];
  const paymentWords = ["ödeme", "kart", "IBAN", "aidat", "ücret", "tahsilat", "para iadesi"];
  const credentialWords = ["Şifre", "SMS kodu", "doğrulama kodu", "tek kullanımlık", "giriş yap", "hesap doğrula"];
  const impersonationWords = ["ptt", "banka", "e-devlet", "edevlet", "trendyol", "hepsiburada", "kargo", "vergi", "sgk"];

  const matchedUrgency = findMatches(normalized, urgencyWords);
  const matchedFear = findMatches(normalized, fearWords);
  const matchedPayment = findMatches(normalized, paymentWords);
  const matchedCredential = findMatches(normalized, credentialWords);
  const matchedImpersonation = findMatches(normalized, impersonationWords);
  const urlMatches = text.match(/https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+\.(com|net|org|tr|info|top|xyz)\S*/gi) ?? [];

  if (matchedUrgency.length) {
    risk += 16;
    signals.push(`Aciliyet baskısı görüldü: ${matchedUrgency.slice(0, 3).join(", ")}.`);
    reasons.push("Mesaj kullanıcıyı hızlı karar vermeye zorlayan ifadeler içeriyor.");
  }

  if (matchedFear.length) {
    risk += 16;
    signals.push(`Korku veya yaptırım dili görüldü: ${matchedFear.slice(0, 3).join(", ")}.`);
    reasons.push("Ceza, bloke, kargo bekletme veya hesap kapatma gibi baskı kuran ifadeler risk sinyalidir.");
  }

  if (matchedPayment.length) {
    risk += 14;
    signals.push(`Ödeme/finansal işlem dili var: ${matchedPayment.slice(0, 3).join(", ")}.`);
  }

  if (matchedCredential.length) {
    risk += 22;
    signals.push(`Şifre veya doğrulama kodu talebi sinyali var: ${matchedCredential.slice(0, 3).join(", ")}.`);
    reasons.push("Şifre, SMS kodu veya doğrulama kodu isteyen mesajlar yüksek riskli davranış paterni taşır.");
  }

  if (matchedImpersonation.length) {
    risk += 14;
    signals.push(`Kurum/marka taklidi ihtimali: ${matchedImpersonation.slice(0, 3).join(", ")}.`);
    reasons.push("Bilinen kurum adlarıyla gelen mesajlarda gönderici ve resmi kanal ayrıca doğrulanmalıdır.");
  }

  if (urlMatches.length) {
    risk += 18;
    signals.push(`${urlMatches.length} adet link tespit edildi.`);
    reasons.push("Mesaj içindeki linkler phishing sayfasına yönlendirme amacıyla kullanılabilir.");
  }

  if (/[A-ZĞÜŞİÖÇ]{6,}/.test(text)) {
    risk += 5;
    signals.push("Tamamı büyük harfli baskı dili kullanımı görüldü.");
  }

  if (signals.length === 0) {
    signals.push("Belirgin scam/phishing paterni görülmedi.");
    reasons.push("Mesajda aciliyet, link, şifre talebi veya kurum taklidi gibi güçlü sinyaller tespit edilmedi.");
  }

  const trustScore = Math.max(8, Math.min(96, 100 - risk));
  const riskLevel: RiskLevel = trustScore >= 75 ? "safe" : trustScore >= 50 ? "caution" : "risk";
  const verdict = riskLabels[riskLevel];
  const summary =
    riskLevel === "safe"
      ? "AI özeti: Bu mesajda ilk bakışta belirgin bir dolandırıcılık veya oltalama paterni görülmedi. Yine de link ve ekleri resmi kanaldan kontrol etmek iyi olur."
      : riskLevel === "caution"
        ? "AI özeti: Mesaj bazı şüpheli sinyaller taşıyor. Linke tıklamadan ve bilgi girmeden önce göndericiyi resmi kanaldan doğrulayın."
        : "AI özeti: Mesaj yüksek riskli davranış paternleri gösteriyor. Linke tıklamayın, şifre veya SMS kodu paylaşmayın ve kurumu resmi uygulama/telefon üzerinden kontrol edin.";

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
        ? "Yine de mesajdaki linkleri manuel yazmak yerine resmi uygulama veya bilinen web sitesi üzerinden kontrol edin."
        : "Linke tıklamayın, kart/şifre/SMS kodu girmeyin; gerekiyorsa kurumun resmi numarası veya uygulaması üzerinden doğrulama yapın."
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

function isLikelyIpInput(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "localhost") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return normalized.split(".").every((part) => Number(part) >= 0 && Number(part) <= 255);
  }
  return /^[0-9a-f:]+$/i.test(normalized) && normalized.includes(":");
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

  return brand ? `"${brand}" adını andıran ama resmi alan adıyla eşleşmeyen yapı görüldü.` : "";
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
