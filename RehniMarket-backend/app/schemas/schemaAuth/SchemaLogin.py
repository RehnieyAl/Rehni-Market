from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MeProfileResponse(BaseModel):
    email: str
    name: str
    role: str
    # Foto de la cuenta autenticada, común a cualquier rol.
    profileImagen: str | None = None


class UpdateMeRequest(BaseModel):
    """PATCH parcial sobre la propia cuenta (cualquier rol): nombre y correo
    son de la cuenta, no del perfil público de una empresa."""

    fullName: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, value: Optional[str]):
        if value is None:
            return value

        value = value.strip()

        if len(value) < 3:
            raise ValueError(
                "El nombre debe tener al menos 3 caracteres."
            )

        if len(value) > 60:
            raise ValueError(
                "El nombre no debe exceder los 60 caracteres."
            )

        return value
