from __future__ import annotations

import hashlib
import re
from typing import Any

SENSITIVE_KEY_PATTERN = re.compile(r"(password|otp|token|cookie|session|phone|email|mail|secret|code)", re.IGNORECASE)


def redact(value: Any) -> str:
    if value is None:
        return ""
    return "[redacted]"


def fingerprint(value: str) -> str:
    """Return a non-reversible short fingerprint for correlation without storing PII."""
    return hashlib.sha256(value.lower().strip().encode("utf-8")).hexdigest()[:10]


def sanitize_log_fields(fields: dict[str, Any]) -> dict[str, Any]:
    return {key: redact(value) if SENSITIVE_KEY_PATTERN.search(key) else value for key, value in fields.items()}
