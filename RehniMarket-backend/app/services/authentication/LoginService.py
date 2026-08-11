from fastapi import HTTPException
import traceback

from sqlalchemy.orm import Session

from app.models.ModelCompany import CompanyCertificateEnum

from app.schemas.schemaAuth.SchemaLogin import LoginRequest
from app.schemas.schemaAuth.SchemaToken import TokenResponse as LoginResponse

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.utils.Security import verify_password

from app.services.authentication.JWTService import (
    create_access_token,
    create_refresh_token
)

from app.services.email.CodeService import (
    create_code_and_send_service,
    TypeCode
)

from app.repository.UserRepository import (
    get_by_email
)


def login_service(user: LoginRequest, database: Session) -> LoginResponse:
    
    try:
        search_user = get_by_email(database, user.email)

        if not search_user:
                    api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrecta")

        if not search_user.isActive:
            api_error(403,ErrorCodes.USER_BLOCKED,"Tu cuenta se encuentra bloqueada. Contacta con un administrador.")
    
            
        if not verify_password(user.password, search_user.hashed_password):
            api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrecta.")
            
        if not search_user.verified:
            create_code_and_send_service(database, search_user.id, search_user.email, code_type=TypeCode.VERIFY_EMAIL)
            api_error(400, ErrorCodes.EMAIL_NOT_VERIFIED, "Tu correo no ha sido verificado, Se ha enviado un nuevo correo...")

        if not search_user.role:
            api_error(400, ErrorCodes.ROLE_NOT_ASSIGNED, "El usuario no tiene un rol asignado")

        if search_user.role.name == "company":
            
            company = search_user.company
            
            if company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING:
                api_error(403, ErrorCodes.COMPANY_PENDING, "Tu empresa esta en revision")
        
            if company.CompanyCertificateStatus == CompanyCertificateEnum.REJECTED:
                api_error(403, ErrorCodes.COMPANY_REJECTED, "Tu empresa ha sido rechazada")

            if company.CompanyStatus == False:
                api_error(403, ErrorCodes.COMPANY_SUSPENDED, "Tu empresa se encuentra suspendida.")

        access_token = create_access_token(
            user_id=str(search_user.id),
            role=search_user.role.name
        )

        refresh_token = create_refresh_token(
            user_id=str(search_user.id)
        )

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            role=search_user.role.name
        )
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
