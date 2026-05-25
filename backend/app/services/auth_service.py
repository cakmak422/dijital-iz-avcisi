from __future__ import annotations

from datetime import datetime
from random import SystemRandom

from sqlalchemy.orm import Session

from app.db.models import EmailOtp, User
from app.models.auth import RegisterRequest, UserPublic
from app.services.email_service import send_otp_email
from app.services.security_service import create_access_token, hash_otp, hash_password, otp_expires_at, verify_otp, verify_password

_rng = SystemRandom()
_memory_users: dict[str, dict] = {}
_memory_otps: dict[str, dict] = {}


def register_user(payload: RegisterRequest, session: Session | None) -> dict:
    code = f"{_rng.randint(100000, 999999)}"
    password_hash = hash_password(payload.password)

    if session is None:
        user_id = f"usr-{len(_memory_users) + 1}"
        _memory_users[payload.email.lower()] = {
            "id": user_id,
            "username": payload.username,
            "email": payload.email,
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "birthDate": payload.birthDate,
            "phone": payload.phone,
            "passwordHash": password_hash,
            "role": "user",
            "isEmailVerified": False,
            "createdAt": datetime.utcnow().isoformat(),
            "status": "pending",
        }
        _memory_otps[payload.email.lower()] = {
            "codeHash": hash_otp(code),
            "attempts": 0,
            "expiresAt": otp_expires_at(),
        }
        email_result = send_otp_email(payload.email, code)
        return {"user_id": user_id, "demo_code": email_result.get("demo_code")}

    existing = session.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first()
    if existing:
        raise ValueError("Bu e-posta veya kullanıcı adı zaten kullanılıyor.")

    user = User(
        username=payload.username,
        email=payload.email,
        first_name=payload.firstName,
        last_name=payload.lastName,
        birth_date=payload.birthDate,
        phone=payload.phone,
        password_hash=password_hash,
        role="user",
        is_email_verified=0,
        status="pending",
    )
    session.add(user)
    session.flush()
    session.add(
        EmailOtp(
            email=payload.email,
            code_hash=hash_otp(code),
            attempts=0,
            expires_at=otp_expires_at(),
        )
    )
    session.commit()
    email_result = send_otp_email(payload.email, code)
    return {"user_id": str(user.id), "demo_code": email_result.get("demo_code")}


def verify_email(email: str, code: str, session: Session | None) -> UserPublic:
    normalized = email.lower()

    if session is None:
        otp = _memory_otps.get(normalized)
        user = _memory_users.get(normalized)
        if not otp or not user:
            raise ValueError("Doğrulama kaydı bulunamadı.")
        if datetime.utcnow() > otp["expiresAt"]:
            raise ValueError("Kod süresi doldu. Lütfen yeni kod isteyin.")
        if otp["attempts"] >= 5:
            raise ValueError("En fazla 5 yanlış deneme hakkı kullanıldı.")
        if not verify_otp(code, otp["codeHash"]):
            otp["attempts"] += 1
            raise ValueError("Doğrulama kodu hatalı.")
        user["isEmailVerified"] = True
        user["status"] = "active"
        return _public_from_memory(user)

    otp_row = (
        session.query(EmailOtp)
        .filter(EmailOtp.email == email, EmailOtp.consumed_at.is_(None))
        .order_by(EmailOtp.created_at.desc())
        .first()
    )
    user_row = session.query(User).filter(User.email == email).first()
    if not otp_row or not user_row:
        raise ValueError("Doğrulama kaydı bulunamadı.")
    if datetime.utcnow() > otp_row.expires_at:
        raise ValueError("Kod süresi doldu. Lütfen yeni kod isteyin.")
    if otp_row.attempts >= 5:
        raise ValueError("En fazla 5 yanlış deneme hakkı kullanıldı.")
    if not verify_otp(code, otp_row.code_hash):
        otp_row.attempts += 1
        session.commit()
        raise ValueError("Doğrulama kodu hatalı.")

    otp_row.consumed_at = datetime.utcnow()
    user_row.is_email_verified = 1
    user_row.status = "active"
    session.commit()
    return public_user(user_row)


def login_user(identifier: str, password: str, session: Session | None) -> tuple[str, UserPublic]:
    normalized = identifier.lower()

    if session is None:
        user = next(
            (
                item
                for item in _memory_users.values()
                if item["email"].lower() == normalized or item["username"].lower() == normalized
            ),
            None,
        )
        if not user or not verify_password(password, user["passwordHash"]) or user["status"] != "active" or not user["isEmailVerified"]:
            raise ValueError("Giriş bilgileri eşleşmedi veya e-posta doğrulanmadı.")
        public = _public_from_memory(user)
        return create_access_token(public.id, public.role), public

    user_row = session.query(User).filter((User.email == identifier) | (User.username == identifier)).first()
    if not user_row or not verify_password(password, user_row.password_hash) or user_row.status != "active" or not user_row.is_email_verified:
        raise ValueError("Giriş bilgileri eşleşmedi veya e-posta doğrulanmadı.")
    public = public_user(user_row)
    return create_access_token(public.id, public.role), public


def public_user(user: User) -> UserPublic:
    return UserPublic(
        id=str(user.id),
        username=user.username,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        birthDate=user.birth_date,
        phone=user.phone,
        role=user.role,
        isEmailVerified=bool(user.is_email_verified),
        createdAt=user.created_at.isoformat(),
        status=user.status,
    )


def _public_from_memory(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        firstName=user["firstName"],
        lastName=user["lastName"],
        birthDate=user["birthDate"],
        phone=user["phone"],
        role=user["role"],
        isEmailVerified=user["isEmailVerified"],
        createdAt=user["createdAt"],
        status=user["status"],
    )
