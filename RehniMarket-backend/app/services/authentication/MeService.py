import traceback

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.repository.UserRepository import get_by_id, get_by_email
from app.schemas.schemaAuth.SchemaLogin import MeProfileResponse, UpdateMeRequest
from app.core.Exceptions import api_error
from app.core.ErrorCodes import ErrorCodes
from app.services.NasService import build_media_url
from uuid import UUID


# ==============================
# GET /auth/me
# ==============================
# Fuente única de verdad del perfil de la cuenta autenticada - la usan
# tanto el navbar público como el topbar/sidebar de cualquier dashboard
# (ver AuthProvider.tsx > refreshProfile). No depende del rol.

def _to_me_profile_response(user) -> MeProfileResponse:
    # profileImagen se guarda como object_name (sin el bucket "uploads/"
    # incluido) - mismo patron que CompanyLogo/CompanyBanner (ver
    # DashboardService/company/Dashboard.py).
    profile_image_url = (
        build_media_url(f"uploads/{user.profileImagen}")
        if user.profileImagen
        else None
    )

    return MeProfileResponse(
        email=user.email,
        name=user.fullName,
        role=user.role.name,
        profileImagen=profile_image_url,
    )


def get_me_profile_service(user_id: UUID, database: Session) -> MeProfileResponse:
    try:
        user = get_by_id(database, user_id)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        return _to_me_profile_response(user)

    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# PATCH /auth/me
# ==============================
# Actualiza nombre y/o correo de la propia cuenta autenticada. Funciona
# igual para cualquier rol - no vive bajo /company/dashboard (ver
# ALCANCE > "Configuración de cuenta" común a todos los roles).

def update_me_profile_service(
    user_id: UUID,
    data: UpdateMeRequest,
    database: Session,
) -> MeProfileResponse:

    try:
        user = get_by_id(database, user_id)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        if data.email is not None and data.email != user.email:
            existing = get_by_email(database, data.email)

            if existing:
                api_error(
                    409,
                    ErrorCodes.EMAIL_ALREADY_EXISTS,
                    "El correo electrónico ya está registrado.",
                )

            user.email = data.email

        if data.fullName is not None:
            user.fullName = data.fullName

        database.commit()
        database.refresh(user)

        return _to_me_profile_response(user)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


# ==============================
# PATCH /auth/me/photo
# ==============================
# Foto de perfil de la CUENTA (no confundir con el logo/banner de la
# empresa, que son datos públicos del perfil de EMPRESA - ver
# company_dasboard_upgrade_my_photo_and_banner_profile). Disponible para
# cualquier rol autenticado.

def update_me_photo_service(
    user_id: UUID,
    photo: UploadFile,
    nas,
    database: Session,
) -> MeProfileResponse:

    try:
        user = get_by_id(database, user_id)

        if not user:
            api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

        result = nas.upload_file(photo, f"users/{user.id}/profile/")

        if not result or not result.get("success"):
            api_error(500, ErrorCodes.FILE_UPLOAD_FAILED, "No se pudo subir la imagen.")

        user.profileImagen = result["object_name"]

        database.commit()
        database.refresh(user)

        return _to_me_profile_response(user)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
