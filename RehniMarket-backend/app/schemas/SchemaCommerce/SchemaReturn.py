"""Esquemas de reclamaciones de devolución para comprador, empresa y administración. Las reglas de
longitud son las mismas que valida la web (RETURN_TEXT_* y RETURN_SUBJECT_*)."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator

RETURN_TEXT_MIN = 5
RETURN_TEXT_MAX = 500
ADMIN_TEXT_MAX = 2000
RETURN_SUBJECT_MIN = 5
RETURN_SUBJECT_MAX = 150


def clean_text(value: str | None, label: str, maximum: int = RETURN_TEXT_MAX) -> str:
    value = (value or "").strip()
    if len(value) < RETURN_TEXT_MIN:
        raise ValueError(f"{label}: escribe al menos {RETURN_TEXT_MIN} caracteres.")
    if len(value) > maximum:
        raise ValueError(f"{label}: máximo {maximum} caracteres.")
    return value


def clean_subject(value: str | None) -> str | None:
    """Asunto de correo: una sola línea (sin CR/LF, que permitirían inyectar cabeceras)."""

    if value is None:
        return None
    if "\r" in value or "\n" in value:
        raise ValueError("El asunto debe ocupar una sola línea.")
    value = " ".join(value.split())
    if len(value) < RETURN_SUBJECT_MIN:
        raise ValueError(f"El asunto debe tener al menos {RETURN_SUBJECT_MIN} caracteres.")
    if len(value) > RETURN_SUBJECT_MAX:
        raise ValueError(f"El asunto no debe exceder los {RETURN_SUBJECT_MAX} caracteres.")
    return value


class CreateReturnRequest(BaseModel):
    """El comprador solo elige QUÉ ítem devuelve y POR QUÉ. Todo lo demás (pedido,
    empresa, monto, estado) lo resuelve el backend desde la sesión."""

    orderItemId: UUID
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return clean_text(value, "Motivo de la devolución")


class ReturnDecisionRequest(BaseModel):
    """Decisión de la empresa. `reason` es la explicación (opcional al aprobar) o el motivo del
    rechazo (obligatorio: se valida en el servicio para responder MISSING_REQUIRED_FIELD)."""

    action: Literal["approve", "reject"]
    subject: str | None = None
    reason: str | None = None

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str | None) -> str | None:
        return clean_subject(value)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return clean_text(value, "Explicación")


class ReviewRequest(BaseModel):
    """El comprador pide al equipo de Rehni Market revisar un rechazo de la empresa."""

    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return clean_text(value, "Motivo de la revisión")


class AdminEscalateRequest(BaseModel):
    """El administrador toma una reclamación (empresa sin respuesta, suspendida, etc.)."""

    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return clean_text(value, "Causa de la intervención")


class AdminDecisionRequest(BaseModel):
    action: Literal["approve", "reject"]
    subject: str
    message: str

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str) -> str:
        return clean_subject(value)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        return clean_text(value, "Explicación", ADMIN_TEXT_MAX)


class AdminContactRequest(BaseModel):
    """`channel` elige el destinatario; el correo lo resuelve el backend, nunca lo envía la web."""

    channel: Literal["company_contact", "representative_account"] = "company_contact"
    subject: str
    message: str

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str) -> str:
        return clean_subject(value)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        return clean_text(value, "Mensaje", ADMIN_TEXT_MAX)


class AdminCallRequest(BaseModel):
    calledAt: datetime
    outcome: Literal["contacted", "no_answer", "wrong_number", "callback_requested"]
    notes: str

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, value: str) -> str:
        return clean_text(value, "Observaciones", ADMIN_TEXT_MAX)


class ReturnRequestResponse(BaseModel):
    id: UUID
    reference: str
    orderId: UUID
    orderReference: str
    orderItemId: UUID
    companyId: UUID
    companyName: str
    productName: str
    variantName: str | None = None
    quantity: int
    unitPrice: Decimal
    itemSubtotal: Decimal
    reason: str
    status: str
    companySubject: str | None = None
    companyResponse: str | None = None
    reviewReason: str | None = None
    reviewRequestedAt: datetime | None = None
    escalatedAt: datetime | None = None
    adminSubject: str | None = None
    adminResponse: str | None = None
    adminResolvedAt: datetime | None = None
    decidedBy: Literal["company", "admin"] | None = None
    canRequestReview: bool = False
    refundAmount: Decimal | None = None
    # Lo que se reembolsaría al aprobar (subtotal + IVA cobrado); None si el IVA histórico no se conoce.
    refundableAmount: Decimal | None = None
    buyerName: str
    buyerEmail: str
    createdAt: datetime
    resolvedAt: datetime | None = None

    model_config = {"from_attributes": True}


class ReturnEventResponse(BaseModel):
    id: UUID
    type: str
    actorRole: str
    actorName: str | None = None
    subject: str | None = None
    message: str | None = None
    amount: Decimal | None = None
    callOutcome: str | None = None
    occurredAt: datetime | None = None
    createdAt: datetime


class ReturnNotificationResponse(BaseModel):
    id: UUID
    kind: str
    recipientRole: str
    recipientEmail: str
    subject: str
    message: str | None = None
    status: str
    attempts: int
    lastError: str | None = None
    createdAt: datetime
    sentAt: datetime | None = None


class ReturnDetailResponse(ReturnRequestResponse):
    events: list[ReturnEventResponse]


class AdminCompanyContactResponse(BaseModel):
    companyId: UUID
    companyName: str
    nit: str
    companyActive: bool
    contactEmail: str | None = None
    contactPhone: str | None = None
    representativeName: str
    representativeEmail: str
    representativePhone: str | None = None


class AdminReturnDetailResponse(ReturnDetailResponse):
    company: AdminCompanyContactResponse
    notifications: list[ReturnNotificationResponse]
    refundTransactionId: UUID | None = None
    payoutAdjustmentId: UUID | None = None


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
    adminResponse: str | None = None
    reviewRequestedAt: datetime | None = None
    canRequestReview: bool = False
    refundAmount: Decimal | None = None
    createdAt: datetime
    resolvedAt: datetime | None = None
