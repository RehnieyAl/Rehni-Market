# Roles con bypass total en auth_middleware. OWNER hereda el acceso de ADMIN;
# sus capacidades exclusivas se protegen a nivel de servicio.
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
        "/admin/payouts",
        "/admin/reports",
        "/auth/me",
    ],

    # OWNER esta en FULL_ACCESS_ROLES; esta lista nunca se evalua para el.
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
        "/admin/payouts",
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
        # Cubre todo el CRUD de variantes (comparten este prefijo).
        "/company/dashboard/products/",
        "/company/dashboard/orders",
        "/company/bank-accounts",
        "/company/payouts",
        "/company/balance",
        "/auth/me",
    ],

    # Solo USER puede comprar; se revalida el rol en cada servicio.
    # "/wallet/recharge" no va aca: es exclusivo de ADMIN/OWNER.
    "user": [
        "/auth/me",
        "/cart",
        "/checkout",
        "/orders",
        "/favorites",
        "/addresses",
        "/wallet/me",
        "/wallet/transactions",
        "/reviews",
        "/reports",
    ],
}