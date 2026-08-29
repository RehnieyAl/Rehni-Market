from sqlalchemy.orm import Session

from app.models.ModelVariantImage import ProductVariantImage


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
