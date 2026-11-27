"""Schema para restablecer la contraseña con el código enviado al correo."""

from pydantic import BaseModel, field_validator
from app.schemas.SchemaEmail import NormalizedEmail
from app.schemas.schemaAuth.SchemaRegister import check_password_strength


class ResetPasswordRequest(BaseModel):

    email: NormalizedEmail
    code: str
    new_password: str


    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str):
        return check_password_strength(value)