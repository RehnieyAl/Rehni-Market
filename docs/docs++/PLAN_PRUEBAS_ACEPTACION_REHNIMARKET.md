# Plan de Pruebas de Aceptación — RehniMarket

> **Criterio SENA que sustenta:** Criterio 6 — *"Ejecuta pruebas de aceptación con el usuario final, realiza las capacitaciones correspondientes y diligencia el acta de entrega según los niveles de servicio acordados."*
>
> **Base del documento:** auditoría directa del código del repositorio `RehniMarket` (backend FastAPI, frontend web React/TypeScript, aplicación móvil Expo/React Native), su configuración de despliegue y la documentación interna. Todos los casos de prueba corresponden a funcionalidades **verificadas en el código actual**. Cuando una funcionalidad documentada previamente **no coincide** con el código, se toma el código como fuente y se deja constancia en la [sección 16.2](#162-inconsistencias-detectadas-entre-documentación-y-código).
>
> **Advertencia de honestidad:** a la fecha de elaboración **no se ha ejecutado una campaña formal de pruebas de aceptación con un usuario final firmada**. La mayoría de los casos figuran como **PENDIENTE DE EJECUCIÓN**, con la evidencia que debe adjuntarse. Los pocos casos marcados **VERIFICADA** lo están únicamente por una prueba automatizada realmente ejecutada (`pytest`), no por una prueba de usuario.
>
> **Vocabulario de estado de cada caso:**
> - **IMPLEMENTADA** — el flujo existe en el código y es coherente, pero no se ha probado en ejecución en este trabajo.
> - **VERIFICADA** — además de existir, se comprobó su comportamiento mediante una prueba realmente ejecutada (se indica cuál).
> - **PENDIENTE DE EJECUCIÓN** — requiere ejecución manual/entorno/usuario/dispositivo; no realizada aún.
> - **NO APLICA** — la funcionalidad no existe en ese canal o para ese rol.

---

## Tabla de contenido

1. [Información general](#1-información-general)
2. [Objetivo](#2-objetivo)
3. [Alcance](#3-alcance)
4. [Criterios de aceptación](#4-criterios-de-aceptación)
5. [Ambiente de pruebas](#5-ambiente-de-pruebas)
6. [Roles utilizados durante las pruebas](#6-roles-utilizados-durante-las-pruebas)
7. [Matriz de pruebas de aceptación](#7-matriz-de-pruebas-de-aceptación)
8. [Pruebas de casos negativos](#8-pruebas-de-casos-negativos)
9. [Pruebas responsive](#9-pruebas-responsive)
10. [Pruebas de integración](#10-pruebas-de-integración)
11. [Evidencias requeridas](#11-evidencias-requeridas)
12. [Resultados de aceptación](#12-resultados-de-aceptación)
13. [Criterios para aceptación final](#13-criterios-para-aceptación-final)
14. [Capacitación al usuario](#14-capacitación-al-usuario)
15. [Acta de entrega](#15-acta-de-entrega)
16. [Trazabilidad con requisitos](#16-trazabilidad-con-requisitos)
17. [Lecciones aprendidas](#17-lecciones-aprendidas)
18. [Conclusión](#18-conclusión)
19. [Relación con criterios SENA](#19-relación-con-criterios-sena)
20. [Checklist final para la sustentación](#20-checklist-final-para-la-sustentación)

---

## 1. Información general

| Campo | Valor |
|---|---|
| **Proyecto** | RehniMarket — plataforma de comercio electrónico *marketplace* |
| **Programa** | Tecnólogo en Análisis y Desarrollo de Software (ADSO) |
| **Trimestre** | Sexto |
| **Tipo de documento** | Plan de Pruebas de Aceptación (evidencia de Criterio 6 — Módulo de implantación / entrega) |
| **Fecha de elaboración** | 2026-08-30 |
| **Versión del documento** | 1.0 |
| **Rama del repositorio analizada** | `feature/owner` — último *commit* raíz: `917a647 ver 2.4` |
| **Componentes evaluados** | Backend (`RehniMarket-backend/`), Frontend web (`RehniMarket-frontend/`), Aplicación móvil (`RehniMarket-mobile/`) |
| **Repositorio** | `https://github.com/RehnieyAl/Rehni-Market.git` |

**Documentos relacionados del proyecto (insumos de este plan):**

| Documento | Uso |
|---|---|
| `docs/RehniMarket-HU.md` | 29 historias de usuario (HU-001 … HU-029). Fuente de trazabilidad de requisitos. |
| `docs/RehniMarket-Requisitos.docx` | Requisitos del proyecto (archivo binario — su contenido no se pudo inspeccionar en este análisis). |
| `docs/MANUAL_USUARIO_REHNIMARKET.md` | Manual de usuario final (comportamiento por rol y por canal). |
| `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` | Preparación del entorno, Docker, PostgreSQL, MinIO, variables de entorno. |
| `INFORME_CALIDAD_REHNIMARKET.md` | Evaluación ISO/IEC 25010, hallazgos, seguridad, mantenibilidad, inventario de pruebas. |
| `RehniMarket-backend/CHANGELOG.md`, `README.md` | Historia de cambios y guía de despliegue (parcialmente desactualizados — ver sección 16.2). |
| `RehniMarket-backend/app/docs/ARQUITECTURA-VARIANTES.md` | Modelo real de productos/variantes/atributos (clave para las pruebas de stock). |
| `docs/Guía de Pruebas de Integración en Software.docx`, `docs/Pruebas_Integracion_RehniMarket.xlsx` | Evidencia de planificación previa de pruebas de integración (binarios, no verificados). |

---

## 2. Objetivo

Validar que las funcionalidades principales de **RehniMarket** —tal como están implementadas en el código actual— satisfacen los requisitos funcionales del proyecto y presentan un comportamiento correcto y consistente entre el frontend web, la aplicación móvil y el backend, de modo que el sistema pueda ser **aceptado formalmente** por el usuario final mediante el acta de entrega (sección 15).

Objetivos específicos:

1. Definir una matriz de casos de prueba de aceptación cubriendo autenticación, catálogo, producto, carrito, checkout, RehniCoin, pedidos, favoritos, reseñas, direcciones, panel de empresa y panel de administración.
2. Definir explícitamente los casos negativos y de borde, con especial detalle en el **manejo real del stock** (producto base vs. variante, carrito con productos agotados, estado del botón de pago).
3. Establecer el ambiente de pruebas, los roles y los criterios de aceptación.
4. Preparar el plan de capacitación al usuario y el acta de entrega para su diligenciamiento durante la sustentación.
5. Dejar registrada la trazabilidad requisito → caso de prueba → evidencia.

---

## 3. Alcance

Solo se incluyen funcionalidades **verificadas en el código**. Un ✅ significa "existe y es verificable"; un ❌ significa "no existe en ese canal".

### 3.1 Backend (`RehniMarket-backend/`)

API REST FastAPI. Rutas agrupadas por router (`app/routers/`), lógica en `app/services/`, datos en `app/repository/` + `app/models/` (SQLAlchemy 2.0 + PostgreSQL 17), migraciones Alembic, almacenamiento de imágenes en MinIO, correo por SMTP (Gmail).

| Grupo | Endpoints verificables | Estado |
|---|---|---|
| Autenticación | `POST /auth/register-user`, `POST /auth/register-company`, `POST /auth/verify-email-user`, `POST /auth/change-email`, `POST /auth/resend-verification-code`, `POST /auth/login-user`, `POST /auth/forgot-password-user`, `POST /auth/reset-password-user`, `POST /auth/refresh`, `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/me/photo` | ✅ |
| Catálogo público | `GET /public/catalogs`, `GET /public/colors`, `GET /public/advertisements`, `GET /public/products` (con filtros `search`, `catalog_id`, `min_price`, `max_price`, `discount`, `in_stock`, `sort`, `page`, `limit`), `GET /public/products/daily`, `GET /public/products/offers`, `GET /public/products/new`, `GET /public/products/{id}`, `GET /public/products/{id}/reviews`, `GET /public/company/{id}`, `GET /public/company/{id}/products`, `GET /public/company/{id}/rating` | ✅ |
| Carrito | `GET /cart`, `POST /cart/add`, `PATCH /cart/item/{item_id}`, `DELETE /cart/item/{item_id}`, `DELETE /cart/clear` | ✅ |
| Checkout | `POST /checkout` (`{ addressId }`) | ✅ |
| Pedidos (comprador) | `GET /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/cancel` | ✅ |
| Favoritos | `GET /favorites`, `POST /favorites`, `DELETE /favorites/{product_id}` | ✅ |
| Reseñas | `GET /reviews/eligibility/{product_id}`, `POST /reviews`, `PATCH /reviews/{id}`, `DELETE /reviews/{id}` | ✅ |
| Reportes | `POST /reports` | ✅ |
| Direcciones | `GET /addresses`, `POST /addresses`, `PATCH /addresses/{id}`, `DELETE /addresses/{id}`, `PATCH /addresses/{id}/set-default` | ✅ |
| Billetera (RehniCoin) | `GET /wallet/me`, `GET /wallet/transactions` | ✅ |
| Empresa — perfil/productos | `GET /company/dashboard/me`, `PATCH /company/dashboard/my-profile`, `PATCH /company/dashboard/upgrade-my-profile`, `PATCH /company/dashboard/patch-media-logo-banner`, `POST /company/dashboard/create-product`, `GET /company/dashboard/get-my-products`, `GET /company/dashboard/products-summary`, `GET /company/dashboard/get-my-product/{id}`, `PATCH /company/dashboard/update-my-product/{id}`, `PATCH /company/dashboard/change-status-my-product/{id}`, `DELETE /company/dashboard/delete-my-product/{id}` | ✅ |
| Empresa — variantes/descuentos | `POST/GET/PATCH/DELETE /company/dashboard/products/{id}/variants[...]`, `POST /company/dashboard/products/{id}/variants/generate`, `PUT /company/dashboard/products/{id}/discount`, gestión de atributos de producto | ✅ |
| Empresa — pedidos | `GET /company/dashboard/orders`, `GET /company/dashboard/orders/status-counts`, `GET /company/dashboard/orders/{id}`, `PATCH /company/dashboard/orders/{id}/status`, `PATCH /company/dashboard/orders/{id}/shipping`, `GET /company/dashboard/shipping-carriers` | ✅ |
| Empresa — finanzas | `GET/POST/PATCH/DELETE /company/bank-accounts[...]`, `GET /company/payouts`, `GET /company/payouts/{id}`, `GET /company/balance` | ✅ |
| Administración | `GET /admin/dashboard/statistics`, `GET /admin/dashboard/recent-activities`, `GET /admin/dashboard/recent-users`, gestión de empresas (`/admin/dashboard/get-companies`, `.../get-company/{id}`, `.../companies/certificate/status/...`, `.../company/status/...`), gestión de usuarios (`/admin/dashboard/get-users`, `.../user/update-information/...`, `.../user/delete/...`), catálogo/atributos (`/admin/dashboard/catalogs/`, `/admin/dashboard/catalog-attributes`, `/admin/dashboard/catalog-attribute-options`), anuncios, reportes (`/admin/reports`), transportadoras (`/admin/dashboard/shipping-carriers`), liquidaciones (`/admin/payouts[...]`), recarga de RehniCoin (`POST /admin/wallet/recharge`, `GET /admin/wallet/history`) | ✅ |
| Salud | `GET /health/database`, `GET /health/internet` | ✅ |
| Documentación API | `GET /docs` (Swagger UI de FastAPI) | ✅ |

### 3.2 Frontend web (`RehniMarket-frontend/`)

React 19 + Vite + TypeScript + TailwindCSS. Rutas en `src/routers/AppRouter.tsx`.

| Módulo | Rutas / vistas | Estado |
|---|---|---|
| Público | `/` (Home: anuncios + categorías + ofertas + novedades), `/categories`, `/products` (con filtros y orden), `/offers`, `/new`, `/products/:id`, `/company/:companyId` (perfil público de empresa) | ✅ |
| Autenticación | `/register-user`, `/register-company`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password` | ✅ |
| Carrito / compra | `/cart`, `/checkout` (protegida) | ✅ |
| Panel Comprador | `/user/dashboard` con pestañas: Inicio, Mis pedidos, Favoritos, RehniCoins, Direcciones, Configuración de cuenta | ✅ |
| Panel Empresa | `/company/dashboard` con pestañas: Inicio, Productos, Pedidos, Finanzas, Mi tienda, Configuración de cuenta | ✅ |
| Panel Administrador/Owner | `/admin/dashboard` con pestañas: Inicio, Empresas, Usuarios, Catálogo, Anuncios, Reportes, Transportadoras, Liquidaciones, RehniCoin, Configuración de cuenta | ✅ |
| Reportar producto / empresa | Modal desde el detalle de producto y desde el perfil de empresa | ✅ |
| Reseñas | Sección "Opiniones" en el detalle del producto: ver, crear (si elegible), eliminar la propia | ✅ |

### 3.3 Aplicación móvil (`RehniMarket-mobile/`)

Expo + Expo Router + React Native. **Orientada exclusivamente a Visitante y Usuario (comprador).** Si una cuenta de Empresa/Administrador/Owner inicia sesión, la app cierra su sesión automáticamente (`src/app/(user)/_layout.tsx`).

| Módulo | Pantallas | Estado |
|---|---|---|
| Público | Inicio (tabs: Inicio, Categorías, Favoritos, Carrito, Perfil), catálogo con filtros/orden, categorías, búsqueda, ofertas, novedades, detalle de producto con selección de variante | ✅ |
| Autenticación | Login, registro **de comprador únicamente**, verificación de correo, recuperación de contraseña | ✅ (registro empresa ❌) |
| Carrito / checkout | Carrito (tab), checkout | ✅ |
| Cuenta comprador | Perfil, Configuración de cuenta, Mis pedidos + detalle, RehniCoin (saldo, movimientos, solicitud de recarga), Mis direcciones | ✅ |
| Favoritos | Tab Favoritos | ✅ |
| Perfil público de empresa | — | ❌ (solo web) |
| Listado / escritura de reseñas | — (solo se muestra la calificación promedio) | ❌ (solo web) |
| Reportar producto / empresa | — | ❌ (solo web) |
| Panel de Empresa / Administración | — | ❌ (solo web) |

---

## 4. Criterios de aceptación

Una funcionalidad se considera **aceptada** cuando, al ejecutar su caso de prueba con datos representativos:

| # | Criterio | Cómo se comprueba |
|---|---|---|
| CA-1 | **Cumple el flujo esperado.** | El resultado obtenido coincide con el "Resultado esperado" del caso. |
| CA-2 | **No produce errores críticos.** | No hay pantallas en blanco, cierres inesperados de la app, ni respuestas HTTP 5xx no controladas durante el flujo normal. |
| CA-3 | **Respeta autenticación y permisos.** | Un recurso protegido no es accesible sin sesión válida ni con un rol sin permiso (el backend responde 401/403 y el frontend redirige a login o muestra el mensaje de acceso denegado). |
| CA-4 | **Los datos mostrados corresponden al backend.** | Los valores de saldo, precio, IVA, total, stock, estado de pedido y listados provienen de la respuesta de la API; no se calculan ni simulan en el cliente. |
| CA-5 | **Las operaciones críticas muestran correctamente los errores.** | Ante saldo insuficiente, stock agotado, dirección faltante, credenciales incorrectas, etc., el sistema muestra el mensaje real del backend y **no oculta el error**. |
| CA-6 | **El sistema impide operaciones inválidas.** | No se puede comprar sin stock, sin dirección o sin saldo; no se puede acceder a datos de otro usuario/empresa; no se pueden vender unidades inexistentes (validación atómica de stock en el checkout). |
| CA-7 | **Consistencia entre canales.** | Cuando una funcionalidad existe en web y móvil, ambos consumen la misma API y el resultado de negocio es equivalente (las diferencias de UX documentadas en la sección 16.2 son aceptables). |
| CA-8 | **Persistencia.** | Carrito, favoritos, direcciones y sesión persisten en el servidor y sobreviven a recargar la página o reabrir la app. |

Estos criterios de aceptación son **funcionales**, no de rendimiento. Para rendimiento existe una **línea base básica ejecutada** (`scripts/perf_test.sh` → `evidencias/performance/resultado.txt`: 900 solicitudes, 0 errores; catálogo p95 66 ms secuencial) y una **plantilla k6 lista pero no ejecutada** (`scripts/load_test.k6.js`). **No hay SLO cuantitativos acordados**: se definen en el acta si el usuario/instructor lo requiere (ver `INFORME_CALIDAD_REHNIMARKET.md` §7.2).

---

## 5. Ambiente de pruebas

Datos tomados de `docker-compose.yml`, los `Dockerfile`, `.env.example`, `.python-version`, `package.json` y la documentación de despliegue. Lo no documentado se marca **"Por registrar"**.

| Componente | Valor / configuración | Fuente |
|---|---|---|
| **Orquestación** | Docker Compose (archivo único `docker-compose.yml`, servicios `minio`, `postgres`, `backend`, `frontend`) | `docker-compose.yml` |
| **Sistema operativo del servidor** | Linux con Docker Engine. Distribución concreta: **Por registrar**. | `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §4 |
| **Docker Engine / Compose (máquina de análisis)** | Docker 29.6.2 · Docker Compose 5.3.1 | Verificado con `docker --version` / `docker compose version` |
| **Base de datos** | PostgreSQL 17 (imagen `postgres:17-alpine`), puerto host `5434` → contenedor `5432`, volumen `postgres_rehni_data`. Extensiones `pg_trgm` y `unaccent` (migración `a1b2c3d4e5f6`). Base de datos de pruebas automatizadas: `rehnimarket_test` (creada por `tests/conftest.py`). | `docker-compose.yml`, `RehniMarket-backend/tests/conftest.py` |
| **Almacenamiento de objetos** | MinIO (`minio/minio:latest`), puerto host `9000`, bucket `uploads`, volumen `minio_rehni_data`. Consola web: puerto no mapeado (**Por registrar**). | `docker-compose.yml`, `app/services/NasService.py` |
| **Backend** | Python 3.13, FastAPI 0.135.1, Uvicorn 0.41.0, SQLAlchemy 2.0.48, Alembic 1.18.4. Se ejecuta con `uv`. URL: `http://localhost:8001` (contenedor `8000`). Migraciones automáticas al arrancar. | `RehniMarket-backend/Dockerfile`, `pyproject.toml`, `docker-compose.yml` |
| **Frontend web** | Node 22, pnpm 11.15.0, React 19, Vite 8, TypeScript 6. Servido en **modo desarrollo** (`pnpm dev`) en `http://localhost:5173`. `VITE_API_URL` apunta al backend. | `RehniMarket-frontend/Dockerfile`, `package.json`, `.env.example` |
| **Aplicación móvil** | Expo ~54 (instalado 54.0.37), React Native 0.81.5, Expo Router ~6, `expo-secure-store` para la sesión. Ejecución de prueba: `pnpm exec expo start --lan --port 8085` + escaneo del QR con **Expo Go** en Android. `EXPO_PUBLIC_API_URL` = IP del backend accesible desde el teléfono. No hay empaquetado APK configurado. | `RehniMarket-mobile/package.json`, `README.md`, `.env.example` |
| **Navegador para las pruebas web** | Navegador moderno con JavaScript habilitado. Marca/versión concreta: **Por registrar** al ejecutar. |
| **Dispositivo móvil / emulador** | Android con Expo Go. Modelo, versión de Android y resolución: **Por registrar** al ejecutar. |
| **Datos de prueba (seed)** | Con `RUN_SEED=true` el backend crea roles (`user`, `company`, `admin`, `owner`), catálogos, especificaciones, atributos de variante, transportadoras y las cuentas `admin`/`owner` por defecto (`app/utils/seed.py`). La carga de empresas/productos de ejemplo (`seed_companies_and_products`) está **comentada** en el código: los productos de prueba deben crearse manualmente desde el panel de empresa. |
| **Cuenta de correo SMTP** | Gmail con "contraseña de aplicación" (`GMAIL_USERNAME` / `GMAIL_APP_PASSWORD`). Requerida para verificación de cuenta, recuperación de contraseña y correos de pedido. **Por registrar** la cuenta usada. |
| **Número de WhatsApp para recargas** | `VITE_REHNIMARKET_WHATSAPP` / `EXPO_PUBLIC_REHNIMARKET_WHATSAPP`. **Por registrar**. |

---

## 6. Roles utilizados durante las pruebas

Roles reales del sistema (`app/middleware/RolePermissions.py`, `app/utils/seed.py`). Su alcance funcional está detallado en `docs/MANUAL_USUARIO_REHNIMARKET.md` §4.

| Rol | Cómo se obtiene la cuenta para probar | Pruebas que le corresponden |
|---|---|---|
| **Visitante** | Sin iniciar sesión (web o móvil). | Catálogo, búsqueda, categorías, ofertas, novedades, detalle de producto, perfil de empresa (web). Redirección a login al intentar carrito/favoritos/checkout. |
| **Usuario** (comprador) | Registro de comprador + verificación de correo. | Carrito, checkout, RehniCoin (consulta y solicitud de recarga), pedidos (ver, detalle, cancelar), favoritos, reseñas (web), reportes (web), direcciones, configuración de cuenta. |
| **Empresa** (vendedor) | Registro de empresa (con NIT y certificado) + verificación de correo + **aprobación de certificación por un administrador** (sin aprobación no puede iniciar sesión). Solo web. | Panel Empresa: perfil/tienda, productos y variantes, descuentos, pedidos recibidos y cambio de estado, envío/guía, finanzas (cuentas bancarias, balance, liquidaciones), configuración de cuenta. |
| **Administrador** | Cuenta creada por el *seed* (`ADMIN_DEFAULT` / `PASSWORD_DEFAULT`) o promovida por un Owner. Solo web. | Panel Administración: estadísticas, empresas (aprobar/rechazar/suspender), usuarios (editar/bloquear/eliminar), catálogo, anuncios, reportes, transportadoras, liquidaciones, recarga de RehniCoin. |
| **Owner** | Cuenta creada por el *seed* (`OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT`). Solo web. | Todo lo del Administrador **más** asignar/modificar/bloquear cuentas Owner (dentro de la vista Usuarios). Una cuenta Owner no puede ser eliminada. |

> Para probar el flujo de empresa completo se necesitan **dos cuentas** activas simultáneamente (una Empresa aprobada y una de Administrador/Owner que la apruebe), y para el flujo de compra se necesita **saldo de RehniCoin**, que solo puede acreditar un Administrador (`POST /admin/wallet/recharge`).

---

## 7. Matriz de pruebas de aceptación

**Convenciones de la matriz:**

- **Rol**: quién ejecuta el caso.
- **Canal**: W = Web, M = Móvil, B = Backend/API (Swagger o cliente HTTP).
- **Resultado obtenido / Evidencia**: "Por registrar" hasta que se ejecute la prueba.
- **Estado**: IMPLEMENTADA / VERIFICADA / PENDIENTE DE EJECUCIÓN / NO APLICA. Casi todos los casos inician en **PENDIENTE DE EJECUCIÓN**; los marcados **VERIFICADA** citan la prueba automatizada que los respalda.

Los "Pasos" se resumen; el ejecutor debe registrar el detalle y la evidencia.

### 7.1 Autenticación

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-AUTH-01 | Autenticación | Visitante | W/M | Registro de comprador exitoso | Correo no registrado | Abrir "Crear cuenta" → llenar nombre, correo, teléfono (10 díg.), contraseña + confirmación → aceptar términos → enviar | Cuenta creada en estado no verificado; se envía código al correo; redirige a verificación | Por registrar | Captura del formulario + captura de pantalla de verificación + correo recibido |
| AC-AUTH-02 | Autenticación | Visitante | W | Registro de empresa exitoso | NIT y correo no registrados; archivo de certificado disponible | Abrir "Registrar empresa" → datos comerciales + NIT + DV + certificado → enviar | Cuenta de empresa creada, no verificada, certificación pendiente; se envía código | Por registrar | Captura del formulario + confirmación + correo |
| AC-AUTH-03 | Autenticación | Visitante | M | Registro de empresa desde móvil | — | Intentar registrar empresa en la app | La opción no existe: solo hay registro de comprador | N/A | NO APLICA | — |
| AC-AUTH-04 | Autenticación | Visitante | W/M | Verificación de correo con código válido | Cuenta recién registrada; código vigente (5 min) | Ingresar el código en la pantalla de verificación | Cuenta verificada; se habilita el inicio de sesión | Por registrar | Captura de éxito de verificación |
| AC-AUTH-05 | Autenticación | Visitante | W/M | Corrección de correo antes de verificar | Cuenta no verificada | Usar "cambiar correo" → nuevo correo → reenviar código | Se reenvía el código al nuevo correo | Por registrar | Captura + correo nuevo |
| AC-AUTH-06 | Autenticación | Visitante | W/M | *Cooldown* de reenvío de código | Código solicitado hace < 60 s | Solicitar reenvío de código inmediatamente | Mensaje *"Debes esperar antes de solicitar un nuevo código de verificación."* | Por registrar | Captura del mensaje |
| AC-AUTH-07 | Autenticación | Visitante | W/M | Inicio de sesión exitoso (comprador) | Cuenta verificada | Ingresar correo + contraseña | Sesión iniciada; redirige a Home o a la pantalla previa protegida | Por registrar | Captura del Home autenticado |
| AC-AUTH-08 | Autenticación | Empresa | W | Inicio de sesión de empresa aprobada | Empresa con certificación aprobada | Ingresar credenciales | Acceso al Panel Empresa | Por registrar | Captura del panel |
| AC-AUTH-09 | Autenticación | Empresa | W | Inicio de sesión de empresa **pendiente** de certificación | Empresa verificada por correo pero certificación pendiente | Ingresar credenciales | **Bloqueado**: mensaje *"Tu empresa esta en revision"* (código `COMPANY_PENDING`) | Por registrar | Captura del mensaje |
| AC-AUTH-10 | Autenticación | Administrador/Owner | W | Inicio de sesión administrativo | Cuenta del *seed* | Ingresar credenciales | Acceso al Panel Administrador / Propietario | Por registrar | Captura del panel |
| AC-AUTH-11 | Autenticación | Usuario | W/M | Cierre de sesión | Sesión iniciada | Menú de cuenta / Perfil → "Cerrar sesión" | Sesión finalizada; las rutas protegidas vuelven a requerir login | Por registrar | Captura antes/después |
| AC-AUTH-12 | Autenticación | Visitante | W/M | Recuperación de contraseña | Cuenta existente | "¿Olvidaste tu contraseña?" → correo → recibir código → nueva contraseña en "Restablecer contraseña" | Contraseña cambiada; se puede iniciar sesión con la nueva | Por registrar | Captura + correo + login exitoso posterior |
| AC-AUTH-13 | Autenticación | Usuario | W | Cambio de contraseña con sesión iniciada | Sesión iniciada | Configuración de cuenta → "Cambiar contraseña" | Se envía código al correo y se dirige a "Restablecer contraseña" (reutiliza el flujo de recuperación) | Por registrar | Captura + correo |
| AC-AUTH-14 | Autenticación | Usuario | M | Cambio de contraseña con sesión iniciada (móvil) | Sesión iniciada | Configuración de cuenta → "Cambiar contraseña" → confirmar | Se envía código y **se cierra la sesión** para crear la nueva contraseña | Por registrar | Captura del aviso + correo |
| AC-AUTH-15 | Autenticación | Usuario | W/M | Actualización de datos de la cuenta | Sesión iniciada | Configuración de cuenta → editar nombre / teléfono / correo / foto → guardar | Cambios reflejados de inmediato (p. ej. nombre en el menú) sin re-login | Por registrar | Captura antes/después |
| AC-AUTH-16 | Autenticación | Visitante | W | Protección de ruta `/checkout` sin sesión | Sin sesión | Navegar a `/checkout` | Redirige a `/login`; tras autenticarse regresa a `/checkout` | Por registrar | Captura de la redirección |
| AC-AUTH-17 | Autenticación | Usuario | W | Protección de panel por rol | Sesión de comprador | Navegar a `/company/dashboard` o `/admin/dashboard` | Acceso denegado / redirección (el backend responde 403 para rutas de otro rol) | Por registrar | Captura |
| AC-AUTH-18 | Autenticación | Empresa/Admin | M | Bloqueo de la app móvil para roles no comprador | Sesión de empresa o admin en la app | Iniciar sesión en la app móvil | La app **cierra la sesión automáticamente** (el área de usuario no admite `role != "user"`) | Por registrar | Captura / video |
| AC-AUTH-19 | Autenticación | Usuario | W/M | Renovación de sesión (*refresh token*) | Sesión con *access token* expirado, *refresh* válido | Realizar una acción que llame a la API | La sesión se renueva de forma transparente; la acción se completa | Por registrar | Log de red (petición a `/auth/refresh`) |
| AC-AUTH-20 | Autenticación | Usuario | W/M | Sesión expirada no recuperable | *Refresh token* inválido/expirado | Realizar una acción que llame a la API | Redirección a login con aviso de sesión expirada; al reingresar vuelve a la pantalla previa | Por registrar | Captura del aviso |

### 7.2 Catálogo

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-CAT-01 | Catálogo | Visitante | W/M | Ver Home con anuncios, categorías, ofertas y novedades | Existen productos y al menos un anuncio activo | Abrir la aplicación | El Home muestra el/los banner(es), las categorías, la sección de ofertas y la de novedades | Por registrar | Captura del Home (W y M) |
| AC-CAT-02 | Catálogo | Visitante | W/M | Listado de productos | Hay productos activos | Abrir "Productos" / catálogo | Se listan tarjetas con imagen, nombre, empresa, precio actual y, si aplica, precio anterior tachado y % de descuento; con paginación | Por registrar | Captura del listado |
| AC-CAT-03 | Catálogo | Visitante | W/M | Búsqueda por nombre | Hay productos | Escribir un término en el buscador | Resultados por nombre; tolerante a tildes y a errores de escritura ("audifonos" → "audífonos") | Por registrar (VERIFICADA parcialmente: `test_product_search.py`, 15 pruebas — ejecución no verificada en este análisis) | Captura de resultados |
| AC-CAT-04 | Catálogo | Visitante | W/M | Filtrar por categoría | Hay categorías activas | Abrir "Categorías" → elegir una | Se abre el listado filtrado por esa categoría | Por registrar | Captura |
| AC-CAT-05 | Catálogo | Visitante | W/M | Filtros de precio y disponibilidad | Hay productos con distintos precios/stock | Aplicar rango de precio y/o "solo con descuento" y/o "en stock" | El listado se filtra según los parámetros (`min_price`, `max_price`, `discount`, `in_stock`) | Por registrar | Captura |
| AC-CAT-06 | Catálogo | Visitante | W/M | Ordenamiento | Hay varios productos | Cambiar "Ordenar por": menor precio / mayor precio / mayor descuento / (defecto) | El listado se reordena según el parámetro `sort` (`price_asc`, `price_desc`, `discount`, `relevance`) | Por registrar | Captura antes/después |
| AC-CAT-07 | Catálogo | Visitante | W/M | Sección Ofertas | Hay productos con descuento activo | Abrir `/offers` / pantalla Ofertas | Solo productos con descuento vigente; el precio mostrado es el mejor precio con descuento | Por registrar (VERIFICADA parcialmente: `test_offers_and_new.py`, 14 pruebas — ejecución no verificada) | Captura |
| AC-CAT-08 | Catálogo | Visitante | W/M | Sección Novedades | Hay productos recientes | Abrir `/new` / pantalla Novedades | Productos activos y con stock, del más reciente al más antiguo | Por registrar (VERIFICADA parcialmente: `test_offers_and_new.py`) | Captura |
| AC-CAT-09 | Catálogo | Visitante | W | Perfil público de empresa | Empresa con productos activos | Desde el detalle de un producto → "Ver tienda" / nombre de la empresa | Perfil con nombre, logo, estado de verificación real, calificación (promedio + n° de opiniones) y listado paginado de sus productos activos | Por registrar | Captura del perfil |
| AC-CAT-10 | Catálogo | Visitante | M | Perfil público de empresa (móvil) | — | Abrir detalle de producto → tocar la empresa | No existe pantalla de perfil de empresa en móvil (solo se muestran logo/nombre/verificación) | N/A | NO APLICA | — |
| AC-CAT-11 | Catálogo | Visitante | W/M | Scroll al abrir un detalle | Estar en un listado con scroll | Abrir un producto | La pantalla del detalle inicia desde arriba (no conserva la posición previa) | Por registrar | Video corto |

### 7.3 Producto

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-PROD-01 | Producto | Visitante | W/M | Ver detalle de producto sin variantes | Producto activo sin variantes | Abrir el detalle | Muestra categoría, nombre, calificación real (o "sin opiniones"), precio, galería, stock del **producto**, datos del vendedor | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::TestPublicProductDetail`) | Captura del detalle |
| AC-PROD-02 | Producto | Visitante | W/M | Ver detalle de producto con variantes | Producto con variantes (p. ej. color + talla) | Abrir el detalle → seleccionar una combinación de variante | Al elegir la variante se actualizan **imagen, precio y stock de esa variante** | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py`, `test_variants.py` 22 pruebas — ejecución no verificada) | Captura con dos variantes distintas |
| AC-PROD-03 | Producto | Visitante | W/M | Combinación de variante no disponible | Producto con variantes, alguna combinación sin variante | Seleccionar una combinación inexistente/agotada | Se indica que la opción no está disponible con la selección actual | Por registrar | Captura |
| AC-PROD-04 | Producto | Visitante | W/M | Precio con descuento | Producto/variante con descuento activo | Abrir el detalle | Precio actual + precio anterior tachado + % de descuento | Por registrar (VERIFICADA parcial: `test_pricing.py` 7 pruebas — ejecución no verificada) | Captura |
| AC-PROD-05 | Producto | Visitante | W/M | Indicación de IVA | Producto marcado con IVA por la empresa vs. producto sin IVA | Abrir el detalle de cada uno | Se indica si el precio incluye IVA (19%) según `applies_tax` del producto | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py`, `test_pricing.py`) | Captura de ambos |
| AC-PROD-06 | Producto | Usuario | W/M | Agregar producto sin variantes al carrito | Sesión de comprador; producto con stock | Detalle → elegir cantidad → "Agregar al carrito" | El producto queda en el carrito con la cantidad indicada | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py`) | Captura del carrito |
| AC-PROD-07 | Producto | Usuario | W/M | Agregar producto con variantes: variante obligatoria | Producto con variantes | "Agregar al carrito" sin seleccionar variante | Se impide agregar; mensaje *"Este producto requiere seleccionar una variante."* | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_cart_requires_variant_when_product_has_variants`) | Captura del mensaje |
| AC-PROD-08 | Producto | Usuario | W/M | Agregar variante específica al carrito | Producto con variantes con stock | Seleccionar variante → cantidad → agregar | La línea del carrito queda asociada a **esa variante** (nombre, color y opciones legibles) | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_cart_line_carries_variant_options_and_prices`) | Captura del carrito |
| AC-PROD-09 | Producto | Visitante | W | Reportar producto | Sesión de comprador | Detalle → "Reportar producto" → motivo + descripción + imágenes opcionales → enviar | Mensaje *"Reporte enviado. Un administrador revisará este producto."* | Por registrar | Captura del formulario y del mensaje |

### 7.4 Carrito

> **Manejo de stock — comportamiento real verificado en el código:**
> - `availableStock` de cada línea = `variant.stock` si la línea tiene variante, si no `product.stock` (`app/services/commerce/CartService.py::_to_item_response`).
> - `POST /cart/add` rechaza si `available_stock <= 0` (`PRODUCT_OUT_OF_STOCK`) o si la cantidad acumulada supera el stock (`INSUFFICIENT_STOCK`, *"Solo hay N unidades disponibles."*).
> - `PATCH /cart/item/{id}` rechaza si la nueva cantidad supera el stock (`INSUFFICIENT_STOCK`).
> - **Web:** el carrito marca cada línea como "Agotado" (stock 0) o "Sin stock suficiente" (cantidad > stock > 0); el control `+` se limita al stock; el botón **"Ir a pagar" se deshabilita** si hay al menos una línea no disponible; siempre se puede eliminar cualquier línea (`src/features/cart/components/CartView.tsx`, `src/features/cart/utils/availability.ts`).
> - **Móvil:** la línea agotada muestra *"Este producto ya no tiene stock disponible."*, el control de cantidad se limita al stock, pero el botón de pago **no** se deshabilita de forma preventiva: el servidor rechaza el checkout si se intenta (`src/screens/cart/components/CartSummary.tsx` → `checkoutDisabled={busy}`).

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-CART-01 | Carrito | Usuario | W/M | Agregar producto y verlo en el carrito | Sesión de comprador | Agregar un producto → abrir el carrito | El producto aparece con imagen, nombre, empresa, precio unitario, cantidad y subtotal de línea | Por registrar | Captura del carrito |
| AC-CART-02 | Carrito | Usuario | W/M | Aumentar cantidad respetando el stock | Línea en el carrito con stock > cantidad | Pulsar `+` | La cantidad sube en 1; el subtotal y el total se recalculan | Por registrar | Captura antes/después |
| AC-CART-03 | Carrito | Usuario | W/M | Disminuir cantidad (mínimo 1) | Línea con cantidad ≥ 2 | Pulsar `−` | La cantidad baja; no permite llegar a 0 | Por registrar | Captura |
| AC-CART-04 | Carrito | Usuario | W/M | Actualizar cantidad por encima del stock | Línea con cantidad = stock | Intentar subir por encima del stock | Se impide; el `+` queda deshabilitado / el backend responde *"Solo hay N unidades disponibles."* | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_checkout_over_stock_is_still_blocked_at_cart`) | Captura |
| AC-CART-05 | Carrito | Usuario | W/M | Eliminar un producto del carrito | ≥ 1 línea | Usar la opción eliminar de una línea | La línea desaparece; totales recalculados | Por registrar | Captura antes/después |
| AC-CART-06 | Carrito | Usuario | W/M | Vaciar el carrito | ≥ 1 línea | Usar "Vaciar carrito" | El carrito queda vacío | Por registrar | Captura |
| AC-CART-07 | Carrito | Usuario | W/M | Persistencia del carrito | ≥ 1 línea | Recargar la página / cerrar y reabrir la app | El carrito conserva las líneas (proviene de `GET /cart`) | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_add_to_cart_does_not_touch_stock`) | Captura tras recargar |
| AC-CART-08 | Carrito | Usuario | W/M | Subtotal, IVA y total | Carrito con productos, algunos con IVA y otros sin IVA | Abrir el carrito | Subtotal = Σ (precio con descuento × cantidad); IVA = 19% solo sobre líneas con IVA; si ninguna aplica, "No aplica"; Total = Subtotal + IVA. Montos del backend | Por registrar (VERIFICADA parcial: `test_pricing.py`, `test_public_and_commerce.py`) | Captura del resumen |
| AC-CART-09 | Carrito | Usuario | W | Producto que queda agotado dentro del carrito | Producto en el carrito cuyo stock bajó a 0 (p. ej. otra compra o cambio del vendedor) | Recargar el carrito | La línea se marca **"Agotado"**; el botón "Ir a pagar" se **deshabilita** | Por registrar | Captura del carrito con la etiqueta y el botón deshabilitado |
| AC-CART-10 | Carrito | Usuario | W | Producto con cantidad mayor al stock (stock > 0) | Línea con cantidad 7 y stock de la variante 5 | Abrir el carrito | La línea se marca **"Sin stock suficiente"** con "Solo quedan 5 unidades…"; el botón de pago se **deshabilita** | Por registrar | Captura |
| AC-CART-11 | Carrito | Usuario | W | Corregir la cantidad y rehabilitar el pago | Estado del caso AC-CART-10 | Pulsar `−` en esa línea hasta ≤ stock | La cantidad ajusta al máximo disponible; el botón "Ir a pagar" se **rehabilita** | Por registrar | Captura antes/después |
| AC-CART-12 | Carrito | Usuario | W | Carrito con mezcla de productos disponibles y agotados | 1 producto A con stock (cantidad válida) + 1 producto B agotado | Abrir el carrito | A sigue visible y editable; B marcado "Agotado"; botón de pago **deshabilitado**; se puede eliminar B | Por registrar | Captura |
| AC-CART-13 | Carrito | Usuario | W | Un producto agotado NO bloquea la compra de los disponibles | Estado del caso AC-CART-12 | Eliminar B → volver a revisar | Al quedar solo A (válido), el botón "Ir a pagar" se **rehabilita** y la compra de A puede continuar | Por registrar | Captura antes/después de eliminar B |
| AC-CART-14 | Carrito | Usuario | M | Producto agotado en el carrito (móvil) | Producto en el carrito con stock 0 | Abrir el carrito | La línea muestra *"Este producto ya no tiene stock disponible."*; el control de cantidad limitado; el botón de pago **no** se deshabilita de forma preventiva | Por registrar | Captura |
| AC-CART-15 | Carrito | Usuario | M | Intento de checkout con agotado (móvil) | Estado del caso AC-CART-14 | Ir a checkout e intentar confirmar | El servidor rechaza; se muestra el mensaje de stock; **no se cobra**; conviene eliminar la línea | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_checkout_rejected_when_stock_drops_below_cart_and_nothing_persists`) | Captura del mensaje |
| AC-CART-16 | Carrito | Usuario | W/M | Stock de producto base vs. stock de variante | Producto P con `product.stock` alto pero variante V con stock bajo | Agregar V al carrito y probar cantidades | La validación usa el stock de **V**, no el de P | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_checkout_only_touches_the_selected_variant`) | Captura + datos de stock |

### 7.5 Checkout

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-CHK-01 | Checkout | Usuario | W/M | Checkout sin dirección registrada | Cuenta sin direcciones; carrito con productos | Ir a checkout | Se abre el formulario para agregar dirección antes de continuar; respaldo del backend: *"Debes registrar una dirección para continuar con la compra."* | Por registrar | Captura |
| AC-CHK-02 | Checkout | Usuario | W/M | Crear dirección durante el checkout | Carrito con productos | Agregar dirección (etiqueta, nombre, teléfono, dirección, ciudad, departamento) → continuar | La dirección se crea y queda seleccionada | Por registrar | Captura |
| AC-CHK-03 | Checkout | Usuario | W/M | Selección de dirección predeterminada | Cuenta con ≥ 2 direcciones, una predeterminada | Ir a checkout | Se preselecciona la dirección predeterminada; se puede cambiar | Por registrar | Captura |
| AC-CHK-04 | Checkout | Usuario | W/M | Resumen: subtotal, IVA y total | Carrito con líneas con y sin IVA | Ver el resumen del checkout | Subtotal, IVA (19% solo líneas con IVA) y Total calculados por el backend con la misma regla que el carrito | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_checkout_recomputes_price_and_snapshots_attributes`) | Captura del resumen |
| AC-CHK-05 | Checkout | Usuario | W/M | Saldo de RehniCoin suficiente | Saldo ≥ total | Confirmar la compra | Compra confirmada; carrito vaciado; saldo descontado; se genera un pedido por empresa | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py` — flujo de checkout) | Captura de la pantalla de éxito + pedido + saldo |
| AC-CHK-06 | Checkout | Usuario | W/M | Saldo de RehniCoin insuficiente | Saldo < total | Ir al checkout | Aviso *"Tu saldo no alcanza para esta compra"* con enlace a recargar; botón "Confirmar compra" **deshabilitado**; si se fuerza, el backend responde *"Tu saldo de RehniCoin no alcanza para completar la compra."* | Por registrar | Captura del aviso y del botón deshabilitado |
| AC-CHK-07 | Checkout | Usuario | W/M | Compra con productos de varias empresas | Carrito con productos de 2+ empresas; saldo suficiente | Confirmar la compra | Se generan **2+ pedidos** (uno por empresa); un correo "Pedido recibido" por pedido | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py` agrupa por empresa) | Captura de "Mis pedidos" con varios pedidos |
| AC-CHK-08 | Checkout | Usuario | W/M | Reserva atómica de stock en el checkout | Producto con stock exacto = cantidad del carrito | Confirmar la compra | El stock del producto/variante queda en 0; la compra se completa | Por registrar (**VERIFICADA**: `test_public_and_commerce.py::test_checkout_exact_stock_lands_on_zero` — 21 passed, ejecutado 2026-08-30) | Consulta de stock antes/después |
| AC-CHK-09 | Checkout | Usuario | W/M | Descuento de solo la cantidad comprada | Producto con stock 5, se compran 2 | Confirmar la compra | El stock queda en 3 (no en 0) | Por registrar (**VERIFICADA**: `test_public_and_commerce.py::test_checkout_decrements_only_the_bought_quantity`) | Consulta de stock |
| AC-CHK-10 | Checkout | Usuario | W/M | Stock cambia entre la carga del carrito y el pago | Carrito con cantidad 5; el stock real baja a 2 antes de confirmar | Confirmar la compra | El backend rechaza: *"'{producto}' ya no tiene suficiente stock disponible."*; **rollback total** (sin pedido, sin cobro); el carrito se recarga; el mensaje se muestra | Por registrar (**VERIFICADA**: `test_public_and_commerce.py::test_checkout_rejected_when_stock_drops_below_cart_and_nothing_persists`) | Captura del mensaje + verificación de que no hay pedido ni cobro |
| AC-CHK-11 | Checkout | Usuario | W/M | Concurrencia: dos compradores por la última unidad | Producto con stock 1; dos sesiones distintas | Confirmar la compra casi simultáneamente | Exactamente **uno** gana; el otro recibe `INSUFFICIENT_STOCK`; nunca stock negativo ni dos pedidos | Por registrar (**VERIFICADA**: `test_public_and_commerce.py::test_concurrent_checkout_of_last_unit_lets_only_one_win`) | Log de ambas respuestas |
| AC-CHK-12 | Checkout | Usuario | W/M | Variante eliminada antes del pago | Carrito con una variante que el vendedor borró | Confirmar la compra | El backend rechaza (la variante "ya no está disponible"); el carrito se recarga | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_checkout_rejects_deleted_variant`) | Captura |
| AC-CHK-13 | Checkout | Usuario | W/M | *Snapshot* del pedido | Compra completada | Ver el detalle del pedido | El pedido conserva nombre de producto, nombre de variante, atributos, precio unitario y dirección **tal como estaban al comprar**, aunque luego cambien | Por registrar (VERIFICADA parcial: `test_public_and_commerce.py::test_order_snapshot_is_frozen`) | Captura del detalle |
| AC-CHK-14 | Checkout | Usuario | W/M | Carrito vaciado tras la compra | Compra completada | Volver al carrito | El carrito está vacío | Por registrar | Captura |
| AC-CHK-15 | Checkout | Visitante | W | Acceso a `/checkout` sin sesión | Sin sesión | Navegar a `/checkout` | Redirige a login; tras autenticarse regresa a `/checkout` | Por registrar | Captura |

### 7.6 Pedidos

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-ORD-01 | Pedidos | Usuario | W/M | Listado de pedidos | Cuenta con ≥ 1 pedido | Abrir "Mis pedidos" | Listado paginado con estado de cada pedido | Por registrar | Captura |
| AC-ORD-02 | Pedidos | Usuario | W/M | Detalle de pedido | ≥ 1 pedido | Abrir un pedido | Productos comprados (con variante), cantidades, precios, subtotal, IVA, total, dirección y estado con su historial | Por registrar | Captura |
| AC-ORD-03 | Pedidos | Usuario | W/M | Estados del pedido | Pedidos en distintos estados | Revisar cada pedido | Estados posibles: pendiente, pagado, en preparación, enviado, entregado, cancelado (`OrderStatusEnum`) | Por registrar | Captura |
| AC-ORD-04 | Pedidos | Usuario | W/M | Cancelar pedido en estado "pendiente" o "pagado" | Pedido en pendiente/pagado | Detalle del pedido → "Cancelar" | El pedido pasa a "cancelado"; **sin reembolso automático de RehniCoin** | Por registrar | Captura antes/después + saldo sin cambio |
| AC-ORD-05 | Pedidos | Usuario | W/M | Cancelación no permitida | Pedido en "en preparación" / "enviado" / "entregado" | Intentar cancelar | Se impide: *"Este pedido ya está en preparación y no se puede cancelar."* | Por registrar | Captura del mensaje |
| AC-ORD-06 | Pedidos | Usuario | W | Información de envío (transportadora + guía) | Pedido marcado como "enviado" por la empresa con transportadora y guía | Abrir el detalle | Muestra la transportadora y el n° de guía; si la transportadora tiene URL de rastreo, enlace de seguimiento externo | Por registrar | Captura |

### 7.7 Favoritos

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-FAV-01 | Favoritos | Usuario | W/M | Marcar un producto como favorito | Sesión de comprador | Tocar el corazón en la tarjeta de un producto | El producto queda marcado; se persiste en el servidor (`POST /favorites`) | Por registrar | Captura |
| AC-FAV-02 | Favoritos | Usuario | W/M | Persistencia de favoritos | Producto marcado | Recargar / navegar y volver | El producto sigue marcado como favorito | Por registrar | Captura tras recargar |
| AC-FAV-03 | Favoritos | Usuario | W/M | Quitar de favoritos | Producto marcado | Volver a tocar el corazón o quitarlo desde la lista | Deja de estar marcado; el cambio persiste (`DELETE /favorites/{product_id}`) | Por registrar | Captura |
| AC-FAV-04 | Favoritos | Usuario | W/M | Lista de favoritos | ≥ 1 favorito | Abrir "Favoritos" | Listado completo; quitar desde ahí actualiza el estado en el resto de la app | Por registrar | Captura |
| AC-FAV-05 | Favoritos | Visitante | W/M | Favorito sin sesión | Sin sesión | Tocar el corazón | Redirige a login; tras autenticarse regresa al mismo producto | Por registrar | Captura |
| AC-FAV-06 | Favoritos | Empresa/Admin | W | Favoritos para rol no comprador | Sesión de empresa o admin | Buscar la opción de favoritos | No disponible para Empresa/Administrador (el rol `user` es el único con `/favorites`) | Por registrar | Captura / N/A |

### 7.8 Reseñas

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-REV-01 | Reseñas | Usuario | W | Escribir reseña de producto entregado | Pedido de ese producto en estado "entregado"; sin reseña previa | Detalle del producto → sección Opiniones → calificar 1-5 + comentario opcional → enviar | La reseña se publica; el promedio y el conteo se recalculan | Por registrar | Captura de la reseña publicada |
| AC-REV-02 | Reseñas | Usuario | W | Elegibilidad: producto no entregado | Sin pedido entregado de ese producto | Abrir la sección Opiniones | No se muestra el formulario; texto *"Podrás reseñar este producto una vez que te sea entregado."* | Por registrar | Captura |
| AC-REV-03 | Reseñas | Usuario | W | Una sola reseña por producto | Ya reseñó el producto | Abrir la sección Opiniones | Indica *"Ya reseñaste este producto"*; opción de eliminarla; si intenta crear otra: *"Ya reseñaste este producto. Edita tu reseña en vez de crear otra."* | Por registrar | Captura |
| AC-REV-04 | Reseñas | Usuario | W | Eliminar la propia reseña | Reseña propia existente | Sección Opiniones → "Eliminar mi reseña" → confirmar | La reseña se elimina; promedio y conteo se recalculan | Por registrar | Captura antes/después |
| AC-REV-05 | Reseñas | Visitante | W | Ver opiniones | Producto con reseñas | Abrir la sección Opiniones | Resumen (promedio, total, distribución por estrellas) + comentarios recientes con paginación | Por registrar | Captura |
| AC-REV-06 | Reseñas | Usuario | M | Reseñas en móvil | — | Abrir el detalle de un producto en la app | Solo se muestra la **calificación promedio**; no hay listado ni formulario de reseñas | N/A | NO APLICA | Captura del detalle móvil |
| AC-REV-07 | Reseñas | Usuario | W | Editar la propia reseña desde la interfaz | Reseña propia existente | Buscar la opción "editar reseña" en la sección Opiniones | El backend soporta `PATCH /reviews/{id}`, pero la interfaz web actual solo ofrece **crear** y **eliminar** de forma visible. Verificar si la edición está expuesta | Por registrar | Captura de la sección (para confirmar si existe el botón "editar") |

### 7.9 Direcciones

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-ADDR-01 | Direcciones | Usuario | W/M | Crear dirección | Sesión de comprador | Panel Direcciones → "Agregar" → completar → guardar | La dirección aparece en la lista (`POST /addresses`) | Por registrar | Captura |
| AC-ADDR-02 | Direcciones | Usuario | W/M | Consultar direcciones | ≥ 1 dirección | Abrir el panel Direcciones | Se listan todas las direcciones del usuario | Por registrar | Captura |
| AC-ADDR-03 | Direcciones | Usuario | W/M | Editar dirección | ≥ 1 dirección | Editar los datos → guardar | Cambios reflejados (`PATCH /addresses/{id}`) | Por registrar | Captura antes/después |
| AC-ADDR-04 | Direcciones | Usuario | W/M | Marcar predeterminada | ≥ 2 direcciones | Marcar una como predeterminada | Esa dirección se preselecciona en el checkout (`PATCH /addresses/{id}/set-default`) | Por registrar | Captura |
| AC-ADDR-05 | Direcciones | Usuario | W/M | Eliminar dirección | ≥ 1 dirección | Eliminar una dirección | Desaparece de la lista; los pedidos previos con esa dirección conservan su copia | Por registrar | Captura |

### 7.10 RehniCoin (billetera)

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-COIN-01 | RehniCoin | Usuario | W/M | Consultar saldo | Sesión de comprador | Abrir la billetera / RehniCoins | Muestra el saldo actual (1 RehniCoin = 1 COP), proveniente del backend (`GET /wallet/me`) | Por registrar | Captura |
| AC-COIN-02 | RehniCoin | Usuario | W/M | Historial de movimientos | Cuenta con movimientos | Abrir la billetera | Listado paginado con tipo (recarga / compra / reembolso / ajuste), fecha, descripción y monto (`GET /wallet/transactions`) | Por registrar | Captura |
| AC-COIN-03 | RehniCoin | Usuario | W/M | Solicitud de recarga por WhatsApp | Número de WhatsApp configurado | Billetera → "Recargar RehniCoins" → elegir/escribir monto entero > 0 → confirmar | Se abre WhatsApp con un mensaje que incluye la cantidad y el correo; **el saldo NO se acredita automáticamente** | Por registrar | Captura del mensaje de WhatsApp |
| AC-COIN-04 | RehniCoin | Usuario | W/M | Solicitud de recarga sin número configurado | `*_REHNIMARKET_WHATSAPP` vacío | Intentar recargar | Aviso ("Contacto no disponible" en móvil / equivalente en web); no se abre un enlace inválido | Por registrar | Captura del aviso |
| AC-COIN-05 | RehniCoin | Usuario | W/M | Descuento de saldo al comprar | Compra completada con saldo suficiente | Ver los movimientos tras comprar | Aparece un movimiento de tipo "compra" por el total; el saldo baja en ese monto | Por registrar | Captura del movimiento |
| AC-COIN-06 | RehniCoin | Usuario | W/M | El comprador no puede acreditarse saldo | Sesión de comprador | Intentar llamar a `POST /wallet/recharge` | Denegado: el rol `user` no tiene ese endpoint en su lista blanca (`RolePermissions.py`); solo Administrador/Owner acreditan saldo | Por registrar (B) | Respuesta 403 en Swagger/cliente HTTP |

### 7.11 Panel de Empresa (solo web)

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-EMP-01 | Empresa · Tienda | Empresa | W | Consultar y editar el perfil comercial | Empresa aprobada | Panel → Mi tienda → editar nombre/contacto → guardar | Cambios reflejados en el perfil (`PATCH /company/dashboard/my-profile`) | Por registrar | Captura antes/después |
| AC-EMP-02 | Empresa · Tienda | Empresa | W | Actualizar logo y banner | Empresa aprobada; imágenes disponibles | Mi tienda → cambiar logo / banner → guardar | Las imágenes se actualizan (se suben a MinIO) | Por registrar | Captura + verificación de la imagen pública |
| AC-EMP-03 | Empresa · Productos | Empresa | W | Crear un producto sin variantes | Categoría existente | Productos → "Crear" → nombre, descripción, categoría, precio, stock, imágenes, especificaciones → guardar | El producto se crea y aparece en el listado propio | Por registrar | Captura del producto creado |
| AC-EMP-04 | Empresa · Productos | Empresa | W | Crear un producto con variantes | Categoría con atributos de variante | Crear producto marcado con variantes → definir combinaciones (asistente "generar variantes") → cada variante con precio, stock, imágenes | El producto tiene variantes, cada una con su propio stock | Por registrar (VERIFICADA parcial: `test_variants.py`, `test_catalog_attributes.py`) | Captura del panel de variantes |
| AC-EMP-05 | Empresa · Productos | Empresa | W | Definir y activar un descuento | Producto propio | Producto → descuento por porcentaje → activar | El producto muestra el descuento en el catálogo público (`PUT /company/dashboard/products/{id}/discount`) | Por registrar | Captura del producto con descuento en el catálogo |
| AC-EMP-06 | Empresa · Productos | Empresa | W | Editar un producto | Producto propio | Editar información e imágenes → guardar | Cambios reflejados | Por registrar | Captura |
| AC-EMP-07 | Empresa · Productos | Empresa | W | Activar/desactivar visibilidad | Producto propio activo | Cambiar el estado del producto | El producto deja de mostrarse / vuelve a mostrarse en el catálogo público | Por registrar | Captura pública antes/después |
| AC-EMP-08 | Empresa · Productos | Empresa | W | Eliminar un producto | Producto propio | Eliminar el producto | El producto se elimina del listado | Por registrar | Captura |
| AC-EMP-09 | Empresa · Productos | Empresa | W | Aislamiento entre empresas | Dos empresas distintas | Empresa A intenta gestionar un producto de la empresa B (por ID) | Denegado: cada empresa solo gestiona sus propios productos/variantes | Por registrar (B) | Respuesta 403/404 |
| AC-EMP-10 | Empresa · Pedidos | Empresa | W | Listado de pedidos recibidos | La empresa tiene ventas | Panel → Pedidos | Listado con estado y contadores por estado (`/company/dashboard/orders`, `.../orders/status-counts`) | Por registrar | Captura |
| AC-EMP-11 | Empresa · Pedidos | Empresa | W | Avanzar el estado de un pedido | Pedido pendiente/pagado | Detalle del pedido → cambiar a "en preparación" → "enviado" → "entregado" | El estado avanza según el flujo permitido; una transición inválida se rechaza (*"No se puede pasar de '{estado}' a '{estado}'."*) | Por registrar | Captura de cada transición |
| AC-EMP-12 | Empresa · Pedidos | Empresa | W | Registrar transportadora y guía al enviar | Pedido en "en preparación"; transportadoras activas | Marcar "enviado" → seleccionar transportadora + n° de guía | La información de envío queda registrada y visible para el comprador | Por registrar | Captura |
| AC-EMP-13 | Empresa · Pedidos | Empresa | W | Cancelar un pedido | Pedido pendiente/pagado | Cambiar el estado a "cancelado" | El pedido se cancela | Por registrar | Captura |
| AC-EMP-14 | Empresa · Finanzas | Empresa | W | Registrar cuenta bancaria y marcarla predeterminada | Empresa aprobada | Finanzas → agregar cuenta bancaria → marcar predeterminada | La cuenta aparece; una queda como predeterminada (`/company/bank-accounts`) | Por registrar | Captura |
| AC-EMP-15 | Empresa · Finanzas | Empresa | W | Consultar balance y liquidaciones | Empresa con ventas | Finanzas → Balance / Liquidaciones | Muestra el balance disponible y el historial de liquidaciones con estado (pendiente/pagada) | Por registrar | Captura |
| AC-EMP-16 | Empresa · Cuenta | Empresa | W | Configuración de cuenta del representante | Empresa aprobada | Configuración de cuenta → editar datos / cambiar contraseña | Cambios aplicados; cambio de contraseña vía código al correo | Por registrar | Captura |

### 7.12 Panel de Administración (solo web)

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-ADM-01 | Admin · Inicio | Administrador | W | Panel de estadísticas | Datos en el sistema | Abrir el panel | Muestra estadísticas generales, actividad reciente y usuarios recientes | Por registrar | Captura |
| AC-ADM-02 | Admin · Empresas | Administrador | W | Listar y ver detalle de empresas | ≥ 1 empresa registrada | Empresas → abrir el detalle | Listado y detalle (incluye el certificado) | Por registrar | Captura |
| AC-ADM-03 | Admin · Empresas | Administrador | W | Aprobar certificación de empresa | Empresa con certificación pendiente | Detalle → aprobar certificación | La empresa puede iniciar sesión y se muestra como "empresa verificada" | Por registrar | Captura + prueba de login de esa empresa (relaciona con AC-AUTH-08) |
| AC-ADM-04 | Admin · Empresas | Administrador | W | Rechazar certificación | Empresa pendiente | Detalle → rechazar | La empresa recibe estado rechazado; su login se bloquea con *"Tu empresa ha sido rechazada"* | Por registrar | Captura |
| AC-ADM-05 | Admin · Empresas | Administrador | W | Suspender (desactivar) una empresa | Empresa activa con pedidos en pendiente/pagado/en preparación | Detalle → desactivar | La empresa queda suspendida; sus pedidos en esos estados se **cancelan y reembolsan** en RehniCoin a los compradores | Por registrar | Captura + verificación del reembolso en la billetera del comprador |
| AC-ADM-06 | Admin · Usuarios | Administrador | W | Listar, ver y editar usuarios | ≥ 1 usuario | Usuarios → detalle → editar información | Cambios aplicados | Por registrar | Captura |
| AC-ADM-07 | Admin · Usuarios | Administrador | W | Bloquear / desbloquear una cuenta | Usuario activo | Cambiar el estado a bloqueada | El usuario bloqueado no puede iniciar sesión: *"Tu cuenta se encuentra bloqueada. Contacta con un administrador."* | Por registrar | Captura + intento de login del usuario bloqueado |
| AC-ADM-08 | Admin · Usuarios | Administrador | W | Eliminar una cuenta | Usuario no Owner | Eliminar la cuenta | La cuenta se elimina | Por registrar | Captura |
| AC-ADM-09 | Admin · Usuarios | Administrador | W | Restricción sobre cuentas Owner | Cuenta de Administrador (no Owner) | Intentar modificar/bloquear/eliminar una cuenta Owner o asignar el rol Owner | Denegado: reservado al Owner; ninguna cuenta Owner puede eliminarse | Por registrar | Captura del bloqueo |
| AC-ADM-10 | Admin · Usuarios | Owner | W | Asignar el rol Owner | Cuenta Owner del *seed* | Usuarios → asignar el rol Owner a otra cuenta | La otra cuenta obtiene privilegios de Owner | Por registrar | Captura |
| AC-ADM-11 | Admin · Catálogo | Administrador | W | Gestionar categorías | — | Catálogo → crear / editar / activar-desactivar / eliminar categoría | Los cambios se reflejan en el catálogo público (categorías activas) | Por registrar (VERIFICADA parcial: `test_catalog_attributes.py`) | Captura |
| AC-ADM-12 | Admin · Catálogo | Administrador | W | Definir especificaciones de una categoría | Categoría existente | Catálogo → especificaciones de la categoría | Al crear un producto de esa categoría, la empresa debe completar esos campos | Por registrar | Captura del formulario de producto |
| AC-ADM-13 | Admin · Catálogo | Administrador | W | Gestionar atributos de variante y colores | — | Catálogo → atributos / opciones / colores | Las opciones quedan disponibles para las variantes de producto | Por registrar (VERIFICADA parcial: `test_catalog_attributes.py`) | Captura |
| AC-ADM-14 | Admin · Anuncios | Administrador | W | Crear un anuncio | Imagen disponible | Anuncios → crear con imagen (+ imagen móvil opcional) + enlace o destino de catálogo + orden + activo | El anuncio activo se muestra en el Home. **El anuncio es un banner visual: sin título, descripción ni texto de botón** | Por registrar (VERIFICADA parcial: `test_advertisements.py`) | Captura del formulario y del Home |
| AC-ADM-15 | Admin · Anuncios | Administrador | W | Editar / activar-desactivar / eliminar anuncio | ≥ 1 anuncio | Modificar el estado del anuncio | Solo los anuncios activos se muestran a los visitantes | Por registrar | Captura antes/después |
| AC-ADM-16 | Admin · Reportes | Administrador | W | Revisar reportes de usuarios | ≥ 1 reporte enviado | Reportes → abrir el detalle → cambiar el estado | Se ve el motivo, la descripción y las imágenes; el estado del reporte se actualiza | Por registrar | Captura |
| AC-ADM-17 | Admin · Transportadoras | Administrador | W | Gestionar transportadoras | — | Transportadoras → crear / editar / activar-desactivar | Las transportadoras activas están disponibles para las empresas al despachar | Por registrar | Captura |
| AC-ADM-18 | Admin · Liquidaciones | Administrador | W | Vista previa y generación de liquidación | Empresa con ventas válidas y cuenta bancaria predeterminada | Liquidaciones → vista previa de un periodo → generar | Se calcula sobre las ventas menos la comisión del 5%; queda en estado "pendiente" | Por registrar | Captura de la vista previa y de la liquidación generada |
| AC-ADM-19 | Admin · Liquidaciones | Administrador | W | Generar liquidación sin cuenta bancaria predeterminada | Empresa sin cuenta bancaria predeterminada | Intentar generar la liquidación | Se impide; se requiere cuenta bancaria predeterminada | Por registrar | Captura del bloqueo |
| AC-ADM-20 | Admin · Liquidaciones | Administrador | W | Marcar liquidación como pagada | Liquidación pendiente | Marcar como pagada | Estado "pagada"; una liquidación pagada no puede volver a marcarse como pagada | Por registrar | Captura |
| AC-ADM-21 | Admin · RehniCoin | Administrador | W | Recargar saldo a un usuario | Usuario existente | RehniCoin → identificar por correo → cantidad + descripción → confirmar | El saldo del usuario aumenta de inmediato; queda registro en el historial de recargas | Por registrar | Captura + verificación en la billetera del usuario |
| AC-ADM-22 | Admin · RehniCoin | Administrador | W | Historial de recargas | ≥ 1 recarga realizada | RehniCoin → historial | Listado paginado con usuario receptor, monto y administrador responsable | Por registrar | Captura |

### 7.13 Infraestructura y API

| ID | Módulo | Rol | Canal | Caso de prueba | Precondiciones | Pasos (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia sugerida |
|---|---|---|---|---|---|---|---|---|---|---|
| AC-INF-01 | Infraestructura | — | B | Levantar el stack con Docker | `docker-compose.yml`, `.env` configurado | `docker compose build` → `docker compose up -d` → `docker compose ps` | Los 4 contenedores (`rehni-minio`, `rehni-postgres`, `rehni-backend`, `rehni-frontend`) en estado *Up* | Por registrar | Salida de `docker compose ps` |
| AC-INF-02 | Infraestructura | — | B | Salud de la base de datos | Stack levantado | `GET http://localhost:8001/health/database` | `{"Base de datos":"OK"}` | Por registrar | Captura de la respuesta |
| AC-INF-03 | Infraestructura | — | B | Migraciones aplicadas | Stack levantado | Revisar los logs del backend o `alembic current` | La cadena de 10 migraciones se aplica sin error hasta `a1b2c3d4e5f6` | Por registrar | Log del backend |
| AC-INF-04 | API | — | B | Documentación interactiva | Backend arriba | Abrir `http://localhost:8001/docs` | Swagger UI lista todos los endpoints | Por registrar | Captura de Swagger |
| AC-INF-05 | Almacenamiento | — | B | Bucket de MinIO | Backend arriba | Revisar los logs del backend | El bucket `uploads` se crea en el arranque sin abortar el proceso | Por registrar | Log + inspección del bucket |
| AC-INF-06 | Pruebas backend | — | B | Suite de comercio | Contenedor `rehni-backend` y `rehni-postgres` arriba | `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest tests/test_public_and_commerce.py -q'` | Todas las pruebas del archivo pasan | **`21 passed, 203 warnings in 128.35s`** (ejecutado 2026-08-30) | **VERIFICADA** | Salida de consola guardada |
| AC-INF-07 | Pruebas backend | — | B | Suite completa | Stack de pruebas | `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest -q'` | Las 113 pruebas (7 archivos) pasan | Por registrar (los otros 6 archivos / 92 pruebas no se ejecutaron en este análisis) | PENDIENTE DE EJECUCIÓN | Salida de consola |
| AC-INF-08 | Verificación estática | — | B | Tipos del frontend | `node_modules` instalados | `npx tsc --noEmit` en `RehniMarket-frontend/` | Sin errores de tipos | **Ejecutado durante este trabajo:** `npx tsc -b` → código de salida 0 | VERIFICADA (equivalente) | Salida de consola |
| AC-INF-09 | Verificación estática | — | B | Lint del frontend | `node_modules` instalados | `npx eslint .` en `RehniMarket-frontend/` | Sin errores | **Ejecutado durante este trabajo:** código de salida 0 | VERIFICADA | Salida de consola |
| AC-INF-10 | Verificación estática | — | B | Lint del móvil | `node_modules` instalados | `npx expo lint` en `RehniMarket-mobile/` | Sin errores | Por registrar | Salida de consola |
| AC-INF-11 | Verificación estática | — | B | *Build* de producción del frontend | `node_modules` instalados; `dist/` con permisos correctos | `pnpm build` en `RehniMarket-frontend/` | Compila | Parcial: `vite build` compila a un directorio limpio (`✓ built in 687ms`); `pnpm build` in situ falla por `EACCES` en `dist/` (carpeta propiedad de `root`, residuo de un *build* previo — no es fallo de código) | PENDIENTE DE EJECUCIÓN (corregir permisos de `dist/` primero) | Salida de consola |

---

## 8. Pruebas de casos negativos

Comportamiento esperado real (mensajes verificados en `app/services/**` y `app/core/ErrorCodes.py`). Todos parten en estado **PENDIENTE DE EJECUCIÓN** salvo indicación.

| ID | Caso negativo | Rol / canal | Resultado esperado (mensaje / código real) | Estado |
|---|---|---|---|---|
| NEG-01 | Inicio de sesión con contraseña incorrecta | Visitante / W-M | *"Correo o contraseña incorrecta."* (`INVALID_CREDENTIALS`); no revela cuál dato falló | PENDIENTE DE EJECUCIÓN |
| NEG-02 | Inicio de sesión con correo inexistente | Visitante / W-M | *"Correo o contraseña incorrecta."* (mismo mensaje que NEG-01) | PENDIENTE DE EJECUCIÓN |
| NEG-03 | Inicio de sesión con cuenta no verificada | Visitante / W-M | *"Tu correo no ha sido verificado. Te enviamos un código de verificación a tu correo electrónico."* (`EMAIL_NOT_VERIFIED`) y dirige a verificar | PENDIENTE DE EJECUCIÓN |
| NEG-04 | Inicio de sesión de cuenta bloqueada | Visitante / W-M | *"Tu cuenta se encuentra bloqueada. Contacta con un administrador."* (`USER_BLOCKED`) | PENDIENTE DE EJECUCIÓN |
| NEG-05 | Inicio de sesión de empresa pendiente / rechazada / suspendida | Empresa / W | *"Tu empresa esta en revision"* / *"Tu empresa ha sido rechazada"* / *"Tu empresa se encuentra suspendida."* | PENDIENTE DE EJECUCIÓN |
| NEG-06 | Registro con correo ya usado | Visitante / W-M | *"El correo ya se encuentra registrado"* (`EMAIL_ALREADY_EXISTS`) | PENDIENTE DE EJECUCIÓN |
| NEG-07 | Registro de empresa con NIT ya usado | Visitante / W | *"El NIT ya se encuentra registrado"* (`NIT_ALREADY_EXISTS`) | PENDIENTE DE EJECUCIÓN |
| NEG-08 | Código de verificación incorrecto | Visitante / W-M | *"El código de verificación es incorrecto."* (`INVALID_CODE`) | PENDIENTE DE EJECUCIÓN |
| NEG-09 | Código de verificación expirado | Visitante / W-M | *"El codigo expiro. Se ha enviado uno nuevo a tu correo electronico"* (`CODE_EXPIRED`) + reenvío automático | PENDIENTE DE EJECUCIÓN |
| NEG-10 | Reenvío de código antes de 60 s | Visitante / W-M | *"Debes esperar antes de solicitar un nuevo código de verificación."* (`RESEND_COOLDOWN_ACTIVE`) | PENDIENTE DE EJECUCIÓN |
| NEG-11 | Recuperación de contraseña con correo inexistente | Visitante / W-M | *"No existe una cuenta registrada con este correo"* (`EMAIL_NOT_FOUND`) | PENDIENTE DE EJECUCIÓN |
| NEG-12 | Código de recuperación incorrecto | Visitante / W-M | *"El codigo de recuperacion es incorrecto"* (`INVALID_CODE`) | PENDIENTE DE EJECUCIÓN |
| NEG-13 | Visitante intenta comprar (sin sesión) | Visitante / W-M | Redirección a login; tras autenticarse regresa al punto de partida | PENDIENTE DE EJECUCIÓN |
| NEG-14 | Agregar al carrito un producto inexistente | Usuario / B | 404 `PRODUCT_NOT_FOUND` *"Producto no encontrado."* | PENDIENTE DE EJECUCIÓN |
| NEG-15 | Agregar al carrito una variante inexistente | Usuario / B | 404 `VARIANT_NOT_FOUND` *"Variante no encontrada."* | PENDIENTE DE EJECUCIÓN |
| NEG-16 | Agregar producto con variantes sin elegir variante | Usuario / W-M | 400 *"Este producto requiere seleccionar una variante."* | VERIFICADA parcial (`test_public_and_commerce.py::test_cart_requires_variant_when_product_has_variants` — ejecución no verificada) |
| NEG-17 | Agregar un producto sin stock (producto base) | Usuario / W-M | 409 `PRODUCT_OUT_OF_STOCK` *"Producto sin stock disponible."* | PENDIENTE DE EJECUCIÓN |
| NEG-18 | Agregar una variante sin stock | Usuario / W-M | 409 `PRODUCT_OUT_OF_STOCK` *"Producto sin stock disponible."* (usa el stock de la variante) | PENDIENTE DE EJECUCIÓN |
| NEG-19 | Cantidad superior al stock (al agregar o actualizar) | Usuario / W-M | 409 `INSUFFICIENT_STOCK` *"Solo hay N unidades disponibles."* | VERIFICADA parcial (`test_public_and_commerce.py::test_checkout_over_stock_is_still_blocked_at_cart` — ejecución no verificada) |
| NEG-20 | Carrito con mezcla de disponibles y agotados — botón de pago (web) | Usuario / W | El botón "Ir a pagar" se **deshabilita** mientras exista una línea agotada o con cantidad > stock; se puede eliminar la línea; al corregir se rehabilita | PENDIENTE DE EJECUCIÓN |
| NEG-21 | Carrito con mezcla de disponibles y agotados — móvil | Usuario / M | La línea se marca; el botón de pago no se deshabilita; el servidor rechaza el checkout con el mensaje de stock, **sin cobrar** | VERIFICADA parcial (`test_public_and_commerce.py::test_checkout_rejected_when_stock_drops_below_cart_and_nothing_persists` — ejecución no verificada) |
| NEG-22 | Un producto agotado NO bloquea la compra de los demás | Usuario / W | Tras eliminar la línea agotada, la compra de los productos válidos puede completarse | PENDIENTE DE EJECUCIÓN |
| NEG-23 | Checkout sin dirección | Usuario / W-M | Se abre el selector/creador de dirección; respaldo del backend 400 `ADDRESS_REQUIRED` *"Debes registrar una dirección para continuar con la compra."* | PENDIENTE DE EJECUCIÓN |
| NEG-24 | Checkout con dirección inexistente (ID manipulado) | Usuario / B | 404 `ADDRESS_NOT_FOUND` *"Dirección no encontrada."* | PENDIENTE DE EJECUCIÓN |
| NEG-25 | Checkout con saldo de RehniCoin insuficiente | Usuario / W-M | Aviso de saldo insuficiente; botón deshabilitado; si se fuerza, 402 `INSUFFICIENT_BALANCE` *"Tu saldo de RehniCoin no alcanza para completar la compra."*; no se compra | PENDIENTE DE EJECUCIÓN |
| NEG-26 | Checkout con carrito vacío | Usuario / B | 400 `CART_EMPTY` *"Tu carrito está vacío."* | PENDIENTE DE EJECUCIÓN |
| NEG-27 | Checkout: el stock cambió y ya no alcanza | Usuario / W-M | 409 `INSUFFICIENT_STOCK` *"'{producto}' ya no tiene suficiente stock disponible."*; rollback total; el carrito se recarga | VERIFICADA parcial (`test_public_and_commerce.py::test_checkout_rejected_when_stock_drops_below_cart_and_nothing_persists` — ejecución no verificada) |
| NEG-28 | Checkout: la variante fue eliminada por el vendedor | Usuario / W-M | 409 `PRODUCT_NOT_FOUND` ("una variante… ya no está disponible"); el carrito se recarga | VERIFICADA parcial (`test_public_and_commerce.py::test_checkout_rejects_deleted_variant` — ejecución no verificada) |
| NEG-29 | Dos compradores compran la última unidad a la vez | Usuario / B | Solo uno gana; el otro recibe `INSUFFICIENT_STOCK`; nunca stock negativo ni dos pedidos | **VERIFICADA** (`test_concurrent_checkout_of_last_unit_lets_only_one_win` — incluida en las 21 pruebas ejecutadas el 2026-08-30) |
| NEG-30 | Cancelar un pedido que ya no es cancelable | Usuario / W-M | *"Este pedido ya está en preparación y no se puede cancelar."* | PENDIENTE DE EJECUCIÓN |
| NEG-31 | Comprador intenta acreditarse saldo (`POST /wallet/recharge`) | Usuario / B | 403 (el rol `user` no tiene ese endpoint permitido) | PENDIENTE DE EJECUCIÓN |
| NEG-32 | Comprador accede a un panel de otro rol (`/company/dashboard`, `/admin/dashboard`) | Usuario / W | 403 `FORBIDDEN` *"No tienes permiso para acceder a este recurso"* y redirección | PENDIENTE DE EJECUCIÓN |
| NEG-33 | Empresa A gestiona un producto de la empresa B | Empresa / B | 403/404 (aislamiento por empresa) | PENDIENTE DE EJECUCIÓN |
| NEG-34 | Petición sin token a un endpoint protegido | — / B | 401 `UNAUTHORIZED` *"Token requerido"* | PENDIENTE DE EJECUCIÓN |
| NEG-35 | Petición con token con formato inválido | — / B | 401 `INVALID_TOKEN` *"Formato de autorización inválido"* | PENDIENTE DE EJECUCIÓN |
| NEG-36 | Petición con *access token* expirado | — / B | 401 `TOKEN_EXPIRED` *"Token expirado"*; el cliente intenta renovar con el *refresh token* | PENDIENTE DE EJECUCIÓN |
| NEG-37 | Sesión expirada no recuperable (refresh inválido) | Usuario / W-M | Redirección a login con aviso de sesión expirada; al reingresar vuelve a la pantalla previa | PENDIENTE DE EJECUCIÓN |
| NEG-38 | Reseñar sin compra entregada | Usuario / W | No se muestra el formulario; *"Podrás reseñar este producto una vez que te sea entregado."* | PENDIENTE DE EJECUCIÓN |
| NEG-39 | Reseñar un producto ya reseñado | Usuario / W | *"Ya reseñaste este producto. Edita tu reseña en vez de crear otra."* (`REVIEW_ALREADY_EXISTS`) | PENDIENTE DE EJECUCIÓN |
| NEG-40 | Error genérico del servidor | — / cualquiera | *"Error interno del servidor."* (`INTERNAL_SERVER_ERROR`, HTTP 500); el error se muestra, no se oculta | PENDIENTE DE EJECUCIÓN |
| NEG-41 | Datos de formulario inválidos (validación Pydantic) | — / B | HTTP 422 con `{ detail: { code: "VALIDATION_ERROR", message } }` | PENDIENTE DE EJECUCIÓN |
| NEG-42 | Solicitud de recarga con número de WhatsApp no configurado | Usuario / W-M | Aviso ("Contacto no disponible"); no se abre un enlace inválido | PENDIENTE DE EJECUCIÓN |

---

## 9. Pruebas responsive

> **Ninguna de estas pruebas ha sido ejecutada físicamente en dispositivos durante este análisis.** Lo que existe es **VERIFICACIÓN ESTÁTICA**: revisión del código de *layout* (uso de *breakpoints* de Tailwind en 64 componentes web; `src/hooks/useResponsive.ts` en móvil, con cálculo de columnas/anchos según el ancho del dispositivo; `react-native-safe-area-context` para *safe areas*). Al ejecutar, cada fila debe pasar a "APROBADA"/"CON OBSERVACIONES" y adjuntar la captura correspondiente.

### 9.1 Web

| ID | Vista objetivo | Ancho de referencia | Qué revisar | Estado |
|---|---|---|---|---|
| RSP-W-01 | Home | Desktop (≥ 1280 px) | Anuncios, rejilla de categorías y de productos sin desbordes horizontales | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-02 | Home | Tablet (~768–1024 px) | La rejilla reduce columnas; el menú se adapta | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-03 | Home | Mobile (~375–430 px) | Navegación compacta; tarjetas en 1–2 columnas; buscador accesible | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-04 | Catálogo con filtros | Tablet / Mobile | El panel de filtros y el orden se mantienen usables | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-05 | Detalle de producto | Desktop / Tablet / Mobile | Galería, selección de variante y "Agregar al carrito" visibles y usables | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-06 | Carrito | Desktop / Mobile | Líneas, controles de cantidad y resumen legibles; botón de pago accesible | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-07 | Checkout | Desktop / Mobile | Dirección, resumen y botón "Confirmar compra" sin recortes | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-W-08 | Panel Comprador / Empresa / Administrador | Desktop / Tablet / Mobile | El *sidebar* se colapsa; las tablas hacen *scroll* interno sin romper la página | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |

### 9.2 Aplicación móvil

| ID | Pantalla objetivo | Ancho (dp) / orientación | Qué revisar | Estado |
|---|---|---|---|---|
| RSP-M-01 | Inicio / catálogo | 320 · portrait | Sin cortes; navbar inferior visible; tarjetas en 2 columnas | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-02 | Inicio / catálogo | 375 · portrait | Layout de referencia (`references/`) | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-03 | Inicio / catálogo | 390 · portrait | — | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-04 | Inicio / catálogo | 430 · portrait | Aprovechamiento del ancho; columnas responsivas (`useResponsive`) | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-05 | Detalle de producto | 375 / 430 · portrait | Galería, `VariantSelector`, botón "Agregar" fijos y usables | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-06 | Carrito / checkout | 375 / 430 · portrait | Filas y resumen; *safe area* inferior respetada | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-07 | Cualquier pantalla | Tablet (~768–1024 dp) · portrait | Contenido con ancho máximo (`contentMaxWidth`); columnas se expanden | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |
| RSP-M-08 | Catálogo / detalle | landscape | No hay cortes ni solapes; el contenido se reajusta | VERIFICACIÓN ESTÁTICA — PENDIENTE DE EJECUCIÓN |

---

## 10. Pruebas de integración

Verifican el recorrido completo **Cliente → API (FastAPI) → PostgreSQL** (y MinIO / SMTP cuando aplica). Para el backend, una parte está cubierta por la suite `pytest` (que usa una base PostgreSQL real). Para web y móvil, la integración se valida ejecutando el flujo real contra el backend levantado.

| ID | Flujo integrado | Ruta | Evidencia técnica esperada | Estado |
|---|---|---|---|---|
| INT-01 | Login | Frontend/Móvil → `POST /auth/login-user` → consulta a `Users` en PostgreSQL → JWT | La sesión se establece; peticiones posteriores llevan `Authorization: Bearer` | PENDIENTE DE EJECUCIÓN |
| INT-02 | Catálogo | Frontend/Móvil → `GET /public/products` (+ filtros) → consulta con índice de trigramas → JSON paginado | Los productos mostrados coinciden con los de la BD; la búsqueda difusa responde | Parcial: `test_product_search.py` (backend) — ejecución no verificada |
| INT-03 | Detalle + variantes | Cliente → `GET /public/products/{id}` → `Product` + `ProductVariant` + imágenes (URL vía `/media/proxy` a MinIO) | Precio, stock e imagen por variante correctos | Parcial: `test_public_and_commerce.py` — 21 passed |
| INT-04 | Agregar al carrito | Cliente → `POST /cart/add` → valida stock (producto o variante) → inserta/actualiza `CartItem` | La línea persiste; recargar `GET /cart` la devuelve | Parcial: `test_public_and_commerce.py` — ejecución verificada (dentro de las 21) |
| INT-05 | Checkout | Cliente → `POST /checkout` → revalida stock atómicamente → descuenta `stock` → bloquea `Wallet` (`FOR UPDATE`) → crea `Order`/`OrderItem` por empresa → cobra RehniCoin → vacía el carrito → correo | Se crean pedidos; el stock baja; el saldo baja; el carrito queda vacío; ante fallo, rollback total | **VERIFICADA** (backend: `test_public_and_commerce.py::TestCheckoutStockDiscount` y flujo de checkout — 21 passed, 2026-08-30). El recorrido web/móvil: PENDIENTE DE EJECUCIÓN |
| INT-06 | Direcciones | Cliente → `POST/PATCH/DELETE /addresses` → `Address` en PostgreSQL | Cambios reflejados; la predeterminada se usa en el checkout | PENDIENTE DE EJECUCIÓN |
| INT-07 | Billetera | Cliente → `GET /wallet/me` + `GET /wallet/transactions` → `Wallet` + movimientos | Saldo y movimientos provienen del backend | PENDIENTE DE EJECUCIÓN |
| INT-08 | Pedidos | Cliente → `GET /orders` / `GET /orders/{id}` / `PATCH /orders/{id}/cancel` → `Order` | Estados y cancelación conforme al flujo permitido | PENDIENTE DE EJECUCIÓN |
| INT-09 | Empresa: crear producto con imágenes | Panel Empresa → `POST /company/dashboard/create-product` (multipart) → guarda en `Product`/`ProductImage` + sube a MinIO | El producto aparece en el catálogo público con su imagen servida por `/media/proxy` | PENDIENTE DE EJECUCIÓN |
| INT-10 | Empresa: cambio de estado de pedido + envío | Panel Empresa → `PATCH /company/dashboard/orders/{id}/status` y `.../shipping` → `Order` | El comprador ve el nuevo estado y la información de envío | PENDIENTE DE EJECUCIÓN |
| INT-11 | Admin: aprobar empresa | Panel Admin → `PATCH /admin/dashboard/companies/certificate/status/...` → `Company` | La empresa puede iniciar sesión y figura como verificada | PENDIENTE DE EJECUCIÓN |
| INT-12 | Admin: suspender empresa con reembolso | Panel Admin → `PATCH /admin/dashboard/company/status/...` → cancela pedidos + `refund_wallet` | Los compradores afectados recuperan RehniCoin | PENDIENTE DE EJECUCIÓN |
| INT-13 | Admin: recargar RehniCoin | Panel Admin → `POST /admin/wallet/recharge` → `Wallet` del usuario + registro de recarga | El saldo del usuario sube de inmediato | PENDIENTE DE EJECUCIÓN |
| INT-14 | Correo transaccional | `POST /auth/register-user` / `POST /checkout` → SMTP Gmail | El correo (código de verificación / "Pedido recibido") llega al destinatario | PENDIENTE DE EJECUCIÓN (requiere cuenta SMTP real) |

---

## 11. Evidencias requeridas

> **Ninguna de estas evidencias existe todavía.** La tabla indica **qué capturar** durante la ejecución de las pruebas, para la sustentación.

| ID prueba | Evidencia a capturar | Tipo | Ubicación sugerida | Estado |
|---|---|---|---|---|
| AC-INF-01 | Salida de `docker compose ps` con los 4 contenedores *Up* | Captura de terminal | `evidencias/infra/docker-ps.png` | PENDIENTE |
| AC-INF-02 | Respuesta de `GET /health/database` = `{"Base de datos":"OK"}` | Captura navegador / terminal | `evidencias/infra/health-db.png` | PENDIENTE |
| AC-INF-04 | Swagger UI en `http://localhost:8001/docs` | Captura navegador | `evidencias/infra/swagger.png` | PENDIENTE |
| AC-INF-06 | Consola: `21 passed ...` de `pytest tests/test_public_and_commerce.py` | Captura / archivo `.txt` | `evidencias/pruebas/pytest-commerce.txt` | **DISPONIBLE** (ejecutada 2026-08-30; volver a ejecutar y guardar la salida para el archivo definitivo) |
| AC-INF-07 | Consola: resultado de `pytest -q` completo (113 pruebas) | Captura / archivo `.txt` | `evidencias/pruebas/pytest-full.txt` | PENDIENTE |
| AC-INF-08/09 | Consola: `tsc --noEmit` y `eslint .` sin errores (frontend) | Captura / archivo `.txt` | `evidencias/pruebas/frontend-static.txt` | PENDIENTE (guardar salida definitiva) |
| AC-INF-10 | Consola: `expo lint` (móvil) | Captura / archivo `.txt` | `evidencias/pruebas/mobile-lint.txt` | PENDIENTE |
| AC-AUTH-01/04 | Registro + correo con código + verificación exitosa | Capturas + correo | `evidencias/auth/registro/` | PENDIENTE |
| AC-AUTH-07/10 | Login exitoso de comprador, empresa y administrador | Capturas | `evidencias/auth/login/` | PENDIENTE |
| AC-AUTH-09 | Bloqueo de login de empresa pendiente | Captura del mensaje | `evidencias/auth/empresa-pendiente.png` | PENDIENTE |
| AC-AUTH-16/17 | Protección de rutas por sesión y por rol | Capturas de la redirección / 403 | `evidencias/auth/proteccion-rutas/` | PENDIENTE |
| AC-CAT-01 | Home web y Home móvil | 2 capturas | `evidencias/catalogo/home-web.png`, `home-movil.png` | PENDIENTE |
| AC-CAT-02/03 | Catálogo y resultados de búsqueda | Capturas | `evidencias/catalogo/` | PENDIENTE |
| AC-CAT-05/06 | Filtros y ordenamiento aplicados (antes/después) | Capturas | `evidencias/catalogo/filtros/` | PENDIENTE |
| AC-CAT-07/08 | Secciones Ofertas y Novedades | Capturas | `evidencias/catalogo/ofertas-novedades/` | PENDIENTE |
| AC-CAT-09 | Perfil público de empresa (web) | Captura | `evidencias/catalogo/perfil-empresa.png` | PENDIENTE |
| AC-PROD-02 | Detalle con dos variantes distintas (imagen/precio/stock cambian) | 2 capturas | `evidencias/producto/variantes/` | PENDIENTE |
| AC-PROD-05 | Detalle de un producto con IVA y uno sin IVA | 2 capturas | `evidencias/producto/iva/` | PENDIENTE |
| AC-PROD-07 | Mensaje "requiere seleccionar una variante" | Captura | `evidencias/producto/variante-obligatoria.png` | PENDIENTE |
| AC-CART-01/08 | Carrito con productos y desglose subtotal/IVA/total | Captura | `evidencias/carrito/resumen.png` | PENDIENTE |
| AC-CART-09/12 | **Carrito con producto agotado**: etiqueta "Agotado" + botón "Ir a pagar" deshabilitado | Captura (obligatoria para el Criterio 6) | `evidencias/carrito/agotado.png` | PENDIENTE |
| AC-CART-10 | Carrito con "Sin stock suficiente" (cantidad > stock) | Captura | `evidencias/carrito/sin-stock-suficiente.png` | PENDIENTE |
| AC-CART-13 | Eliminar el producto agotado → botón de pago rehabilitado | 2 capturas (antes/después) | `evidencias/carrito/rehabilitado/` | PENDIENTE |
| AC-CART-16 | Stock de variante vs. producto base (con los valores de stock a la vista) | Captura + nota de datos | `evidencias/carrito/stock-variante.png` | PENDIENTE |
| AC-CHK-01/03 | Checkout: dirección faltante / creación / selección de predeterminada | Capturas | `evidencias/checkout/direccion/` | PENDIENTE |
| AC-CHK-04 | Resumen del checkout (subtotal/IVA/total) | Captura | `evidencias/checkout/resumen.png` | PENDIENTE |
| AC-CHK-05 | Compra exitosa: pantalla de confirmación | Captura | `evidencias/checkout/compra-exitosa.png` | PENDIENTE |
| AC-CHK-06 | Checkout con saldo insuficiente (aviso + botón deshabilitado) | Captura | `evidencias/checkout/saldo-insuficiente.png` | PENDIENTE |
| AC-CHK-07 | "Mis pedidos" con varios pedidos (uno por empresa) tras una compra multi-empresa | Captura | `evidencias/checkout/multi-empresa.png` | PENDIENTE |
| AC-CHK-10 | Rechazo por stock durante el checkout: mensaje + sin pedido + sin cobro | Capturas | `evidencias/checkout/rechazo-stock/` | PENDIENTE |
| AC-CHK-14 | Carrito vacío después de comprar | Captura | `evidencias/checkout/carrito-vacio.png` | PENDIENTE |
| AC-ORD-02/04/05 | Detalle de pedido; cancelación válida; cancelación no permitida | Capturas | `evidencias/pedidos/` | PENDIENTE |
| AC-ORD-06 | Detalle de pedido "enviado" con transportadora y enlace de rastreo | Captura | `evidencias/pedidos/envio.png` | PENDIENTE |
| AC-FAV-01/04 | Marcar favorito y lista de favoritos (web y móvil) | Capturas | `evidencias/favoritos/` | PENDIENTE |
| AC-REV-01/03 | Escribir reseña; mensaje de "ya reseñado" | Capturas | `evidencias/resenas/` | PENDIENTE |
| AC-COIN-01/02 | Saldo y movimientos de RehniCoin | Capturas | `evidencias/rehnicoin/` | PENDIENTE |
| AC-COIN-03 | Mensaje de WhatsApp generado por la solicitud de recarga | Captura | `evidencias/rehnicoin/whatsapp.png` | PENDIENTE |
| AC-EMP-03/04/05 | Crear producto, panel de variantes, producto con descuento en el catálogo | Capturas | `evidencias/empresa/productos/` | PENDIENTE |
| AC-EMP-10/11/12 | Pedidos recibidos, transición de estados, registro de envío | Capturas | `evidencias/empresa/pedidos/` | PENDIENTE |
| AC-EMP-15 | Balance y liquidaciones de la empresa | Captura | `evidencias/empresa/finanzas.png` | PENDIENTE |
| AC-ADM-01 | Dashboard de administrador con estadísticas | Captura | `evidencias/admin/dashboard.png` | PENDIENTE |
| AC-ADM-03/05 | Aprobar empresa; suspender empresa con reembolso (billetera del comprador) | Capturas | `evidencias/admin/empresas/` | PENDIENTE |
| AC-ADM-07 | Bloquear usuario + intento de login bloqueado | Capturas | `evidencias/admin/bloqueo-usuario/` | PENDIENTE |
| AC-ADM-14 | Crear anuncio y verlo en el Home | Capturas | `evidencias/admin/anuncios/` | PENDIENTE |
| AC-ADM-18/20 | Vista previa de liquidación; marcarla como pagada | Capturas | `evidencias/admin/liquidaciones/` | PENDIENTE |
| AC-ADM-21 | Recargar RehniCoin a un usuario + saldo actualizado | Capturas | `evidencias/admin/recarga/` | PENDIENTE |
| RSP-W-* / RSP-M-* | Capturas de las vistas clave en escritorio, tablet y móvil (web) y en 320/375/390/430/tablet/landscape (móvil) | Capturas | `evidencias/responsive/` | PENDIENTE |
| INFRA general | PostgreSQL (`\dt` o cliente gráfico mostrando las tablas), MinIO (bucket `uploads`), logs del backend | Capturas | `evidencias/infra/` | PENDIENTE |

---

## 12. Resultados de aceptación

> **Actualización 2026-08-31.** Sigue **sin ejecutarse la campaña con un usuario final**
> (requiere una persona operando la interfaz y firmando). Pero ahora hay **dos fuentes de
> resultado objetivo**:
>
> 1. **`scripts/acceptance_smoke.sh` — 28/28 comprobaciones PASAN** contra la API real
>    (`evidencias/acceptance/resultados.txt`, 2026-08-31): registro, login-antes-de-verificar
>    (`EMAIL_NOT_VERIFIED`), cooldown de reenvío (`429 RESEND_COOLDOWN_ACTIVE`), verificación
>    con código real, login, credenciales inválidas (`INVALID_CREDENTIALS`), refresh token,
>    ruta protegida sin token (401), comprador→admin (403 `FORBIDDEN`), comprador→empresa
>    (403), comprador→`/wallet/recharge` (403), catálogo, búsqueda difusa, ofertas,
>    novedades, variante obligatoria (`400 VALIDATION_ERROR`), agregar al carrito,
>    persistencia del carrito, crear dirección, **checkout sin saldo** (`402
>    INSUFFICIENT_BALANCE`, sin crear pedido), **checkout con saldo** (pedido creado, saldo
>    100000000 → 99999881 = −119 = precio 100 + IVA 19 %, carrito vaciado), listado de
>    pedidos, health, Swagger.
> 2. **Suite `pytest` del backend — 113/113 PASAN** (`evidencias/tests/pytest.txt`), incluye
>    checkout atómico, concurrencia y *snapshot* de pedido.
>
> La tabla de abajo (matriz §7 completa) sigue **preparada para diligenciar con el usuario**.

| Módulo | Casos definidos | Aprobados | Pendientes | No aplica | Observaciones |
|---|---:|---:|---:|---:|---|
| Autenticación (7.1) | 20 | _por diligenciar_ | 20 | AC-AUTH-03 (registro empresa en móvil) | — |
| Catálogo (7.2) | 11 | _por diligenciar_ | 11 | AC-CAT-10 (perfil empresa móvil) | Búsqueda/ofertas/novedades: apoyo de `pytest` (`test_product_search.py`, `test_offers_and_new.py`) — ejecución no verificada |
| Producto (7.3) | 9 | _por diligenciar_ | 9 | 0 | Varios casos con apoyo de `test_public_and_commerce.py` / `test_variants.py` / `test_pricing.py` |
| Carrito (7.4) | 16 | _por diligenciar_ | 16 | 0 | Casos de stock (AC-CART-04, 15, 16) con apoyo de `test_public_and_commerce.py` |
| Checkout (7.5) | 15 | _por diligenciar_ | 11 | 0 | **4 casos con soporte de prueba automatizada VERIFICADA** (AC-CHK-08, 09, 10, 11) |
| Pedidos (7.6) | 6 | _por diligenciar_ | 6 | 0 | — |
| Favoritos (7.7) | 6 | _por diligenciar_ | 6 | 0 | AC-FAV-06 = restricción por rol |
| Reseñas (7.8) | 7 | _por diligenciar_ | 6 | AC-REV-06 (móvil) | AC-REV-07 requiere verificar si la edición está en la interfaz web |
| Direcciones (7.9) | 5 | _por diligenciar_ | 5 | 0 | — |
| RehniCoin (7.10) | 6 | _por diligenciar_ | 6 | 0 | — |
| Panel Empresa (7.11) | 16 | _por diligenciar_ | 16 | 0 | Solo web |
| Panel Administración (7.12) | 22 | _por diligenciar_ | 22 | 0 | Solo web |
| Infraestructura y API (7.13) | 11 | 3 (AC-INF-06, 08, 09) | 8 | 0 | AC-INF-06/08/09 verificados por comandos ejecutados en este trabajo |
| Casos negativos (8) | 42 | 1 (NEG-29) | 41 | 0 | NEG-29 cubierto por la prueba de concurrencia ejecutada |
| Responsive (9) | 16 | 0 | 16 | 0 | Todos en VERIFICACIÓN ESTÁTICA |
| Integración (10) | 14 | 1 (INT-05 lado backend) | 13 | 0 | INT-05 backend verificado por `pytest`; recorridos web/móvil pendientes |
| **TOTAL** | **240** | **9** | **231** | **6** (NO APLICA) | Los "aprobados" son solo verificaciones automatizadas/comandos, **no pruebas de aceptación con usuario** |

> **Interpretación honesta:** de ~240 casos definidos, **9 tienen respaldo objetivo** (pruebas automatizadas o comandos ejecutados en este trabajo) y el resto está **PENDIENTE DE EJECUCIÓN**. Ninguna prueba de aceptación **con usuario final** se ha ejecutado ni firmado a la fecha.

---

## 13. Criterios para aceptación final

RehniMarket se considerará **ACEPTADO** cuando se cumplan todas las condiciones siguientes:

### 13.1 Clasificación de defectos

| Severidad | Definición | Efecto sobre la aceptación |
|---|---|---|
| **Crítico** | Impide una operación esencial del negocio o compromete datos/saldo: no se puede comprar; se cobra sin crear el pedido; el stock queda negativo; se accede a datos de otro usuario/empresa; caída total de un componente. | **Bloquea la aceptación.** Debe corregirse y re-probarse antes de firmar el acta. |
| **Alto** | Un flujo principal falla en un escenario común, con solución alterna difícil: el checkout falla con saldo suficiente; los estados de pedido no avanzan; el login de un rol válido no funciona. | **Bloquea la aceptación** salvo acuerdo expreso de entrega con plan de corrección y fecha, registrado en el acta. |
| **Medio** | Un flujo secundario falla o un flujo principal falla en un escenario poco común, con solución alterna: un filtro del catálogo no aplica bien; un mensaje de error impreciso; un problema responsive puntual. | **No bloquea** la aceptación; se registra en el acta como pendiente con prioridad y responsable. |
| **Bajo** | Defecto cosmético o de detalle sin impacto funcional: tildes en un mensaje; alineación menor; texto mejorable. | **No bloquea**; se registra como observación. |
| **Funcionalidad pendiente (alcance futuro)** | Elemento que **no forma parte del alcance comprometido** (p. ej. empaquetado de la app móvil, pruebas de carga, panel de empresa en móvil). | **No es un defecto.** Se lista en el acta como "fuera de alcance / trabajo futuro". |

### 13.2 Umbral de aceptación

- **0** defectos Críticos abiertos.
- **0** defectos Altos abiertos (o con plan de corrección aceptado y firmado).
- Todos los casos de las secciones 7.1 a 7.6, 7.10 y los casos negativos NEG-13 a NEG-32 **ejecutados y aprobados** (son el núcleo del flujo de compra y de la seguridad de acceso).
- Los casos de los paneles de Empresa y Administración (7.11, 7.12) ejecutados y aprobados en su mayoría; los pendientes, con acuerdo escrito.
- Capacitación al usuario **realizada** con evidencia (sección 14).
- **Acta de entrega diligenciada y firmada** por ambas partes (sección 15).
- Avance global del proyecto **≥ 90 %** (conteo de casos aprobados vs. total, excluyendo NO APLICA y fuera de alcance).

---

## 14. Capacitación al usuario

> **Estado global: NO REALIZADA.** No existe evidencia de ninguna sesión de capacitación ejecutada. El plan queda listo para agendarse y ejecutarse durante la implantación / sustentación. Cada fila pasa a "REALIZADA" solo cuando exista la evidencia indicada.

### 14.1 Capacitación — Usuario comprador

| # | Tema | Contenido | Duración estimada | Responsable | Evidencia requerida | Estado |
|---|---|---|---|---|---|---|
| CAP-U-1 | Registro e inicio de sesión | Crear cuenta, verificar el correo, iniciar y cerrar sesión, recuperar contraseña | 15 min | Equipo de proyecto | Lista de asistencia + captura de una cuenta creada por el usuario | NO REALIZADA |
| CAP-U-2 | Navegación y catálogo | Home, categorías, búsqueda, ofertas, novedades, filtros y orden, detalle de producto y variantes | 15 min | Equipo de proyecto | Lista de asistencia + grabación de la sesión | NO REALIZADA |
| CAP-U-3 | Carrito y stock | Agregar productos y variantes, cambiar cantidades, eliminar, qué ocurre con un producto agotado, cuándo se deshabilita el pago | 15 min | Equipo de proyecto | Grabación + captura del carrito con un producto agotado | NO REALIZADA |
| CAP-U-4 | Checkout y RehniCoin | Elegir/crear dirección, entender subtotal/IVA/total, saldo de RehniCoin, cómo solicitar una recarga (WhatsApp), confirmar la compra | 20 min | Equipo de proyecto | Grabación + una compra de prueba realizada por el usuario | NO REALIZADA |
| CAP-U-5 | Pedidos, favoritos y reseñas | Ver pedidos y estados, cancelar cuando aplica, marcar favoritos, escribir una reseña de un producto entregado | 15 min | Equipo de proyecto | Grabación + capturas | NO REALIZADA |
| CAP-U-6 | App móvil | Diferencias con la web (no hay perfil de empresa, ni reseñas escritas, ni reportes), instalación con Expo Go | 10 min | Equipo de proyecto | Grabación + captura de la app en el dispositivo del usuario | NO REALIZADA |

### 14.2 Capacitación — Empresa

| # | Tema | Contenido | Duración estimada | Responsable | Evidencia requerida | Estado |
|---|---|---|---|---|---|---|
| CAP-E-1 | Acceso y perfil | Registro de empresa, verificación de correo, espera de aprobación, inicio de sesión, edición del perfil, logo y banner | 15 min | Equipo de proyecto | Lista de asistencia + grabación | NO REALIZADA |
| CAP-E-2 | Gestión de productos y variantes | Crear producto, especificaciones por categoría, crear/generar variantes con su propio stock y precio, descuentos, activar/desactivar, eliminar | 30 min | Equipo de proyecto | Grabación + un producto con variantes creado por la empresa | NO REALIZADA |
| CAP-E-3 | Gestión de pedidos | Ver pedidos y contadores, avanzar estados, registrar transportadora y guía, cancelar cuando aplica | 20 min | Equipo de proyecto | Grabación + capturas de transiciones de estado | NO REALIZADA |
| CAP-E-4 | Finanzas | Registrar cuenta bancaria y predeterminada, consultar balance y liquidaciones | 15 min | Equipo de proyecto | Grabación + captura | NO REALIZADA |

### 14.3 Capacitación — Administrador / Owner

| # | Tema | Contenido | Duración estimada | Responsable | Evidencia requerida | Estado |
|---|---|---|---|---|---|---|
| CAP-A-1 | Panel y estadísticas | Recorrido del panel, estadísticas, actividad reciente | 10 min | Equipo de proyecto | Lista de asistencia + grabación | NO REALIZADA |
| CAP-A-2 | Empresas y usuarios | Aprobar/rechazar certificación, suspender empresa (efecto de reembolso), editar/bloquear/eliminar usuarios, restricciones sobre cuentas Owner | 25 min | Equipo de proyecto | Grabación + capturas | NO REALIZADA |
| CAP-A-3 | Catálogo, anuncios, transportadoras | Categorías y especificaciones, atributos y colores, anuncios (banners visuales), transportadoras | 20 min | Equipo de proyecto | Grabación + capturas | NO REALIZADA |
| CAP-A-4 | Liquidaciones y RehniCoin | Vista previa y generación de liquidaciones, marcar como pagada, recargar RehniCoin a un usuario, historial de recargas | 20 min | Equipo de proyecto | Grabación + una recarga de prueba | NO REALIZADA |

---

## 15. Acta de entrega

> Sección **preparada para diligenciar** el día de la entrega formal. No debe firmarse antes de cumplir los criterios de la sección 13.

**ACTA DE ENTREGA Y ACEPTACIÓN — RehniMarket**

| Campo | Contenido |
|---|---|
| **Nombre del proyecto** | RehniMarket — Plataforma de comercio electrónico *marketplace* |
| **Programa / trimestre** | Tecnólogo en Análisis y Desarrollo de Software (ADSO) — Sexto trimestre |
| **Fecha de entrega** | _____________________ |
| **Versión entregada** | _____________________ (commit: _______________) |
| **Lugar** | _____________________ |

**Entregables:**

- [ ] Código fuente del backend (`RehniMarket-backend/`).
- [ ] Código fuente del frontend web (`RehniMarket-frontend/`).
- [ ] Código fuente de la aplicación móvil (`RehniMarket-mobile/`).
- [ ] `docker-compose.yml` y `Dockerfile` de backend y frontend.
- [ ] Migraciones de base de datos (`alembic/`).
- [ ] `DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.
- [ ] `docs/MANUAL_USUARIO_REHNIMARKET.md`.
- [ ] `INFORME_CALIDAD_REHNIMARKET.md`.
- [ ] `PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` (este documento) con la matriz diligenciada.
- [ ] Carpeta de evidencias de pruebas (`evidencias/`).
- [ ] Registro de la(s) capacitación(es) (listas de asistencia / grabaciones).

**Componentes entregados y estado:**

| Componente | Estado de entrega | Observaciones |
|---|---|---|
| Backend (API FastAPI + PostgreSQL + MinIO) | _____________ | |
| Frontend web | _____________ | Se entrega en configuración de desarrollo (`pnpm dev`); ver `INFORME_CALIDAD` §H-17 |
| Aplicación móvil | _____________ | Se ejecuta con Expo Go; sin empaquetado APK |

**Funcionalidades aceptadas:** _(listar los IDs de casos de prueba aprobados y firmados; adjuntar la matriz de la sección 7 diligenciada)_

**Pendientes / fuera de alcance:** _(listar defectos Medios/Bajos con prioridad y responsable, y los elementos de trabajo futuro: pruebas de carga, empaquetado móvil, endurecimiento de seguridad para producción, plan de respaldo de BD, etc. — ver `INFORME_CALIDAD_REHNIMARKET.md` §13)_

**Observaciones generales:** _____________________________________________

| | Responsable de entrega | Responsable de recepción (usuario / instructor) |
|---|---|---|
| **Nombre** | ______________________ | ______________________ |
| **Rol** | ______________________ | ______________________ |
| **Fecha** | ______________________ | ______________________ |
| **Firma** | ______________________ | ______________________ |

---

## 16. Trazabilidad con requisitos

### 16.1 Requisito → Caso de prueba → Evidencia

Los requisitos se identifican con los IDs de `docs/RehniMarket-HU.md` (HU-001 … HU-029). El documento `docs/RehniMarket-Requisitos.docx` (binario) no pudo inspeccionarse; si contiene IDs distintos, deben mapearse contra esta tabla al ejecutar.

| Requisito (HU) | Descripción resumida | Casos de prueba | Resultado | Evidencia |
|---|---|---|---|---|
| HU-001 | Catálogo público del Home | AC-CAT-01, AC-CAT-02 | Por registrar | `evidencias/catalogo/home-*` |
| HU-002 | Detalle público de producto (incl. variantes y stock) | AC-PROD-01 a AC-PROD-05, AC-CAT-11 | Por registrar | `evidencias/producto/` |
| HU-003 | Perfil público de empresa | AC-CAT-09 (W), AC-CAT-10 (M = NO APLICA) | Por registrar | `evidencias/catalogo/perfil-empresa.png` |
| HU-004 | Registro (comprador / empresa) | AC-AUTH-01, AC-AUTH-02, AC-AUTH-03 (M = NO APLICA), NEG-06, NEG-07 | Por registrar | `evidencias/auth/registro/` |
| HU-005 | Verificación de correo | AC-AUTH-04, AC-AUTH-05, AC-AUTH-06, NEG-08, NEG-09, NEG-10 | Por registrar | `evidencias/auth/` |
| HU-006 | Inicio de sesión y recuperación de contraseña | AC-AUTH-07 a AC-AUTH-12, NEG-01 a NEG-05, NEG-11, NEG-12 | Por registrar | `evidencias/auth/login/` |
| HU-007 | Retorno al contexto tras iniciar sesión | AC-AUTH-16, AC-FAV-05, AC-CHK-15, NEG-13, NEG-37 | Por registrar | `evidencias/auth/proteccion-rutas/` |
| HU-008 | Cierre de sesión | AC-AUTH-11, AC-AUTH-18 | Por registrar | `evidencias/auth/` |
| HU-009 | Gestión de la cuenta personal | AC-AUTH-13, AC-AUTH-14, AC-AUTH-15 | Por registrar | `evidencias/auth/cuenta/` |
| HU-010 | Favoritos | AC-FAV-01 a AC-FAV-06 | Por registrar | `evidencias/favoritos/` |
| HU-011 | Carrito | AC-CART-01 a AC-CART-08, AC-PROD-06 a AC-PROD-08, NEG-14 a NEG-19 | Por registrar (parcial: `pytest`) | `evidencias/carrito/` |
| HU-012 | Completar una compra | AC-CHK-01 a AC-CHK-15, AC-CART-09 a AC-CART-16, NEG-20 a NEG-29 | Por registrar (**parcial VERIFICADA**: AC-CHK-08/09/10/11, NEG-29) | `evidencias/checkout/`, `evidencias/carrito/agotado.png` |
| HU-013 | Consultar y cancelar pedidos | AC-ORD-01 a AC-ORD-06, NEG-30 | Por registrar | `evidencias/pedidos/` |
| HU-014 | Escribir una reseña | AC-REV-01 a AC-REV-07, NEG-38, NEG-39 | Por registrar | `evidencias/resenas/` |
| HU-015 | Consultar saldo y movimientos de RehniCoin | AC-COIN-01, AC-COIN-02, AC-COIN-05 | Por registrar | `evidencias/rehnicoin/` |
| HU-016 | Solicitar una recarga de RehniCoins | AC-COIN-03, AC-COIN-04, NEG-42 | Por registrar | `evidencias/rehnicoin/whatsapp.png` |
| HU-017 | Gestionar direcciones de envío | AC-ADDR-01 a AC-ADDR-05, NEG-24 | Por registrar | `evidencias/checkout/direccion/` |
| HU-018 | Perfil de la empresa | AC-EMP-01, AC-EMP-02, AC-EMP-16 | Por registrar | `evidencias/empresa/` |
| HU-019 | Publicar y gestionar productos | AC-EMP-03 a AC-EMP-09, NEG-33 | Por registrar (parcial: `test_variants.py`) | `evidencias/empresa/productos/` |
| HU-020 | Gestionar pedidos recibidos | AC-EMP-10 a AC-EMP-13, AC-ORD-06 | Por registrar | `evidencias/empresa/pedidos/` |
| HU-021 | Información financiera y cuentas bancarias | AC-EMP-14, AC-EMP-15, AC-ADM-19 | Por registrar | `evidencias/empresa/finanzas.png` |
| HU-022 | Gestionar cuentas de usuario | AC-ADM-06 a AC-ADM-09, NEG-04 | Por registrar | `evidencias/admin/` |
| HU-023 | Gestionar empresas registradas | AC-ADM-02 a AC-ADM-05, AC-AUTH-09 | Por registrar | `evidencias/admin/empresas/` |
| HU-024 | Gestionar el catálogo de la plataforma | AC-ADM-11 a AC-ADM-13 | Por registrar (parcial: `test_catalog_attributes.py`) | `evidencias/admin/catalogo/` |
| HU-025 | Gestionar los anuncios del Home | AC-ADM-14, AC-ADM-15 | Por registrar (parcial: `test_advertisements.py`) | `evidencias/admin/anuncios/` — **ver 16.2 (nota sobre "texto")** |
| HU-026 | Generar y administrar liquidaciones | AC-ADM-18 a AC-ADM-20 | Por registrar | `evidencias/admin/liquidaciones/` |
| HU-027 | Recargar el saldo de RehniCoin de un usuario | AC-ADM-21, AC-ADM-22, AC-COIN-06, NEG-31 | Por registrar | `evidencias/admin/recarga/` |
| HU-028 | Panel de estadísticas | AC-ADM-01 | Por registrar | `evidencias/admin/dashboard.png` |
| HU-029 | Administrar cuentas Owner (exclusivo Owner) | AC-ADM-09, AC-ADM-10 | Por registrar | `evidencias/admin/owner/` |

### 16.2 Inconsistencias detectadas entre documentación y código

Conforme a la regla 14 del encargo, se toma **el código actual como fuente principal** y se deja constancia:

| # | Documento | Lo que dice el documento | Lo que hace el código | Fuente en el código |
|---|---|---|---|---|
| INC-01 | `docs/RehniMarket-HU.md` (HU-025) | "El administrador puede crear un anuncio con imagen, **texto** y enlace." | El anuncio es un **banner solo visual**: imagen(es) + enlace/destino + segmentación. **No tiene título, descripción ni texto de botón.** | `app/schemas/SchemaDashboard/SchemaAdvertisement.py` (comentario explícito y campos); migración `alembic/versions/d4e5f6a7b8c9_advertisement_drop_text_fields.py` |
| INC-02 | `docs/RehniMarket-HU.md` (HU-004) | Una empresa recién registrada "puede iniciar sesión, pero su condición de empresa verificada no se muestra hasta ser aprobada". | Una empresa con certificación **pendiente NO puede iniciar sesión**: el login la rechaza con `COMPANY_PENDING` (*"Tu empresa esta en revision"*). También bloquea REJECTED y SUSPENDED. | `app/services/authentication/LoginService.py` |
| INC-03 | `RehniMarket-backend/README.md` | Nombra el proyecto **"Lubix"**, versión "1.1.2", y describe una estructura de carpetas antigua. | El proyecto es **RehniMarket** (commits "ver 2.x"); la estructura real es `app/` con las capas descritas en la sección 3.1. | `RehniMarket-backend/app/`, `git log`, `docker-compose.yml` |
| INC-04 | `RehniMarket-backend/CHANGELOG.md` | Última entrada `[1.1.2] - 2026-06-19`. | El estado real es posterior (versiones 2.x); el CHANGELOG no las refleja. | `git log --oneline` |
| INC-05 | `RehniMarket-backend/README.md` (paso de *seed*) | Sugiere activar el *seed* para cargar "un usuario admin, los roles y la categoria de producto". | El *seed* real (`run_seed`) crea roles, catálogos, especificaciones, atributos, transportadoras y cuentas `admin`/`owner`. La carga de **empresas y productos de ejemplo está comentada** (`# seed_companies_and_products(db)`). | `app/utils/seed.py` |
| INC-06 | `docs/RehniMarket-HU.md` (HU-014) | "El usuario puede eliminar su propia reseña." (correcto) — y el modelo de datos admite edición. | La interfaz web de la sección Opiniones ofrece de forma visible **crear** y **eliminar** la reseña propia. La **edición** (`PATCH /reviews/{id}` existe en el backend) no se confirmó como acción visible en la UI. Caso AC-REV-07 para verificarlo. | `src/features/public/reviews/components/ReviewsSection.tsx`, `app/routers/ReviewRouter.py` |

---

## 17. Lecciones aprendidas

Inferidas del repositorio y de su documentación (sin inventar experiencias):

1. **La validación de las reglas de negocio debe vivir en el servidor.** El proyecto resuelve el descuento de stock y el cobro de RehniCoin de forma atómica en `CheckoutService.py`, con pruebas de concurrencia. Deshabilitar el botón de pago en el frontend es una conveniencia de UX, no una barrera de seguridad. Esta separación permitió que la suite `pytest` (única con pruebas automatizadas) diera confianza sobre la parte crítica.

2. **El manejo de stock por variante exige disciplina.** El código distingue explícitamente `variant.stock` de `product.stock` en el carrito, el checkout y el detalle. Un error frecuente —usar el stock del producto base para una variante— se evita porque el cálculo de `availableStock` está centralizado en un solo lugar (`_to_item_response`). Lección: centralizar el cálculo de disponibilidad en una función única reduce el riesgo.

3. **Una buena UX de error mantiene al usuario en control.** El tratamiento de productos agotados dentro del carrito (marcar la línea, permitir eliminarla, deshabilitar el pago solo cuando corresponde, y no perder los demás productos) muestra que informar sin bloquear todo el flujo es mejor que un bloqueo total.

4. **Un contrato de error uniforme facilita el trabajo entre capas.** El formato `{ detail: { code, message } }` permite que web y móvil compartan la lógica de manejo de errores. La contrapartida: los enumerados de códigos están triplicados y se sincronizan a mano — un riesgo que conviene resolver con generación automática.

5. **La documentación de comportamiento envejece rápido.** Las inconsistencias INC-01 a INC-06 muestran que las historias de usuario y el README quedaron desalineados con el código. Lección: la documentación funcional necesita revisión periódica contra el código, y las pruebas de aceptación son un buen momento para hacerlo.

6. **Contenerizar desde el inicio hace reproducible el entorno de pruebas.** `docker-compose.yml` permite levantar backend + PostgreSQL + MinIO con un comando, y `tests/conftest.py` crea su propia base de datos aislada. Esto hace viable ejecutar pruebas de integración reales sin montar infraestructura a mano.

7. **Faltó cerrar el ciclo de QA en los clientes.** El backend tiene 113 pruebas; el frontend y el móvil no tienen ninguna. Para las pruebas de aceptación esto significa que todo el comportamiento de UI debe validarse manualmente. Lección para el próximo proyecto: incorporar pruebas de cliente y CI desde el comienzo.

---

## 18. Conclusión

RehniMarket es un sistema **funcionalmente completo en su alcance** (marketplace con catálogo, carrito, checkout con RehniCoin, pedidos, favoritos, reseñas, panel de empresa y panel de administración) y con un **núcleo transaccional sólido y respaldado por pruebas automatizadas** en la parte más crítica (reserva de stock y cobro en el checkout).

Sin embargo, **a la fecha de este documento NO se ha ejecutado una campaña formal de pruebas de aceptación con el usuario final, ni se ha realizado la capacitación, ni se ha firmado el acta de entrega.** Por lo tanto, **el sistema no puede declararse "aceptado"**. Lo que este documento aporta es:

- Un **plan de pruebas de aceptación completo** (~240 casos) trazado a las 29 historias de usuario y basado exclusivamente en el comportamiento real del código.
- La identificación de los **9 casos que ya tienen respaldo objetivo** (pruebas automatizadas y comandos ejecutados en este trabajo), frente a los **231 pendientes de ejecución**.
- El detalle del **manejo real del stock** (producto base vs. variante, carrito con agotados, estado del botón de pago) como conjunto de casos verificables.
- Un **plan de capacitación** y un **acta de entrega** listos para diligenciar.
- El registro de **6 inconsistencias** entre la documentación previa y el código, con el código como fuente.

El siguiente paso para la sustentación es **ejecutar los casos del núcleo (autenticación, catálogo, carrito, checkout, pedidos, RehniCoin y casos negativos), registrar los resultados y las evidencias en este mismo documento, realizar la capacitación y diligenciar el acta**.

---

## 19. Relación con criterios SENA

### Actualización 2026-08-31 — muestra técnica ejecutada

Se ejecutó **`scripts/acceptance_smoke.sh`** contra la API real (backend levantado con
`docker compose`): cubre **registro, verificación de correo, login, cooldown de reenvío,
credenciales inválidas, refresh token, protección de rutas (401), autorización por rol
(403 comprador→admin y comprador→empresa), restricción de recarga de saldo, catálogo,
búsqueda difusa, ofertas, novedades, producto con variante obligatoria, carrito y
persistencia, checkout sin saldo (`INSUFFICIENT_BALANCE` 402, sin crear pedido), checkout
con saldo (pedido creado + saldo descontado + stock descontado + carrito vaciado), y
listado de pedidos.**

Resultado: ver `evidencias/acceptance/resultados.txt`.

> **Esto NO reemplaza la prueba de aceptación con el usuario final** (que requiere una
> persona operando la interfaz y firmando). Es la **evidencia técnica reproducible** de que
> el núcleo funcional se comporta según este plan. La suite `pytest` del backend
> (**113/113 pasan**, `evidencias/tests/pytest.txt`) respalda además el checkout atómico y
> la concurrencia (AC-CHK-08/09/10/11, NEG-29).

**Lo que sigue requiriendo intervención humana** (no automatizable):
1. Ejecutar la matriz §7 **con un usuario final**, operando la interfaz web/móvil, y firmar
   cada resultado.
2. Tomar las **capturas de navegador** de §11.
3. Realizar la(s) **sesión(es) de capacitación** de §14 (lista de asistencia + grabación).
4. **Diligenciar y firmar** el acta (`docs/ACTA_ENTREGA_REHNIMARKET.md`).

### Criterio 6 — Pruebas de aceptación y entrega formal

*"Ejecuta pruebas de aceptación con el usuario final, realiza las capacitaciones correspondientes y diligencia el acta de entrega según los niveles de servicio acordados."*

| Elemento del criterio | Dónde se cubre | Estado |
|---|---|---|
| **Plan de pruebas de aceptación** | Secciones 2–6 | ✅ Elaborado |
| **Matriz de pruebas** | Sección 7 (~198 casos) + Sección 8 (42 negativos) | ✅ Elaborada — 🟡 muestra técnica ejecutada; ejecución con usuario pendiente |
| **Muestra técnica contra la API** | `scripts/acceptance_smoke.sh` → `evidencias/acceptance/resultados.txt` | ✅ Ejecutada 2026-08-31 |
| **Suite automatizada (backend)** | `evidencias/tests/pytest.txt` — **113/113** | ✅ Ejecutada 2026-08-31 |
| **Pruebas de stock (carrito/checkout)** | Sección 7.4, 7.5 y casos NEG-16 a NEG-29; nota metodológica sobre producto base vs. variante | ✅ Definidas — parcialmente respaldadas por `pytest` |
| **Pruebas responsive** | Sección 9 (web y móvil) | 🟡 VERIFICACIÓN ESTÁTICA — ejecución en dispositivos pendiente |
| **Pruebas de integración** | Sección 10 (Cliente → API → BD; Mobile → API → BD) | 🟡 Backend parcialmente verificado con `pytest`; recorridos de cliente pendientes |
| **Evidencias** | Sección 11 (tabla de capturas a obtener, con ubicación sugerida) | ⏳ Por conseguir |
| **Resultados de aceptación** | Sección 12 (tabla resumen preparada para diligenciar) | ⏳ Por diligenciar |
| **Criterios de aceptación final / niveles de servicio** | Sección 13 (clasificación de defectos Crítico/Alto/Medio/Bajo y umbral de aceptación ≥ 90 %) | ✅ Definidos |
| **Capacitación al usuario** | Sección 14 (planes para comprador, empresa y administrador con tema, duración, responsable, evidencia) | 🟡 Planificada — NO REALIZADA |
| **Acta de entrega** | Sección 15 (formato completo listo para firmar) | 🟡 Preparada — sin diligenciar |
| **Trazabilidad con requisitos** | Sección 16 (HU-001 … HU-029 → casos → evidencia) + inconsistencias documentadas | ✅ Elaborada |

**Elementos pendientes para completar el Criterio 6:**

1. Ejecutar la matriz de pruebas (al menos el núcleo definido en la sección 13.2) con un usuario final y registrar resultados + evidencias.
2. Ejecutar las pruebas responsive en dispositivos/resoluciones reales.
3. Realizar las sesiones de capacitación y guardar la evidencia (listas de asistencia, grabaciones).
4. Diligenciar y firmar el acta de entrega.
5. Confirmar el avance ≥ 90 % y adjuntar la herramienta de gestión del proyecto con el estado de las tareas.

---

## 20. Checklist final para la sustentación

- [ ] Ejecutar las pruebas principales (secciones 7.1–7.6, 7.10) y registrar cada "Resultado obtenido" y "Estado".
- [ ] Tomar las capturas listadas en la sección 11 y organizarlas en la carpeta `evidencias/`.
- [ ] Registrar los resultados en la tabla de la sección 12 (aprobados / pendientes / no aplica).
- [ ] Ejecutar los casos negativos (sección 8), en especial NEG-13 a NEG-32.
- [ ] Validar el carrito y el stock: AC-CART-09 a AC-CART-16 (producto agotado, mezcla con disponibles, botón de pago, stock de variante vs. producto).
- [ ] Validar el checkout: AC-CHK-01 a AC-CHK-15 (dirección, resumen, IVA, total, RehniCoin, confirmación, rechazo por stock, carrito vaciado).
- [ ] Validar roles y permisos: AC-AUTH-08 a AC-AUTH-18, AC-EMP-09, AC-ADM-09, NEG-31 a NEG-36.
- [ ] Ejecutar la suite completa de `pytest` del backend y guardar la salida (`AC-INF-07`).
- [ ] Ejecutar `npx tsc --noEmit` (o `tsc -b`), `npx eslint .` (frontend) y `npx expo lint` (móvil); guardar las salidas.
- [ ] Realizar la(s) capacitación(es) de la sección 14 y guardar la evidencia.
- [ ] Diligenciar y firmar el acta de entrega (sección 15).
- [ ] Preparar la evidencia del proyecto: repositorio, `docker compose ps`, Swagger, PostgreSQL (tablas), MinIO (bucket `uploads`).
- [ ] Verificar que el avance sea ≥ 90 % (casos aprobados / total, excluyendo NO APLICA y fuera de alcance).
- [ ] Preparar la herramienta de gestión del proyecto (tablero de tareas / *issues*) con el estado actualizado.

---

*Fin del Plan de Pruebas de Aceptación — RehniMarket.*
