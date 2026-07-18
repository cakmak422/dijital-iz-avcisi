import { cleanNewsDisplayText } from "@/lib/newsTranslation";

export type NewsAiTranslationInput = {
  originalTitle: string;
  originalSummary: string;
  sourceName: string;
  category: string;
  sourceUrl: string;
  sourceLanguage: "tr" | "en";
};

export type NewsAiRiskLevel = "Düşük" | "Orta" | "Yüksek";

export type NewsAiTranslationOutput = {
  title_tr: string;
  summary_short_tr: string;
  summary_long_tr: string;
  why_it_matters_tr: string;
  risk_level: NewsAiRiskLevel;
  public_advice: string[];
  affected_groups_tr: string[];
  recommendations_tr: string[];
};

export type NewsAiTranslationResult =
  | { ok: true; data: NewsAiTranslationOutput }
  | { ok: false; reason: string };

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? "12000");
const GEMINI_MIN_INTERVAL_MS = Number(process.env.GEMINI_MIN_INTERVAL_MS ?? "1500");
const GEMINI_RATE_LIMIT_RETRY_MS = 5000;
// Model asiri yuklendiginde (503) tek seferlik retry oncesi bekleme
const GEMINI_OVERLOAD_RETRY_MS = Number(process.env.GEMINI_OVERLOAD_RETRY_MS ?? "4000");
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "2048");
const GEMINI_MAX_INPUT_LENGTH = 1800;

let translationQueue = Promise.resolve();
let lastGeminiCallAt = 0;

// Fetch başına AI başarı/kırpma istatistiği — izleme/uyarı mekanizması
// için. resetAiStats() her fetchLatestCyberNews() başında çağrılır,
// getAiStats() sonunda okunur.
let aiCallCount = 0;
let aiOkCount = 0;
let truncationCount = 0;

export function resetAiStats() {
  aiCallCount = 0;
  aiOkCount = 0;
  truncationCount = 0;
}

export function getAiStats() {
  return { attempted: aiCallCount, ok: aiOkCount, truncationCount };
}

export function isNewsAiTranslatorConfigured() {
  return Boolean((process.env.GEMINI_API_KEY ?? "").trim());
}

export async function translateNewsWithAi(
  input: NewsAiTranslationInput,
  options?: { allowRetry?: boolean }
): Promise<NewsAiTranslationResult> {
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) return { ok: false, reason: "GEMINI_API_KEY tanimli degil." };

  const allowRetry = options?.allowRetry ?? true;
  const tStart = Date.now();
  const shortTitle = input.originalTitle.slice(0, 60);
  const { result, queueWaitMs } = await enqueueGeminiCall(() => callGeminiTranslator(apiKey, input, allowRetry));
  const elapsedMs = Date.now() - tStart;
  aiCallCount += 1;
  if (result.ok) aiOkCount += 1;
  console.log("gemini_translation_timing", {
    elapsed_ms: elapsedMs,
    queue_wait_ms: queueWaitMs,
    api_elapsed_ms: elapsedMs - queueWaitMs,
    ok: result.ok,
    language: input.sourceLanguage,
    reason: result.ok ? undefined : (result as { reason: string }).reason,
    title: shortTitle,
  });
  return result;
}

async function enqueueGeminiCall<T>(task: () => Promise<T>): Promise<{ result: T; queueWaitMs: number }> {
  const queuedTask = translationQueue.then(async () => {
    const waitMs = Math.max(0, GEMINI_MIN_INTERVAL_MS - (Date.now() - lastGeminiCallAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGeminiCallAt = Date.now();
    const result = await task();
    return { result, queueWaitMs: waitMs };
  });

  translationQueue = queuedTask.catch(() => undefined).then(() => undefined);
  return queuedTask;
}

async function callGeminiTranslator(
  apiKey: string,
  input: NewsAiTranslationInput,
  allowRetry: boolean
): Promise<NewsAiTranslationResult> {
  const firstAttempt = await requestGeminiTranslation(apiKey, input);
  if (firstAttempt.ok || !allowRetry) return firstAttempt.result;

  if (firstAttempt.status === 429) {
    await sleep(GEMINI_RATE_LIMIT_RETRY_MS);
  } else if (firstAttempt.status === 503) {
    await sleep(GEMINI_OVERLOAD_RETRY_MS);
  } else {
    return firstAttempt.result;
  }

  const retryAttempt = await requestGeminiTranslation(apiKey, input);
  return retryAttempt.result;
}

async function requestGeminiTranslation(
  apiKey: string,
  input: NewsAiTranslationInput
): Promise<{ ok: boolean; status?: number; result: NewsAiTranslationResult }> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(input) }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    const rawBody = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        result: { ok: false, reason: `Gemini API ${response.status} dondurdu.` }
      };
    }

    const parsed = JSON.parse(rawBody) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    };
    const finishReason = parsed.candidates?.[0]?.finishReason;
    const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!text) {
      return {
        ok: false,
        status: response.status,
        result: { ok: false, reason: `Gemini bos cevap dondurdu. finishReason=${finishReason ?? "bilinmiyor"}` }
      };
    }

    const result = parseTranslationPayload(text, finishReason);
    return { ok: result.ok, status: response.status, result };
  } catch (error) {
    return {
      ok: false,
      result: { ok: false, reason: error instanceof Error ? error.message : "Gemini bilinmeyen hata dondurdu." }
    };
  }
}

