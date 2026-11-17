# Backlog final — RehniMarket (cierre S9)

> Para T7-2 («backlog final con % de requisitos completados frente al SRS») y `bc-asesoria-proyecto` S9 §2.
> Fecha de verificación: 17/11/2026, sobre `main` y producción (v1.0.1).

**Fuente oficial:** la matriz de 31 RF (09/10/2026) y los 28 RNF del 16/10/2026, transcritos en
[`docs/requisitos/requisitos.md`](requisitos/requisitos.md). No se agregó ni se quitó ningún requisito.

> **Nota:** el informe de diseño del 17/10/2026 cita una descomposición en 148 RF atómicos (RF-001 a RF-148, `Requisitos-Funcionales.md`). Es un borrador anterior; la fuente oficial es la matriz de 31 RF.

**Estados.** *Hecho*: el comportamiento existe y hay evidencia (endpoint, pantalla y, cuando existe, prueba automática y commit o PR). *Hecho (requisito ajustado)*: implementado según una decisión de diseño que cambia el requisito original, pendiente de validar con el instructor (ver «Control de cambios»). *Parcial*: falta algún escenario. *Pendiente de medir*: RNF sin la prueba o medición que exige su propio método de verificación.

**Prioridad.** Ninguna fuente la define; se asignó en el cierre con este criterio: **Alta** = autenticación, seguridad, dinero y compra; **Media** = gestión (catálogo, pedidos, cuentas, perfil, plataforma); **Baja** = complementos (favoritos, reseñas, anuncios, estadísticas, retorno al contexto).

