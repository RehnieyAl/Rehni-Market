"""Reglas de la combinación de una variante: el producto en una combinación concreta
de valores, uno por cada eje de variante de su categoría."""

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
    """Valida que `option_ids` sea una combinación completa y válida para `product`
    (cada opción existe, su atributo es role="variant" del catálogo, exactamente una
    por eje, cubre todos los ejes) y devuelve las opciones ordenadas por posición del eje.
    Sin ejes de variante exige `option_ids` vacío (SKU único)."""

    axes = attrs.get_variant_axes(database, product.catalog_id)
    axis_ids = {axis.id for axis in axes}

    normalized_ids = _dedupe_preserving(option_ids)

    if not axes:
        if normalized_ids:
            api_error(
                400,
                ErrorCodes.VARIANT_OPTION_SET_INVALID,
                "La categoría de este producto no define ejes de variante.",
            )
        return []

    if not normalized_ids:
        api_error(
            400,
            ErrorCodes.VARIANT_OPTION_SET_INVALID,
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

        if option.attribute.role != "variant" or option.attribute_id not in axis_ids:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_MISMATCH,
                f"La opción '{option.label}' no pertenece a un atributo de variante "
                "de la categoría de este producto.",
            )

        if option.attribute_id in seen_attribute_ids:
            api_error(
                400,
                ErrorCodes.VARIANT_OPTION_SET_INVALID,
                f"No puedes elegir dos valores para '{option.attribute.name}'.",
            )

        seen_attribute_ids.add(option.attribute_id)
        options.append(option)

    if seen_attribute_ids != axis_ids:
        missing = [axis.name for axis in axes if axis.id not in seen_attribute_ids]
        api_error(
            400,
            ErrorCodes.VARIANT_OPTION_SET_INVALID,
            "Falta elegir un valor para: " + ", ".join(missing) + ".",
        )

    position_by_axis = {axis.id: axis.position for axis in axes}
    options.sort(key=lambda opt: position_by_axis.get(opt.attribute_id, 0))

    return options


def combo_key_for_options(options) -> str:
    return build_combo_key([opt.id for opt in options])


def find_variant_by_combo(
    database: Session,
    product_id,
    combo_key: str,
    *,
    exclude_variant_id=None,
    include_deleted: bool = False,
) -> ProductVariant | None:
    query = database.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.combo_key == combo_key,
    )

    if not include_deleted:
        query = query.filter(ProductVariant.deleted_at.is_(None))

    if exclude_variant_id is not None:
        query = query.filter(ProductVariant.id != exclude_variant_id)

    return query.first()


def resolve_variant_by_option_ids(
    database: Session, product_id, option_ids, *, include_deleted: bool = False
) -> ProductVariant | None:
    """Lookup: la variante viva cuya combinación coincide exactamente con `option_ids`.
    No valida que sea completa (eso es resolve_option_set)."""

    combo = build_combo_key(option_ids)
    return find_variant_by_combo(
        database, product_id, combo, include_deleted=include_deleted
    )


def apply_options_to_variant(database: Session, variant: ProductVariant, options) -> None:
    """Reemplaza las VariantOption de la variante por `options` y recalcula combo_key. No hace commit."""

    database.query(VariantOption).filter(
        VariantOption.variant_id == variant.id
    ).delete(synchronize_session=False)

    for option in options:
        database.add(
            VariantOption(variant_id=variant.id, attribute_option_id=option.id)
        )

    variant.combo_key = combo_key_for_options(options)
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
