# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

> El proyecto nació con el nombre interno **"Lubix"** (versiones 1.1.x). A partir
> de agosto de 2026 pasó a llamarse **RehniMarket**. Las entradas 1.3.x y 2.x
> reflejan el estado real del repositorio (ramas y commits `ver 2.x`).

---

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
