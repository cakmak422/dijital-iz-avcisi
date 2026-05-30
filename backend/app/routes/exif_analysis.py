from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.exif_analysis import ExifAnalysisResponse
from app.services.exif_analysis_service import analyze_exif_image

router = APIRouter()


@router.post("/exif/analyze", response_model=ExifAnalysisResponse)
async def analyze_exif(file: UploadFile = File(...)) -> ExifAnalysisResponse:
    try:
        print(f"exif_upload filename={file.filename or 'unknown'} content_type={file.content_type or 'unknown'}")
        content = await file.read()
        return analyze_exif_image(file.filename or "image.jpg", file.content_type, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
