"""Rutas de administración de reclamaciones de devolución: consulta, intervención, decisión con
reembolso en RehniCoin, contacto con la empresa por correo y registro de llamadas (admin y owner)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.AuthDependencies import AuthContext, require_role
from app.core.dbconexion import get_db
from app.schemas.SchemaCommerce.SchemaReturn import (
    AdminCallRequest,
    AdminContactRequest,
    AdminDecisionRequest,
    AdminEscalateRequest,
    AdminReturnDetailResponse,
    ReturnsPaginatedResponse,
)
from app.services.commerce.ReturnService import (
    admin_decide_return_service,
    contact_company_service,
    escalate_return_service,
    get_admin_return_detail_service,
    list_admin_returns_service,
    register_call_service,
    retry_notification_service,
)

router = APIRouter(prefix="/admin/dashboard/returns", tags=["admin", "returns"])

Admin = Annotated[AuthContext, Depends(require_role("admin", "owner"))]


@router.get("", response_model=ReturnsPaginatedResponse)
def get_returns(
    _: Admin,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: str | None = Query(None),
    search: str | None = Query(None, description="Referencia del pedido, empresa o comprador"),
    company_id: UUID | None = Query(None, alias="companyId"),
    database: Session = Depends(get_db, scope="function"),
):
    """Todas las reclamaciones de devolución, filtrables por estado, empresa y búsqueda."""

    return list_admin_returns_service(database, page, limit, status, search, company_id)


@router.get("/{return_id}", response_model=AdminReturnDetailResponse)
def get_return(_: Admin, return_id: UUID, database: Session = Depends(get_db, scope="function")):
    """Detalle con contacto de la empresa, historial completo y estado de cada correo."""

    return get_admin_return_detail_service(return_id, database)


@router.post("/{return_id}/escalate", response_model=AdminReturnDetailResponse)
def escalate_return(
    current: Admin, return_id: UUID, data: AdminEscalateRequest, database: Session = Depends(get_db, scope="function")
):
    """Toma el caso (pendiente o rechazado por la empresa) indicando la causa de la intervención."""

    return escalate_return_service(current.user_id, current.role, return_id, data, database)


@router.post("/{return_id}/decision", response_model=AdminReturnDetailResponse)
def decide_return(
    current: Admin, return_id: UUID, data: AdminDecisionRequest, database: Session = Depends(get_db, scope="function")
):
    """Resuelve un caso en revisión: aprobar reembolsa en RehniCoin el monto pagado (una sola vez);
    la decisión anterior de la empresa se conserva."""

    return admin_decide_return_service(current.user_id, current.role, return_id, data, database)


@router.post("/{return_id}/contact", response_model=AdminReturnDetailResponse)
def contact_company(
    current: Admin, return_id: UUID, data: AdminContactRequest, database: Session = Depends(get_db, scope="function")
):
    """Envía a la empresa un correo redactado por el administrador y lo registra en el historial."""

    return contact_company_service(current.user_id, current.role, return_id, data, database)


@router.post("/{return_id}/calls", response_model=AdminReturnDetailResponse)
def register_call(
    current: Admin, return_id: UUID, data: AdminCallRequest, database: Session = Depends(get_db, scope="function")
):
    """Registra una llamada telefónica a la empresa: fecha, resultado y observaciones."""

    return register_call_service(current.user_id, current.role, return_id, data, database)


@router.post("/{return_id}/notifications/{notification_id}/retry", response_model=AdminReturnDetailResponse)
def retry_notification(
    _: Admin, return_id: UUID, notification_id: UUID, database: Session = Depends(get_db, scope="function")
):
    """Vuelve a enviar un correo de la reclamación que falló."""

    return retry_notification_service(return_id, notification_id, database)
