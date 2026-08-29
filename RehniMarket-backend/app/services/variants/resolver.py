from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelCatalogAttribute import CatalogAttributeOption
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantOption import VariantOption
from app.services.variants import attributes as attrs
from app.services.variants.combo_key import build_combo_key


def resolve_option_set(
    database: Session, product: Product, option_ids
) -> list[CatalogAttributeOption]:
    """Una opción por cada eje de variante activo del catálogo; devuelve las opciones ordenadas por eje."""

    axes = attrs.get_variant_axes(database, product.catalog_id)
    axis_ids = {axis.id for axis in axes}

    normalized_ids = _dedupe_preserving(option_ids)

    if not axes:
        if normalized_ids:
            api_error(
                400,
                ErrorCodes.VARIANT_COMBINATION_INVALID,
                "La categoría de este producto no define ejes de variante.",
            )
        return []

    if not normalized_ids:
        api_error(
            400,
            ErrorCodes.VARIANT_COMBINATION_INVALID,
            "Debes elegir un valor para cada atributo de variante: "
            + ", ".join(axis.name for axis in axes)
            + ".",
        )

    options: list[CatalogAttributeOption] = []
    seen_attribute_ids: set = set()

    for option_id in normalized_ids:
        option = attrs.get_attribute_option(database, option_id)

        if option is None:
            api_error(
                404,
                ErrorCodes.CATALOG_ATTRIBUTE_OPTION_NOT_FOUND,
                "Una de las opciones seleccionadas no existe.",
            )

        attribute = option.attribute

        if attribute.role != "variant":
            api_error(
                409,
                ErrorCodes.VARIANT_AXIS_ROLE_INVALID,
                f"'{attribute.name}' no es un atributo de variante.",
            )

        if not attribute.is_active:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_INACTIVE,
                f"El atributo '{attribute.name}' está inactivo.",
            )

        if attribute.id not in axis_ids:
            api_error(
                409,
                ErrorCodes.VARIANT_OPTION_MISMATCH,
                f"'{option.value}' no pertenece a un eje de variante de esta categoría.",
            )

        if attribute.id in seen_attribute_ids:
            api_error(
                400,
                ErrorCodes.VARIANT_COMBINATION_INVALID,
                f"No puedes elegir dos valores para '{attribute.name}'.",
            )

        seen_attribute_ids.add(attribute.id)
        options.append(option)

    if seen_attribute_ids != axis_ids:
        missing = [axis.name for axis in axes if axis.id not in seen_attribute_ids]
        api_error(
            400,
            ErrorCodes.VARIANT_COMBINATION_INVALID,
            "Falta elegir un valor para: " + ", ".join(missing) + ".",
        )

    position_by_axis = {axis.id: axis.position for axis in axes}
    options.sort(key=lambda opt: position_by_axis.get(opt.attribute_id, 0))

    return options


def combo_key_for_options(options) -> str:
    return build_combo_key(opt.id for opt in options)


def find_variant_by_combo(
    database: Session,
    product_id,
    combo_key: str,
    *,
    exclude_variant_id=None,
) -> ProductVariant | None:
    query = database.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.combo_key == combo_key,
        ProductVariant.deleted_at.is_(None),
    )

    if exclude_variant_id is not None:
        query = query.filter(ProductVariant.id != exclude_variant_id)

    return query.first()


def apply_options_to_variant(
    database: Session, variant: ProductVariant, options
) -> None:
    """Reemplaza las VariantOption de la variante y recalcula combo_key. No hace commit."""

    database.query(VariantOption).filter(
        VariantOption.variant_id == variant.id
    ).delete(synchronize_session=False)

    for option in options:
        database.add(
            VariantOption(
                variant_id=variant.id,
                attribute_id=option.attribute_id,
                option_id=option.id,
            )
        )

    variant.combo_key = combo_key_for_options(options) if options else None
    database.flush()


def _dedupe_preserving(values) -> list:
    seen = set()
    result = []
    for value in values or []:
        key = str(value)
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result
