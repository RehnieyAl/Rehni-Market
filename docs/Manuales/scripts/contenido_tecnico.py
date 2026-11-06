"""Contenido del Manual técnico de RehniMarket.

Las secciones generadas desde el sistema (diccionario de datos, endpoints y
catálogo de errores) las arma generar_manuales.py con los JSON de datos/.
"""

from datos_comunes import SOPORTE


def P(t): return ("p", t)
def SUB(t): return ("sub", t)
def PASO(n, titulo, texto=""): return ("paso", n, titulo, texto)
def UL(*items): return ("ul", list(items))
def OL(*items): return ("ol", list(items))
def CODE(t): return ("code", t)
def NOTA(t): return ("nota", t)
def TABLA(enc, filas, anchos=None): return ("tabla", enc, filas, anchos)
def IMG(ruta, titulo): return ("img", ruta, titulo)
def CAP(pantalla, estado, archivo, titulo): return ("captura", pantalla, estado, archivo, titulo)
def REF(t): return ("ref", t)


INTRO = [
    P("Este manual va dirigido al área de soporte técnico y a quienes mantienen la aplicación. Sigue la "
      "estructura de la guía FAVA-SENA «Manuales técnicos de la aplicación». Todas las rutas de archivos se "
      "escriben completas desde la raíz del repositorio."),
]

# RF: (ID, nombre, descripción, rol)
REQUISITOS = [
    ("RF-01", "Registrar comprador", "Crear una cuenta con nombre, teléfono, correo y contraseña, validados en el "
     "cliente y en el servidor (POST /auth/register-user).", "Visitante"),
    ("RF-02", "Registrar empresa", "Crear la cuenta del representante y la empresa con NIT, DV calculado y "
     "certificado de Cámara de Comercio en PDF (POST /auth/register-company).", "Visitante"),
    ("RF-03", "Verificar correo", "Enviar un código de 6 dígitos que vence a los 5 minutos, con reenvío a los 60 s "
     "y un solo código activo (POST /auth/verify-email-user, /auth/resend-verification-code).", "Visitante"),
    ("RF-04", "Iniciar sesión", "Validar credenciales, estado de la cuenta y de la empresa, y emitir access token "
     "(30 min) y refresh token (15 días) (POST /auth/login-user, /auth/refresh).", "Todos"),
    ("RF-05", "Recuperar contraseña", "Enviar un código que vence a los 15 minutos y reemplazar la contraseña "
     "(POST /auth/forgot-password-user, /auth/reset-password-user).", "Todos"),
    ("RF-06", "Configurar la cuenta", "Consultar y editar nombre, teléfono, foto y correo de la cuenta propia "
     "(GET/PATCH /auth/me, /auth/me/photo, /auth/change-email).", "Autenticado"),
    ("RF-07", "Consultar el catálogo", "Listar productos con búsqueda tolerante a errores, filtros de categoría, "
     "precio, descuento y disponibilidad, y ordenamiento (GET /public/products).", "Público"),
    ("RF-08", "Consultar ofertas y novedades", "Listar productos con descuento vigente en alguna variante y los "
     "más recientes (GET /public/products/offers, /public/products/new).", "Público"),
    ("RF-09", "Consultar detalle y perfil", "Mostrar detalle, variantes, reseñas y perfil público de la empresa "
     "con su calificación (GET /public/products/{id}, /public/company/{id}).", "Público"),
    ("RF-10", "Mostrar anuncios", "Mostrar el carrusel de inicio con destino calculado según el tipo de anuncio "
     "(GET /public/advertisements).", "Público"),
    ("RF-11", "Gestionar carrito", "Agregar, actualizar, eliminar y vaciar ítems validando variante y stock "
     "(/cart).", "Comprador"),
    ("RF-12", "Confirmar compra", "Validar stock y saldo, cobrar en RehniCoin, calcular IVA del 19 % y crear un "
     "pedido por empresa (POST /checkout).", "Comprador"),
    ("RF-13", "Consultar y cancelar pedidos", "Listar pedidos, ver detalle y cancelar en PENDING o PAID con "
     "reembolso idempotente y reposición de stock (/orders).", "Comprador"),
    ("RF-14", "Solicitar devolución", "Solicitar la devolución de un ítem de un pedido entregado con motivo de 5 "
     "a 500 caracteres (POST /orders/{id}/returns).", "Comprador"),
    ("RF-15", "Gestionar direcciones", "Crear, editar, eliminar y marcar la dirección predeterminada "
     "(/addresses).", "Comprador"),
    ("RF-16", "Gestionar favoritos", "Agregar y quitar productos favoritos (/favorites).", "Comprador"),
    ("RF-17", "Consultar billetera", "Consultar saldo y movimientos de RehniCoin (GET /wallet/me, "
     "/wallet/transactions).", "Comprador"),
    ("RF-18", "Reseñar productos", "Crear, editar y eliminar una reseña por producto entregado (/reviews).",
     "Comprador"),
    ("RF-19", "Reportar", "Reportar un producto o una empresa con hasta 5 imágenes de evidencia (POST /reports).",
     "Comprador"),
    ("RF-20", "Panel Inicio de empresa", "Mostrar estado de verificación, datos de la tienda e indicadores de "
     "productos (GET /company/dashboard/me, /products-summary).", "Empresa"),
    ("RF-21", "Gestionar productos y variantes", "Crear, editar, activar, desactivar y eliminar productos; "
     "generar variantes por combinación de ejes; gestionar imágenes, atributos y descuentos "
     "(/company/dashboard/products/...).", "Empresa"),
    ("RF-22", "Gestionar pedidos de la empresa", "Listar por estado, registrar transportadora y guía, y avanzar "
     "PAID → PROCESSING → SHIPPED → DELIVERED (/company/dashboard/orders).", "Empresa"),
    ("RF-23", "Resolver devoluciones", "Aprobar con reembolso en RehniCoin o rechazar con motivo obligatorio "
     "(/company/dashboard/returns).", "Empresa"),
    ("RF-24", "Gestionar finanzas", "Consultar balance y liquidaciones, y gestionar cuentas bancarias "
     "(/company/balance, /company/payouts, /company/bank-accounts).", "Empresa"),
    ("RF-25", "Actualizar certificado", "Reemplazar el certificado marcado como inválido con sesión o con correo "
     "y contraseña (PUT /company/certificate, POST /company/certificate/update).", "Empresa"),
    ("RF-26", "Panel Inicio administrativo", "Mostrar estadísticas de usuarios y empresas, usuarios recientes y "
     "actividad reciente (/admin/dashboard/statistics, /recent-users, /recent-activities).", "Administrador"),
    ("RF-27", "Verificar y suspender empresas", "Aprobar, rechazar o pedir actualización del certificado con "
     "motivo, y suspender empresas cancelando sus pedidos activos (/admin/dashboard/companies...).",
     "Administrador"),
    ("RF-28", "Gestionar usuarios", "Consultar, editar, cambiar rol, bloquear y desbloquear cuentas; solo el "
     "propietario gestiona cuentas owner (/admin/dashboard/user/...).", "Administrador"),
    ("RF-29", "Gestionar catálogo", "Administrar categorías, atributos, valores, colores y especificaciones "
     "(/admin/dashboard/catalogs, /catalog-attributes).", "Administrador"),
    ("RF-30", "Gestionar anuncios", "Crear anuncios visuales con imagen web y móvil y tipo de destino "
     "(/admin/dashboard/create-advertisement...).", "Administrador"),
    ("RF-31", "Gestionar transportadoras", "Crear, editar y activar transportadoras con URL de seguimiento "
     "(/admin/dashboard/shipping-carriers).", "Administrador"),
    ("RF-32", "Atender reportes", "Revisar, resolver o rechazar reportes con respuesta administrativa "
     "(/admin/reports).", "Administrador"),
    ("RF-33", "Recargar y corregir RehniCoin", "Recargar saldo por correo (máximo 10.000.000 RC) y corregir una "
     "recarga una sola vez sin saldo negativo (/admin/wallet).", "Administrador"),
    ("RF-34", "Gestionar liquidaciones", "Previsualizar, generar y pagar liquidaciones mensuales con comisión del "
     "5 % sobre pedidos entregados, con filtros por estado (/admin/payouts).", "Propietario"),
    ("RF-35", "Servir archivos", "Entregar imágenes y certificados de MinIO por el proxy del backend "
     "(GET /media/proxy).", "Público"),
    ("RF-36", "Verificar salud", "Comprobar la conexión a la base de datos y a internet (GET /health/database, "
     "/health/internet).", "Público"),
]

