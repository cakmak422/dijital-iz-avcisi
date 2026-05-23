from collections.abc import Generator

from app.core.config import get_settings


def get_engine():
    settings = get_settings()
    if not settings.database_url:
        return None

    from sqlalchemy import create_engine

    return create_engine(settings.database_url, pool_pre_ping=True)


def init_db() -> None:
    engine = get_engine()
    if engine is None:
        return

    from app.db.models import Base

    Base.metadata.create_all(bind=engine)


def get_session() -> Generator:
    engine = get_engine()
    if engine is None:
        yield None
        return

    from sqlalchemy.orm import sessionmaker

    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
