export type RiskLevel = "safe" | "caution" | "risk";

export type TrustScoreItem = {
  label: string;
  points: number;
  detail: string;
};

export type DetailedAiSummary = {
  positive_summary: string;
  negative_summary: string;
  top_complaints: string[];
  delivery_issues: string;
  packaging_issues: string;
  seller_reliability: string;
  fake_review_risk: "düşük" | "orta" | "yüksek";
  repetitive_pattern: string;
  price_performance: string;
  return_problems: string;
  verdict: "buy" | "caution" | "avoid";
  verdict_label: string;
  data_quality: string;
};

export type AnalysisMode = "signal_based" | "review_based";

export type RiskBadge = {
  label: string;
  tone: "safe" | "caution" | "risk" | "neutral";
  detail: string;
};

export type DecisionLevel = "recommend" | "caution" | "avoid";

export type DecisionResult = {
  decision_level: DecisionLevel;
  decision_label: string;
  decision_reason: string;
  decision_points: string[];
};

export type CategoryComparison = {
  category_review_band: string;
  category_position_text: string;
};

export type AnalysisResult = {
  product_name: string;
  seller_name: string;
  brand_name?: string | null;
  original_price?: string | null;
  discount_percent?: number | null;
  brand_trust_score?: number;
  brand_trust_signal?: string;
  seller_trust_score?: number;
  seller_trust_signal?: string;
  fake_product_risk_level?: string;
  fake_product_risk_reason?: string;
  rating_trust_signal?: string;
  category_risk_level?: string;
  category_risk_reason?: string;
  price_performance_signal?: string;
  data_confidence_score?: number;
  data_confidence_reasons?: string[];
  risk_badges?: RiskBadge[];
  decision?: DecisionResult;
  category_comparison?: CategoryComparison;
  risk_summary_level?: string;
  risk_summary_reasons?: string[];
  data_confidence_grade?: string;
  strengths?: string[];
  weaknesses?: string[];
  score_summary?: string;
  marketplace: string;
  rating: number;
  review_count: number;
  negative_review_density: number;
  trust_score: number;
  risk_level: RiskLevel;
  analysis_mode?: AnalysisMode;
  review_snippet_count: number;
  parser_notes: string[];
  data_quality_flags?: string[];
  trust_score_breakdown?: TrustScoreItem[];
  detailed_summary?: DetailedAiSummary;
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
  brand_impersonation_risk?: boolean;
  suspected_brand?: string | null;
  brand_warning?: string | null;
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

export type PhishingAnalysisResult = {
  normalized_url?: string;
  final_url?: string | null;
  domain: string;
  root_domain?: string;
  redirect_count?: number;
  redirect_chain?: { url: string; status_code: number | null }[];
  is_https?: boolean;
  is_short_link?: boolean;
  short_link_provider?: string | null;
  brand_impersonation_risk?: boolean;
  suspected_brand?: string | null;
  official_domain_match?: boolean;
  site_category?: string;
  phishing_risk_score?: number;
  phishing_risk_label?: string;
  phishing_signals?: string[];
  positive_signals?: string[];
  uncertain_signals?: string[];
  citizen_summary?: string;
  citizen_recommendation?: string;
  technical_notes?: string[];
  risk_level?: RiskLevel;
  url?: string;
  trustScore?: number;
  riskLevel?: RiskLevel;
  verdict?: string;
  summary?: string;
  signals?: string[];
  reasons?: string[];
  recommendation?: string;
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
  file_type?: string;
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
  metadata_status?: string;
  overall_result?: "original" | "review" | "suspicious";
  confidence_score?: number;
  risk_score?: number;
  ai_risk_score?: number;
  ai_risk_level?: string;
  ai_risk_reasons?: string[];
  ai_signal_breakdown?: { signal: string; source: string; points: number; detail: string }[];
  filename_ai_signals?: string[];
  metadata_ai_signals?: string[];
  pixel_ai_signals?: string[];
  ai_generation_likelihood?: "low" | "medium" | "high";
  editing_trace_present?: boolean;
  source_estimate?: string;
  trust_indicators?: string[];
  review_points?: string[];
  risk_score_breakdown?: { label: string; points: number; detail: string }[];
  general_summary?: {
    file_type: string;
    overall_result: "original" | "review" | "suspicious";
    overall_label: string;
    confidence_score: number;
    risk_score: number;
    ai_risk_score?: number;
    ai_risk_level?: string;
    ai_generation_likelihood: "low" | "medium" | "high";
    editing_trace_present: boolean;
    source_estimate: string;
    gps_present: boolean;
    exif_present: boolean;
    citizen_comment: string;
    trust_indicators: string[];
    review_points: string[];
  } | null;
  manipulation_analysis?: {
    ai_generation_likelihood: "low" | "medium" | "high";
    editing_trace_present: boolean;
    editing_software_found: string[];
    content_credentials_present: boolean;
    ela_difference_score: number | null;
    ela_suspicion: boolean;
    signals: string[];
    summary: string;
  } | null;
  visual_content_analysis?: {
    ai_content_signal: "low" | "medium" | "high";
    camera_noise: string;
    edge_consistency: string;
    texture_smoothness: string;
    color_histogram_signal: string;
    pixel_comment: string;
    signals: string[];
    noise_score: number | null;
    edge_score: number | null;
    texture_score: number | null;
    histogram_score: number | null;
  } | null;
  source_analysis?: {
    likely_source: string;
    camera_photo_probability: number;
    screenshot_probability: number;
    downloaded_probability: number;
    whatsapp_probability: number;
    telegram_probability: number;
    social_media_probability: number;
    ai_generated_probability: number;
    signals: string[];
    summary: string;
  } | null;
  forensic_hashes?: {
    md5: string;
    sha1: string;
    sha256: string;
  } | null;
  file_integrity?: {
    file_extension: string;
    declared_content_type: string | null;
    detected_format: string | null;
    extension_matches_content: boolean;
    mime_matches_signature: boolean;
    warnings: string[];
  } | null;
  osint_links?: {
    google_lens: string;
    yandex_images: string;
    bing_visual_search: string;
    notes: string[];
  } | null;
  ela_image_base64?: string | null;
  ela_difference_score?: number | null;
  ela_warning?: string | null;
};


export async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });
  } catch {
    throw new Error("Backend'e bağlanılamadı. Lütfen backend servisinin çalıştığını kontrol edin (127.0.0.1:8000).");
  }

  if (!response.ok) {
    throw new Error(`Analiz isteği başarısız oldu (HTTP ${response.status}).`);
  }

  return (await response.json()) as AnalysisResult;
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

export async function analyzePhishing(url: string): Promise<PhishingAnalysisResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const response = await fetch(`${apiUrl}/api/phishing/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error("Phishing analysis request failed");
  }

  return (await response.json()) as PhishingAnalysisResult;
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
  const hasSupportedExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png");
  const hasSupportedType = file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png";
  if (!hasSupportedExtension && !hasSupportedType) {
    throw new Error(`Sadece JPG/JPEG/PNG destekleniyor. Seçilen dosya: ${file.name}, type: ${file.type || "yok"}`);
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