SECCIONES_INICIO = [
    (1, "1", "Alcance", [
        P("En este manual se describen los detalles técnicos de RehniMarket, que permiten al personal técnico "
          "suministrar soporte y mantener la aplicación. Corresponde a la API versión 2.6.0 y a la revisión de "
          "base de datos c3e5a7f9d1b2."),
        SUB("Objetivo general"),
        P("Proveer un marketplace multiempresa con pago interno en RehniCoin, accesible por web y móvil, "
          "desplegado con HTTPS en un servidor propio."),
        SUB("Objetivos específicos"),
        OL("Gestionar usuarios, roles, sesiones y verificación de empresas.",
           "Publicar productos con variantes, atributos por categoría, descuentos e IVA.",
           "Procesar compras, pedidos, envíos, cancelaciones y devoluciones.",
           "Administrar la billetera RehniCoin, las recargas y las liquidaciones.",
           "Moderar la plataforma con reportes, anuncios y catálogo.",
           "Desplegar la plataforma con Docker Compose y Caddy en Oracle Cloud (Ampere A1) con certificados "
           "de Let's Encrypt."),
        SUB("Hosting"),
        P(f"La plataforma se aloja en una máquina virtual de Oracle Cloud Infrastructure, forma VM.Standard.A1.Flex "
          f"(ARM64, Ampere A1) con Ubuntu 24.04, dentro del nivel gratuito Always Free. El frontend se publica en "
          f"{SOPORTE['url_produccion']} y la API en {SOPORTE['url_api_produccion']}. El procedimiento completo está "
          f"en el numeral 6.9."),
        SUB("Qué NO cubre este documento"),
        UL("El uso funcional de la aplicación por perfil: se describe en el Manual de usuario.",
           "La compra y administración del dominio, ni la configuración de la cuenta de Oracle Cloud más allá de "
           "lo necesario para el despliegue.",
           "La configuración de proveedores externos de correo (Google Workspace, Brevo u otros) más allá de las "
           "variables SMTP de RehniMarket.",
           "La publicación de la aplicación móvil en Google Play o App Store.",
           "El detalle de las pruebas y su informe de resultados, que se documentan en docs/pruebas/.",
           "El plan de implantación (capacitación, cronograma y migración), que se documenta en "
           "«docs/plan de implantacion - Rehnimarket/»."),
    ]),
    (1, "2", "Descripción de procesos", [
        P("El sistema soporta los siguientes procesos de negocio:"),
        TABLA(["Proceso", "Descripción", "Actores"], [
            ["Registro y acceso", "Registro, verificación por correo, inicio de sesión, renovación de sesión y "
             "recuperación", "Todos"],
            ["Verificación de empresas", "Carga y revisión del certificado de Cámara de Comercio", "Empresa, "
             "administrador"],
            ["Publicación", "Productos, variantes, atributos, descuentos e IVA", "Empresa"],
            ["Compra", "Carrito, checkout con validación de stock y saldo, y creación de pedidos por empresa",
             "Comprador"],
            ["Cumplimiento", "Pendiente o pagado → en proceso → enviado → entregado", "Empresa"],
            ["Posventa", "Cancelación con reembolso, devoluciones por ítem, reseñas y reportes",
             "Comprador, empresa, administrador"],
            ["Billetera", "Recarga manual, corrección y reembolsos", "Comprador, administrador"],
            ["Liquidación", "Generación mensual sobre pedidos entregados, comisión del 5 % y pago",
             "Propietario, empresa"],
        ], [3.2, 6.0, 2.6]),
        P("La navegación de cada perfil se representa en el Manual de usuario (numeral 6, «Mapa de navegación»)."),
    ]),
    (2, "2.1", "Requisitos funcionales", [
        P("Los requisitos funcionales se obtuvieron del código del backend (routers, servicios y permisos de "
          "RehniMarket-backend/app/middleware/RolePermissions.py) y de las pantallas del frontend."),
        P(f"Se identificaron {len(REQUISITOS)} requisitos funcionales, que se relacionan en la tabla siguiente."),
        ("ancha", "Tabla de requisitos funcionales", ["ID", "Nombre", "Descripción", "Rol"],
         [list(r) for r in REQUISITOS], [1.6, 3.2, 9.4, 2.3]),
    ]),
    (1, "3", "Diagramas UML", [
        P("Los diagramas se mantienen en Mermaid en docs/Manuales/diagramas/ y se exportan a PNG en "
          "docs/Manuales/diagramas/png/ con docs/Manuales/scripts/exportar_diagramas.sh."),
    ]),
    (2, "3.1", "Diagramas de casos de uso", [
        P("Se presenta un diagrama por perfil. El propietario hereda los casos de uso del administrador."),
        IMG("diagramas/png/casos-de-uso-comprador.png", "Casos de uso del visitante y el comprador"),
        IMG("diagramas/png/casos-de-uso-empresa.png", "Casos de uso de la empresa"),
        IMG("diagramas/png/casos-de-uso-administrador.png", "Casos de uso del administrador y el propietario"),
    ]),
    (2, "3.2", "Diagrama de clases", [
        P("Generado desde los modelos SQLAlchemy de RehniMarket-backend/app/models/."),
        IMG("diagramas/png/clases.png", "Diagrama de clases"),
    ]),
    (2, "3.3", "Diagramas de secuencia", [
        IMG("diagramas/png/secuencia-login.png", "Secuencia del inicio de sesión"),
        IMG("diagramas/png/secuencia-compra.png", "Secuencia del proceso de compra"),
    ]),
    (2, "3.4", "Diagrama de arquitectura", [
        P("Caddy es el único punto de entrada: sirve el frontend en <dominio> y hace de proxy inverso de la API "
          "en api.<dominio>, los dos con HTTPS. El backend usa PgBouncer para el tráfico normal y conexión "
          "directa a PostgreSQL para las migraciones, guarda archivos en MinIO y envía correos por un servidor "
          "SMTP configurable."),
        IMG("diagramas/png/arquitectura.png", "Arquitectura del sistema"),
    ]),
    (1, "4", "Administración de usuarios", [
        SUB("Creación, modificación y retiro de usuarios"),
        OL("Compradores y empresas se crean por autorregistro. El correo debe verificarse.",
           "La cuenta propietario (owner) se crea con el seed usando USER_NAME_OWNER, OWNER_DEFAULT y "
           "OWNER_PASSWORD_DEFAULT (RUN_SEED=true, una sola vez).",
           "Un administrador se obtiene cambiando el rol de una cuenta desde «Usuarios» con una cuenta "
           "propietario.",
           "Las cuentas se modifican en el panel, opción «Usuarios», y en "
           "PATCH /admin/dashboard/user/update-information/{user_id}.",
           "El retiro se realiza bloqueando la cuenta (users.isActive en falso). No existe un endpoint para "
           "eliminar usuarios.",
           "Una empresa se suspende con company.CompanyStatus en falso; sus pedidos activos se cancelan y "
           "reembolsan."),
        SUB("Aprobación de vendedores"),
        OL("La empresa se registra con su certificado; queda en CompanyCertificateStatus = PENDING.",
           "Mientras no esté en APPROVED, el middleware solo le permite /auth/me, /company/dashboard/me, "
           "/company/dashboard/my-profile y /company/certificate (COMPANY_UNAPPROVED_ALLOWED_ROUTES).",
           "El administrador revisa el PDF en «Empresas» y lo deja en APPROVED, REJECTED (con motivo) o "
           "NEEDS_UPDATE (certificado inválido, con motivo).",
           "Con NEEDS_UPDATE la empresa sube otro PDF y vuelve a PENDING. Con REJECTED solo un administrador "
           "puede intervenir.",
           "Cada decisión queda en admin_activities y se notifica por correo."),
        SUB("Roles y perfiles"),
        P("Los roles se insertan con el seed. No existe una interfaz para crear roles."),
        TABLA(["Rol", "Permisos"], [
            ["user", "Carrito, checkout, pedidos, favoritos, direcciones, billetera, reseñas y reportes."],
            ["company", "Panel de empresa. Sin certificado aprobado solo accede a /auth/me, "
             "/company/dashboard/me, /company/dashboard/my-profile y /company/certificate."],
            ["admin", "Panel administrativo (FULL_ACCESS_ROLES en el middleware), salvo liquidaciones."],
            ["owner", "Subperfil del administrador: lo mismo que admin, más liquidaciones y gestión de "
             "cuentas owner."],
        ], [2.2, 9.6]),
        P("Las reglas están en RehniMarket-backend/app/middleware/RolePermissions.py y "
          "RehniMarket-backend/app/middleware/AuthMiddleware.py; el rol se lee de la base de datos en cada "
          "petición, no del token. La autenticación usa JWT HS256 con access token y refresh token, y las "
          "contraseñas se cifran con bcrypt. En el frontend, /auth/me es la única fuente del rol y las rutas se "
          "protegen con RequireAuth (RehniMarket-frontend/src/routers/AppRouter.tsx)."),
        CAP("Panel administrativo, opción Usuarios", "con la lista de cuentas, roles y acciones",
            "t-admin-usuarios.png", "Administración de usuarios"),
    ]),
]

