from urllib.parse import urlparse

from app.analyzers.base import ProductSnapshot
from app.analyzers.html_utils import negative_density
from app.analyzers.registry import analyze_with_marketplace_parser
from app.models.analysis import (
    AiSummary, AnalysisResponse, TrustScoreItem, AnalysisMode,
    RiskBadge, DecisionResult, CategoryComparison,
)
from app.services.openai_summary_service import generate_ai_summary


def analyze_product_url(url: str) -> AnalysisResponse:
    snapshot = _safe_parse_product(url)
    risk_seed = _risk_seed(url, snapshot)
    trust_score, breakdown = _risk_score_with_breakdown(snapshot, risk_seed)
    negative_review_density = _negative_review_density(snapshot, risk_seed)
    data_quality_flags = _data_quality_flags(snapshot)

    if trust_score >= 78:
        risk_level = "safe"
    elif trust_score >= 58:
        risk_level = "caution"
    else:
        risk_level = "risk"

    has_reviews = len(snapshot.review_snippets) > 0
    analysis_mode: AnalysisMode = "review_based" if has_reviews else "signal_based"
    rating_trust_signal = _rating_trust_signal(snapshot)

    effective_brand, brand_inferred = _infer_brand_from_product_name(
        snapshot.brand_name, snapshot.product_name
    )
    brand_trust_score, brand_trust_signal = _brand_trust(effective_brand)
    if brand_inferred:
        brand_trust_signal += " (Marka, ürün adından tahmin edildi.)"

    seller_trust_score, seller_trust_signal = _seller_trust(
        snapshot.seller_name, snapshot.brand_name, snapshot.has_merchant_sticker
    )
    fake_risk_level, fake_risk_reason = _fake_product_risk(snapshot, brand_trust_score)
    cat_risk_level, cat_risk_reason, cat_score_delta = _category_risk(snapshot.category_hint)
    price_perf_signal = _price_performance_signal(snapshot)
    data_conf_score, data_conf_reasons = _data_confidence(snapshot)
    risk_badges = _build_risk_badges(
        snapshot, analysis_mode, brand_trust_score, cat_risk_level,
        seller_trust_score, fake_risk_level, effective_brand
    )

    # V4 motors
    data_conf_grade = _data_confidence_grade(data_conf_score)
    strengths, weaknesses = _strengths_weaknesses(
        snapshot, brand_trust_score, data_conf_score, cat_risk_level,
        seller_trust_score=seller_trust_score,
        fake_risk_level=fake_risk_level,
    )
    decision = _decision_engine(
        trust_score=trust_score,
        brand_trust_score=brand_trust_score,
        data_confidence_score=data_conf_score,
        rating=snapshot.rating,
        review_count=snapshot.review_count,
        price=snapshot.price,
        risk_badges=risk_badges,
        cat_risk_level=cat_risk_level,
        analysis_mode=analysis_mode,
        strengths=strengths,
        weaknesses=weaknesses,
        fake_risk_level=fake_risk_level,
        seller_trust_score=seller_trust_score,
    )
    risk_summary_level, risk_summary_reasons = _risk_summary(trust_score, risk_badges, cat_risk_level)
    category_comparison = _category_comparison(snapshot.category_hint, snapshot.review_count)
    score_summary = _score_summary(trust_score, strengths, weaknesses)

    if has_reviews:
        fallback_summary = AiSummary(
            positive=_positive_summary(snapshot),
            negative=_negative_summary(risk_level),
            fake_review_pattern=_fake_review_summary(risk_level),
            delivery_complaints=_delivery_summary(negative_review_density),
            return_issues=_return_summary(risk_level),
            recommendation=_recommendation(risk_level),
        )
        ai_summary, detailed_summary = generate_ai_summary(
            snapshot=snapshot,
            risk_level=risk_level,
            trust_score=trust_score,
            negative_review_density=negative_review_density,
            fallback_summary=fallback_summary,
        )
    else:
        ai_summary = _signal_only_summary(snapshot, risk_level, trust_score, negative_review_density)
        detailed_summary = None

    return AnalysisResponse(
        product_name=snapshot.product_name or _make_product_name(url, snapshot.marketplace),
        seller_name=snapshot.seller_name or "",
        brand_name=effective_brand,
        marketplace=snapshot.marketplace,
        rating=snapshot.rating or round(max(2.7, min(4.8, 4.7 - (risk_seed / 30))), 1),
        review_count=snapshot.review_count or 0,
        negative_review_density=negative_review_density,
        trust_score=trust_score,
        price=snapshot.price,
        original_price=snapshot.original_price,
        discount_percent=snapshot.discount_percent,
        product_link=url,
        platform=snapshot.marketplace,
        productName=snapshot.product_name or _make_product_name(url, snapshot.marketplace),
        seller=snapshot.seller_name or "",
        reviewCount=snapshot.review_count or 0,
        riskScore=trust_score,
        risk_level=risk_level,
        brand_trust_score=brand_trust_score,
        brand_trust_signal=brand_trust_signal,
        seller_trust_score=seller_trust_score,
        seller_trust_signal=seller_trust_signal,
        fake_product_risk_level=fake_risk_level,
        fake_product_risk_reason=fake_risk_reason,
        rating_trust_signal=rating_trust_signal,
        category_risk_level=cat_risk_level,
        category_risk_reason=cat_risk_reason,
        price_performance_signal=price_perf_signal,
        data_confidence_score=data_conf_score,
        data_confidence_reasons=data_conf_reasons,
        data_confidence_grade=data_conf_grade,
        decision=decision,
        category_comparison=category_comparison,
        risk_summary_level=risk_summary_level,
        risk_summary_reasons=risk_summary_reasons,
        strengths=strengths,
        weaknesses=weaknesses,
        score_summary=score_summary,
        risk_badges=risk_badges,
        analysis_mode=analysis_mode,
        ai_summary=ai_summary,
        detailed_summary=detailed_summary,
        trust_score_breakdown=breakdown,
        data_quality_flags=data_quality_flags,
        review_snippet_count=len(snapshot.review_snippets),
        parser_notes=snapshot.parser_notes,
    )


def _safe_parse_product(url: str) -> ProductSnapshot:
    try:
        return analyze_with_marketplace_parser(url)
    except Exception as exc:
        return ProductSnapshot(
            url=url,
            marketplace=_detect_marketplace(url),
            parser_notes=[f"Parser basarisiz: {type(exc).__name__}: {exc}"],
        )


