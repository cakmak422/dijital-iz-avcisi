export type RiskLevel = "safe" | "caution" | "risk";

export type AnalysisResult = {
  product_name: string;
  seller_name: string;
  marketplace: string;
  rating: number;
  review_count: number;
  negative_review_density: number;
  trust_score: number;
  risk_level: RiskLevel;
  review_snippet_count: number;
  parser_notes: string[];
  ai_summary: {
    positive: string;
    negative: string;
    fake_review_pattern: string;
    delivery_complaints: string;
    return_issues: string;
    recommendation: string;
  };
};

export type AnalysisHistoryItem = {
  id: number;
  url: string;
  marketplace: string;
  product_name: string;
  seller_name: string;
  trust_score: number;
  risk_level: RiskLevel;
  created_at: string;
};

const fallbackResult: AnalysisResult = {
  product_name: "Demo urun analizi",
  seller_name: "Ornek Satici",
  marketplace: "Demo",
  rating: 4.2,
  review_count: 128,
  negative_review_density: 18,
  trust_score: 74,
  risk_level: "caution",
  review_snippet_count: 0,
  parser_notes: ["Frontend fallback demo sonucu kullanildi."],
  ai_summary: {
    positive: "Kullanicilar urun kalitesi ve fiyat-performans dengesini olumlu buluyor.",
    negative: "Bazi yorumlarda paketleme ve gec teslimat sikayetleri one cikiyor.",
    fake_review_pattern: "Tekrarlayan kisa yorumlar nedeniyle dusuk-orta seviyede sahte yorum paterni ihtimali var.",
    delivery_complaints: "Teslimat sikayetleri yogun degil, ancak tamamen ihmal edilebilir seviyede de degil.",
    return_issues: "Iade sureciyle ilgili sinirli sayida olumsuz sinyal var.",
    recommendation: "Satin almadan once satici puanini ve en yeni yorumlari tekrar kontrol edin."
  }
};

export async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error("Analysis request failed");
    }

    return (await response.json()) as AnalysisResult;
  } catch {
    return {
      ...fallbackResult,
      marketplace: detectMarketplace(url),
      product_name: "Backend baglantisi olmadan demo analiz"
    };
  }
}

export async function fetchAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiUrl}/api/history?limit=8`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("History request failed");
    }

    return (await response.json()) as AnalysisHistoryItem[];
  } catch {
    return [];
  }
}

function detectMarketplace(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("trendyol")) return "Trendyol";
  if (normalized.includes("hepsiburada")) return "Hepsiburada";
  if (normalized.includes("n11")) return "N11";

  return "Bilinmeyen pazar yeri";
}
