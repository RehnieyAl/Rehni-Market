from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

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
def get_addresses(request: Request, database: Session = Depends(get_db)):
    return list_addresses_service(request.state.user_id, request.state.role, database)


@router.post("", response_model=AddressResponse)
def create_address(
    request: Request, data: CreateAddressRequest, database: Session = Depends(get_db)
):
    return create_address_service(request.state.user_id, request.state.role, data, database)


@router.patch("/{address_id}", response_model=AddressResponse)
def update_address(
    request: Request,
    address_id: UUID,
    data: UpdateAddressRequest,
    database: Session = Depends(get_db),
):
    return update_address_service(
        request.state.user_id, request.state.role, address_id, data, database
    )


@router.delete("/{address_id}")
def delete_address(request: Request, address_id: UUID, database: Session = Depends(get_db)):
    return delete_address_service(request.state.user_id, request.state.role, address_id, database)


@router.patch("/{address_id}/set-default", response_model=AddressResponse)
def set_default_address(request: Request, address_id: UUID, database: Session = Depends(get_db)):
    return set_default_address_service(
        request.state.user_id, request.state.role, address_id, database
    )