def _detect_marketplace(url: str) -> str:
    host = urlparse(url).netloc.lower()

    if "trendyol" in host:
        return "Trendyol"
    if "hepsiburada" in host:
        return "Hepsiburada"
    if "n11" in host:
        return "N11"

    return "Bilinmeyen pazar yeri"


def _data_quality_flags(snapshot: ProductSnapshot) -> list[str]:
    flags: list[str] = []
    if not snapshot.product_name:
        flags.append("Ürün adı çekilemedi — başlık bilgisi eksik.")
    if not snapshot.seller_name:
        flags.append("Satıcı adı çekilemedi — satıcı doğrulaması yapılamıyor.")
    if snapshot.rating is None:
        flags.append("Puan bilgisi alınamadı — güven skoru tahmini hesaplandı.")
    if snapshot.review_count is None:
        flags.append("Yorum sayısı alınamadı — analiz sinyal kalitesi düşük.")
    if not snapshot.review_snippets:
        flags.append("Yorum metni çekilemedi — AI analizi gerçek yorumlara dayanmıyor.")
    if not snapshot.price:
        flags.append("Fiyat verisi alınamadı — fiyat/performans analizi yapılamıyor.")
    return flags


def _risk_seed(url: str, snapshot: ProductSnapshot) -> int:
    lowered = url.lower()
    signals = ["yorum", "sikayet", "ucuz", "outlet", "yenilenmis", "kampanya"]
    score = sum(7 for signal in signals if signal in lowered)
    score += len(url) % 18

    if snapshot.marketplace == "Bilinmeyen pazar yeri":
        score += 12
    if not snapshot.seller_name:
        score += 4
    if snapshot.rating is not None and snapshot.rating < 3.8:
        score += 8
    if snapshot.review_count is not None and snapshot.review_count < 10:
        score += 6

    snippet_density = negative_density(snapshot.review_snippets)
    if snippet_density:
        score += min(18, round(snippet_density / 4))

    return score


def _risk_score_with_breakdown(
    snapshot: ProductSnapshot, risk_seed: int
) -> tuple[int, list[TrustScoreItem]]:
    base = 88
    breakdown: list[TrustScoreItem] = [
        TrustScoreItem(label="Temel puan", points=base, detail="Analiz başlangıç puanı")
    ]

    url_penalty = -(risk_seed)
    breakdown.append(
        TrustScoreItem(
            label="URL ve sinyal cezası",
            points=url_penalty,
            detail=f"URL kalıpları ve eksik veri sinyallerinden -{risk_seed} puan",
        )
    )
    score = base + url_penalty

    if snapshot.rating is not None:
        if snapshot.rating < 3.5:
            score -= 18
            breakdown.append(TrustScoreItem(label="Düşük puan", points=-18, detail=f"Ürün puanı {snapshot.rating} — 3.5 altı"))
        elif snapshot.rating < 4.0:
            score -= 10
            breakdown.append(TrustScoreItem(label="Orta puan", points=-10, detail=f"Ürün puanı {snapshot.rating} — 4.0 altı"))
        elif snapshot.rating >= 4.5:
            score += 4
            breakdown.append(TrustScoreItem(label="Yüksek puan", points=4, detail=f"Ürün puanı {snapshot.rating} — 4.5 ve üstü"))
        else:
            breakdown.append(TrustScoreItem(label="Normal puan", points=0, detail=f"Ürün puanı {snapshot.rating} — nötr"))
    else:
        breakdown.append(TrustScoreItem(label="Puan bilgisi yok", points=0, detail="Sayfa puanı çekilemedi"))

    if snapshot.review_count is not None:
        if snapshot.review_count < 10:
            score -= 16
            breakdown.append(TrustScoreItem(label="Çok az yorum", points=-16, detail=f"{snapshot.review_count} yorum — güven düşük"))
        elif snapshot.review_count < 50:
            score -= 8
            breakdown.append(TrustScoreItem(label="Az yorum", points=-8, detail=f"{snapshot.review_count} yorum — sınırlı veri"))
        elif snapshot.review_count > 500:
            score += 4
            breakdown.append(TrustScoreItem(label="Çok sayıda yorum", points=4, detail=f"{snapshot.review_count} yorum — güvenilir veri"))
        else:
            breakdown.append(TrustScoreItem(label="Yorum sayısı", points=0, detail=f"{snapshot.review_count} yorum — yeterli"))
    else:
        breakdown.append(TrustScoreItem(label="Yorum sayısı yok", points=0, detail="Yorum sayısı çekilemedi"))

    if _looks_too_cheap(snapshot.price):
        score -= 10
        breakdown.append(TrustScoreItem(label="Şüpheli düşük fiyat", points=-10, detail="Fiyat 50 TL altı — risk sinyali"))

    # Puan güvenilirliği: puan + yorum sayısı kombinasyonu
    if snapshot.rating is not None and snapshot.review_count is not None:
        if snapshot.rating >= 4.8 and snapshot.review_count < 20:
            score -= 12
            breakdown.append(TrustScoreItem(
                label="Puan güvenilirliği: düşük",
                points=-12,
                detail=f"Puan {snapshot.rating} ama yalnızca {snapshot.review_count} yorum — mükemmel puan zayıf destekle şüpheli",
            ))
        elif snapshot.rating >= 4.8 and snapshot.review_count < 50:
            score -= 8
            breakdown.append(TrustScoreItem(
                label="Puan güvenilirliği: orta-düşük",
                points=-8,
                detail=f"Puan {snapshot.rating} ama yalnızca {snapshot.review_count} yorum — yeterli örnek yok",
            ))
        elif snapshot.rating >= 4.5 and snapshot.review_count < 20:
            score -= 8
            breakdown.append(TrustScoreItem(
                label="Puan güvenilirliği: düşük",
                points=-8,
                detail=f"Puan {snapshot.rating} ama yalnızca {snapshot.review_count} yorum — güven tabanı yetersiz",
            ))
        elif snapshot.rating >= 4.7 and snapshot.review_count >= 1000:
            score += 3
            breakdown.append(TrustScoreItem(
                label="Puan güvenilirliği: yüksek",
                points=3,
                detail=f"Puan {snapshot.rating} ve {snapshot.review_count} yorum — geniş tabanlı yüksek puan",
            ))
        elif snapshot.review_count >= 500 and snapshot.rating < 3.5:
            score -= 5
            breakdown.append(TrustScoreItem(
                label="Puan güvenilirliği: olumsuz sinyal",
                points=-5,
                detail=f"{snapshot.review_count} yoruma rağmen puan {snapshot.rating} — ciddi negatif birikim",
            ))

    # Sahte ürün risk katkısı (brand_trust bilinmeden önce hesaplama için geçici)
    _eff_brand, _ = _infer_brand_from_product_name(snapshot.brand_name, snapshot.product_name)
    _tmp_brand_score, _ = _brand_trust(_eff_brand)
    _fake_level, _fake_reason = _fake_product_risk(snapshot, _tmp_brand_score)
    if _fake_level == "yüksek":
        score -= 10
        breakdown.append(TrustScoreItem(label="Sahte ürün riski: yüksek", points=-10, detail=_fake_reason))
    elif _fake_level == "orta":
        score -= 5
        breakdown.append(TrustScoreItem(label="Sahte ürün riski: orta", points=-5, detail=_fake_reason))

    # Satıcı güven katkısı
    _tmp_seller_score, _ = _seller_trust(snapshot.seller_name, snapshot.brand_name, snapshot.has_merchant_sticker)
    if _tmp_seller_score >= 80:
        score += 3
        breakdown.append(TrustScoreItem(label="Onaylı/resmi satıcı", points=3, detail="Satıcı resmi mağaza sinyali taşıyor"))
    elif _tmp_seller_score <= 30:
        score -= 3
        breakdown.append(TrustScoreItem(label="Satıcı doğrulanamadı", points=-3, detail="Satıcı kimliği doğrulanamıyor"))

    # Kategori risk katkısı
    _, _, cat_delta = _category_risk(snapshot.category_hint)
    if cat_delta != 0:
        score += cat_delta
        breakdown.append(TrustScoreItem(
            label="Kategori risk katkısı",
            points=cat_delta,
            detail=f"Kategori tahmini: {snapshot.category_hint or 'belirsiz'}"
        ))

    # Marka güven katkısı
    brand_score, _ = _brand_trust(snapshot.brand_name)
    if brand_score >= 75:
        score += 3
        breakdown.append(TrustScoreItem(label="Tanınmış marka", points=3, detail=f"{snapshot.brand_name} — bilinen marka listesinde"))
    elif brand_score <= 25:
        score -= 3
        breakdown.append(TrustScoreItem(label="Şüpheli marka adı", points=-3, detail=f"{snapshot.brand_name or 'Bilinmeyen'} — isim kalitesi düşük"))

    # Yüksek indirim şüpheli fiyatlandırma
    if snapshot.discount_percent is not None and snapshot.discount_percent >= 60:
        score -= 4
        breakdown.append(TrustScoreItem(
            label="Yüksek indirim sinyali",
            points=-4,
            detail=f"%{snapshot.discount_percent} indirim — şişirilmiş liste fiyatı riski"
        ))

    final = max(20, min(95, score))
    if final != score:
        breakdown.append(TrustScoreItem(label="Sınır uygulandı", points=final - score, detail="Puan 20–95 aralığına kırpıldı"))

    return final, breakdown


def _looks_too_cheap(price: str | None) -> bool:
    if not price:
        return False

    digits = "".join(char for char in price if char.isdigit() or char in ",.")
    if not digits:
        return False

    normalized = digits.replace(".", "").replace(",", ".")
    try:
        value = float(normalized)
    except ValueError:
        return False

    return value > 0 and value < 50


def _negative_review_density(snapshot: ProductSnapshot, risk_seed: int) -> int:
    snippet_density = negative_density(snapshot.review_snippets)

    if snippet_density:
        return max(6, min(58, snippet_density))

    return max(6, min(44, 8 + risk_seed))


def _make_product_name(url: str, marketplace: str) -> str:
    path = urlparse(url).path.strip("/")
    first_part = path.split("/")[0] if path else "urun"
    readable = first_part.replace("-", " ").replace("_", " ").strip().title()

    if readable and readable.lower() != "urun":
        return readable[:72]

    return f"{marketplace} urunu"


def _make_seller_name(marketplace: str) -> str:
    if marketplace == "Bilinmeyen pazar yeri":
        return "Dogrulanmamis satici"

    return f"{marketplace} saticisi"


def _positive_summary(snapshot: ProductSnapshot) -> str:
    if snapshot.review_snippets:
        return "Sayfadan yorum metinleri alındı; olumlu sinyaller ilk yorum örneklerine göre değerlendirildi."

    if snapshot.product_name or snapshot.seller_name:
        return "Ürün sayfasından temel bilgiler alındı; yorum metni alınamadığı için özet sınırlı sinyallerle oluşturuldu."

    return "Sayfa verisi sınırlı alındı; yorum metni yok, AI analizi gerçek verilere dayanmıyor."


def _negative_summary(risk_level: str) -> str:
    if risk_level == "safe":
        return "Olumsuz yorumlar dağınık ve düşük yoğunlukta; belirgin tekrar eden şikayet hattı görünmüyor."
    if risk_level == "caution":
        return "Paketleme, teslimat hızı ve ürün beklentisi konularında tekrar eden orta seviyeli şikayetler var."
    return "Negatif sinyaller ürün kalitesi, teslimat ve iade deneyimi etrafında yoğunlaşıyor."


def _fake_review_summary(risk_level: str) -> str:
    if risk_level == "safe":
        return "Yorum çeşitliliği makul; sahte yorum paterni ihtimali düşük görünüyor."
    if risk_level == "caution":
        return "Benzer kelimelerle yazılmış kısa yorumlar nedeniyle düşük-orta seviyede patern ihtimali var."
    return "Kısa, tekrarlayan ve ayrıntı içermeyen yorumlar nedeniyle patern ihtimali dikkat gerektiriyor."


def _delivery_summary(negative_density: int) -> str:
    if negative_density < 15:
        return "Teslimat şikayetleri sınırlı ve genel memnuniyeti baskılamıyor."
    if negative_density < 30:
        return "Teslimat şikayetleri ara ara tekrar ediyor; satın almadan önce en yeni yorumlara bakılmalı."
    return "Teslimat şikayetleri belirgin; gecikme ve paketleme sinyalleri dikkatle incelenmeli."


def _return_summary(risk_level: str) -> str:
    if risk_level == "risk":
        return "İade deneyimiyle ilgili olumsuz sinyaller belirgin; satıcı koşulları kontrol edilmeli."

    return "İade problemleri kritik yoğunlukta değil, ancak koşullar satın alma öncesi okunmalı."


def _recommendation(risk_level: str) -> str:
    if risk_level == "safe":
        return "Risk sinyalleri düşük. Yine de en yeni yorumları ve satıcı puanını kontrol ederek ilerleyin."
    if risk_level == "caution":
        return "Satın alma öncesi alternatif satıcıları, son yorumları ve iade koşullarını karşılaştırın."
    return "Risk sinyalleri yoğun. Alternatif satıcı ve ürünleri incelemek daha güvenli olabilir."


