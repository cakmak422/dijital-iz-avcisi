from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["safe", "caution", "risk"]


class SiteSafetyRequest(BaseModel):
    url: str = Field(min_length=3, max_length=500)


class RedirectHop(BaseModel):
    url: str
    status_code: int | None = None


class UrlAnalysis(BaseModel):
    normalized_url: str
    domain: str
    final_url: str | None = None
    redirect_chain: list[RedirectHop] = Field(default_factory=list)
    https: bool
    http_status: int | None = None
    is_short_link: bool = False
    suspicious_keywords: list[str] = Field(default_factory=list)
    typo_signals: list[str] = Field(default_factory=list)


class DnsInfo(BaseModel):
    a: list[str] = Field(default_factory=list)
    aaaa: list[str] = Field(default_factory=list)
    mx: list[str] = Field(default_factory=list)
    ns: list[str] = Field(default_factory=list)
    txt: list[str] = Field(default_factory=list)
    nameservers: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class DomainInfo(BaseModel):
    created_at: str | None = None
    expires_at: str | None = None
    domain_age_days: int | None = None
    registrar: str | None = None
    abuse_contact: str | None = None
    notes: list[str] = Field(default_factory=list)


class SslInfo(BaseModel):
    valid: bool = False
    expires_at: str | None = None
    issuer: str | None = None
    days_remaining: int | None = None
    notes: list[str] = Field(default_factory=list)


class MailSecurityInfo(BaseModel):
    has_spf: bool = False
    has_dmarc: bool = False
    has_dkim_signal: bool = False
    spoofing_risk: RiskLevel = "caution"
    notes: list[str] = Field(default_factory=list)


class IpInfo(BaseModel):
    ip: str | None = None
    country: str | None = None
    asn: str | None = None
    hosting: str | None = None
    notes: list[str] = Field(default_factory=list)


class TechnicalFinding(BaseModel):
    severity: RiskLevel
    title: str
    detail: str


class RiskScoreItem(BaseModel):
    label: str
    points: int
    detail: str


class SiteSafetyResponse(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    risk_score_breakdown: list[RiskScoreItem] = Field(default_factory=list)
    citizen_summary: str
    technical_findings: list[TechnicalFinding]
    url_analysis: UrlAnalysis
    domain_info: DomainInfo
    dns_info: DnsInfo
    mail_security: MailSecurityInfo
    ssl_info: SslInfo
    ip_info: IpInfo
