"""Restablece la contraseña con el código de recuperación vigente, sin revelar si la cuenta existe."""

import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.repository.UserRepository import get_by_email, update_password
from app.schemas.schemaAuth.SchemaResetPassword import ResetPasswordRequest
from app.services.authentication.VerifyEmailService import raise_code_error
from app.services.email.CodeService import TypeCode, VerifyCodeStatus, verify_code_service

logger = logging.getLogger(__name__)


def reset_password_service(user: ResetPasswordRequest, database: Session):

    try:
        search_user = get_by_email(database, user.email)

        # Un correo sin cuenta responde lo mismo que un código incorrecto (sin enumeración).
        if not search_user:
            raise_code_error(VerifyCodeStatus.INVALID, "recuperación")

        result = verify_code_service(
            database=database,
            user_id=search_user.id,
            code=user.code,
            code_type=TypeCode.RESET_PASSWORD,
        )

        if result != VerifyCodeStatus.VALID:
            database.commit()
            raise_code_error(result, "recuperación")

        update_password(database, search_user, user.new_password)

        database.commit()

        return {
            "message": "Contraseña restablecida correctamente"
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        logger.exception("Error inesperado")
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")
