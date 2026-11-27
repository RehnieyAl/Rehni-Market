"""Esquemas del panel de empresa: configuración de "Mi tienda", su actualización y la del certificado."""
import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.ModelCompany import CompanyCertificateEnum


class CompanyCertificateUpdateResponse(BaseModel):
    """Respuesta de `POST /company/certificate/update` (actualización por credenciales,
    sin JWT). No devuelve tokens, hash ni datos sensibles."""

    message: str
    certificateStatus: str


class CompanyStoreSettingsResponse(BaseModel):
    """Respuesta de `GET /company/dashboard/my-profile` ("Mi tienda"): solo datos de la empresa.
    Los datos personales del representante (nombre, correo, teléfono) se consultan en /auth/me."""

    id: UUID
    nameCompany: str
    addressCompany: str
    description: Optional[str]
    CompanyNIT: str
    CompanyNITDV: str
    CompanyStatus: bool
    suspensionReason: Optional[str]
    certificateStatus: CompanyCertificateEnum
    rejectionReason: Optional[str]
    memberAT: datetime
    logo: Optional[str]
    banner: Optional[str]
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    contactPublic: bool = False


class UpdateInformationCompanyRequest(BaseModel):
    """Solo información de la empresa. Los datos de la cuenta / representante
    (nombre, correo, teléfono) se editan desde PATCH /auth/me, no aquí."""

    nameCompany: Optional[str] = None
    addressCompany: Optional[str] = None
    description: Optional[str] = None
    # Contacto empresarial; "" lo borra. Solo se publica si la empresa activa contactPublic.
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    contactPublic: Optional[bool] = None

    @field_validator("contactEmail")
    @classmethod
    def validate_contact_email(cls, value: Optional[str]):
        if value is None:
            return value
        value = value.strip().lower()
        # Mismo lenguaje que [^@\s]+@[^@\s]+\.[^@\s]+, sin el retroceso cuadrático de aquella (el punto
        # podía consumirse de dos formas); el límite de 254 ya acota el costo antes de evaluar.
        if value and (len(value) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s][^@\s.]*\.[^@\s]+", value)):
            raise ValueError("Escribe un correo de contacto válido.")
        return value

    @field_validator("contactPhone")
    @classmethod
    def validate_contact_phone(cls, value: Optional[str]):
        if value is None:
            return value
        value = re.sub(r"[\s-]", "", value)
        if value and not re.fullmatch(r"\+?\d{7,15}", value):
            raise ValueError("El teléfono de contacto debe tener entre 7 y 15 dígitos.")
        return value

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
