from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["safe", "caution", "risk"]


class IpIntelligenceRequest(BaseModel):
    ip: str = Field(min_length=2, max_length=80)


class TechnicalFinding(BaseModel):
    severity: RiskLevel
    title: str
    detail: str


class RiskScoreItem(BaseModel):
    label: str
    points: int
    detail: str


class IpInfo(BaseModel):
    country: str | None = None
    asn: str | None = None
    organization: str | None = None
    network_name: str | None = None
    abuse_contact: str | None = None


class InfrastructureInfo(BaseModel):
    provider: str | None = None
    is_cdn: bool = False
    is_hosting: bool = False
    is_datacenter: bool = False


class PrivacySignals(BaseModel):
    vpn_proxy_possibility: Literal["unknown", "low", "possible"] = "unknown"
    tor_exit_node: Literal["not_checked"] = "not_checked"
    notes: list[str] = Field(default_factory=list)


class IpIntelligenceResponse(BaseModel):
    input: str
    ip: str | None = None
    valid: bool
    is_public: bool
    risk_score: int | None = None
    risk_level: RiskLevel
    citizen_summary: str
    technical_findings: list[TechnicalFinding] = Field(default_factory=list)
    ip_info: IpInfo
    infrastructure: InfrastructureInfo
    privacy_signals: PrivacySignals
    risk_score_breakdown: list[RiskScoreItem] = Field(default_factory=list)
