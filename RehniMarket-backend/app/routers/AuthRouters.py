# Este router se encarga de manejar las rutas relacionadas 
# con la autenticación de usuarios, incluyendo registro, inicio de sesión,
# verificación de correo electrónico, recuperación de contraseña y cierre de sesión.
from fastapi import APIRouter,Depends, UploadFile, File, Request

from sqlalchemy.orm import Session
from app.database.Connection import get_db

#Schemas
from app.schemas.schemaAuth.SchemaRegister import (
    CreateUserRequest,
    CreateCompanyRequest
)
from app.schemas.schemaAuth.SchemaVerifyEmail import (
    VerifyEmailRequest,
    ChangeEmailRequestOnlyRegistered,
    ResendVerificationCodeRequest,
)
from app.schemas.schemaAuth.SchemaLogin import LoginRequest, UpdateMeRequest
from app.schemas.schemaAuth.SchemaForgotPassword import ForgotPasswordRequest
from app.schemas.schemaAuth.SchemaResetPassword import ResetPasswordRequest
from app.schemas.schemaAuth.SchemaToken import RefreshRequest

#Servicios
from app.services.authentication.RegisterService import (
    register_user_service,
    register_company_service
)
from app.services.authentication.VerifyEmailService import (
    verify_email_service,
    change_email_service,
    resend_verification_code_service,
)
from app.services.authentication.LoginService import login_service
from app.services.authentication.ForgotPasswordService import forgot_password_service
from app.services.authentication.ResetPasswordService import reset_password_service
from app.services.authentication.RefreshTokenService import refresh_token_service
from app.services.authentication.MeService import (
    get_me_profile_service,
    update_me_profile_service,
    update_me_photo_service,
)

#Servicio de minio (Nasservice)

from app.services.NasService import NasService, get_nas_service

router = APIRouter(
    prefix=("/auth"),   
    tags=["authentication"]
)

@router.post("/register-user")
def registerUser(user: CreateUserRequest, database: Session = Depends(get_db)):
    return register_user_service(user, database)

@router.post("/register-company")
def registerCompany(
    user: CreateUserRequest = Depends(CreateUserRequest.as_form),
    company: CreateCompanyRequest = Depends(CreateCompanyRequest.as_form),
    certificate: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db)):

    return register_company_service(
        user=user,
        company=company, 
        certificate=certificate,
        nas=nas, 
        database=database
    )

@router.post("/verify-email-user")
def verify_email(code: VerifyEmailRequest, database: Session = Depends(get_db)):
    
    return verify_email_service(code, database)

@router.post("/change-email")
def change_email(changeEmail: ChangeEmailRequestOnlyRegistered, database: Session = Depends(get_db)):

    return change_email_service(changeEmail, database)

@router.post("/resend-verification-code")
def resend_verification_code(data: ResendVerificationCodeRequest, database: Session = Depends(get_db)):

    return resend_verification_code_service(data, database)

@router.post("/login-user")
def login_user(user: LoginRequest, database: Session = Depends(get_db)):
    
    return login_service(user, database)


@router.post("/forgot-password-user")
def forgot_password(user: ForgotPasswordRequest, database: Session = Depends(get_db)):

    return forgot_password_service(user, database)

@router.post("/reset-password-user")
def reset_password(user: ResetPasswordRequest, database: Session = Depends(get_db)):
 
    return reset_password_service(user, database)

@router.post("/refresh")
def refresh_token(data:RefreshRequest, database: Session = Depends(get_db)):

    return refresh_token_service(data, database)


@router.get("/me")
def get_me(request: Request, database: Session = Depends(get_db)):

    return get_me_profile_service(
        user_id=request.state.user_id,
        database=database
    )


# ==============================
# CONFIGURACIÓN DE CUENTA (común a cualquier rol)
# ==============================
# Nombre/correo/foto de perfil pertenecen a la CUENTA autenticada, no a
# ningún módulo específico de rol - por eso viven bajo /auth, no bajo
# /company/dashboard, /admin/dashboard, etc. (ver ALCANCE > "Configuración
# de cuenta" es común a user/company/admin/owner).

@router.patch("/me")
def update_me(request: Request, data: UpdateMeRequest, database: Session = Depends(get_db)):

    return update_me_profile_service(
        user_id=request.state.user_id,
        data=data,
        database=database,
    )


@router.patch("/me/photo")
def update_me_photo(
    request: Request,
    photo: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):

    return update_me_photo_service(
        user_id=request.state.user_id,
        photo=photo,
        nas=nas,
        database=database,
    )


