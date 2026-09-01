from fastapi import HTTPException
from sqlalchemy.orm import Session
import traceback

from app.schemas.schemaAuth.SchemaToken import RefreshRequest, TokenResponse

from app.repository.UserRepository import get_by_id

from app.services.authentication.JWTService import (
    create_access_token,
    create_refresh_token,
    verify_token
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error


def refresh_token_service(data: RefreshRequest,database: Session):
    try:
        if not data.refresh_token:
            api_error(401,ErrorCodes.REFRESH_TOKEN_INVALID,"No se proporcionó un Refresh Token.")

        payload = verify_token(data.refresh_token)


        if payload is None:
            api_error(401,ErrorCodes.REFRESH_TOKEN_EXPIRED,"El Refresh Token ha expirado.")

        if payload.get("type") != "refresh":
            api_error(401,ErrorCodes.REFRESH_TOKEN_INVALID,"El token proporcionado no es un Refresh Token.")


        user = get_by_id(database,payload["sub"])

        if not user:
            api_error(404,ErrorCodes.USER_NOT_FOUND,"Usuario no encontrado.")

        if not user.isActive:
            api_error(403,ErrorCodes.USER_BLOCKED,"Tu cuenta se encuentra bloqueada. Contacta con un administrador.")

        if user.role and user.role.name == "company" and user.company and not user.company.CompanyStatus:
            api_error(
                403,
                ErrorCodes.COMPANY_SUSPENDED,
                "Tu empresa se encuentra suspendida.",
                extra={"reason": user.company.suspension_reason} if user.company.suspension_reason else None,
            )

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