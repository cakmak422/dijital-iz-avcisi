from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.routes.analysis import router as analysis_router

app = FastAPI(
    title="Dijital Iz Avcisi API",
    version="0.1.0",
    description="AI destekli alisveris guvenlik analizi icin MVP API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router, prefix="/api", tags=["analysis"])


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
