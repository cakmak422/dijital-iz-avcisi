from __future__ import annotations

import base64
import hashlib
import re
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import ExifTags, Image, ImageChops, ImageEnhance, ImageFilter, ImageStat, UnidentifiedImageError

from app.models.exif_analysis import (
    ExifAnalysisResponse,
    ExifFileIntegrity,
    ExifFinding,
    ExifForensicHashes,
    ExifGeneralSummary,
    ExifManipulationAnalysis,
    ExifOsintLinks,
    ExifRiskBreakdownItem,
    ExifSignalBreakdownItem,
    ExifSourceAnalysis,
    ExifVisualContentAnalysis,
    ManipulationLikelihood,
    OverallExifResult,
)


SUPPORTED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
SUPPORTED_FORMATS = {"JPEG", "MPO", "PNG"}
MAX_FILE_SIZE = 10 * 1024 * 1024

AI_SIGNAL_WORDS = (
    "chatgpt image",
    "chatgpt",
    "openai",
    "midjourney",
    "mj",
    "stable diffusion",
    "stable-diffusion",
    "stable",
    "sdxl",
    "flux",
    "black-forest-labs",
    "bfl",
    "dall-e",
    "dall·e",
    "dalle",
    "generated",
    "ai-generated",
    "ai_image",
    "ai-image",
    "image_fx",
    "leonardo",
    "firefly",
    "ideogram",
    "ai generated",
    "generative ai",
    "content credentials",
    "c2pa",
    "prompt",
    "negative_prompt",
    "parameters",
    "sampler",
    "steps",
    "cfg_scale",
    "seed",
    "model",
    "workflow",
    "comfyui",
    "automatic1111",
    "generator",
)

EDITING_SOFTWARE = (
    "adobe photoshop",
    "photoshop",
    "lightroom",
    "snapseed",
    "picsart",
    "canva",
    "capcut",
    "gimp",
    "affinity",
    "pixelmator",
)


