"""Rutas del carrito del comprador (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaCart import (
    AddCartItemRequest,
    UpdateCartItemRequest,
    CartResponse,
)

from app.services.commerce.CartService import (
    get_cart_service,
    add_to_cart_service,
    update_cart_item_service,
    remove_cart_item_service,
    clear_cart_service,
)

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
def get_cart(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    database: Session = Depends(get_db, scope="function"),
):
    return get_cart_service(current.user_id, current.role, database)


@router.post("/add", response_model=CartResponse)
def add_to_cart(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: AddCartItemRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return add_to_cart_service(current.user_id, current.role, data, database)


@router.patch("/item/{item_id}", response_model=CartResponse)
def update_cart_item(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    item_id: UUID,
    data: UpdateCartItemRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return update_cart_item_service(
        current.user_id, current.role, item_id, data, database
    )


@router.delete("/item/{item_id}", response_model=CartResponse)
def delete_cart_item(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    item_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return remove_cart_item_service(current.user_id, current.role, item_id, database)


@router.delete("/clear", response_model=CartResponse)
def clear_cart(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    database: Session = Depends(get_db, scope="function"),
):
    return clear_cart_service(current.user_id, current.role, database)
