FULL_ACCESS_ROLES = {"admin", "owner"}

# Empresa con certificado PENDING / REJECTED / NEEDS_UPDATE: solo puede ver su propio
# estado y, si está en NEEDS_UPDATE, reemplazar el certificado (el endpoint 409ea para
# PENDING/APPROVED/REJECTED). El resto del panel (productos, pedidos, finanzas...) exige
# CompanyCertificateStatus == APPROVED.
COMPANY_UNAPPROVED_ALLOWED_ROUTES = {
    "/auth/me",
    "/company/dashboard/me",
    "/company/dashboard/my-profile",
    "/company/certificate",
}

ROLES_PERMISSIONS_ROUTERS = {
    "admin": [
        "/admin/dashboard/statistics",
        "/admin/dashboard/recent-activities",
        "/admin/dashboard/recent-users",
        "/admin/dashboard/catalogs/",
        "/admin/dashboard/catalog-attributes",
        "/admin/dashboard/catalog-attribute-options",
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

    "owner": [
        "/admin/dashboard/statistics",
        "/admin/dashboard/recent-activities",
        "/admin/dashboard/recent-users",
        "/admin/dashboard/catalogs/",
        "/admin/dashboard/catalog-attributes",
        "/admin/dashboard/catalog-attribute-options",
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
        "/company/certificate",
        "/company/dashboard/create-product",
        "/company/dashboard/products-summary",
        "/company/dashboard/get-my-products",
        "/company/dashboard/get-my-product/",
        "/company/dashboard/change-status-my-product/",
        "/company/dashboard/delete-my-product/",
        "/company/dashboard/update-my-product/",
        "/company/dashboard/products/",
        "/company/dashboard/orders",
        "/company/dashboard/returns",
        "/company/dashboard/shipping-carriers",
        "/company/bank-accounts",
        "/company/payouts",
        "/company/balance",
        "/auth/me",
    ],

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