def analyze_exif_image(file_name: str, content_type: str | None, content: bytes) -> ExifAnalysisResponse:
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("Dosya boyutu 10 MB sınırını aşıyor.")

    normalized_content_type = (content_type or "").lower()
    normalized_file_name = file_name.lower()
    extension = Path(normalized_file_name).suffix.lower()
    has_supported_extension = extension in {".jpg", ".jpeg", ".png"}
    has_supported_content_type = normalized_content_type in SUPPORTED_CONTENT_TYPES
    if not has_supported_extension and not has_supported_content_type:
        raise ValueError(f"Sadece JPG/JPEG/PNG destekleniyor. Seçilen dosya: {file_name}, content_type: {content_type or 'yok'}")

    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
    except UnidentifiedImageError as exc:
        raise ValueError("Geçerli bir fotoğraf dosyası okunamadı.") from exc

    if image.format not in SUPPORTED_FORMATS:
        raise ValueError(f"Sadece JPG/JPEG/PNG destekleniyor. Seçilen dosya: {file_name}, content_type: {content_type or 'yok'}")

    exif = _read_exif(image)
    metadata_text = _metadata_text(exif, image.info, file_name)
    gps_latitude, gps_longitude = _read_gps(exif.get("GPSInfo"))
    gps_present = gps_latitude is not None and gps_longitude is not None
    metadata_status = _metadata_status(exif, image.info, gps_present)
    exif_present = metadata_status != "Metadata bulunamadı"
    software = _clean_value(exif.get("Software") or image.info.get("Software"))
    camera_make = _clean_value(exif.get("Make"))
    camera_model = _clean_value(exif.get("Model"))
    datetime_original = _clean_value(exif.get("DateTimeOriginal") or exif.get("DateTime"))

    integrity = _file_integrity(file_name, normalized_content_type, image.format, content)
    hashes = ExifForensicHashes(
        md5=hashlib.md5(content, usedforsecurity=False).hexdigest(),
        sha1=hashlib.sha1(content, usedforsecurity=False).hexdigest(),
        sha256=hashlib.sha256(content).hexdigest(),
    )

    editing_software = _find_words(metadata_text, EDITING_SOFTWARE)
    filename_ai_signals = _filename_ai_signals(file_name)
    metadata_ai_signals = _metadata_ai_signals(exif, image.info)
    ai_signals = list(dict.fromkeys([*filename_ai_signals, *metadata_ai_signals]))
    content_credentials_present = any(signal in metadata_text.lower() for signal in ("c2pa", "content credentials"))
    ela_image_base64, ela_score, ela_suspicion = _build_ela_preview(image, content)
    visual_analysis = _visual_content_analysis(image, exif_present, camera_make, camera_model, filename_ai_signals)
    ai_breakdown = _ai_signal_breakdown(
        image=image,
        exif_present=exif_present,
        camera_make=camera_make,
        camera_model=camera_model,
        filename_ai_signals=filename_ai_signals,
        metadata_ai_signals=metadata_ai_signals,
        visual_analysis=visual_analysis,
        content_credentials_present=content_credentials_present,
    )
    ai_risk_score = min(100, sum(item.points for item in ai_breakdown))
    ai_likelihood = _ai_likelihood_from_score(ai_risk_score)
    ai_risk_level = _ai_risk_level(ai_risk_score)
    ai_risk_reasons = [item.detail for item in ai_breakdown if item.points > 0]
    source_analysis = _source_analysis(
        file_name=file_name,
        image=image,
        exif_present=exif_present,
        camera_make=camera_make,
        camera_model=camera_model,
        ai_likelihood=ai_likelihood,
        editing_software=editing_software,
    )
    risk_breakdown = _risk_breakdown(
        gps_present=gps_present,
        exif_present=exif_present,
        ai_likelihood=ai_likelihood,
        editing_software=editing_software,
        source_analysis=source_analysis,
        integrity=integrity,
        ela_suspicion=ela_suspicion,
    )
    base_risk_score = sum(item.points for item in risk_breakdown)
    risk_score = min(100, max(base_risk_score, ai_risk_score))
    confidence_score = max(0, 100 - risk_score)
    overall_result, overall_label = _overall_result(risk_score, ai_risk_score, bool(editing_software), exif_present, bool(camera_make or camera_model), not integrity.warnings)
    trust_indicators = _trust_indicators(camera_make, camera_model, exif_present, gps_present, integrity, hashes)
    review_points = _review_points(risk_breakdown, gps_present, exif_present, editing_software, ai_signals)
    citizen_summary = _citizen_summary(overall_result, source_analysis.likely_source, risk_score, gps_present, editing_software, ai_signals)

    manipulation_analysis = ExifManipulationAnalysis(
        ai_generation_likelihood=ai_likelihood,
        editing_trace_present=bool(editing_software),
        editing_software_found=editing_software,
        content_credentials_present=content_credentials_present,
        ela_difference_score=ela_score,
        ela_suspicion=ela_suspicion,
        signals=_manipulation_signals(ai_signals, editing_software, content_credentials_present, ela_suspicion, visual_analysis.signals),
        summary=_manipulation_summary(ai_likelihood, editing_software, ela_suspicion),
    )
    general_summary = ExifGeneralSummary(
        file_type=image.format or "Tespit edilemedi",
        overall_result=overall_result,
        overall_label=overall_label,
        confidence_score=confidence_score,
        risk_score=risk_score,
        ai_risk_score=ai_risk_score,
        ai_risk_level=ai_risk_level,
        ai_generation_likelihood=ai_likelihood,
        editing_trace_present=bool(editing_software),
        source_estimate=source_analysis.likely_source,
        gps_present=gps_present,
        exif_present=exif_present,
        citizen_comment=citizen_summary,
        trust_indicators=trust_indicators,
        review_points=review_points,
    )

    return ExifAnalysisResponse(
        file_name=file_name,
        file_size=len(content),
        file_type=image.format or "Tespit edilemedi",
        image_width=image.width,
        image_height=image.height,
        camera_make=camera_make,
        camera_model=camera_model,
        software=software,
        datetime_original=datetime_original,
        gps_present=gps_present,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        privacy_risk="caution" if gps_present else "safe",
        citizen_summary=citizen_summary,
        technical_findings=_build_findings(exif, gps_present, metadata_status, risk_breakdown, integrity),
        metadata_status=metadata_status,
        overall_result=overall_result,
        confidence_score=confidence_score,
        risk_score=risk_score,
        ai_risk_score=ai_risk_score,
        ai_risk_level=ai_risk_level,
        ai_risk_reasons=ai_risk_reasons,
        ai_signal_breakdown=ai_breakdown,
        filename_ai_signals=filename_ai_signals,
        metadata_ai_signals=metadata_ai_signals,
        pixel_ai_signals=visual_analysis.signals,
        ai_generation_likelihood=ai_likelihood,
        editing_trace_present=bool(editing_software),
        source_estimate=source_analysis.likely_source,
        trust_indicators=trust_indicators,
        review_points=review_points,
        risk_score_breakdown=risk_breakdown,
        general_summary=general_summary,
        manipulation_analysis=manipulation_analysis,
        visual_content_analysis=visual_analysis,
        source_analysis=source_analysis,
        forensic_hashes=hashes,
        file_integrity=integrity,
        osint_links=_osint_links(),
        ela_image_base64=ela_image_base64,
        ela_difference_score=ela_score,
        ela_warning="ELA ön inceleme sinyalidir; tek başına kesin delil değildir." if ela_score is not None else "ELA yalnızca JPEG görseller için üretildi.",
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


def _metadata_text(exif: dict[str, Any], image_info: dict[str, Any], file_name: str) -> str:
    values = [file_name]
    values.extend(str(value) for value in exif.values())
    values.extend(str(value) for value in image_info.values())
    return " ".join(values)


def _metadata_status(exif: dict[str, Any], image_info: dict[str, Any], gps_present: bool) -> str:
    present_fields = sum(1 for key in ("Make", "Model", "Software", "DateTimeOriginal", "DateTime") if exif.get(key))
    if gps_present:
        present_fields += 1
    if image_info:
        present_fields += 1
    if present_fields >= 2:
        return "EXIF mevcut"
    if present_fields == 1:
        return "Sınırlı metadata"
    return "Metadata bulunamadı"


def _file_integrity(file_name: str, content_type: str, detected_format: str | None, content: bytes) -> ExifFileIntegrity:
    extension = Path(file_name).suffix.lower() or "yok"
    expected_by_extension = {".jpg": "JPEG", ".jpeg": "JPEG", ".png": "PNG"}.get(extension)
    expected_by_mime = {"image/jpeg": "JPEG", "image/jpg": "JPEG", "image/png": "PNG"}.get(content_type)
    signature_format = _signature_format(content)
    detected = detected_format or signature_format
    warnings: list[str] = []
    extension_matches = expected_by_extension is None or detected in {expected_by_extension, "MPO"}
    mime_matches = expected_by_mime is None or detected in {expected_by_mime, "MPO"}
    if not extension_matches:
        warnings.append("Dosya uzantısı ile tespit edilen görsel formatı uyuşmuyor.")
    if not mime_matches:
        warnings.append("MIME type ile dosya imzası uyuşmuyor.")
    if signature_format and detected and signature_format not in {detected, "MPO"}:
        warnings.append("Dosya imzası ile görsel okuyucu çıktısı farklı görünüyor.")
    return ExifFileIntegrity(
        file_extension=extension,
        declared_content_type=content_type or None,
        detected_format=detected,
        extension_matches_content=extension_matches,
        mime_matches_signature=mime_matches,
        warnings=warnings,
    )


def _signature_format(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "JPEG"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    return None


def _find_words(text: str, words: tuple[str, ...]) -> list[str]:
    lower_text = text.lower()
    found: list[str] = []
    for word in words:
        if word in lower_text:
            found.append(_display_word(word))
    return list(dict.fromkeys(found))


def _display_word(word: str) -> str:
    replacements = {
        "chatgpt image": "ChatGPT Image",
        "chatgpt": "ChatGPT",
        "openai": "OpenAI",
        "dall-e": "DALL-E",
        "dall·e": "DALL-E",
        "dalle": "DALL-E",
        "c2pa": "C2PA",
        "bfl": "BFL",
        "black-forest-labs": "Black Forest Labs",
        "mj": "Midjourney",
        "sdxl": "SDXL",
        "image_fx": "ImageFX",
        "ai_image": "AI image",
        "ai-image": "AI image",
        "ai-generated": "AI generated",
        "ai generated": "AI generated",
        "generative ai": "Generative AI",
        "content credentials": "Content Credentials",
        "adobe photoshop": "Adobe Photoshop",
        "photoshop": "Adobe Photoshop",
        "gimp": "GIMP",
    }
    return replacements.get(word, word.title())


def _filename_ai_signals(file_name: str) -> list[str]:
    lower_name = file_name.lower()
    signals: list[str] = []
    patterns = {
        "ChatGPT Image": r"chatgpt\s+image",
        "DALL-E": r"dall[-·]?e|dalle",
        "AI generated": r"ai[-_ ]?generated|generated",
        "AI image": r"ai[-_ ]?image",
        "ImageFX": r"image[_-]?fx",
        "Midjourney": r"\bmidjourney\b|\bmj\b",
        "Stable Diffusion": r"stable[-_ ]?diffusion|\bstable\b|\bsdxl\b",
        "Flux": r"\bflux\b|black[-_ ]forest[-_ ]labs|\bbfl\b",
        "Leonardo": r"\bleonardo\b",
        "Firefly": r"\bfirefly\b",
        "Ideogram": r"\bideogram\b",
    }
    for label, pattern in patterns.items():
        if re.search(pattern, lower_name):
            signals.append(f"Dosya adı {label} kalıbı içeriyor.")
    return list(dict.fromkeys(signals))


def _metadata_ai_signals(exif: dict[str, Any], image_info: dict[str, Any]) -> list[str]:
    signals: list[str] = []
    strong_ai_keys = {
        "prompt",
        "negative_prompt",
        "parameters",
        "sampler",
        "steps",
        "cfg_scale",
        "seed",
        "workflow",
    }
    value_words = tuple(
        word
        for word in AI_SIGNAL_WORDS
        if word not in {"model", "generator", "generated", "stable"}
    )
    combined = {**{str(key): value for key, value in exif.items()}, **{str(key): value for key, value in image_info.items()}}
    for key, value in combined.items():
        key_lower = key.lower()
        value_text = str(value).lower()
        found = _find_words(value_text, value_words)
        if key_lower in strong_ai_keys or found:
            label = ", ".join(found[:3]) if found else key
            signals.append(f"Metadata alanı AI üretim sinyali içeriyor: {key} ({label}).")
    return list(dict.fromkeys(signals))


def _ai_likelihood(ai_signals: list[str]) -> ManipulationLikelihood:
    if len(ai_signals) >= 2:
        return "high"
    if ai_signals:
        return "medium"
    return "low"


def _ai_likelihood_from_score(score: int) -> ManipulationLikelihood:
    if score >= 50:
        return "high"
    if score >= 25:
        return "medium"
    return "low"


def _ai_risk_level(score: int) -> str:
    if score >= 50:
        return "Yüksek"
    if score >= 25:
        return "Orta"
    return "Düşük"


def _visual_content_analysis(
    image: Image.Image,
    exif_present: bool,
    camera_make: str | None,
    camera_model: str | None,
    filename_ai_signals: list[str],
) -> ExifVisualContentAnalysis:
    rgb = image.convert("RGB")
    rgb.thumbnail((768, 768))
    gray = rgb.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_stat = ImageStat.Stat(edges)
    gray_stat = ImageStat.Stat(gray)
    edge_score = round(edge_stat.mean[0], 2)
    texture_score = round(gray_stat.stddev[0], 2)
    blur = gray.filter(ImageFilter.GaussianBlur(radius=1.2))
    high_freq = ImageChops.difference(gray, blur)
    noise_score = round(ImageStat.Stat(high_freq).mean[0], 2)
    rgb_stat = ImageStat.Stat(rgb)
    histogram_score = round(sum(rgb_stat.stddev) / len(rgb_stat.stddev), 2)

    camera_noise = "Normal"
    if noise_score < 1.2:
        camera_noise = "Çok düşük"
    elif noise_score < 2.8:
        camera_noise = "Düşük"

    edge_consistency = "Normal"
    if edge_score < 3.5 and max(image.size) >= 1024:
        edge_consistency = "Şüpheli"
    elif edge_score < 2:
        edge_consistency = "Belirsiz"

    texture_smoothness = "Normal"
    if texture_score < 28 and max(image.size) >= 1024:
        texture_smoothness = "Yüksek"
    elif texture_score < 18:
        texture_smoothness = "Belirsiz"

    color_signal = "Normal"
    if histogram_score < 24 and max(image.size) >= 1024:
        color_signal = "Şüpheli"
    elif histogram_score < 16:
        color_signal = "Belirsiz"

    signals: list[str] = []
    if image.format == "PNG" and not exif_present and not (camera_make or camera_model):
        signals.append("PNG formatında kamera EXIF/cihaz bilgisi bulunmadı; kamera doğrudan çekimiyle uyum zayıf.")
    if camera_noise == "Çok düşük":
        signals.append("Doğal kamera gürültüsü çok düşük görünüyor.")
    elif camera_noise == "Düşük":
        signals.append("Doğal kamera gürültüsü düşük görünüyor.")
    if edge_consistency == "Şüpheli":
        signals.append("Kenar yoğunluğu yüksek çözünürlüğe göre düşük; yumuşak/sentetik geçiş sinyali olabilir.")
    if texture_smoothness == "Yüksek":
        signals.append("Doku pürüzsüzlüğü yüksek; bu tek başına kanıt değildir ancak destekleyici sinyaldir.")
    if color_signal == "Şüpheli":
        signals.append("Renk/histogram dağılımı steril veya homojen görünüyor.")

    pixel_points = 0
    if camera_noise == "Çok düşük":
        pixel_points += 15
    elif camera_noise == "Düşük":
        pixel_points += 8
    if edge_consistency == "Şüpheli" or texture_smoothness == "Yüksek" or color_signal == "Şüpheli":
        pixel_points += 15
    if len([signal for signal in (edge_consistency, texture_smoothness, color_signal) if signal in {"Şüpheli", "Yüksek"}]) >= 2:
        pixel_points += 10
    if filename_ai_signals:
        pixel_points += 15

    ai_content_signal = _ai_likelihood_from_score(min(100, pixel_points))
    comment = "Piksel istatistikleri belirgin AI/manipülasyon sinyali üretmedi."
    if ai_content_signal == "medium":
        comment = "Piksel istatistiklerinde AI veya dışa aktarım ihtimalini destekleyen bazı sinyaller var."
    elif ai_content_signal == "high":
        comment = "Piksel istatistikleri ve dosya sinyalleri AI/dışa aktarım ihtimalini güçlendiriyor."

    return ExifVisualContentAnalysis(
        ai_content_signal=ai_content_signal,
        camera_noise=camera_noise,
        edge_consistency=edge_consistency,
        texture_smoothness=texture_smoothness,
        color_histogram_signal=color_signal,
        pixel_comment=comment,
        signals=signals or ["Piksel tabanlı güçlü bir anomali sinyali tespit edilmedi."],
        noise_score=noise_score,
        edge_score=edge_score,
        texture_score=texture_score,
        histogram_score=histogram_score,
    )


def _ai_signal_breakdown(
    image: Image.Image,
    exif_present: bool,
    camera_make: str | None,
    camera_model: str | None,
    filename_ai_signals: list[str],
    metadata_ai_signals: list[str],
    visual_analysis: ExifVisualContentAnalysis,
    content_credentials_present: bool,
) -> list[ExifSignalBreakdownItem]:
    items: list[ExifSignalBreakdownItem] = []
    for signal in filename_ai_signals:
        points = 40 if any(name in signal.lower() for name in ("chatgpt", "dall", "midjourney", "stable", "flux")) else 30
        items.append(ExifSignalBreakdownItem(signal="Dosya adı AI kalıbı", source="dosya adı", points=points, detail=signal))
    for signal in metadata_ai_signals:
        items.append(ExifSignalBreakdownItem(signal="AI metadata sinyali", source="metadata", points=45, detail=signal))
    if image.format == "PNG" and not exif_present and not (camera_make or camera_model):
        items.append(
            ExifSignalBreakdownItem(
                signal="PNG + kamera EXIF yok",
                source="dosya yapısı",
                points=15,
                detail="PNG formatında kamera EXIF ve cihaz bilgisi bulunmadı; bu AI kanıtı değil, destekleyici sinyaldir.",
            )
        )
    if image.format == "PNG" and max(image.size) >= 1024 and not (camera_make or camera_model):
        items.append(
            ExifSignalBreakdownItem(
                signal="PNG yüksek çözünürlük + kamera bilgisi yok",
                source="dosya yapısı",
                points=10,
                detail="Yüksek çözünürlüklü PNG dosyada kamera marka/model bilgisi yok.",
            )
        )
    if visual_analysis.camera_noise == "Çok düşük":
        items.append(ExifSignalBreakdownItem(signal="Doğal kamera gürültüsü çok düşük", source="piksel", points=15, detail="Yüksek frekans gürültü ölçümü çok düşük çıktı."))
    elif visual_analysis.camera_noise == "Düşük":
        items.append(ExifSignalBreakdownItem(signal="Doğal kamera gürültüsü düşük", source="piksel", points=8, detail="Yüksek frekans gürültü ölçümü düşük çıktı."))
    anomaly_count = sum(
        1
        for value in (visual_analysis.edge_consistency, visual_analysis.texture_smoothness, visual_analysis.color_histogram_signal)
        if value in {"Şüpheli", "Yüksek"}
    )
    if anomaly_count >= 2:
        items.append(ExifSignalBreakdownItem(signal="Kenar/doku/histogram anomalileri", source="piksel", points=25, detail="Birden fazla piksel istatistiği destekleyici anomali üretti."))
    elif anomaly_count == 1:
        items.append(ExifSignalBreakdownItem(signal="Kenar/doku/histogram anomalisi", source="piksel", points=15, detail="Bir piksel istatistiği destekleyici anomali üretti."))
    if content_credentials_present:
        items.append(ExifSignalBreakdownItem(signal="Content Credentials / C2PA", source="metadata", points=35, detail="Metadata içinde Content Credentials veya C2PA sinyali görüldü."))
    return items


def _build_ela_preview(image: Image.Image, content: bytes) -> tuple[str | None, float | None, bool]:
    if image.format not in {"JPEG", "MPO"}:
        return None, None, False
    try:
        original = Image.open(BytesIO(content)).convert("RGB")
        original.thumbnail((900, 900))
        compressed_buffer = BytesIO()
        original.save(compressed_buffer, "JPEG", quality=85)
        compressed = Image.open(BytesIO(compressed_buffer.getvalue())).convert("RGB")
        diff = ImageChops.difference(original, compressed)
        stat = ImageStat.Stat(diff)
        mean = sum(stat.mean) / len(stat.mean)
        extrema = diff.getextrema()
        max_diff = max(channel[1] for channel in extrema) or 1
        scale = min(12.0, 255.0 / max_diff)
        diff = ImageEnhance.Brightness(diff).enhance(scale)
        output = BytesIO()
        diff.save(output, "PNG")
        score = round(min(100.0, mean * 4), 2)
        return f"data:image/png;base64,{base64.b64encode(output.getvalue()).decode('ascii')}", score, score >= 25
    except Exception:
        return None, None, False


def _source_analysis(
    file_name: str,
    image: Image.Image,
    exif_present: bool,
    camera_make: str | None,
    camera_model: str | None,
    ai_likelihood: ManipulationLikelihood,
    editing_software: list[str],
) -> ExifSourceAnalysis:
    lower_name = file_name.lower()
    width, height = image.width or 0, image.height or 0
    screenshot_signal = any(word in lower_name for word in ("screenshot", "screen", "ekran", "capture"))
    whatsapp_signal = bool(re.search(r"img-\d{8}-wa\d+", lower_name))
    social_signal = not exif_present and image.format in {"JPEG", "MPO"} and max(width, height) <= 2048
    camera_probability = 92 if camera_make or camera_model else 35
    screenshot_probability = 75 if screenshot_signal or (image.format == "PNG" and not exif_present) else 20
    whatsapp_probability = 85 if whatsapp_signal else (45 if social_signal else 15)
    telegram_probability = 45 if social_signal and not whatsapp_signal else 15
    social_probability = 70 if social_signal else 25
    ai_probability = 80 if ai_likelihood == "high" else 45 if ai_likelihood == "medium" else 10
    downloaded_probability = 55 if not exif_present and not screenshot_signal else 20

    signals: list[str] = []
    if camera_make or camera_model:
        signals.append("Cihaz marka/model bilgisi kamera fotoğrafı sinyali veriyor.")
    if whatsapp_signal:
        signals.append("Dosya adı WhatsApp aktarım paternine benziyor.")
    if screenshot_signal:
        signals.append("Dosya adı veya format ekran görüntüsü sinyali içeriyor.")
    if social_signal:
        signals.append("EXIF bilgisinin sınırlı olması sosyal medya veya mesajlaşma aktarımıyla ilişkili olabilir.")
    if editing_software:
        signals.append("Düzenleme yazılımı izi kaynak değerlendirmesinde dikkate alındı.")

    candidates = {
        "Kamera/telefon fotoğrafı": camera_probability,
        "Ekran görüntüsü": screenshot_probability,
        "İnternetten indirilmiş olabilir": downloaded_probability,
        "WhatsApp üzerinden aktarılmış olabilir": whatsapp_probability,
        "Telegram üzerinden aktarılmış olabilir": telegram_probability,
        "Sosyal medya sıkıştırması olabilir": social_probability,
        "AI üretimi olabilir": ai_probability,
    }
    likely_source = max(candidates, key=candidates.get)
    return ExifSourceAnalysis(
        likely_source=likely_source,
        camera_photo_probability=camera_probability,
        screenshot_probability=screenshot_probability,
        downloaded_probability=downloaded_probability,
        whatsapp_probability=whatsapp_probability,
        telegram_probability=telegram_probability,
        social_media_probability=social_probability,
        ai_generated_probability=ai_probability,
        signals=signals or ["Kaynak tahmini için güçlü bir özel sinyal bulunamadı."],
        summary=f"En güçlü kaynak tahmini: {likely_source}. Bu sonuç otomatik sinyal değerlendirmesidir.",
    )


def _risk_breakdown(
    gps_present: bool,
    exif_present: bool,
    ai_likelihood: ManipulationLikelihood,
    editing_software: list[str],
    source_analysis: ExifSourceAnalysis,
    integrity: ExifFileIntegrity,
    ela_suspicion: bool,
) -> list[ExifRiskBreakdownItem]:
    items: list[ExifRiskBreakdownItem] = []
    if editing_software:
        items.append(ExifRiskBreakdownItem(label="Düzenleme yazılımı izi", points=20, detail=f"Bulunan izler: {', '.join(editing_software)}."))
    if not exif_present:
        items.append(ExifRiskBreakdownItem(label="EXIF silinmiş veya yok", points=10, detail="Fotoğrafta belirgin EXIF metadata okunamadı."))
    if ai_likelihood == "high":
        items.append(ExifRiskBreakdownItem(label="AI üretim sinyali", points=30, detail="Metadata içinde birden fazla AI üretim sinyali görüldü."))
    elif ai_likelihood == "medium":
        items.append(ExifRiskBreakdownItem(label="AI üretim sinyali", points=15, detail="Metadata içinde sınırlı AI üretim sinyali görüldü."))
    if source_analysis.screenshot_probability >= 70:
        items.append(ExifRiskBreakdownItem(label="Ekran görüntüsü sinyali", points=5, detail="Dosya adı, format veya metadata ekran görüntüsü ihtimalini artırıyor."))
    if source_analysis.social_media_probability >= 70:
        items.append(ExifRiskBreakdownItem(label="Sosyal medya sıkıştırması", points=10, detail="EXIF bilgisi ve boyut paternleri yeniden sıkıştırma ihtimalini artırıyor."))
    if source_analysis.whatsapp_probability >= 70 or source_analysis.telegram_probability >= 70:
        items.append(ExifRiskBreakdownItem(label="Mesajlaşma aktarım sinyali", points=10, detail="Dosya adı veya metadata WhatsApp/Telegram aktarımıyla uyumlu olabilir."))
    if integrity.warnings:
        items.append(ExifRiskBreakdownItem(label="Dosya tutarlılığı uyarısı", points=25, detail="; ".join(integrity.warnings)))
    if ela_suspicion:
        items.append(ExifRiskBreakdownItem(label="ELA lokal fark yoğunluğu", points=25, detail="ELA haritasında yüksek fark yoğunluğu ön inceleme sinyali üretti."))
    if gps_present:
        items.append(ExifRiskBreakdownItem(label="GPS bilgisi", points=0, detail="Konum bilgisi gizlilik açısından önemlidir; manipülasyon riski olarak puanlanmadı."))
    return items


def _overall_result(
    risk_score: int,
    ai_risk_score: int,
    editing_trace_present: bool,
    exif_present: bool,
    camera_info_present: bool,
    file_consistent: bool,
) -> tuple[OverallExifResult, str]:
    if ai_risk_score >= 50:
        return "suspicious", "AI Üretim / Manipülasyon Şüphesi"
    if ai_risk_score >= 25:
        return "review", "İncelenmeli"
    if editing_trace_present:
        return "review", "İncelenmeli"
    if exif_present and camera_info_present and file_consistent and risk_score <= 20:
        return "original", "Orijinal Görünüyor"
    if risk_score <= 20:
        return "original", "Orijinal Görünüyor"
    if risk_score <= 49:
        return "review", "İncelenmeli"
    return "suspicious", "Manipülasyon Şüphesi"


def _trust_indicators(
    camera_make: str | None,
    camera_model: str | None,
    exif_present: bool,
    gps_present: bool,
    integrity: ExifFileIntegrity,
    hashes: ExifForensicHashes,
) -> list[str]:
    indicators = ["Hash üretildi"]
    if camera_make or camera_model:
        indicators.append("Kamera fotoğrafı sinyali")
    if exif_present:
        indicators.append("EXIF mevcut")
    if integrity.extension_matches_content and integrity.mime_matches_signature:
        indicators.append("Dosya yapısı tutarlı")
    if gps_present:
        indicators.append("GPS verisi okunabildi")
    if hashes.sha256:
        indicators.append("SHA256 parmak izi hazır")
    return indicators


def _review_points(
    risk_breakdown: list[ExifRiskBreakdownItem],
    gps_present: bool,
    exif_present: bool,
    editing_software: list[str],
    ai_signals: list[str],
) -> list[str]:
    points = [item.detail for item in risk_breakdown if item.points > 0]
    if gps_present:
        points.append("Fotoğrafta konum bilgisi var; paylaşım öncesinde metadata temizliği önerilir.")
    if not exif_present:
        points.append("EXIF bilgisi bulunamadı veya temizlenmiş olabilir.")
    if editing_software:
        points.append("Fotoğrafın düzenleme yazılımından geçtiğine dair iz bulundu.")
    if ai_signals:
        points.append("Metadata içinde AI üretim araçlarına benzeyen ifadeler görüldü.")
    return list(dict.fromkeys(points)) or ["İnceleme gerektiren güçlü bir sinyal tespit edilmedi."]


def _citizen_summary(
    overall_result: OverallExifResult,
    source_estimate: str,
    risk_score: int,
    gps_present: bool,
    editing_software: list[str],
    ai_signals: list[str],
) -> str:
    if overall_result == "original":
        summary = "Bu fotoğraf ilk incelemede normal bir görsel gibi görünmektedir. Yapay zeka veya montaj şüphesi oluşturan güçlü bir bulgu tespit edilmemiştir."
    elif overall_result == "review":
        summary = "Bu fotoğrafta inceleme gerektiren bazı teknik sinyaller bulundu. Sonuca varmadan önce kaynak, paylaşım zinciri ve görsel bağlamı kontrol edilmelidir."
    else:
        summary = "Bu fotoğrafta manipülasyon şüphesini artıran birden fazla teknik sinyal görüldü. Kesin hüküm için uzman incelemesi gerekir."
    extras: list[str] = [f"Kaynak tahmini: {source_estimate}."]
    if gps_present:
        extras.append("Konum verisi bulunduğu için paylaşmadan önce metadata temizlenmesi önerilir.")
    if editing_software:
        extras.append("Düzenleme yazılımı izi bulundu.")
    if ai_signals:
        extras.append("AI üretim olasılığına dair metadata sinyali görüldü.")
    extras.append(f"Ön inceleme risk skoru: {risk_score}/100.")
    return " ".join([summary, *extras])


def _manipulation_signals(
    ai_signals: list[str],
    editing_software: list[str],
    content_credentials_present: bool,
    ela_suspicion: bool,
    pixel_signals: list[str],
) -> list[str]:
    signals: list[str] = []
    if ai_signals:
        signals.append(f"AI/üretim sinyalleri: {', '.join(ai_signals)}.")
    if editing_software:
        signals.append(f"Düzenleme yazılımı izleri: {', '.join(editing_software)}.")
    if content_credentials_present:
        signals.append("C2PA / Content Credentials benzeri metadata sinyali görüldü.")
    if ela_suspicion:
        signals.append("ELA fark haritasında lokal yoğunluk sinyali görüldü.")
    signals.extend(signal for signal in pixel_signals if "güçlü bir anomali" not in signal.lower())
    return signals or ["Yapay zeka veya düzenleme yazılımı için güçlü metadata sinyali bulunamadı."]


def _manipulation_summary(ai_likelihood: ManipulationLikelihood, editing_software: list[str], ela_suspicion: bool) -> str:
    if ai_likelihood == "high":
        return "Metadata içinde AI üretim olasılığını güçlendiren sinyaller bulundu."
    if editing_software:
        return "Fotoğrafın düzenleme yazılımından geçtiğine dair iz bulundu."
    if ela_suspicion:
        return "ELA haritası lokal fark yoğunluğu gösterdi; bu yalnızca ön inceleme sinyalidir."
    return "Manipülasyon veya AI üretimi için güçlü bir teknik sinyal tespit edilmedi."


def _osint_links() -> ExifOsintLinks:
    return ExifOsintLinks(
        google_lens="https://lens.google.com/",
        yandex_images="https://yandex.com/images/",
        bing_visual_search="https://www.bing.com/visualsearch",
        notes=[
            "Görsel otomatik olarak üçüncü taraf servislere yüklenmez.",
            "Aynı görselin farklı bağlamda kullanılıp kullanılmadığı manuel kontrol edilebilir.",
            "Logo, plaka, tabela, bina ve yol levhası gibi unsurlar ayrıca incelenmelidir.",
        ],
    )


def _build_findings(
    exif: dict[str, Any],
    gps_present: bool,
    metadata_status: str,
    risk_breakdown: list[ExifRiskBreakdownItem],
    integrity: ExifFileIntegrity,
) -> list[ExifFinding]:
    findings: list[ExifFinding] = []
    if gps_present:
        findings.append(
            ExifFinding(
                severity="caution",
                title="GPS konumu bulundu",
                detail="Fotoğraf EXIF verisinde konum bilgisi var. Herkese açık paylaşımdan önce temizlenmesi önerilir.",
            )
        )
    if exif.get("Make") or exif.get("Model"):
        findings.append(
            ExifFinding(
                severity="safe",
                title="Cihaz bilgisi",
                detail="Fotoğraf içinde cihaz marka/model bilgisi okunabildi.",
            )
        )
    if metadata_status == "Metadata bulunamadı":
        findings.append(
            ExifFinding(
                severity="caution",
                title="Metadata bulunamadı",
                detail="Fotoğrafta belirgin EXIF metadata bilgisi okunamadı veya metadata temizlenmiş olabilir.",
            )
        )
    for warning in integrity.warnings:
        findings.append(ExifFinding(severity="caution", title="Dosya tutarlılığı", detail=warning))
    for item in risk_breakdown:
        if item.points > 0:
            findings.append(ExifFinding(severity="caution", title=item.label, detail=item.detail))
    if not findings:
        findings.append(
            ExifFinding(
                severity="safe",
                title="Sınırlı risk sinyali",
                detail="İlk teknik incelemede güçlü bir manipülasyon veya gizlilik sinyali bulunmadı.",
            )
        )
    return findings


def _clean_value(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
