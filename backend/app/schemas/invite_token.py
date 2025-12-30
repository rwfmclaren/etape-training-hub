from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class InviteTokenCreate(BaseModel):
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.ATHLETE
    expires_in_days: int = 7


class InviteTokenResponse(BaseModel):
    id: int
    token: str
    email: Optional[str] = None
    role: UserRole
    created_by_id: int
    created_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
    used_by_id: Optional[int] = None
    is_active: bool
    is_valid: bool

    class Config:
        from_attributes = True


class InviteTokenPublic(BaseModel):
    token: str
    role: UserRole
    email: Optional[str] = None
    expires_at: datetime
    is_valid: bool

    class Config:
        from_attributes = True


class UserCreateWithInvite(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    invite_token: Optional[str] = None
