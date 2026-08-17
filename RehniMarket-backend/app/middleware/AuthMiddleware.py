from fastapi import Request, HTTPException
from starlette.responses import JSONResponse

from app.services.authentication.JWTService import verify_token

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.middleware.PublicRoutes import (
    PUBLIC_ROUTES,
    PUBLIC_CATALOG_SPECIFICATIONS_PREFIX,
    PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX,
    PUBLIC_PRODUCT_DETAIL_PREFIX,
    PUBLIC_COMPANY_PROFILE_PREFIX,
)
from app.middleware.RolePermissions import ROLES_PERMISSIONS_ROUTERS, FULL_ACCESS_ROLES
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

    if (
        path.startswith(PUBLIC_CATALOG_SPECIFICATIONS_PREFIX)
        and path.endswith(PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX)
    ):
        print("PUBLIC ROUTE (catalog specifications):", path)
        return await call_next(request)

    # /public/products/{product_id} (detalle publico). "/public/products/daily"
    # ya coincidio arriba por igualdad exacta y nunca llega aqui.
    if path.startswith(PUBLIC_PRODUCT_DETAIL_PREFIX):
        print("PUBLIC ROUTE (product detail):", path)
        return await call_next(request)

    # /public/company/{company_id} y /public/company/{company_id}/products
    # (perfil publico de empresa).
    if path.startswith(PUBLIC_COMPANY_PROFILE_PREFIX):
        print("PUBLIC ROUTE (company profile):", path)
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

            if role not in FULL_ACCESS_ROLES:
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
    
    return await call_next(request)