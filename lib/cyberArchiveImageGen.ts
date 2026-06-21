/**
 * Siber Arşiv — AI Görsel Üretimi (Gemini)
 *
 * Sağlayıcı: Google Gemini (generateContent — image modalities)
 * Env: GEMINI_API_KEY (projede zaten tanımlı)
 *      GEMINI_IMAGE_MODEL (opsiyonel, default: gemini-2.5-flash-image)
 * Bucket: cyber-archive (Supabase Storage)
 *
 * Öncelik kuralı: image_source = 'admin-upload' → AI üzerine yazmaz.
 * Hata halinde sessizce "none" kalır, site kırılmaz.
 */

export type ImageGenResult = {
  ok: boolean;
  imageUrl?: string;
  skipped?: boolean;
  reason?: string;
};

const BUCKET         = "cyber-archive";
const GEMINI_BASE    = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL  = "gemini-2.5-flash-image";
const FALLBACK_MIME  = "image/png";

export async function generateAndStoreArchiveImage(params: {
  slug: string;
  title: string;
  category: string;
  summary: string;
  currentImageSource?: string | null;
  supabaseUrl: string;
  serviceKey: string;
}): Promise<ImageGenResult> {
  const { slug, title, category, summary, currentImageSource, supabaseUrl, serviceKey } = params;

  // Admin yüklemesi varsa dokunma
  if (currentImageSource === "admin-upload") {
    return { ok: true, skipped: true, reason: "admin-upload mevcut — AI üzerine yazmadı." };
  }

  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    return { ok: false, reason: "GEMINI_API_KEY tanımlı değil." };
  }

  const model   = (process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL).trim();
  const prompt  = buildPrompt(title, category, summary);
  const endpoint = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Gemini generateContent — image modality
  let imageB64: string;
  let imageMime: string;

  try {
    const genRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"]
        }
      }),
      signal: AbortSignal.timeout(45_000)
    });

    if (!genRes.ok) {
      const errText = await genRes.text().catch(() => "");
      // 429 kota/rate limit — açıklayıcı mesaj
      if (genRes.status === 429) {
        return {
          ok: false,
          reason: `Gemini görsel kotası aşıldı (429). Kısa süre sonra tekrar deneyin. ${errText.slice(0, 120)}`
        };
      }
      // 400 paid plan gereksinimi
      if (genRes.status === 400 && errText.includes("paid")) {
        return {
          ok: false,
          reason: `Gemini görsel üretimi için ücretli plan gerekiyor (400). Model: ${model}`
        };
      }
      return {
        ok: false,
        reason: `Gemini API hata ${genRes.status}: ${errText.slice(0, 200)}`
      };
    }

    const genData = await genRes.json() as {
      candidates?: {
        content?: {
          parts?: { inlineData?: { data?: string; mimeType?: string }; text?: string }[]
        }
      }[]
    };

    const parts = genData.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      // Metin yanıtı dönmüş olabilir (model görsel üretemedi)
      const textPart = parts.find((p) => p.text);
      const hint = textPart?.text?.slice(0, 100) ?? "inlineData içermiyor";
      return { ok: false, reason: `Gemini görsel üretmedi: ${hint}` };
    }

    imageB64 = imagePart.inlineData.data;
    imageMime = imagePart.inlineData.mimeType ?? FALLBACK_MIME;
  } catch (err) {
    return {
      ok: false,
      reason: `Gemini istek hatası: ${err instanceof Error ? err.message : "bilinmeyen"}`
    };
  }

  // Base64 → Buffer → Supabase Storage (akış değişmedi)
  const ext        = imageMime.includes("jpeg") || imageMime.includes("jpg") ? "jpg" : "png";
  const imageBuffer = Buffer.from(imageB64, "base64");
  const safePath   = `events/ai-${Date.now()}-${slug.slice(0, 50)}.${ext}`;

  const storageRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${safePath}`,
    {
      method: "POST",
      headers: {
        apikey:         serviceKey,
        Authorization:  `Bearer ${serviceKey}`,
        "Content-Type": imageMime,
        "x-upsert":     "true"
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(15_000)
    }
  ).catch((err) => ({ ok: false as const, text: () => Promise.resolve(err?.message ?? "") }));

  if (!storageRes.ok) {
    return { ok: false, reason: "Supabase Storage yükleme başarısız." };
  }

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${safePath}`;

  // DB güncelle: image_url, image_source, image_generated_at (akış değişmedi)
  await fetch(
    `${supabaseUrl}/rest/v1/cyber_timeline_events?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: {
        apikey:         serviceKey,
        Authorization:  `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer:         "return=minimal"
      },
      body: JSON.stringify({
        image_url:           imageUrl,
        image_source:        "ai-generated",
        image_generated_at:  new Date().toISOString()
      }),
      signal: AbortSignal.timeout(5_000)
    }
  ).catch(() => null);

  return { ok: true, imageUrl };
}

function buildPrompt(title: string, category: string, summary: string): string {
  const cleanTitle    = title.slice(0, 80).replace(/"/g, "'");
  const cleanCategory = category.slice(0, 40);
  const cleanSummary  = summary.slice(0, 120).replace(/"/g, "'");

  return (
    `Create a professional cybersecurity infographic illustration for the event: "${cleanTitle}". ` +
    `Category: ${cleanCategory}. Context: ${cleanSummary}. ` +
    `Style: dark background (#020617), cyan and emerald accent colors, technical network/circuit motif, ` +
    `no readable text overlay, corporate and serious tone, not gaming aesthetic. ` +
    `Dimensions should feel like a 16:9 banner or square thumbnail.`
  );
}
