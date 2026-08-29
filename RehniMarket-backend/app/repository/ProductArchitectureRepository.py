from uuid import UUID

from sqlalchemy.orm import Session

from app.models.ModelAttributeValue import ProductAttributeValue, VariantAttributeValue
from app.models.ModelCompany import Company
from app.models.ModelProduct import Product
from app.models.ModelUser import Users
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantOption import VariantOption


def get_company_by_user_id(database: Session, user_id) -> Company | None:
    user = database.query(Users).filter(Users.id == user_id).first()
    return user.company if user else None


def get_owned_product(database: Session, company_id, product_id) -> Product | None:
    return (
        database.query(Product)
        .filter(Product.id == product_id, Product.company_id == company_id)
        .first()
    )


def get_owned_variant(
    database: Session, company_id, product_id, variant_id
) -> ProductVariant | None:
    return (
        database.query(ProductVariant)
        .join(Product, ProductVariant.product_id == Product.id)
        .filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
            Product.company_id == company_id,
        )
        .first()
    )


def list_variants_by_product(
    database: Session, product_id, include_deleted: bool = False
) -> list[ProductVariant]:
    query = database.query(ProductVariant).filter(
        ProductVariant.product_id == product_id
    )

    if not include_deleted:
        query = query.filter(ProductVariant.deleted_at.is_(None))

    return query.order_by(ProductVariant.name.asc()).all()


def attribute_is_in_use(database: Session, attribute_id: UUID) -> bool:
    used_by_product = (
        database.query(ProductAttributeValue.id)
        .filter(ProductAttributeValue.attribute_id == attribute_id)
        .first()
    )
    if used_by_product:
        return True

    used_by_variant_value = (
        database.query(VariantAttributeValue.id)
        .filter(VariantAttributeValue.attribute_id == attribute_id)
        .first()
    )
    if used_by_variant_value:
        return True

    used_as_axis = (
        database.query(VariantOption.id)
        .filter(VariantOption.attribute_id == attribute_id)
        .first()
    )
    return used_as_axis is not None
