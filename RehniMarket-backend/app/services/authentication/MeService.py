import traceback

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repository.UserRepository import get_by_id
from app.schemas.schemaAuth.SchemaLogin import MeProfileResponse
from app.core.Exceptions import api_error
from app.core.ErrorCodes import ErrorCodes
from uuid import UUID

def get_me_profile_service(user_id: UUID,database: Session):
    try:
        user = get_by_id(database,user_id)

        if not user:
            api_error(404,ErrorCodes.USER_NOT_FOUND,"Usuario no encontrado.")

        return MeProfileResponse(
            email=user.email,
            name=user.fullName,
            role=user.role.name
        )

    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        api_error(500,ErrorCodes.INTERNAL_SERVER_ERROR,"Error interno del servidor.")