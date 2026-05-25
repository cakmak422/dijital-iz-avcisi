from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        now = time.time()
        bucket = self._hits[key]

        while bucket and now - bucket[0] > 60:
            bucket.popleft()

        if len(bucket) >= settings.auth_rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin."},
            )

        bucket.append(now)
        return await call_next(request)
