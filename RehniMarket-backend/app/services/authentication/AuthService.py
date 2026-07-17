# Este servicio se encarga de manejar la lógica de autenticación de usuarios, 
# incluyendo registro, inicio de sesión, verificación de correo electrónico, 
# recuperación de contraseña y cierre de sesión.
from fastapi import HTTPException
from app.models.ModelCompany import Company
from app.models.ModelUser import Users
from app.models.ModelRole import Role
from app.models.ModelCode import TypeCode, Codes
from app.schemas.SchemaAuthUser import (
    createUser, 
    verifyEmail, 
    userLogin, 
    forgotPassword, 
    ResetPassword,
    TokenResponse,
    RefreshRequest,
    MeProfileResponse
)

from app.services.authentication.JWTService import create_access_token, create_refresh_token, verify_token
from app.schemas.SchemaAuthCompany import createCompany, LoginCompany
from sqlalchemy.orm import Session
from sqlalchemy import exists
from app.utils.Security import hash_password, verify_password
from app.services.email.SaveAndGenerateCode import create_code_and_send_code, verify_code
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.core.ErrorCodes import ErrorCodes
from app.schemas.SchemaError import ErrorResponse

def register_user_service(user: createUser, database: Session):
    user_role = database.query(Role).filter(Role.name == "user").first()
    exists_user = database.query(Users).filter(Users.email == user.email).first()
    
    try:
        if exists_user:
            raise HTTPException(status_code=409, detail="correo en uso")

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
        raise HTTPException(status_code=500, detail=f"ERROR INTERNO DEL SERVIDOR {str(e)}")


def register_company_service(user: createUser, company: createCompany, certificate, nas, database: Session):
    role_exists = database.query(Role).filter(Role.name == "company").first()
    nit_exists = database.query(exists().where(Company.CompanyNIT == company.companyNIT)).scalar()
    email_exists = database.query(exists().where(Users.email == user.email)).scalar()

    uploaded = False
    #Direcctorio bucket para minio
    path = f"companies/{company.companyNIT}/certificates/"

    try:

        if not role_exists:
            raise HTTPException(status_code=409, detail="Ups no hay rol para empresa")
    
        if nit_exists:
            raise HTTPException(status_code=409, detail="NIT en uso")
    
        if email_exists:
            raise HTTPException(status_code=409, detail="Correo en uso")
        
        if certificate:
            nas.upload_file(certificate, path)
            uploaded = True
            print("Certificado subido correctamente", uploaded)
        
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

        new_company = Company(
            user_id = new_user.id,
            nameCompany = company.companyName,
            addressCompany = company.companyAddress,
            CompanyNIT = company.companyNIT,
            CompanyNITDV = company.companyNITDV,
            CompanyLogo = company.companyLogo,
            CompanyBanner = company.companyBanner,
            CompanyCertificate = path,
        )

        database.add(new_company)
        database.commit()
        database.refresh(new_company)

        try:
            EmailRegisterCompany(user.email,company.companyName,company.companyNIT)
            
        except Exception as email_error:
            print("Error al enviando correo:", email_error)
            raise HTTPException(status_code=401, detail="Error al enviar correo")

        return {
            "message": "Empresa registrada correctamente. espera que el equipo de Lubix se ponga en contacto contigo para verificar tu empresa y activar tu cuenta.",
            "certificate_url": new_company.CompanyCertificate,
            "company_name": new_company.nameCompany,
            "company_nit": new_company.CompanyNIT
        }
    

    except HTTPException:
        database.rollback()
        raise
    
    except Exception as e:
        database.rollback()

        if uploaded:

            try:
                nas.delete_file(path)
            except Exception:
                pass

        raise HTTPException(status_code=500,detail=f"Error interno del servidor{str(e)}")

def verify_email_service(code: verifyEmail, database: Session):
    user = database.query(Users).filter(Users.email == code.email).first()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.verified:
        return {
            "verified": user.verified,
            "message": "El correo electrónico ya ha sido verificado previamente."
        }
    
    if not verify_code(database, user.id, code.code, code_type=TypeCode.VERIFY_EMAIL):
        create_code_and_send_code(database, user.id, user.email, code_type=TypeCode.VERIFY_EMAIL)
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto o expirado. Se ha enviado un nuevo código a tu correo electrónico.")
    
    user.codes.used = True
    user.verified = True
    database.commit()

    return {
        "verified": user.verified,
        "message": "Correo electrónico verificado correctamente"
    }

def login_service(user: userLogin, database: Session):
    search_user = (database.query(Users).filter(Users.email == user.email).first())

    if not search_user:
        raise HTTPException(status_code=400, detail=ErrorResponse(
            code=ErrorCodes.INVALID_CREDENTIALS,
            message="Correo o contraseña incorrectos."
        ).model_dump())

    if not verify_password(user.password, search_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=ErrorCodes.INVALID_CREDENTIALS,
                message="Correo o contraseña incorrectos."
            ).model_dump()
        )

    if not search_user.verified:
        create_code_and_send_code(
            database,
            search_user.id,
            search_user.email,
            code_type=TypeCode.VERIFY_EMAIL
        )

        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Tu correo electrónico no ha sido verificado. Se ha enviado un nuevo código de verificación a tu correo electrónico."
            }
        )

    if not search_user.role:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "ROLE_NOT_ASSIGNED",
                "message": "El usuario no tiene un rol asignado."
            }
        )


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

def get_me_profile_service(user_id: int, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return MeProfileResponse(
        email=user.email,
        name=user.fullName,
        role=user.role.name
    )

def forgot_password_service(user: forgotPassword, database: Session):
    search_user = database.query(Users).filter(Users.email == user.email).first()
    if not search_user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    create_code_and_send_code(database, search_user.id, user.email, code_type=TypeCode.RESET_PASSWORD)

    return {
        "message": "se ha enviado un código de recuperación de contraseña a tu correo electrónico."
    }

def reset_password_service(user: ResetPassword, database: Session):
    search_user = database.query(Users).filter(Users.email == user.email).first()
    if not search_user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    
    if not verify_code(database, search_user.id, user.code, code_type=TypeCode.RESET_PASSWORD):
        create_code_and_send_code(database, search_user.id, user.email, code_type=TypeCode.RESET_PASSWORD)
        raise HTTPException(status_code=400, detail={
            "code": "RESET_CODE_EXP",
            "message": "Código de recuperación de contraseña incorrecto o expirado."})

    hashed_password = hash_password(user.newPassword)
    search_user.hashed_password = hashed_password
    database.commit()
    
    return {
        "message": "Contraseña restablecida correctamente"
    }


def refresh_token_service(data: RefreshRequest, database: Session):

    payload = verify_token(data.old_refresh_token)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=401,detail="Refresh token inválido o expirado")
    
    id_user = payload["sub"]

    if payload["type"] != "refresh":
        raise HTTPException(status_code=401, detail="Token incorrecto")
    
    user = database.query(Users).filter(Users.id == id_user).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado...")
    

    new_access_token = create_access_token(
        user_id=str(user.id),
        role=str(user.role.name)
    )

    new_refresh_token = create_refresh_token(
        user_id=str(user.id)
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        role=user.role.name

    )
