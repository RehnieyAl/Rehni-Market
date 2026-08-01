from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ColorBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    hex_color: str = Field(
        ...,
        pattern=r"^#[0-9A-Fa-f]{6}$",
    )


class CreateColorRequest(ColorBase):
    pass


class UpdateColorRequest(ColorBase):
    pass


class ColorResponse(ColorBase):
    id: UUID

    model_config = ConfigDict(
        from_attributes=True
    )