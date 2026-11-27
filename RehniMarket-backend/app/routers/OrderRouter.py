"""Rutas de pedidos del comprador: listado, detalle, cancelación y devoluciones (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaOrder import OrderResponse, OrdersPaginatedResponse
from app.schemas.SchemaCommerce.SchemaReturn import (
    CreateReturnRequest,
    ReturnRequestResponse,
)

from app.services.commerce.OrderService import (
    list_my_orders_service,
    get_my_order_detail_service,
    cancel_my_order_service,
)
from app.services.commerce.ReturnService import (
    request_return_service,
    list_order_returns_service,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrdersPaginatedResponse)
def get_my_orders(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db, scope="function"),
):
    return list_my_orders_service(
        current.user_id, current.role, database, page=page, limit=limit
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_my_order_detail(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    order_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return get_my_order_detail_service(
        current.user_id, current.role, order_id, database
    )


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
def cancel_my_order(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    order_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return cancel_my_order_service(current.user_id, current.role, order_id, database)


@router.get("/{order_id}/returns", response_model=list[ReturnRequestResponse])
def get_order_returns(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    order_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    """Solicitudes de devolución del comprador para uno de sus pedidos."""

    return list_order_returns_service(current.user_id, order_id, database)


@router.post("/{order_id}/returns", response_model=ReturnRequestResponse)
def create_order_return(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    order_id: UUID,
    data: CreateReturnRequest,
    database: Session = Depends(get_db, scope="function"),
):
    """El comprador solicita la devolución de un ítem de un pedido ENTREGADO. El estado
    inicial es PENDING; la empresa dueña del pedido la evalúa después."""

    return request_return_service(current.user_id, order_id, data, database)
