from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.repository import ProductArchitectureRepository as repo
from app.schemas.SchemaDashboard.SchemaProductArchitecture import ProductDiscountRequest


def set_product_discount_service(
    database: Session,
    user_id,
    product_id,
    data: ProductDiscountRequest,
):
    company = repo.get_company_by_user_id(database, user_id)
    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada")

    product = repo.get_owned_product(database, company.id, product_id)
    if not product:
        api_error(404, ErrorCodes.PRODUCT_NOT_FOUND, "Producto no encontrado")

    if data.discount_enable and data.discount_value <= 0:
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            "Para activar el descuento, el valor debe ser mayor a 0.",
        )

    if (
        data.discount_starts_at is not None
        and data.discount_ends_at is not None
        and data.discount_ends_at <= data.discount_starts_at
    ):
        api_error(
            400,
            ErrorCodes.VALIDATION_ERROR,
            "La fecha de fin del descuento debe ser posterior a la de inicio.",
        )

    product.discount_enable = data.discount_enable
    product.discount_value = data.discount_value
    product.discount_type = data.discount_type
    product.discount_starts_at = data.discount_starts_at
    product.discount_ends_at = data.discount_ends_at

    database.commit()
    database.refresh(product)

    return {
        "product_id": str(product.id),
        "discount_enable": product.discount_enable,
        "discount_value": product.discount_value,
        "discount_type": product.discount_type,
        "discount_starts_at": product.discount_starts_at,
        "discount_ends_at": product.discount_ends_at,
    }
