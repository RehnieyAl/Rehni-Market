# Roles que tienen acceso total (bypass) en el auth_middleware, es decir,
# no se filtran por ROLES_PERMISSIONS_ROUTERS. OWNER hereda exactamente
# el mismo acceso que ADMIN; sus capacidades EXCLUSIVAS (gestionar cuentas
# admin/owner) se protegen aparte, a nivel de servicio, no aqui.
FULL_ACCESS_ROLES = {"admin", "owner"}

ROLES_PERMISSIONS_ROUTERS = {
    "admin": [
        "/admin/dashboard/statistics",
        "/admin/dashboard/recent-activities",
        "/admin/dashboard/recent-users",
        "/admin/dashboard/get-companies",
        "/admin/dashboard/get-company/",
        "/admin/dashboard/companies/certificate/status/",
        "/admin/dashboard/company/status/",
        "/admin/dashboard/get-users",
        "/admin/dashboard/user/update-information/",
        "/admin/dashboard/user/update-information/status/",
        "/admin/dashboard/user/delete/",
        "/auth/me",
    ],

    # OWNER esta en FULL_ACCESS_ROLES, por lo que en la practica nunca se
    # evalua esta lista para el (el middleware hace bypass antes de
    # llegar aqui). Se deja como copia de la lista de admin unicamente
    # para que el rol siga siendo una clave valida en este diccionario.
    "owner": [
        "/admin/dashboard/statistics",
        "/admin/dashboard/recent-activities",
        "/admin/dashboard/recent-users",
        "/admin/dashboard/get-companies",
        "/admin/dashboard/get-company/",
        "/admin/dashboard/companies/certificate/status/",
        "/admin/dashboard/company/status/",
        "/admin/dashboard/get-users",
        "/admin/dashboard/user/update-information/",
        "/admin/dashboard/user/update-information/status/",
        "/admin/dashboard/user/delete/",
        "/auth/me",
    ],

    "company": [
        "/company/dashboard/me",
        "/company/dashboard/my-profile",
        "/company/dashboard/upgrade-my-profile",
        "/company/dashboard/patch-media-logo-banner",
        "/company/dashboard/create-product",
        "/company/dashboard/get-my-products",
        "/company/dashboard/get-my-product/",
        "/company/dashboard/change-status-my-product/",
        "/company/dashboard/delete-my-product/",
        "/company/dashboard/update-my-product/",
        # Cubre todo el CRUD de variantes (variantes, imagenes y
        # especificaciones), ver app/routers/CompanyRouter.py: todas esas
        # rutas empiezan con este mismo prefijo.
        "/company/dashboard/products/",
        "/auth/me",
    ],

    "user": [
        "/auth/me",
    ],
}