def _signal_only_summary(
    snapshot: ProductSnapshot,
    risk_level: str,
    trust_score: int,
    negative_review_density: int,
) -> AiSummary:
    """Yorum metni olmadığında sinyal bazlı dürüst özet üretir. OpenAI çağrısı yapmaz."""
    rating_info = f"Puan: {snapshot.rating}" if snapshot.rating else "Puan bilgisi alınamadı"
    review_info = f"Yorum sayısı: {snapshot.review_count}" if snapshot.review_count else "Yorum sayısı alınamadı"
    seller_info = f"Satıcı: {snapshot.seller_name}" if snapshot.seller_name else "Satıcı doğrulanamadı"

    positive = (
        f"Sinyal bazlı değerlendirme — yorum metni alınamadı. "
        f"{rating_info}. {review_info}. {seller_info}. "
        f"Güven skoru {trust_score}/100 hesaplandı."
    )

    if risk_level == "safe":
        negative = (
            "Mevcut sinyaller risk içermiyor. Ancak yorum metni olmadan "
            "ürün kalitesi, teslimat ve iade deneyimi değerlendirilemedi."
        )
    elif risk_level == "caution":
        negative = (
            f"Orta düzey risk sinyalleri mevcut (negatif yoğunluk: %{negative_review_density}). "
            "Yorum metni olmadan sahte yorum tespiti veya şikayet analizi yapılamadı."
        )
    else:
        negative = (
            f"Yüksek risk sinyalleri mevcut (negatif yoğunluk: %{negative_review_density}). "
            "Yorum metni olmadan detaylı analiz yapılamadı — satın alma öncesi yorum sayfasını manuel inceleyin."
        )

    return AiSummary(
        positive=positive,
        negative=negative,
        fake_review_pattern="Yorum metni olmadan sahte yorum tespiti yapılamaz. Yorum sayfasını doğrudan ziyaret edin.",
        delivery_complaints="Kargo ve teslimat değerlendirmesi için yorum metni gerekiyor — bu analiz kapsamında mevcut değil.",
        return_issues="İade deneyimi değerlendirmesi için yorum metni gerekiyor — bu analiz kapsamında mevcut değil.",
        recommendation=_recommendation(risk_level),
    )


# ── Kategori risk motoru ──────────────────────────────────────────────────────

_CATEGORY_RISK_MAP: dict[str, tuple[str, str, int]] = {
    # (seviye, gerekçe, skor_deltası)
    "parfum-kozmetik":   ("yuksek",  "Parfüm/kozmetik — sahte veya taklit ürün riski yüksek.", -5),
    "takviye-gida":      ("yuksek",  "Takviye gıda/vitamin — içindekiler doğrulama riski.", -4),
    "saat":              ("yuksek",  "Saat — taklit/replika saat riski yüksek, seri numarası kontrolü önerilir.", -4),
    "telefon":           ("orta",    "Telefon — IMEI ve garanti doğrulaması önerilir.", -2),
    "telefon-aksesuar":  ("orta",    "Telefon aksesuarı/şarj/kablo — düşük kalite ve güvenlik riski.", -2),
    "oyuncu-ekipman":    ("orta",    "Oyuncu ekipmanı — sahte ürün ve garanti riski.", -2),
    "oyuncak":           ("orta",    "Oyuncak kategorisi — güvenlik belgesi ve kalite değişkenlik gösterir.", -2),
    "giyim":             ("orta",    "Giyim — beden uyumsuzluğu ve kalite değişkenlik riski.", -1),
    "ayakkabi":          ("orta",    "Ayakkabı — beden uyumsuzluğu ve sahte marka riski.", -1),
    "elektronik":        ("orta",    "Elektronik genel — garanti ve uyumluluk kontrol edilmeli.", -1),
    "spor-ekipman":      ("dusuk",   "Spor ekipmanı — ürün kalitesi değişken olabilir.", 0),
    "beyaz-esya":        ("dusuk",   "Beyaz esya — garanti ve kurulum sureci kontrol edilmeli.", 0),
    "kucuk-ev-aleti":    ("dusuk",   "Küçük ev aleti — garanti ve güvenlik belgesi kontrol edilmeli.", 0),
    "mobilya":           ("dusuk",   "Mobilya/ev ürünleri — kategoride sahtecilik riski düşük.", 0),
    "kitap":             ("dusuk",   "Kitap/kırtasiye — düşük sahtecilik riski.", 0),
}


def _category_risk(category_hint: str | None) -> tuple[str, str, int]:
    """Kategori tahminine göre risk seviyesi, açıklama ve skor deltası döner."""
    if not category_hint:
        return "belirsiz", "Kategori bilgisi tespit edilemedi.", 0
    entry = _CATEGORY_RISK_MAP.get(category_hint)
    if not entry:
        return "belirsiz", f"Kategori '{category_hint}' için risk verisi yok.", 0
    return entry


# ── Marka güven motoru ───────────────────────────────────────────────────────

def _infer_brand_from_product_name(
    brand_name: str | None,
    product_name: str | None,
) -> tuple[str | None, bool]:
    """
    brand_name yoksa product_name'in ilk kelime(ler)ini bilinen marka listesiyle eşleştirir.
    Döner: (bulunan_marka_veya_None, tahmin_mi_edildi)
    """
    if brand_name:
        return brand_name, False
    if not product_name:
        return None, False

    words = product_name.strip().split()
    candidates: list[str] = []
    if words:
        candidates.append(words[0].lower())
    if len(words) >= 2:
        candidates.append(f"{words[0]} {words[1]}".lower())

    for candidate in candidates:
        if candidate in _KNOWN_BRANDS:
            # Orijinal yazım şeklini koru (büyük harf)
            return words[0] if " " not in candidate else f"{words[0]} {words[1]}", True

    return None, False


