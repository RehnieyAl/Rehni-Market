from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ShippingCarrierBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=80,
    )

    tracking_url: str = Field(
        ...,
        min_length=3,
        max_length=255,
    )


class CreateShippingCarrierRequest(ShippingCarrierBase):
    is_active: bool = True


class UpdateShippingCarrierRequest(ShippingCarrierBase):
    is_active: bool = True


class ShippingCarrierStatusRequest(BaseModel):
    is_active: bool


class ShippingCarrierResponse(ShippingCarrierBase):
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
