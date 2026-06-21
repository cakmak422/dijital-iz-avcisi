import json
import time

from app.analyzers.base import ProductSnapshot
from app.core.config import get_settings
from app.models.analysis import AiSummary, DetailedAiSummary
from app.services.ai_usage_service import AiUsageEvent, log_ai_usage


SYSTEM_PROMPT = """
Sen Turkiye odakli bir alisveris guvenligi analiz asistani olarak calisiyorsun.
Kesin hukum verme, "dolandirici" gibi hukuki riskli ifadeler kullanma.
Yalnizca risk paterni, sikayet yogunlugu, yorum sinyali ve temkinli tavsiye dili kullan.
Eger yorum metni yoksa veya yetersizse, bunu data_quality alaninda acikca belirt.
Asla uydurma veri uretme; eksik alanlara "Yeterli veri yok" yaz.
Yaniti sadece JSON olarak ver.
"""

DETAILED_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "positive_summary": {"type": "string"},
        "negative_summary": {"type": "string"},
        "top_complaints": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 0,
            "maxItems": 5,
        },
        "delivery_issues": {"type": "string"},
        "packaging_issues": {"type": "string"},
        "seller_reliability": {"type": "string"},
        "fake_review_risk": {"type": "string", "enum": ["düşük", "orta", "yüksek"]},
        "repetitive_pattern": {"type": "string"},
        "price_performance": {"type": "string"},
        "return_problems": {"type": "string"},
        "verdict": {"type": "string", "enum": ["buy", "caution", "avoid"]},
        "verdict_label": {"type": "string"},
        "data_quality": {"type": "string"},
        # backward-compatible alanlar
        "positive": {"type": "string"},
        "negative": {"type": "string"},
        "fake_review_pattern": {"type": "string"},
        "delivery_complaints": {"type": "string"},
        "return_issues": {"type": "string"},
        "recommendation": {"type": "string"},
    },
    "required": [
        "positive_summary",
        "negative_summary",
        "top_complaints",
        "delivery_issues",
        "packaging_issues",
        "seller_reliability",
        "fake_review_risk",
        "repetitive_pattern",
        "price_performance",
        "return_problems",
        "verdict",
        "verdict_label",
        "data_quality",
        "positive",
        "negative",
        "fake_review_pattern",
        "delivery_complaints",
        "return_issues",
        "recommendation",
    ],
}


def generate_ai_summary(
    snapshot: ProductSnapshot,
    risk_level: str,
    trust_score: int,
    negative_review_density: int,
    fallback_summary: AiSummary,
) -> tuple[AiSummary, DetailedAiSummary | None]:
    settings = get_settings()
    if not settings.openai_api_key:
        log_ai_usage(
            AiUsageEvent(
                provider="openai",
                model=settings.openai_model,
                marketplace=snapshot.marketplace,
                risk_level=risk_level,
                used_fallback=True,
                safety_flags=_safety_flags(fallback_summary),
            )
        )
        return fallback_summary, None

    started_at = time.perf_counter()
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.responses.create(
            model=settings.openai_model,
            instructions=SYSTEM_PROMPT,
            input=json.dumps(
                {
                    "marketplace": snapshot.marketplace,
                    "product_name": snapshot.product_name,
                    "seller_name": snapshot.seller_name,
                    "rating": snapshot.rating,
                    "review_count": snapshot.review_count,
                    "review_snippets": snapshot.review_snippets[:20],
                    "risk_level": risk_level,
                    "trust_score": trust_score,
                    "negative_review_density": negative_review_density,
                    "instructions": (
                        "top_complaints listesine en sik gecen 3-5 sikayet basligini yaz. "
                        "verdict icin: guven skoru 75+ ise 'buy', 50-74 ise 'caution', 50 alti ise 'avoid'. "
                        "verdict_label: 'Alinabilir' / 'Dikkatli Ol' / 'Uzak Dur'. "
                        "Yorum metni yoksa veya az ise data_quality alaninda bunu belirt, alan degerlerini 'Yeterli veri yok' yap. "
                        "fake_review_risk: yorum cesitliligi az, tekrar varsa 'yüksek'; orta sinyaller 'orta'; dusuk ise 'düşük'."
                    ),
                },
                ensure_ascii=False,
            ),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "shopping_risk_summary",
                    "schema": DETAILED_JSON_SCHEMA,
                }
            },
        )
        payload = json.loads(response.output_text)
        ai_summary = AiSummary(
            positive=payload["positive"],
            negative=payload["negative"],
            fake_review_pattern=payload["fake_review_pattern"],
            delivery_complaints=payload["delivery_complaints"],
            return_issues=payload["return_issues"],
            recommendation=payload["recommendation"],
        )
        detailed = DetailedAiSummary(
            positive_summary=payload["positive_summary"],
            negative_summary=payload["negative_summary"],
            top_complaints=payload.get("top_complaints", []),
            delivery_issues=payload["delivery_issues"],
            packaging_issues=payload["packaging_issues"],
            seller_reliability=payload["seller_reliability"],
            fake_review_risk=payload["fake_review_risk"],
            repetitive_pattern=payload["repetitive_pattern"],
            price_performance=payload["price_performance"],
            return_problems=payload["return_problems"],
            verdict=payload["verdict"],
            verdict_label=payload["verdict_label"],
            data_quality=payload["data_quality"],
        )
        usage = _usage_from_response(response)
        log_ai_usage(
            AiUsageEvent(
                provider="openai",
                model=settings.openai_model,
                marketplace=snapshot.marketplace,
                risk_level=risk_level,
                prompt_tokens=usage["prompt_tokens"],
                completion_tokens=usage["completion_tokens"],
                total_tokens=usage["total_tokens"],
                duration_ms=round((time.perf_counter() - started_at) * 1000),
                used_fallback=False,
                safety_flags=_safety_flags(ai_summary),
            )
        )
        return ai_summary, detailed
    except Exception:
        log_ai_usage(
            AiUsageEvent(
                provider="openai",
                model=settings.openai_model,
                marketplace=snapshot.marketplace,
                risk_level=risk_level,
                duration_ms=round((time.perf_counter() - started_at) * 1000),
                used_fallback=True,
                safety_flags=_safety_flags(fallback_summary),
            )
        )
        return fallback_summary, None


def _usage_from_response(response) -> dict[str, int]:
    usage = getattr(response, "usage", None)
    if usage is None:
        return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    input_tokens = int(getattr(usage, "input_tokens", 0) or 0)
    output_tokens = int(getattr(usage, "output_tokens", 0) or 0)
    total_tokens = int(getattr(usage, "total_tokens", input_tokens + output_tokens) or 0)
    return {
        "prompt_tokens": input_tokens,
        "completion_tokens": output_tokens,
        "total_tokens": total_tokens,
    }


def _safety_flags(summary: AiSummary) -> list[str]:
    text = " ".join(summary.model_dump().values()).lower()
    banned_terms = ["dolandirici", "dolandırıcı", "sahtekar", "sahtekâr", "scamdir", "kesinlikle alma"]
    return [term for term in banned_terms if term in text]
