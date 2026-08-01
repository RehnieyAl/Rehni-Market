# Este servicio se encarga de manejar la lógica de autenticación de usuarios, 
# incluyendo registro, inicio de sesión, verificación de correo electrónico, 
# recuperación de contraseña y cierre de sesión.
from fastapi import HTTPException
from app.models.ModelCompany import Company, CompanyCertificateEnum
from app.models.ModelUser import Users
from app.models.ModelRole import Role
from app.schemas.SchemaAuthUser import (
    createUser, 
    verifyEmail, 
    userLogin, 
    forgotPassword, 
    ResetPassword,
    TokenResponse,
    RefreshRequest,
    MeProfileResponse,
    changeEmailRequest
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.services.authentication.JWTService import create_access_token, create_refresh_token, verify_token
from app.schemas.SchemaAuthCompany import createCompany
from sqlalchemy.orm import Session
from sqlalchemy import exists
from app.utils.Security import hash_password, verify_password
from app.services.email.SaveAndGenerateCode import (
    create_code_and_send_code,
    verify_code,
    VerifyCodeStatus,
    TypeCode
    )

from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.core.ErrorCodes import ErrorCodes
from app.schemas.SchemaError import ErrorResponse
import traceback

def register_user_service(user: createUser, database: Session):
    user_role = database.query(Role).filter(Role.name == "user").first()
    exists_user = database.query(Users).filter(Users.email == user.email).first()
    
    try:
        if not user_role:
            api_error(409,ErrorCodes.ROLE_NOT_FOUND, "El rol no existe...")

        if exists_user:
            api_error(404,ErrorCodes.EMAIL_ALREADY_EXISTS, "El correo ya se encuentra registrado")

        hashed_password = hash_password(user.password)
        new_user = Users(
            fullName = user.fullName,
            email = user.email,
            hashed_password = hashed_password,
            role_id = user_role.id,
            tell = user.tell
        )
    
        database.add(new_user)
        database.commit()
        database.refresh(new_user)
        confirm_id_user = database.query(Users).filter(Users.email == user.email).first()
        create_code_and_send_code(database, confirm_id_user.id, email=user.email, code_type=TypeCode.VERIFY_EMAIL)
        return {
            "message": "Usuario registrado correctamente, se ha enviado un código de verificación a tu correo electrónico para verificar tu cuenta."
        }
    
    except HTTPException:
        database.rollback()
        raise

    except Exception as e:
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR,"Error interno del servidor.")


