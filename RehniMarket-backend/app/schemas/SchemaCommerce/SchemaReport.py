from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field
from typing import Literal


ReportTargetTypeLiteral = Literal["product", "company"]
ReportStatusLiteral = Literal["pending", "reviewing", "resolved", "rejected"]


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

    targetLabel: str

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
    url: str


class ReportResponse(BaseModel):
    id: UUID
    targetType: ReportTargetTypeLiteral

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
