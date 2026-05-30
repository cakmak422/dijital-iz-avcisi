from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.routes.analysis import router as analysis_router
from app.routes.auth import router as auth_router
from app.routes.site_safety import router as site_safety_router
from app.services.parser_health_service import parser_health_snapshot

app = FastAPI(
    title="Dijital Iz Avcisi API",
    version="0.1.0",
    description="AI destekli alisveris guvenlik analizi icin MVP API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://dijitalizavcisi.com",
        "https://www.dijitalizavcisi.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

app.include_router(analysis_router, prefix="/api", tags=["analysis"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(site_safety_router, prefix="/api", tags=["site-safety"])


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/parser-health")
def parser_health() -> list[dict]:
    return parser_health_snapshot()
