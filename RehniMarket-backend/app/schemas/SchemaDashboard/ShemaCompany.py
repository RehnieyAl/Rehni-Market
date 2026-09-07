from typing import Optional
from pydantic import BaseModel, field_validator


class CompanyCertificateUpdateResponse(BaseModel):
    """Respuesta de `POST /company/certificate/update` (actualización por credenciales,
    sin JWT). No devuelve tokens, hash ni datos sensibles."""

    message: str
    certificateStatus: str


class UpdateInformationCompanyRequest(BaseModel):
    """Solo información de la empresa. Los datos de la cuenta / representante
    (nombre, correo, teléfono) se editan desde PATCH /auth/me, no aquí."""

    nameCompany: Optional[str] = None
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
