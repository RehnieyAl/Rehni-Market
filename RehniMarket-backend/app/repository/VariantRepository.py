from sqlalchemy.orm import Session

from app.models.ModelUser import Users
from app.models.ModelCompany import Company
from app.models.ModelProduct import Product
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.models.ModelVariantSpecification import VariantSpecification
from app.models.ModelColor import ColorVariant
from app.models.ModelCatalog import SpecificationTemplate


def get_company_by_user_id(database: Session, user_id) -> Company | None:

    user = database.query(Users).filter(Users.id == user_id).first()

    return user.company if user else None


def get_owned_product(database: Session, company_id, product_id) -> Product | None:

    return (
        database.query(Product)
        .filter(Product.id == product_id, Product.company_id == company_id)
        .first()
    )


def get_owned_variant(database: Session, company_id, product_id, variant_id) -> ProductVariant | None:
    """Valida la cadena de ownership company -> product -> variant en un solo query."""

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


def list_variants_by_product(database: Session, product_id):

    return (
        database.query(ProductVariant)
        .filter(ProductVariant.product_id == product_id)
        .order_by(ProductVariant.id)
        .all()
    )


def get_color_by_id(database: Session, color_id) -> ColorVariant | None:

    return database.query(ColorVariant).filter(ColorVariant.id == color_id).first()


def find_variant_by_color(database: Session, product_id, color_id, exclude_variant_id=None) -> ProductVariant | None:
    """Otra variante del mismo producto con el mismo color (para impedir duplicados)."""

    query = database.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.color_id == color_id,
    )

    if exclude_variant_id is not None:
        query = query.filter(ProductVariant.id != exclude_variant_id)

    return query.first()


def get_specification_template(database: Session, template_id) -> SpecificationTemplate | None:

    return (
        database.query(SpecificationTemplate)
        .filter(SpecificationTemplate.id == template_id)
        .first()
    )


def find_variant_specification_by_template(
    database: Session, variant_id, template_id, exclude_specification_id=None
) -> VariantSpecification | None:
    """Otra especificación de la misma variante con la misma plantilla (para impedir duplicados)."""

    query = database.query(VariantSpecification).filter(
        VariantSpecification.variant_id == variant_id,
        VariantSpecification.specification_template_id == template_id,
    )

    if exclude_specification_id is not None:
        query = query.filter(VariantSpecification.id != exclude_specification_id)

    return query.first()


def get_variant_specification_owned(database: Session, variant_id, specification_id) -> VariantSpecification | None:

    return (
        database.query(VariantSpecification)
        .filter(
            VariantSpecification.id == specification_id,
            VariantSpecification.variant_id == variant_id,
        )
        .first()
    )


def get_variant_image_owned(database: Session, variant_id, image_id) -> ProductVariantImage | None:

    return (
        database.query(ProductVariantImage)
        .filter(
            ProductVariantImage.id == image_id,
            ProductVariantImage.variant_id == variant_id,
        )
        .first()
    )


def list_variant_images(database: Session, variant_id):

    return (
        database.query(ProductVariantImage)
        .filter(ProductVariantImage.variant_id == variant_id)
        .order_by(ProductVariantImage.id)
        .all()
    )


def clear_main_image(database: Session, variant_id) -> None:
    """Desmarca la imagen principal actual antes de asignar otra."""

    database.query(ProductVariantImage).filter(
        ProductVariantImage.variant_id == variant_id
    ).update({ProductVariantImage.is_main: False})
