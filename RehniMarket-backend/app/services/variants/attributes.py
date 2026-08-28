"""
Consultas de atributos de catalogo (sistema generico - ver
ModelCatalogAttribute.py).

No contiene reglas de negocio de variantes: solo "que ejes / que specs
tiene esta categoria" y helpers de serializacion legible.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption


def variant_attribute_pairs(variant) -> list[dict]:
    """
    [{"name": "Color", "value": "Verde"}, {"name": "Talla", "value": "40"}]
    a partir de las VariantOption de la variante, ordenado por eje.
    Usado para mostrar la variante de forma legible (carrito) y para el
    snapshot congelado del pedido (OrderItem.attributes_snapshot).
    """

    links = sorted(
        variant.options,
        key=lambda link: (link.option.attribute.position, link.option.attribute.name),
    )

    return [
        {"name": link.option.attribute.name, "value": link.option.label}
        for link in links
    ]


def get_catalog_attributes(
    database: Session, catalog_id, role: str | None = None
) -> list[CatalogAttribute]:
    query = database.query(CatalogAttribute).filter(
        CatalogAttribute.catalog_id == catalog_id
    )

    if role is not None:
        query = query.filter(CatalogAttribute.role == role)

    return query.order_by(CatalogAttribute.position.asc(), CatalogAttribute.name.asc()).all()


def get_variant_axes(database: Session, catalog_id) -> list[CatalogAttribute]:
    """Ejes de variante (role='variant') de una categoria, ordenados."""

    return get_catalog_attributes(database, catalog_id, role="variant")


def get_attribute_option(database: Session, option_id) -> CatalogAttributeOption | None:
    return (
        database.query(CatalogAttributeOption)
        .filter(CatalogAttributeOption.id == option_id)
        .first()
    )


def get_attribute(database: Session, attribute_id) -> CatalogAttribute | None:
    return (
        database.query(CatalogAttribute)
        .filter(CatalogAttribute.id == attribute_id)
        .first()
    )


def validate_spec_values(database: Session, catalog_id, items) -> list[tuple]:
    """
    Valida una lista de {attributeId, value} contra los atributos
    role="spec" del catalogo. Devuelve [(CatalogAttribute, value), ...].

    Reglas (equivalen a las viejas de _validate_specifications_belong_to_
    catalog): cada atributo existe, es role="spec", pertenece al catalogo,
    tiene valor, y no se repite.
    """

    seen: set = set()
    resolved: list[tuple] = []

    for item in items:
        attribute_id = item.get("attributeId")
        value = item.get("value")

        if not attribute_id or not value:
            api_error(
                400,
                ErrorCodes.VALIDATION_ERROR,
                "Cada especificación requiere un atributo y un valor.",
            )

        if attribute_id in seen:
            api_error(
                409,
                ErrorCodes.VALIDATION_ERROR,
                "No se puede asignar dos valores a la misma especificación.",
            )
        seen.add(attribute_id)

        attribute = get_attribute(database, attribute_id)

        if not attribute:
            api_error(
                404,
                ErrorCodes.CATALOG_ATTRIBUTE_NOT_FOUND,
                "Especificación no encontrada",
            )

        if attribute.role != "spec" or str(attribute.catalog_id) != str(catalog_id):
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_MISMATCH,
                "La especificación seleccionada no pertenece al catálogo del producto.",
            )

        resolved.append((attribute, value))

    return resolved
