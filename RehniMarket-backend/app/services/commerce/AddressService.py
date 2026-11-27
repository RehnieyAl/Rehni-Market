import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelAddress import Address

from app.repository import AddressRepository as repo

from app.schemas.SchemaCommerce.SchemaAddress import (
    CreateAddressRequest,
    UpdateAddressRequest,
    AddressResponse,
)

logger = logging.getLogger(__name__)


def _require_buyer(role: str):
    if role != "user":
        api_error(
            403,
            ErrorCodes.PURCHASE_NOT_ALLOWED,
            "Solo las cuentas de tipo comprador pueden gestionar direcciones.",
        )


def _to_address_response(address: Address) -> AddressResponse:
    return AddressResponse(
        id=address.id,
        label=address.label,
        fullName=address.full_name,
        country=address.country,
        department=address.department,
        city=address.city,
        address=address.address,
        postalCode=address.postal_code,
        phone=address.phone,
        additionalInstructions=address.additional_instructions,
        isDefault=address.is_default,
        createdAt=address.created_at,
    )


def list_addresses_service(user_id: UUID, role: str, database: Session) -> list[AddressResponse]:
    _require_buyer(role)

    addresses = repo.list_addresses(database, user_id)

    return [_to_address_response(address) for address in addresses]


def create_address_service(
    user_id: UUID, role: str, data: CreateAddressRequest, database: Session
) -> AddressResponse:
    _require_buyer(role)

    try:
        existing = repo.list_addresses(database, user_id)

        is_default = data.isDefault or len(existing) == 0

        if is_default:
            repo.clear_default(database, user_id)

        address = Address(
            user_id=user_id,
            label=data.label,
            full_name=data.fullName,
            country=data.country,
            department=data.department,
            city=data.city,
            address=data.address,
            postal_code=data.postalCode,
            phone=data.phone,
            additional_instructions=data.additionalInstructions,
            is_default=is_default,
        )

        repo.create_address(database, address)

        database.commit()
        database.refresh(address)

        return _to_address_response(address)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# Campo del schema (camelCase) -> columna del modelo.
_UPDATABLE_FIELDS = {
    "label": "label",
    "fullName": "full_name",
    "country": "country",
    "department": "department",
    "city": "city",
    "address": "address",
    "postalCode": "postal_code",
    "phone": "phone",
    "additionalInstructions": "additional_instructions",
}


def update_address_service(
    user_id: UUID,
    role: str,
    address_id: UUID,
    data: UpdateAddressRequest,
    database: Session,
) -> AddressResponse:
    _require_buyer(role)

    try:
        address = repo.get_address_owned(database, user_id, address_id)

        if not address:
            api_error(404, ErrorCodes.ADDRESS_NOT_FOUND, "Dirección no encontrada.")

        for field, column in _UPDATABLE_FIELDS.items():
            value = getattr(data, field)
            if value is not None:
                setattr(address, column, value)

        database.commit()
        database.refresh(address)

        return _to_address_response(address)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def delete_address_service(
    user_id: UUID, role: str, address_id: UUID, database: Session
) -> dict:
    _require_buyer(role)

    try:
        address = repo.get_address_owned(database, user_id, address_id)

        if not address:
            api_error(404, ErrorCodes.ADDRESS_NOT_FOUND, "Dirección no encontrada.")

        was_default = address.is_default

        repo.delete_address(database, address)
        database.flush()

        if was_default:
            remaining = repo.list_addresses(database, user_id)

            if remaining:
                remaining[0].is_default = True

        database.commit()

        return {"message": "Dirección eliminada correctamente."}

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def set_default_address_service(
    user_id: UUID, role: str, address_id: UUID, database: Session
) -> AddressResponse:
    _require_buyer(role)

    try:
        address = repo.get_address_owned(database, user_id, address_id)

        if not address:
            api_error(404, ErrorCodes.ADDRESS_NOT_FOUND, "Dirección no encontrada.")

        repo.clear_default(database, user_id)
        address.is_default = True

        database.commit()
        database.refresh(address)

        return _to_address_response(address)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
