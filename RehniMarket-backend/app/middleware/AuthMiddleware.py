from fastapi import Request, HTTPException
from starlette.responses import JSONResponse

from app.services.authentication.JWTService import verify_token

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.middleware.PublicRoutes import PUBLIC_ROUTES
from app.middleware.RolePermissions import ROLES_PERMISSIONS_ROUTERS
from app.middleware.AuthUser import get_authenticated_user

from app.database.Connection import SessionLocal


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    print("PATH:", path)

    if request.method == "OPTIONS":
        return await call_next(request)

    if path in PUBLIC_ROUTES:
        print("PUBLIC ROUTE:", path)
        return await call_next(request)

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return JSONResponse(
            status_code=401,
            content={
                "detail": {
                    "code": ErrorCodes.UNAUTHORIZED,
                    "message": "Token requerido",
                }
            },
        )

    parts = auth_header.split()

    if len(parts) != 2:
        return JSONResponse(
            status_code=401,
            content={
                "detail": {
                    "code": ErrorCodes.INVALID_TOKEN,
                    "message": "Formato de autorización inválido",
                }
            },
        )

    scheme, token = parts

    if scheme.lower() != "bearer":
        return JSONResponse(
            status_code=401,
            content={
                "detail": {
                    "code": ErrorCodes.INVALID_TOKEN,
                    "message": "Formato de autorización inválido",
                }
            },
        )

    try:
        payload = verify_token(token)

        if payload == "expired":
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "code": ErrorCodes.TOKEN_EXPIRED,
                        "message": "Token expirado",
                    }
                },
            )

        if not isinstance(payload, dict):
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "code": ErrorCodes.INVALID_TOKEN,
                        "message": "Token inválido",
                    }
                },
            )

        if payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "code": ErrorCodes.INVALID_TOKEN,
                        "message": "Access token requerido",
                    }
                },
            )

        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id or not role:
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "code": ErrorCodes.INVALID_TOKEN,
                        "message": "No hay usuario o rol en el token",
                    }
                },
            )

        database = SessionLocal()

        try:
            user = get_authenticated_user(
                database,
                user_id,
            )

            if not user:
                return JSONResponse(
                    status_code=401,
                    content={
                        "detail": {
                            "code": ErrorCodes.INVALID_TOKEN,
                            "message": "Usuario no encontrado",
                        }
                    },
                )

            if not user.isActive:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": {
                            "code": ErrorCodes.USER_BLOCKED,
                            "message": "Tu cuenta se encuentra bloqueada.",
                        }
                    },
                )

            if role not in ROLES_PERMISSIONS_ROUTERS:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": {
                            "code": ErrorCodes.FORBIDDEN,
                            "message": "Rol inválido",
                        }
                    },
                )

            request.state.user_id = user_id
            request.state.role = role
            request.state.user = user

            if role == "admin":
                return await call_next(request)

            allowed_routes = ROLES_PERMISSIONS_ROUTERS[role]

            has_permission = any(
                path.startswith(route)
                for route in allowed_routes
            )

            if not has_permission:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": {
                            "code": ErrorCodes.FORBIDDEN,
                            "message": "No tienes permiso para acceder a este recurso",
                        }
                    },
                )

            return await call_next(request)

        finally:
            database.close()

    except HTTPException:
        raise

    except Exception as error:
        print("Auth Error:", error)

        return JSONResponse(
            status_code=401,
            content={
                "detail": {
                    "code": ErrorCodes.INVALID_TOKEN,
                    "message": "Token inválido",
                }
            },
        )