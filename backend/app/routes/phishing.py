from fastapi import APIRouter, HTTPException

from app.models.phishing import PhishingRequest, PhishingResponse
from app.services.phishing_service import analyze_phishing

router = APIRouter()


@router.post("/phishing/analyze", response_model=PhishingResponse)
def analyze_phishing_url(payload: PhishingRequest) -> PhishingResponse:
    try:
        return analyze_phishing(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Phishing analizi tamamlanamadı: {str(exc)[:160]}") from exc
