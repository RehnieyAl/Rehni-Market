from fastapi import HTTPException
import traceback

from sqlalchemy.orm import Session

from app.repository.UserRepository import get_by_email

from app.services.email.CodeService import (
    create_code_and_send_service,
    TypeCode
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.schemaAuth.SchemaForgotPassword import ForgotPasswordRequest

def forgot_password_service(data: ForgotPasswordRequest, database: Session):

    try:

        search_user = get_by_email(database, data.email)
        
        if not search_user:
            api_error(404, ErrorCodes.EMAIL_NOT_FOUND,"No existe una cuenta registrada con ese correo.")

        create_code_and_send_service(database, search_user.id, data.email, code_type=TypeCode.RESET_PASSWORD)
        database.commit()

        return {
            "message": "se ha enviado un código de recuperación de contraseña a tu correo electrónico."
        }
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")