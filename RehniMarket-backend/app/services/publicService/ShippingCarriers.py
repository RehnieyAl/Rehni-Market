from sqlalchemy.orm import Session

from app.models.ModelShippingCarrier import ShippingCarrier


def get_active_shipping_carriers_service(database: Session):
    """Solo transportadoras activas. Ruta pública: la Empresa lee el catálogo global."""

    return (
        database.query(ShippingCarrier)
        .filter(ShippingCarrier.is_active.is_(True))
        .order_by(ShippingCarrier.name.asc())
        .all()
    )
