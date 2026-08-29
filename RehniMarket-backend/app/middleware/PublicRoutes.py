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
    "/docs",
    "/openapi.json",
    "/public/catalogs",
    "/public/colors",
    # "/public/catalogs/{catalog_id}/specifications" NO va aqui: esta lista
    # se compara con igualdad exacta de string contra request.url.path, y
    # esa ruta tiene un segmento dinamico (catalog_id) que nunca coincide
    # con el template sin sustituir. Su condicion de "publica" se maneja
    # aparte en AuthMiddleware.py (ver PUBLIC_CATALOG_SPECIFICATIONS_PREFIX).
    "/health/database",
    "/health/internet",
    "/admin/dashboard/recent-activities",
    "/admin/dashboard/recent-users",
    # Anuncios activos para el Hero del Home (ver ALCANCE > modulo de
    # anuncios). Ruta estatica, sin segmento dinamico.
    "/public/advertisements",
    # "Productos del dia": /public/products/daily es estatica y va aqui.
    # /public/products/{product_id} (detalle) tiene segmento dinamico y se
    # maneja igual que las especificaciones de catalogo, ver
    # PUBLIC_PRODUCT_DETAIL_PREFIX mas abajo.
    "/public/products/daily",
    # Catalogo publico completo con filtros (Categoria, Precio, Descuento,
    # Disponibilidad, Ordenamiento - ver ALCANCE > pagina Categorias).
    # Estatica ("/public/products", sin segmento dinamico) - no confundir
    # con PUBLIC_PRODUCT_DETAIL_PREFIX ("/public/products/", CON slash
    # final), que es para el detalle de un producto puntual.
    "/public/products",

]

# Ruta publica con segmento dinamico (catalog_id): GET
# /public/catalogs/{catalog_id}/specifications. No puede vivir en
# PUBLIC_ROUTES (esa lista solo soporta igualdad exacta de string).
# AuthMiddleware.py la deja pasar cuando el path empieza y termina asi.
PUBLIC_CATALOG_SPECIFICATIONS_PREFIX = "/public/catalogs/"
PUBLIC_CATALOG_SPECIFICATIONS_SUFFIX = "/specifications"

# Ruta publica con segmento dinamico (product_id): GET
# /public/products/{product_id} (detalle publico de producto, ver
# ALCANCE > "Productos del dia" > navegacion). "/public/products/daily" ya
# esta cubierta arriba por igualdad exacta y nunca llega a este prefijo.
PUBLIC_PRODUCT_DETAIL_PREFIX = "/public/products/"

# Rutas publicas con segmento dinamico (company_id): GET
# /public/company/{company_id} y /public/company/{company_id}/products
# (perfil publico de empresa, accesible desde el detalle de producto - ver
# "Vendido por" en ProductDetail.tsx). Mismo motivo que las de arriba: no
# pueden vivir en PUBLIC_ROUTES por el segmento dinamico.
PUBLIC_COMPANY_PROFILE_PREFIX = "/public/company/"