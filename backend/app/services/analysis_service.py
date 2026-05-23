from urllib.parse import urlparse

from app.analyzers.base import ProductSnapshot
from app.analyzers.html_utils import negative_density
from app.analyzers.registry import analyze_with_marketplace_parser
from app.models.analysis import AiSummary, AnalysisResponse
from app.services.openai_summary_service import generate_ai_summary
from app.services.parsers.trendyol_parser import TrendyolParser


def analyze_product_url(url: str) -> AnalysisResponse:
    snapshot = _safe_parse_product(url)
    risk_seed = _risk_seed(url, snapshot)
    trust_score = _risk_score(snapshot, risk_seed)
    negative_review_density = _negative_review_density(snapshot, risk_seed)

    if trust_score >= 78:
        risk_level = "safe"
    elif trust_score >= 58:
        risk_level = "caution"
    else:
        risk_level = "risk"

    fallback_summary = AiSummary(
        positive=_positive_summary(snapshot),
        negative=_negative_summary(risk_level),
        fake_review_pattern=_fake_review_summary(risk_level),
        delivery_complaints=_delivery_summary(negative_review_density),
        return_issues=_return_summary(risk_level),
        recommendation=_recommendation(risk_level),
    )
    ai_summary = generate_ai_summary(
        snapshot=snapshot,
        risk_level=risk_level,
        trust_score=trust_score,
        negative_review_density=negative_review_density,
        fallback_summary=fallback_summary,
    )

    return AnalysisResponse(
        product_name=snapshot.product_name or _make_product_name(url, snapshot.marketplace),
        seller_name=snapshot.seller_name or _make_seller_name(snapshot.marketplace),
        marketplace=snapshot.marketplace,
        rating=snapshot.rating or round(max(2.7, min(4.8, 4.7 - (risk_seed / 30))), 1),
        review_count=snapshot.review_count or 96 + (len(url) % 420),
        negative_review_density=negative_review_density,
        trust_score=trust_score,
        price=snapshot.price,
        product_link=url,
        platform=snapshot.marketplace,
        productName=snapshot.product_name or _make_product_name(url, snapshot.marketplace),
        seller=snapshot.seller_name or _make_seller_name(snapshot.marketplace),
        reviewCount=snapshot.review_count or 96 + (len(url) % 420),
        riskScore=trust_score,
        risk_level=risk_level,
        ai_summary=ai_summary,
        review_snippet_count=len(snapshot.review_snippets),
        parser_notes=snapshot.parser_notes,
    )


def _safe_parse_product(url: str) -> ProductSnapshot:
    if _detect_marketplace(url) == "Trendyol":
        product = TrendyolParser().parse(url)
        return ProductSnapshot(
            url=product.product_link,
            marketplace=product.platform,
            product_name=product.product_name,
            seller_name=product.seller,
            rating=product.rating,
            review_count=product.review_count,
            price=product.price,
            parser_notes=product.parser_notes,
        )

    try:
        return analyze_with_marketplace_parser(url)
    except Exception as exc:
        return ProductSnapshot(
            url=url,
            marketplace=_detect_marketplace(url),
            parser_notes=[f"Parser calismadi, demo sinyallere dusuldu: {type(exc).__name__}"],
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


def _risk_score(snapshot: ProductSnapshot, risk_seed: int) -> int:
    score = 88 - risk_seed

    if snapshot.rating is not None:
        if snapshot.rating < 3.5:
            score -= 18
        elif snapshot.rating < 4.0:
            score -= 10
        elif snapshot.rating >= 4.5:
            score += 4

    if snapshot.review_count is not None:
        if snapshot.review_count < 10:
            score -= 16
        elif snapshot.review_count < 50:
            score -= 8
        elif snapshot.review_count > 500:
            score += 4

    if _looks_too_cheap(snapshot.price):
        score -= 10

    return max(20, min(95, score))


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

    return f"{marketplace} demo urunu"


def _make_seller_name(marketplace: str) -> str:
    if marketplace == "Bilinmeyen pazar yeri":
        return "Dogrulanmamis satici"

    return f"{marketplace} saticisi"


def _positive_summary(snapshot: ProductSnapshot) -> str:
    if snapshot.review_snippets:
        return "Sayfadan yorum metinleri alindi; olumlu/olumsuz sinyaller ilk yorum orneklerine gore degerlendirildi."

    if snapshot.product_name or snapshot.seller_name:
        return "Urun sayfasindan temel bilgiler alindi; yorumlar sayfada gorunmedigi icin ozet sinirli sinyallerle olusturuldu."

    return "Sayfa verisi sinirli alindi; analiz demo sinyaller ve URL paternleriyle tamamlandi."


def _negative_summary(risk_level: str) -> str:
    if risk_level == "safe":
        return "Olumsuz yorumlar daginik ve dusuk yogunlukta; belirgin bir tekrar eden sikayet hatti gorunmuyor."
    if risk_level == "caution":
        return "Paketleme, teslimat hizi ve urun beklentisi konularinda tekrar eden orta seviyeli sikayetler var."
    return "Negatif sinyaller urun kalitesi, teslimat ve iade deneyimi etrafinda yogunlasiyor."


def _fake_review_summary(risk_level: str) -> str:
    if risk_level == "safe":
        return "Yorum cesitliligi makul; sahte yorum paterni ihtimali dusuk gorunuyor."
    if risk_level == "caution":
        return "Benzer kelimelerle yazilmis kisa yorumlar nedeniyle dusuk-orta seviyede patern ihtimali var."
    return "Kisa, tekrarlayan ve ayrinti icermeyen yorumlar nedeniyle patern ihtimali dikkat gerektiriyor."


def _delivery_summary(negative_density: int) -> str:
    if negative_density < 15:
        return "Teslimat sikayetleri sinirli ve genel memnuniyeti baskilamiyor."
    if negative_density < 30:
        return "Teslimat sikayetleri ara ara tekrar ediyor; satin almadan once en yeni yorumlara bakilmali."
    return "Teslimat sikayetleri belirgin; gecikme ve paketleme sinyalleri dikkatle incelenmeli."


def _return_summary(risk_level: str) -> str:
    if risk_level == "risk":
        return "Iade deneyimiyle ilgili olumsuz sinyaller belirgin; satici kosullari kontrol edilmeli."

    return "Iade problemleri kritik yogunlukta degil, ancak kosullar satin alma oncesi okunmali."


def _recommendation(risk_level: str) -> str:
    if risk_level == "safe":
        return "Risk sinyalleri dusuk. Yine de en yeni yorumlari ve satici puanini kontrol ederek ilerleyin."
    if risk_level == "caution":
        return "Satin alma oncesi alternatif saticilari, son yorumlari ve iade kosullarini karsilastirin."
    return "Risk sinyalleri yogun. Alternatif satici ve urunleri incelemek daha guvenli olabilir."
