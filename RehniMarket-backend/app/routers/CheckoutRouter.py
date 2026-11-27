"""Ruta de checkout: convierte el carrito del comprador en pedidos (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest, CheckoutSummaryResponse

from app.services.commerce.CheckoutService import checkout_service

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutSummaryResponse)
def checkout(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: CheckoutRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return checkout_service(current.user_id, current.role, data, database)
