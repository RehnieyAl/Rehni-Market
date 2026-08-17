from typing import Optional
from pydantic import BaseModel, field_validator


class UpdateInformationCompanyRequest(BaseModel):
    """
    Solo información PÚBLICA de la tienda (perfil público de empresa - ver
    "Mi tienda" en el dashboard). El nombre del responsable de la cuenta y
    el correo de acceso son datos de la CUENTA, no de la empresa - se
    editan desde "Configuración de cuenta" (PATCH /auth/me), común a
    cualquier rol, no aquí (ver ALCANCE > "no crear lógica duplicada").
    """

    nameCompany: Optional[str] = None
    tellCompany: Optional[str] = None
    addressCompany: Optional[str] = None
    # Descripcion publica de la empresa (perfil publico > "Descripcion").
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
