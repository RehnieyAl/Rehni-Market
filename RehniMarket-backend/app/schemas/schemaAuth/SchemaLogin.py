from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MeProfileResponse(BaseModel):
    email: str
    name: str
    role: str
    # Foto de perfil de la CUENTA autenticada (Users.profileImagen) - común
    # a cualquier rol (user/company/admin/owner), no exclusiva de empresa.
    # Cualquier componente que consuma GET /auth/me la recibe aquí.
    profileImagen: str | None = None


class UpdateMeRequest(BaseModel):
    """
    PATCH parcial sobre la propia cuenta autenticada (GET/PATCH /auth/me),
    disponible para cualquier rol - no vive bajo /company/dashboard ni
    ningún otro prefijo scoped a un rol, precisamente porque el nombre y
    el correo pertenecen a la CUENTA, no al perfil público de una empresa
    (ver ALCANCE > "Configuración de cuenta" es común a todos los roles).
    """

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
