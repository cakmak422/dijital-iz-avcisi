from fastapi import APIRouter

from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.services.history_service import list_recent_analysis_history, save_analysis_history
from app.services.analysis_service import analyze_product_url

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_product(payload: AnalysisRequest) -> AnalysisResponse:
    url = str(payload.url)
    result = analyze_product_url(url)
    save_analysis_history(url, result)
    return result


@router.get("/history")
def analysis_history(limit: int = 20) -> list[dict]:
    return list_recent_analysis_history(limit)
