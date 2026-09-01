# Manual Técnico — RehniMarket

> **Proyecto:** RehniMarket — plataforma de comercio electrónico *marketplace*.
> **Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA, Sexto trimestre.
> **Criterio de evaluación:** 5 — *Documentación técnica y manuales de usuario*.
> **Fecha de elaboración:** 2026-08-31.
> **Rama analizada:** `feature/owner` — último commit del repositorio raíz: `917a647 ver 2.4` (más cambios de trabajo en curso en el árbol de trabajo).
>
> **Regla aplicada:** todo el contenido se deriva del **código real del repositorio** y de la
> documentación existente (`docs/`, `app/docs/`, `README`, `CHANGELOG`, `docker-compose.yml`,
> `pyproject.toml`, `package.json`, `alembic/`). Lo que no pudo verificarse en el código se
> marca explícitamente.
>
> **NOTA DE NORMALIZACIÓN DOCKER (posterior a este documento):** la configuración
> endurecida que este documento llama `docker-compose.prod.yml` /
> `RehniMarket-frontend/Dockerfile.prod` es ahora la **configuración por defecto**
> `docker-compose.yml` / `RehniMarket-frontend/Dockerfile` (imágenes
> `rehni-market-backend` / `rehni-market-frontend`; contenedores `rehni-backend` /
> `rehni-frontend` / `rehni-postgres` / `rehni-minio`; `docker compose up -d` sin
> `-f`). El modo desarrollo pasa a `docker-compose.dev.yml` /
> `RehniMarket-frontend/Dockerfile.dev`. Ver la tabla completa en
> `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` (nota de normalización).
>
> **Documentos complementarios:** el *manual de instalación* está cubierto por
> `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` (§7 y §13); el *manual de usuario final*
> por `docs/MANUAL_USUARIO_REHNIMARKET.md`.