STACK = [
    ["Backend", "Python", "3.13 (imagen python:3.13-slim)"],
    ["Backend", "FastAPI / Uvicorn", "0.135.1 / 0.41.0"],
    ["Backend", "SQLAlchemy / Alembic", "2.0.48 / 1.18.4"],
    ["Backend", "Pydantic / pydantic-settings", "2.12.5 / 2.14.2"],
    ["Backend", "python-jose / passlib / bcrypt", "3.5.0 / 1.7.4 / 3.2.2"],
    ["Backend", "psycopg2-binary / Cliente MinIO", "2.9.11 / 7.2.20"],
    ["Backend", "uv (gestor de dependencias)", "uv.lock versionado"],
    ["Backend (pruebas)", "pytest / pytest-cov / ruff", ">=8.3.0 / >=6.0.0 / 0.17.3"],
    ["Web", "React / React DOM", "^19.2.7"],
    ["Web", "TypeScript / Vite", "~6.0.2 / ^8.1.0"],
    ["Web", "React Router / Tailwind CSS", "^7.18.3 / ^4.3.2"],
    ["Web", "Axios / Zod", "^1.20.0 / ^4.6.7"],
    ["Web (pruebas)", "Vitest / Testing Library", "^4.1.11 / ^16.3.3"],
    ["Web", "pnpm", "11.15.0"],
    ["Móvil", "Expo / Expo Router", "^54.0.1 / ~6.0.0"],
    ["Móvil", "React Native / React", "0.81.5 / 19.1.0"],
    ["Móvil", "Axios / expo-secure-store", "^1.19.0 / ^15.0.8"],
    ["Móvil (pruebas)", "Jest / jest-expo", "^29.2.1 / ~54.0.10"],
    ["Infraestructura", "PostgreSQL", "postgres:17-alpine"],
    ["Infraestructura", "PgBouncer", "edoburu/pgbouncer:latest"],
    ["Infraestructura", "MinIO", "cgr.dev/chainguard/minio fijada por digest (RELEASE.2026-10-23T20-06-51Z)"],
    ["Infraestructura", "Caddy", "caddy:2.11-alpine"],
    ["Infraestructura", "Node.js (build del frontend)", "node:22-alpine"],
]

SERVICIOS = [
    ["frontend (rehni-frontend)", "Caddy 2.11 con el build de React en /srv; proxy de la API. IP fija "
     "172.30.0.10", "80, 443 y 443/udp", "128 MB / 0,5 CPU"],
    ["backend (rehni-backend)", "FastAPI con Uvicorn (3 workers); aplica alembic upgrade head al iniciar",
     "127.0.0.1:8000 (BACKEND_BIND)", "1 GB / 4 CPU"],
    ["pgbouncer (pgbouncer_pool)", "Pool de conexiones en modo transaction", "Solo red interna (6432)",
     "128 MB / 1 CPU"],
    ["postgres (rehni-postgres)", "PostgreSQL 17", "127.0.0.1:5433 (POSTGRES_PORT)", "768 MB / 3 CPU"],
    ["minio (rehni-minio)", "Almacenamiento de objetos, bucket uploads", "Solo red interna (9000)",
     "256 MB / 0,5 CPU"],
    ["postgres-test (perfil test)", "PostgreSQL desechable en tmpfs para pytest", "127.0.0.1:55433", "—"],
]

VARIABLES = [
    # (variable, archivo, descripción, ejemplo)
    ["SITE_ADDRESS / API_ADDRESS", ".env (raíz)", "Dominios del frontend y de la API en Caddy",
     "localhost / api.localhost; producción <dominio> / api.<dominio>"],
    ["HTTP_PORT / HTTPS_PORT", ".env (raíz)", "Puertos de Caddy en el host (mismo puerto dentro y fuera)",
     "80 / 443"],
    ["CADDY_LOCAL_CERTS", ".env (raíz)", "local_certs fuerza la CA local de Caddy con nombres que no son "
     "localhost; vacía en producción (Let's Encrypt)", "local_certs"],
    ["VITE_API_URL", ".env (raíz) y RehniMarket-frontend/.env", "URL de la API; se graba en el build",
     "https://api.localhost"],
    ["VITE_REHNIMARKET_WHATSAPP", ".env (raíz) y RehniMarket-frontend/.env", "WhatsApp de recargas (web)",
     "+57…"],
    ["CORS_EXTRA_ORIGINS", ".env (raíz)", "Orígenes del frontend permitidos por CORS, separados por coma",
     "https://rehnimarket"],
    ["DOCS_ENABLED", ".env (raíz)", "Activa Swagger (/docs), ReDoc y /openapi.json", "false"],
    ["BACKEND_BIND / BACKEND_PORT", ".env (raíz)", "Interfaz y puerto de la API directa sin Caddy",
     "127.0.0.1 / 8000 (0.0.0.0 para la app móvil en la red local)"],
    ["POSTGRES_PORT", ".env (raíz)", "Puerto de PostgreSQL en 127.0.0.1 del host", "5433"],
    ["UVICORN_WORKERS", ".env (raíz)", "Procesos de Uvicorn (1 a 16)", "3"],
    ["FORWARDED_ALLOW_IPS", ".env (raíz)", "IP de la que se acepta X-Forwarded-For: solo Caddy",
     "172.30.0.10"],
    ["PGBOUNCER_MAX_CLIENT_CONN", ".env (raíz)", "Clientes máximos de PgBouncer; valida el presupuesto",
     "1200"],
    ["URL_DATABASE", "RehniMarket-backend/.env", "Conexión directa a PostgreSQL; la usa Alembic",
     "postgresql://usuario:***@postgres:5432/bd"],
    ["URL_DATABASE_POOLED", "RehniMarket-backend/.env", "Conexión por PgBouncer; la usa la aplicación",
     "postgresql://usuario:***@pgbouncer:6432/bd"],
    ["SECRET_KEY / ALGORITHM", "RehniMarket-backend/.env", "Clave y algoritmo de firma JWT",
     "openssl rand -hex 32 / HS256"],
    ["ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_DAYS", "RehniMarket-backend/.env",
     "Vigencia del access token y del refresh token", "30 / 15"],
    ["GMAIL_USERNAME / GMAIL_APP_PASSWORD", "RehniMarket-backend/.env",
     "Cuenta de correo y contraseña de aplicación (credenciales SMTP por defecto)", "notificaciones@… / ***"],
    ["SMTP_HOST", "RehniMarket-backend/.env", "Servidor SMTP", "smtp.gmail.com (por defecto)"],
    ["SMTP_PORT", "RehniMarket-backend/.env", "Puerto SMTP: 587, 465 o 2525", "587 (por defecto)"],
    ["SMTP_SECURITY", "RehniMarket-backend/.env", "starttls o ssl; ssl se deduce con el puerto 465",
     "starttls (por defecto)"],
    ["SMTP_USERNAME / SMTP_PASSWORD", "RehniMarket-backend/.env", "Credenciales SMTP; por defecto las GMAIL_*",
     "usuario SMTP / ***"],
    ["EMAIL_FROM", "RehniMarket-backend/.env", "Remitente visible; por defecto SMTP_USERNAME",
     "notificaciones@<dominio>"],
    ["EMAIL_MAX_WORKERS / SMTP_TIMEOUT", "RehniMarket-backend/.env", "Hilos de envío y timeout SMTP (s)",
     "4 / 10"],
    ["URL_FRONTEND", "RehniMarket-backend/.env", "Origen web (CORS) y base de los enlaces de los correos",
     "https://localhost"],
    ["URL_BACKEND", "RehniMarket-backend/.env", "Base de las URL de imágenes cuando la petición no pasa "
     "por Caddy", "http://localhost:8000"],
    ["MINIO_URL", "RehniMarket-backend/.env", "Host y puerto de MinIO, sin esquema", "minio:9000"],
    ["RATE_LIMIT_ENABLED / REQUEST_LIMIT / TIME_WINDOW", "RehniMarket-backend/.env",
     "Límite de peticiones por IP y ventana en segundos", "false en local, true en producción / 100 / 60"],
    ["USER_NAME_OWNER / OWNER_DEFAULT / OWNER_PASSWORD_DEFAULT", "RehniMarket-backend/.env",
     "Cuenta propietario que crea el seed", "Propietario / owner@… / ***"],
    ["USER_NAME_ADMIN / ADMIN_DEFAULT / PASSWORD_DEFAULT", "RehniMarket-backend/.env",
     "Se leen, pero el seed no crea la cuenta admin", "vacías"],
    ["RUN_SEED", "RehniMarket-backend/.env", "Ejecuta el seed al iniciar", "false"],
    ["THREADPOOL_SIZE / DB_POOL_SIZE / DB_MAX_OVERFLOW / DB_POOL_TIMEOUT / DB_POOL_RECYCLE",
     "RehniMarket-backend/.env", "Concurrencia y pool; el backend no arranca si no cumplen el presupuesto",
     "40 / 20 / 30 / 5 / 1800"],
    ["TEST_DATABASE_URL", "RehniMarket-backend/.env (solo pytest)", "Base de pruebas que crea y borra pytest",
     "postgresql://rehni_test:rehni_test@127.0.0.1:55433/rehnimarket_test"],
    ["POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB", ".env.postgres", "Credenciales de PostgreSQL y "
     "PgBouncer", "usuario / *** / bd"],
    ["MINIO_ROOT_USER / MINIO_ROOT_PASSWORD", ".env.minio", "Credenciales de MinIO (las lee también el "
     "backend)", "usuario / ***"],
    ["EXPO_PUBLIC_API_URL", "RehniMarket-mobile/.env", "URL de la API para la app móvil",
     "http://<IP-LAN>:8000; producción https://api.<dominio>"],
    ["EXPO_PUBLIC_REHNIMARKET_WHATSAPP", "RehniMarket-mobile/.env", "WhatsApp de recargas (móvil)", "+57…"],
]

