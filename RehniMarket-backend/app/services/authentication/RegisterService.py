from fastapi import HTTPException
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from sqlalchemy.orm import Session
from app.services.email.CodeService import (
    issue_verification_code
)
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.core.ErrorCodes import ErrorCodes
import traceback

from app.repository.RoleRepository import (
    get_role_by_name
)

from app.repository.UserRepository import (
    get_by_email,
    create_user
)

from app.repository.CompanyRepository import (
    get_company_by_nit,
    create_company
)


from app.schemas.schemaAuth.SchemaRegister import (
    CreateUserRequest,
    CreateCompanyRequest
)

def register_user_service(user: CreateUserRequest, database: Session):
    try:
        user_role = get_role_by_name(database, "user")
        if user_role is None:
            api_error(409,ErrorCodes.ROLE_NOT_FOUND, "El rol no existe...")

        email_exists = get_by_email(database, user.email)

        if email_exists is not None:
            api_error(409,ErrorCodes.EMAIL_ALREADY_EXISTS, "El correo ya se encuentra registrado")

        new_user = create_user(
            database = database,
            user = user,
            role_id = user_role.id
        )
    
        code_state = issue_verification_code(database, new_user.id, user.email, role=user_role.name)

        database.commit()
        database.refresh(new_user)

        return {
            "message": "Usuario registrado correctamente, se ha enviado un código de verificación a tu correo electrónico para verificar tu cuenta.",
            **code_state,
        }
    
    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR,"Error interno del servidor.")


def register_company_service(user: CreateUserRequest, company: CreateCompanyRequest, certificate, nas, database: Session):
    try:
        uploaded = False

        user_role = get_role_by_name(database, "company")

        if user_role is None:
            api_error(404,ErrorCodes.ROLE_NOT_FOUND, "No existe el rol empresa")

        email_exists = get_by_email(database, user.email)
    
        if email_exists:
            api_error(409, ErrorCodes.EMAIL_ALREADY_EXISTS, "El correo ya se encuentra registrado")

        nit_exists = get_company_by_nit(database, company.company_nit)

        if nit_exists:
            api_error(409, ErrorCodes.NIT_ALREADY_EXISTS,"El NIT ya se encuentra registrado")

        
        new_user = create_user(
            database = database,
            user = user,
            role_id = user_role.id
        )
        path = f"companies/{company.company_nit}/certificates/"
        if certificate:
            result =  nas.upload_file(certificate, path)

            if not result["success"]:
                api_error(500,ErrorCodes.INTERNAL_SERVER_ERROR,"No se pudo subir el certificado")

            result["object_name"]

            uploaded = True

        new_company = create_company(
            database = database,
            company = company,
            user_id = new_user.id,
            certificate_path = result["object_name"]
        )

        code_state = issue_verification_code(database, new_user.id, user.email, role=user_role.name, company_name=company.company_name)

        database.commit()
        return {
            "message": "Empresa registrada correctamente. espera que el equipo de RehniMarket se ponga en contacto contigo para verificar tu empresa y activar tu cuenta.",
            "certificate_url": new_company.CompanyCertificate,
            "company_name": new_company.nameCompany,
            "company_nit": new_company.CompanyNIT,
            **code_state,
        }
    

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()

        if uploaded:

            try:
                nas.delete_file(path)
            except Exception:
                traceback.print_exc()
        
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")