from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaOrder import OrderResponse, OrdersPaginatedResponse

from app.services.commerce.OrderService import (
    list_my_orders_service,
    get_my_order_detail_service,
    cancel_my_order_service,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrdersPaginatedResponse)
def get_my_orders(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    database: Session = Depends(get_db),
):
    return list_my_orders_service(
        request.state.user_id, request.state.role, database, page=page, limit=limit
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_my_order_detail(request: Request, order_id: UUID, database: Session = Depends(get_db)):
    return get_my_order_detail_service(
        request.state.user_id, request.state.role, order_id, database
    )


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
def cancel_my_order(request: Request, order_id: UUID, database: Session = Depends(get_db)):
    return cancel_my_order_service(request.state.user_id, request.state.role, order_id, database)
