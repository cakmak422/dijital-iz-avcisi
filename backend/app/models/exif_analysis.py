from typing import Literal

from pydantic import BaseModel, Field


PrivacyRisk = Literal["safe", "caution"]
ManipulationLikelihood = Literal["low", "medium", "high"]
OverallExifResult = Literal["original", "review", "suspicious"]


class ExifFinding(BaseModel):
    severity: PrivacyRisk
    title: str
    detail: str


class ExifRiskBreakdownItem(BaseModel):
    label: str
    points: int
    detail: str


class ExifSignalBreakdownItem(BaseModel):
    signal: str
    source: str
    points: int
    detail: str


class ExifGeneralSummary(BaseModel):
    file_type: str
    overall_result: OverallExifResult
    overall_label: str
    confidence_score: int
    risk_score: int
    ai_risk_score: int = 0
    ai_risk_level: str = "Düşük"
    ai_generation_likelihood: ManipulationLikelihood
    editing_trace_present: bool
    source_estimate: str
    gps_present: bool
    exif_present: bool
    citizen_comment: str
    trust_indicators: list[str] = Field(default_factory=list)
    review_points: list[str] = Field(default_factory=list)


class ExifManipulationAnalysis(BaseModel):
    ai_generation_likelihood: ManipulationLikelihood
    editing_trace_present: bool
    editing_software_found: list[str] = Field(default_factory=list)
    content_credentials_present: bool = False
    ela_difference_score: float | None = None
    ela_suspicion: bool = False
    signals: list[str] = Field(default_factory=list)
    summary: str


class ExifVisualContentAnalysis(BaseModel):
    ai_content_signal: ManipulationLikelihood
    camera_noise: str
    edge_consistency: str
    texture_smoothness: str
    color_histogram_signal: str
    pixel_comment: str
    signals: list[str] = Field(default_factory=list)
    noise_score: float | None = None
    edge_score: float | None = None
    texture_score: float | None = None
    histogram_score: float | None = None


class ExifSourceAnalysis(BaseModel):
    likely_source: str
    camera_photo_probability: int
    screenshot_probability: int
    downloaded_probability: int
    whatsapp_probability: int
    telegram_probability: int
    social_media_probability: int
    ai_generated_probability: int
    signals: list[str] = Field(default_factory=list)
    summary: str


class ExifForensicHashes(BaseModel):
    md5: str
    sha1: str
    sha256: str


class ExifFileIntegrity(BaseModel):
    file_extension: str
    declared_content_type: str | None = None
    detected_format: str | None = None
    extension_matches_content: bool = True
    mime_matches_signature: bool = True
    warnings: list[str] = Field(default_factory=list)


class ExifOsintLinks(BaseModel):
    google_lens: str
    yandex_images: str
    bing_visual_search: str
    notes: list[str] = Field(default_factory=list)


class ExifAnalysisResponse(BaseModel):
    file_name: str
    file_size: int
    file_type: str = "JPEG"
    image_width: int | None = None
    image_height: int | None = None
    camera_make: str | None = None
    camera_model: str | None = None
    software: str | None = None
    datetime_original: str | None = None
    gps_present: bool = False
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    privacy_risk: PrivacyRisk
    citizen_summary: str
    technical_findings: list[ExifFinding] = Field(default_factory=list)
    metadata_status: str = "Metadata bulunamadı"
    overall_result: OverallExifResult = "original"
    confidence_score: int = 100
    risk_score: int = 0
    ai_risk_score: int = 0
    ai_risk_level: str = "Düşük"
    ai_risk_reasons: list[str] = Field(default_factory=list)
    ai_signal_breakdown: list[ExifSignalBreakdownItem] = Field(default_factory=list)
    filename_ai_signals: list[str] = Field(default_factory=list)
    metadata_ai_signals: list[str] = Field(default_factory=list)
    pixel_ai_signals: list[str] = Field(default_factory=list)
    ai_generation_likelihood: ManipulationLikelihood = "low"
    editing_trace_present: bool = False
    source_estimate: str = "Kaynak türü net değil"
    trust_indicators: list[str] = Field(default_factory=list)
    review_points: list[str] = Field(default_factory=list)
    risk_score_breakdown: list[ExifRiskBreakdownItem] = Field(default_factory=list)
    general_summary: ExifGeneralSummary | None = None
    manipulation_analysis: ExifManipulationAnalysis | None = None
    visual_content_analysis: ExifVisualContentAnalysis | None = None
    source_analysis: ExifSourceAnalysis | None = None
    forensic_hashes: ExifForensicHashes | None = None
    file_integrity: ExifFileIntegrity | None = None
    osint_links: ExifOsintLinks | None = None
    ela_image_base64: str | None = None
    ela_difference_score: float | None = None
    ela_warning: str | None = None
