from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelAttributeValue import ProductAttributeValue
from app.models.ModelCatalogAttribute import CatalogAttribute
from app.repository import ProductArchitectureRepository as repo
from app.schemas.SchemaDashboard.SchemaProductArchitecture import (
    ProductAttributeValueResponse,
    ProductAvailableAttributesResponse,
    SetProductAttributesRequest,
)
from app.services.variants import attributes as attrs


def _resolve_owned_product(database: Session, user_id, product_id):
    company = repo.get_company_by_user_id(database, user_id)
    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = repo.get_owned_product(database, company.id, product_id)
    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    return product


def _to_value_responses(product) -> list[ProductAttributeValueResponse]:
    return [
        ProductAttributeValueResponse(
            attribute_id=value.attribute_id,
            name=value.attribute.name,
            value=value.value,
        )
        for value in sorted(
            product.attribute_values,
            key=lambda v: (v.attribute.position, v.attribute.name),
        )
    ]


def get_available_attributes_service(database: Session, user_id, product_id):
    product = _resolve_owned_product(database, user_id, product_id)

    return ProductAvailableAttributesResponse(
        product_attributes=attrs.get_catalog_attributes(
            database, product.catalog_id, role="product", active_only=True
        ),
        variant_axes=attrs.get_catalog_attributes(
            database, product.catalog_id, role="variant", active_only=True
        ),
    )


def get_product_attributes_service(database: Session, user_id, product_id):
    product = _resolve_owned_product(database, user_id, product_id)
    return _to_value_responses(product)


def set_product_attributes_service(
    database: Session,
    user_id,
    product_id,
    data: SetProductAttributesRequest,
):
    product = _resolve_owned_product(database, user_id, product_id)

    seen: set = set()
    resolved: list[tuple[CatalogAttribute, str]] = []

    for item in data.values:
        if item.attribute_id in seen:
            api_error(
                409,
                ErrorCodes.PRODUCT_ATTRIBUTE_INVALID,
                "No se puede asignar dos valores al mismo atributo.",
            )
        seen.add(item.attribute_id)

        attribute = database.get(CatalogAttribute, item.attribute_id)

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

        if attribute.role != "product":
            api_error(
                409,
                ErrorCodes.PRODUCT_ATTRIBUTE_INVALID,
                f"'{attribute.name}' no es un atributo de producto.",
            )

        if not attribute.is_active:
            api_error(
                409,
                ErrorCodes.CATALOG_ATTRIBUTE_INACTIVE,
                f"El atributo '{attribute.name}' está inactivo.",
            )

        resolved.append((attribute, item.value.strip()))

    database.query(ProductAttributeValue).filter(
        ProductAttributeValue.product_id == product.id
    ).delete(synchronize_session=False)

    for attribute, value in resolved:
        database.add(
            ProductAttributeValue(
                product_id=product.id,
                attribute_id=attribute.id,
                value=value,
            )
        )

    database.commit()
    database.refresh(product)

    return _to_value_responses(product)
