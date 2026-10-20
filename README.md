<div align="center">

<img src="RehniMarket-frontend/src/assets/logo.pngnono" alt="RehniMarket" width="360" />

### Marketplace multiempresa con billetera digital propia

Conecta **empresas vendedoras** con **compradores** en una sola plataforma: catálogo con variantes, carrito, checkout con **RehniCoin**, pedidos, devoluciones, reseñas y paneles de gestión para empresas y administradores.

<br />

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## Tabla de contenido

- [Sobre el proyecto](#sobre-el-proyecto)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Diagramas](#diagramas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
- [Pruebas](#pruebas)
- [Scripts de operación](#scripts-de-operación)
- [Autor](#autor)

---

## Sobre el proyecto

**RehniMarket** es un marketplace en el que múltiples empresas publican y venden sus productos, y los usuarios compran pagando con **RehniCoin**, la moneda interna de la plataforma. El sistema cubre el ciclo completo de una compra —desde la exploración del catálogo hasta la entrega, la reseña y una posible devolución— e incluye la parte financiera: billetera del usuario, recargas, comisiones y liquidaciones a las empresas.

El proyecto está compuesto por tres aplicaciones:

| Aplicación | Descripción |
|---|---|
| **Backend** | API REST que concentra toda la lógica de negocio, la autenticación y el acceso a datos. |
| **Frontend web** | SPA para compradores, empresas y administradores. |
| **Mobile** | App móvil para compradores, construida con Expo. |

### Roles

| Rol | Qué puede hacer |
|---|---|
| **Visitante** | Explorar el catálogo, ver productos, ofertas, novedades y perfiles de empresa. |
| **Usuario** | Favoritos, carrito, compras, pedidos, reseñas, devoluciones, direcciones y billetera RehniCoin. |
| **Empresa** | Gestionar su perfil, catálogo con variantes, pedidos recibidos, envíos, devoluciones, cuentas bancarias y liquidaciones. |
| **Administrador** | Usuarios, empresas, catálogo global y atributos, anuncios, transportadoras, reportes, recargas y liquidaciones. |
| **Owner** | Todo lo del administrador, más la gestión de cuentas con privilegios elevados. |

---

## Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

** Comercio**
- Catálogo público con búsqueda, filtros y orden
- Secciones de **Ofertas** y **Novedades**
- Productos con **variantes** (precio, stock, imágenes y atributos propios)
- Favoritos y carrito
- Checkout con cobro en RehniCoin e IVA
- Seguimiento de pedidos y transportadoras
- Cancelación con reembolso automático e idempotente
- Solicitudes de **devolución** por ítem
- Reseñas y calificaciones de productos comprados

</td>
<td width="50%" valign="top">

**Gestión y finanzas**
- Panel de empresa: productos, pedidos, devoluciones y finanzas
- Panel administrativo con estadísticas de la plataforma
- Billetera **RehniCoin** con historial de movimientos
- Recargas de saldo gestionadas por administración
- Liquidaciones a empresas con comisión configurable
- Anuncios del Home con segmentación
- Reportes de contenido y moderación
- Registro de empresas con validación de NIT y certificado

</td>
</tr>
<tr>
<td valign="top">

**Seguridad**
- Autenticación con **JWT** + refresh tokens
- Contraseñas con hash **bcrypt / argon2**
- Verificación de correo con códigos temporales
- Recuperación de contraseña
- Permisos por rol (lista blanca) validados contra la BD
- Rate limiting y CORS configurables

</td>
<td valign="top">

**Plataforma**
- Imágenes almacenadas en **MinIO** y servidas por proxy
- Correos transaccionales con plantillas **Jinja2**
- Migraciones versionadas con **Alembic**
- Pool de conexiones con **PgBouncer**
- Healthchecks y límites de recursos por servicio
- Scripts de backup, restauración y pruebas de carga

</td>
</tr>
</table>

---

## Stack tecnológico

### Backend

| Tecnología | Uso |
|---|---|
| ![Python](https://img.shields.io/badge/-Python_3.13-3776AB?logo=python&logoColor=white) | Lenguaje principal |
| ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | Framework de la API REST |
| ![Uvicorn](https://img.shields.io/badge/-Uvicorn-4051B5?logo=gunicorn&logoColor=white) | Servidor ASGI |
| ![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy_2-D71F00?logo=sqlalchemy&logoColor=white) | ORM |
| ![Alembic](https://img.shields.io/badge/-Alembic-6BA81E) | Migraciones de base de datos |
| ![Pydantic](https://img.shields.io/badge/-Pydantic_2-E92063?logo=pydantic&logoColor=white) | Validación y esquemas |
| ![JWT](https://img.shields.io/badge/-python--jose_(JWT)-000000?logo=jsonwebtokens&logoColor=white) | Autenticación |
| ![uv](https://img.shields.io/badge/-uv-DE5FE9?logo=astral&logoColor=white) | Gestor de dependencias |
| ![Pytest](https://img.shields.io/badge/-Pytest-0A9EDC?logo=pytest&logoColor=white) | Pruebas automatizadas |

### Frontend web

| Tecnología | Uso |
|---|---|
| ![React](https://img.shields.io/badge/-React_19-61DAFB?logo=react&logoColor=black) | Librería de UI |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | Tipado estático |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | Bundler y servidor de desarrollo |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white) | Estilos y design system |
| ![React Router](https://img.shields.io/badge/-React_Router_7-CA4245?logo=reactrouter&logoColor=white) | Enrutamiento |
| ![Axios](https://img.shields.io/badge/-Axios-5A29E4?logo=axios&logoColor=white) | Cliente HTTP |
| ![Lucide](https://img.shields.io/badge/-Lucide-F56565?logo=lucide&logoColor=white) | Iconografía |
| ![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?logo=vitest&logoColor=white) | Pruebas unitarias |
| ![pnpm](https://img.shields.io/badge/-pnpm-F69220?logo=pnpm&logoColor=white) | Gestor de paquetes |

### Mobile

| Tecnología | Uso |
|---|---|
| ![Expo](https://img.shields.io/badge/-Expo_54-000020?logo=expo&logoColor=white) | Plataforma de desarrollo |
| ![React Native](https://img.shields.io/badge/-React_Native_0.81-61DAFB?logo=react&logoColor=black) | Framework móvil |
| ![Expo Router](https://img.shields.io/badge/-Expo_Router-000020?logo=expo&logoColor=white) | Navegación basada en archivos |
| ![SecureStore](https://img.shields.io/badge/-Expo_SecureStore-4630EB?logo=expo&logoColor=white) | Almacenamiento seguro de sesión |

### Infraestructura y datos

| Tecnología | Uso |
|---|---|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL_17-4169E1?logo=postgresql&logoColor=white) | Base de datos relacional |
| ![PgBouncer](https://img.shields.io/badge/-PgBouncer-336791?logo=postgresql&logoColor=white) | Pool de conexiones (modo transacción) |
| ![MinIO](https://img.shields.io/badge/-MinIO-C72E49?logo=minio&logoColor=white) | Almacenamiento de objetos (imágenes) |
| ![Docker](https://img.shields.io/badge/-Docker_Compose-2496ED?logo=docker&logoColor=white) | Orquestación de servicios |
| ![Nginx](https://img.shields.io/badge/-Nginx-009639?logo=nginx&logoColor=white) | Servidor estático del frontend |
| ![k6](https://img.shields.io/badge/-k6-7D64FF?logo=k6&logoColor=white) | Pruebas de carga |

---

## Arquitectura

```mermaid
flowchart LR
    subgraph Clientes
        W[Frontend web<br/>React + Vite]
        M[App móvil<br/>Expo]
    end

    subgraph Servidor["Docker Compose"]
        N[Nginx<br/>estáticos SPA]
        B[Backend<br/>FastAPI]
        P[(PgBouncer)]
        DB[(PostgreSQL 17)]
        S[(MinIO)]
    end

    SMTP[✉️ SMTP]

    W --> N
    W -- REST / JWT --> B
    M -- REST / JWT --> B
    B --> P --> DB
    B -- imágenes --> S
    B -- correos --> SMTP
```

El backend sigue una arquitectura por capas:

```
routers  →  services  →  repository  →  models (SQLAlchemy)
   ↑            ↑
schemas    middleware (auth, roles, CORS, rate limit)
```

---

## Diagramas

### Diagrama de casos de uso

Los roles son acumulativos: el **Usuario** puede hacer todo lo del **Visitante** y el **Owner** todo lo del **Administrador**. Para que se lea mejor, el diagrama está dividido en dos partes.

**Compra (Visitante y Usuario)**

```mermaid
flowchart LR
    V(("👤<br/>Visitante"))
    U(("👤<br/>Usuario"))
    U -. hereda .-> V

    subgraph SC["Sistema RehniMarket — Compra"]
        direction TB
        UC1([Explorar y buscar catálogo])
        UC2([Ver ofertas y novedades])
        UC3([Ver detalle de producto])
        UC4([Ver perfil de empresa])
        UC5([Registrarse como usuario o empresa])
        UC6([Verificar correo])
        UC7([Iniciar sesión / recuperar contraseña])
        UC8([Gestionar favoritos])
        UC9([Gestionar carrito])
        UC10([Realizar compra con RehniCoin])
        UC11([Consultar y cancelar pedidos])
        UC12([Solicitar devolución])
        UC13([Escribir reseña])
        UC14([Consultar billetera y movimientos])
        UC15([Gestionar direcciones])
        UC16([Reportar producto o empresa])
    end

    V --- UC1 & UC2 & UC3 & UC4 & UC5 & UC7
    UC5 -. include .-> UC6
    U --- UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15 & UC16
    UC10 -. include .-> UC15
    UC11 -. extend .-> UC12
```

**Gestión (Empresa, Administrador y Owner)**

```mermaid
flowchart LR
    E(("🏢<br/>Empresa"))
    A(("🛡️<br/>Administrador"))
    O(("👑<br/>Owner"))
    O -. hereda .-> A

    subgraph SG["Sistema RehniMarket — Gestión"]
        direction TB
        E1([Gestionar perfil de empresa])
        E2([Publicar productos y variantes])
        E3([Gestionar pedidos recibidos y envíos])
        E4([Aprobar o rechazar devoluciones])
        E5([Gestionar cuentas bancarias])
        E6([Consultar liquidaciones])
        E7([Actualizar certificado])

        A1([Gestionar usuarios])
        A2([Aprobar / suspender empresas])
        A3([Gestionar catálogos y atributos])
        A4([Gestionar anuncios del Home])
        A5([Gestionar transportadoras])
        A6([Atender reportes])
        A7([Recargar RehniCoins])
        A8([Generar liquidaciones])
        A9([Ver panel de estadísticas])

        O1([Administrar cuentas privilegiadas])
    end

    E --- E1 & E2 & E3 & E4 & E5 & E6 & E7
    A --- A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9
    O --- O1
    A8 -. include .-> E5
```

### Diagrama de clases

Modelo de dominio basado en los modelos SQLAlchemy de `RehniMarket-backend/app/models`. Por legibilidad solo se muestran los atributos principales.

```mermaid
classDiagram
    direction LR

    class Role {
        +UUID id
        +str name
    }
    class Users {
        +UUID id
        +str fullName
        +str email
        +str hashed_password
        +str tell
        +bool verified
        +bool isActive
    }
    class Address {
        +UUID id
        +str country
        +str department
        +str city
        +str address
        +str phone
        +bool is_default
    }
    class Wallet {
        +UUID id
        +Decimal balance
    }
    class WalletTransaction {
        +UUID id
        +WalletTransactionType type
        +Decimal amount
        +str description
    }
    class Company {
        +UUID id
        +str nameCompany
        +str CompanyNIT
        +str CompanyCertificate
        +CompanyCertificateEnum CompanyCertificateStatus
        +bool CompanyStatus
    }
    class CompanyBankAccount {
        +UUID id
        +str bank_name
        +BankAccountTypeEnum account_type
        +str account_number
        +bool is_default
    }
    class CompanyPayout {
        +UUID id
        +date period_start
        +date period_end
        +Decimal gross_sales
        +Decimal commission_amount
        +Decimal net_amount
        +PayoutStatusEnum payout_status
    }
    class Catalog {
        +UUID id
        +str name
        +bool is_active
    }
    class CatalogAttribute {
        +UUID id
        +str name
        +str role
        +str input_type
    }
    class CatalogAttributeOption {
        +UUID id
        +str value
        +str hex_color
    }
    class Product {
        +UUID id
        +str name
        +Decimal price
        +int stock
        +bool has_variants
        +bool applies_tax
        +bool is_active
    }
    class ProductVariant {
        +UUID id
        +str name
        +str sku
        +Decimal price
        +int stock
        +bool discount_enable
        +Decimal discount_value
    }
    class ProductVariantImage {
        +UUID id
        +str url
        +bool is_main
    }
    class Cart {
        +UUID id
    }
    class CartItem {
        +UUID id
        +int quantity
    }
    class Order {
        +UUID id
        +int order_number
        +OrderStatusEnum status
        +str tracking_number
        +Decimal subtotal
        +Decimal tax
        +Decimal total
    }
    class OrderItem {
        +UUID id
        +str product_name
        +Decimal unit_price
        +int quantity
        +Decimal subtotal
    }
    class ShippingCarrier {
        +UUID id
        +str name
        +str tracking_url
    }
    class ReturnRequest {
        +UUID id
        +str reason
        +ReturnStatusEnum status
        +Decimal refund_amount
    }
    class Review {
        +UUID id
        +int rating
        +str comment
    }
    class Favorite {
        +UUID id
    }
    class Report {
        +UUID id
        +ReportTargetType target_type
        +str reason
        +ReportStatus status
    }
    class Advertisement {
        +UUID id
        +str image_url
        +AdvertisementTargetType target_type
        +bool is_active
    }

    class OrderStatusEnum {
        <<enumeration>>
        PENDING
        PAID
        PROCESSING
        SHIPPED
        DELIVERED
        CANCELLED
    }
    class WalletTransactionType {
        <<enumeration>>
        RECHARGE
        PURCHASE
        REFUND
        ADJUSTMENT
    }

    Role "1" --> "*" Users : asigna
    Users "1" --> "0..1" Company : administra
    Users "1" *-- "*" Address
    Users "1" *-- "1" Wallet
    Wallet "1" *-- "*" WalletTransaction
    Users "1" *-- "1" Cart
    Cart "1" *-- "*" CartItem
    CartItem "*" --> "1" ProductVariant
    Users "1" --> "*" Favorite
    Favorite "*" --> "1" Product
    Users "1" --> "*" Review
    Review "*" --> "1" Product
    Users "1" --> "*" Report

    Company "1" *-- "*" Product : publica
    Company "1" *-- "*" CompanyBankAccount
    Company "1" --> "*" CompanyPayout
    CompanyPayout "*" --> "1" CompanyBankAccount

    Catalog "1" --> "*" Product : clasifica
    Catalog "1" *-- "*" CatalogAttribute
    CatalogAttribute "1" *-- "*" CatalogAttributeOption
    Product "1" *-- "1..*" ProductVariant
    ProductVariant "1" *-- "*" ProductVariantImage
    ProductVariant "*" --> "*" CatalogAttributeOption : combina

    Users "1" --> "*" Order : realiza
    Company "1" --> "*" Order : recibe
    Order "*" --> "0..1" Address
    Order "*" --> "0..1" ShippingCarrier
    Order "1" *-- "1..*" OrderItem
    OrderItem "*" --> "1" ProductVariant
    OrderItem "1" --> "0..1" ReturnRequest
    WalletTransaction "*" --> "0..1" Order : paga / reembolsa

    Order ..> OrderStatusEnum
    WalletTransaction ..> WalletTransactionType
```

---

## Estructura del repositorio

```text
Rehni-Market/
├── RehniMarket-backend/      # API REST (FastAPI)
│   ├── app/
│   │   ├── core/             # Códigos de error, excepciones, config. de IVA, comisiones y billetera
│   │   ├── database/         # Motor y sesión de SQLAlchemy
│   │   ├── middleware/       # Auth, permisos por rol, CORS, rate limit
│   │   ├── models/           # Modelos ORM
│   │   ├── repository/       # Acceso a datos
│   │   ├── routers/          # Endpoints REST
│   │   ├── schemas/          # Esquemas Pydantic
│   │   ├── services/         # Lógica de negocio
│   │   └── utils/            # Seguridad, seeds, utilidades
│   ├── alembic/              # Migraciones
│   └── tests/                # Pruebas con pytest
├── RehniMarket-frontend/     # SPA web (React + Vite)
│   └── src/
│       ├── api/              # Cliente HTTP e interceptores de sesión
│       ├── features/         # Módulos por dominio (cart, orders, wallet, admin, ...)
│       ├── pages/            # Páginas públicas, de usuario y dashboards
│       ├── routers/          # Definición de rutas y guards
│       └── shared/           # Componentes y utilidades compartidas
├── RehniMarket-mobile/       # App móvil (Expo + Expo Router)
├── scripts/                  # Backup, restauración, smoke tests y carga
├── tests/load/               # Escenarios de pruebas de carga
├── docs/                     # Documentación funcional y técnica
├── docker-compose.yml        # Despliegue completo
└── docker-compose.dev.yml    # Entorno de desarrollo
```

---

## Puesta en marcha

### Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/) (para desarrollo del frontend o mobile)
- [uv](https://docs.astral.sh/uv/) y Python 3.13 (para desarrollo del backend fuera de Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
cp RehniMarket-backend/.env.example RehniMarket-backend/.env
```

Edita ambos archivos con tus credenciales de PostgreSQL, MinIO, SMTP, la clave JWT y las URLs del frontend y backend.

### 3. Levantar todo con Docker

```bash
docker compose up -d --build
```

Al iniciar, el backend aplica las migraciones automáticamente (`alembic upgrade head`).

| Servicio | URL por defecto |
|---|---|
| Frontend | http://localhost:8080 |
| API | http://localhost:8000 |
| Documentación interactiva (Swagger) | http://localhost:8000/docs |

### Desarrollo local

<details>
<summary><b>Backend</b></summary>

```bash
cd RehniMarket-backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

</details>

<details>
<summary><b>Frontend web</b></summary>

```bash
cd RehniMarket-frontend
pnpm install
pnpm dev
```

</details>

<details>
<summary><b>Mobile</b></summary>

```bash
cd RehniMarket-mobile
pnpm install
pnpm exec expo start --lan
```

Escanea el código QR con **Expo Go**.

</details>

---

## Pruebas

```bash
# Backend (pytest)
cd RehniMarket-backend
RUN_SEED=false uv run pytest

# Frontend (vitest)
cd RehniMarket-frontend
pnpm test
```

Pruebas de humo y de carga:

```bash
./scripts/acceptance_smoke.sh
k6 run scripts/load_test.k6.js
```

---

## Scripts de operación

| Script | Descripción |
|---|---|
| `scripts/backup_rehnimarket.sh` | Respaldo de la base de datos y del almacenamiento |
| `scripts/restore_rehnimarket.sh` | Restauración a partir de un respaldo |
| `scripts/acceptance_smoke.sh` | Pruebas de humo sobre los flujos principales |
| `scripts/perf_test.sh` | Pruebas de rendimiento |
| `scripts/load_test.k6.js` | Escenario de carga con k6 |
| `scripts/verificar-requisitos.sh` | Verificación de requisitos del entorno |

---


## Autor

**Yeinher José Algarín Cardozo** — [@RehnieyAl](https://github.com/RehnieyAl)

<div align="center">

<br />



</div>
