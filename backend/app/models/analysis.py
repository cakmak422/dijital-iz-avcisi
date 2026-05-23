from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


RiskLevel = Literal["safe", "caution", "risk"]


class AnalysisRequest(BaseModel):
    url: HttpUrl


class AiSummary(BaseModel):
    positive: str
    negative: str
    fake_review_pattern: str
    delivery_complaints: str
    return_issues: str
    recommendation: str


class AnalysisResponse(BaseModel):
    product_name: str
    seller_name: str
    marketplace: str
    rating: float
    review_count: int
    negative_review_density: int
    trust_score: int
    price: str | None = None
    product_link: str | None = None
    platform: str
    productName: str
    seller: str
    reviewCount: int
    riskScore: int
    risk_level: RiskLevel
    ai_summary: AiSummary
    review_snippet_count: int = 0
    parser_notes: list[str] = Field(default_factory=list)
