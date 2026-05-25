from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal["user", "admin"]
UserStatus = Literal["active", "pending", "blocked"]


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str = Field(min_length=5, max_length=255)
    firstName: str = Field(min_length=1, max_length=120)
    lastName: str = Field(min_length=1, max_length=120)
    birthDate: str = Field(min_length=4, max_length=20)
    phone: str = Field(min_length=5, max_length=40)
    password: str = Field(min_length=8)


class RegisterResponse(BaseModel):
    userId: str
    email: str
    status: UserStatus
    isEmailVerified: bool
    demoOtpCode: str | None = None
    message: str


class VerifyEmailRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)


class LoginRequest(BaseModel):
    identifier: str
    password: str


class UserPublic(BaseModel):
    id: str
    username: str
    email: str
    firstName: str
    lastName: str
    birthDate: str
    phone: str
    role: UserRole
    isEmailVerified: bool
    createdAt: str
    status: UserStatus


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserPublic
