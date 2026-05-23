import json
import time

from app.analyzers.base import ProductSnapshot
from app.core.config import get_settings
from app.models.analysis import AiSummary
from app.services.ai_usage_service import AiUsageEvent, log_ai_usage


SYSTEM_PROMPT = """
Sen Turkiye odakli bir alisveris guvenligi analiz asistani olarak calisiyorsun.
Kesin hukum verme, "dolandirici" gibi hukuki riskli ifadeler kullanma.
Yalnizca risk paterni, sikayet yogunlugu, yorum sinyali ve temkinli tavsiye dili kullan.
Yaniti sadece JSON olarak ver.
"""


def generate_ai_summary(
    snapshot: ProductSnapshot,
    risk_level: str,
    trust_score: int,
    negative_review_density: int,
    fallback_summary: AiSummary,
) -> AiSummary:
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
        return fallback_summary

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
                    "required_json_keys": [
                        "positive",
                        "negative",
                        "fake_review_pattern",
                        "delivery_complaints",
                        "return_issues",
                        "recommendation",
                    ],
                },
                ensure_ascii=False,
            ),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "shopping_risk_summary",
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "positive": {"type": "string"},
                            "negative": {"type": "string"},
                            "fake_review_pattern": {"type": "string"},
                            "delivery_complaints": {"type": "string"},
                            "return_issues": {"type": "string"},
                            "recommendation": {"type": "string"},
                        },
                        "required": [
                            "positive",
                            "negative",
                            "fake_review_pattern",
                            "delivery_complaints",
                            "return_issues",
                            "recommendation",
                        ],
                    },
                }
            },
        )
        payload = json.loads(response.output_text)
        summary = AiSummary(**payload)
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
                safety_flags=_safety_flags(summary),
            )
        )
        return summary
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
        return fallback_summary


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
