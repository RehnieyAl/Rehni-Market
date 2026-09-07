from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator


class CreateReturnRequest(BaseModel):
    """El comprador solo elige QUÉ ítem devuelve y POR QUÉ. Todo lo demás (pedido,
    empresa, monto, estado) lo resuelve el backend desde la sesión."""

    orderItemId: UUID
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        value = (value or "").strip()

        if len(value) < 5:
            raise ValueError("Cuéntanos el motivo de la devolución (mínimo 5 caracteres).")

        if len(value) > 500:
            raise ValueError("El motivo no debe exceder los 500 caracteres.")

        return value


class ReturnDecisionRequest(BaseModel):
    """La empresa aprueba o rechaza. `reason` es obligatorio solo cuando action='reject'
    (se valida en el servicio para devolver MISSING_REQUIRED_FIELD, no un 422)."""

    action: Literal["approve", "reject"]
    reason: str | None = None


class ReturnRequestResponse(BaseModel):
    id: UUID
    orderId: UUID
    orderReference: str
    orderItemId: UUID
    productName: str
    variantName: str | None = None
    quantity: int
    unitPrice: Decimal
    itemSubtotal: Decimal
    reason: str
    status: str
    companyResponse: str | None = None
    refundAmount: Decimal | None = None
    buyerName: str
    buyerEmail: str
    createdAt: datetime
    resolvedAt: datetime | None = None

    model_config = {"from_attributes": True}


class ReturnsPaginatedResponse(BaseModel):
    items: list[ReturnRequestResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class OrderItemReturnResponse(BaseModel):
    """Estado de devolución embebido en el detalle de un pedido (comprador y empresa)."""

    id: UUID
    orderItemId: UUID
    status: str
    reason: str
    companyResponse: str | None = None
    refundAmount: Decimal | None = None
    createdAt: datetime
    resolvedAt: datetime | None = None
