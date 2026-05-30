from typing import Literal

from pydantic import BaseModel, Field


PrivacyRisk = Literal["safe", "caution"]


class ExifFinding(BaseModel):
    severity: PrivacyRisk
    title: str
    detail: str


class ExifAnalysisResponse(BaseModel):
    file_name: str
    file_size: int
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
