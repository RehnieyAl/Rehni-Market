"""Esquemas de respuesta del seguimiento de empresas: contador público y estado del comprador."""

from uuid import UUID

from pydantic import BaseModel


class CompanyFollowersResponse(BaseModel):
    company_id: UUID
    followers_count: int


class CompanyFollowStatusResponse(CompanyFollowersResponse):
    is_following: bool
