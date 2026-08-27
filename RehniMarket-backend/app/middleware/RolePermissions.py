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
        # Módulo de liquidaciones (ver ALCANCE > Módulo de liquidaciones,
        # Fase 7) - en la práctica nunca se evalúa (admin/owner bypasean
        # esta lista via FULL_ACCESS_ROLES), se deja por consistencia con
        # el resto de rutas admin documentadas acá.
        "/admin/payouts",
        # Centro único de gestión de reportes (ver ALCANCE > Reportes) -
        # mismo motivo que /admin/payouts arriba.
        "/admin/reports",
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
        # Módulo de liquidaciones (ver ALCANCE > Módulo de liquidaciones,
        # Fase 7) - en la práctica nunca se evalúa (admin/owner bypasean
        # esta lista via FULL_ACCESS_ROLES), se deja por consistencia con
        # el resto de rutas admin documentadas acá.
        "/admin/payouts",
        # Centro único de gestión de reportes (ver ALCANCE > Reportes) -
        # mismo motivo que /admin/payouts arriba.
        "/admin/reports",
        "/auth/me",
    ],

    "company": [
        "/company/dashboard/me",
        "/company/dashboard/my-profile",
        "/company/dashboard/upgrade-my-profile",
        "/company/dashboard/patch-media-logo-banner",
        "/company/dashboard/create-product",
        "/company/dashboard/products-summary",
        "/company/dashboard/get-my-products",
        "/company/dashboard/get-my-product/",
        "/company/dashboard/change-status-my-product/",
        "/company/dashboard/delete-my-product/",
        "/company/dashboard/update-my-product/",
        # Cubre todo el CRUD de variantes (variantes, imagenes y
        # especificaciones), ver app/routers/CompanyRouter.py: todas esas
        # rutas empiezan con este mismo prefijo.
        "/company/dashboard/products/",
        # Pedidos recibidos por la empresa (ver ALCANCE > Fase 5).
        "/company/dashboard/orders",
        # Módulo de liquidaciones: cuentas bancarias, liquidaciones y
        # balance propios (ver ALCANCE > Módulo de liquidaciones, Fase 1
        # y 6).
        "/company/bank-accounts",
        "/company/payouts",
        "/company/balance",
        "/auth/me",
    ],

    # Compras: unicamente USER puede comprar (ver ALCANCE > Restricciones
    # de compra). ADMIN/OWNER tienen bypass total via FULL_ACCESS_ROLES,
    # asi que ademas se revalida el rol dentro de cada servicio (ver
    # CartService._require_buyer y equivalentes) para que "solo user
    # puede comprar" se cumpla de verdad y no dependa solo de esta lista.
    # No se incluye "/wallet/recharge": ese endpoint es exclusivo de
    # ADMIN/OWNER (ver WalletRouter.py).
    "user": [
        "/auth/me",
        "/cart",
        "/checkout",
        "/orders",
        "/favorites",
        "/addresses",
        "/wallet/me",
        "/wallet/transactions",
        # Escribir/editar/eliminar reseñas propias (ver ALCANCE >
        # Calificaciones de empresa) - el listado publico de reseñas de
        # un producto vive en /public/products/{id}/reviews, no aca.
        "/reviews",
        # Reportar un producto o una empresa (ver ALCANCE > Reportes,
        # secciones 3 y 4) - la gestión de esos reportes es exclusiva de
        # ADMIN/OWNER (ver "/admin/reports" arriba), acá solo se permite
        # crearlos.
        "/reports",
    ],
}