SECCIONES_PLATAFORMA = [
    (1, "6", "Descripción de la plataforma", [
        P("RehniMarket es una aplicación cliente-servidor por capas, ejecutada en contenedores Docker. Los "
          "clientes (web y móvil) consumen una API REST. La arquitectura se muestra en el numeral 3.4."),
        REF("Ver la figura «Arquitectura del sistema» del numeral 3.4."),
    ]),
    (2, "6.1", "Tecnologías y versiones", [
        P("Versiones tomadas de RehniMarket-backend/pyproject.toml, RehniMarket-frontend/package.json, "
          "RehniMarket-mobile/package.json, los Dockerfile y docker-compose.yml."),
        TABLA(["Componente", "Tecnología", "Versión"], STACK, [3.0, 4.2, 4.6]),
    ]),
    (2, "6.2", "Servicios de Docker Compose", [
        P("Un solo docker-compose.yml sirve para desarrollo, pruebas y producción: lo que cambia entre entornos "
          "va en los archivos .env. Ya no existen docker-compose.dev.yml ni RehniMarket-backend/.env.dev."),
        TABLA(["Servicio (contenedor)", "Función", "Publicación", "Límite"], SERVICIOS, [3.4, 4.4, 2.4, 1.6]),
        SUB("MinIO"),
        UL("La imagen minio/minio ya no se puede descargar de Docker Hub; se usa la imagen de Chainguard, "
           "construida desde el código de MinIO (AGPLv3), fijada por digest: "
           "`cgr.dev/chainguard/minio@sha256:3c60a2a8c4d3…` (RELEASE.2026-10-23T20-06-51Z).",
           "El contenedor corre sin root, con el uid 65532 (nonroot). Un volumen minio_data creado por la imagen "
           "anterior necesita una vez `docker run --rm -v rehni-market_minio_data:/data alpine chown -R "
           "65532:65532 /data`.",
           "La imagen no trae curl: el healthcheck usa `mc ready local` con las credenciales de .env.minio.",
           "MinIO no se publica en el host; el backend sirve los archivos por GET /media/proxy."),
        SUB("Modos de uso"),
        CODE("docker compose up -d --build --wait                  # stack completo\n"
             "docker compose watch                                 # desarrollo: sincroniza y reinicia\n"
             "docker compose --profile test up -d --wait postgres-test   # PostgreSQL de pytest"),
        P("Con `docker compose watch`, los cambios en RehniMarket-backend/app y RehniMarket-backend/alembic se "
          "copian al contenedor y lo reinician; los cambios del frontend o de pyproject.toml/uv.lock "
          "reconstruyen la imagen; un cambio en caddy/Caddyfile reinicia Caddy. Para recarga en caliente del "
          "frontend se usa `pnpm dev` en el host (http://localhost:5173)."),
        CAP("Terminal", "docker compose ps con los cinco servicios en estado healthy", "t-compose-ps.png",
            "Servicios en ejecución"),
    ]),
    (2, "6.3", "Variables de entorno", [
        P("Los archivos reales no se versionan; las plantillas *.example no contienen secretos. La variable "
          "FRONTEND_PORT ya no existe: Caddy usa HTTP_PORT y HTTPS_PORT."),
        P("Las variables se relacionan en la tabla siguiente."),
        ("ancha", "Variables de entorno", ["Variable", "Archivo", "Descripción", "Ejemplo"], VARIABLES,
         [4.6, 3.2, 4.6, 4.1]),
        P("Reglas que valida el backend al arrancar (RehniMarket-backend/app/Config.py): "
          "DB_POOL_SIZE + DB_MAX_OVERFLOW ≥ THREADPOOL_SIZE, y (DB_POOL_SIZE + DB_MAX_OVERFLOW) × "
          "UVICORN_WORKERS ≤ PGBOUNCER_MAX_CLIENT_CONN. SMTP_SECURITY solo admite starttls o ssl."),
    ]),
    (2, "6.4", "Correo SMTP configurable", [
        P("El backend envía los códigos de verificación y recuperación y las notificaciones de pedidos, "
          "devoluciones y liquidaciones por SMTP, en hilos propios (RehniMarket-backend/app/services/email/"
          "EmailService.py). Sin variables SMTP_* se usa Gmail por 587 con STARTTLS y las credenciales GMAIL_*."),
        TABLA(["Puerto", "Cifrado (SMTP_SECURITY)", "Uso", "Oracle Cloud"], [
            ["587", "starttls", "Envío autenticado estándar; el valor por defecto", "Abierto"],
            ["465", "ssl (se deduce)", "Envío con TLS desde el inicio; para redes que bloquean el 587", "Abierto"],
            ["2525", "starttls", "Relays como Brevo, SendGrid o Mailgun", "Abierto"],
            ["25", "—", "Entre servidores de correo; no se usa", "Bloqueado de salida"],
        ], [1.6, 3.0, 5.2, 2.0]),
        SUB("Ejemplos (RehniMarket-backend/.env)"),
        CODE("# A · Gmail por 587 (por defecto): solo GMAIL_USERNAME y GMAIL_APP_PASSWORD\n"
             "# B · Gmail por 465\n"
             "SMTP_PORT=465\n"
             "# C · Relay por 2525 (Brevo)\n"
             "SMTP_HOST=smtp-relay.brevo.com\n"
             "SMTP_PORT=2525\n"
             "SMTP_SECURITY=starttls\n"
             "SMTP_USERNAME=\"usuario SMTP de Brevo\"\n"
             "SMTP_PASSWORD=\"clave SMTP de Brevo\"\n"
             "EMAIL_FROM=\"notificaciones@<dominio>\""),
        P("Tras cambiar las variables: `docker compose up -d backend`. Un envío fallido aparece en "
          "`docker compose logs backend` como «Error al enviar correo»: TimeoutError o ConnectionRefusedError "
          "indican puerto bloqueado; SMTPAuthenticationError, credenciales incorrectas."),
    ]),
    (2, "6.5", "Instalación local", [
        P("Instalación con los dominios locales rehnimarket (frontend) y api.rehnimarket (API), con HTTPS. "
          "Todos los comandos se ejecutan desde la raíz del repositorio. Requisitos: Git y Docker con Compose "
          "v2.22 o superior; scripts/verificar-requisitos.sh los comprueba."),
        PASO(1, "Clonar el repositorio.", ""),
        CODE("git clone https://github.com/RehnieyAl/Rehni-Market.git\ncd Rehni-Market\n"
             "bash scripts/verificar-requisitos.sh"),
        PASO(2, "Crear los archivos .env.", "Copiar las plantillas y diligenciarlas. Usuario, contraseña y base de "
             "URL_DATABASE y URL_DATABASE_POOLED deben coincidir con .env.postgres."),
        CODE("cp .env.example .env\ncp .env.postgres.example .env.postgres\ncp .env.minio.example .env.minio\n"
             "cp RehniMarket-backend/.env.example RehniMarket-backend/.env\n"
             "chmod 600 .env .env.postgres .env.minio RehniMarket-backend/.env"),
        PASO(3, "Configurar los dominios en .env.", ""),
        CODE("SITE_ADDRESS=rehnimarket\nAPI_ADDRESS=api.rehnimarket\nCADDY_LOCAL_CERTS=local_certs\n"
             "VITE_API_URL=https://api.rehnimarket\nCORS_EXTRA_ORIGINS=https://rehnimarket"),
        P("En RehniMarket-backend/.env: `URL_FRONTEND=\"https://rehnimarket\"` (la plantilla trae "
          "https://localhost, que sirve si se usan los dominios por defecto localhost y api.localhost; en ese "
          "caso no hacen falta los pasos 3, 4 ni CADDY_LOCAL_CERTS)."),
        PASO(4, "Registrar los dominios en /etc/hosts.", ""),
        CODE("grep rehnimarket /etc/hosts || printf '127.0.0.1 rehnimarket\\n127.0.0.1 api.rehnimarket\\n' "
             "| sudo tee -a /etc/hosts\ngetent hosts rehnimarket api.rehnimarket"),
        PASO(5, "Levantar los servicios.", "El backend aplica las migraciones al iniciar."),
        CODE("docker compose up -d --build --wait\ndocker compose ps"),
        PASO(6, "Confiar en la CA local de Caddy (una vez).", "Sin este paso el navegador corta las llamadas a "
             "https://api.rehnimarket y el frontend no conecta con el backend. En CachyOS/Arch:"),
        CODE("docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt\n"
             "sudo trust anchor --store /tmp/caddy-root.crt\ntrust list | grep -i caddy"),
        P("En Debian/Ubuntu: copiar el archivo a /usr/local/share/ca-certificates/caddy-root.crt y ejecutar "
          "`sudo update-ca-certificates`. Cerrar y abrir el navegador. Si se borra el volumen caddy_data, Caddy "
          "crea otra raíz y hay que repetir el paso."),
        PASO(7, "Verificar HTTPS en los dos dominios.", ""),
        CODE("curl -sS -o /dev/null -w 'site %{http_code}\\n' https://rehnimarket/          # 200\n"
             "curl -sS https://api.rehnimarket/health/database                            # {\"Base de datos\":\"OK\"}\n"
             "curl -sS -o /dev/null -w '%{http_code}\\n' http://rehnimarket/              # 308 → https"),
        P("Guía detallada y problemas frecuentes: caddy/caddy-configuracion.md."),
        SUB("Desarrollo sin Docker (opcional)"),
        UL("Backend: `cd RehniMarket-backend && uv sync && uv run alembic upgrade head && uv run uvicorn "
           "app.main:app --reload` (sin URL_DATABASE_POOLED, conecta directo a PostgreSQL).",
           "Frontend: `cd RehniMarket-frontend && pnpm install && pnpm dev` (http://localhost:5173, con "
           "RehniMarket-frontend/.env).",
           "Móvil: `cd RehniMarket-mobile && pnpm install && pnpm start`, con EXPO_PUBLIC_API_URL apuntando a "
           "http://<IP-LAN>:8000 y BACKEND_BIND=0.0.0.0 en el .env de la raíz."),
        CAP("Terminal", "la ejecución de docker compose up -d --build --wait terminada", "t-compose-up.png",
            "Instalación con Docker"),
    ]),
    (2, "6.6", "Migraciones de Alembic", [
        P("Alembic administra el esquema. La cadena es lineal y su revisión final es c3e5a7f9d1b2. Las "
          "migraciones usan URL_DATABASE directo a PostgreSQL y no pasan por PgBouncer. Se ejecutan dentro del "
          "contenedor (`docker compose exec backend uv run alembic …`) o en RehniMarket-backend/ con uv."),
        UL("Aplicar: `uv run alembic upgrade head`",
           "Crear: `uv run alembic revision --autogenerate -m \"descripción\"`",
           "Revertir una: `uv run alembic downgrade -1`",
           "Consultar: `uv run alembic current`"),
        TABLA(["No.", "Revisión", "Descripción"], [
            ["1", "29fe206320ce", "add tables"],
            ["2", "d72ef7fa597e", "upgrade table product"],
            ["3", "048871b47f63", "add catalog attributes"],
            ["4", "a90540bebea", "variant combinations and discounts"],
            ["5", "b6f8fd31fbe", "backfill legacy colors and specifications into catalog attributes"],
            ["6", "cb6d38ee0bd", "order item attributes snapshot"],
            ["7", "d4e5f6a7b8c9", "advertisement: drop title / description / button_text"],
            ["8", "e7a1c9d24b30", "shipping carriers catalog + order shipping info"],
            ["9", "f2b7c4e91a05", "product.applies_tax - IVA opcional por producto"],
            ["10", "a1b2c3d4e5f6", "product search: pg_trgm + unaccent para búsqueda tolerante a errores"],
            ["11", "c3d5e7f9a1b2", "wallet refund idempotency - un solo reembolso por pedido"],
            ["12", "e1f2a3b4c5d6", "company certificate rejection reason"],
            ["13", "f7a2b9c1d3e4", "return requests (devoluciones de ítems de pedidos entregados)"],
            ["14", "a7c4e1f9b2d8", "company certificate NEEDS_UPDATE status"],
            ["15", "b8d1c4f7a2e9", "wallet recharge correction - trazabilidad y anti doble corrección"],
            ["16", "c3e5a7f9d1b2", "fk indexes hot paths - índices de claves foráneas en rutas calientes"],
        ], [1.2, 3.0, 7.6]),
    ]),
    (2, "6.7", "Pruebas", [
        SUB("Backend (pytest)"),
        P("Las pruebas usan una base de datos propia (TEST_DATABASE_URL) que se crea y se borra en cada "
          "ejecución; nunca tocan la base de desarrollo. Se debe ejecutar con RUN_SEED=false: con el seed "
          "activo, cada cliente de prueba lo ejecuta y pytest se queda esperando."),
        CODE("docker compose --profile test up -d --wait postgres-test\ncd RehniMarket-backend\n"
             "RUN_SEED=false \\\n"
             "TEST_DATABASE_URL=postgresql://rehni_test:rehni_test@127.0.0.1:55433/rehnimarket_test \\\n"
             "  uv run pytest\n"
             "uv run pytest --cov            # con cobertura (fail_under = 60 en pyproject.toml)\n"
             "docker compose --profile test rm -sf postgres-test"),
        SUB("Frontend y móvil"),
        UL("Web: `cd RehniMarket-frontend && pnpm test` (Vitest); `pnpm test:coverage` para cobertura.",
           "Móvil: `cd RehniMarket-mobile && pnpm test` (Jest con jest-expo)."),
        SUB("Carga y humo"),
        UL("Pruebas de carga con k6 en tests/load/ (01-smoke.js a 06-recovery.js; ver tests/load/README.md).",
           "Prueba de humo contra un entorno levantado: `bash scripts/smoke-test.sh` con FRONTEND_URL, BASE_URL, "
           "SMOKE_EMAIL y SMOKE_PASSWORD."),
    ]),
    (2, "6.8", "Requisitos del servidor", [
        TABLA(["Elemento", "Mínimo", "Recomendado (producción)"], [
            ["CPU", "4 vCPU (el backend tiene límite cpus: \"4\" y Docker no crea el contenedor con menos)",
             "4 OCPU Ampere A1 (ARM64)"],
            ["RAM", "4 GB (los límites suman unos 2,3 GB)", "24 GB (máximo gratuito de A1)"],
            ["Disco", "40 GB", "100 a 200 GB (boot volume gratuito hasta 200 GB)"],
            ["Sistema operativo", "Linux de 64 bits (x86_64 o aarch64)", "Ubuntu 24.04 LTS (aarch64)"],
            ["Docker", "Docker Engine 24 y Docker Compose v2.22 (docker compose watch)",
             "Versión estable más reciente (script oficial get.docker.com)"],
            ["Red", "Puertos 80 y 443 abiertos; IP pública", "IP pública reservada; DNS con registros A para "
             "<dominio> y api.<dominio>"],
            ["Correo", "Salida a un puerto SMTP (587, 465 o 2525)", "Proveedor con SPF y DKIM configurados"],
        ], [2.6, 4.6, 4.6]),
        P("Todas las imágenes usadas publican linux/arm64 y todas las dependencias de uv.lock tienen paquete "
          "aarch64 para Python 3.13 (comprobado el 06/11/2026)."),
    ]),
    (2, "6.9", "Despliegue en producción (Oracle Cloud A1)", [
        P("Procedimiento integrado desde deploy/guia-oracle-cloud-a1.html. Producción usa el mismo "
          "docker-compose.yml y caddy/Caddyfile que el desarrollo: solo cambian los .env."),
        PASO(1, "Crear la clave SSH en el equipo del administrador.", ""),
        CODE("ssh-keygen -t ed25519 -C \"rehnimarket-oci\" -f ~/.ssh/rehni_oci\ncat ~/.ssh/rehni_oci.pub"),
        P("Guardar una copia de la clave privada: si se pierde no hay forma sencilla de recuperar el acceso."),
        PASO(2, "Crear la VM.", "En la consola de Oracle: Compute → Instances → Create instance."),
        TABLA(["Campo", "Valor"], [
            ["Image", "Canonical Ubuntu 24.04 (aarch64)"],
            ["Shape", "Ampere → VM.Standard.A1.Flex · 4 OCPU · 24 GB"],
            ["Networking", "VCN con subred pública · Assign a public IPv4 address"],
            ["Add SSH keys", "Pegar el contenido de ~/.ssh/rehni_oci.pub"],
            ["Boot volume", "100 a 200 GB"],
        ], [3.0, 8.8]),
        P("Si aparece «Out of host capacity», probar otro Availability Domain o reintentar más tarde."),
        PASO(3, "Reservar la IP pública.", "Networking → IP management → Reserved public IPs → Reserve; luego, en "
             "la VNIC de la instancia, quitar la IP efímera y asignar la reservada."),
        PASO(4, "Configurar el acceso SSH.", "Agregar al final de ~/.ssh/config:"),
        CODE("Host rehni-oci\n    HostName <IP pública>\n    User ubuntu\n    IdentityFile ~/.ssh/rehni_oci\n"
             "    IdentitiesOnly yes\n    ServerAliveInterval 60"),
        P("Probar con `ssh rehni-oci` (uname -m debe dar aarch64) y comprobar que el acceso por contraseña está "
          "desactivado: `sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'`."),
        PASO(5, "Abrir los puertos en dos capas.", "En la Security List de la VCN, reglas de ingreso TCP 80 y 443 "
             "(y UDP 443 opcional) desde 0.0.0.0/0; limitar el 22 a la IP del administrador. No abrir el 8000 ni "
             "el 5433. Dentro de la VM:"),
        CODE("sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT\n"
             "sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT\n"
             "sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT\nsudo netfilter-persistent save"),
        PASO(6, "Configurar el DNS.", "Crear dos registros A hacia la IP reservada: <dominio> (o @) y api. "
             "Comprobar con `dig +short <dominio>` y `dig +short api.<dominio>`. No levantar Caddy antes de que "
             "resuelvan: Let's Encrypt limita los intentos fallidos."),
        PASO(7, "Preparar el servidor.", ""),
        CODE("sudo apt update && sudo apt upgrade -y\nsudo timedatectl set-timezone America/Bogota\n"
             "curl -fsSL https://get.docker.com | sudo sh\nsudo usermod -aG docker $USER   # volver a entrar\n"
             "docker version && docker compose version"),
        PASO(8, "Clonar y configurar.", "Los secretos nunca van por Git: generar valores nuevos, distintos de los "
             "de desarrollo (`openssl rand -base64 48`)."),
        CODE("git clone https://github.com/RehnieyAl/Rehni-Market.git && cd Rehni-Market\n"
             "bash scripts/verificar-requisitos.sh\n"
             "cp deploy/env.prod.example .env\n"
             "cp RehniMarket-backend/.env.public.example RehniMarket-backend/.env\n"
             "cp .env.postgres.example .env.postgres\ncp .env.minio.example .env.minio\n"
             "chmod 600 .env .env.postgres .env.minio RehniMarket-backend/.env"),
        P("Valores clave del .env de la raíz: SITE_ADDRESS=<dominio>, API_ADDRESS=api.<dominio>, HTTP_PORT=80, "
          "HTTPS_PORT=443, CADDY_LOCAL_CERTS vacía, VITE_API_URL=https://api.<dominio>, "
          "CORS_EXTRA_ORIGINS=https://<dominio>, DOCS_ENABLED=false y BACKEND_BIND=127.0.0.1. En "
          "RehniMarket-backend/.env: URL_FRONTEND=\"https://<dominio>\", URL_BACKEND=\"https://api.<dominio>\", "
          "RATE_LIMIT_ENABLED=true y RUN_SEED=false (true una sola vez para crear la cuenta propietario)."),
        PASO(9, "Levantar y verificar.", "El build se hace en la VM, nativo en ARM."),
        CODE("docker compose up -d --build --wait\ndocker compose ps\n"
             "docker compose logs frontend | grep -i \"certificate obtained\"\n"
             "curl -I https://<dominio>                        # 200\n"
             "curl https://api.<dominio>/health/database       # {\"Base de datos\":\"OK\"}\n"
             "curl -I http://<dominio>                         # 308 → https"),
        TABLA(["Si falla…", "Revisar"], [
            ["Caddy no obtiene el certificado", "DNS, Security List, iptables y CADDY_LOCAL_CERTS vacía "
             "(docker compose logs frontend)."],
            ["El backend no arranca", "docker compose logs backend: credenciales de PostgreSQL o MinIO que no "
             "coinciden, o límite de CPU."],
            ["La web carga pero no llega a la API", "VITE_API_URL (exige --build), CORS_EXTRA_ORIGINS y "
             "URL_FRONTEND."],
            ["No llegan los correos", "Numeral 6.4: diagnóstico de puertos y variables SMTP."],
        ], [4.0, 7.8]),
        PASO(10, "Llevar los datos (opcional).", "En el equipo local: `bash scripts/backup_rehnimarket.sh` y "
             "`rsync -avz backups/ rehni-oci:Rehni-Market/backups/`. En el servidor: `bash "
             "scripts/restore_rehnimarket.sh <TS> --verify-only` y luego `bash scripts/restore_rehnimarket.sh "
             "<TS>`. Las URL de imágenes se arman en cada petición con el host del cliente: no hay que "
             "reescribir la base de datos al cambiar de dominio."),
        SUB("Operación"),
        UL("Actualizar: `git pull && docker compose up -d --build --wait` (alembic upgrade head corre al arrancar "
           "el backend).",
           "Base de datos por túnel SSH: `ssh -N -L 5433:127.0.0.1:5433 rehni-oci` y conectar el cliente a "
           "localhost:5433.",
           "Respaldos diarios con cron: `0 3 * * * cd $HOME/Rehni-Market && bash scripts/backup_rehnimarket.sh`, "
           "y copia de backups/ fuera del servidor.",
           "App móvil: EXPO_PUBLIC_API_URL=https://api.<dominio>.",
           "Oracle puede reclamar instancias Always Free con uso de CPU muy bajo durante 7 días seguidos."),
    ]),
    (2, "6.10", "Integración continua (SonarCloud)", [
        P("El repositorio tiene un único workflow, .github/workflows/sonarqube.yml, que ejecuta SonarCloud en "
          "cada push a main y develop, en cada pull request y a mano (workflow_dispatch). SonarCloud se usa "
          "solo para calidad de código: confiabilidad, seguridad, mantenibilidad, duplicación y security "
          "hotspots."),
        UL("El CI no ejecuta pruebas ni mide cobertura: las pruebas se ejecutan localmente (numeral 6.7).",
           "sonar-project.properties excluye la cobertura de todo el código (`sonar.coverage.exclusions=**`), "
           "por lo que el quality gate no la evalúa.",
           "Se excluyen del análisis dependencias, builds, migraciones generadas y pruebas (sonar.exclusions).",
           "El token se guarda en el secreto SONAR_TOKEN del repositorio."),
    ]),
]

