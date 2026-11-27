"""Schemas del panel admin de usuarios: listado, edición de correo o rol y respuesta."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from typing import Literal
from app.schemas.SchemaEmail import NormalizedEmail


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
    email: NormalizedEmail | None = None
    role: Literal["user", "admin", "owner"] | None = None
