import traceback
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


def _require_buyer(role: str):
    if role != "user":
        api_error(
            403,
            ErrorCodes.PURCHASE_NOT_ALLOWED,
            "Solo las cuentas de tipo comprador pueden gestionar direcciones.",
        )


def _to_address_response(address: Address) -> AddressResponse:
    # No se usa AddressResponse.model_validate(address): from_attributes
    # solo lee atributos con el MISMO nombre, y el modelo es snake_case
    # (postal_code/is_default/created_at) mientras el schema es camelCase
    # (postalCode/isDefault/createdAt) - hay que mapearlos a mano, mismo
    # patron ya usado en AdminUserResponse (UserService.py).
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

        # La primera direccion que registra un usuario queda predeterminada
        # automaticamente, sin importar lo que haya enviado el formulario.
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
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


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

        if data.label is not None:
            address.label = data.label

        if data.fullName is not None:
            address.full_name = data.fullName

        if data.country is not None:
            address.country = data.country

        if data.department is not None:
            address.department = data.department

        if data.city is not None:
            address.city = data.city

        if data.address is not None:
            address.address = data.address

        if data.postalCode is not None:
            address.postal_code = data.postalCode

        if data.phone is not None:
            address.phone = data.phone

        if data.additionalInstructions is not None:
            address.additional_instructions = data.additionalInstructions

        database.commit()
        database.refresh(address)

        return _to_address_response(address)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
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

        # Si se elimino la predeterminada y quedan otras, se promueve la
        # mas reciente - un usuario con direcciones nunca debe quedarse
        # sin ninguna predeterminada (mismo criterio que la imagen
        # principal de producto/variante).
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
        traceback.print_exc()
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
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