def register_company_service(user: createUser, company: createCompany, certificate, nas, database: Session):
    email_exists = database.query(exists().where(Users.email == user.email)).scalar()

    uploaded = False
    #Direcctorio bucket para minio
    path = f"companies/{company.companyNIT}/certificates/"

    try:
        role_exists = database.query(Role).filter(Role.name == "company").first()

        if not role_exists:
            api_error(404,ErrorCodes.ROLE_NOT_FOUND, "No existe el rol empresa")

        nit_exists = database.query(exists().where(Company.CompanyNIT == company.companyNIT)).scalar()

        if nit_exists:
            api_error(409, ErrorCodes.NIT_ALREADY_EXISTS,"El NIT ya se encuentra registrado")
    
        if email_exists:
            api_error(409, ErrorCodes.EMAIL_ALREADY_EXISTS, "El correo ya se encuentra registrado")
        
        
        hashed_password = hash_password(user.password)
        
        new_user = Users(
            fullName = user.fullName,
            email = user.email,
            hashed_password = hashed_password,
            role_id = role_exists.id,
            tell = user.tell
        )

        database.add(new_user)
        database.flush()
        
        if certificate:
            nas.upload_file(certificate, path)
            uploaded = True
            print(f"Archivo {certificate.filename} subido a {path} en NAS.")

        new_company = Company(
            user_id = new_user.id,
            nameCompany = company.companyName,
            addressCompany = company.companyAddress,
            CompanyNIT = company.companyNIT,
            CompanyNITDV = company.companyNITDV,
            CompanyCertificate = path,
        )

        database.add(new_company)
        database.commit()
        database.refresh(new_company)

        try:
            create_code_and_send_code(database, new_user.id, email=user.email, code_type=TypeCode.VERIFY_EMAIL)
            EmailRegisterCompany(user.email,company.companyName,company.companyNIT)
            
        except Exception:
            traceback.print_exc()

        return {
            "message": "Empresa registrada correctamente. espera que el equipo de RehniMarket se ponga en contacto contigo para verificar tu empresa y activar tu cuenta.",
            "certificate_url": new_company.CompanyCertificate,
            "company_name": new_company.nameCompany,
            "company_nit": new_company.CompanyNIT
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

        
def verify_email_service(code: verifyEmail, database: Session):

    try:
        user = database.query(Users).filter(Users.email == code.email).first()
        
        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")
            
        if user.verified:
            return {
                "verified": user.verified,
                "message": "El correo electrónico ya ha sido verificado previamente."
            }
        
        result = verify_code(database=database,user_id=user.id,code=code.code,code_type=TypeCode.VERIFY_EMAIL)

        if result == VerifyCodeStatus.INVALID:
            api_error(400, ErrorCodes.INVALID_CODE, "El codigo de verificacion es incorrecto")

        if result == VerifyCodeStatus.EXPIRED:
            create_code_and_send_code(database, user.id, email=user.email, code_type=TypeCode.VERIFY_EMAIL)
            api_error(400, ErrorCodes.CODE_EXPIRED, "El codigo expiro. Se ha enviado uno nuevo a tu correo")

        user.verified = True
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
    

    

def login_service(user: userLogin, database: Session):
    
    try:
        search_user = (database.query(Users).filter(Users.email == user.email).first())
        
        if not search_user:
            api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrecta")
            
        if not verify_password(user.password, search_user.hashed_password):
            api_error(400, ErrorCodes.INVALID_CREDENTIALS, "Correo o contraseña incorrecta.")
            
        if not search_user.verified:
            create_code_and_send_code(database,search_user.id,search_user.email,code_type=TypeCode.VERIFY_EMAIL)
            api_error(400,ErrorCodes.EMAIL_NOT_VERIFIED,"Tu correo no ha sido verificado, Se ha enviado un nuevo correo...")

        if not search_user.role:
            api_error(400, ErrorCodes.ROLE_NOT_ASSIGNED, "El usuario no tiene un rol asignado")

        if search_user.role.name == "company":
            
            company = search_user.company
            
            if company.CompanyCertificateStatus == CompanyCertificateEnum.PENDING:
                api_error(403, ErrorCodes.COMPANY_PENDING, "Tu empresa esta en revision")
        
            if company.CompanyCertificateStatus == CompanyCertificateEnum.REJECTED:
                api_error(403, ErrorCodes.COMPANY_REJECTED, "Tu empresa esta en revision")

            if company.CompanyStatus == False:
                api_error(403, ErrorCodes.COMPANY_SUSPENDED, "Tu empresa se encuentra suspendida.")

        access_token = create_access_token(
            user_id=str(search_user.id),
            role=search_user.role.name
        )

        refresh_token = create_refresh_token(
            user_id=str(search_user.id)
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            role=search_user.role.name
        )
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")

def get_me_profile_service(user_id: int, database: Session):

    try:
        user = database.query(Users).filter(Users.id == user_id).first()
        
        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")
            
        return MeProfileResponse(
            email=user.email,
            name=user.fullName,
            role=user.role.name
        )
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")

def change_email_service(changeEmail: changeEmailRequest, database: Session):

    try:
        search_user = database.query(Users).filter(Users.email == changeEmail.old_email).first()

        if not search_user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado")

        if search_user.verified:
            api_error(400, ErrorCodes.EMAIL_ALREADY_VERIFIED, "El correo ya fue verificado y no puede modificarse")
            
        email_exists = database.query(Users).filter(Users.email == changeEmail.new_email).first()

        if email_exists:
            api_error(409, ErrorCodes.EMAIL_ALREADY_EXISTS, "El nuevo correo ya esta registrado")


        search_user.email = changeEmail.new_email

        database.commit()
        database.refresh(search_user)

        create_code_and_send_code(
            database=database,
            user_id=search_user.id,
            email=search_user.email,
            code_type=TypeCode.VERIFY_EMAIL
        )
    
    except HTTPException:
        database.rollback()
        raise

    except Exception:
        traceback.print_exc()
        database.rollback()
        api_error(500,ErrorCodes.INTERNAL_SERVER_ERROR, "Ha ocurrido un error interno del servidor")

    return {
        "message": "Correo actualizado correctamente. Se ha enviado un nuevo código de verificación a tu correo electrónico.",
        "email": search_user.email
    }

def forgot_password_service(user: forgotPassword, database: Session):

    try:

        search_user = database.query(Users).filter(Users.email == user.email).first()
        
        if not search_user:
            api_error(404, ErrorCodes.EMAIL_NOT_FOUND,"No existe una cuenta registrada con ese correo.")

        create_code_and_send_code(database, search_user.id, user.email, code_type=TypeCode.RESET_PASSWORD)

        return {
            "message": "se ha enviado un código de recuperación de contraseña a tu correo electrónico."
        }
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        database.rollback()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor")

def reset_password_service(user: ResetPassword, database: Session):

    try:

        search_user = database.query(Users).filter(Users.email == user.email).first()
    
        if not search_user:
            api_error(404, ErrorCodes.EMAIL_NOT_FOUND, "No existe una cuenta registrada con este correo")
        
        result = verify_code(
            database=database,
            user_id=search_user.id,
            code=user.code,
            code_type=TypeCode.RESET_PASSWORD
        )

        if result ==  VerifyCodeStatus.INVALID:
            api_error(400, ErrorCodes.INVALID_CODE, "El codigo de recuperacion es incorrecto")

        if result == VerifyCodeStatus.EXPIRED:
            create_code_and_send_code(
            database=database,
            user_id=search_user.id,
            email=search_user.email,
            code_type=TypeCode.RESET_PASSWORD
            )

            api_error(400, ErrorCodes.CODE_EXPIRED, "El codigo expiro. Se ha enviado uno nuevo a tu correo electronico")

        search_user.hashed_password = hash_password(user.newPassword)

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

def refresh_token_service(data: RefreshRequest, database: Session):
    
    print(data.old_refresh_token)

    try:

        if not data.old_refresh_token:
            api_error(401,ErrorCodes.REFRESH_TOKEN_INVALID,"No se proporcionó un Refresh Token.")

        payload = verify_token(data.old_refresh_token)

        if payload is None:
            api_error(401,ErrorCodes.REFRESH_TOKEN_EXPIRED,"El Refresh Token ha expirado.")

        if payload.get("type") != "refresh":
            api_error(401,ErrorCodes.REFRESH_TOKEN_INVALID,"El token proporcionado no es un Refresh Token.")

        user = database.query(Users).filter(Users.id == payload["sub"]).first()

        if not user:
            api_error(404,ErrorCodes.USER_NOT_FOUND,"Usuario no encontrado.")

        new_access_token = create_access_token(
            user_id=str(user.id),
            role=user.role.name
        )

        new_refresh_token = create_refresh_token(
            user_id=str(user.id)
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            role=user.role.name
        )

    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()

        api_error(500,ErrorCodes.INTERNAL_SERVER_ERROR,"Error interno del servidor.")