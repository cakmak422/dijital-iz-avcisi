import json

from app.db.database import get_engine
from app.models.analysis import AnalysisResponse


def save_analysis_history(url: str, result: AnalysisResponse) -> None:
    engine = get_engine()
    if engine is None:
        return

    from sqlalchemy.orm import sessionmaker

    from app.db.models import AnalysisHistory

    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        session.add(
            AnalysisHistory(
                url=url,
                marketplace=result.marketplace,
                product_name=result.product_name,
                seller_name=result.seller_name,
                rating=result.rating,
                review_count=result.review_count,
                negative_review_density=result.negative_review_density,
                trust_score=result.trust_score,
                risk_level=result.risk_level,
                ai_summary_json=result.ai_summary.model_dump_json(),
                parser_notes_json=json.dumps(result.parser_notes, ensure_ascii=False),
            )
        )
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()


def list_recent_analysis_history(limit: int = 20) -> list[dict]:
    engine = get_engine()
    if engine is None:
        return []

    from sqlalchemy import desc
    from sqlalchemy.orm import sessionmaker

    from app.db.models import AnalysisHistory

    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        rows = (
            session.query(AnalysisHistory)
            .order_by(desc(AnalysisHistory.created_at))
            .limit(max(1, min(limit, 100)))
            .all()
        )
        return [
            {
                "id": row.id,
                "url": row.url,
                "marketplace": row.marketplace,
                "product_name": row.product_name,
                "seller_name": row.seller_name,
                "trust_score": row.trust_score,
                "risk_level": row.risk_level,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    finally:
        session.close()