ESTRUCTURA = [
    ["RehniMarket-backend/app/routers", "Rutas HTTP (FastAPI) por módulo"],
    ["RehniMarket-backend/app/services", "Lógica de negocio: authentication, commerce, DashboardService, email, "
     "variants, publicService, pricing.py, PayoutService.py, NasService.py"],
    ["RehniMarket-backend/app/repository", "Acceso a datos con SQLAlchemy"],
    ["RehniMarket-backend/app/models", "Modelos SQLAlchemy"],
    ["RehniMarket-backend/app/schemas", "Esquemas Pydantic de entrada y salida, con sus validadores"],
    ["RehniMarket-backend/app/middleware", "Autenticación, permisos por rol, CORS, límite de peticiones y URL "
     "pública"],
    ["RehniMarket-backend/app/core", "Códigos de error, excepciones y constantes de negocio (IVA, billetera, "
     "liquidaciones)"],
    ["RehniMarket-backend/app/database", "Conexión, sesiones y pool"],
    ["RehniMarket-backend/app/utils", "Seguridad, respuestas, NIT, seed y verificaciones de salud"],
    ["RehniMarket-backend/alembic", "Migraciones"],
    ["RehniMarket-backend/tests", "Pruebas de pytest"],
    ["RehniMarket-frontend/src/api", "Cliente HTTP (Axios), sesión e interceptor de renovación de tokens"],
    ["RehniMarket-frontend/src/features", "Módulos funcionales de la web por dominio"],
    ["RehniMarket-frontend/src/pages", "Páginas públicas, del comprador y de los paneles"],
    ["RehniMarket-frontend/src/routers", "Rutas web y guardas por perfil"],
    ["RehniMarket-frontend/src/shared", "Componentes, configuración de navegación, tipos, utilidades y "
     "validación compartida"],
    ["RehniMarket-mobile/src/app", "Rutas de Expo Router: (auth), (user) y (tabs)"],
    ["RehniMarket-mobile/src/screens", "Pantallas de la app móvil"],
    ["RehniMarket-mobile/src/features", "Módulos móviles por dominio"],
    ["RehniMarket-mobile/src/api", "Servicios HTTP de la app móvil"],
    ["caddy", "Caddyfile único y guía de configuración"],
    ["deploy", "Plantilla .env de producción y guía de Oracle Cloud A1"],
    ["scripts", "Respaldo, restauración, verificación de requisitos, humo y rendimiento"],
    ["tests/load", "Pruebas de carga con k6"],
    ["docs", "Documentación: manuales, pruebas y plan de implantación"],
    [".github/workflows", "Workflow de SonarCloud"],
]

