"""Schema de solicitud de recuperación de contraseña."""

from pydantic import BaseModel
from app.schemas.SchemaEmail import NormalizedEmail

class ForgotPasswordRequest(BaseModel):
    email: NormalizedEmail