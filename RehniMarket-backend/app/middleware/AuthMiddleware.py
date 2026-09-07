from fastapi import Request, HTTPException
from starlette.responses import JSONResponse

from app.services.authentication.JWTService import verify_token

from app.core.ErrorCodes import ErrorCodes

from app.middleware.PublicRoutes import (
    PUBLIC_ROUTES,
    PUBLIC_CATALOG_SPECIFICATIONS_PREFIX,
    PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX,
    PUBLIC_CATALOG_ATTRIBUTES_SUFFIX,
    PUBLIC_PRODUCT_DETAIL_PREFIX,
    PUBLIC_COMPANY_PROFILE_PREFIX,
)
from app.middleware.RolePermissions import (
    ROLES_PERMISSIONS_ROUTERS,
    FULL_ACCESS_ROLES,
    COMPANY_UNAPPROVED_ALLOWED_ROUTES,
)
from app.models.ModelCompany import CompanyCertificateEnum
from app.middleware.AuthUser import get_authenticated_user

from app.database.Connection import SessionLocal


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    if request.method == "OPTIONS":
        return await call_next(request)

    if path in PUBLIC_ROUTES:
        return await call_next(request)

    if path.startswith(PUBLIC_CATALOG_SPECIFICATIONS_PREFIX) and path.endswith(
        (PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX, PUBLIC_CATALOG_ATTRIBUTES_SUFFIX)
    ):
        return await call_next(request)

    if path.startswith(PUBLIC_PRODUCT_DETAIL_PREFIX):
        return await call_next(request)

    if path.startswith(PUBLIC_COMPANY_PROFILE_PREFIX):
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
        token_role = payload.get("role")

        if not user_id or not token_role:
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

            role = user.role.name if user.role else None

            if not role:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": {
                            "code": ErrorCodes.FORBIDDEN,
                            "message": "Rol inválido",
                        }
                    },
                )

            if role == "company" and user.company and not user.company.CompanyStatus:
                suspended_detail = {
                    "code": ErrorCodes.COMPANY_SUSPENDED,
                    "message": "Tu empresa se encuentra suspendida.",
                }

                if user.company.suspension_reason:
                    suspended_detail["reason"] = user.company.suspension_reason

                return JSONResponse(
                    status_code=403,
                    content={"detail": suspended_detail},
                )

            if (
                role == "company"
                and user.company
                and user.company.CompanyCertificateStatus
                != CompanyCertificateEnum.APPROVED
                and not any(
                    path.startswith(route)
                    for route in COMPANY_UNAPPROVED_ALLOWED_ROUTES
                )
            ):
                cert_status = user.company.CompanyCertificateStatus

                if cert_status == CompanyCertificateEnum.REJECTED:
                    unapproved_detail = {
                        "code": ErrorCodes.COMPANY_REJECTED,
                        "message": (
                            "Tu empresa fue rechazada. Revisa el motivo; para volver a "
                            "operar debe intervenir un administrador."
                        ),
                    }
                elif cert_status == CompanyCertificateEnum.NEEDS_UPDATE:
                    unapproved_detail = {
                        "code": ErrorCodes.COMPANY_CERTIFICATE_INVALID,
                        "message": (
                            "El certificado presentado no es válido. Actualízalo para "
                            "volver a revisión."
                        ),
                    }
                else:
                    unapproved_detail = {
                        "code": ErrorCodes.COMPANY_PENDING,
                        "message": "Tu empresa está en revisión.",
                    }

                if user.company.rejection_reason:
                    unapproved_detail["reason"] = user.company.rejection_reason

                return JSONResponse(
                    status_code=403,
                    content={"detail": unapproved_detail},
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

    except Exception:
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