**Evidencia** (columna): endpoint · pantalla · prueba · commit o PR. «—» en pruebas = sin prueba automática (deuda en #78). Las funcionalidades se construyeron entre julio y septiembre antes del flujo por PR (desde el 22/10/2026): el commit es el que las introdujo.

## Resumen

| | Total | Hecho | Hecho (ajustado) | Parcial | Pendiente de medir | % sin ajustes | % con ajustes |
|---|---|---|---|---|---|---|---|
| RF | 31 | 27 | 3 | 1 | — | **87,1 %** | **96,8 %** |
| RNF | 28 | 26 | — | — | 2 | **92,9 %** | **92,9 %** |
| **Total** | 59 | 53 | 3 | 1 | 2 | **89,8 %** | **94,9 %** |

*Sin ajustes* cuenta solo «Hecho»; *con ajustes* suma los tres «Hecho (requisito ajustado)». RNF-029 a RNF-031 (cliente móvil) quedan fuera de alcance y no se cuentan.

## Requisitos funcionales

| ID | Requisito | Tipo | Prioridad | Estado | Evidencia | Observación |
|---|---|---|---|---|---|---|
| RF-01 | Registro de usuarios | RF | Alta | Hecho | `POST /auth/register-user` · `/register-user` · `test_register_validation.py`, `RegisterUser.test.tsx`, AC-AUTH-01 · `def39ce`, PR #3 | — |
| RF-02 | Registro de empresa | RF | Alta | Hecho | `POST /auth/register-company`; `is_verified` público solo con certificado aprobado (`publicService/Company.py`) · `/register-company` · `test_register_validation.py`, `test_certification_flow.py`, `RegisterCompany.test.tsx` · `def39ce`, PR #3 | Validaciones H-02 (#33) y H-03 (#34) abiertas como `xfail` |
| RF-03 | Verificación de correo electrónico | RF | Alta | Hecho | `/auth/verify-email-user`, `/auth/resend-verification-code`, `/auth/change-email`; login rechaza cuentas sin verificar · `/verify-email` · AC-AUTH-04, AC-AUTH-06, AC-AUTH-07a · `def39ce` | Sin prueba automática de backend (#78) |
| RF-04 | Inicio de sesión | RF | Alta | Hecho | `POST /auth/login-user` (error único sin revelar el dato) · `/login` · `test_certification_flow.py`, `Login.test.tsx`, AC-AUTH-07, AC-AUTH-12b · `def39ce`, PR #58 | — |
| RF-05 | Recuperación de contraseña | RF | Alta | Hecho | `/auth/forgot-password-user`, `/auth/reset-password-user` · `/forgot-password`, `/reset-password` · — · `def39ce` | Sin prueba automática (#78) |
| RF-06 | Retorno al contexto tras iniciar sesión | RF | Baja | Parcial | `RequireAuth.tsx` guarda la ruta (`setPostLoginRedirect`) y `Login` vuelve a ella · `Login.test.tsx` («respeta un deep link»), `RequireAuth.test.tsx` · `3b592e0` | Escenario 6: no muestra «acceso denegado»; redirige en silencio a la sección del rol (#75, 2 h) |
| RF-07 | Cierre de sesión | RF | Alta | Hecho | `logout()` en `ProfileDropdown.tsx` y `Sidebar.tsx`; borra los tokens · `AuthProvider.test.tsx` · `def39ce` | JWT sin estado: el cierre es del lado del cliente |
| RF-08 | Gestión de la cuenta personal | RF | Media | Hecho | `GET/PATCH /auth/me`, `PATCH /auth/me/photo` · «Configuración de cuenta» (`AccountSettings.tsx`) · `test_auth_authorization.py` · `07839d5` | El cambio de contraseña envía un código al correo de la cuenta y usa `/reset-password` |
| RF-09 | Exploración y búsqueda del catálogo público | RF | Media | Hecho | `GET /public/products` (`search`, `catalog_id`, `min_price`/`max_price`, `discount`, `in_stock`, `sort`), `/public/catalogs`, `/public/advertisements` · `/`, `/products`, `/categories` · `test_product_search.py`, `test_offers_and_new.py`, AC-CAT-02, AC-CAT-03 · `7e5c726` | — |
| RF-10 | Consulta del detalle de un producto | RF | Media | Hecho | `GET /public/products/{id}`, `/reviews`; variantes con imagen, precio y stock · `/products/:id`, `ScrollToTop` · `test_public_and_commerce.py`, `test_advertisements.py` · `07839d5` | — |
| RF-11 | Consulta del perfil público de una empresa | RF | Media | Hecho | `/public/company/{id}`, `/rating`, `/products` (paginado) · `/company/:companyId` · — · `07839d5` | Sin prueba automática (#78) |
| RF-12 | Gestión de productos favoritos | RF | Baja | Hecho | `GET/POST/DELETE /favorites`, solo rol comprador (`_require_buyer`) · panel comprador «Favoritos» · — · `07839d5` | Sin prueba automática (#78) |
| RF-13 | Gestión del carrito de compras | RF | Alta | Hecho | `/cart`, `/cart/add`, `/cart/item/{id}`, `/cart/clear` · `/cart` · `test_public_and_commerce.py`, `test_order_cancel_refund.py` · `07839d5` | — |
| RF-14 | Compra con pago en RehniCoins | RF | Alta | Hecho | `POST /checkout`: dirección obligatoria, IVA 19 % (`core/TaxConfig.py`), saldo y stock, un pedido por empresa · `/checkout` · `test_public_and_commerce.py`, `test_order_cancel_refund.py`, AC-CHK-05, AC-CHK-06 · `07839d5` | El IVA aplica a productos con `applies_tax` (decisión abierta P-09 de la matriz) |
| RF-15 | Consulta y cancelación de pedidos | RF | Alta | Hecho | `GET /orders`, `/orders/{id}`, `PATCH /orders/{id}/cancel` (solo pendiente o pagado) · panel comprador «Pedidos» · `test_order_cancel_refund.py`, AC-ORD-01 · `07839d5` | La cancelación también reembolsa (fuera de la matriz, P-03) |
| RF-16 | Reseñas de productos comprados | RF | Baja | Hecho | `/reviews/eligibility/{id}` (pedido entregado), `POST/PATCH/DELETE /reviews`, `REVIEW_ALREADY_EXISTS` · detalle de producto · — · `07839d5` | Sin prueba automática (#78); además permite editar (P-05) |
| RF-17 | Consulta de saldo y movimientos de RehniCoins | RF | Alta | Hecho | `GET /wallet/me`, `/wallet/transactions` paginado (recarga, compra, reembolso, ajuste) · panel comprador «Billetera» · `test_wallet_admin.py` · `07839d5` | — |
| RF-18 | Solicitud de recarga de RehniCoins | RF | Alta | Hecho | `RechargeRequestModal.tsx` + `buildRechargeWhatsappUrl` (número de `VITE_REHNIMARKET_WHATSAPP`); no acredita saldo · panel comprador «Billetera» · AC-SEC · `3b592e0` | — |
| RF-19 | Gestión de direcciones de envío | RF | Media | Hecho | `/addresses` (crear, editar, borrar, `set-default`) · panel comprador «Direcciones» · `test_addresses.py` · `07839d5`, PR #11 | — |
| RF-20 | Gestión del perfil de la empresa | RF | Media | Hecho | `/company/dashboard/my-profile`, `upgrade-my-profile`, `patch-media-logo-banner`; estado de verificación solo lectura · panel empresa «Perfil» · `test_certification_flow.py` · `71b1c82` | — |
| RF-21 | Publicación y gestión de productos | RF | Media | Hecho | `create-product`, `update-my-product`, `change-status-my-product`, `delete-my-product`, variantes, imágenes, descuento y especificaciones · panel empresa «Productos» · `test_variants.py`, `test_catalog_attributes.py`, `test_public_and_commerce.py`, `test_offers_and_new.py` · `1fa813c` | Escenario 7 (ownership) sin prueba automática (#78) |
| RF-22 | Gestión de pedidos recibidos | RF | Media | Hecho | `/company/dashboard/orders`, `status-counts`, `{id}`, `{id}/status` · panel empresa «Pedidos» · — · `07839d5` | Transiciones de estado sin prueba automática (#78) |
| RF-23 | Gestión de cuentas bancarias y finanzas | RF | Alta | Hecho | `/company/bank-accounts` (predeterminada), `/company/balance`, `/company/payouts`; la liquidación exige cuenta predeterminada (`PayoutService.py`) · panel empresa «Finanzas» · `test_bank_accounts.py`, `test_payouts.py` · `3b592e0`, PR #11 | — |
| RF-24 | Gestión de cuentas de usuario | RF | Media | Hecho (requisito ajustado) | `get-users`, `get-user`, `update-information`, `update-information/status` · panel admin «Usuarios» · `test_auth_authorization.py`, `test_single_owner.py` · `80262e5`, PR #55 | Desactivación en lugar de borrado (#73); ver «Control de cambios» |
| RF-25 | Gestión de empresas registradas | RF | Media | Hecho | `get-companies`, `get-company`, `companies/certificate/status`, `company/status` · panel admin «Empresas» · `test_certification_flow.py`, `CertificateReviewModal.test.tsx`, `CompanyDetailModal.test.tsx` · `80262e5` | Suspender una empresa cancela y reembolsa sus pedidos (fuera de la matriz, P-04) |
| RF-26 | Gestión del catálogo de la plataforma | RF | Media | Hecho | Categorías (CRUD y estado), especificaciones, colores y atributos de catálogo · panel admin «Productos» · `test_catalog_attributes.py`, `test_variants.py` · `4793cf7` | — |
| RF-27 | Gestión de anuncios de la página de inicio | RF | Baja | Hecho (requisito ajustado) | `create/update/change-status/delete-advertisement`; `/public/advertisements` solo activos · panel admin «Hero» · `test_advertisements.py` · `22311f4`, `7e5c726` | Anuncios solo visuales, sin texto (#74); ver «Control de cambios» |
| RF-28 | Generación y administración de liquidaciones | RF | Alta | Hecho | `/admin/payouts` (vista previa, generar, listar, pagar), exclusivo del owner (`_require_owner`) · panel admin «Liquidaciones» (solo owner) · `test_payouts.py` · `3b592e0`, PR #11 | Actor = Owner (decisión P-02 de la matriz) |
| RF-29 | Recarga de RehniCoins a un usuario | RF | Alta | Hecho | `POST /admin/wallet/recharge`, `/history`, `/{id}/correction` · `RechargeWalletModal.tsx` · `test_wallet_admin.py`, `RechargeWalletModal.test.tsx`, `CorrectRechargeModal.test.tsx` · `07839d5` | — |
| RF-30 | Panel de estadísticas de la plataforma | RF | Baja | Hecho | `/admin/dashboard/statistics`, `recent-activities`, `recent-users` · panel admin «Inicio» · — · `80262e5` | Sin prueba automática (#78) |
| RF-31 | Administración de cuentas Owner | RF | Alta | Hecho (requisito ajustado) | Un único owner: índice único y triggers en PostgreSQL, 403 en la API, panel sin la opción · `deploy/OWNER.md` · `test_single_owner.py`, `test_crear_owner_sql.py` · PR #55 | Escenarios 1 y 2 reemplazados por el único owner (#72, #54); ver «Control de cambios» |

## Requisitos no funcionales

| ID | Requisito | Tipo | Prioridad | Estado | Evidencia | Observación |
|---|---|---|---|---|---|---|
| RNF-001 | Autenticación basada en JWT (Access Token + Refresh Token) | RNF · Seguridad | Alta | Hecho | `tests/test_jwt.py` (22: vencido, firma alterada, `alg none`, HS512, sin `sub`, refresh), `test_auth_authorization.py`; PyJWT con HS256 fijo (PR #58) | — |
| RNF-002 | Renovación silenciosa de sesión | RNF · Seguridad | Media | Pendiente de medir | Backend probado (`test_jwt.py::TestRefreshToken`); el interceptor del cliente (`src/api/setupAuthInterceptor.ts`) no tiene prueba (#76, 3 h) | — |
| RNF-003 | Autorización centralizada por rol y ruta | RNF · Seguridad | Alta | Hecho | `test_auth_authorization.py` (12), `RequireAuth.test.tsx`, AC-AUTH-17, AC-AUTH-17b, AC-SEC (`acceptance_smoke.sh`: 28 pasan) | — |
| RNF-004 | Verificación de pertenencia de los recursos | RNF · Seguridad | Alta | Hecho | Filtros por `user_id`/`company_id` en servicios y repositorios; `test_addresses.py` (dirección ajena), `test_single_owner.py` | — |
| RNF-005 | Protección de contraseñas | RNF · Seguridad | Alta | Hecho | bcrypt con passlib (`app/utils/Security.py`); `test_crear_owner_sql.py` verifica el hash al iniciar sesión | — |
| RNF-006 | Verificación obligatoria del correo electrónico | RNF · Seguridad | Alta | Hecho | AC-AUTH-07a: login sin verificar → `EMAIL_NOT_VERIFIED`, sin tokens | — |
| RNF-007 | Recuperación segura de contraseña mediante código de un solo uso | RNF · Seguridad | Alta | Hecho | Revisión de código (método del RNF): código temporal de 5 min, un solo uso, borrado tras usarse (`email/CodeService.py`). Sin prueba automática (#78) | — |
| RNF-008 | Secretos y credenciales fuera del código fuente | RNF · Seguridad | Alta | Hecho | `.env` fuera de Git, plantillas sin secretos; revisión del historial sin secretos reales (16/11/2026); job `auditoria` | — |
| RNF-009 | Almacenamiento seguro de sesión en el cliente móvil | RNF · Seguridad | Alta | Hecho | SecureStore en `RehniMarket-mobile/src/api/session.ts` | — |
| RNF-010 | Restricción de acciones administrativas sensibles | RNF · Seguridad | Alta | Hecho | Más estricto que el RNF: nadie asigna ni modifica el owner por la API (`test_single_owner.py`, PR #55) | — |
| RNF-011 | Paginación en listados de alto volumen | RNF · Rendimiento | Media | Hecho | Respuestas paginadas con página, límite y total; `limit` acotado (p. ej. `le=48` en `/public/products`) | — |
| RNF-012 | Consultas agrupadas para contadores | RNF · Rendimiento | Media | Hecho | `OrderRepository.count_company_orders_by_status` y `ReviewRepository` con `GROUP BY` | — |
| RNF-013 | Contrato consistente de errores entre backend y frontend | RNF · Usabilidad | Media | Hecho | Catálogo `ErrorCodes` compartido; contrato 422 (PR #3); `schemas.test.ts`, AC-* con `detail.code` | — |
| RNF-014 | Restauración del contexto después del inicio de sesión | RNF · Usabilidad | Media | Hecho | `RequireAuth.tsx` + `Login.test.tsx` («respeta un deep link») | — |
| RNF-015 | Verificación de salud del backend y conectividad | RNF · Disponibilidad | Alta | Hecho | `/health/database` sin autenticación; `verificar-redes.sh` en producción: 41 pasan (`docs/evidencias/verificacion-redes-produccion-2026-11-17.txt`) | — |
| RNF-016 | Reinicio automático de los servicios ante fallos | RNF · Confiabilidad | Alta | Hecho | `restart: unless-stopped` en los 5 servicios; reinicio del backend sin 502 (`verificar-redes.sh`) | — |
| RNF-017 | Atomicidad e idempotencia en operaciones financieras críticas | RNF · Confiabilidad | Alta | Hecho | `test_order_cancel_refund.py`, índice único parcial de reembolso (migración `c3d5e7f9a1b2`), `test_payouts.py` | — |
| RNF-018 | Arquitectura en capas consistente | RNF · Mantenibilidad | Media | Hecho | Capas `routers/` → `services/` → `repository/` → `models/` en todo el backend | — |
| RNF-019 | Control de versiones del esquema de base de datos | RNF · Mantenibilidad | Media | Hecho | 17 migraciones; `head` `d7e3f1a9c5b2` en producción; el CI aplica `alembic upgrade head` en cada PR | — |
| RNF-020 | Auditoría de vulnerabilidades de dependencias | RNF · Mantenibilidad | Alta | Hecho | Job `auditoria` del CI (pip-audit y `pnpm audit --prod --audit-level=high`); 0 avisos en v1.0.1 (PR #58, `docs/calidad/auditoria-dependencias-2026-11-16.md`) | — |
| RNF-021 | Servicios desacoplados y escalables independientemente | RNF · Escalabilidad | Media | Hecho | Servicios separados con volúmenes propios; reinicio del backend sin pérdida de datos (`verificar-redes.sh`) | — |
| RNF-022 | Almacenamiento independiente de archivos | RNF · Portabilidad | Media | Hecho | Volumen `minio_data`; restauración medida en el plan de implantación §3.5 | — |
| RNF-023 | Configuración externalizada por entorno | RNF · Portabilidad | Media | Hecho | Un solo `.env` (`.env.example` y `deploy/env.prod.example`); clon limpio y producción sin cambiar código (PR #50, #51) | — |
| RNF-024 | Compilación y verificación del frontend web | RNF · Compatibilidad | Media | Hecho | Job `frontend` del CI: `pnpm typecheck` (tsc) y `pnpm lint:ci` en cada PR | — |
| RNF-025 | Interfaz web adaptable a diferentes tamaños de pantalla | RNF · Compatibilidad | Baja | Pendiente de medir | Breakpoints `sm:`/`md:`/`lg:` en el código; falta la prueba visual en 360–1440 px (#77, 3 h) | — |
| RNF-026 | Levantamiento completo del sistema mediante un solo comando | RNF · Despliegue | Media | Hecho | `docker compose up -d --wait`: 5 servicios `healthy` en clon limpio y en producción (Azure) | — |
| RNF-027 | Verificación estática del backend | RNF · Calidad | Media | Hecho | ruff en el job `backend` del CI (más amplio que `py_compile`); la suite carga todos los mappers | — |
| RNF-028 | Suite de pruebas automatizadas | RNF · Calidad | Media | Hecho | 376 pruebas de pytest en el CI, dos runs verdes seguidos por PR (#55, #58, #70) | — |

### Fuera de alcance

| ID | Requisito | Estado | Motivo |
|---|---|---|---|
| RNF-029 | Ejecución del cliente móvil sobre Android e iOS | Fuera de alcance (cliente móvil) | La versión del 16/10/2026 los quita: la app móvil no forma parte de la entrega |
| RNF-030 | Adaptación del cliente móvil a distintos anchos de pantalla de teléfono | Fuera de alcance (cliente móvil) | La versión del 16/10/2026 los quita: la app móvil no forma parte de la entrega |
| RNF-031 | Diseño diferenciado para tablet | Fuera de alcance (cliente móvil) | La versión del 16/10/2026 los quita: la app móvil no forma parte de la entrega |

## Control de cambios de requisitos

El `.xlsx` original no se modifica. Mientras no estén validados, cuentan como «Hecho (requisito ajustado)».

| ID | Versión anterior (matriz del 09/10/2026) | Versión nueva | Motivo | Fecha | Issue / PR | Validación |
|---|---|---|---|---|---|---|
| RF-31 | El Owner puede asignar el rol Owner a otra cuenta y modificar, bloquear o desbloquear otras cuentas Owner (escenarios 1 y 2). | Un único owner, creado desde PostgreSQL; nadie asigna ni modifica el rol owner por la API. Se mantienen los escenarios 3 y 4. | Seguridad: el rol de mayor privilegio no debe poder multiplicarse por la API (B-06). Garantía en base de datos, backend y panel. | 17/11/2026 | #54, #72, PR #55 | Pendiente de validar con el instructor |
| RF-24 | El administrador puede eliminar una cuenta de usuario (escenario 3). | Las cuentas se desactivan (bloqueo) y no se borran. | Conservar pedidos, billetera, movimientos de RehniCoins y reseñas de la cuenta (decisión abierta P-11 de la matriz). | 10/08/2026 (`80262e5`) | #73 | Pendiente de validar con el instructor |
| RF-27 | Anuncios con imagen, texto y enlace. | Anuncios solo visuales: imágenes de escritorio y móvil, enlace y segmentación, sin título ni descripción. | El texto va dentro del banner; los campos aparte duplicaban contenido (decisión abierta P-01 de la matriz). | 29/08/2026 (`7e5c726`, migración `d4e5f6a7b8c9`) | #74 | Pendiente de validar con el instructor |

## Deuda priorizada para el hand-off

| Prioridad | Issue | Requisito | Qué falta | Estimación | Cuándo |
|---|---|---|---|---|---|
| Alta | #72 | RF-31 | Validar con el instructor el único owner | — | Antes de la sustentación |
| Media | #73 | RF-24 | Validar con el instructor la desactivación en lugar del borrado | — | Antes de la sustentación |
| Baja | #74 | RF-27 | Validar con el instructor los anuncios solo visuales | — | Antes de la sustentación |
| Media | #76 | RNF-002 | Pruebas de Vitest del interceptor de renovación de sesión | 3 h | Semana del 17/11 |
| Baja | #75 | RF-06 | Mensaje de acceso denegado en `RequireAuth` y su prueba | 2 h | Semana del 17/11 |
| Baja | #77 | RNF-025 | Prueba visual en 360, 768, 1024 y 1440 px, con evidencia | 3 h | Semana del 17/11 |
| Media | #78 | RF-03, 05, 11, 12, 16, 22, 30 y ownership de RF-21 | Pruebas automáticas de backend de requisitos ya implementados | 8–10 h | Después de la entrega |
| Media | — | Hojas «Pendientes» de la matriz | Decisiones abiertas sin issue (P-02 actor de liquidaciones, P-05 edición de reseñas, P-09 alcance del IVA, P-10 comisión y periodo, entre otras) | — | Con el instructor |

## Funcionalidad construida fuera de la matriz

No está en ningún RF de la matriz y **no se cuenta en el avance**. La propia matriz la registra como posibles requisitos faltantes (hoja «Pendientes»).

| Funcionalidad | Pendiente de la matriz | Evidencia |
|---|---|---|
| Reportes de contenido (comprador reporta, administración resuelve) | P-14 | `POST /reports`, `/admin/reports` |
| Transportadoras y número de guía | P-15 | `/admin/dashboard/shipping-carriers`, `PATCH /company/dashboard/orders/{id}/shipping` |
| Reembolso automático al cancelar | P-03, P-16 | `test_order_cancel_refund.py`, migración `c3d5e7f9a1b2` |
| Renovación de sesión como requisito propio | P-17 | Cubierta por RNF-001 y RNF-002 |
| Devoluciones por ítem | P-18 | `/orders/{id}/returns`, `/company/dashboard/returns`, `test_returns_flow.py` |
