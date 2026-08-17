from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

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
def get_cart(request: Request, database: Session = Depends(get_db)):
    return get_cart_service(request.state.user_id, request.state.role, database)


@router.post("/add", response_model=CartResponse)
def add_to_cart(
    request: Request, data: AddCartItemRequest, database: Session = Depends(get_db)
):
    return add_to_cart_service(request.state.user_id, request.state.role, data, database)


@router.patch("/item/{item_id}", response_model=CartResponse)
def update_cart_item(
    request: Request,
    item_id: UUID,
    data: UpdateCartItemRequest,
    database: Session = Depends(get_db),
):
    return update_cart_item_service(
        request.state.user_id, request.state.role, item_id, data, database
    )


@router.delete("/item/{item_id}", response_model=CartResponse)
def delete_cart_item(request: Request, item_id: UUID, database: Session = Depends(get_db)):
    return remove_cart_item_service(request.state.user_id, request.state.role, item_id, database)


@router.delete("/clear", response_model=CartResponse)
def clear_cart(request: Request, database: Session = Depends(get_db)):
    return clear_cart_service(request.state.user_id, request.state.role, database)
