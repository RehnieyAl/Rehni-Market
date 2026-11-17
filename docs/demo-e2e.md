# Demo integrada end-to-end — guion

> Referente: `bc-asesoria-proyecto/bootcamp/week-09-sprint_8_cierre_y_avance_90/1-teoria/03-demo-integrada-end-to-end.md`.
> Se ejecuta sobre contenedores: el clon limpio del gate (`cp .env.example .env && docker compose up -d --build --wait`)
> o la VM de producción. Nunca sobre el entorno local de desarrollo. Tiempo objetivo: 10 min.

## Preparación (antes de la sesión)

| Paso | Comando o acción | Comprobación |
|---|---|---|
| 1 | Levantar el stack | `docker compose ps`: 5 servicios `healthy` |
| 2 | Prueba de humo | `scripts/smoke-test.sh`: `7 pasan, 0 fallan` |
| 3 | Cuentas | Owner: la del `.env` (en el clon, `owner.dev@example.com`). Empresa: una del seed (contraseña de empresas de ejemplo en `app/utils/seed.py`) o una nueva. Comprador: registrarlo en vivo (paso 1 del flujo) |
| 4 | Correo de verificación | En la VM llega por SMTP. En el clon sin SMTP, leer el código en la BD: `docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"` [PENDIENTE: anotar la consulta de la tabla de códigos antes del ensayo] |
| 5 | Terminal aparte | `docker compose logs -f backend` por si algo falla |

## Flujo (login → acción core → resultado persistido → verificación)

| # | Rol | Acción | Qué se muestra (capas) | Min |
|---|---|---|---|---|
| 1 | Comprador | Se registra, recibe el código y verifica el correo (RF-01, RF-03) | Validación en vivo del formulario (zod) y en el servidor; código de un solo uso | 1,5 |
| 2 | Empresa | Inicia sesión y publica un producto con dos variantes e imágenes (RF-21) | Rol `company`, MinIO por `/media/proxy`, variantes por combinación | 2 |
| 3 | Visitante | Busca el producto con una letra errada (RF-07) | Búsqueda tolerante (`pg_trgm`) | 0,5 |
| 4 | Owner/Admin | Recarga RehniCoin al comprador (RF-33) | Panel admin, movimiento en la billetera | 1 |
| 5 | Comprador | Agrega dos variantes al carrito y compra (RF-11, RF-12) | Stock, saldo, IVA 19 %, un pedido por empresa | 1,5 |
| 6 | Comprador | Cancela el pedido y ve el reembolso una sola vez (RF-13) | Idempotencia del reembolso, stock repuesto | 1 |
| 7 | — | Caso de error: compra con saldo insuficiente (CA-06) y NIT con DV inválido (CA-02) | Contrato de error `{code, message}` y mensaje legible | 1 |
| 8 | Empresa | Despacha otro pedido con guía y resuelve una devolución (RF-22, RF-23) | Estados del pedido, reembolso por ítem | 1 |
| 9 | — | Persistencia: reiniciar `backend` (`docker compose restart backend`) y mostrar que el pedido y el saldo siguen | Datos en el volumen de PostgreSQL | 0,5 |

## Registro del ensayo

| Fecha | Dónde (clon / VM) | Duración | Qué falló | Corrección |
|---|---|---|---|---|
| [PENDIENTE] | | | | |
