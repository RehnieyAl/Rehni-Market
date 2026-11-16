# Estrategia de pruebas — RehniMarket

> Plantilla: `bc-testing-adso/plantillas/estrategia-pruebas.md` (semana 9, integrador). Cifras
> del 2026-11-16, medidas en local con los mismos comandos del CI
> (`docs/pruebas/evidencias/LEEME.md`, sección «Cierre bc-testing-adso S9»).

**Grupo**: RehnieyAL (equipo de 1 persona) · **Ficha**: [PENDIENTE: número de ficha] · **Stack**: React 19 + FastAPI + PostgreSQL 17 (MinIO para imágenes) · **Fecha**: 2026-11-16

## 1. Qué hace la app y qué no puede fallar

Marketplace multiempresa: las empresas publican productos con variantes, los usuarios compran con
la billetera RehniCoin y administración gestiona recargas, liquidaciones y certificados.

| Riesgo | Por qué importa |
|---|---|
| Cobrar, reembolsar o liquidar dos veces (checkout, cancelación, devolución, liquidación) | Es dinero: el usuario o la empresa pierden saldo y nadie lo detecta a simple vista |
| Que un rol acceda a lo de otro (usuario → panel de empresa o admin) | Fuga de datos y operaciones no autorizadas |
| Registrar empresas con NIT/DV inválido o certificado no revisado | La empresa vende sin estar validada |
| Respuestas fuera del contrato `{code, message}` | El frontend muestra «Ocurrió un error.» y el usuario no sabe qué corregir |
| Vender una variante sin stock o con precio incorrecto | Pedidos que no se pueden cumplir |

## 2. Qué prueba cada capa y por qué

