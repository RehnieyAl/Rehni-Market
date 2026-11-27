"""Schemas de verificación de correo, cambio de correo sin verificar y reenvío del código."""

from pydantic import BaseModel
from app.schemas.SchemaEmail import NormalizedEmail
class VerifyEmailRequest(BaseModel):
    email: NormalizedEmail
    code: str

class ChangeEmailRequestOnlyRegistered(BaseModel):
    old_email: NormalizedEmail
    new_email: NormalizedEmail

class ResendVerificationCodeRequest(BaseModel):
    email: NormalizedEmail
