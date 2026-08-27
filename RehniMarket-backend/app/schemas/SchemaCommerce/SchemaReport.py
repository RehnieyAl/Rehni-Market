from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Form
from pydantic import BaseModel, Field
from typing import Literal


ReportTargetTypeLiteral = Literal["product", "company"]
ReportStatusLiteral = Literal["pending", "reviewing", "resolved", "rejected"]


# ==============================
# CREAR REPORTE (público, comprador autenticado)
# ==============================
#
# multipart/form-data, no JSON: las evidencias (ver ALCANCE > Reportes -
# EVIDENCIAS/IMÁGENES) viajan como archivos en el mismo request (ver
# ReportRouter.py > evidences: list[UploadFile]), así que estos campos
# tienen que llegar como Form, no como body JSON - mismo patrón que
# CreateAdvertisementRequest.as_form (ver SchemaAdvertisement.py).

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


# ==============================
# LISTADO (Admin > Reportes)
# ==============================

class ReportListItemResponse(BaseModel):
    id: UUID
    targetType: ReportTargetTypeLiteral

    # Nombre del producto (reporte de producto) o de la empresa (reporte
    # de empresa) - lo que la tabla del admin llama "Objetivo" (ver
    # ALCANCE > sección 6).
    targetLabel: str

    # Empresa dueña: la que vende el producto reportado, o la propia
    # empresa en un reporte de empresa. None solo si el producto/empresa
    # ya no existiera (no debería pasar - ni productos ni empresas se
    # borran físicamente, ver ModelReport.py).
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
    # URL ya armada con build_media_url (mismo mecanismo público que el
    # resto de imágenes del proyecto - ver ModelReport.py > ReportEvidence).
    url: str


# ==============================
# DETALLE (Admin > Reportes > abrir uno)
# ==============================

class ReportResponse(BaseModel):
    id: UUID
    targetType: ReportTargetTypeLiteral

    # product_id/company_id (nunca una URL guardada) - el frontend arma
    # el enlace "Ver producto"/"Ver empresa" con estos IDs y sus propias
    # rutas (ver ALCANCE > Reportes, sección 11/15: "no guardar URL fija").
    productId: UUID | None
    productName: str | None

    # Empresa dueña del producto (reporte de producto) o la empresa
    # reportada directamente (reporte de empresa) - un solo campo, el
    # componente de detalle lo etiqueta distinto según targetType (ver
    # ALCANCE > sección 7).
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


# ==============================
# ACCIONES ADMIN
# ==============================

class UpdateReportStatusRequest(BaseModel):
    status: ReportStatusLiteral
    adminResponse: str | None = None
