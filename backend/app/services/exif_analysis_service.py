from __future__ import annotations

from io import BytesIO
from typing import Any

from PIL import ExifTags, Image, UnidentifiedImageError

from app.models.exif_analysis import ExifAnalysisResponse, ExifFinding


SUPPORTED_CONTENT_TYPES = {"image/jpeg", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def analyze_exif_image(file_name: str, content_type: str | None, content: bytes) -> ExifAnalysisResponse:
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("Dosya boyutu 10 MB sinirini asiyor.")
    normalized_content_type = (content_type or "").lower()
    normalized_file_name = file_name.lower()
    has_jpeg_extension = normalized_file_name.endswith(".jpg") or normalized_file_name.endswith(".jpeg")
    has_jpeg_content_type = normalized_content_type in SUPPORTED_CONTENT_TYPES
    if not has_jpeg_extension and not has_jpeg_content_type:
        raise ValueError(f"Sadece JPG/JPEG destekleniyor. Secilen dosya: {file_name}, content_type: {content_type or 'yok'}")

    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
    except UnidentifiedImageError as exc:
        raise ValueError("Gecerli bir fotograf dosyasi okunamadi.") from exc

    if image.format not in {"JPEG", "MPO"}:
        raise ValueError(f"Sadece JPG/JPEG destekleniyor. Secilen dosya: {file_name}, content_type: {content_type or 'yok'}")

    exif = _read_exif(image)
    gps_latitude, gps_longitude = _read_gps(exif.get("GPSInfo"))
    gps_present = gps_latitude is not None and gps_longitude is not None
    findings = _build_findings(exif, gps_present)

    return ExifAnalysisResponse(
        file_name=file_name,
        file_size=len(content),
        image_width=image.width,
        image_height=image.height,
        camera_make=_clean_value(exif.get("Make")),
        camera_model=_clean_value(exif.get("Model")),
        software=_clean_value(exif.get("Software")),
        datetime_original=_clean_value(exif.get("DateTimeOriginal") or exif.get("DateTime")),
        gps_present=gps_present,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        privacy_risk="caution" if gps_present else "safe",
        citizen_summary=(
            "Bu fotografta konum bilgisi bulunuyor. Paylasmadan once metadata temizlenmesi onerilir."
            if gps_present
            else "Belirgin konum verisi tespit edilmedi."
        ),
        technical_findings=findings,
    )


def _read_exif(image: Image.Image) -> dict[str, Any]:
    raw = image.getexif()
    exif: dict[str, Any] = {}
    for tag_id, value in raw.items():
        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        if tag_name == "GPSInfo" and isinstance(value, dict):
            exif[tag_name] = {ExifTags.GPSTAGS.get(key, str(key)): gps_value for key, gps_value in value.items()}
        else:
            exif[tag_name] = value
    return exif


def _read_gps(gps_info: Any) -> tuple[float | None, float | None]:
    if not isinstance(gps_info, dict):
        return None, None

    latitude = _gps_to_decimal(gps_info.get("GPSLatitude"), gps_info.get("GPSLatitudeRef"))
    longitude = _gps_to_decimal(gps_info.get("GPSLongitude"), gps_info.get("GPSLongitudeRef"))
    return latitude, longitude


def _gps_to_decimal(value: Any, ref: Any) -> float | None:
    if not value or len(value) != 3:
        return None
    try:
        degrees = float(value[0])
        minutes = float(value[1])
        seconds = float(value[2])
    except (TypeError, ValueError):
        return None

    decimal = degrees + minutes / 60 + seconds / 3600
    if str(ref).upper() in {"S", "W"}:
        decimal *= -1
    return round(decimal, 6)


def _build_findings(exif: dict[str, Any], gps_present: bool) -> list[ExifFinding]:
    findings: list[ExifFinding] = []
    if gps_present:
        findings.append(
            ExifFinding(
                severity="caution",
                title="GPS konumu bulundu",
                detail="Fotograf EXIF verisinde konum bilgisi var. Herkese acik paylasimdan once temizlenmesi onerilir.",
            )
        )
    if exif.get("Make") or exif.get("Model"):
        findings.append(
            ExifFinding(
                severity="safe",
                title="Cihaz bilgisi",
                detail="Fotograf icinde cihaz marka/model bilgisi okunabildi.",
            )
        )
    if not findings:
        findings.append(
            ExifFinding(
                severity="safe",
                title="Sinirli metadata",
                detail="Fotografta belirgin EXIF metadata bilgisi okunamadi veya metadata temizlenmis olabilir.",
            )
        )
    return findings


def _clean_value(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
