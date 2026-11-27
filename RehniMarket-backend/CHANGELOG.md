# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

> El proyecto nació con el nombre interno **"Lubix"** (versiones 1.1.x). A partir
> de agosto de 2026 pasó a llamarse **RehniMarket**. Las entradas 1.3.x y 2.x
> reflejan el estado real del repositorio (ramas y commits `ver 2.x`).

---

## [Unreleased] - 2026-11-24
### Added (2026-11-26) · liquidaciones
- **Cierre mensual de liquidaciones.** `GET /admin/payouts` (solo `owner`) lista, además de las
  liquidaciones generadas, cada mes cerrado con ventas entregadas que aún no se liquida
  (`isGenerated: false`, sin `id` y sin crear registros), con importes calculados igual que la
  generación. Aparecen desde el primer día del mes siguiente (`America/Bogota`), ordenadas por
  urgencia (sin pagar por fecha límite y luego pagadas) y paginadas en el servidor.
- **Fecha límite de consignación** (`consignmentDeadline`): quinto día hábil tras el cierre, sin
  sábados, domingos ni festivos de Colombia (`app/core/BusinessCalendar.py`, Ley 51 de 1983).
  `isOverdue` es solo un indicador: no cambia `payoutStatus`. El plazo es una regla interna.

### Changed (2026-11-26) · liquidaciones
- **Cierre del mes a medianoche de Colombia.** Las ventas se asignan al mes calendario de
  `America/Bogota` (antes UTC: una venta de las 19:00–24:00 del último día caía en el mes siguiente).
- **Cada venta liquidada queda enlazada a su liquidación** (`orders.payout_id`, migración
  `a4c6e8f0b2d4`): una venta no se paga dos veces, y la entregada después de liquidar su mes o que
  quedó en el borde horario se liquida en el primer mes siguiente sin liquidación. La migración
  enlaza lo existente con la regla UTC anterior: ningún importe histórico cambia. Conciliación:
  `docs/runbooks/conciliar-liquidaciones.md`.
- **Devoluciones repartidas con un único plan cronológico por empresa** que comparten el listado, la
  vista previa y la generación: generar los meses en cualquier orden da los mismos importes que se
  mostraron y ningún reembolso se descuenta dos veces. La generación bloquea la empresa, sus ventas
  sin liquidar y sus reembolsos.
