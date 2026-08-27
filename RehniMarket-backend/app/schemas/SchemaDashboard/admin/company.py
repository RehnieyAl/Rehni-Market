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

    # Motivo VIGENTE de suspensión (ver ModelCompany.py > Company.
    # suspension_reason) - None mientras CompanyStatus=True.
    suspensionReason: str | None = None

    addressCompany: str
    user_id: UUID
    created_at: datetime

class AdminCompaniesPaginatedResponse(BaseModel):
    items: list[AdminCompanyDetailResponse]
    next_cursor: str | None
    has_next: bool

class UpdateCertificateStatusRequest(BaseModel):
    status: Literal["approved", "rejected"]


class UpdateCompanyStatusRequest(BaseModel):
    status: bool

    # Obligatorio solo al SUSPENDER (status=False) - ver ALCANCE >
    # Suspensión de empresa, punto 13: la validación real (obligatorio,
    # no vacío) vive en CompanyService.update_company_status_service, acá
    # queda opcional para no romper el desbloqueo (status=True), que
    # nunca lo necesita.
    reason: str | None = None


class UpdateCompanyStatusResponse(AdminCompanyDetailResponse):
    """
    Mismo shape que AdminCompanyDetailResponse (la empresa ya actualizada)
    más el resultado de la suspensión, para el toast de feedback del
    admin (ver ALCANCE > FEEDBACK ADMIN - "se procesaron X pedidos y se
    reembolsaron $X"). 0/0 cuando la empresa se desbloquea, o cuando se
    suspende una empresa sin pedidos PENDING/PAID/PROCESSING.
    """

    affectedOrdersCount: int
    totalRefunded: Decimal

