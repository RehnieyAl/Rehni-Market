from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.schemas.schemaAuth.SchemaVerifyEmail import (
    VerifyEmailRequest,
    ChangeEmailRequestOnlyRegistered,
    ResendVerificationCodeRequest,
)

from app.services.email.CodeService import (
    verify_code_service,
    issue_verification_code,
    resend_verification_code,
    VerifyCodeStatus,
    TypeCode,
    delete_user_codes
)

from app.repository.UserRepository import (
    get_by_email,
    verify_email
)

import traceback


def _account_email_context(user):
    """role + company_name para elegir la plantilla de correo correcta
    (usuario vs empresa). Misma logica para ambos tipos de cuenta."""
    role = user.role.name if user.role else None
    company_name = (
        user.company.nameCompany if role == "company" and user.company else None
    )
    return role, company_name


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
            api_error(400, ErrorCodes.INVALID_CODE, "El código de verificación es incorrecto.")

        if result == VerifyCodeStatus.EXPIRED:
            api_error(
                400,
                ErrorCodes.CODE_EXPIRED,
                "El código de verificación ha expirado. Solicita un nuevo código.",
            )

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


def resend_verification_code_service(data: ResendVerificationCodeRequest, database: Session):
    """Boton "Reenviar codigo" de la pantalla de verificacion. Funciona
    igual para usuario y empresa. Aplica el cooldown de 60 s en backend
    (no se puede saltar manipulando el frontend)."""

    try:
        user = get_by_email(database, data.email)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        if user.verified:
            api_error(400, ErrorCodes.EMAIL_ALREADY_VERIFIED, "El correo electronico ya ha sido verificado.")

        role, company_name = _account_email_context(user)

        code_state = resend_verification_code(
            database,
            user.id,
            user.email,
            role=role,
            company_name=company_name,
        )

        database.commit()

        return {
            "message": "Se ha enviado un nuevo código a tu correo electrónico.",
            **code_state,
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor..")


def change_email_service(changeEmail: ChangeEmailRequestOnlyRegistered, database: Session):

    try:

        user = get_by_email(database, changeEmail.old_email)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

        if user.verified:
            api_error(400, ErrorCodes.EMAIL_ALREADY_VERIFIED, "El correo ya fue verificado y no puede modificarse")

        delete_user_codes(database, user.id, TypeCode.VERIFY_EMAIL)

        user.email = changeEmail.new_email

        role, company_name = _account_email_context(user)

        code_state = issue_verification_code(
            database=database,
            user_id=user.id,
            email=user.email,
            role=role,
            company_name=company_name,
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
        "email": user.email,
        **code_state,
    }