- Solo se liquidan meses calendario completos (`422 PAYOUT_INVALID_PERIOD`): cierra H-07 (#36),
  periodos solapados que volvían a liquidar las mismas ventas.
- Un periodo que no ha cerrado ya no se puede liquidar ni previsualizar (`422 PAYOUT_INVALID_PERIOD`)
  y `available-periods` ya no lo ofrece: las ventas posteriores de ese mes quedaban fuera de todo pago.
- Dos generaciones simultáneas del mismo periodo responden `409 PAYOUT_ALREADY_EXISTS` (antes `500`)
  y «Marcar como pagada» bloquea la fila para no confirmar dos veces el mismo pago.

### Changed
- **Autenticación y roles por dependencias de FastAPI.** `AuthMiddleware.py`, `RolePermissions.py`,
  `PublicRoutes.py` y `AuthUser.py` se reemplazan por `app/core/AuthDependencies.py`: cada endpoint
  protegido declara `Depends(require_role(...))`. Se conservan los códigos y mensajes de `401`
  (`UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`), `403` (`USER_BLOCKED`, `FORBIDDEN`, estados de
  empresa) y el `503` con `Retry-After` si la base de datos no responde. Swagger muestra el candado
  Bearer (JWT) en las 129 operaciones protegidas.
- **`admin` y `owner` ya no pasan a las rutas de comprador ni de empresa.** Antes el middleware los
  dejaba entrar a todo; ahora reciben `403 FORBIDDEN` (antes, según la ruta, `PURCHASE_NOT_ALLOWED`,
  `COMPANY_NOT_FOUND` o una respuesta `200` en `/wallet/me` y `/reports`). Ninguna pantalla de la web o
  la app móvil usaba esos accesos.
- Una ruta inexistente responde `404` (antes `401` sin token y `403` con token de un rol sin acceso).
- **Conexión a PostgreSQL en `app/core/dbconexion.py`** (antes `app/database/Connection.py`), con
  el mismo `engine`, `SessionLocal`, `get_db`, `read_session` y `Base`. Se elimina `app/database/`:
  el SQL del único owner vive en `ModelUser.py` y, copiado tal cual, en la migración `d7e3f1a9c5b2`
  (solo cambió su import; el SQL que ejecuta es idéntico y una prueba los mantiene iguales).
- Errores 500 sin detalles internos: `traceback.print_exc()` pasa a `logging` y los
  `HTTPException(500, detail=str(e))` a un mensaje genérico; `/health/database` ya no publica el
  texto del error de conexión.
- Ninguna función del backend supera complejidad ciclomática 10 (antes 16): checkout, edición de
  productos, anuncios, catálogos, usuarios de admin, listado público y resolución de variantes se
  dividen en pasos con nombre, sin cambiar respuestas ni SQL (comprobado contra la versión anterior).
  Los errores de subida a NAS ya no devuelven el texto interno de MinIO.
- **Ningún seed corre solo.** Con `RUN_SEED=false` (predeterminado, ahora también en `.env.example`)
  el arranque ya no crea roles, catálogos ni transportadoras: en una base nueva se crean con
  `bash scripts/datos-base.sh`. Con `RUN_SEED=true` se crean los datos base y luego los de demo.

- **Seeds separados por responsabilidad** (`app/utils/seed_*.py`): roles, categorías,
  especificaciones, atributos, colores (nuevo, opcional), transportadoras, owner, empresas demo y
  productos demo. `python -m app.utils.seed <nombres|base|demo>` los ejecuta en orden de dependencias;
  nada corre al importar. El seed `owner` ya no falla si existe un owner con otro correo.
- **Validación de archivos** (`app/utils/FileValidator.py`) en todas las subidas: JPEG/PNG/WEBP o
  PDF según el endpoint, máximo 5 MiB, MIME, firma real y archivo completo. `413 FILE_TOO_LARGE`,
  `415 UNSUPPORTED_FILE_TYPE`, `400 INVALID_FILE` (vacío o dañado); antes certificados y evidencias
  respondían `400 INVALID_FILE` también para tipo y tamaño. Un archivo rechazado nunca llega a MinIO.
- **Certificados privados:** `/media/proxy` ya no los sirve; el panel de admin y el de la empresa
  reciben una URL firmada de `/media/private` que caduca a los 30 minutos.

### Fixed
- **Correos sin distinguir mayúsculas.** Registro, login, recuperación, verificación, cambio de
  correo, `/auth/me` y los formularios de admin guardan y buscan el correo con `strip().lower()`
  (`SchemaEmail.NormalizedEmail`); las búsquedas usan `lower(email)` para que las cuentas antiguas
  con mayúsculas sigan entrando y no se pueda registrar otra igual con otras mayúsculas.
  `/auth/change-email` responde `409 EMAIL_ALREADY_EXISTS` si el correo nuevo ya es de otra cuenta.
- **Ganancias de la empresa en cero.** `GET /company/balance` solo sumaba liquidaciones, que el owner
  genera a mano por periodo: las ventas entregadas aún sin liquidar no aparecían. Ahora suma también
  esas ventas (pedidos `DELIVERED` fuera del periodo de cualquier liquidación de la empresa) con la
  misma comisión del 5 %, sin contar dos veces lo ya liquidado.

### Added
- Manejador de excepciones no controladas: `500` con `{code: INTERNAL_SERVER_ERROR, message}` sin
  detalles internos (antes texto plano, o `401 Token inválido` si fallaba la autenticación).
- Prueba de guarda: falla si alguna ruta que no está en la lista pública queda sin `require_role`.
- **Seguir empresas.** Tabla `company_followers` (migración `b5d7f9a1c3e6`: UNIQUE
  `(user_id, company_id)`, índice por empresa, `ON DELETE CASCADE`). `GET /public/company/{id}/followers`
  (público, solo el número) y `GET|POST|DELETE /company-follows/{id}` (solo rol `user`; seguir y dejar
  de seguir son idempotentes y seguras ante peticiones simultáneas con `ON CONFLICT DO NOTHING`).
  Empresa inexistente o suspendida: `404 COMPANY_NOT_FOUND`.
- `alembic check` en el CI tras `upgrade head`.

### Changed (2026-11-25)
- `GET /company/dashboard/my-profile` ("Mi tienda") declara `response_model=CompanyStoreSettingsResponse`
  y consulta solo la empresa: ya no carga la cuenta del representante (`Users`) y `memberAT` pasa a ser la
  fecha de registro de la empresa (`company.created_at`), no la de la cuenta personal. Los nombres de los
  campos no cambian. Sin empresa: `404 COMPANY_NOT_FOUND` con el formato de error de la API (antes texto
  plano). Los datos del representante siguen en `/auth/me`.

### Added (2026-11-25)
- **Catálogo de bancos.** Tabla `banks` (nombre, `normalized_name` único, logo en MinIO `banks/`, estado)
  y `company_bank_accounts.bank_id` (FK `RESTRICT`, nulable), migración `d8f0a2c4e6b1`. No crea bancos:
  las cuentas existentes conservan `bank_name` con `bank_id` vacío y se enlazan solas cuando un
  administrador registra un banco con el mismo nombre normalizado. `GET|POST /admin/dashboard/banks` y
  `PATCH /admin/dashboard/banks/{bank_id}` (roles `admin` y `owner`; logo PNG/JPG/WebP hasta 5 MB, al
  reemplazarlo se borra el anterior; sin borrado, un banco en desuso se desactiva). Nombre duplicado:
  `409 BANK_ALREADY_EXISTS`. `GET /company/bank-accounts/banks` lista los bancos activos para la empresa.

### Changed (2026-11-25) · cuentas bancarias
- `POST /company/bank-accounts` recibe `bankId` del catálogo en lugar de `bankName` (banco inexistente
  `404 BANK_NOT_FOUND`, inactivo `400 BANK_INACTIVE`); `PATCH` acepta cambios parciales y conserva el
  número si no se envía. Las respuestas ya no incluyen el número completo: `lastFourDigits`, `bankId`,
  `bankName` y `bankLogoUrl`. Elegir la cuenta principal bloquea la fila de la empresa para que dos
  peticiones simultáneas no dejen dos cuentas principales.

### Fixed (2026-11-25)
- **H-01:** `shipping_carriers.created_at` pasa a `NOT NULL` como declara el modelo (migración
  `c6e8a0b2d4f7`; antes rellena solo filas en `NULL`). `alembic/env.py` excluye de la comparación el
  índice de expresión `ix_products_name_search_trgm`: `alembic check` ya no reporta diferencias.
- Seed `demo`: las imágenes nuevas son un círculo del color de la variante sobre fondo claro (antes un
  lienzo entero del color, que en la tienda se veía como una foto vacía). No reemplaza objetos ya subidos.

### Removed (2026-11-25)
- Código sin uso confirmado: `app/utils/Response.py`, `app/schemas/SchemaError.py`,
  `dbconexion.pool_stats`, `NasService.get_presigned_url`/`download_stream`,
  `companyRepository.update_company_status`, `ReturnRepository.count_pending_by_company`,
  `UserRepository.change_email`, `DashboarService.get_recent_activities` y los esquemas
  `AdminRecentUserResponse`/`AdminUserUpdateResponse`.

## [Unreleased] - 2026-11-04
### Changed
- **Compose y Caddyfile únicos** (detalle en el `CHANGELOG.md` de la raíz, «Infraestructura
  de despliegue» y «Al actualizar»). Sustituye lo descrito el 2026-10-20 sobre HTTPS:
  ya no hay `tls ${CADDY_TLS:-internal}`, ni puertos `8080`/`8443`
  (`FRONTEND_PORT`/`FRONTEND_HTTPS_PORT`), ni `docker-compose.dev.yml`. Los sitios
  por defecto son `localhost` (frontend) y `api.localhost` (API), con HTTPS automático en
  80/443: CA local de Caddy en local y Let's Encrypt con un dominio público. Swagger por
  Caddy: `https://api.localhost/docs`. Las URL de imágenes por Caddy quedan como
  `https://api.localhost/media/proxy?...`.
- **`FORWARDED_ALLOW_IPS` por defecto `172.30.0.10`** (la IP fija de Caddy) en lugar de
  `172.16.0.0/12`. Con el rango, una petición al `:8000` desde el propio servidor entraba
  por la pasarela de Docker, que estaba dentro, y Uvicorn aceptaba su `X-Forwarded-For`:
  se podía falsear la IP y saltarse el rate limit. Comprobado y corregido el 2026-11-04.
- `URL_BACKEND` de `.env.example` pasa a `http://localhost:8000` (antes `:8001`, el
  puerto de `docker-compose.dev.yml`) y `URL_FRONTEND` a `https://localhost`.

## [Unreleased] - 2026-10-20
### Added
- **Swagger y ReDoc con `DOCS_ENABLED`** (por defecto `false`; en el `.env` de la
  raíz). Con `true`, `/docs`, `/docs/oauth2-redirect`, `/redoc` y `/openapi.json`
  existen y son públicas (`DOCS_ROUTES` en `PublicRoutes.py`); con `false`, FastAPI
  no las genera y el `AuthMiddleware` responde `401`, como desde el 07/10. Por
  Caddy: `https://api.rehnimarket:8443/docs`.
- `CORS_EXTRA_ORIGINS` (lista separada por comas): orígenes extra permitidos en
  CORS además de `URL_FRONTEND` (que se sigue usando en los enlaces de los
  correos). Necesario porque el frontend y la API están en dominios distintos.

### Changed
- **Nginx reemplazado por Caddy** en el contenedor `frontend`. La etapa final de
  `RehniMarket-frontend/Dockerfile` pasa de `nginx:1.27-alpine` a
  `caddy:2.11-alpine` y copia el build de Vite en `/srv`. La configuración vive en
  `caddy/Caddyfile` (raíz del repo), montada en `/etc/caddy`.
- **Frontend y API en URL separadas** (virtual hosts en el mismo Caddy):
  - `${SITE_ADDRESS:-rehnimarket}` → build de React.
  - `${API_ADDRESS:-api.rehnimarket}` → `reverse_proxy backend:8000`,
    con las rutas del backend tal cual (`/auth/...`, `/docs`).
  - Bloque `:80`: el frontend sigue respondiendo por IP o `localhost` en HTTP.
- `VITE_API_URL=https://api.rehnimarket:8443` en `.env.example`. Se graba
  al compilar: hay que reconstruir `frontend` después de cambiarla.
- Se conservan los encabezados de `nginx.conf` en el frontend:
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Cache-Control: no-cache` en el HTML, caché de un año (`immutable`) en
  `/assets/*` (404 si el archivo no existe), fallback a `index.html` para las rutas
  de React y compresión `zstd`/`gzip`.
- HTTPS: los dos sitios usan `tls ${CADDY_TLS:-internal}` (CA local de Caddy). Con
  dominios públicos, `CADDY_TLS=<correo>` hace que Caddy pida los certificados a
  Let's Encrypt. Nuevo puerto `${FRONTEND_HTTPS_PORT:-8443}:443`; el HTTP sigue en
  `${FRONTEND_PORT:-8080}:80`. Volúmenes nuevos `caddy_data` (certificados) y
  `caddy_config`.
- Backend: Uvicorn arranca con `--proxy-headers --forwarded-allow-ips
  "$FORWARDED_ALLOW_IPS"` (por defecto `172.16.0.0/12`, las redes de Docker).
  Detrás de Caddy, `RateLimitMiddleware` (`request.client.host`) vuelve a ver la IP
  real del cliente en lugar de la del proxy; un cliente que llega directo al
  `:8000` no puede falsear `X-Forwarded-For`.

### Fixed
- **Imágenes de MinIO detrás de Caddy.** `build_media_url` armaba siempre las URL
  con `URL_BACKEND` (`http://…:8000`): por HTTPS el navegador las bloqueaba como
  contenido mixto. Nuevo `PublicBaseUrlMiddleware`: si la petición trae
  `X-Forwarded-Host` (lo envía Caddy), la base de las URL es el esquema + host por
  los que entró el cliente (`https://api.rehnimarket:8443/media/proxy?...`).
  Se guarda en el `ContextVar` `request_media_base` de `NasService`, así que ningún
  servicio cambia de firma. Sin el encabezado (app móvil directo al `:8000`, tests,
  tareas fuera de una petición) se sigue usando `URL_BACKEND`.

- **Variables de entorno por servicio.** Las credenciales de PostgreSQL salen de
  `RehniMarket-backend/.env` a `.env.postgres` (solo `postgres` y `pgbouncer`) y las
  de MinIO a `.env.minio` (solo `minio` y `backend`), con sus `.example`. Antes los
  tres servicios cargaban el `.env` completo del backend y recibían también
  `SECRET_KEY`, `GMAIL_APP_PASSWORD` y las cuentas por defecto. `.gitignore` ignora
  `.env.*` salvo los `*.example`.
- `RehniMarket-frontend/.dockerignore` excluye `.env` y `.env.*`: antes entraban al
  build con `COPY . .` y, si faltaba el build arg, se compilaba en silencio con el
  `VITE_API_URL` de desarrollo.

### Removed
- `RehniMarket-frontend/nginx.conf`.
- Variables sin uso: `IP` en `RehniMarket-backend/.env.dev` (además mal formada,
  `IP = …`) y `VITE_API_URL` en `RehniMarket-frontend/.env` (en `pnpm dev` la pisa
  `.env.local`; en Docker, el build arg). `POSTGRES_*` y `MINIO_ROOT_*` dejan de
  estar en `RehniMarket-backend/.env.example` y `.env.public.example` (el backend no
  lee `POSTGRES_*`).

## [2.7] - 2026-09-07
### Added
- **Estado de certificado `NEEDS_UPDATE`** (`CompanyCertificateEnum`, migración
  `a7c4e1f9b2d8`: `ALTER TYPE companycertificateenum ADD VALUE 'NEEDS_UPDATE'`).
  Separa dos resultados de la revisión que antes eran uno solo:
  - `REJECTED` → **rechazo terminal de la empresa**. `apply_certificate_replacement`
    ahora devuelve `409 COMPANY_REJECTED`: la empresa **no** puede resubir el
    certificado por sí misma (ni con JWT en `PUT /company/certificate` ni sin JWT en
    `POST /company/certificate/update`). Solo un admin/owner puede volver a moverla.
  - `NEEDS_UPDATE` → el certificado presentado no es válido (ilegible, vencido,
    incorrecto). La empresa **sí** puede subir uno nuevo, que la devuelve a
    `PENDING`. Es el único estado desde el que se permite el reemplazo.
- `PATCH /admin/dashboard/companies/certificate/status/{company_id}` acepta
  `status: "needs_update"` (schema `Literal[...]` ampliado). `reason` es obligatorio
  para `rejected` **y** `needs_update` (`400 MISSING_REQUIRED_FIELD`). El endpoint no
  cambia su forma; el motivo se guarda en `Company.rejection_reason` en ambos casos y
  se limpia al aprobar o al reemplazar el certificado.
- `AuthMiddleware`: una empresa `NEEDS_UPDATE` que toca una ruta bloqueada del panel
  recibe `403 COMPANY_CERTIFICATE_INVALID` (nuevo `ErrorCodes`); `REJECTED` sigue
  devolviendo `403 COMPANY_REJECTED` (mensaje ajustado a "debe intervenir un
  administrador"). Ambas incluyen `reason` si existe. Login: `REJECTED` y
  `NEEDS_UPDATE` pueden iniciar sesión (para leer el motivo); solo `NEEDS_UPDATE`
  puede además reemplazar el certificado.
- Correo `EmailCertificateNeedsUpdate` (instrucciones para actualizar el
  certificado). `EmailCertificateRejected` reescrito como rechazo definitivo
  ("no se resuelve subiendo un nuevo certificado, contacta con soporte").
- Filtro del listado de empresas admite `status=needs_update`; ordenación
  `PENDING → NEEDS_UPDATE → REJECTED → APPROVED`.
- Frontend Admin: el botón de revisión abre `CertificateReviewModal` con dos
  opciones ("Rechazar" / "Certificado inválido — Solicitar actualización"), motivo
  obligatorio (validado en cliente), y envía `status` `rejected` o `needs_update`.
- Frontend Empresa: `CertificateRejectedModal` ahora distingue por `status` —
  `needs_update` ofrece "Actualizar certificado" (→ `/actualizar-certificado`);
  `rejected` (terminal) solo muestra el motivo. `MyCompany` y el `Home` del panel
  reflejan ambos estados.

## [2.6] - 2026-09-07
### Added
- **Actualización de certificado por correo y contraseña (sin JWT).**
  `POST /company/certificate/update` (multipart: `email`, `password`, `certificate`)
  es un endpoint **público** (`PUBLIC_ROUTES`) para una página independiente
  (`/actualizar-certificado`): identifica a la empresa **solo** por credenciales
  (nunca acepta `company_id`), **no** emite ningún token ni abre sesión y **no**
  guarda las credenciales. Solo procede si el certificado está `REJECTED`
  (`APPROVED → 409 COMPANY_APPROVED`, `PENDING → 409 COMPANY_PENDING`). Credenciales
  inválidas o cuenta que no es empresa → `400 INVALID_CREDENTIALS` (respuesta opaca);
  cuenta bloqueada → `403 USER_BLOCKED`; empresa suspendida → `403 COMPANY_SUSPENDED`;
  PDF inválido / > 5 MB → `400 INVALID_FILE`. En caso correcto: `REJECTED → PENDING`,
  `rejection_reason → NULL`, sin aprobación automática. El núcleo de validación +
  subida a MinIO + transacción se comparte con el flujo con JWT
  (`Dashboard.apply_certificate_replacement`, extraído de
  `replace_company_certificate_service`). El login normal del dashboard (JWT) no
  cambia: son dos flujos independientes.
- **Sistema de devoluciones.** Nuevo modelo `ReturnRequest` (`return_requests`,
  migración `f7a2b9c1d3e4`): una devolución cubre UN ítem de un pedido `DELIVERED`.
  Enum `return_status` (`PENDING → APPROVED | REJECTED`). Índice único parcial
  `uq_return_active_per_item` sobre `order_item_id WHERE status <> 'REJECTED'`
  (una devolución activa por ítem; tras un rechazo se puede volver a solicitar).
- `POST /orders/{order_id}/returns` (rol `user`): el comprador solicita la
  devolución de un ítem propio con un motivo (`≥ 5` caracteres). Solo si el pedido
  está `DELIVERED` (`400 RETURN_NOT_ELIGIBLE` si no) y el ítem no tiene ya una
  devolución activa (`409 RETURN_ALREADY_REQUESTED`). La empresa se resuelve desde
  `Order.company_id`; el comprador desde el token.
- `GET /orders/{order_id}/returns`: devoluciones del comprador para ese pedido.
  `GET /orders/{order_id}` ahora incluye `returns[]` (estado + motivo + respuesta
  de la empresa + monto reembolsado por ítem).
- `GET /company/dashboard/returns` (+ `?status=&search=&page=&limit=`),
  `GET /company/dashboard/returns/{id}`, `PATCH /company/dashboard/returns/{id}`
  (rol `company`): la empresa ve y evalúa **solo** las devoluciones de sus propios
  pedidos (scope por `company_id`; `404 RETURN_NOT_FOUND` para las de otra empresa).
  `action=reject` exige `reason` (`400 MISSING_REQUIRED_FIELD`); `action=approve`
  reintegra `order_item.subtotal + IVA` (`compute_tax`, solo si el producto aplica
  IVA) a la billetera RehniCoin del comprador vía `WalletService.refund_wallet`
  (`order_id=None`, sin colisionar con el reembolso de cancelación) y guarda el
  snapshot en `refund_amount`. `409 RETURN_ALREADY_RESOLVED` si ya no está `PENDING`.
- Correos `EmailReturnRequested` (a la empresa), `EmailReturnApproved` /
  `EmailReturnRejected` (al comprador, con monto o motivo).
- Frontend: detalle de pedido del comprador con botón "Solicitar devolución" por
  ítem y tarjeta de estado; nueva pestaña **Devoluciones** en el Panel Empresa
  (lista, filtros, aprobar / rechazar con motivo obligatorio).
- Frontend: `CertificateRejectedModal` en el Panel Empresa. Cuando
  `GET /company/dashboard/my-profile` devuelve `certificateStatus: "rejected"` se
  abre un modal (tema oscuro) con dos acciones: **Cambiar certificado** → navega a
  `/actualizar-certificado` (correo + contraseña + PDF, sin JWT), y **Ver motivo
  del rechazo** → muestra el `rejectionReason` real del backend (o un mensaje de
  respaldo si no hay motivo registrado). El código `COMPANY_REJECTED` /
  `COMPANY_PENDING` del middleware deja de disparar la alerta global genérica: lo
  comunica este modal.
- Frontend (Admin/Owner): al revisar un certificado `pending` en el detalle de
  empresa, el botón "Rechazar certificado" abre un modal (`ConfirmModal` +
  `Textarea` reutilizados) con "Motivo del rechazo *" (obligatorio, se valida en
  cliente que no esté vacío ni en blanco) y la ayuda "Este motivo será mostrado a
  la empresa". Al confirmar envía
  `PATCH /admin/dashboard/companies/certificate/status/{company_id}` con
  `{ "status": "rejected", "reason": <motivo recortado> }` (endpoint sin cambios;
  el backend sigue siendo la autoridad: `400 MISSING_REQUIRED_FIELD` si falta).
  Antes el botón enviaba `{ "status": "rejected" }` sin motivo y el rechazo
  fallaba con 400. El detalle de empresa ahora también muestra el
  `rejectionReason` de una empresa ya rechazada.
### Changed
- **Rediseño de la página de detalle de producto** a modo oscuro (superficies
  `surface-0/1/2`, acento vinotinto, stock en verde). No cambia la lógica de
  galería, variantes, precio, IVA ni carrito. Se añaden 4 tarjetas de confianza
  informativas (texto factual: no se promete "envío gratis" ni "garantía oficial"
  porque no existen esas reglas en el sistema) y un bloque de Preguntas frecuentes
  a nivel de plataforma. El modo oscuro se limita a esta ruta (`.theme-dark`), no
  es un tema global.

## [2.5] - 2026-09-07
### Added
- `Company.rejection_reason`: motivo obligatorio cuando el administrador rechaza
  el certificado empresarial (migración `e1f2a3b4c5d6`). Se expone en
  `GET /admin/dashboard/get-company/{id}`, `GET /admin/dashboard/get-companies`
  y `GET /company/dashboard/my-profile`; se limpia al aprobar o al reemplazar
  el certificado.
- `PUT /company/certificate`: la empresa autenticada (rol `company`, JWT normal
  de `/auth/login-user`) reemplaza su certificado en PDF mientras esté
  `REJECTED`. Sube el archivo con el `NasService` existente, borra el PDF
  anterior de MinIO, vuelve el estado a `PENDING` y limpia `rejection_reason`.
  No aprueba la empresa automáticamente ni acepta un `company_id`: la empresa
  se resuelve siempre desde el token, así que no puede tocar el certificado de
  otra. Con `PENDING` o `APPROVED` responde `409` (`COMPANY_PENDING` /
  `COMPANY_APPROVED`); con un archivo que no sea PDF, `400 INVALID_FILE`.
- `PATCH /admin/dashboard/companies/certificate/status/{id}` ahora exige
  `reason` cuando `status=rejected` (`400 MISSING_REQUIRED_FIELD` si falta o
  viene vacío) y lo adjunta al correo `EmailCertificateRejected` y al registro
  de `AdminActivity`.
### Fixed
- `LoginService`: una empresa con certificado `REJECTED` ya puede iniciar
  sesión con el flujo normal (correo + contraseña → JWT normal). Antes el
  login se bloqueaba con `403 COMPANY_REJECTED` sin emitir token, por lo que la
  empresa no tenía forma de consultar el motivo del rechazo ni de reemplazar
  el certificado. `PENDING` se sigue bloqueando igual que antes.

## [2.4] - 2026-08-29
### Added
- Búsqueda difusa de productos con PostgreSQL `pg_trgm` + `unaccent`, función
  `rehni_search_norm` e índice GIN (migración `a1b2c3d4e5f6`).
- Impuesto por producto: campo `applies_tax` (migración `f2b7c4e91a05`); el IVA
  del 19 % se aplica solo a las líneas marcadas.
- Módulo de transportadoras y envío de pedidos: catálogo de transportadoras
  (Admin/Owner), asignación de transportadora + guía por la Empresa al despachar,
  y enlace de seguimiento para el comprador (migración `e7a1c9d24b30`,
  `ShippingCarrierRouter`).
- Secciones "Ofertas" y "Novedades" del catálogo público
  (`GET /public/products/offers|new`).
- Anuncios del Home como banners **solo visuales** (se eliminaron título,
  descripción y texto de botón — migración `d4e5f6a7b8c9`).
- `suspension_reason` en `Company`: el motivo de suspensión se adjunta al error
  `COMPANY_SUSPENDED`.
### Changed
- Arquitectura de variantes: de "variantes de color" a **atributos genéricos por
  categoría** (ejes de variante + especificaciones), con generación de la matriz
  de combinaciones y `combo_key` determinista (migraciones `a90540bebea`,
  `b6f8fd31fbe`, `048871b47f63`).
- El pedido guarda un **snapshot congelado** de los atributos de la variante
  comprada (`order_items.attributes_snapshot`, migración `cb6d38ee0bd`).
- Imagen de tarjeta/detalle = primera imagen de la primera variante viva;
  `Product.price`/`stock` reflejan la variante viva más barata.
### Fixed
- `NasService`: el chequeo/creación del bucket de MinIO se movió del import de
  módulo al `lifespan` de FastAPI (`ensure_bucket()`), para que importar no haga
  I/O de red (rompía la colección de `pytest` y cualquier `import app.main` fuera
  de la red de Docker).
- Verificación de correo: el código se `commit()`ea antes de responder
  `EMAIL_NOT_VERIFIED` (antes lo revertía `get_db()` y el código nunca coincidía).

## [2.3] - 2026-08-29
### Added
- Suite de pruebas automatizadas en `tests/` (7 archivos, 113 funciones `test_`)
  con `pytest` + `pytest-cov` contra una base PostgreSQL real `rehnimarket_test`
  (`conftest.py`).
### Changed
- Reserva de stock en el checkout: `UPDATE ... WHERE stock >= qty` atómico por
  línea, orden determinista para evitar *deadlocks*, `SELECT ... FOR UPDATE`
  sobre la billetera y `rollback` total ante fallo.

## [2.2] - 2026-08-28
### Added
- Billetera RehniCoin: saldo, movimientos, cobro en checkout, reembolso al
  suspender una empresa; recarga administrativa (`POST /admin/wallet/recharge`)
  y solicitud de recarga del usuario vía WhatsApp.
- Reseñas condicionadas a compra entregada; reportes de producto/empresa.
- Liquidaciones a empresas con comisión del 5 % (`PayoutConfig`,
  `AdminPayoutRouter`, `CompanyPayoutRouter`).

## [2.1] - 2026-08-28
### Added
- Carrito, checkout, pedidos, direcciones y favoritos (backend + web).
- Panel de comprador y panel de administración (estadísticas, empresas,
  usuarios, catálogo, anuncios).

## [2.0] - 2026-08-27
### Changed
- Reestructuración mayor del backend a arquitectura por capas
  (router -> service -> repository -> model) y organización del frontend por
  *features*. ~301 archivos afectados.

## [1.3.1] - 2026-08-17
### Changed
- Renombrado del proyecto de **Lubix** a **RehniMarket**.

---

## [1.1.2] - 2026-06-19
- Endpoints de dashboard de empresa: `GET /company/dashboard/me`,
  `PATCH /company/dashboard/my-profile`, `PATCH /company/dashboard/upgrade-my-profile`.

## [1.1.1b] - 2026-06-18
- Lógica inicial de dashboard de comprador y vendedor.

## [1.1.1] - 2026-06-16
### Added
- Modelos ORM (`company`, `products`, `catalog`) y su esquema relacional con `Users`.
- Autenticación JWT (access + refresh token); roles `admin`, `company`, `user`.
- Seed para entrega de producción.
### Changed
- `ModelEventToken` -> `ModelRefreshToken`.
- `try/except` + `database.rollback()` en el registro de usuario y empresa.
### Security
- Validación de tokens JWT en endpoints protegidos.
- Auditoría de dependencias con `pip-audit` sin vulnerabilidad crítica.

## [1.1.0] - 2026-06-02
### Added
- Integración de **MinIO** para el almacenamiento de archivos.
- **pip-audit** para auditoría de vulnerabilidades (CVE).
- `uv.lock` para versiones reproducibles.
- Configuración funcional de Docker.
### Changed
- Migración del gestor de paquetes **pip** a **uv**; `requirements.txt` -> `pyproject.toml`.
