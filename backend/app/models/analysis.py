from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


RiskLevel = Literal["safe", "caution", "risk"]
Verdict = Literal["buy", "caution", "avoid"]
AnalysisMode = Literal["signal_based", "review_based"]


class AiSummary(BaseModel):
    """Backward-compatible özet — mevcut istemciler için korunuyor."""
    positive: str
    negative: str
    fake_review_pattern: str
    delivery_complaints: str
    return_issues: str
    recommendation: str


class TrustScoreItem(BaseModel):
    label: str
    points: int
    detail: str


class DetailedAiSummary(BaseModel):
    positive_summary: str
    negative_summary: str
    top_complaints: list[str]
    delivery_issues: str
    packaging_issues: str
    seller_reliability: str
    fake_review_risk: Literal["düşük", "orta", "yüksek"]
    repetitive_pattern: str
    price_performance: str
    return_problems: str
    verdict: Verdict
    verdict_label: str
    data_quality: str


class RiskBadge(BaseModel):
    label: str
    tone: Literal["safe", "caution", "risk", "neutral"]
    detail: str


DecisionLevel = Literal["safe", "recommend", "caution", "avoid"]


class DecisionResult(BaseModel):
    decision_level: DecisionLevel
    decision_label: str
    decision_reason: str
    decision_points: list[str]


class CategoryComparison(BaseModel):
    category_review_band: str
    category_position_text: str


class AnalysisRequest(BaseModel):
    url: HttpUrl


class AnalysisResponse(BaseModel):
    product_name: str
    seller_name: str
    marketplace: str
    rating: float
    review_count: int
    negative_review_density: int
    trust_score: int
    price: str | None = None
    original_price: str | None = None
    discount_percent: int | None = None
    product_link: str | None = None
    platform: str
    productName: str
    seller: str
    reviewCount: int
    riskScore: int
    risk_level: RiskLevel
    brand_name: str | None = None
    brand_trust_score: int = 50
    brand_trust_signal: str = ""
    seller_trust_score: int = 40
    seller_trust_signal: str = ""
    fake_product_risk_level: str = ""
    fake_product_risk_reason: str = ""
    rating_trust_signal: str = ""
    category_risk_level: str = ""
    category_risk_reason: str = ""
    price_performance_signal: str = ""
    data_confidence_score: int = 0
    data_confidence_reasons: list[str] = Field(default_factory=list)
    risk_badges: list[RiskBadge] = Field(default_factory=list)
    decision: DecisionResult | None = None
    category_comparison: CategoryComparison | None = None
    risk_summary_level: str = ""
    risk_summary_reasons: list[str] = Field(default_factory=list)
    data_confidence_grade: str = ""
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    score_summary: str = ""
    analysis_mode: AnalysisMode = "signal_based"
    ai_summary: AiSummary
    detailed_summary: DetailedAiSummary | None = None
    trust_score_breakdown: list[TrustScoreItem] = Field(default_factory=list)
    data_quality_flags: list[str] = Field(default_factory=list)
    review_snippet_count: int = 0
    parser_notes: list[str] = Field(default_factory=list)