_KNOWN_BRANDS: set[str] = {
    # Elektronik — Global
    "apple", "samsung", "sony", "lg", "xiaomi", "huawei", "oppo", "realme",
    "nokia", "motorola", "google", "lenovo", "asus", "acer", "dell", "hp",
    "microsoft", "amazon", "philips", "bosch", "siemens", "panasonic",
    "jbl", "bose", "anker", "baseus", "beats", "harman", "jvc", "pioneer",
    "denon", "yamaha", "marantz", "creative", "logitech", "corsair",
    "razer", "steelseries", "hyperx", "tp-link", "netgear", "d-link",
    "sharp", "hitachi", "kenwood", "dyson", "electrolux", "whirlpool",
    "indesit", "candy", "hoover", "rowenta", "karcher",
    "dewalt", "stanley", "makita", "black decker",
    # Türkiye — Elektronik & Ev Aletleri
    "arcelik", "arçelik", "beko", "vestel", "altus", "grundig", "profilo",
    "toshiba", "casper", "monster", "hometech", "reeder", "etekcity",
    "sinbo", "fakir", "arzum", "tefal", "braun", "oral-b",
    "karaca", "emsan", "korkmaz",
    # Moda & Spor
    "nike", "adidas", "puma", "reebok", "converse", "vans", "skechers",
    "new balance", "newbalance", "under armour", "columbia",
    "the north face", "timberland", "crocs", "birkenstock",
    "levi's", "levis", "wrangler", "diesel", "g-star",
    "lacoste", "tommy hilfiger", "tommy", "calvin klein",
    "versace", "hugo boss", "guess",
    # Saat & Aksesuar
    "casio", "seiko", "citizen", "fossil", "swatch", "ray-ban", "rayban",
    # Kozmetik & Kişisel Bakım
    "l'oreal", "loreal", "maybelline", "nivea", "dove", "garnier",
    "avon", "oriflame", "gillette", "pantene", "head shoulders", "colgate",
    # Ev & Mutfak
    "tupperware", "pyrex", "ikea",
}

_SUSPICIOUS_BRAND_PATTERNS = [
    r"^[a-z]{2,4}\d{4,}$",       # örn. "abc2024"
    r"^[xzqw]{3,}",               # başında nadir harfler
    r"\d{4,}",                     # dört veya daha fazla rakam
    r"^.{1,2}$",                   # 1-2 karakter
]


def _brand_trust(brand_name: str | None) -> tuple[int, str]:
    """0-100 marka güven skoru ve açıklama metni döner."""
    import re as _re  # fonksiyon scope'unda kalıyor

    if not brand_name:
        return 40, "Marka bilgisi alınamadı — nötr değerlendirme."

    normalized = brand_name.lower().strip()

    if normalized in _KNOWN_BRANDS:
        return 85, f"{brand_name} — tanınan marka listesinde, yüksek güven."

    for pattern in _SUSPICIOUS_BRAND_PATTERNS:
        if _re.search(pattern, normalized):
            return 20, f"{brand_name} — marka adı kalitesi düşük, doğrulama önerilir."

    if len(normalized) <= 3:
        return 35, f"{brand_name} — çok kısa marka adı, nötr-düşük güven."

    # Bilinmeyen ama normal görünümlü marka — nötr
    return 50, f"{brand_name} — tanınmayan marka, doğrulama önerilir ama nötr değerlendirme."


# ── V5: Satıcı Güven Motoru ──────────────────────────────────────────────────

def _seller_trust(
    seller_name: str | None,
    brand_name: str | None,
    has_merchant_sticker: bool,
) -> tuple[int, str]:
    """0-100 satıcı güven skoru ve açıklama metni döner."""
    if not seller_name:
        if has_merchant_sticker:
            return 55, "Satıcı adı alınamadı ama platform rozeti mevcut — kısmi güven."
        return 30, "Satıcı doğrulanamadı — satın almadan önce satıcı profilini kontrol edin."

    normalized = seller_name.lower().strip()
    official_keywords = [
        "resmi", "official", "türkiye", "turkiye", "turkey",
        "global", "store", "mağaza", "magaza", "boutique",
        "distribütör", "distributor", "yetkili", "authorized",
        "tr shop", "trshop", "direct", "flagship",
    ]
    brand_match = bool(brand_name and brand_name.lower() in normalized)
    has_official_kw = any(kw in normalized for kw in official_keywords)

    if brand_match and has_official_kw:
        return 90, f"{seller_name} — marka adı içeren resmi mağaza, yüksek güven."
    if brand_match:
        return 75, f"{seller_name} — satıcı adı marka adıyla örtüşüyor."
    if has_official_kw:
        return 65, f"{seller_name} — resmi mağaza kalıbı içeriyor."
    if has_merchant_sticker:
        return 60, f"{seller_name} — platform onaylı satıcı."
    return 50, f"{seller_name} — bilinen resmi mağaza değil, nötr değerlendirme."


# ── V5: Sahte Ürün Riski Motoru ──────────────────────────────────────────────

