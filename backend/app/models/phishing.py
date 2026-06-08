from pydantic import BaseModel, Field

from app.models.site_safety import RiskLevel


class PhishingRequest(BaseModel):
    url: str = Field(min_length=3, max_length=500)


class PhishingRedirectHop(BaseModel):
    url: str
    status_code: int | None = None


class PhishingResponse(BaseModel):
    normalized_url: str
    final_url: str | None = None
    domain: str
    root_domain: str
    redirect_count: int = 0
    redirect_chain: list[PhishingRedirectHop] = Field(default_factory=list)
    is_https: bool = False
    is_short_link: bool = False
    short_link_provider: str | None = None
    brand_impersonation_risk: bool = False
    suspected_brand: str | None = None
    official_domain_match: bool = False
    site_category: str = "Bilinmeyen / Genel site"
    phishing_risk_score: int = 0
    phishing_risk_label: str = "Düşük oltalama riski"
    phishing_signals: list[str] = Field(default_factory=list)
    positive_signals: list[str] = Field(default_factory=list)
    uncertain_signals: list[str] = Field(default_factory=list)
    citizen_summary: str
    citizen_recommendation: str
    technical_notes: list[str] = Field(default_factory=list)
    risk_level: RiskLevel = "safe"
