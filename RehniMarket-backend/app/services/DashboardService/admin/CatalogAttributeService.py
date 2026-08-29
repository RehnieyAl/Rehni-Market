"""CRUD de atributos de catálogo y sus opciones (Admin/Owner). Unifica
SpecificationService + colorsService bajo CatalogAttribute (role="spec"/"variant")."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import (
    ATTRIBUTE_INPUT_TYPES,
    ATTRIBUTE_ROLES,
    CatalogAttribute,
    CatalogAttributeOption,
)
from app.models.ModelVariantOption import VariantOption
from app.models.ModelVariant import ProductVariant

from app.schemas.SchemaDashboard.SchemaCatalogAttribute import (
    CreateAttributeOptionRequest,
    CreateCatalogAttributeRequest,
    UpdateAttributeOptionRequest,
    UpdateCatalogAttributeRequest,
)


def _get_catalog(database: Session, catalog_id) -> Catalog:
    catalog = database.query(Catalog).filter(Catalog.id == catalog_id).first()
    if not catalog:
        api_error(404, ErrorCodes.CATALOG_NOT_FOUND, "Catálogo no encontrado")
    return catalog


def _get_attribute(database: Session, attribute_id) -> CatalogAttribute:
    attribute = (
        database.query(CatalogAttribute)
        .filter(CatalogAttribute.id == attribute_id)
        .first()
    )
    if not attribute:
        api_error(404, ErrorCodes.CATALOG_ATTRIBUTE_NOT_FOUND, "Atributo no encontrado")
    return attribute


def _get_option(database: Session, option_id) -> CatalogAttributeOption:
    option = (
        database.query(CatalogAttributeOption)
        .filter(CatalogAttributeOption.id == option_id)
        .first()
    )
    if not option:
        api_error(
            404,
            ErrorCodes.CATALOG_ATTRIBUTE_OPTION_NOT_FOUND,
            "Opción de atributo no encontrada",
        )
    return option


def _validate_role_and_type(role: str | None, input_type: str | None) -> None:
    if role is not None and role not in ATTRIBUTE_ROLES:
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            f"role debe ser uno de: {', '.join(ATTRIBUTE_ROLES)}.",
        )
    if input_type is not None and input_type not in ATTRIBUTE_INPUT_TYPES:
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            f"input_type debe ser uno de: {', '.join(ATTRIBUTE_INPUT_TYPES)}.",
        )


def _option_in_use(database: Session, option_id) -> bool:
    """True si alguna variante VIVA usa esta opcion."""

    return (
        database.query(VariantOption)
        .join(ProductVariant, ProductVariant.id == VariantOption.variant_id)
        .filter(
            VariantOption.attribute_option_id == option_id,
            ProductVariant.deleted_at.is_(None),
        )
        .first()
        is not None
    )


def list_catalog_attributes_service(database: Session, catalog_id):
    _get_catalog(database, catalog_id)

    return (
        database.query(CatalogAttribute)
        .filter(CatalogAttribute.catalog_id == catalog_id)
        .order_by(CatalogAttribute.position.asc(), CatalogAttribute.name.asc())
        .all()
    )


def create_catalog_attribute_service(
    database: Session, catalog_id, data: CreateCatalogAttributeRequest
):
    try:
        _get_catalog(database, catalog_id)
        _validate_role_and_type(data.role, data.input_type)

        exists = (
            database.query(CatalogAttribute)
            .filter(
                CatalogAttribute.catalog_id == catalog_id,
                CatalogAttribute.name == data.name.strip(),
            )
            .first()
        )
        if exists:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_ALREADY_EXISTS,
                "Ya existe un atributo con ese nombre en esta categoría.",
            )

        attribute = CatalogAttribute(
            id=uuid.uuid4(),
            catalog_id=catalog_id,
            name=data.name.strip(),
            role=data.role,
            input_type=data.input_type,
            unit=data.unit,
            required=data.required,
            position=data.position,
            image_defining=data.image_defining,
        )
        database.add(attribute)
        database.commit()
        database.refresh(attribute)
        return attribute

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def update_catalog_attribute_service(
    database: Session, attribute_id, data: UpdateCatalogAttributeRequest
):
    try:
        attribute = _get_attribute(database, attribute_id)
        _validate_role_and_type(data.role, data.input_type)

        if data.name is not None and data.name.strip() != attribute.name:
            clash = (
                database.query(CatalogAttribute)
                .filter(
                    CatalogAttribute.catalog_id == attribute.catalog_id,
                    CatalogAttribute.name == data.name.strip(),
                    CatalogAttribute.id != attribute.id,
                )
                .first()
            )
            if clash:
                api_error(
                    409,
                    ErrorCodes.CATALOG_ATTRIBUTE_ALREADY_EXISTS,
                    "Ya existe un atributo con ese nombre en esta categoría.",
                )
            attribute.name = data.name.strip()

        for field in ("role", "input_type", "unit", "required", "position", "image_defining"):
            value = getattr(data, field)
            if value is not None:
                setattr(attribute, field, value)

        database.commit()
        database.refresh(attribute)
        return attribute

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def delete_catalog_attribute_service(database: Session, attribute_id):
    try:
        attribute = _get_attribute(database, attribute_id)

        in_use = (
            database.query(VariantOption)
            .join(CatalogAttributeOption, CatalogAttributeOption.id == VariantOption.attribute_option_id)
            .join(ProductVariant, ProductVariant.id == VariantOption.variant_id)
            .filter(
                CatalogAttributeOption.attribute_id == attribute.id,
                ProductVariant.deleted_at.is_(None),
            )
            .first()
        )
        if in_use:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_IN_USE,
                "No se puede eliminar: hay variantes activas que usan este atributo.",
            )

        database.delete(attribute)  # cascade borra sus opciones
        database.commit()
        return {"message": "Atributo eliminado correctamente", "attribute_id": str(attribute_id)}

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def add_attribute_option_service(
    database: Session, attribute_id, data: CreateAttributeOptionRequest
):
    try:
        attribute = _get_attribute(database, attribute_id)
        value = (data.value or data.label).strip()

        exists = (
            database.query(CatalogAttributeOption)
            .filter(
                CatalogAttributeOption.attribute_id == attribute.id,
                CatalogAttributeOption.value == value,
            )
            .first()
        )
        if exists:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_ALREADY_EXISTS,
                "Ya existe una opción con ese valor en este atributo.",
            )

        option = CatalogAttributeOption(
            id=uuid.uuid4(),
            attribute_id=attribute.id,
            label=data.label.strip(),
            value=value,
            hex=data.hex,
            position=data.position,
        )
        database.add(option)
        database.commit()
        database.refresh(attribute)
        return attribute

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def update_attribute_option_service(
    database: Session, option_id, data: UpdateAttributeOptionRequest
):
    try:
        option = _get_option(database, option_id)

        if data.value is not None and data.value.strip() != option.value:
            if _option_in_use(database, option.id):
                api_error(
                    409,
                    ErrorCodes.CATALOG_ATTRIBUTE_IN_USE,
                    "No se puede cambiar el valor: hay variantes activas que usan esta opción.",
                )
            option.value = data.value.strip()

        if data.label is not None:
            option.label = data.label.strip()
        if data.hex is not None:
            option.hex = data.hex
        if data.position is not None:
            option.position = data.position

        database.commit()
        database.refresh(option)
        return _get_attribute(database, option.attribute_id)

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))


def delete_attribute_option_service(database: Session, option_id):
    try:
        option = _get_option(database, option_id)
        attribute_id = option.attribute_id

        if _option_in_use(database, option.id):
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_IN_USE,
                "No se puede eliminar: hay variantes activas que usan esta opción.",
            )

        database.delete(option)
        database.commit()
        return _get_attribute(database, attribute_id)

    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, str(e))
