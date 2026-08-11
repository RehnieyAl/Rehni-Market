from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.schemaAuth.SchemaVerifyEmail import VerifyEmailRequest, ChangeEmailRequestOnlyRegistered

from app.services.email.CodeService import (
    verify_code_service,
    create_code_and_send_service,
    VerifyCodeStatus,
    TypeCode,
    delete_user_codes
)

from app.repository.UserRepository import (
    get_by_email,
    verify_email
)

import traceback

def verify_email_service(code: VerifyEmailRequest, database: Session):

    try:
        user = get_by_email(database, code.email)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")
            
        if user.verified:
            api_error(400, ErrorCodes.EMAIL_ALREADY_VERIFIED, "El correo electronico ya ha sido verificado.")
        
        result = verify_code_service(
            database=database,
            user_id=user.id,
            code=code.code,
            code_type=TypeCode.VERIFY_EMAIL
        )

        if result == VerifyCodeStatus.INVALID:
            api_error(400, ErrorCodes.INVALID_CODE, "El codigo de verificacion es incorrecto")

        if result == VerifyCodeStatus.EXPIRED:
            create_code_and_send_service(database, user.id, email=user.email, code_type=TypeCode.VERIFY_EMAIL)
            database.commit()
            api_error(400, ErrorCodes.CODE_EXPIRED, "El codigo expiro. Se ha enviado uno nuevo a tu correo")

        verify_email(database, user)

        database.commit()

        return {
            "verified": user.verified,
            "message": "El correo electronico ha sido verificado"
        }
    
    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor..")


#Si el usuario se equivoca al ingresar su correo, puede cambiarlo antes de verificarlo. 
#Esto solo es posible si el correo no ha sido verificado aun.

def change_email_service(changeEmail: ChangeEmailRequestOnlyRegistered, database: Session):

    try:

        user = get_by_email(database, changeEmail.old_email)
        delete_user_codes(database, user.id, TypeCode.VERIFY_EMAIL)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

        if user.verified:
            api_error(400, ErrorCodes.EMAIL_ALREADY_VERIFIED, "El correo ya fue verificado y no puede modificarse")


        user.email = changeEmail.new_email

        create_code_and_send_service(
            database=database,
            user_id=user.id,
            email=user.email,
            code_type=TypeCode.VERIFY_EMAIL
        )

        database.commit()

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        traceback.print_exc()
        database.rollback()
        api_error(500,ErrorCodes.INTERNAL_SERVER_ERROR, "Ha ocurrido un error interno del servidor")

    return {
        "message": "Correo actualizado correctamente. Se ha enviado un nuevo código de verificación a tu correo electrónico.",
        "email": user.email
    }
    