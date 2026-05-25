from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger("dijital_iz_avcisi.email")


def send_otp_email(email: str, code: str) -> dict:
    settings = get_settings()

    if not settings.resend_api_key:
        logger.info("Mock OTP e-mail queued for %s", email)
        return {
            "provider": "mock",
            "delivered": True,
            "demo_code": code if settings.app_env != "production" else None,
        }

    # TODO: Implement one production provider.
    # Recommended first provider: Resend.
    # Alternatives: SendGrid, Mailgun, Amazon SES, SMTP, Gmail SMTP.
    logger.info("Production e-mail provider is configured but integration is pending.")
    return {
        "provider": "resend-pending",
        "delivered": False,
        "demo_code": None,
    }
