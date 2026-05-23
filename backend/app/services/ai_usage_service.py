import json
import logging
from dataclasses import dataclass, field

from app.db.database import get_engine

logger = logging.getLogger("dijital_iz_avcisi.ai")


@dataclass
class AiUsageEvent:
    provider: str
    model: str
    marketplace: str
    risk_level: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    duration_ms: int = 0
    used_fallback: bool = False
    safety_flags: list[str] = field(default_factory=list)


def log_ai_usage(event: AiUsageEvent) -> None:
    logger.info(
        "ai_usage provider=%s model=%s marketplace=%s risk_level=%s total_tokens=%s duration_ms=%s fallback=%s safety_flags=%s",
        event.provider,
        event.model,
        event.marketplace,
        event.risk_level,
        event.total_tokens,
        event.duration_ms,
        event.used_fallback,
        ",".join(event.safety_flags) or "none",
    )
    _save_ai_usage(event)


def _save_ai_usage(event: AiUsageEvent) -> None:
    engine = get_engine()
    if engine is None:
        return

    from sqlalchemy.orm import sessionmaker

    from app.db.models import AiUsageLog

    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        session.add(
            AiUsageLog(
                provider=event.provider,
                model=event.model,
                marketplace=event.marketplace,
                risk_level=event.risk_level,
                prompt_tokens=event.prompt_tokens,
                completion_tokens=event.completion_tokens,
                total_tokens=event.total_tokens,
                duration_ms=event.duration_ms,
                used_fallback=1 if event.used_fallback else 0,
                safety_flags_json=json.dumps(event.safety_flags, ensure_ascii=False),
            )
        )
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()
