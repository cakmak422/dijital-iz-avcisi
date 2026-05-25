from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.models.auth import AuthResponse, LoginRequest, RegisterRequest, RegisterResponse, VerifyEmailRequest, UserPublic
from app.services.auth_service import login_user, register_user, verify_email

router = APIRouter()


@router.post("/auth/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, session: Session | None = Depends(get_session)) -> RegisterResponse:
    try:
        result = register_user(payload, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return RegisterResponse(
        userId=result["user_id"],
        email=payload.email,
        status="pending",
        isEmailVerified=False,
        demoOtpCode=result["demo_code"],
        message="E-posta doğrulama kodu gönderildi.",
    )


@router.post("/auth/verify-email", response_model=UserPublic)
def verify(payload: VerifyEmailRequest, session: Session | None = Depends(get_session)) -> UserPublic:
    try:
        return verify_email(payload.email, payload.code, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: Session | None = Depends(get_session)) -> AuthResponse:
    try:
        token, user = login_user(payload.identifier, payload.password, session)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return AuthResponse(accessToken=token, user=user)
