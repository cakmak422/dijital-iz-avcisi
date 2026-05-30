from fastapi import APIRouter, HTTPException

from app.models.ip_intelligence import IpIntelligenceRequest, IpIntelligenceResponse
from app.services.ip_intelligence_service import analyze_ip_intelligence

router = APIRouter()


@router.post("/ip-intelligence/analyze", response_model=IpIntelligenceResponse)
def analyze_ip(payload: IpIntelligenceRequest) -> IpIntelligenceResponse:
    try:
        return analyze_ip_intelligence(payload.ip)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
