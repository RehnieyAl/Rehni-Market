"""Solicitud y reenvío del código de recuperación de contraseña sin revelar si la cuenta existe."""

import logging
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.middleware.RateLimitMiddleware import retry_after_if_limited
from app.models.ModelCode import TypeCode
from app.repository.CodeRepository import get_code
from app.repository.UserRepository import get_by_email
from app.schemas.schemaAuth.SchemaForgotPassword import ForgotPasswordRequest
from app.services.email.CodeService import (
    RESEND_COOLDOWN_SECONDS,
    RESET_PASSWORD_EXPIRATION_MINUTES,
    cooldown_remaining,
    enforce_send_limits,
    issue_reset_code,
    lock_account,
    reject_if_cooling_down,
)

logger = logging.getLogger(__name__)

GENERIC_MESSAGE = (
    "Si el correo corresponde a una cuenta de Rehni Market, te enviamos un código de recuperación."
)


def forgot_password_service(data: ForgotPasswordRequest, database: Session, client_ip: str | None = None):
    """El cooldown y los topes se cuentan por correo antes de buscar la cuenta, así un correo
    inexistente recibe exactamente las mismas respuestas (200 o 429) que uno registrado."""

    try:
        reject_if_cooling_down(
            retry_after_if_limited(f"code-cooldown:reset:{data.email}", 1, RESEND_COOLDOWN_SECONDS) or 0
        )
        enforce_send_limits("reset", data.email, client_ip)

        user = get_by_email(database, data.email)

        if user:
            lock_account(database, user.id)
            now = datetime.utcnow()
            # Con varios procesos el contador en memoria no se comparte: la fecha del código guardado
            # sigue impidiendo un segundo correo dentro del cooldown.
            reject_if_cooling_down(cooldown_remaining(get_code(database, user.id, TypeCode.RESET_PASSWORD), now))
            issue_reset_code(database, user.id, user.email, now)
            database.commit()

        return {
            "message": GENERIC_MESSAGE,
            "expires_in": RESET_PASSWORD_EXPIRATION_MINUTES * 60,
            "resend_available_in": RESEND_COOLDOWN_SECONDS,
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        logger.exception("Error inesperado")
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")
