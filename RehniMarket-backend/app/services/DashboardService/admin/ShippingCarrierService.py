from uuid import UUID
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelShippingCarrier import ShippingCarrier
from app.schemas.SchemaDashboard.SchemaShippingCarrier import (
    CreateShippingCarrierRequest,
    UpdateShippingCarrierRequest,
)


def get_shipping_carriers_service(database: Session):
    """
    Listado COMPLETO (activas e inactivas) para el panel Admin/Owner - la
    versión filtrada por is_active=True para la Empresa vive en
    publicService/ShippingCarriers.py (GET /public/shipping-carriers).
    """

    return (
        database.query(ShippingCarrier)
        .order_by(ShippingCarrier.name.asc())
        .all()
    )


def create_shipping_carrier_service(
    database: Session,
    data: CreateShippingCarrierRequest,
) -> ShippingCarrier:
    exists = (
        database.query(ShippingCarrier)
        .filter(ShippingCarrier.name.ilike(data.name.strip()))
        .first()
    )

    if exists:
        api_error(
            409,
            ErrorCodes.SHIPPING_CARRIER_ALREADY_EXISTS,
            "Ya existe una transportadora con ese nombre.",
        )

    carrier = ShippingCarrier(
        name=data.name.strip(),
        tracking_url=data.tracking_url.strip(),
        is_active=data.is_active,
    )

    database.add(carrier)
    database.commit()
    database.refresh(carrier)

    return carrier


def update_shipping_carrier_service(
    database: Session,
    carrier_id: UUID,
    data: UpdateShippingCarrierRequest,
) -> ShippingCarrier:
    carrier = database.get(ShippingCarrier, carrier_id)

    if not carrier:
        api_error(404, ErrorCodes.SHIPPING_CARRIER_NOT_FOUND, "Transportadora no encontrada.")

    exists = (
        database.query(ShippingCarrier)
        .filter(
            ShippingCarrier.name.ilike(data.name.strip()),
            ShippingCarrier.id != carrier_id,
        )
        .first()
    )

    if exists:
        api_error(
            409,
            ErrorCodes.SHIPPING_CARRIER_ALREADY_EXISTS,
            "Ya existe otra transportadora con ese nombre.",
        )

    carrier.name = data.name.strip()
    carrier.tracking_url = data.tracking_url.strip()
    carrier.is_active = data.is_active

    database.commit()
    database.refresh(carrier)

    return carrier


def change_shipping_carrier_status_service(
    database: Session,
    carrier_id: UUID,
    is_active: bool,
) -> ShippingCarrier:
    """
    Activar/desactivar (ver ALCANCE > Transportadoras) - distinto de
    eliminar: una transportadora inactiva sigue existiendo (los pedidos
    que ya la usaron conservan la referencia intacta), solo deja de
    ofrecerse para NUEVAS asignaciones (ver publicService/
    ShippingCarriers.py, filtra is_active=True). No existe endpoint de
    borrado físico a propósito - ver ModelShippingCarrier.py.
    """

    carrier = database.get(ShippingCarrier, carrier_id)

    if not carrier:
        api_error(404, ErrorCodes.SHIPPING_CARRIER_NOT_FOUND, "Transportadora no encontrada.")

    carrier.is_active = is_active

    database.commit()
    database.refresh(carrier)

    return carrier
