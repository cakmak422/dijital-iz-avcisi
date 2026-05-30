from fastapi import APIRouter, HTTPException

from app.models.site_safety import SiteSafetyRequest, SiteSafetyResponse
from app.services.site_safety_service import analyze_site_safety

router = APIRouter()


@router.post("/site-safety/analyze", response_model=SiteSafetyResponse)
def analyze_site(payload: SiteSafetyRequest) -> SiteSafetyResponse:
    try:
        return analyze_site_safety(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