def _parse_price(price_str: str | None) -> float | None:
    """Fiyat string'inden float değer çıkarır."""
    if not price_str:
        return None
    digits = "".join(c for c in price_str if c.isdigit() or c in ",.")
    if not digits:
        return None
    try:
        return float(digits.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _fake_product_risk(
    snapshot: ProductSnapshot,
    brand_trust_score: int,
) -> tuple[str, str]:
    """
    Sahte/taklit ürün risk sinyali üretir.
    Döner: (seviye, gerekçe) — seviye: "yüksek" | "orta" | "düşük"
    """
    signals: list[str] = []
    price_val = _parse_price(snapshot.price)

    # Şüpheli marka + çok düşük fiyat
    if brand_trust_score <= 25 and price_val is not None and price_val < 100:
        signals.append("tanınmayan marka + çok düşük fiyat")

    # Tanınmış marka + alışılmadık düşük fiyat
    if brand_trust_score >= 75 and price_val is not None and price_val < 200:
        signals.append("tanınmış marka + alışılmadık düşük fiyat")

    # Marka adı ürün başlığında geçmiyor (tanınmış marka için)
    if (snapshot.brand_name and snapshot.product_name and brand_trust_score >= 75):
        brand_lower = snapshot.brand_name.lower()
        product_lower = snapshot.product_name.lower()
        if brand_lower not in product_lower:
            signals.append("marka adı ürün başlığında geçmiyor")

    # Aşırı yüksek indirim
    if snapshot.discount_percent is not None and snapshot.discount_percent >= 70:
        signals.append(f"%{snapshot.discount_percent} indirim — aşırı indirim sinyali")

    if len(signals) >= 2:
        return "yüksek", "; ".join(signals[:3])
    if len(signals) == 1:
        return "orta", signals[0]
    return "düşük", "Belirgin sahte ürün sinyali tespit edilmedi."


# ── Fiyat/Performans motoru ──────────────────────────────────────────────────

def _price_performance_signal(snapshot: ProductSnapshot) -> str:
    """Fiyat + puan + indirim verilerinden fiyat/performans sinyali üretir. Fiyat yoksa boş döner."""
    if not snapshot.price:
        return ""

    try:
        digits = "".join(c for c in snapshot.price if c.isdigit() or c in ",.")
        price_val = float(digits.replace(".", "").replace(",", "."))
    except (ValueError, TypeError):
        return ""

    if price_val <= 0:
        return ""

    parts: list[str] = []

    if snapshot.rating is not None and snapshot.review_count is not None:
        if snapshot.rating >= 4.5 and snapshot.review_count >= 100:
            parts.append("yüksek puanlı ve geniş yorumlu ürün")
        elif snapshot.rating < 3.5:
            parts.append("düşük puanlı ürün")

    if snapshot.discount_percent is not None:
        if snapshot.discount_percent >= 60:
            parts.append(f"%{snapshot.discount_percent} indirim — şişirilmiş liste fiyatı olabilir")
        elif snapshot.discount_percent >= 30:
            parts.append(f"%{snapshot.discount_percent} indirim mevcut")

    if not parts:
        return f"{snapshot.price} fiyatıyla listelenen ürün — diğer sinyallerle değerlendirilmeli."

    return f"{snapshot.price}: {'; '.join(parts)}."


# ── Veri Güvenilirliği motoru ────────────────────────────────────────────────

def _data_confidence(snapshot: ProductSnapshot) -> tuple[int, list[str]]:
    """0-100 veri güvenilirlik skoru ve gerekçe listesi döner."""
    score = 0
    reasons: list[str] = []

    if snapshot.product_name:
        score += 20
        reasons.append("Ürün adı mevcut (+20)")
    else:
        reasons.append("Ürün adı eksik (0)")

    if snapshot.brand_name:
        score += 15
        reasons.append("Marka bilgisi mevcut (+15)")
    else:
        reasons.append("Marka bilgisi eksik (0)")

    if snapshot.rating is not None:
        score += 20
        reasons.append("Puan bilgisi mevcut (+20)")
    else:
        reasons.append("Puan alınamadı (0)")

    if snapshot.review_count is not None:
        score += 20
        reasons.append(f"Yorum sayısı mevcut: {snapshot.review_count} (+20)")
    else:
        reasons.append("Yorum sayısı alınamadı (0)")

    if snapshot.seller_name:
        score += 10
        reasons.append("Satıcı adı mevcut (+10)")
    else:
        reasons.append("Satıcı doğrulanamadı (0)")

    if snapshot.price:
        score += 10
        reasons.append("Fiyat bilgisi mevcut (+10)")
    else:
        reasons.append("Fiyat alınamadı (0)")

    if snapshot.review_snippets:
        score += 5
        reasons.append(f"{len(snapshot.review_snippets)} yorum metni mevcut (+5)")
    else:
        reasons.append("Yorum metni yok (0)")

    return min(100, score), reasons


# ── Risk Rozetleri ────────────────────────────────────────────────────────────

def _build_risk_badges(
    snapshot: ProductSnapshot,
    analysis_mode: str,
    brand_trust_score: int,
    cat_risk_level: str,
    seller_trust_score: int = 40,
    fake_risk_level: str = "düşük",
    effective_brand_name: str | None = None,
) -> list[RiskBadge]:
    badges: list[RiskBadge] = []

    if snapshot.review_count is not None and snapshot.review_count >= 500:
        badges.append(RiskBadge(label="Geniş Yorum Tabanı", tone="safe", detail=f"{snapshot.review_count} yorum"))

    if snapshot.discount_percent is not None and snapshot.discount_percent >= 60:
        badges.append(RiskBadge(label="Yüksek İndirim", tone="caution", detail=f"%{snapshot.discount_percent} — şişirilmiş fiyat riski"))

    brand_label = effective_brand_name or snapshot.brand_name or "Bilinmiyor"
    if brand_trust_score >= 75:
        badges.append(RiskBadge(label="Tanınmış Marka", tone="safe", detail=brand_label))
    elif brand_trust_score <= 25:
        badges.append(RiskBadge(label="Şüpheli Marka", tone="risk", detail=brand_label))

    if snapshot.rating is not None and snapshot.review_count is not None:
        if snapshot.rating >= 4.8 and snapshot.review_count < 50:
            badges.append(RiskBadge(label="Şüpheli Puan Profili", tone="risk", detail=f"{snapshot.review_count} yorumla {snapshot.rating} puan"))

    if cat_risk_level == "yuksek":
        badges.append(RiskBadge(label="Yüksek Risk Kategorisi", tone="risk", detail="Sahtecilik/kalite riski yüksek"))

    if seller_trust_score >= 80:
        badges.append(RiskBadge(label="Onaylı Satıcı", tone="safe", detail="Resmi/onaylı satıcı sinyali"))
    elif seller_trust_score <= 30:
        badges.append(RiskBadge(label="Satıcı Doğrulanamadı", tone="caution", detail="Satıcı kimliği doğrulanamıyor"))

    if fake_risk_level == "yüksek":
        badges.append(RiskBadge(label="Sahte Ürün Riski", tone="risk", detail="Birden fazla sahte ürün sinyali"))
    elif fake_risk_level == "orta":
        badges.append(RiskBadge(label="Sahte Ürün Şüphesi", tone="caution", detail="Sahte ürün sinyali mevcut"))

    if analysis_mode == "signal_based":
        badges.append(RiskBadge(label="Yorum Metni Yok", tone="neutral", detail="AI yorum analizi çalışmadı"))

    return badges


def _rating_trust_signal(snapshot: ProductSnapshot) -> str:
    """Puan + yorum sayısı kombinasyonundan güvenilirlik sinyali üretir."""
    r = snapshot.rating
    c = snapshot.review_count

    if r is None or c is None:
        return "Puan veya yorum sayısı alınamadı — güvenilirlik değerlendirilemedi."

    if r >= 4.8 and c < 20:
        return f"Dikkat: {c} yorumla {r} puan — çok az örnekle mükemmel görünen puan şüpheli."
    if r >= 4.8 and c < 50:
        return f"Temkinli: {c} yorumla {r} puan — yeterli örnek yok, güven tabanı zayıf."
    if r >= 4.5 and c < 20:
        return f"Temkinli: {c} yorumla {r} puan — puan geniş tabana dayanmıyor."
    if r >= 4.7 and c >= 1000:
        return f"Güvenilir: {c} yorum üzerinde {r} puan — geniş tabanlı, güçlü sinyal."
    if r < 3.5 and c >= 500:
        return f"Ciddi sinyal: {c} yoruma rağmen puan {r} — yoğun negatif birikim."
    if r >= 4.0 and c >= 100:
        return f"Normal: {c} yorum, {r} puan — makul düzeyde veri."
    return f"{c} yorum, {r} puan — değerlendirme için yeterli sinyal."


# ── V4: Karar Motoru ─────────────────────────────────────────────────────────

def _decision_engine(
    trust_score: int,
    brand_trust_score: int,
    data_confidence_score: int,
    rating: float | None,
    review_count: int | None,
    price: str | None,
    risk_badges: list[RiskBadge],
    cat_risk_level: str,
    analysis_mode: str,
    strengths: list[str],
    weaknesses: list[str],
    fake_risk_level: str = "düşük",
    seller_trust_score: int = 40,
) -> DecisionResult:
    badge_tones = {b.tone for b in risk_badges}
    badge_labels = {b.label for b in risk_badges}
    points: list[str] = []

    # AVOID koşulları
    avoid = False
    if trust_score < 45:
        avoid = True
        points.append(f"Güven skoru {trust_score}/100 — çok düşük, ciddi risk sinyalleri mevcut.")
    if cat_risk_level == "yuksek" and brand_trust_score < 40:
        avoid = True
        points.append("Yüksek riskli kategoride tanınmayan marka — sahtecilik riski yüksek.")
    if rating is not None and review_count is not None and rating < 3.0 and review_count >= 100:
        avoid = True
        points.append(f"Geniş yorum tabanında ({review_count} yorum) {rating} puan — ürün kalitesi düşük.")
    # V5: Sahte ürün riski yüksekse avoid
    if fake_risk_level == "yüksek":
        avoid = True
        points.append("Birden fazla sahte/taklit ürün sinyali tespit edildi — dikkatli olun.")
    # V5: Düşük fiyat + yüksek puan + az yorum = manipüle profil
    if (rating is not None and review_count is not None and
            rating >= 4.7 and review_count < 30 and fake_risk_level in ("yüksek", "orta")):
        avoid = True
        points.append(f"Düşük fiyat + {rating} puan + {review_count} yorum — manipüle profil sinyali.")

    if avoid:
        if not points:
            points.append("Birden fazla yüksek risk sinyali tespit edildi.")
        _fill_points(points, strengths, weaknesses, analysis_mode, trust_score, data_confidence_score)
        return DecisionResult(
            decision_level="avoid",
            decision_label="Uzak Dur",
            decision_reason="Ciddi risk sinyalleri satın almayı önermiyor.",
            decision_points=points[:5],
        )

    # CAUTION koşulları
    caution = False
    if trust_score < 65:
        caution = True
        points.append(f"Güven skoru {trust_score}/100 — dikkatli değerlendirilmeli.")
    if data_confidence_score < 40:
        caution = True
        points.append("Veri güvenilirliği düşük — analiz sınırlı bilgiye dayanıyor.")
    if brand_trust_score < 40:
        caution = True
        points.append("Marka güveni düşük — doğrulama önerilir.")
    if "Şüpheli Puan Profili" in badge_labels:
        caution = True
        points.append("Puan profili şüpheli — az yorumla yüksek puan sinyali var.")
    if "risk" in badge_tones:
        caution = True
        points.append("Bir veya daha fazla yüksek risk rozeti tespit edildi.")
    # V5: Düşük puan + yüksek yorum = ciddi negatif birikim
    if rating is not None and review_count is not None and rating < 4.0 and review_count >= 500:
        caution = True
        points.append(f"{review_count} yorumla {rating} puan — geniş kitlede düşük memnuniyet.")
    # V5: Sahte ürün orta riski
    if fake_risk_level == "orta":
        caution = True
        points.append("Sahte ürün şüphesi — satın almadan önce satıcıyı doğrulayın.")
    # V5: Satıcı doğrulanamadı + yüksek riskli kategori
    if seller_trust_score <= 30 and cat_risk_level == "yuksek":
        caution = True
        points.append("Yüksek riskli kategoride satıcı doğrulanamadı.")

    if caution:
        if not points:
            points.append("Orta düzey risk sinyalleri mevcut.")
        _fill_points(points, strengths, weaknesses, analysis_mode, trust_score, data_confidence_score)
        return DecisionResult(
            decision_level="caution",
            decision_label="Dikkatli İncele",
            decision_reason="Bazı risk sinyalleri dikkat gerektiriyor; satın almadan önce doğrulayın.",
            decision_points=points[:5],
        )

    # SAFE — en güçlü pozitif koşullar birlikte karşılanıyorsa
    is_safe = (
        trust_score >= 82
        and brand_trust_score >= 75
        and data_confidence_score >= 60
        and fake_risk_level == "düşük"
        and review_count is not None
        and review_count >= 100
        and (rating is None or rating >= 4.0)
    )
    if is_safe:
        points.append(f"Güven skoru {trust_score}/100 — yüksek seviyede.")
        if brand_trust_score >= 75:
            points.append("Tanınmış marka doğrulandı.")
        if review_count is not None:
            points.append(f"{review_count} yorum — geniş kullanıcı tabanı.")
        if seller_trust_score >= 80:
            points.append("Onaylı/resmi satıcı sinyali.")
        _fill_points(points, strengths, weaknesses, analysis_mode, trust_score, data_confidence_score)
        return DecisionResult(
            decision_level="safe",
            decision_label="Güvenli",
            decision_reason="Tüm temel sinyaller olumlu — satın alma güvenli görünüyor.",
            decision_points=points[:5],
        )

    # RECOMMEND
    points.append(f"Güven skoru {trust_score}/100 — yeterli seviyede.")
    if brand_trust_score >= 75:
        points.append("Tanınmış marka doğrulandı.")
    if review_count is not None and review_count >= 100:
        points.append(f"{review_count} yorum — geniş kullanıcı tabanı.")
    if seller_trust_score >= 80:
        points.append("Onaylı/resmi satıcı sinyali.")
    _fill_points(points, strengths, weaknesses, analysis_mode, trust_score, data_confidence_score)
    return DecisionResult(
        decision_level="recommend",
        decision_label="Önerilir",
        decision_reason="Mevcut sinyaller satın almayı destekliyor.",
        decision_points=points[:5],
    )


def _fill_points(
    points: list[str],
    strengths: list[str],
    weaknesses: list[str],
    analysis_mode: str,
    trust_score: int,
    data_confidence_score: int,
) -> None:
    if analysis_mode == "signal_based" and len(points) < 4:
        points.append("Yorum metni alınamadı — AI yorum analizi bu kararda kullanılmadı.")
    if data_confidence_score < 60 and len(points) < 5:
        points.append("Veri eksiklikleri nedeniyle karar sınırlı sinyallere dayanıyor.")


# ── V4: Veri Güvenilirliği Notu ──────────────────────────────────────────────

def _data_confidence_grade(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    if score >= 40:
        return "C"
    return "D"


# ── V4: Güçlü / Zayıf Yönler ─────────────────────────────────────────────────

def _strengths_weaknesses(
    snapshot: ProductSnapshot,
    brand_trust_score: int,
    data_confidence_score: int,
    cat_risk_level: str,
    seller_trust_score: int = 40,
    fake_risk_level: str = "düşük",
) -> tuple[list[str], list[str]]:
    strengths: list[str] = []
    weaknesses: list[str] = []

    if brand_trust_score >= 75:
        strengths.append("Tanınmış marka")
    if snapshot.review_count is not None and snapshot.review_count >= 500:
        strengths.append("Yüksek yorum hacmi")
    if snapshot.rating is not None and snapshot.rating >= 4.5:
        strengths.append("Yüksek kullanıcı puanı")
    if data_confidence_score >= 70:
        strengths.append("Güçlü veri tabanı")
    if snapshot.discount_percent is None or snapshot.discount_percent < 30:
        strengths.append("Normal fiyatlandırma")
    if seller_trust_score >= 80:
        strengths.append("Onaylı/resmi satıcı")

    if not snapshot.seller_name:
        weaknesses.append("Satıcı doğrulanamadı")
    if not snapshot.review_snippets:
        weaknesses.append("Yorum metni alınamadı")
    if snapshot.review_count is not None and snapshot.review_count < 50:
        weaknesses.append("Yetersiz yorum sayısı")
    elif snapshot.review_count is None:
        weaknesses.append("Yorum sayısı bilinmiyor")
    if brand_trust_score < 40:
        weaknesses.append("Marka güveni düşük")
    if data_confidence_score < 40:
        weaknesses.append("Veri kalitesi yetersiz")
    if cat_risk_level == "yuksek":
        weaknesses.append("Yüksek riskli kategori")
    if snapshot.discount_percent is not None and snapshot.discount_percent >= 60:
        weaknesses.append("Şüpheli indirim oranı")
    if fake_risk_level == "yüksek":
        weaknesses.append("Sahte ürün riski yüksek")
    elif fake_risk_level == "orta":
        weaknesses.append("Sahte ürün şüphesi mevcut")

    return strengths, weaknesses


# ── V4: Risk Özeti ────────────────────────────────────────────────────────────

def _risk_summary(
    trust_score: int,
    risk_badges: list[RiskBadge],
    cat_risk_level: str,
) -> tuple[str, list[str]]:
    badge_tones = [b.tone for b in risk_badges]
    has_risk = "risk" in badge_tones
    has_caution = "caution" in badge_tones
    reasons: list[str] = []

    if trust_score < 55 or has_risk:
        level = "Yüksek Risk"
    elif trust_score < 75 or has_caution or cat_risk_level == "yuksek":
        level = "Orta Risk"
    else:
        level = "Düşük Risk"

    # Önce rozet tabanlı nedenler
    for badge in risk_badges:
        if badge.tone in ("risk", "caution"):
            reasons.append(badge.label)
        if len(reasons) >= 3:
            break

    # Rozet yoksa veya az ise sinyal bazlı nedenler ekle
    if len(reasons) < 3:
        if trust_score < 55:
            reasons.append(f"Güven skoru düşük ({trust_score}/100)")
        elif trust_score < 75:
            reasons.append(f"Güven skoru orta ({trust_score}/100)")
        else:
            reasons.append(f"Güven skoru yeterli ({trust_score}/100)")

    if len(reasons) < 3 and cat_risk_level in ("yuksek", "orta"):
        reasons.append(f"Kategori risk seviyesi: {cat_risk_level}")

    if len(reasons) < 3:
        neutral_badges = [b.label for b in risk_badges if b.tone == "neutral"]
        for nb in neutral_badges:
            reasons.append(nb)
            if len(reasons) >= 3:
                break

    return level, reasons[:3]


# ── V4: Kategori Karşılaştırma ───────────────────────────────────────────────

_CATEGORY_REVIEW_BANDS: dict[str, tuple[int, int]] = {
    "parfum-kozmetik":   (50,  500),
    "takviye-gida":      (30,  300),
    "saat":              (10,  100),
    "telefon":           (30,  300),
    "telefon-aksesuar":  (100, 1000),
    "oyuncu-ekipman":    (20,  200),
    "oyuncak":           (15,  150),
    "giyim":             (20,  200),
    "ayakkabi":          (15,  150),
    "elektronik":        (50,  500),
    "spor-ekipman":      (10,  100),
    "beyaz-esya":        (5,   80),
    "kucuk-ev-aleti":   (5,   80),
    "mobilya":           (10,  100),
    "kitap":             (5,   100),
}
_DEFAULT_BAND = (30, 300)


def _category_comparison(
    category_hint: str | None,
    review_count: int | None,
) -> CategoryComparison | None:
    if not category_hint or review_count is None:
        return None

    low, high = _CATEGORY_REVIEW_BANDS.get(category_hint, _DEFAULT_BAND)
    cat_display = category_hint.replace("-", "/")

    if review_count >= high:
        band = "yüksek"
        text = (
            f"Bu ürün {cat_display} kategorisinde yüksek yorum hacmine sahip "
            f"({review_count} yorum, kategori üst eşiği ~{high})."
        )
    elif review_count >= low:
        band = "normal"
        text = (
            f"Bu ürün {cat_display} kategorisinde normal yorum hacminde "
            f"({review_count} yorum, kategori aralığı {low}–{high})."
        )
    else:
        band = "düşük"
        text = (
            f"Bu ürün {cat_display} kategorisi ortalamasının altında kullanıcı geri bildirimi içeriyor "
            f"({review_count} yorum, kategori alt eşiği ~{low})."
        )

    return CategoryComparison(category_review_band=band, category_position_text=text)


# ── V4: Skor Özet Cümlesi ────────────────────────────────────────────────────

def _score_summary(
    trust_score: int,
    strengths: list[str],
    weaknesses: list[str],
) -> str:
    strong_part = ""
    weak_part = ""

    if strengths:
        strong_part = f"{', '.join(strengths[:2]).lower()} avantajı mevcut"
    if weaknesses:
        weak_part = f"{', '.join(weaknesses[:2]).lower()} nedeniyle temkinli değerlendirilmeli"

    if strong_part and weak_part:
        return f"{trust_score} puan; {strong_part} ancak {weak_part}."
    if strong_part:
        return f"{trust_score} puan; {strong_part}."
    if weak_part:
        return f"{trust_score} puan; {weak_part}."
    return f"{trust_score} puan; analiz sinyalleri sınırlı."
