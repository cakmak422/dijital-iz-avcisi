import os
from functools import lru_cache


class Settings:
    openai_api_key: str | None
    openai_model: str
    database_url: str | None
    enable_playwright_fallback: bool
    app_env: str
    jwt_secret: str
    access_token_ttl_minutes: int
    auth_rate_limit_per_minute: int
    resend_api_key: str | None

    def __init__(self) -> None:
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-5.2")
        self.database_url = os.getenv("DATABASE_URL")
        self.enable_playwright_fallback = os.getenv("ENABLE_PLAYWRIGHT_FALLBACK", "true").lower() == "true"
        self.app_env = os.getenv("APP_ENV", "development")
        self.jwt_secret = os.getenv("JWT_SECRET", "change-this-before-production")
        self.access_token_ttl_minutes = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "60"))
        self.auth_rate_limit_per_minute = int(os.getenv("AUTH_RATE_LIMIT_PER_MINUTE", "30"))
        self.resend_api_key = os.getenv("RESEND_API_KEY")


@lru_cache
def get_settings() -> Settings:
    return Settings()
