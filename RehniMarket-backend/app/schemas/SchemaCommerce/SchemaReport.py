from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field
from typing import Literal


ReportTargetTypeLiteral = Literal["product", "company"]
ReportStatusLiteral = Literal["pending", "reviewing", "resolved", "rejected"]


# multipart/form-data: las evidencias viajan como archivos en el mismo request.
class CreateReportRequest(BaseModel):
    targetType: ReportTargetTypeLiteral
    targetId: UUID
    reason: str = Field(min_length=1, max_length=150)
    description: str | None = None

    @classmethod
    def as_form(
        cls,
        targetType: Annotated[ReportTargetTypeLiteral, Form()],
        targetId: Annotated[UUID, Form()],
        reason: Annotated[str, Form()],
        description: Annotated[str | None, Form()] = None,
    ):
        return cls(
            targetType=targetType,
            targetId=targetId,
            reason=reason,
            description=description,
        )


class ReportListItemResponse(BaseModel):
    id: UUID
    targetType: ReportTargetTypeLiteral

    # Nombre del producto o de la empresa reportada.
    targetLabel: str

    # Empresa dueña. None solo si el producto/empresa ya no existiera.
    companyName: str | None

    reporterName: str
    reason: str
    status: ReportStatusLiteral
    createdAt: datetime


class ReportsPaginatedResponse(BaseModel):
    items: list[ReportListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ReportEvidenceResponse(BaseModel):
    id: UUID
    # Ya armada con build_media_url.
    url: str


class ReportResponse(BaseModel):
    id: UUID
    targetType: ReportTargetTypeLiteral

    # IDs, nunca URLs: el frontend arma el enlace con sus propias rutas.
    productId: UUID | None
    productName: str | None

    companyId: UUID | None
    companyName: str | None

    reporterId: UUID
    reporterName: str
    reporterEmail: str

    reason: str
    description: str | None

    status: ReportStatusLiteral
    adminResponse: str | None

    resolvedByName: str | None

    evidences: list[ReportEvidenceResponse]

    createdAt: datetime
    updatedAt: datetime | None
    resolvedAt: datetime | None


class UpdateReportStatusRequest(BaseModel):
    status: ReportStatusLiteral
    adminResponse: str | None = None
