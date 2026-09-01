from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.Connection import get_db
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


@router.get("", response_model=list[ShippingCarrierResponse])
def get_shipping_carriers(database: Session = Depends(get_db)):
    return get_shipping_carriers_service(database)


@router.post("", response_model=ShippingCarrierResponse)
def create_shipping_carrier(
    data: CreateShippingCarrierRequest,
    database: Session = Depends(get_db),
):
    return create_shipping_carrier_service(database, data)


@router.put("/{carrier_id}", response_model=ShippingCarrierResponse)
def update_shipping_carrier(
    carrier_id: UUID,
    data: UpdateShippingCarrierRequest,
    database: Session = Depends(get_db),
):
    return update_shipping_carrier_service(database, carrier_id, data)


@router.patch("/{carrier_id}/status", response_model=ShippingCarrierResponse)
def change_shipping_carrier_status(
    carrier_id: UUID,
    data: ShippingCarrierStatusRequest,
    database: Session = Depends(get_db),
):
    return change_shipping_carrier_status_service(database, carrier_id, data.is_active)
