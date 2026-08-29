from uuid import UUID

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelCatalogAttribute import (
    OPTION_INPUT_TYPES,
    CatalogAttribute,
    CatalogAttributeOption,
)
from app.repository import CatalogAttributeRepository as repo
from app.repository import ProductArchitectureRepository as architecture_repo
from app.schemas.SchemaDashboard.SchemaCatalogAttribute import (
    CreateAttributeOptionRequest,
    CreateCatalogAttributeRequest,
    UpdateAttributeOptionRequest,
    UpdateCatalogAttributeRequest,
)


def _require_catalog(database: Session, catalog_id: UUID):
    catalog = repo.get_catalog(database, catalog_id)
    if not catalog:
        api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "Catálogo no encontrado.")
    return catalog


def _require_attribute(database: Session, attribute_id: UUID) -> CatalogAttribute:
    attribute = repo.get_attribute(database, attribute_id)
    if not attribute:
        api_error(
            404,
            ErrorCodes.CATALOG_ATTRIBUTE_NOT_FOUND,
            "Atributo no encontrado.",
        )
    return attribute


def _require_option(database: Session, option_id: UUID) -> CatalogAttributeOption:
    option = repo.get_option(database, option_id)
    if not option:
        api_error(
            404,
            ErrorCodes.CATALOG_ATTRIBUTE_OPTION_NOT_FOUND,
            "Valor de atributo no encontrado.",
        )
    return option


def list_catalog_attributes_service(
    database: Session,
    catalog_id: UUID,
    role: str | None = None,
):
    _require_catalog(database, catalog_id)
    return repo.list_attributes_by_catalog(database, catalog_id, role)


def get_catalog_attribute_service(database: Session, attribute_id: UUID):
    return _require_attribute(database, attribute_id)


def create_catalog_attribute_service(
    database: Session,
    catalog_id: UUID,
    data: CreateCatalogAttributeRequest,
):
    _require_catalog(database, catalog_id)

    name = data.name.strip()

    if repo.find_attribute_by_name(database, catalog_id, name):
        api_error(
            409,
            ErrorCodes.CATALOG_ATTRIBUTE_ALREADY_EXISTS,
            "Ya existe un atributo con ese nombre en este catálogo.",
        )

    attribute = CatalogAttribute(
        catalog_id=catalog_id,
        name=name,
        role=data.role,
        input_type=data.input_type,
        unit=data.unit.strip() if data.unit else None,
        position=data.position,
    )

    database.add(attribute)
    database.commit()
    database.refresh(attribute)

    return attribute


def update_catalog_attribute_service(
    database: Session,
    attribute_id: UUID,
    data: UpdateCatalogAttributeRequest,
):
    attribute = _require_attribute(database, attribute_id)

    if data.name is not None:
        name = data.name.strip()
        if repo.find_attribute_by_name(
            database, attribute.catalog_id, name, exclude_id=attribute.id
        ):
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_ALREADY_EXISTS,
                "Ya existe otro atributo con ese nombre en este catálogo.",
            )
        attribute.name = name

    if data.input_type is not None and data.input_type != attribute.input_type:
        if data.input_type not in OPTION_INPUT_TYPES and attribute.options:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_TYPE_MISMATCH,
                "No puedes cambiar a un tipo sin valores mientras el atributo tenga valores.",
            )
        attribute.input_type = data.input_type

    if data.role is not None:
        attribute.role = data.role

    if data.unit is not None:
        attribute.unit = data.unit.strip() or None

    if data.position is not None:
        attribute.position = data.position

    database.commit()
    database.refresh(attribute)

    return attribute


def set_catalog_attribute_status_service(
    database: Session,
    attribute_id: UUID,
    is_active: bool,
):
    attribute = _require_attribute(database, attribute_id)
    attribute.is_active = is_active

    database.commit()
    database.refresh(attribute)

    return attribute


def delete_catalog_attribute_service(database: Session, attribute_id: UUID):
    attribute = _require_attribute(database, attribute_id)

    if architecture_repo.attribute_is_in_use(database, attribute.id):
        api_error(
            409,
            ErrorCodes.CATALOG_ATTRIBUTE_IN_USE,
            "No puedes eliminar un atributo que está siendo utilizado por productos o variantes.",
        )

    database.delete(attribute)
    database.commit()

    return {"message": "Atributo eliminado correctamente."}


def create_attribute_option_service(
    database: Session,
    attribute_id: UUID,
    data: CreateAttributeOptionRequest,
):
    attribute = _require_attribute(database, attribute_id)

    if not attribute.is_active:
        api_error(
            409,
            ErrorCodes.CATALOG_ATTRIBUTE_INACTIVE,
            "No puedes agregar valores a un atributo inactivo.",
        )

    if attribute.input_type not in OPTION_INPUT_TYPES:
        api_error(
            400,
            ErrorCodes.CATALOG_ATTRIBUTE_TYPE_MISMATCH,
            "Este atributo no admite valores predefinidos.",
        )

    if attribute.input_type == "color" and not data.hex_color:
        api_error(
            422,
            ErrorCodes.VALIDATION_ERROR,
            "Un valor de color requiere su código hexadecimal.",
        )

    value = data.value.strip()

    if repo.find_option_by_value(database, attribute_id, value):
        api_error(
            409,
            ErrorCodes.CATALOG_ATTRIBUTE_OPTION_ALREADY_EXISTS,
            "Ya existe ese valor en el atributo.",
        )

    option = CatalogAttributeOption(
        attribute_id=attribute_id,
        value=value,
        hex_color=data.hex_color.upper() if data.hex_color else None,
        position=data.position,
    )

    database.add(option)
    database.commit()
    database.refresh(option)

    return option


def update_attribute_option_service(
    database: Session,
    option_id: UUID,
    data: UpdateAttributeOptionRequest,
):
    option = _require_option(database, option_id)

    if data.value is not None:
        value = data.value.strip()
        if repo.find_option_by_value(
            database, option.attribute_id, value, exclude_id=option.id
        ):
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_OPTION_ALREADY_EXISTS,
                "Ya existe otro valor igual en el atributo.",
            )
        option.value = value

    if data.hex_color is not None:
        option.hex_color = data.hex_color.upper()

    if data.position is not None:
        option.position = data.position

    database.commit()
    database.refresh(option)

    return option


def delete_attribute_option_service(database: Session, option_id: UUID):
    option = _require_option(database, option_id)

    database.delete(option)
    database.commit()

    return {"message": "Valor eliminado correctamente."}
