# este codigo es creado para dar acceso a las rutas 
# esto sin necesitad de token de autenticacion,
# pero de igual manera se busca validar el token a la hora
# de proteger las demas rutas dependiendo del rol validando 
# en la base de datos si aquel token existe y corresponde a el usuario
from fastapi import Request
from starlette.responses import JSONResponse
from app.services.authentication.JWTService import verify_token
from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.utils.Response import json_response

PUBLIC_ROUTES = [
    "/auth/login-user",
    "/auth/login-company",
    "/auth/register-user",
    "/auth/register-company",
    "/auth/verify-email-user",
    "/auth/change-email",
    "/auth/forgot-password-user",
    "/auth/reset-password-user",
    "/auth/refresh",
    "/auth/logout",
    "/media/proxy",
    "/docs",
    "/openapi.json",
    "/media/proxy",
    "/public/catalogs",
    "/public/catalogs/{catalog_id}/specifications",
    "/health/database",
    "/health/internet",
    "/admin/dashboard/get-catalogs",
    "/admin/dashboard/created-catalogs",
    "/admin/dashboard/update-catalogs/",
    "/admin/dashboard/delete-catalogs/",
    "/admin/dashboard/get-colors",
    "/admin/dashboard/create-color",
    "/admin/dashboard/update-color/",
    "/admin/dashboard/delete-color/",
    "/admin/dashboard/get-colors"
]


ROLES_PERMISSIONS_ROUTERS = {

    "admin": [
        "",
        "/auth/me"
    ],

    "company": [
        "/company/dashboard/me",
        "/company/dashboard/my-profile",
        "/company/dashboard/upgrade-my-profile",
        "/company/dashboard/patch-media-logo-banner",
        "/company/dashboard/create-product",
        "/company/dashboard/get-my-products",
        "/company/dashboard/change-status-my-product/",
        "/company/dashboard/delete-my-product/",
        "/company/dashboard/update-my-product/",
        "/auth/me"
    ],

    "user": [
        "",
        "/auth/me"
    ]
    
}

async def auth_middleware(request: Request, call_next):

    print("PATH:", request.url.path)
    print("METHOD:", request.method)

    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    if path.startswith("/admin/"):
        return await call_next(request)
    
    if path in PUBLIC_ROUTES:
        return await call_next(request)
    
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return json_response(401, "Token requerido")
    
    parts = auth_header.split()

    if len(parts) !=2:
       return json_response(401, "Formato de autorizacion invalido")
    
    scheme, token = parts
    
    try:

        print("TOKEN RAW:", token)

        if scheme.lower() != "bearer":
            return json_response(401, "Formato de autorizacion invalido")

        payload =verify_token(token)

        if payload == "expired":
            return json_response(401, "Token expirado")

        if not isinstance(payload, dict):
            return json_response(401, "Token invalido")
        
        
        if payload.get("type") != "access":
            return json_response(401, "Access token requerido")
        
        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id or not role:
            return json_response(401, "No hay usuario o rol")
        
        request.state.user_id = user_id
        request.state.role = role

        if role not in ROLES_PERMISSIONS_ROUTERS:
            return json_response(401, "Rol invalido")

        if role == "admin":
            return await call_next(request)
        
        
        allowed_routers = ROLES_PERMISSIONS_ROUTERS[role]

        has_permission = any(
            path.startswith(route)
            for route in allowed_routers
        )

        if not has_permission:
            return json_response(401, "no tienes permiso para acceder a este recurso")
        
        
        return await call_next(request)
    
    except Exception as e:
        
        print("Auth Error", e)

        return json_response(401, "Token invalido")

    