function buildPrompt(input: NewsAiTranslationInput) {
  const originalTitle = clampText(input.originalTitle);
  const originalSummary = clampText(input.originalSummary);
  const sourceName = clampText(input.sourceName, 140);
  const category = clampText(input.category, 140);
  const sourceUrl = clampText(input.sourceUrl, 300);

  const languageInstructions = input.sourceLanguage === "tr"
    ? [
        "Kaynak metin zaten Turkce yazilmis, cevirme.",
        "Metni oldugu gibi kopyalama; sade, oz ve vatandas odakli bir ozet ve risk degerlendirmesi uret."
      ]
    : [
        "Asagidaki siber guvenlik haberini Turkce, sade ve vatandas odakli dile cevir.",
        "Metni birebir kopyalama; anlamini koruyarak temiz Turkce ozet uret.",
        "Ingilizce baslik veya yarim ceviri birakma."
      ];

  return [
    ...languageInstructions,
    "summary_short_tr tam olarak 2 cumlelik kisa kart ozeti olsun.",
    "summary_long_tr 2-3 paragraf halinde ayrintili ama sade aciklama olsun.",
    "why_it_matters_tr bu haber neden onemli sorusuna tek paragrafla cevap versin.",
    "risk_level alani haberin siber guvenlik ciddiyetine gore Dusuk, Orta veya Yuksek degerlerinden tam olarak biriyle doldurulsun.",
    "public_advice vatandasin ne yapmasi gerektigini anlatan uygulanabilir maddeler olsun.",
    "Abartili kesin hukum kullanma.",
    "Sadece gecerli JSON dondur.",
    "",
    "JSON semasi:",
    "{",
    '  "title_tr": "string",',
    '  "summary_short_tr": "string",',
    '  "summary_long_tr": "string",',
    '  "why_it_matters_tr": "string",',
    '  "risk_level": "Dusuk",',
    '  "public_advice": ["string", "string", "string"],',
    '  "affected_groups_tr": ["string", "string"],',
    '  "recommendations_tr": ["string", "string", "string"]',
    "}",
    "risk_level alani su uc degerden biri olmali: Dusuk, Orta, Yuksek.",
    "",
    `Kaynak: ${sourceName}`,
    `Kategori: ${category}`,
    `Kaynak URL: ${sourceUrl}`,
    `Orijinal baslik: ${originalTitle}`,
    `Kaynak ozet: ${originalSummary}`
  ].join("\n");
}

function parseTranslationPayload(value: string, finishReason?: string): NewsAiTranslationResult {
  const cleaned = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: `Gemini JSON formatinda cevap vermedi. finishReason=${finishReason ?? "bilinmiyor"}` };
  }

  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "Gemini cevabi nesne formatinda degil." };
  const record = parsed as Record<string, unknown>;
  const data: NewsAiTranslationOutput = {
    title_tr: cleanField(record.title_tr, 300, "title_tr"),
    summary_short_tr: cleanField(record.summary_short_tr, 500, "summary_short_tr"),
    summary_long_tr: cleanField(record.summary_long_tr, 3000, "summary_long_tr"),
    why_it_matters_tr: cleanField(record.why_it_matters_tr, 3000, "why_it_matters_tr"),
    risk_level: cleanRiskLevel(record.risk_level),
    public_advice: cleanArray(record.public_advice, 500, "public_advice"),
    affected_groups_tr: cleanArray(record.affected_groups_tr, 500, "affected_groups_tr"),
    recommendations_tr: cleanArray(record.recommendations_tr, 500, "recommendations_tr")
  };

  if (!data.title_tr || !data.summary_short_tr || !data.summary_long_tr || !data.why_it_matters_tr) {
    return { ok: false, reason: "Gemini zorunlu metin alanlarini eksik dondurdu." };
  }
  if (!data.public_advice.length || !data.affected_groups_tr.length || !data.recommendations_tr.length) {
    return { ok: false, reason: "Gemini liste alanlarini eksik dondurdu." };
  }

  return { ok: true, data };
}

// Gemini "Dusuk"/"Yuksek" gibi diyakritiksiz ya da "High"/"Low" gibi
// İngilizce varyasyonlar döndürebilir — sıkı eşleşme yerine anahtar kelime
// tanır, tanımadığı durumda güvenli varsayılan "Orta"ya düşer (parse'ı
// başarısız saymaz, çeviri akışı kırılmaz).
function cleanRiskLevel(value: unknown): NewsAiRiskLevel {
  const text = typeof value === "string" ? cleanNewsDisplayText(value).toLocaleLowerCase("tr-TR") : "";
  if (/yuksek|y[üu]ksek|high|kritik|critical/.test(text)) return "Yüksek";
  if (/dusuk|d[üu][şs][üu]k|low/.test(text)) return "Düşük";
  return "Orta";
}

// Sert slice() cümle ortasında kesebiliyordu (ör. "...hesaplarını duzenli olarak k").
// Aşımda son yarım kelimeyi atıp "..." ekliyoruz; ayrıca aşım gerçekten
// oluşursa (maxLength bile yetmiyorsa) sessiz kalmayıp loglanıyor.
function cleanField(value: unknown, maxLength: number, fieldName: string): string {
  if (typeof value !== "string") return "";
  const cleaned = cleanNewsDisplayText(value);
  if (cleaned.length <= maxLength) return cleaned;

  truncationCount += 1;
  console.warn("news_ai_field_truncated", { field: fieldName, originalLength: cleaned.length, maxLength });
  return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function cleanArray(value: unknown, maxLength: number, fieldName: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanField(item, maxLength, fieldName))
    .filter((item) => item.length > 0)
    .slice(0, 5);
}

function clampText(value: string, limit = GEMINI_MAX_INPUT_LENGTH) {
  return cleanNewsDisplayText(value).slice(0, limit);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
