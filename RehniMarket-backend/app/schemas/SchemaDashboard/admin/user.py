from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr
from typing import Literal


class AdminUserResponse(BaseModel):
    id: UUID
    fullName: str
    email: str
    tell: str
    profileImagen: str | None
    role: str
    isActive: bool
    created_at: datetime


class AdminUsersPaginatedResponse(BaseModel):
    items: list[AdminUserResponse]
    next_cursor: UUID | None
    previous_cursor: UUID | None
    has_next: bool
    has_previous: bool


class UpdateAdminUserRequest(BaseModel):
    email: EmailStr | None = None
    role: Literal["user", "admin"] | None = None


class AdminUserUpdateResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str