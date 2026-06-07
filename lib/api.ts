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
  input?: string;
  normalized_url?: string;
  domain: string;
  final_url?: string | null;
  http_status?: number | null;
  risk_score: number;
  risk_level: RiskLevel;
  risk_label?: string;
  technical_risk_label?: string;
  site_category?: string;
  category_confidence?: number;
  citizen_risk_level?: string;
  citizen_risk_reason?: string;
  category_warning?: string;
  category_signals?: string[];
  risk_score_breakdown?: { label: string; points: number; detail: string }[];
  citizen_summary: string;
  safe_summary?: string;
  risk_summary?: string;
  public_advice?: string[];
  technical_findings: { severity: RiskLevel; title: string; detail: string }[];
  url_analysis: {
    original_url?: string | null;
    normalized_url: string;
    domain: string;
    final_url: string | null;
    page_title?: string | null;
    redirect_chain: { url: string; status_code: number | null }[];
    https: boolean;
    http_status: number | null;
    is_short_link: boolean;
    suspicious_keywords: string[];
    typo_signals: string[];
    notes?: string[];
  };
  security_headers?: {
    content_security_policy: string | null;
    x_frame_options: string | null;
    x_content_type_options: string | null;
    referrer_policy: string | null;
    permissions_policy: string | null;
    hsts: string | null;
    missing: string[];
    notes: string[];
  };
  domain_info: {
    created_at: string | null;
    updated_at?: string | null;
    expires_at: string | null;
    domain_age_days: number | null;
    registrar: string | null;
    registrar_iana_id?: string | null;
    abuse_contact: string | null;
    nameservers?: string[];
    status_codes?: string[];
    notes: string[];
  };
  dns_info: {
    a: string[];
    aaaa: string[];
    cname?: string[];
    mx: string[];
    ns: string[];
    txt: string[];
    soa?: string[];
    caa?: string[];
    ptr?: string[];
    nameservers: string[];
    cdn_provider?: string | null;
    waf_provider?: string | null;
    notes: string[];
  };
  mail_security: {
    has_mx?: boolean;
    has_spf: boolean;
    has_dmarc: boolean;
    has_dkim_signal: boolean;
    spoofing_risk: RiskLevel;
    notes: string[];
  };
  ssl_info: {
    valid: boolean;
    status?: string;
    valid_from?: string | null;
    expires_at: string | null;
    issuer: string | null;
    subject?: string | null;
    days_remaining: number | null;
    san?: string[];
    tls_version?: string | null;
    notes: string[];
  };
  ip_info: {
    ip: string | null;
    country: string | null;
    asn: string | null;
    organization?: string | null;
    network_name?: string | null;
    network_cidr?: string | null;
    hosting: string | null;
    provider_type?: string | null;
    abuse_contact?: string | null;
    notes: string[];
  };
  ip_records?: {
    ip: string;
    country: string | null;
    asn: string | null;
    organization: string | null;
    network_name: string | null;
    provider: string | null;
    provider_type: string | null;
    abuse_contact: string | null;
    notes: string[];
  }[];
  threat_intel?: {
    checked_sources: string[];
    skipped_sources: string[];
    malicious_count: number;
    suspicious_count: number;
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
  product_name: "Demo Ürün analizi",
  seller_name: "örnek Satıcı",
  marketplace: "Demo",
  rating: 4.2,
  review_count: 128,
  negative_review_density: 18,
  trust_score: 74,
  risk_level: "caution",
  review_snippet_count: 0,
  parser_notes: ["Frontend fallback demo sonucu kullanildi."],
  ai_summary: {
    positive: "Kullanıcılar Ürün kalitesi ve fiyat-performans dengesini olumlu buluyor.",
    negative: "Bazı yorumlarda paketleme ve geç teslimat şikayetleri öne çıkıyor.",
    fake_review_pattern: "Tekrarlayan kısa yorumlar nedeniyle düşük-orta seviyede sahte yorum paterni ihtimali var.",
    delivery_complaints: "Teslimat şikayetleri yogun değil, ancak tamamen ihmal edilebilir seviyede de değil.",
    return_issues: "İade süreciyle ilgili sınırlı sayıda olumsuz sinyal var.",
    recommendation: "Satın almadan önce satıcı puanini ve en yeni yorumlari tekrar kontrol edin."
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
    product_name: "Backend bağlantısı olmadan demo analiz"
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
    throw new Error(`Sadece JPG/JPEG destekleniyor. Seçilen dosya: ${file.name}, type: ${file.type || "yok"}`);
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
