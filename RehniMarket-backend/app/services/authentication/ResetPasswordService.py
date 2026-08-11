from fastapi import HTTPException
import traceback

from sqlalchemy.orm import Session

from app.repository.UserRepository import (
    get_by_email,
    update_password
)

from app.services.email.CodeService import (
    verify_code_service,
    create_code_and_send_service,
    VerifyCodeStatus,
    TypeCode
)
from app.schemas.schemaAuth.SchemaResetPassword import  ResetPasswordRequest

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error


def reset_password_service(user: ResetPasswordRequest, database: Session):

    try:
        search_user = get_by_email(database, user.email)
    
        if not search_user:
            api_error(404, ErrorCodes.EMAIL_NOT_FOUND, "No existe una cuenta registrada con este correo")
        
        result = verify_code_service(
            database=database,
            user_id=search_user.id,
            code=user.code,
            code_type=TypeCode.RESET_PASSWORD
        )

        if result ==  VerifyCodeStatus.INVALID:
            api_error(400, ErrorCodes.INVALID_CODE, "El codigo de recuperacion es incorrecto")

        if result == VerifyCodeStatus.EXPIRED:
            create_code_and_send_service(database=database,user_id=search_user.id,email=search_user.email,code_type=TypeCode.RESET_PASSWORD)
            database.commit()
            api_error(400, ErrorCodes.CODE_EXPIRED, "El codigo expiro. Se ha enviado uno nuevo a tu correo electronico")

        update_password(database, search_user, user.new_password)

        database.commit()

        return {
            "message": "Contraseña restablecida correctamente"
        }
    
    except HTTPException:
        database.rollback()
        raise

    except Exception:
        traceback.print_exc()
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")