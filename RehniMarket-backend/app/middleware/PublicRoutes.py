from app.Config import config

PUBLIC_ROUTES = [
    "/auth/login-user",
    "/auth/login-company",
    "/auth/register-user",
    "/auth/register-company",
    "/auth/verify-email-user",
    "/auth/change-email",
    "/auth/resend-verification-code",
    "/auth/forgot-password-user",
    "/auth/reset-password-user",
    "/auth/refresh",
    "/auth/logout",
    "/media/proxy",
    "/company/certificate/update",
    "/public/catalogs",
    "/public/colors",
    "/health/database",
    "/health/internet",
    "/public/advertisements",
    "/public/products/daily",
    "/public/products/offers",
    "/public/products/new",
    "/public/products"
]

PUBLIC_CATALOG_SPECIFICATIONS_PREFIX = "/public/catalogs/"
PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX = "/specifications"

PUBLIC_CATALOG_ATTRIBUTES_SUFFIX = "/attributes"

PUBLIC_PRODUCT_DETAIL_PREFIX = "/public/products/"

PUBLIC_COMPANY_PROFILE_PREFIX = "/public/company/"

# Swagger y ReDoc: públicos solo si DOCS_ENABLED (en producción, false).
DOCS_ROUTES = ["/docs", "/docs/oauth2-redirect", "/redoc", "/openapi.json"]

if config.DOCS_ENABLED:
    PUBLIC_ROUTES.extend(DOCS_ROUTES)
