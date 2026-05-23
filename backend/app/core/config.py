import os
from functools import lru_cache


class Settings:
    openai_api_key: str | None
    openai_model: str
    database_url: str | None
    enable_playwright_fallback: bool

    def __init__(self) -> None:
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-5.2")
        self.database_url = os.getenv("DATABASE_URL")
        self.enable_playwright_fallback = os.getenv("ENABLE_PLAYWRIGHT_FALLBACK", "true").lower() == "true"


@lru_cache
def get_settings() -> Settings:
    return Settings()
