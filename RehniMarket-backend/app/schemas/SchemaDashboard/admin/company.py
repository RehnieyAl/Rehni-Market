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

