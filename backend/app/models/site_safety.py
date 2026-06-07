from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["safe", "caution", "risk"]


class SiteSafetyRequest(BaseModel):
    url: str = Field(min_length=3, max_length=500)


class RedirectHop(BaseModel):
    url: str
    status_code: int | None = None


class UrlAnalysis(BaseModel):
    original_url: str | None = None
    normalized_url: str
    domain: str
    final_url: str | None = None
    page_title: str | None = None
    redirect_chain: list[RedirectHop] = Field(default_factory=list)
    https: bool
    http_status: int | None = None
    is_short_link: bool = False
    suspicious_keywords: list[str] = Field(default_factory=list)
    typo_signals: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class SecurityHeadersInfo(BaseModel):
    content_security_policy: str | None = None
    x_frame_options: str | None = None
    x_content_type_options: str | None = None
    referrer_policy: str | None = None
    permissions_policy: str | None = None
    hsts: str | None = None
    missing: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class DnsInfo(BaseModel):
    a: list[str] = Field(default_factory=list)
    aaaa: list[str] = Field(default_factory=list)
    cname: list[str] = Field(default_factory=list)
    mx: list[str] = Field(default_factory=list)
    ns: list[str] = Field(default_factory=list)
    txt: list[str] = Field(default_factory=list)
    soa: list[str] = Field(default_factory=list)
    caa: list[str] = Field(default_factory=list)
    ptr: list[str] = Field(default_factory=list)
    nameservers: list[str] = Field(default_factory=list)
    cdn_provider: str | None = None
    waf_provider: str | None = None
    notes: list[str] = Field(default_factory=list)


class DomainInfo(BaseModel):
    created_at: str | None = None
    updated_at: str | None = None
    expires_at: str | None = None
    domain_age_days: int | None = None
    registrar: str | None = None
    registrar_iana_id: str | None = None
    abuse_contact: str | None = None
    nameservers: list[str] = Field(default_factory=list)
    status_codes: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class SslInfo(BaseModel):
    valid: bool = False
    status: str = "Tespit Edilemedi"
    valid_from: str | None = None
    expires_at: str | None = None
    issuer: str | None = None
    subject: str | None = None
    days_remaining: int | None = None
    san: list[str] = Field(default_factory=list)
    tls_version: str | None = None
    notes: list[str] = Field(default_factory=list)


class MailSecurityInfo(BaseModel):
    has_mx: bool = False
    has_spf: bool = False
    has_dmarc: bool = False
    has_dkim_signal: bool = False
    spoofing_risk: RiskLevel = "caution"
    notes: list[str] = Field(default_factory=list)


class IpInfo(BaseModel):
    ip: str | None = None
    country: str | None = None
    asn: str | None = None
    organization: str | None = None
    network_name: str | None = None
    network_cidr: str | None = None
    hosting: str | None = None
    provider_type: str | None = None
    abuse_contact: str | None = None
    notes: list[str] = Field(default_factory=list)


class IpRecord(BaseModel):
    ip: str
    country: str | None = None
    asn: str | None = None
    organization: str | None = None
    network_name: str | None = None
    provider: str | None = None
    provider_type: str | None = None
    abuse_contact: str | None = None
    notes: list[str] = Field(default_factory=list)


class ThreatIntelInfo(BaseModel):
    checked_sources: list[str] = Field(default_factory=list)
    skipped_sources: list[str] = Field(default_factory=list)
    malicious_count: int = 0
    suspicious_count: int = 0
    notes: list[str] = Field(default_factory=list)


class SiteCategoryInfo(BaseModel):
    site_category: str = "Genel / Bilgilendirme"
    category_confidence: float = 0.0
    citizen_risk_level: str = "Düşük teknik risk, yine de doğrula"
    citizen_risk_reason: str = "Site türü için belirgin bir yüksek dikkat sinyali tespit edilmedi."
    category_warning: str = "SSL/TLS veya HTTP erişimi tek başına sitenin güvenilir, yasal ya da resmi olduğu anlamına gelmez."
    category_signals: list[str] = Field(default_factory=list)


class TechnicalFinding(BaseModel):
    severity: RiskLevel
    title: str
    detail: str


class RiskScoreItem(BaseModel):
    label: str
    points: int
    detail: str


class SiteSafetyResponse(BaseModel):
    input: str
    normalized_url: str
    domain: str
    final_url: str | None = None
    http_status: int | None = None
    risk_score: int
    risk_level: RiskLevel
    risk_label: str
    technical_risk_label: str
    site_category: str
    category_confidence: float
    citizen_risk_level: str
    citizen_risk_reason: str
    category_warning: str
    category_signals: list[str] = Field(default_factory=list)
    risk_score_breakdown: list[RiskScoreItem] = Field(default_factory=list)
    citizen_summary: str
    safe_summary: str
    risk_summary: str
    public_advice: list[str] = Field(default_factory=list)
    technical_findings: list[TechnicalFinding]
    url_analysis: UrlAnalysis
    security_headers: SecurityHeadersInfo
    domain_info: DomainInfo
    dns_info: DnsInfo
    mail_security: MailSecurityInfo
    ssl_info: SslInfo
    ip_info: IpInfo
    ip_records: list[IpRecord] = Field(default_factory=list)
    threat_intel: ThreatIntelInfo = Field(default_factory=ThreatIntelInfo)