ARCHIVOS_CLAVE = [
    ["docker-compose.yml", "YAML", "Servicios, límites, healthchecks, watch y perfil test"],
    ["caddy/Caddyfile", "Caddyfile", "Sitios del frontend y de la API, HTTPS, encabezados y tope del cuerpo"],
    ["RehniMarket-backend/app/main.py", "Python", "Crea la aplicación FastAPI (versión 2.6.0), registra "
     "middlewares y routers, y ejecuta el seed si RUN_SEED=true"],
    ["RehniMarket-backend/app/Config.py", "Python", "Carga y valida las variables de entorno, el presupuesto de "
     "conexiones y la configuración SMTP"],
    ["RehniMarket-backend/app/middleware/AuthMiddleware.py", "Python", "Valida el token, lee el rol desde la base "
     "de datos y aplica el estado de la cuenta y de la empresa"],
    ["RehniMarket-backend/app/middleware/RolePermissions.py", "Python", "Rutas permitidas por rol"],
    ["RehniMarket-backend/app/middleware/PublicRoutes.py", "Python", "Rutas públicas sin token"],
    ["RehniMarket-backend/app/middleware/RateLimitMiddleware.py", "Python", "Límite de peticiones por IP"],
    ["RehniMarket-backend/app/middleware/CorsMiddleware.py", "Python", "Orígenes CORS: URL_FRONTEND, "
     "CORS_EXTRA_ORIGINS y localhost:5173"],
    ["RehniMarket-backend/app/database/Connection.py", "Python", "Motor, pool y sesiones de SQLAlchemy"],
    ["RehniMarket-backend/app/core/ErrorCodes.py", "Python", "Catálogo de códigos de error"],
    ["RehniMarket-backend/app/services/email/EmailService.py", "Python", "Envío SMTP en hilos propios con "
     "SMTP_HOST, SMTP_PORT y SMTP_SECURITY"],
    ["RehniMarket-backend/app/services/pricing.py", "Python", "Precio efectivo, descuentos y precio de tarjeta"],
    ["RehniMarket-backend/app/services/PayoutService.py", "Python", "Liquidaciones y comisión"],
    ["RehniMarket-backend/app/services/NasService.py", "Python", "Cliente de MinIO"],
    ["RehniMarket-backend/app/utils/seed.py", "Python", "Roles, catálogo, empresas de prueba y cuenta owner"],
    ["RehniMarket-backend/alembic/env.py", "Python", "Entorno de Alembic con URL_DATABASE"],
    ["RehniMarket-frontend/src/routers/AppRouter.tsx", "TypeScript", "Rutas web y RequireAuth por área"],
    ["RehniMarket-frontend/src/api/Client.ts", "TypeScript", "Instancia de Axios con VITE_API_URL"],
    ["RehniMarket-frontend/src/api/setupAuthInterceptor.ts", "TypeScript", "Renovación automática del access "
     "token con el refresh token"],
    ["RehniMarket-frontend/src/api/session.ts", "TypeScript", "Guardado de la sesión en localStorage"],
    ["RehniMarket-frontend/src/shared/config/dashboardNavigation.tsx", "TypeScript", "Menú lateral de cada "
     "panel, con Inicio y las opciones exclusivas del propietario"],
    ["RehniMarket-frontend/src/shared/validation/", "TypeScript", "Validación compartida de formularios "
     "(numeral 7.3)"],
    ["RehniMarket-mobile/src/app/_layout.tsx", "TypeScript", "Raíz de navegación de Expo Router"],
    ["RehniMarket-mobile/src/config/env.ts", "TypeScript", "EXPO_PUBLIC_API_URL y WhatsApp"],
    ["RehniMarket-mobile/src/api/client.ts", "TypeScript", "Cliente HTTP de la app móvil"],
    ["sonar-project.properties", "Properties", "Configuración de SonarCloud"],
    ["deploy/env.prod.example", "Env", "Plantilla del .env de la raíz en producción"],
]

