from typing import Optional
from pydantic import BaseModel, field_validator


class UpdateInformationCompanyRequest(BaseModel):
    """Solo información pública de la tienda. El nombre y el correo de la cuenta
    se editan desde PATCH /auth/me, no aquí."""

    nameCompany: Optional[str] = None
    tellCompany: Optional[str] = None
    addressCompany: Optional[str] = None
    description: Optional[str] = None

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 1000:
            raise ValueError(
                "La descripción no debe exceder los 1000 caracteres."
            )

        return value
