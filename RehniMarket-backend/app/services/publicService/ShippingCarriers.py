from sqlalchemy.orm import Session

from app.models.ModelShippingCarrier import ShippingCarrier


def get_active_shipping_carriers_service(database: Session):
    """
    Transportadoras ACTIVAS únicamente (ver ALCANCE > Transportadoras -
    "Solo transportadoras activas deben aparecer para la Empresa"). Ruta
    pública (ver publicRouters.py > GET /public/shipping-carriers), mismo
    patrón que get_colors_service/get_catalogs_service en
    publicService/Products.py: la Empresa lee su catálogo global
    administrado por Admin/Owner sin necesitar un endpoint autenticado
    propio.
    """

    return (
        database.query(ShippingCarrier)
        .filter(ShippingCarrier.is_active.is_(True))
        .order_by(ShippingCarrier.name.asc())
        .all()
    )