SECCIONES_CODIGO = [
    (1, "7", "Documentación del código fuente", [
        P("El repositorio es un monorepositorio con tres paquetes (backend, web y móvil) más la infraestructura. "
          "El backend separa routers, servicios, repositorios, modelos y esquemas."),
        CAP("Editor de código", "la estructura de carpetas del monorepositorio expandida en el primer nivel",
            "t-estructura.png", "Estructura del proyecto"),
    ]),
    (2, "7.1", "Estructura de directorios", [
        TABLA(["Directorio", "Descripción"], ESTRUCTURA, [5.6, 6.2]),
    ]),
    (2, "7.2", "Archivos clave", [
        P("Se relacionan los archivos que conviene conocer primero; los demás siguen la estructura del "
          "numeral 7.1."),
        ("ancha", "Archivos clave", ["Ruta", "Lenguaje", "Descripción"], ARCHIVOS_CLAVE, [7.2, 2.0, 7.3]),
    ]),
    (2, "7.3", "Validación compartida de formularios", [
        P("El módulo RehniMarket-frontend/src/shared/validation/ valida los formularios mientras se escribe con "
          "las mismas reglas y los mismos mensajes que el backend, para que el usuario vea un solo texto. Usa Zod "
          "e informa solo el primer fallo de cada campo, en el mismo orden que Pydantic."),
        TABLA(["Archivo", "Contenido"], [
            ["rules.ts", "Reglas por campo con su origen en el backend: fullNameRule (3 a 60), passwordRule "
             "(8 caracteres, mayúscula, minúscula y número), phoneRule (10 dígitos), emailRule, companyNameRule "
             "(3 a 50), companyAddressRule (mínimo 5), nitRule (mínimo 5 dígitos), nitDvRule (un dígito), "
             "returnReasonRule (5 a 500) y trackingNumberRule (3 a 80)."],
            ["nit.ts", "Cálculo del dígito de verificación del NIT (pesos 71…3, módulo 11), igual al del backend "
             "(RehniMarket-backend/app/utils/NitValidator.py)."],
            ["schemas.ts", "Esquemas de formulario: registerUserSchema, registerCompanySchema (compara el DV "
             "con el NIT), returnRequestSchema y orderShippingSchema («Selecciona una transportadora.»)."],
            ["useFormValidation.ts", "Hook de React que aplica un esquema a un formulario y expone los errores "
             "por campo."],
            ["index.ts", "Exporta el módulo."],
        ], [3.2, 8.6]),
        P("Las reglas tienen pruebas unitarias en rules.test.ts, nit.test.ts y schemas.test.ts. El backend sigue "
          "siendo la autoridad: valida de nuevo cada petición."),
    ]),
    (2, "7.4", "Documentación de la API (Swagger)", [
        P("FastAPI publica la documentación interactiva en /docs (Swagger UI), /redoc y /openapi.json cuando "
          "DOCS_ENABLED=true en el .env de la raíz; en local queda en https://api.localhost/docs (o "
          "https://api.rehnimarket/docs) y en http://localhost:8000/docs. En producción debe quedar en false."),
        CAP("Swagger de la API en /docs", "los grupos de endpoints con DOCS_ENABLED=true", "t-swagger.png",
            "Documentación de la API"),
    ]),
]

