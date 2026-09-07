# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

> El proyecto nació con el nombre interno **"Lubix"** (versiones 1.1.x). A partir
> de agosto de 2026 pasó a llamarse **RehniMarket**. Las entradas 1.3.x y 2.x
> reflejan el estado real del repositorio (ramas y commits `ver 2.x`).

---

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
