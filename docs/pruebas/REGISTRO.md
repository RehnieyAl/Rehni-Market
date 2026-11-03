# Registro de pruebas: hallazgos y brechas conocidas

Registro de trabajo del plan de pruebas (Fases 0–6). Alimenta las secciones
«Hallazgos» y «Brechas y trabajo futuro» de `docs/INFORME_PRUEBAS.md`.
Regla: ningún hallazgo se corrige sin aprobación; se registra aquí y, si un test
lo evidencia, se marca con `xfail` / `it.todo` citando su ID.

## Hallazgos

| ID | Severidad | Archivo | Descripción | Cómo reproducir | Estado |
|---|---|---|---|---|---|
| H-01 | Baja | `RehniMarket-backend/alembic/versions/e7a1c9d24b30_shipping_carriers_and_order_shipping.py:30` vs `app/models/ModelShippingCarrier.py:25` | Divergencia modelo ↔ migración: el modelo declara `created_at: Mapped[datetime]` (NOT NULL) y la migración crea la columna con `nullable=True`. La BD de pruebas (`create_all`) y la de producción (Alembic) no tienen el mismo esquema. Impacto bajo: el ORM siempre rellena el valor por defecto; solo un `INSERT` SQL directo podría dejar `NULL`. | En una BD vacía: `alembic upgrade head` y luego `alembic check` → `modify_nullable ... shipping_carriers.created_at`. | Abierto (sin corregir) |

## Brechas conocidas

| ID | Área | Descripción | Motivo / mitigación |
|---|---|---|---|
| B-01 | Backend · MinIO | El fixture `client` (`tests/conftest.py`) sustituye `app.main.ensure_bucket` por un no-op. El arranque real contra MinIO (comprobar/crear el bucket) **no se ejecuta en ninguna prueba**. | Sin MinIO alcanzable, urllib3 reintenta ~6 s por cada `TestClient` (la suite pasaba de ~3,5 min a ~24 min). La Fase 3 mockea MinIO por diseño (sin red real). Trabajo futuro: un job de integración con un contenedor MinIO, o un test unitario de `ensure_bucket` con un cliente falso. |
| B-02 | Backend · migraciones | El CI ejecuta `alembic upgrade head` (la cadena de migraciones aplica en BD vacía), pero **no** `alembic check` (deriva modelo ↔ migración). | `alembic check` falla hoy por H-01 y por un falso positivo: `ix_products_name_search_trgm` es un índice funcional que solo existe en la migración `a1b2c3d4e5f6`. Se puede activar cuando H-01 se resuelva y el índice se excluya en `env.py` (`include_object`). |
| B-03 | Backend · lint | El gate de ruff cubre solo errores de runtime (`E9`, `F63`, `F7`, `F82`). Queda deuda de pyflakes fuera del gate: 70 `F401` (imports sin usar), 2 `F811`, 2 `F841`, 1 `F403` (medido el 2026-11-03 con ruff 0.17.3). | Se excluye `F821` en `app/models/*`: son 23 referencias adelantadas en strings de SQLAlchemy (`Mapped["Cart"]`) que resuelve el registry de mappers, no Python. Siguiente escalón: añadir `F` completo tras limpiar imports (parte de ellos son re-exportaciones intencionales en `app/models/__init__.py`). |
| B-04 | Frontend · lint | `--max-warnings 11`: los 11 warnings son `react-hooks/exhaustive-deps`. El ratchet impide que aparezcan nuevos, pero no elimina los existentes. | Corregirlos cambia cuándo se disparan los efectos (lógica de componentes): queda fuera del alcance de pruebas. |
