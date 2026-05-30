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

export type SiteSafetyResult = {
  risk_score: number;
  risk_level: RiskLevel;
  risk_score_breakdown?: { label: string; points: number; detail: string }[];
  citizen_summary: string;
  technical_findings: { severity: RiskLevel; title: string; detail: string }[];
  url_analysis: {
    normalized_url: string;
    domain: string;
    final_url: string | null;
    redirect_chain: { url: string; status_code: number | null }[];
    https: boolean;
    http_status: number | null;
    is_short_link: boolean;
    suspicious_keywords: string[];
    typo_signals: string[];
  };
  domain_info: {
    created_at: string | null;
    expires_at: string | null;
    domain_age_days: number | null;
    registrar: string | null;
    abuse_contact: string | null;
    notes: string[];
  };
  dns_info: {
    a: string[];
    aaaa: string[];
    mx: string[];
    ns: string[];
    txt: string[];
    nameservers: string[];
    notes: string[];
  };
  mail_security: {
    has_spf: boolean;
    has_dmarc: boolean;
    has_dkim_signal: boolean;
    spoofing_risk: RiskLevel;
    notes: string[];
  };
  ssl_info: {
    valid: boolean;
    expires_at: string | null;
    issuer: string | null;
    days_remaining: number | null;
    notes: string[];
  };
  ip_info: {
    ip: string | null;
    country: string | null;
    asn: string | null;
    hosting: string | null;
    notes: string[];
  };
};

export type IpIntelligenceResult = {
  input: string;
  ip: string | null;
  valid: boolean;
  is_public: boolean;
  risk_score: number | null;
  risk_level: RiskLevel;
  citizen_summary: string;
  technical_findings: { severity: RiskLevel; title: string; detail: string }[];
  ip_info: {
    country: string | null;
    asn: string | null;
    organization: string | null;
    network_name: string | null;
    abuse_contact: string | null;
  };
  infrastructure: {
    provider: string | null;
    is_cdn: boolean;
    is_hosting: boolean;
    is_datacenter: boolean;
  };
  privacy_signals: {
    vpn_proxy_possibility: "unknown" | "low" | "possible";
    tor_exit_node: "not_checked";
    notes: string[];
  };
  risk_score_breakdown: { label: string; points: number; detail: string }[];
};

export type ExifAnalysisResult = {
  file_name: string;
  file_size: number;
  image_width: number | null;
  image_height: number | null;
  camera_make: string | null;
  camera_model: string | null;
  software: string | null;
  datetime_original: string | null;
  gps_present: boolean;
  gps_latitude: number | null;
  gps_longitude: number | null;
  privacy_risk: "safe" | "caution";
  citizen_summary: string;
  technical_findings: { severity: "safe" | "caution"; title: string; detail: string }[];
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

export async function analyzeSiteSafety(url: string): Promise<SiteSafetyResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const response = await fetch(`${apiUrl}/api/site-safety/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error("Site safety request failed");
  }

  return (await response.json()) as SiteSafetyResult;
}

export async function analyzeIpIntelligence(ip: string): Promise<IpIntelligenceResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const response = await fetch(`${apiUrl}/api/ip-intelligence/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ip })
  });

  if (!response.ok) {
    throw new Error("IP intelligence request failed");
  }

  return (await response.json()) as IpIntelligenceResult;
}

export async function analyzeExifImage(file: File): Promise<ExifAnalysisResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const lowerName = file.name.toLowerCase();
  const hasJpegExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
  const hasJpegType = file.type === "image/jpeg";
  if (!hasJpegExtension && !hasJpegType) {
    throw new Error(`Sadece JPG/JPEG destekleniyor. Secilen dosya: ${file.name}, type: ${file.type || "yok"}`);
  }

  console.log("exif_upload_request", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/api/exif/analyze`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("EXIF analysis request failed");
  }

  return (await response.json()) as ExifAnalysisResult;
}

function detectMarketplace(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("trendyol")) return "Trendyol";
  if (normalized.includes("hepsiburada")) return "Hepsiburada";
  if (normalized.includes("n11")) return "N11";

  return "Bilinmeyen pazar yeri";
}
