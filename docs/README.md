# Documentación técnica — RehniMarket

Arquitectura, diagrama de casos de uso y diagrama de clases del proyecto.

## Arquitectura

```mermaid
flowchart LR
    subgraph Clientes
        W[Frontend web<br/>React + Vite]
        M[App móvil<br/>Expo]
    end

    subgraph Servidor["Docker Compose"]
        N[Caddy<br/>dominio · api.dominio]
        B[Backend<br/>FastAPI]
        P[(PgBouncer)]
        DB[(PostgreSQL 17)]
        S[(MinIO)]
    end

    SMTP[✉️ SMTP]

    W --> N
    W -- REST / JWT api.dominio --> N
    N -- api.dominio --> B
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

## Diagrama de casos de uso

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

## Diagrama de clases

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
