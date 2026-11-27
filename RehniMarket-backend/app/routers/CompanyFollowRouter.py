"""Rutas del comprador para seguir empresas (solo rol user); el contador público está en /public."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.AuthDependencies import AuthContext, require_role
from app.core.dbconexion import get_db
from app.schemas.SchemaCommerce.SchemaCompanyFollow import CompanyFollowStatusResponse
from app.services.commerce.CompanyFollowService import (
    follow_company_service,
    get_follow_status_service,
    unfollow_company_service,
)

router = APIRouter(prefix="/company-follows", tags=["company-follows"])

BuyerOnly = Annotated[
    AuthContext,
    Depends(require_role("user", message="Solo los compradores pueden seguir empresas.")),
]

# Los errores llegan como {"detail": {"code", "message"}}, igual que en el resto de la API.
ERRORS = {
    401: {"description": "Token ausente, inválido o expirado."},
    403: {"description": "Cuenta bloqueada (USER_BLOCKED) o rol distinto de comprador (FORBIDDEN)."},
    404: {"description": "Empresa inexistente o suspendida (COMPANY_NOT_FOUND)."},
}


@router.get("/{company_id}", response_model=CompanyFollowStatusResponse, responses=ERRORS)
def get_follow_status(
    current: BuyerOnly,
    company_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    """Indica si el comprador sigue la empresa y cuántos seguidores tiene."""
    return get_follow_status_service(database, current.user.id, company_id)


@router.post("/{company_id}", response_model=CompanyFollowStatusResponse, responses=ERRORS)
def follow_company(
    current: BuyerOnly,
    company_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    """Sigue la empresa. Idempotente: si ya la seguía, responde el mismo estado sin duplicar."""
    return follow_company_service(database, current.user.id, company_id)


@router.delete("/{company_id}", response_model=CompanyFollowStatusResponse, responses=ERRORS)
def unfollow_company(
    current: BuyerOnly,
    company_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    """Deja de seguir la empresa. Idempotente: si no la seguía, responde el estado actual."""
    return unfollow_company_service(database, current.user.id, company_id)
