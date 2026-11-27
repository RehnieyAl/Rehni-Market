"""Rutas de autenticación: registro, verificación, login, refresh y perfil propio (/auth/me)."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Request, UploadFile

from sqlalchemy.orm import Session
from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role
from app.utils.FileValidator import IMAGE_EXTENSIONS, PDF_EXTENSIONS, validate_upload

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

from app.services.NasService import NasService, get_nas_service

router = APIRouter(
    prefix=("/auth"),   
    tags=["authentication"]
)

@router.post("/register-user")
def registerUser(user: CreateUserRequest, database: Session = Depends(get_db, scope="function")):
    return register_user_service(user, database)

@router.post("/register-company")
def registerCompany(
    user: CreateUserRequest = Depends(CreateUserRequest.as_form),
    company: CreateCompanyRequest = Depends(CreateCompanyRequest.as_form),
    certificate: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db, scope="function")):
    validate_upload(certificate, PDF_EXTENSIONS, "Certificado")

    return register_company_service(
        user=user,
        company=company, 
        certificate=certificate,
        nas=nas, 
        database=database
    )

@router.post("/verify-email-user")
def verify_email(code: VerifyEmailRequest, database: Session = Depends(get_db, scope="function")):
    
    return verify_email_service(code, database)

@router.post("/change-email")
def change_email(changeEmail: ChangeEmailRequestOnlyRegistered, database: Session = Depends(get_db, scope="function")):

    return change_email_service(changeEmail, database)

def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/resend-verification-code")
def resend_verification_code(
    data: ResendVerificationCodeRequest, request: Request, database: Session = Depends(get_db, scope="function")
):
    """Reenvía el código de verificación (registro de comprador o de empresa). 429 con Retry-After
    durante el cooldown de 60 s o al superar los topes de envío."""

    return resend_verification_code_service(data, database, _client_ip(request))

@router.post("/login-user")
def login_user(user: LoginRequest, database: Session = Depends(get_db, scope="function")):
    
    return login_service(user, database)


@router.post("/forgot-password-user")
def forgot_password(user: ForgotPasswordRequest, request: Request, database: Session = Depends(get_db, scope="function")):
    """Envía (o reenvía) el código de recuperación. Responde igual exista o no la cuenta; 429 con
    Retry-After durante el cooldown o al superar los topes de envío."""

    return forgot_password_service(user, database, _client_ip(request))

@router.post("/reset-password-user")
def reset_password(user: ResetPasswordRequest, database: Session = Depends(get_db, scope="function")):
 
    return reset_password_service(user, database)

@router.post("/refresh")
def refresh_token(data:RefreshRequest, database: Session = Depends(get_db, scope="function")):

    return refresh_token_service(data, database)


@router.get("/me")
def get_me(
    current: Annotated[
        AuthContext,
        Depends(require_role("admin", "owner", "company", "user", allow_unapproved_company=True)),
    ],
    database: Session = Depends(get_db, scope="function"),
):

    return get_me_profile_service(
        user_id=current.user_id,
        database=database
    )


@router.patch("/me")
def update_me(
    current: Annotated[
        AuthContext,
        Depends(require_role("admin", "owner", "company", "user", allow_unapproved_company=True)),
    ],
    data: UpdateMeRequest,
    database: Session = Depends(get_db, scope="function"),
):

    return update_me_profile_service(
        user_id=current.user_id,
        data=data,
        database=database,
    )


@router.patch("/me/photo")
def update_me_photo(
    current: Annotated[
        AuthContext,
        Depends(require_role("admin", "owner", "company", "user", allow_unapproved_company=True)),
    ],
    photo: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db, scope="function"),
):
    validate_upload(photo, IMAGE_EXTENSIONS, "Foto de perfil")

    return update_me_photo_service(
        user_id=current.user_id,
        photo=photo,
        nas=nas,
        database=database,
    )
