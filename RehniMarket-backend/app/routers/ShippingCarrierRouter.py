"""Rutas del panel admin para transportadoras (admin y owner)."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import require_role
from app.schemas.SchemaDashboard.SchemaShippingCarrier import (
    CreateShippingCarrierRequest,
    UpdateShippingCarrierRequest,
    ShippingCarrierStatusRequest,
    ShippingCarrierResponse,
)
from app.services.DashboardService.admin.ShippingCarrierService import (
    get_shipping_carriers_service,
    create_shipping_carrier_service,
    update_shipping_carrier_service,
    change_shipping_carrier_status_service,
)

router = APIRouter(prefix="/admin/dashboard/shipping-carriers", tags=["admin", "shipping"])


@router.get(
    "",
    response_model=list[ShippingCarrierResponse],
    dependencies=[Depends(require_role("admin", "owner"))],
)
def get_shipping_carriers(database: Session = Depends(get_db, scope="function")):
    return get_shipping_carriers_service(database)


@router.post(
    "",
    response_model=ShippingCarrierResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def create_shipping_carrier(
    data: CreateShippingCarrierRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return create_shipping_carrier_service(database, data)


@router.put(
    "/{carrier_id}",
    response_model=ShippingCarrierResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def update_shipping_carrier(
    carrier_id: UUID,
    data: UpdateShippingCarrierRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return update_shipping_carrier_service(database, carrier_id, data)


@router.patch(
    "/{carrier_id}/status",
    response_model=ShippingCarrierResponse,
    dependencies=[Depends(require_role("admin", "owner"))],
)
def change_shipping_carrier_status(
    carrier_id: UUID,
    data: ShippingCarrierStatusRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return change_shipping_carrier_status_service(database, carrier_id, data.is_active)