| Capa | Qué verifica | Herramienta | Cantidad de tests |
|---|---|---|---|
| Unitarias | Backend: precios, SMTP y schemas de registro (`test_pricing`, `test_email_smtp`, `test_register_validation`). Frontend: reglas zod, DV del NIT, permisos por rol, estados de devolución (`*.test.ts`) | pytest · Vitest | 31 backend · 111 frontend |
| Componentes React | Formularios de login y registro, `RequireAuth`, `AuthProvider`, modales de devolución, recarga, corrección de recarga y revisión de certificados | Vitest + Testing Library | 73 |
| API | Contrato HTTP de 14 módulos (auth, direcciones, cuentas bancarias, anuncios, catálogo, certificados, ofertas, cancelación, liquidaciones, búsqueda, público y comercio, devoluciones, variantes, billetera admin): estados, JSON, permisos | pytest + `TestClient` | 294 (incluye los 6 xfail) |
| Integración con BD | Los mismos 294 tests de API corren contra PostgreSQL real (`rehnimarket_test`) y verifican el estado de la BD después de cada llamada; el CI además aplica `alembic upgrade head` en BD vacía | pytest + PostgreSQL 17 | Mismos 294 |
| E2E (flujos críticos) | No hay. Mitigación: `scripts/smoke-test.sh` y `scripts/acceptance_smoke.sh` contra el despliegue | — | 0 (incidencia #43) |

**Por qué esta forma**: en RehniMarket la lógica que puede costar dinero vive en los servicios del
backend y depende de la BD (saldos, transacciones, índices únicos para la idempotencia del
reembolso). Por eso la mayor parte de la suite son pruebas de API contra PostgreSQL real, no
unitarias con dobles: un fake no detecta una `ForeignKeyViolation` (H-06) ni un periodo de
liquidación solapado (H-07). En el frontend se prueba primero la validación espejo del backend y
los formularios de dinero y permisos.

## 3. Qué no se prueba y por qué

| Fuera de la suite o de la cobertura | Motivo |
|---|---|
| App móvil (`RehniMarket-mobile`) | Fuera del alcance de la entrega; sin suite |
| MinIO real (`ensure_bucket`, subida de imágenes) | Se sustituye por un no-op para no esperar reintentos de red (B-01, #38) |
| Envío real de correo | SMTP reemplazado por dobles en `test_email_smtp.py` |
| Seeds de datos (`app/utils/seed*.py`) y migraciones en la cobertura | Datos de arranque; las migraciones se validan con `alembic upgrade head` en CI |
| Páginas de admin y empresa sin tests (~47 % de las líneas del frontend) | Deuda: frontend al 10,6 % de líneas (#42) |
| Rendimiento | Escenarios k6 en `tests/load/`, fuera del CI; se corren contra el despliegue |

## 4. Datos y entornos

- **BD de pruebas**: servicio `postgres` del job `backend` en CI; en local, `postgres-test` del
  `docker-compose.yml` (perfil `test`, tmpfs, 127.0.0.1:55433). `tests/conftest.py` crea
  `rehnimarket_test` aparte y en cada test recrea el esquema (`drop_all` + `create_all`, fixture `db`); nunca toca la BD de desarrollo.
- **Dobles**: MinIO (`ensure_bucket` y el cliente), SMTP, seed (`RUN_SEED=false`), rate limit
  desactivado. En el frontend, el cliente HTTP (axios) se mockea.
- **Datos**: `tests/factories.py` crea usuarios, empresas, productos y pedidos por test; no hay
  E2E que preparar.

## 5. CI y umbrales

- Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), jobs `backend` (ruff,
  alembic, pytest con cobertura) y `frontend` (eslint, tsc, Vitest con cobertura), en cada push a
  `main`/`develop` y en cada PR. SonarCloud va aparte en `sonarqube.yml`.
- Último run en verde de `main`: [PENDIENTE: enlace al run tras integrar `ci.yml` en `main`, dos
  veces seguidas sin reintentos].
- Ruleset `CODEOWNER` (id 25681376) exige `backend` y `frontend`, pero está **desactivado**:
  [PENDIENTE: activarlo en Settings → Rules].

| Parte | Cobertura actual | Umbral configurado |
|---|---|---|
| Frontend | 10,58 % líneas · 9,2 % ramas | 10 % líneas · 9 % ramas (`vitest.config.ts`) |
| Backend | 70,21 % líneas · 34,96 % ramas · 64,89 % combinado | 64 % combinado (`fail_under`, `pyproject.toml`; antes 60) |

**Brecha con el referente (≥ 80 %)**: no se cumple. El umbral se fija en el valor real (ratchet) y
no se infla cobertura. Plan en #42: subir el backend con pruebas de ramas en liquidaciones y
checkout, y el frontend con `features/admin` y `features/company`.

## 6. Hallazgos y riesgos conocidos

| Defecto | Capa que lo encontró | Estado (corregido / incidencia #) |
|---|---|---|
| H-04 JSON inválido responde fuera del contrato `{code, message}` | API | Corregido en `6bc1c81` |
| H-05 Mensaje con prefijo «Value error, » de Pydantic | API | Corregido en `6bc1c81` |
| H-07 Periodo de liquidación solapado liquida dos veces las mismas ventas | API + BD | Incidencia #36 (xfail strict) |
| H-08 Devolución aprobada sigue en las ventas liquidadas a la empresa | API + BD | Incidencia #37 (xfail strict) |
| H-06 Borrar una dirección usada en un pedido responde 500 | API + BD | Incidencia #35 (xfail strict) |
| H-02 NIT de más de 15 dígitos aceptado | Unitarias | Incidencia #33 (xfail strict + `it.todo`) |
| H-03 `isdigit()` acepta dígitos no ASCII | Unitarias | Incidencia #34 (xfail strict) |
| H-01 `shipping_carriers.created_at` difiere entre modelo y migración | Integración (alembic) | Incidencia #32 |

**Saltos**: 0 `skip` en backend y frontend. Fallos esperados: 6 `xfail(strict=True)` y 1 `it.todo`,
todos con su incidencia en el `reason`. Detalle y brechas B-01…B-04 en `docs/pruebas/REGISTRO.md`.

## 7. Evidencia individual

| Integrante | Capas trabajadas (matriz) | Commits de test (`git shortlog`) |
|---|---|---|
| RehnieyAL | Front, API, BD (ver `docs/matriz-rotacion.md`); E2E sin hacer | 16 commits en `RehniMarket-backend/tests/` y `*.test.*` |

Equipo de 1 persona: el ensayo cruzado de la sustentación se reemplaza por autoensayo por capa o
con un tercero ([PENDIENTE: nombre de quien hace de par y resultado]).