---

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Objetivo](#2-objetivo)
3. [Arquitectura general](#3-arquitectura-general)
4. [Arquitectura del backend](#4-arquitectura-del-backend)
5. [Arquitectura del frontend web](#5-arquitectura-del-frontend-web)
6. [Arquitectura de la aplicación móvil](#6-arquitectura-de-la-aplicación-móvil)
7. [Tecnologías y versiones reales](#7-tecnologías-y-versiones-reales)
8. [Estructura del backend](#8-estructura-del-backend)
9. [Capas y responsabilidades](#9-capas-y-responsabilidades)
10. [Modelos y relaciones](#10-modelos-y-relaciones)
11. [Modelo entidad–relación](#11-modelo-entidadrelación)
12. [Autenticación](#12-autenticación)
13. [JWT y refresh tokens](#13-jwt-y-refresh-tokens)
14. [Roles y permisos](#14-roles-y-permisos)
15. [Gestión de productos](#15-gestión-de-productos)
16. [Gestión de empresas](#16-gestión-de-empresas)
17. [Pedidos y checkout](#17-pedidos-y-checkout)
18. [PostgreSQL](#18-postgresql)
19. [Alembic](#19-alembic)
20. [MinIO](#20-minio)
21. [Docker](#21-docker)
22. [Variables de entorno](#22-variables-de-entorno)
23. [Endpoints principales](#23-endpoints-principales)
24. [Swagger / OpenAPI](#24-swagger--openapi)
25. [Manejo de errores](#25-manejo-de-errores)
26. [Seguridad](#26-seguridad)
27. [Pruebas](#27-pruebas)
28. [Despliegue](#28-despliegue)
29. [Limitaciones conocidas](#29-limitaciones-conocidas)
30. [Mantenimiento](#30-mantenimiento)

---

## 1. Introducción

RehniMarket es un **marketplace** que conecta empresas vendedoras con compradores. Se compone
de tres aplicaciones cliente/servidor:

- **`RehniMarket-backend/`** — API REST (FastAPI, Python 3.13). Concentra **toda** la lógica de
  negocio, la autoridad sobre precios, stock, saldos, estados de pedido y permisos.
- **`RehniMarket-frontend/`** — aplicación web SPA (React 19 + Vite + TypeScript). Cubre los
  cuatro roles (Visitante, Usuario, Empresa, Administrador/Owner).
- **`RehniMarket-mobile/`** — aplicación móvil (Expo / React Native), orientada a
  **Visitante y comprador**.

El medio de pago interno es **RehniCoin** (1 RehniCoin = 1 peso colombiano); el saldo lo
acredita manualmente un administrador. El IVA colombiano (19 %) se aplica **por producto**
(`Product.applies_tax`). La plataforma cobra una **comisión del 5 %** sobre las ventas
liquidadas a las empresas.

## 2. Objetivo

Documentar la **arquitectura técnica, el modelo de datos, los mecanismos de seguridad, la
configuración y los procedimientos de despliegue y mantenimiento** de RehniMarket, de forma
que un desarrollador o un evaluador pueda entender, ejecutar, mantener y auditar el sistema
sin leer todo el código fuente.

## 3. Arquitectura general

Arquitectura **cliente–servidor de 3 capas**, contenerizada con Docker Compose:

```
 [App móvil Expo]  ──HTTP/JSON (axios)──┐
                                        │
 [Frontend web React] ──HTTP/JSON──────►│   [Backend FastAPI]   contenedor rehni-backend
                                        │   host :8001 → :8000
                    ┌───────────────────┼───────────────────────┐
                    ▼                   ▼                       ▼
      [PostgreSQL 17]           [MinIO (S3)]            [SMTP smtp.gmail.com:587]
      rehni-postgres            rehni-minio             (correos transaccionales)
      host :5434 → :5432        host :9000 → :9000
      vol postgres_rehni_data   vol minio_rehni_data
                                bucket "uploads"
```

- **Frontend/móvil → backend:** `VITE_API_URL` / `EXPO_PUBLIC_API_URL`.
- **Backend → PostgreSQL:** cadena `URL_DATABASE` (host = nombre de servicio `postgres`),
  motor SQLAlchemy con `pool_pre_ping=True`.
- **Backend → MinIO:** SDK `minio`, endpoint interno `MINIO_URL` (`minio:9000`),
  `secure=False`. Las imágenes se sirven al cliente **por un proxy del backend**
  (`GET /media/proxy?path=...`), nunca por URL directa a MinIO.
- **Backend → SMTP:** `smtplib` sobre `smtp.gmail.com:587` con STARTTLS.
- **Autorización:** un único middleware (`auth_middleware`) valida el JWT, revalida el estado
  de la cuenta/empresa en cada petición y aplica una **lista blanca de rutas por rol**.

Contrato de API uniforme: JSON; errores con forma `{ "detail": { "code": "...", "message": "..." } }`.

## 4. Arquitectura del backend

**Arquitectura por capas**, aplicada de forma consistente:

```
app/routers/     → define endpoints, valida el request (Pydantic), delega
app/services/    → lógica de negocio (precios, IVA, stock, estados, correos, payouts)
app/repository/  → acceso a datos (consultas SQLAlchemy encapsuladas)
app/models/      → entidades ORM (SQLAlchemy 2.0, Mapped[...], dialecto PostgreSQL)
app/schemas/     → contratos de entrada/salida (Pydantic v2)
app/core/        → configuración transversal (ErrorCodes, Exceptions, TaxConfig, PayoutConfig)
app/middleware/  → autenticación, autorización, CORS (orígenes desde URL_FRONTEND), rate limit (activable con RATE_LIMIT_ENABLED)
app/database/    → motor + SessionLocal + Base declarativa
app/utils/       → Security (bcrypt), seed, CheckNetwork, TestDatabase, Response
```

- **Entrypoint:** `app/main.py` — `FastAPI(lifespan=...)`. En el `lifespan` se ejecuta
  `ensure_bucket()` (MinIO) y, si `RUN_SEED=true`, `run_seed()`. Registra **24 routers**.
- **Sesión de BD por request:** dependencia `get_db()` (yield + close). El middleware de
  auth abre su propia `SessionLocal()` y la cierra en `finally`.
- **Sin estado de servidor:** la sesión del usuario vive en el JWT y en la tabla
  `refreshToken`; el backend puede replicarse tras un balanceador (no configurado hoy).

## 5. Arquitectura del frontend web

React 19 + Vite 8 + TypeScript + TailwindCSS 4. Organización **por *feature* (dominio)**:

```
src/api/        → cliente axios único (baseURL = VITE_API_URL) + interceptores (auth, errores)
src/features/{public, cart, orders, favorites, wallet, addresses, company, admin, user, ...}
                  cada feature: api/ · components/ · context/ · types/
src/shared/     → primitivas UI (Button, Modal, Skeleton, EmptyState), alertas globales,
                  utilidades, config (navegación por rol), tipos comunes (ErrorCode)
src/routers/    → AppRouter.tsx (rutas y guards por rol: RequireAuth)
src/pages/      → páginas "delgadas" que arman layout + vista
```

- **HTTP:** una sola instancia de axios; ningún servicio crea la suya.
- **Autorización real:** la impone el backend; el frontend solo refleja lo autorizado
  (deshabilita botones, oculta secciones, redirige a login conservando el destino).
- **Alias:** `@` → `src` (`vite.config.ts`).
- **Build de producción:** `pnpm build` = `tsc -b && vite build`.

## 6. Arquitectura de la aplicación móvil

Expo SDK 54 + Expo Router 6 + React Native 0.81.5.

```
src/api/        → cliente axios (baseURL = EXPO_PUBLIC_API_URL) + sesión en expo-secure-store
src/app/        → rutas basadas en archivos (Expo Router). Grupo (user) con tabs
src/screens/    → pantallas por dominio (home, product-detail, cart, checkout, orders, ...)
src/features/   → espejo del frontend web (cart, orders, favorites, wallet, addresses)
src/components/ · src/hooks/ · src/theme/ · src/types/ · src/utils/
```

- **Sesión:** tokens (access + refresh) en `expo-secure-store` (almacén cifrado del
  dispositivo), no en almacenamiento plano.
- **Alcance:** Visitante y comprador. Si una cuenta Empresa/Admin/Owner inicia sesión, la
  app **cierra la sesión automáticamente** (`src/app/(user)/_layout.tsx`).
- **Estado:** la app está en **expansión activa** (pantallas de carrito, checkout, pedidos,
  billetera y direcciones presentes en el árbol de trabajo). El documento
  `docs/RehniMarket-Requisitos.docx` §7.1 describe el alcance móvil **mínimo garantizado**
  (Home, detalle de producto, autenticación); el resto debe validarse antes de considerarlo
  entregable.
- **Empaquetado nativo (APK/AAB/IPA):** **no configurado** (sin `eas.json`, sin `android/` /
  `ios/`, `app.json` sin `version` ni *bundle identifiers*). El uso soportado hoy es
  **Expo Go** (`pnpm exec expo start --lan`).

## 7. Tecnologías y versiones reales

### Backend (`pyproject.toml`, `.python-version`, `Dockerfile`)

| Componente | Versión |
|---|---|
| Python | 3.13 |
| FastAPI | 0.135.1 |
| Uvicorn | 0.41.0 |
| SQLAlchemy | 2.0.48 |
| Alembic | 1.18.4 |
| psycopg2-binary | 2.9.11 |
| Pydantic / pydantic-settings | 2.12.5 / 2.13.1 |
| python-jose | 3.5.0 |
| passlib | 1.7.4 (bcrypt); también instalados `bcrypt==3.2.2`, `argon2-cffi==25.1.0` |
| minio (SDK) | 7.2.20 |
| Jinja2 | 3.1.6 |
| requests | 2.33.1 |
| sentry-sdk | 2.54.0 (declarado; **no inicializado** en el código) |
| Gestor de dependencias | uv (Astral) — `uv.lock`, `uv sync --frozen --no-dev` |
| Pruebas / auditoría (grupo `dev`) | pytest ≥8.3, pytest-cov ≥6.0, pip-audit ≥2.10 |

### Frontend web (`package.json`, `Dockerfile`)

| Componente | Versión |
|---|---|
| Node.js | 22 (`node:22-alpine`) |
| pnpm | 11.15.0 |
| React / React DOM | ^19.2.7 |
| Vite | ^8.1.0 |
| react-router-dom | ^7.18.1 |
| axios | ^1.18.1 |
| TailwindCSS | ^4.3.2 (`@tailwindcss/vite`) |
| TypeScript | ~6.0.2 |
| ESLint | ^10.5.0 (`eslint.config.js` plano) |

### App móvil (`package.json`, `app.json`)

| Componente | Versión |
|---|---|
| Expo | ^54.0.1 |
| Expo Router | ~6.0.0 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| axios | ^1.19.0 |
| expo-secure-store | ^15.0.8 |
| TypeScript | ^5.3.3 (`tsconfig.json` con `"strict": true`) |
| Pruebas | jest + jest-expo (preset configurado; **sin archivos de prueba**) |

### Infraestructura

| Componente | Versión |
|---|---|
| PostgreSQL | 17 (`postgres:17-alpine`) |
| MinIO | `minio/minio:latest` (versión no fijada) |
| Docker Engine | 29.6.2 (equipo de validación) |
| Docker Compose | 5.3.1 (equipo de validación) |

## 8. Estructura del backend

```text
RehniMarket-backend/
├── Dockerfile                  # python:3.13-slim + uv; CMD uvicorn (sin --reload)
├── .dockerignore
├── .env / .env.example         # .env real NO versionado (.gitignore)
├── .python-version             # 3.13
├── pyproject.toml / uv.lock    # dependencias (uv / PEP 621)
├── alembic.ini
├── main.py                     # script trivial (NO es el entrypoint de la API)
├── CHANGELOG.md · README.md
├── alembic/
│   ├── env.py                  # toma la URL de app.Config; importa Base.metadata
│   └── versions/               # 10 migraciones (29fe206320ce → a1b2c3d4e5f6)
├── app/
│   ├── main.py                 # app = FastAPI(lifespan=...); 24 routers
│   ├── Config.py               # variables de entorno
│   ├── core/                   # ErrorCodes.py (102 códigos), Exceptions.py (api_error),
│   │                           # TaxConfig.py (IVA 19%), PayoutConfig.py (comisión 5%)
│   ├── database/Connection.py  # engine + SessionLocal + Base
│   ├── middleware/             # AuthMiddleware, AuthUser, CorsMiddleware,
│   │                           # RateLimitMiddleware, RolePermissions, PublicRoutes
│   ├── models/                 # ~28 archivos, ~36 tablas ORM
│   ├── repository/
│   ├── routers/                # 24 archivos
│   ├── schemas/                # SchemaCommerce, SchemaDashboard, SchemaPublic, schemaAuth
│   ├── services/
│   │   ├── authentication/     # Register, Login, VerifyEmail, ForgotPassword, ResetPassword,
│   │   │                       # RefreshToken, Me, JWTService
│   │   ├── commerce/           # Cart, Checkout, Order, Address, Favorite, Review, Report, Wallet
│   │   ├── DashboardService/company/   # Dashboard, Products, Variants, VariantGenerate,
│   │   │                               # ProductAttributes, ProductDiscount, BankAccount
│   │   ├── DashboardService/admin/     # Company, User, Catalog, CatalogAttribute, Specification,
│   │   │                               # colors, Advertisement(+Targeting), Report, ShippingCarrier, Dashboar
│   │   ├── email/              # EmailService (SMTP), CodeService, OrderEmailService,
│   │   │                       # PayoutEmailService, template/*
│   │   ├── publicService/      # Products, Company, Advertisements, ShippingCarriers
│   │   ├── variants/           # attributes, combo_key, images, resolver
│   │   ├── pricing.py · PayoutService.py · NasService.py
│   └── utils/                  # Security.py, seed.py, CheckNetwork.py, TestDatabase.py, Response.py
└── tests/                      # conftest.py + 7 archivos test_*.py (113 funciones)
```

## 9. Capas y responsabilidades

| Capa | Responsabilidad | Ejemplos |
|---|---|---|
| **Router** (`app/routers/`) | Declara la ruta y el método, valida el `body`/`query` con Pydantic, extrae el usuario del `request.state`, delega en un servicio. No contiene lógica de negocio. | `CheckoutRouter.py` → `POST /checkout` |
| **Service** (`app/services/`) | Reglas de negocio: cálculo de precios/IVA/comisión, validación de stock, transiciones de estado de pedido, envío de correos, generación de payouts. Abre transacción, hace `commit`/`rollback`. | `CheckoutService.py`, `pricing.py`, `PayoutService.py` |
| **Repository** (`app/repository/`) | Consultas SQLAlchemy encapsuladas y reutilizables entre servicios. | `CartRepository` usado por `CartService` y `CheckoutService` |
| **Model** (`app/models/`) | Entidades ORM (SQLAlchemy 2.0 `Mapped[...]`), relaciones, `Enum` nativos de PostgreSQL, índices. | `ModelOrder.py` (`Order`, `OrderItem`, `OrderStatusEnum`) |
| **Schema** (`app/schemas/`) | Contratos de request/response (Pydantic v2) con restricciones (`Field(ge=1)`, `max_length`, `UUID`, `EmailStr`). | `SchemaCommerce/SchemaOrder.py` |
| **Core** (`app/core/`) | Constantes transversales: catálogo de códigos de error, helper `api_error`, tasa de IVA, porcentaje de comisión, tasa de conversión de RehniCoin. | `TaxConfig.TAX_RATE = 0.19`, `PayoutConfig.COMMISSION_PERCENTAGE = 0.05` |
| **Middleware** (`app/middleware/`) | Autenticación, autorización por rol, CORS. | `auth_middleware` |

## 10. Modelos y relaciones

**~36 tablas** (más `alembic_version` → 37). Relaciones principales (FK reales del código):

| Dominio | Tablas | Relaciones clave |
|---|---|---|
| **Roles y usuarios** | `roles`, `users`, `refreshToken`, `event_codes`, `admin_activities` | `users.role_id → roles.id`; `users` 1—N `event_codes`, `refreshToken`; `admin_activities.admin_id → users.id`, `.target_user_id → users.id`, `.company_id → company.id` |
| **Empresas** | `company`, `company_bank_accounts`, `company_payouts` | `company.user_id → users.id` (1—1); `company_bank_accounts.company_id → company.id`; `company_payouts.company_id → company.id`, `.bank_account_id → company_bank_accounts.id` |
| **Catálogo** | `catalog`, `catalog_attributes`, `catalog_attribute_options`, `color_variants` *(legacy)*, `specification_templates` *(legacy)* | `catalog_attributes.catalog_id → catalog.id`; `catalog_attribute_options.attribute_id → catalog_attributes.id`; `catalog.parent` autoreferencia |
| **Productos** | `products`, `product_images`, `product_attribute_values`, `product_specifications` *(legacy)* | `products.company_id → company.id`, `.catalog_id → catalog.id`, `.main_color_id → color_variants.id` *(legacy)*, `.parent` autoref; `product_images.product_id → products.id`; `product_attribute_values.product_id → products.id`, `.attribute_id → catalog_attributes.id` |
| **Variantes** | `product_variants`, `product_variant_images`, `variant_options`, `variant_attribute_values`, `variant_specifications` *(legacy, vacía)* | `product_variants.product_id → products.id`; `variant_options.variant_id → product_variants.id`, `.attribute_id → catalog_attributes.id`, `.option_id → catalog_attribute_options.id`; `product_variant_images.variant_id → product_variants.id` |
| **Carrito** | `carts`, `cart_items` | `carts.user_id → users.id` (1—1); `cart_items.cart_id → carts.id`, `.product_id → products.id`, `.variant_id → product_variants.id` |
| **Pedidos** | `orders`, `order_items` | `orders.user_id → users.id`, `.company_id → company.id`, `.address_id → addresses.id`, `.shipping_carrier_id → shipping_carriers.id`; `order_items.order_id → orders.id`, `.product_id → products.id`, `.variant_id → product_variants.id` (sin `ON DELETE CASCADE`); `order_items.attributes_snapshot` (JSONB) |
| **Billetera (RehniCoin)** | `wallets`, `wallet_transactions`, `rehnicoin_movements` | `wallets.user_id → users.id` (1—1); `wallet_transactions.wallet_id → wallets.id`, `.user_id → users.id`, `.order_id → orders.id`; `rehnicoin_movements.company_id → company.id`, `.payout_id → company_payouts.id` |
| **Direcciones / Favoritos / Reseñas** | `addresses`, `favorites`, `reviews` | todas `*.user_id → users.id`; `favorites`/`reviews` `.product_id → products.id` |
| **Reportes** | `reports`, `report_evidences` | `reports.reporter_id → users.id`, `.product_id → products.id`, `.company_id → company.id`; `report_evidences.report_id → reports.id` |
| **Anuncios** | `advertisements` | FK opcionales a `products.id`, `catalog.id`, `company.id` (destino de segmentación) |
| **Envío** | `shipping_carriers` | catálogo; referenciado por `orders.shipping_carrier_id` |

**Enumerados nativos de PostgreSQL:** `OrderStatusEnum` (pending, paid, processing, shipped,
delivered, cancelled), `CompanyCertificateEnum` (pending, approved, rejected), `PayoutStatusEnum`
(pending, paid), `BankAccountTypeEnum`, `WalletTransactionType` (recarga, compra, reembolso,
ajuste), `ReportTargetType`, `ReportStatus`, `AdvertisementTargetType`, `AdminActivityAction`,
`TypeCode` (VERIFY_EMAIL, RESET_PASSWORD).

**Arquitectura de variantes/atributos:** ver `RehniMarket-backend/app/docs/ARQUITECTURA-VARIANTES.md`
(modelo genérico: `CatalogAttribute.role` = `variant` | `product`; `ProductVariant.combo_key`
= SHA-256 determinista de los `option_id` ordenados; índice único parcial
`uq_variant_product_combo_active` sobre `(product_id, combo_key) WHERE deleted_at IS NULL`;
soft-delete de variantes).

## 11. Modelo entidad–relación

```
                roles ──1───N── users ──1───1── company ──1───N── company_bank_accounts
                                  │                │                      │
             ┌────────────────────┼──────────┐     │ 1                    │ 1
             │ 1        1         1│         1│     N                     N
        event_codes  refreshToken cart    wallet  company_payouts ───────┘
                                   │        │        │
                                  1│       1│       1│ N
                                   N        N     rehnicoin_movements
                              cart_items  wallet_transactions
                                   │             │
                    ┌──────────────┤             └────► orders (FK order_id)
                    │              │
              products ──1──N── product_variants ──1──N── variant_options ──► catalog_attribute_options
                 │  │  1              │  1                        │
                 │  │  N              │  N                        └──► catalog_attributes ──► catalog
                 │  │ product_images  │ product_variant_images
                 │  │  1              │
                 │  │  N              │
                 │  product_attribute_values ──► catalog_attributes
                 │
       company ──1──N── products
       catalog ──1──N── products

        users ──1──N── addresses ──┐
        users ──1──N── favorites   │
        users ──1──N── reviews     │ N
        users ──1──N── orders ──────┤ ── company ──1──N── orders
                          │ 1       │
                          │ N       ▼
                     order_items  addresses (FK address_id, snapshot en el pedido)
                          │
                          └──► products / product_variants  (+ attributes_snapshot JSONB)

        users ──1──N── reports ──1──N── report_evidences
        advertisements ──► (products | catalog | company)   [FK opcionales de segmentación]
        shipping_carriers ──1──N── orders
        alembic_version   [control de migraciones]
```

> Diagrama textual. Para un ER gráfico puede generarse con `sqlalchemy-schemadisplay` o
> `eralchemy` a partir de `app/models/` (no incluido en el proyecto).

## 12. Autenticación

Flujo completo (`app/services/authentication/`, `app/routers/AuthRouters.py`):

1. **Registro** — `POST /auth/register-user` (comprador) / `POST /auth/register-company`
   (empresa + NIT + certificado). Crea la cuenta con `verified=false` y genera un código
   `VERIFY_EMAIL` en `event_codes` (se envía por SMTP).
2. **Verificación** — `POST /auth/verify-email-user` con el código. Marca `verified=true`.
   - Código válido **5 minutos** (`CodeService.CODE_EXPIRATION_MINUTES`).
   - **Un único código activo** por usuario+tipo (`create_code_service` borra el anterior).
   - **Cooldown de reenvío 60 s** (`RESEND_COOLDOWN_SECONDS`), aplicado contra `created_at`.
   - `POST /auth/change-email` permite corregir el correo antes de verificar y reenvía.
   - `POST /auth/resend-verification-code` (ruta pública): `429 RESEND_COOLDOWN_ACTIVE`
     con `retry_after` si está dentro del cooldown.
3. **Login** — `POST /auth/login-user`. Valida credenciales (bcrypt), estado y verificación.
   - Cuenta no verificada → `400 EMAIL_NOT_VERIFIED` (el cuerpo trae `expires_in` /
     `resend_available_in`); **el código se `commit()`ea** antes de responder.
   - Cuenta bloqueada (`Users.isActive = false`) → `403 USER_BLOCKED`.
   - Empresa con certificación pendiente/rechazada/suspendida → `403` con
     `COMPANY_PENDING` / `COMPANY_REJECTED` / `COMPANY_SUSPENDED` (`LoginService.py`).
   - Éxito → devuelve `access_token` + `refresh_token`.
4. **Recuperación de contraseña** — `POST /auth/forgot-password-user` (envía código
   `RESET_PASSWORD`, válido 15 min) + `POST /auth/reset-password-user` (código + nueva
   contraseña).
5. **Sesión activa** — `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/me/photo`.
6. **Cierre de sesión** — operación de cliente (borra los tokens locales). No hay endpoint
   de logout con efecto en servidor.

Hash de contraseñas: `app/utils/Security.py` con `passlib` esquema **bcrypt**, truncado
seguro a 72 bytes. Nunca se almacenan ni registran en claro.

## 13. JWT y refresh tokens

`app/services/authentication/JWTService.py`:

| Token | Contenido (`payload`) | Expiración | Firma |
|---|---|---|---|
| **access** | `{ sub: user_id, role, type: "access", exp }` | `ACCESS_TOKEN_EXPIRE_MINUTES` (ej. 30) | HS256 con `SECRET_KEY` |
| **refresh** | `{ sub: user_id, type: "refresh", exp }` | `REFRESH_TOKEN_DAYS` (ej. 15) | HS256 con `SECRET_KEY` |

- `verify_token()` devuelve el `payload` (dict), `"expired"` (firma vencida) o `None` (inválido).
- El **access token no lleva `role` inventable**: el middleware siempre revalida el usuario
  contra la BD.
- **Refresh token persistido** en la tabla `refreshToken` (`ModelRefreshToken`) →
  `POST /auth/refresh` (`RefreshTokenService.py`) valida que exista, no esté expirado y que
  la cuenta/empresa siga activa antes de emitir un nuevo access token.
- El middleware **rechaza un refresh usado como access** (`payload.get("type") != "access"`).
- El cliente web y el móvil renuevan de forma transparente (interceptor axios / SecureStore);
  si el refresh también falla, se redirige a login conservando la pantalla de origen.

## 14. Roles y permisos

Cinco roles: **Visitante** (sin sesión), `user`, `company`, `admin`, `owner`.
Definición en `app/middleware/RolePermissions.py` y `app/utils/seed.py`.

`app/middleware/AuthMiddleware.py` — orden de comprobaciones por petición:

1. `OPTIONS` → pasa (CORS preflight).
2. Ruta en `PUBLIC_ROUTES` (igualdad exacta) o con prefijo/sufijo público
   (`/public/products/{id}`, `/public/company/{id}`, `/public/catalogs/{id}/attributes`,
   `/media/proxy`, `/docs`, `/openapi.json`, health…) → pasa sin token.
3. `Authorization: Bearer <token>` obligatorio; formato validado.
4. `verify_token`: expirado → `401 TOKEN_EXPIRED`; inválido → `401 INVALID_TOKEN`;
   `type != "access"` → `401`.
5. Se carga el usuario de la BD (`get_authenticated_user`):
   - No existe → `401`.
   - `isActive = false` → `403 USER_BLOCKED`.
   - `role == "company"` y `company.CompanyStatus = false` → `403 COMPANY_SUSPENDED`
     (con `reason` si `company.suspension_reason` existe).
   - `role` desconocido → `403 FORBIDDEN`.
6. **Autorización por rol:**
   - `admin` / `owner` (`FULL_ACCESS_ROLES`) → **bypass total** (acceso a cualquier ruta).
     Las capacidades exclusivas del **Owner** (asignar rol Owner, gestionar cuentas Owner) se
     protegen **a nivel de servicio**, no de ruta.
   - `user` / `company` → **lista blanca de prefijos** (`ROLES_PERMISSIONS_ROUTERS`): la ruta
     debe empezar por uno de los prefijos permitidos; si no → `403 FORBIDDEN`.
7. Se inyecta `request.state.user_id`, `request.state.role`, `request.state.user`.

Prefijos permitidos por rol (extracto real):

| Rol | Prefijos |
|---|---|
| `user` | `/auth/me`, `/cart`, `/checkout`, `/orders`, `/favorites`, `/addresses`, `/wallet/me`, `/wallet/transactions`, `/reviews`, `/reports` |
| `company` | `/company/dashboard/*`, `/company/bank-accounts`, `/company/payouts`, `/company/balance`, `/auth/me` |
| `admin` / `owner` | (bypass) — además lista explícita de `/admin/dashboard/*`, `/admin/payouts`, `/admin/reports` |

> **Nota de seguridad:** `POST /wallet/recharge` **no** está en la lista blanca de `user`:
> acreditar saldo es exclusivo de `admin`/`owner` vía `POST /admin/wallet/recharge`.

## 15. Gestión de productos

- **Modelo:** un `Product` es la identidad (nombre, descripción, categoría, empresa); la
  **unidad comprable es `ProductVariant`** (precio, stock, descuento, imágenes propias).
  `Product.price` / `Product.stock` reflejan la variante viva más barata.
- **Atributos por categoría:** `CatalogAttribute` con `role`:
  - `variant` → eje de variante (Color, Talla, Almacenamiento…): genera inventario.
  - `product` → atributo descriptivo/filtrable (Marca, Modelo…): no genera inventario.
- **Endpoints de empresa** (`CompanyProductArchitectureRouters`, `CompanyRouter`):
  `POST /company/dashboard/create-product`, `GET /company/dashboard/get-my-products`,
  `PATCH .../update-my-product/{id}`, `PATCH .../change-status-my-product/{id}`,
  `DELETE .../delete-my-product/{id}` (baja lógica),
  `POST/PATCH/DELETE /company/dashboard/products/{id}/variants[...]`,
  `POST .../variants/generate` (matriz cartesiana de combinaciones),
  `PUT .../products/{id}/discount` (porcentaje o fijo + ventana temporal).
- **Precio efectivo:** `app/services/pricing.py::resolve_price` — descuento de variante
  vigente → descuento de producto vigente → precio base. **El frontend nunca recalcula.**
- **Disponibilidad pública:** un producto con variantes es visible si existe ≥1 variante
  **viva** con `stock > 0` (`_has_visible_stock`).
- **Imágenes:** subidas a MinIO (`companies/<NIT>/products|variants/<uuid>.<ext>`); la BD
  guarda la ruta; se sirven por `/media/proxy`.
- Un producto y sus variantes solo los gestiona **la empresa que los creó** (verificación de
  *ownership* en el servicio).

## 16. Gestión de empresas

- **Registro:** `POST /auth/register-company` — crea `users` (rol `company`) + `company`
  (NIT, DV, certificado PDF subido a MinIO), `CompanyCertificate = pending`.
- **Aprobación:** `PATCH /admin/dashboard/companies/certificate/status/{id}` — `approved` /
  `rejected`. Solo una empresa **aprobada** puede iniciar sesión y aparece como "verificada".
- **Suspensión:** `PATCH /admin/dashboard/company/status/{id}` — al desactivar
  (`CompanyStatus = false`), sus pedidos en `pending`/`paid`/`processing` se **cancelan y se
  reembolsan** en RehniCoin al comprador (`CompanyService` + `WalletService.refund`).
- **Perfil:** `GET /company/dashboard/me`, `PATCH .../my-profile`,
  `PATCH .../patch-media-logo-banner`.
- **Finanzas:** cuentas bancarias (`/company/bank-accounts`), balance (`/company/balance`),
  liquidaciones (`/company/payouts`). Una liquidación exige **cuenta bancaria predeterminada**.
- **Perfil público:** `GET /public/company/{id}`, `.../products`, `.../rating` (promedio y
  conteo reales calculados de las reseñas).

## 17. Pedidos y checkout

`app/services/commerce/CheckoutService.py` — `POST /checkout` con `{ addressId }`:

1. **Revalida** cada línea: producto activo, empresa no suspendida, variante viva.
2. **Recalcula** precios e IVA en el servidor (`pricing.resolve_price`, `TaxConfig.compute_tax`).
3. **Verifica dirección** (si no hay → `DEBES_REGISTRAR_DIRECCION` / se abre el formulario).
4. **Reserva de stock atómica:** por cada línea, `UPDATE product_variants SET stock = stock - :q
   WHERE id = :id AND stock >= :q`; las líneas se ordenan de forma determinista para evitar
   *deadlocks*. Si alguna no afecta filas → el ítem "ya no tiene suficiente stock" y se hace
   **rollback total**.
5. **Billetera:** `SELECT ... FOR UPDATE` sobre `wallets`; si el saldo `< total` →
   `INSUFFICIENT_BALANCE` (`402`) y rollback.
6. **Crea un `Order` por empresa** vendedora + sus `OrderItem` con
   `attributes_snapshot` (JSONB) congelado.
7. **Descuenta** el saldo (`WalletTransaction` tipo `compra`), **vacía el carrito**, envía un
   correo "Pedido recibido" por pedido.
8. Los pedidos nacen en estado **`pending`**.

**Máquina de estados** (`OrderStatusEnum`, validada en `OrderService` / empresa):

```
pending / paid ──► processing ──► shipped ──► delivered   (final)
      │
      └──► cancelled   (final)   [solo desde pending/paid]
```

- El **comprador** cancela solo en `pending`/`paid` (`PATCH /orders/{id}/cancel`). La
  cancelación individual **no reembolsa** RehniCoin automáticamente (RF-065 documentado como
  no implementado en `RehniMarket-Requisitos.docx` §7).
- La **empresa** avanza el estado (`PATCH /company/dashboard/orders/{id}/status`) y registra
  transportadora + guía al enviar (`.../shipping`). Transición inválida → error explícito.
- El detalle del pedido conserva un **snapshot** (nombre de producto/variante, atributos,
  precio unitario, dirección) tal como estaban al comprar.

**Concurrencia:** `test_public_and_commerce.py::test_concurrent_checkout_of_last_unit_lets_only_one_win`
verifica que ante dos compras simultáneas de la última unidad **solo una gana**, sin stock
negativo ni pedido duplicado.

## 18. PostgreSQL

| Parámetro | Valor | Fuente |
|---|---|---|
| Motor | PostgreSQL 17 (`postgres:17-alpine`) | `docker-compose.yml` |
| Contenedor | `rehni-postgres` | `docker-compose.yml` |
| Host (backend) | `postgres` (nombre de servicio) | `.env` → `URL_DATABASE` |
| Puerto | host `5434` → contenedor `5432` | `docker-compose.yml` |
| Volumen | `postgres_rehni_data` → `/var/lib/postgresql/data` | `docker-compose.yml` |
| BD / usuario | `rehnimarket` / `rehnieyal` (equipo de validación) | `.env` |
| Tamaño | ~10 MB, **37 tablas** (con `alembic_version`) | medición |
| Extensiones | `plpgsql`, **`pg_trgm`**, **`unaccent`** | migración `a1b2c3d4e5f6` |
| Objetos extra | función `rehni_search_norm(text)` (IMMUTABLE) + índice GIN `ix_products_name_search_trgm` | migración `a1b2c3d4e5f6` |
| `restart` / `healthcheck` | `always` / **sin healthcheck** | `docker-compose.yml` |

- **Motor SQLAlchemy** (`app/database/Connection.py`): `create_engine(URL_DATABASE,
  pool_pre_ping=True, echo=False)`; `SessionLocal = sessionmaker(autocommit=False,
  autoflush=False)`.
- **Salud:** `GET /health/database` ejecuta `SELECT 1` (`app/utils/TestDatabase.py`).
- **BD de pruebas:** `rehnimarket_test`, creada por `tests/conftest.py` en el mismo servidor.

## 19. Alembic

- **10 revisiones en cadena lineal** (sin ramas):
  `29fe206320ce` → `d72ef7fa597e` → `048871b47f63` → `a90540bebea` → `b6f8fd31fbe` →
  `cb6d38ee0bd` → `d4e5f6a7b8c9` → `e7a1c9d24b30` → `f2b7c4e91a05` → **`a1b2c3d4e5f6`** (HEAD).
- `alembic/env.py` toma `sqlalchemy.url` de `app.Config` (no de `alembic.ini`) e importa
  `Base.metadata` con todos los modelos.
- **Aplicación automática** en el arranque del contenedor `backend`:
  `sh -c "uv run alembic upgrade head && uv run uvicorn ..."`.
- Manual: `docker compose exec backend uv run alembic upgrade head` /
  `docker exec rehni-backend uv run alembic current`.
- Migraciones destacadas: `a90540bebea` (arquitectura de variantes/atributos + descuentos),
  `b6f8fd31fbe` (backfill de datos legacy a la nueva arquitectura),
  `cb6d38ee0bd` (`order_items.attributes_snapshot`),
  `d4e5f6a7b8c9` (anuncios pierden campos de texto),
  `e7a1c9d24b30` (transportadoras + envío), `f2b7c4e91a05` (`Product.applies_tax`),
  `a1b2c3d4e5f6` (búsqueda difusa).

## 20. MinIO

| Parámetro | Valor |
|---|---|
| Imagen | `minio/minio:latest` (versión no fijada) |
| Contenedor | `rehni-minio` |
| Comando | `server /data` |
| Endpoint interno | `minio:9000` (`MINIO_URL`) |
| Puerto | host `9000` → contenedor `9000` (API S3) |
| Consola web | **no expuesta** (puerto no mapeado) |
| TLS | deshabilitado (`secure=False` en el SDK) |
| Volumen | `minio_rehni_data` → `/data` |
| Bucket | **`uploads`** (fijo en el código: `NasService.bucket = "uploads"`) |
| Creación del bucket | `ensure_bucket()` en el `lifespan` de FastAPI (si MinIO no responde: *warning* y continúa) |
| Contenido (validación) | ~166 objetos, ~8.8 MiB |

**Convención de rutas de objeto** (`app/services/NasService.py`, memoria del proyecto):

| Referencia en BD | Ruta del objeto |
|---|---|
| `product_images.url` | `uploads/companies/<NIT>/products/<uuid>.<ext>` |
| `product_variant_images.url` | `uploads/companies/<NIT>/variants/<uuid>.<ext>` |
| `company.CompanyLogo` / `CompanyBanner` / `CompanyCertificate` | `companies/<NIT>/{logo\|banner\|certificates}/...` (**sin** prefijo `uploads/` en BD) |
| `advertisements.image_url` / `mobile_image_url` | `uploads/advertisements/{desktop\|mobile}/<uuid>.<ext>` |
| `catalog.image_url` | `uploads/catalogs/<uuid>.<ext>` |
| `users.profileImagen` | `users/<user_id>/profile/<uuid>.<ext>` (**sin** prefijo `uploads/`) |
| `report_evidences.url` | `uploads/reports/<report_id>/evidences/<uuid>.<ext>` |

**Entrega al cliente:** `GET /media/proxy?path=uploads/<clave>` (`app/routers/mediaRouter.py`)
hace `client.get_object("uploads", <clave sin "uploads/">)` y transmite los bytes. El
navegador nunca habla con MinIO. La URL la arma `build_media_url(path)` a partir de
`URL_BACKEND`.

## 21. Docker

**`docker-compose.yml`** (raíz) — único archivo de orquestación:

| Servicio | Imagen / build | Contenedor | Puertos | Volúmenes | Comando |
|---|---|---|---|---|---|
| `minio` | `minio/minio:latest` | `rehni-minio` | `9000:9000` | `minio_rehni_data:/data` | `server /data` |
| `postgres` | `postgres:17-alpine` | `rehni-postgres` | `5434:5432` | `postgres_rehni_data:/var/lib/postgresql/data` | (imagen) |
| `backend` | build `./RehniMarket-backend` | `rehni-backend` | `8001:8000` | `./RehniMarket-backend:/app` (bind) | `sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"` |
| `frontend` | build `./RehniMarket-frontend` | `rehni-frontend` | `5173:5173` | `./RehniMarket-frontend:/app`, `frontend_node_modules:/app/node_modules` | `sh -c "pnpm install && pnpm dev --host 0.0.0.0 --port 5173"` |

- **`env_file`:** `minio`, `postgres`, `backend` comparten `./RehniMarket-backend/.env`.
  `frontend` usa su propio `.env` (bind mount).
- **`restart: always`** en `minio`, `postgres`, `backend`.
- **`dns: [8.8.8.8, 1.1.1.1]`** en `backend` (para `smtp.gmail.com` y el chequeo de Internet).
- **Red:** la red por defecto de Compose; los servicios se resuelven por nombre.
- **Modo desarrollo:** `--reload`, `pnpm dev`, bind mounts del código, puertos de BD/MinIO
  publicados. Para producción se entrega `docker-compose.prod.yml` (endurecido; ver §28).
- Contexto de contenedores en el equipo de validación: además corre un contenedor
  **`dns_tunel`** (cloudflared) que **no** forma parte del `docker-compose.yml` actual
  (queda como "orphan"); no almacena datos de la aplicación.

**Dockerfile del backend:** `python:3.13-slim` + `uv`; `uv sync --frozen --no-dev`;
`CMD ["uv","run","uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]` (el `command`
de Compose lo sobrescribe para añadir `alembic upgrade head` y `--reload`).

**Dockerfile del frontend:** `node:22-alpine` + `corepack prepare pnpm@11.15.0`; arranca el
**dev server de Vite** (no compila ni sirve estáticos optimizados).

## 22. Variables de entorno

### Backend — `RehniMarket-backend/.env` (lo consumen `postgres`, `minio`, `backend`)

| Variable | Para qué | Obligatoria |
|---|---|---|
| `URL_DATABASE` | Cadena SQLAlchemy (`postgresql://user:pass@postgres:5432/db`) | Sí |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Inicialización del contenedor `postgres` | Sí |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credenciales de MinIO (también las usa el backend) | Sí |
| `MINIO_URL` | Endpoint interno (`minio:9000`) | Sí |
| `URL_BACKEND` | URL del backend **visible desde el navegador**; base de `/media/proxy`. Debe coincidir con `VITE_API_URL` | Sí |
| `URL_FRONTEND` | Origen del frontend (enlaces en correos; base para restringir CORS) | Sí |
| `SECRET_KEY` | Clave HS256 para firmar los JWT. **Generar una propia, larga y aleatoria** | Sí |
| `ALGORITHM` | `HS256` | Sí |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_DAYS` | Expiración de tokens (int) | Sí |
| `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` | SMTP Gmail (contraseña de aplicación) | Sí (para correo) |
| `USER_NAME_ADMIN` / `ADMIN_DEFAULT` / `PASSWORD_DEFAULT` | Cuenta admin del seed | Solo si `RUN_SEED=true` |
| `USER_NAME_OWNER` / `OWNER_DEFAULT` / `OWNER_PASSWORD_DEFAULT` | Cuenta owner del seed | Solo si `RUN_SEED=true` |
| `RUN_SEED` | `true` ejecuta el seed en el arranque | Sí |
| `IP` | Presente en el `.env` real, **no leída** por `app/Config.py` | No |

> `app/Config.py` lee `USER_NAME_ADMIN` (no `USER_NAME_ADMIN`/`ADMIN_DEFAULT` con el formato
> del `.env.example`). Al preparar un entorno nuevo, tomar como referencia las variables que
> realmente lee `Config.py`.

### Frontend web — `RehniMarket-frontend/.env`

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL base del backend para axios. Debe coincidir con `URL_BACKEND` |
| `VITE_REHNIMARKET_WHATSAPP` | Número de WhatsApp (dígitos, con código de país) para solicitar recargas |

### App móvil — `RehniMarket-mobile/.env`

| Variable | Para qué |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base del backend, **accesible desde el teléfono** (no `localhost`) |
| `EXPO_PUBLIC_REHNIMARKET_WHATSAPP` | Número de WhatsApp para recargas |

**Manejo de secretos:** los tres `.env` reales están en `.gitignore`; solo se versionan los
`.env.example` con valores ficticios. El `.dockerignore` del backend excluye `.env` de la
imagen (se inyecta en runtime con `env_file`).

## 23. Endpoints principales

El backend expone **~130 rutas** (`GET /openapi.json`). Agrupadas por router:

| Router | Prefijo | Endpoints representativos |
|---|---|---|
| `AuthRouters` | `/auth` | `register-user`, `register-company`, `verify-email-user`, `change-email`, `resend-verification-code`, `login-user`, `forgot-password-user`, `reset-password-user`, `refresh`, `me` (`GET`/`PATCH`), `me/photo` |
| `HealthRouter` | `/health` | `database`, `internet` |
| `publicRouters` | `/public` | `catalogs`, `colors`, `advertisements`, `products` (filtros: `search`, `catalog_id`, `min_price`, `max_price`, `discount`, `in_stock`, `sort`, `page`, `limit`), `products/daily`, `products/offers`, `products/new`, `products/{id}`, `products/{id}/reviews`, `catalogs/{id}/attributes`, `company/{id}`, `company/{id}/products`, `company/{id}/rating` |
| `mediaRouter` | `/media` | `proxy?path=uploads/...` |
| `CartRouter` | `/cart` | `GET`, `add`, `item/{id}` (`PATCH`/`DELETE`), `clear` |
| `CheckoutRouter` | `/checkout` | `POST { addressId }` |
| `OrderRouter` | `/orders` | `GET`, `{id}`, `{id}/cancel` |
| `FavoriteRouter` | `/favorites` | `GET`, `POST`, `{product_id}` (`DELETE`) |
| `ReviewRouter` | `/reviews` | `eligibility/{product_id}`, `POST`, `{id}` (`PATCH`/`DELETE`) |
| `ReportRouter` | `/reports` | `POST` |
| `AddressRouter` | `/addresses` | CRUD + `{id}/set-default` |
| `WalletRouter` | `/wallet` | `me`, `transactions` |
| `CompanyRouter` / `CompanyProductArchitectureRouters` | `/company/dashboard` | `me`, `my-profile`, `patch-media-logo-banner`, `create-product`, `get-my-products`, `products-summary`, `get-my-product/{id}`, `update-my-product/{id}`, `change-status-my-product/{id}`, `delete-my-product/{id}`, `products/{id}/variants[...]`, `products/{id}/variants/generate`, `products/{id}/discount`, `orders`, `orders/status-counts`, `orders/{id}` (`GET`/`status`/`shipping`), `shipping-carriers` |
| `BankAccountRouter` / `CompanyPayoutRouter` | `/company` | `bank-accounts` (CRUD + default), `payouts`, `payouts/{id}`, `balance` |
| `AdminDashboardRouters` | `/admin/dashboard` | `statistics`, `recent-activities`, `recent-users` |
| `AdminCompanyRouters` | `/admin/dashboard` | `get-companies`, `get-company/{id}`, `companies/certificate/status/{id}`, `company/status/{id}` |
| `AdminUserRouters` | `/admin/dashboard` | `get-users`, `user/update-information/{id}`, `.../status/{id}`, `user/delete/{id}` |
| `AdminCatalogAttributeRouters` | `/admin/dashboard` | `catalogs/`, `catalog-attributes`, `catalog-attribute-options` |
| `AdminWalletRouter` | `/admin/wallet` | `recharge`, `history` |
| `AdminPayoutRouter` | `/admin/payouts` | `generate`, `preview`, `available-periods`, `{id}/pay`, listado |
| `AdminReportRouter` | `/admin/reports` | listado (paginado + filtros), `{id}`, `{id}/status` |
| `ShippingCarrierRouter` | `/admin/dashboard/shipping-carriers` · `/company/dashboard/shipping-carriers` | CRUD (admin) / listado activo (empresa) |

Listado exhaustivo y esquemas: **Swagger UI en `/docs`**.

## 24. Swagger / OpenAPI

- FastAPI publica automáticamente: **Swagger UI en `GET /docs`** y el esquema en
  `GET /openapi.json` (ambas rutas son públicas — están en `PUBLIC_ROUTES`).
- El esquema declara **~130 rutas**. `info.title` y `info.version` usan los valores por
  defecto de FastAPI salvo que se configuren en `FastAPI(...)`.
- Cada endpoint documenta su `body`/`query`/`response` a partir de los esquemas Pydantic.

## 25. Manejo de errores

- **Contrato uniforme:** `app/core/Exceptions.py::api_error(status_code, code, message, extra=None)`
  lanza `HTTPException(detail={ "code", "message" [, ...extra] })`.
- **Catálogo de códigos:** `app/core/ErrorCodes.py` — **102 códigos** con nombre
  (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `INSUFFICIENT_STOCK`, `INSUFFICIENT_BALANCE`,
  `PRODUCT_OUT_OF_STOCK`, `VARIANT_COMBINATION_ALREADY_EXISTS`, `COMPANY_PENDING`,
  `FORBIDDEN`, `RATE_LIMIT_EXCEEDED`, …).
- **`extra`:** datos adicionales que el cliente necesita junto al error, p. ej. `retry_after`
  (reenvío de código) o `expires_in` / `resend_available_in` (login no verificado).
- **`ValidationError` de Pydantic:** manejador global en `app/main.py` → `422` con
  `code = VALIDATION_ERROR` y el primer mensaje de error.
- **Servicios:** patrón `try / except HTTPException: raise / except Exception → rollback`.
  Los *stack traces* van a *stdout* (`traceback.print_exc()`), **no** al cliente.
- **Clientes:** web (`src/api/apiErrorHandler.ts`, `setupAuthInterceptor.ts`) y móvil
  (`src/types/ErrorCode.ts`) tienen su propia copia del enumerado `ErrorCode`, sincronizada
  **a mano** (riesgo de desincronización — ver `INFORME_CALIDAD` R-03).

## 26. Seguridad

### Implementado (verificado en código)

| Medida | Detalle |
|---|---|
| JWT (access + refresh) | HS256 con `SECRET_KEY`; se distingue `type` y se rechaza refresh como access |
| Refresh token persistido | Tabla `refreshToken`; renovación rechaza cuentas bloqueadas/suspendidas |
| Autorización por rol | Lista blanca de prefijos por rol + bypass de `admin`/`owner`; capacidades de Owner protegidas en servicio |
| Revalidación por request | `Users.isActive` y `Company.CompanyStatus` se comprueban aunque el JWT siga válido |
| Hash de contraseñas | `passlib` bcrypt, truncado a 72 bytes; nunca en claro |
| Verificación de correo / recuperación | Códigos con expiración (5 / 15 min), un único código activo, cooldown 60 s |
| Validación de entrada | Pydantic en el 100 % de los endpoints; `422` con `VALIDATION_ERROR` |
| Secretos fuera de git | `.env` en `.gitignore`; `.dockerignore` excluye `.env`; solo `.env.example` versionado |
| Sesión móvil segura | `expo-secure-store` (almacén cifrado del dispositivo) |
| Autoridad en el servidor | Precio, IVA, stock, saldo y estados se calculan y validan en el backend |
| Migraciones + dependencias reproducibles | Alembic en cadena + `uv.lock` (`uv sync --frozen`) |
| Backups | `scripts/backup_rehnimarket.sh` + `scripts/restore_rehnimarket.sh` (ver `PLAN_MIGRACION`) |

### Endurecimiento — estado 2026-08-31 (varios puntos RESUELTOS en esta entrega)

| Tema | Estado actual | Recomendación |
|---|---|---|
| CORS | **HECHO** — `allow_origins` desde `URL_FRONTEND` + orígenes locales; `allow_credentials` coherente (`CorsMiddleware.py`). | Definir siempre `URL_FRONTEND`. |
| Rate limiting | **AJUSTADO** — activable con `RATE_LIMIT_ENABLED=true`; `docker-compose.prod.yml` lo fuerza. En memoria del proceso. | Almacén compartido si hay varias réplicas |
| TLS / HTTPS | El Compose de **desarrollo** es HTTP plano. `docker-compose.prod.yml` deja de publicar BD/MinIO y expone el backend solo en `127.0.0.1`, asumiendo un reverse proxy TLS por delante (no incluido). | Configurar Caddy/Traefik/Nginx con certificado |
| `SECRET_KEY` | **HECHO** — `.env.example` / `.env.prod.example` con placeholder `REEMPLAZAR_POR_openssl_rand_hex_32` + instrucción | Generar el valor real por entorno |
| Credenciales de MinIO | Se usa el usuario **root** como credencial de aplicación | Usuario/política de mínimo privilegio sobre el bucket `uploads` |
| Puertos publicados | En `docker-compose.yml` (dev) `postgres` (5434) y `minio` (9000) se publican. **`docker-compose.prod.yml` no publica ninguno de los dos** y el backend solo en `127.0.0.1`. | — (usar el compose de producción) |
| `docker-compose` de producción | `docker-compose.prod.yml` + `Dockerfile.prod` (Nginx) creados y **probados en aislado**; falta el despliegue real con reverse proxy TLS | Desplegar en un servidor con dominio y TLS |
| Observabilidad | `traceback.print_exc()` a stdout; `sentry-sdk` no inicializado | Logging estructurado + monitor de errores |

Detalle y severidades: `docs/INFORME_CALIDAD_REHNIMARKET.md` §8.

## 27. Pruebas

- **Backend:** `tests/` — **7 archivos, 113 funciones `test_`**, `pytest` + `pytest-cov`.
  `conftest.py` crea la base `rehnimarket_test` en el mismo PostgreSQL, arma el esquema con
  `Base.metadata.create_all`, replica `pg_trgm`/`unaccent`/`rehni_search_norm`, y usa el
  `TestClient` de FastAPI con `get_db` sustituido. Son pruebas de **servicio / integración
  ligera** contra una BD real.

  | Archivo | `test_` | Área |
  |---|---:|---|
  | `test_public_and_commerce.py` | 21 | catálogo público, carrito, **checkout**, descuento atómico de stock, concurrencia, snapshot de pedido |
  | `test_catalog_attributes.py` | 24 | atributos de catálogo y opciones (admin) |
  | `test_variants.py` | 22 | generación y resolución de variantes |
  | `test_product_search.py` | 15 | búsqueda difusa (`pg_trgm` / `unaccent`) |
  | `test_offers_and_new.py` | 14 | secciones Ofertas y Novedades, precio de tarjeta con descuento |
  | `test_advertisements.py` | 10 | anuncios del Home y segmentación |
  | `test_pricing.py` | 7 | resolución de precio (descuentos producto/variante, ventana temporal) |

- **Frontend web:** `tsc -b` + `eslint .` (ambos pasan sin errores según `INFORME_CALIDAD`
  §4.1). **Sin archivos de prueba** (`0` `*.test.*` / `*.spec.*`).
- **Móvil:** `jest-expo` configurado como preset, `expo lint` disponible. **Sin archivos de
  prueba.**
- **Cobertura:** `pytest-cov` disponible; sin umbral configurado.
- **Auditoría de dependencias:** `pip-audit` (grupo `dev`) — procedimiento en `app/docs/AUDITORIA.md`.
- **Evidencia de ejecución de esta entrega:** `evidencias/tests/`, `evidencias/security/`,
  `evidencias/acceptance/`, `evidencias/performance/` (ver `evidencias/README.md`).

Comando: `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest -q'`.

## 28. Despliegue

Procedimiento completo (máquina limpia): `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §13.
Resumen:

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git && cd Rehni-Market
cp RehniMarket-backend/.env.example RehniMarket-backend/.env    # editar (ver §22)
cp RehniMarket-frontend/.env.example RehniMarket-frontend/.env  # VITE_API_URL
docker compose build
docker compose up -d
docker compose ps            # 4 contenedores "Up"
curl http://localhost:8001/health/database    # {"Base de datos":"OK"}
# Swagger: http://localhost:8001/docs   ·   Web: http://localhost:5173
```

- **Migraciones:** automáticas en el arranque del backend.
- **Seed** (opcional, primera carga): `RUN_SEED=true` → `docker compose restart backend` →
  volver a `false`.
- **App móvil:** `cd RehniMarket-mobile && pnpm install && pnpm exec expo start --lan` +
  escaneo del QR con Expo Go (Android).
### 28.1 Producción — `docker-compose.prod.yml` (PREPARADO, NO DESPLEGADO)

Se entrega una configuración endurecida: `docker-compose.prod.yml` + `RehniMarket-frontend/`
`Dockerfile.prod` (build Vite → Nginx) + `nginx.conf` + `.dockerignore` + `RehniMarket-backend/`
`.env.prod.example`. Diferencias frente al de desarrollo: `uvicorn` sin `--reload`, sin bind
mounts, frontend compilado tras Nginx, `RATE_LIMIT_ENABLED=true`, `postgres`/`minio` **sin
puertos publicados**, backend solo en `127.0.0.1`, `depends_on` por `service_healthy`, MinIO
fijado por digest.

```bash
cp RehniMarket-backend/.env.prod.example RehniMarket-backend/.env.prod   # y rellenar
docker compose -f docker-compose.prod.yml build \
    --build-arg VITE_API_URL=https://api.tu-dominio \
    --build-arg VITE_REHNIMARKET_WHATSAPP=573001234567
docker compose -f docker-compose.prod.yml up -d
# + reverse proxy con TLS (Caddy/Traefik/Nginx) delante -> frontend:80 y 127.0.0.1:BACKEND_PORT
```

**Verificado (2026-08-31):** construido y levantado en un proyecto Compose aislado
(`evidencias/deployment/10_prod_compose_smoke.txt`). **El proyecto NO se ha desplegado en un
servidor de producción** (no hay dominio, servidor ni certificado TLS). Detalle completo en
`docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` §10.7.

## 29. Limitaciones conocidas

| # | Limitación | Efecto |
|---|---|---|
| 1 | Solo existe `docker-compose.yml` de **desarrollo** (`--reload`, `pnpm dev`, bind mounts, puertos de BD/MinIO expuestos, sin `healthcheck`). | El despliegue no está endurecido para producción. |
| 2 | **App móvil sin empaquetado nativo** (sin `eas.json`, sin `android/`/`ios/`). | Uso limitado a Expo Go; no hay APK/AAB distribuible. |
| 3 | **Sin pruebas automatizadas** en frontend web ni móvil. | Regresiones de UI sin barrera automática. |
| 4 | **Sin CI/CD** (`.github/workflows/` inexistente). | Las verificaciones (`pytest`, `tsc`, `eslint`) dependen de ejecución manual. |
| 5 | Enumerados `ErrorCode` **triplicados** (backend, web, móvil) y sincronizados a mano. | Riesgo de desincronización de mensajes/flujos de error. |
| 6 | MinIO sin consola web mapeada; `secure=False`; credenciales root como credenciales de app. | Administración solo por `mc`; menor seguridad. |
| 7 | `RATE_LIMIT` **activable** con `RATE_LIMIT_ENABLED` (forzado en `docker-compose.prod.yml`); en memoria del proceso. | Para varias réplicas necesita un almacén compartido. |
| 8 | Estructuras **legacy** de variantes/color/especificaciones aún presentes en el modelo. | Deuda técnica; la eliminación definitiva depende de la migración de móvil y de negocio. |
| 9 | `RF-065` (reembolso automático al cancelar un pedido individual) **no implementado**. | La cancelación individual por el comprador no repone saldo ni stock. |
| 10 | Imagen `minio/minio:latest` sin versión fijada. | Builds no totalmente reproducibles para el almacenamiento. |
| 11 | Contenedor `dns_tunel` (cloudflared) en el entorno de validación **no está** en el `docker-compose.yml`. | Aparece como "orphan"; no afecta datos de la aplicación. |

## 30. Mantenimiento

### Tareas periódicas

| Tarea | Comando / referencia | Frecuencia sugerida |
|---|---|---|
| Backup coordinado PostgreSQL + MinIO | `scripts/backup_rehnimarket.sh` | Diaria |
| Prueba de restauración en entorno aislado | `scripts/restore_rehnimarket.sh <TS>` | Mensual + tras cambios de esquema |
| Auditoría de dependencias (backend) | `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pip-audit'` | Antes de cada entrega |
| Auditoría de dependencias (web/móvil) | `pnpm audit` en `RehniMarket-frontend/` y `RehniMarket-mobile/` | Antes de cada entrega |
| Suite de pruebas del backend | `docker exec rehni-backend sh -c 'cd /app && uv run --group dev pytest -q'` | Antes de cada commit relevante |
| Verificación estática del frontend | `pnpm build` (`tsc -b && vite build`) + `pnpm lint` | Antes de cada commit relevante |
| Revisar logs del backend | `docker compose logs -f backend` | Ante incidentes |
| Estado de migraciones | `docker exec rehni-backend uv run alembic current` | Tras cada despliegue |

### Cómo aplicar un cambio de esquema

1. Editar/crear el modelo en `app/models/`.
2. `docker exec rehni-backend uv run alembic revision --autogenerate -m "descripcion"`.
3. Revisar el archivo generado en `alembic/versions/` (autogenerate no detecta todo).
4. `docker exec rehni-backend uv run alembic upgrade head`.
5. Actualizar `tests/conftest.py` si el cambio añade extensiones/funciones no cubiertas por
   `Base.metadata.create_all`.
6. Ejecutar la suite de pruebas.

### Cómo añadir un endpoint

1. Esquema Pydantic en `app/schemas/`.
2. Lógica en un servicio de `app/services/`.
3. Ruta en un router de `app/routers/` (o uno nuevo, registrado en `app/main.py`).
4. Si la ruta es pública, añadirla a `app/middleware/PublicRoutes.py`; si es por rol,
   al prefijo correspondiente en `app/middleware/RolePermissions.py`.
5. Nuevo código de error → `app/core/ErrorCodes.py` **y** las copias de web/móvil.
6. Prueba en `tests/`.

### Contactos y recursos

- Repositorio: `https://github.com/RehnieyAl/Rehni-Market.git`
- Documentación: carpeta `docs/` (ver índice en `RehniMarket-backend/README.md`).
- Autoría: RehnieyAL (Yeinher Algarin).

---

*Fin del Manual Técnico — RehniMarket.*
