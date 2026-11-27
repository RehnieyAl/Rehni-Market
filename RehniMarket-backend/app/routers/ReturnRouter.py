"""Rutas del comprador para seguir sus reclamaciones de devolución y pedir revisión (solo rol user)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.AuthDependencies import AuthContext, require_role
from app.core.dbconexion import get_db
from app.schemas.SchemaCommerce.SchemaReturn import ReturnDetailResponse, ReturnsPaginatedResponse, ReviewRequest
from app.services.commerce.ReturnService import (
    get_my_return_detail_service,
    list_my_returns_service,
    request_review_service,
)

router = APIRouter(prefix="/returns", tags=["returns"])

Buyer = Annotated[AuthContext, Depends(require_role("user"))]


@router.get("", response_model=ReturnsPaginatedResponse)
def get_my_returns(
    current: Buyer,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db, scope="function"),
):
    """Reclamaciones de devolución del comprador autenticado, de la más reciente a la más antigua."""

    return list_my_returns_service(current.user_id, database, page, limit)


@router.get("/{return_id}", response_model=ReturnDetailResponse)
def get_my_return(current: Buyer, return_id: UUID, database: Session = Depends(get_db, scope="function")):
    """Detalle e historial de una reclamación propia (sin las gestiones internas del administrador)."""

    return get_my_return_detail_service(current.user_id, return_id, database)


@router.post("/{return_id}/review", response_model=ReturnDetailResponse)
def request_return_review(
    current: Buyer,
    return_id: UUID,
    data: ReviewRequest,
    database: Session = Depends(get_db, scope="function"),
):
    """Pide al equipo de Rehni Market revisar un rechazo de la empresa (una sola vez por reclamación)."""

    return request_review_service(current.user_id, return_id, data, database)
