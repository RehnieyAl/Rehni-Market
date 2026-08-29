from itertools import product as cartesian_product

from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelCatalogAttribute import CatalogAttribute
from app.repository import ProductArchitectureRepository as repo
from app.schemas.SchemaDashboard.SchemaVariant import (
    GeneratedCombination,
    VariantOptionPair,
)
from app.services.variants import resolver
from app.services.variants.combo_key import build_combo_key


def _resolve_owned_product(database: Session, user_id, product_id):
    company = repo.get_company_by_user_id(database, user_id)
    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = repo.get_owned_product(database, company.id, product_id)
    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    return product


def generate_combinations_service(
    database: Session, user_id, product_id, attribute_ids
):
    product = _resolve_owned_product(database, user_id, product_id)

    if attribute_ids:
        axes = []
        seen: set = set()
        for attribute_id in attribute_ids:
            if attribute_id in seen:
                api_error(
                    400,
                    ErrorCodes.VARIANT_COMBINATION_INVALID,
                    "No puedes repetir un eje.",
                )
            seen.add(attribute_id)

            attribute = database.get(CatalogAttribute, attribute_id)
            if not attribute:
                api_error(
                    404,
                    ErrorCodes.CATALOG_ATTRIBUTE_NOT_FOUND,
                    "Atributo no encontrado.",
                )
            if str(attribute.catalog_id) != str(product.catalog_id):
                api_error(
                    409,
                    ErrorCodes.CATALOG_ATTRIBUTE_CATALOG_MISMATCH,
                    f"'{attribute.name}' no pertenece al catálogo de este producto.",
                )
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
            axes.append(attribute)
    else:
        axes = database.query(CatalogAttribute).filter(
            CatalogAttribute.catalog_id == product.catalog_id,
            CatalogAttribute.role == "variant",
            CatalogAttribute.is_active.is_(True),
        ).order_by(CatalogAttribute.position.asc()).all()

    axes_options = [(axis, list(axis.options)) for axis in axes]

    if not axes_options or any(not options for _, options in axes_options):
        return []

    existing_keys = {
        variant.combo_key
        for variant in repo.list_variants_by_product(
            database, product.id, include_deleted=True
        )
        if variant.combo_key
    }

    combinations = []
    for tuple_options in cartesian_product(
        *[options for _, options in axes_options]
    ):
        combo_key = build_combo_key(option.id for option in tuple_options)
        combinations.append(
            GeneratedCombination(
                options=[
                    VariantOptionPair(
                        attribute_id=option.attribute_id,
                        attribute_name=option.attribute.name,
                        option_id=option.id,
                        value=option.value,
                        hex_color=option.hex_color,
                    )
                    for option in tuple_options
                ],
                combo_key=combo_key,
                exists=combo_key in existing_keys,
            )
        )

    return combinations
