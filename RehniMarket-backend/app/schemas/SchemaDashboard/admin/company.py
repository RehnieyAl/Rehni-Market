from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from typing import Literal


class AdminCompanyDetailResponse(BaseModel):
    id: UUID
    nameCompany: str
    CompanyNIT: str
    CompanyNITDV: str

    CompanyLogo: str | None
    CompanyBanner: str | None
    CompanyCertificate: str | None

    CompanyCertificateStatus: str
    CompanyStatus: bool

    suspensionReason: str | None = None
    rejectionReason: str | None = None

    addressCompany: str
    user_id: UUID
    created_at: datetime

class AdminCompaniesPaginatedResponse(BaseModel):
    items: list[AdminCompanyDetailResponse]
    next_cursor: str | None
    has_next: bool

class UpdateCertificateStatusRequest(BaseModel):
    # approved      -> empresa habilitada
    # rejected      -> rechazo terminal de la empresa (requiere `reason`)
    # needs_update  -> certificado inválido: la empresa debe subir uno nuevo (requiere `reason`)
    status: Literal["approved", "rejected", "needs_update"]

    reason: str | None = None


class UpdateCompanyStatusRequest(BaseModel):
    status: bool

    reason: str | None = None


class UpdateCompanyStatusResponse(AdminCompanyDetailResponse):
    """AdminCompanyDetailResponse + resultado de la suspensión para el toast del admin.
    0/0 al desbloquear o al suspender una empresa sin pedidos PENDING/PAID/PROCESSING."""

    affectedOrdersCount: int
    totalRefunded: Decimal