ANS = [
    (1, "8", "Descripción de los acuerdos de niveles de servicio o ANS", [
        P(f"El soporte lo presta un solo desarrollador, en horario de {SOPORTE['horario']}. Los tiempos se "
          "cuentan en horas y días hábiles desde que el caso se registra por correo o en GitHub Issues."),
        SUB("Niveles de soporte"),
        TABLA(["Nivel", "Responsable", "Canal", "Atiende"], [
            ["1", "Mesa de ayuda (soporte)", f"Correo {SOPORTE['correo']} o GitHub Issues "
             f"({SOPORTE['issues']})", "Consultas de uso, cuentas bloqueadas, recargas, reprocesos desde el "
             "panel y registro del caso"],
            ["2", "Desarrollador", "GitHub Issues (escalado desde el nivel 1)", "Errores de código, datos "
             "inconsistentes, contenedores, migraciones, certificados y correo"],
        ], [1.2, 2.6, 4.0, 4.0]),
        SUB("Tiempos por prioridad"),
        TABLA(["Prioridad", "Ejemplos", "Primera respuesta", "Solución objetivo"], [
            ["Alta", "Plataforma caída, no se puede iniciar sesión o comprar, saldo o pago incorrecto",
             "4 horas hábiles", "2 días hábiles"],
            ["Media", "Función con falla que tiene una alternativa de uso; correos que no llegan",
             "1 día hábil", "5 días hábiles"],
            ["Baja", "Consultas, ajustes de texto o mejoras", "2 días hábiles",
             "Próxima versión (hasta 15 días hábiles)"],
        ], [1.8, 5.0, 2.4, 2.6]),
        SUB("Procedimiento"),
        OL("El nivel 1 registra el caso con perfil, pasos, mensaje exacto y captura, y asigna la prioridad.",
           "Si no se resuelve desde el panel, se escala al nivel 2 con la etiqueta de prioridad en GitHub "
           "Issues.",
           "El nivel 2 responde dentro del tiempo de primera respuesta, corrige y despliega (numeral 6.9, "
           "«Operación»).",
           "El nivel 1 confirma la solución con el usuario y cierra el caso."),
    ]),
]

LIMITACIONES = [
    "Los enlaces «Guía de vendedores», «Comisiones», «Centro de ayuda», «Términos y condiciones» y «Política "
    "de privacidad» del pie de página no tienen destino (funcionalidad en desarrollo).",
    "PUBLIC_ROUTES (RehniMarket-backend/app/middleware/PublicRoutes.py) contiene /auth/login-company y "
    "/auth/logout, que no tienen endpoint. El cierre de sesión ocurre en el cliente, que borra los tokens.",
    "No existe un endpoint para eliminar usuarios, aunque el enumerado admin_activity_action incluye "
    "user_deleted. El retiro se hace bloqueando la cuenta.",
    "El seed no crea la cuenta admin: USER_NAME_ADMIN, ADMIN_DEFAULT y PASSWORD_DEFAULT se leen pero no se usan. "
    "Un administrador se obtiene cambiando el rol desde una cuenta owner.",
    "RehniMarket-backend/pyproject.toml declara la versión 0.1.0 (proyecto better-backend), mientras la API "
    "declara 2.6.0.",
    "PgBouncer usa la etiqueta edoburu/pgbouncer:latest, sin versión fija.",
    "El seed no tiene bloqueo entre procesos: con RUN_SEED=true se debe arrancar con un solo worker o "
    "ejecutarlo una sola vez.",
    "La contraseña de las empresas de prueba del seed está en el código (SEED_COMPANY_PASSWORD en "
    "RehniMarket-backend/app/utils/seed.py). RUN_SEED debe estar en false en producción.",
    "La aplicación móvil no incluye devoluciones, reseñas ni reportes, ni paneles de empresa o administración.",
]

GLOSARIO = [
    ("Alembic", "herramienta de migraciones de base de datos."),
    ("ANS", "acrónimo de Acuerdo de Niveles de Servicio."),
    ("API", "interfaz para la comunicación entre aplicaciones."),
    ("Caddy", "servidor web y proxy inverso con HTTPS automático."),
    ("CA", "autoridad de certificación que firma certificados TLS."),
    ("CORS", "mecanismo que controla los orígenes permitidos."),
    ("Endpoint", "dirección de la API que ejecuta una operación."),
    ("FastAPI", "framework de la API REST."),
    ("JWT", "formato de tokens de autenticación."),
    ("Let's Encrypt", "autoridad de certificación gratuita que usa Caddy en producción."),
    ("Middleware", "componente que procesa solicitudes antes del endpoint."),
    ("MinIO", "almacenamiento de objetos compatible con S3."),
    ("OCI", "Oracle Cloud Infrastructure."),
    ("OpenAPI", "especificación para describir API."),
    ("PgBouncer", "administrador de conexiones de PostgreSQL."),
    ("PostgreSQL", "gestor de bases de datos relacional."),
    ("RehniCoin", "saldo interno de la plataforma."),
    ("SMTP", "protocolo de envío de correo electrónico."),
    ("SQLAlchemy", "ORM del backend."),
    ("Swagger UI", "interfaz web de la documentación de la API."),
    ("UML", "lenguaje de modelado de sistemas."),
]

BIBLIOGRAFIA = [
    "Servicio Nacional de Aprendizaje SENA. Manuales técnicos de la aplicación. FAVA - Formación en Ambientes "
    "Virtuales de Aprendizaje.",
    "Alred, G., Brusaw, C., Oliu, W. (2009). Handbook of technical writing. Boston: Bedford/St. Martin.",
    "Oracle (2026). Oracle Cloud Infrastructure Documentation: Always Free Resources.",
    "Caddy (2026). Caddy Documentation: Automatic HTTPS.",
]
