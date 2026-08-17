from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RechargeWalletRequest(BaseModel):
    # Se recarga la billetera de OTRO usuario (rol USER) - solo
    # ADMIN/OWNER pueden llamar este endpoint (ver ALCANCE > Fase 8).
    userId: UUID
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)


class RechargeWalletByEmailRequest(BaseModel):
    """
    Body de POST /admin/wallet/recharge - identifica al usuario por email
    (en vez de userId, ver RechargeWalletRequest) porque asi es como un
    admin/owner conoce a un usuario desde la vista "RehniCoin" (ver
    ALCANCE > IDENTIFICACION DEL USUARIO).
    """

    email: EmailStr
    amount: Decimal = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)


class WalletTransactionResponse(BaseModel):
    id: UUID
    type: str
    amount: Decimal
    description: str | None
    createdAt: datetime

    model_config = {"from_attributes": True}


class WalletResponse(BaseModel):
    balance: Decimal


class RechargeWalletByEmailResponse(BaseModel):
    """
    Respuesta de POST /admin/wallet/recharge - incluye el saldo
    actualizado (obligatorio, ver ALCANCE > ENDPOINTS > Proceso) mas los
    datos del usuario recargado, para que la vista "RehniCoin" pueda
    mostrar una confirmacion legible sin otra consulta.
    """

    balance: Decimal
    userName: str
    userEmail: str


class WalletTransactionsPaginatedResponse(BaseModel):
    items: list[WalletTransactionResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class WalletRechargeHistoryItemResponse(BaseModel):
    """
    Una fila del historial de recargas administrativas (ver ALCANCE >
    HISTORIAL: Fecha, Usuario, Correo, Monto, Administrador responsable).
    Solo incluye movimientos type=RECHARGE hechos por un admin/owner
    (created_by no nulo) - no mezcla compras/reembolsos del propio flujo
    de checkout.
    """

    id: UUID
    createdAt: datetime
    userName: str
    userEmail: str
    amount: Decimal
    description: str | None
    createdByName: str | None
    createdByEmail: str | None


class WalletRechargeHistoryPaginatedResponse(BaseModel):
    items: list[WalletRechargeHistoryItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
