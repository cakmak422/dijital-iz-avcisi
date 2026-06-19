import { cleanNewsDisplayText } from "@/lib/newsTranslation";

export type NewsAiTranslationInput = {
  originalTitle: string;
  summary: string;
  sourceName: string;
  category: string;
};

export type NewsAiTranslationOutput = {
  title_tr: string;
  summary_short_tr: string;
  summary_long_tr: string;
  public_advice: string[];
  affected_groups_tr: string[];
  recommendations_tr: string[];
};

export type NewsAiTranslationResult =
  | { ok: true; data: NewsAiTranslationOutput }
  | { ok: false; reason: string };

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_TIMEOUT_MS = 9000;
const GEMINI_MIN_INTERVAL_MS = 3000;
const GEMINI_RATE_LIMIT_RETRY_MS = 5000;
const GEMINI_MAX_INPUT_LENGTH = 1800;

let translationQueue = Promise.resolve();
let lastGeminiCallAt = 0;

export function isNewsAiTranslatorConfigured() {
  return Boolean((process.env.GEMINI_API_KEY ?? "").trim());
}

export async function translateNewsWithAi(input: NewsAiTranslationInput): Promise<NewsAiTranslationResult> {
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) return { ok: false, reason: "GEMINI_API_KEY tanimli degil." };

  return enqueueGeminiCall(() => callGeminiTranslator(apiKey, input));
}

async function enqueueGeminiCall<T>(task: () => Promise<T>) {
  const queuedTask = translationQueue.then(async () => {
    const waitMs = Math.max(0, GEMINI_MIN_INTERVAL_MS - (Date.now() - lastGeminiCallAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGeminiCallAt = Date.now();
    return task();
  });

  translationQueue = queuedTask.catch(() => undefined).then(() => undefined);
  return queuedTask;
}

async function callGeminiTranslator(apiKey: string, input: NewsAiTranslationInput): Promise<NewsAiTranslationResult> {
  const firstAttempt = await requestGeminiTranslation(apiKey, input);
  if (firstAttempt.ok || firstAttempt.status !== 429) return firstAttempt.result;

  await sleep(GEMINI_RATE_LIMIT_RETRY_MS);
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
          maxOutputTokens: 900,
          responseMimeType: "application/json"
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

    const parsed = JSON.parse(rawBody) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!text) {
      return {
        ok: false,
        status: response.status,
        result: { ok: false, reason: "Gemini bos cevap dondurdu." }
      };
    }

    const result = parseTranslationPayload(text);
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
  const summary = clampText(input.summary);
  const sourceName = clampText(input.sourceName, 140);
  const category = clampText(input.category, 140);

  return [
    "Asagidaki siber guvenlik haberini Turkce, sade ve vatandas odakli dile cevir.",
    "Metni birebir kopyalama; anlamini koruyarak temiz Turkce ozet uret.",
    "Ingilizce baslik veya yarim ceviri birakma.",
    "Abartili kesin hukum kullanma.",
    "Sadece gecerli JSON dondur.",
    "",
    "JSON semasi:",
    "{",
    '  "title_tr": "string",',
    '  "summary_short_tr": "string",',
    '  "summary_long_tr": "string",',
    '  "public_advice": ["string", "string", "string"],',
    '  "affected_groups_tr": ["string", "string"],',
    '  "recommendations_tr": ["string", "string", "string"]',
    "}",
    "",
    `Kaynak: ${sourceName}`,
    `Kategori: ${category}`,
    `Orijinal baslik: ${originalTitle}`,
    `Kaynak ozet: ${summary}`
  ].join("\n");
}

function parseTranslationPayload(value: string): NewsAiTranslationResult {
  const cleaned = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: "Gemini JSON formatinda cevap vermedi." };
  }

  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "Gemini cevabi nesne formatinda degil." };
  const record = parsed as Record<string, unknown>;
  const data: NewsAiTranslationOutput = {
    title_tr: cleanField(record.title_tr),
    summary_short_tr: cleanField(record.summary_short_tr),
    summary_long_tr: cleanField(record.summary_long_tr),
    public_advice: cleanArray(record.public_advice),
    affected_groups_tr: cleanArray(record.affected_groups_tr),
    recommendations_tr: cleanArray(record.recommendations_tr)
  };

  if (!data.title_tr || !data.summary_short_tr || !data.summary_long_tr) {
    return { ok: false, reason: "Gemini zorunlu metin alanlarini eksik dondurdu." };
  }
  if (!data.public_advice.length || !data.affected_groups_tr.length || !data.recommendations_tr.length) {
    return { ok: false, reason: "Gemini liste alanlarini eksik dondurdu." };
  }

  return { ok: true, data };
}

function cleanField(value: unknown) {
  return typeof value === "string" ? cleanNewsDisplayText(value).slice(0, 900) : "";
}

function cleanArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanField).filter((item) => item.length > 0).slice(0, 5);
}

function clampText(value: string, limit = GEMINI_MAX_INPUT_LENGTH) {
  return cleanNewsDisplayText(value).slice(0, limit);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
