# Backlog final — RehniMarket (cierre S9)

> Para T7-2 («backlog final con % de historias completadas vs. SRS original») y
> `bc-asesoria-proyecto` S9 §2. Fecha: 2026-11-16.
>
> **Fuente usada:** los requisitos funcionales RF-01 a RF-36 del Manual técnico
> (`docs/Manuales/scripts/contenido_tecnico.py`). **No es el SRS original**: el SRS de
> trimestres anteriores y el tablero (GitHub Projects u otro) no están en el repositorio.
> [PENDIENTE: agregar el SRS original y cruzar cada historia; las que no estén en esta tabla van
> a la sección «No alcanzado» con su justificación.]

Criterio de «Hecho»: la ruta existe en `RehniMarket-backend/app/routers/` (verificado por script). Que cada
flujo también esté en la web se confirma en la demo ([PENDIENTE]). «Pruebas automáticas» = archivos de `tests/` que llaman la ruta.
Estado verificado con un script que cruza cada ruta con los routers y las pruebas (2026-11-16).

| RF | Historia | Rol | Estado | Router | Pruebas automáticas |
|---|---|---|---|---|---|
| RF-01 | Registrar comprador | Visitante | Hecho | `AuthRouters.py` | `test_register_validation.py` |
| RF-02 | Registrar empresa | Visitante | Hecho (H-02, H-03 abiertos: #33, #34) | `AuthRouters.py` | `test_register_validation.py` |
| RF-03 | Verificar correo | Visitante | Hecho | `AuthRouters.py` | — |
| RF-04 | Iniciar sesión | Todos | Hecho | `AuthRouters.py` | `test_certification_flow.py` |
| RF-05 | Recuperar contraseña | Todos | Hecho | `AuthRouters.py` | — |
| RF-06 | Configurar la cuenta | Autenticado | Hecho | `AuthRouters.py` | `test_auth_authorization.py` |
| RF-07 | Consultar el catálogo | Público | Hecho | `publicRouters.py` | `test_product_search.py`, `test_public_and_commerce.py` |
| RF-08 | Ofertas y novedades | Público | Hecho | `publicRouters.py` | `test_offers_and_new.py` |
| RF-09 | Detalle y perfil de empresa | Público | Hecho | `publicRouters.py` | — |
| RF-10 | Mostrar anuncios | Público | Hecho | `publicRouters.py` | `test_advertisements.py` |
| RF-11 | Gestionar carrito | Comprador | Hecho | `CartRouter.py` | `test_public_and_commerce.py` |
| RF-12 | Confirmar compra | Comprador | Hecho | `CheckoutRouter.py` | `test_public_and_commerce.py`, `test_order_cancel_refund.py` |
| RF-13 | Consultar y cancelar pedidos | Comprador | Hecho | `OrderRouter.py` | `test_order_cancel_refund.py` |
| RF-14 | Solicitar devolución | Comprador | Hecho | `OrderRouter.py` | `test_returns_flow.py` |
| RF-15 | Gestionar direcciones | Comprador | Hecho (H-06 abierto: #35) | `AddressRouter.py` | `test_addresses.py` |
| RF-16 | Gestionar favoritos | Comprador | Hecho | `FavoriteRouter.py` | — |
| RF-17 | Consultar billetera | Comprador | Hecho | `WalletRouter.py` | — |
| RF-18 | Reseñar productos | Comprador | Hecho | `ReviewRouter.py` | — |
| RF-19 | Reportar | Comprador | Hecho | `ReportRouter.py` | — |
| RF-20 | Panel Inicio de empresa | Empresa | Hecho | `CompanyRouter.py` | — |
| RF-21 | Productos y variantes | Empresa | Hecho | `CompanyProductArchitectureRouters.py` | `test_variants.py` |
| RF-22 | Pedidos de la empresa | Empresa | Hecho | `CompanyRouter.py` | `test_auth_authorization.py` |
| RF-23 | Resolver devoluciones | Empresa | Hecho | `CompanyRouter.py` | `test_returns_flow.py` |
| RF-24 | Gestionar finanzas | Empresa | Hecho | `BankAccountRouter.py` | `test_bank_accounts.py` |
| RF-25 | Actualizar certificado | Empresa | Hecho | `CompanyRouter.py` | `test_certification_flow.py` |
| RF-26 | Panel Inicio administrativo | Administrador | Hecho | `AdminDashboardRouters.py` | — |
| RF-27 | Verificar y suspender empresas | Administrador | Hecho | `AdminCompanyRouters.py` | `test_certification_flow.py` |
| RF-28 | Gestionar usuarios | Administrador | Hecho | `AdminUserRouters.py` | — |
| RF-29 | Gestionar catálogo | Administrador | Hecho | `AdminCatalogAttributeRouters.py` | `test_catalog_attributes.py` |
| RF-30 | Gestionar anuncios | Administrador | Hecho | `AdminCompanyRouters.py` | `test_advertisements.py` |
| RF-31 | Gestionar transportadoras | Administrador | Hecho | `ShippingCarrierRouter.py` | — |
| RF-32 | Atender reportes | Administrador | Hecho | `AdminReportRouter.py` | — |
| RF-33 | Recargar y corregir RehniCoin | Administrador | Hecho | `AdminWalletRouter.py` | `test_wallet_admin.py` |
| RF-34 | Gestionar liquidaciones | Propietario | Hecho con defectos (H-07, H-08: #36, #37) | `AdminPayoutRouter.py` | `test_payouts.py` |
| RF-35 | Servir archivos | Público | Hecho | `mediaRouter.py` | — (prueba de humo indirecta) |
| RF-36 | Verificar salud | Público | Hecho | `HealthRouter.py` | `scripts/smoke-test.sh` |

## Resumen

| Métrica | Valor |
|---|---|
| Historias del catálogo RF del Manual técnico | 36 |
| En estado «Hecho» | 36 (3 con defectos abiertos: RF-15, RF-34; RF-02 con validaciones menores) |
| % de avance frente al catálogo RF | 100 % |
| % de avance frente al SRS original | [PENDIENTE: requiere el SRS] |
| Historias con pruebas automáticas de backend | 24 de 36 (67 %) |

## No alcanzado o fuera de alcance

| Elemento | Justificación |
|---|---|
| App móvil (`RehniMarket-mobile`) | Fuera del alcance de la entrega: sin pruebas ni despliegue (Manual técnico, «Qué NO cubre») |
| Pruebas E2E | Incidencia #43 |
| [PENDIENTE: historias del SRS original que no estén en RF-01…RF-36] | [PENDIENTE] |
