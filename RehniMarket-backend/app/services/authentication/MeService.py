import traceback

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.repository.UserRepository import get_by_id, get_by_email
from app.schemas.schemaAuth.SchemaLogin import MeProfileResponse, UpdateMeRequest
from app.core.Exceptions import api_error
from app.core.ErrorCodes import ErrorCodes
from app.services.NasService import build_media_url
from uuid import UUID


def _to_me_profile_response(user) -> MeProfileResponse:
    profile_image_url = (
        build_media_url(f"uploads/{user.profileImagen}")
        if user.profileImagen
        else None
    )

    return MeProfileResponse(
        email=user.email,
        name=user.fullName,
        role=user.role.name,
        tell=user.tell,
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

        if data.tell is not None:
            user.tell = data.tell

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
