"""Rutas de direcciones de envío del comprador (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaAddress import (
    CreateAddressRequest,
    UpdateAddressRequest,
    AddressResponse,
)

from app.services.commerce.AddressService import (
    list_addresses_service,
    create_address_service,
    update_address_service,
    delete_address_service,
    set_default_address_service,
)

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressResponse])
def get_addresses(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    database: Session = Depends(get_db, scope="function"),
):
    return list_addresses_service(current.user_id, current.role, database)


@router.post("", response_model=AddressResponse)
def create_address(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: CreateAddressRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return create_address_service(current.user_id, current.role, data, database)


@router.patch("/{address_id}", response_model=AddressResponse)
def update_address(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    address_id: UUID,
    data: UpdateAddressRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return update_address_service(
        current.user_id, current.role, address_id, data, database
    )


@router.delete("/{address_id}")
def delete_address(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    address_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return delete_address_service(current.user_id, current.role, address_id, database)


@router.patch("/{address_id}/set-default", response_model=AddressResponse)
def set_default_address(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    address_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return set_default_address_service(
        current.user_id, current.role, address_id, database
    )
