import re
from pydantic import BaseModel, EmailStr, field_validator


class ResetPasswordRequest(BaseModel):

    email: EmailStr
    code: str
    new_password: str


    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str):

        if len(value) < 8:
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "La contraseña debe contener al menos una letra mayúscula."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "La contraseña debe contener al menos una letra minúscula."
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "La contraseña debe contener al menos un número."
            )

        return value