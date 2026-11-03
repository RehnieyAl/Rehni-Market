# Registro de pruebas: hallazgos y brechas conocidas

Registro de trabajo del plan de pruebas (Fases 0–6). Alimenta las secciones
«Hallazgos» y «Brechas y trabajo futuro» de `docs/INFORME_PRUEBAS.md`.
Regla: ningún hallazgo se corrige sin aprobación; se registra aquí y, si un test
lo evidencia, se marca con `xfail` / `it.todo` citando su ID. Al corregirse, el
test deja de ser xfail y la fila cita el commit de la corrección.

## Hallazgos

| ID | Severidad | Archivo | Descripción | Cómo reproducir | Estado |
|---|---|---|---|---|---|
| H-01 | Baja | `RehniMarket-backend/alembic/versions/e7a1c9d24b30_shipping_carriers_and_order_shipping.py:30` vs `app/models/ModelShippingCarrier.py:25` | Divergencia modelo ↔ migración: el modelo declara `created_at: Mapped[datetime]` (NOT NULL) y la migración crea la columna con `nullable=True`. La BD de pruebas (`create_all`) y la de producción (Alembic) no tienen el mismo esquema. Impacto bajo: el ORM siempre rellena el valor por defecto; solo un `INSERT` SQL directo podría dejar `NULL`. | En una BD vacía: `alembic upgrade head` y luego `alembic check` → `modify_nullable ... shipping_carriers.created_at`. | Abierto (sin corregir) |
| H-02 | Baja | `RehniMarket-backend/app/utils/NitValidator.py:11-12` y `app/schemas/schemaAuth/SchemaRegister.py:131` | El NIT no tiene longitud máxima y `calculate_nit_dv` usa `zfill(15)` + `zip`: con más de 15 dígitos solo pondera los 15 primeros. Un NIT de 16 dígitos pasa con el DV de sus primeros 15. | `CreateCompanyRequest(company_nit="1234567890123459", company_nit_dv="2", ...)` es válido (DV de `123456789012345` = 2). Test: `test_register_validation.py::test_nit_longer_than_15_digits_is_rejected` (xfail). | Abierto |
| H-03 | Baja | `SchemaRegister.py:72`, `:134`, `:149` | `str.isdigit()` acepta dígitos no ASCII (ancho completo `３`, indo-arábigos, superíndices `²`). Teléfono y NIT se guardan con esos caracteres. | `CreateUserRequest(tell="３００１２３４５６７", ...)` es válido. Tests: `test_phone_with_non_ascii_digits_is_rejected`, `test_nit_with_non_ascii_digits_is_rejected` (xfail). El frontend usa `[0-9]` y los rechaza. | Abierto |
| H-04 | Media | `RehniMarket-backend/app/main.py:71` | Solo hay handler para `pydantic.ValidationError`. Los cuerpos JSON inválidos lanzan `RequestValidationError` y salen con el 422 por defecto de FastAPI (`detail: [lista]`), no con el contrato `{code, message}`. `RegisterUser.tsx` lee `detail.message` → `undefined` → el usuario solo veía «Ocurrió un error.». Afecta a todo endpoint con cuerpo JSON. | `POST /auth/register-user` con `password="corta"` → `{"detail": [{"type": "value_error", ...}]}`. Test: `test_register_user_422_follows_the_api_error_contract`. | **Corregido** en `6bc1c81` (handler único para `ValidationError` y `RequestValidationError` en `app/main.py`; mensaje sin prefijo). Su test dejó de ser xfail. |
| H-05 | Baja | `RehniMarket-backend/app/main.py:73` | El mensaje que se devuelve es `errors[0]["msg"]` sin limpiar: Pydantic antepone `"Value error, "` y el usuario ve «Value error, El dígito de verificación no coincide…». | `POST /auth/register-company` con DV incorrecto. Test: `test_register_company_message_has_no_pydantic_prefix`. | **Corregido** en `6bc1c81` (handler único para `ValidationError` y `RequestValidationError` en `app/main.py`; mensaje sin prefijo). Su test dejó de ser xfail. |

### Observaciones (sin impacto en producción)

| ID | Archivo | Descripción |
|---|---|---|
| O-01 | `tests/conftest.py:180`, `tests/test_certification_flow.py`, `tests/test_returns_flow.py:95` | Los fixtures de empresa usan DV arbitrarios (p. ej. `900123456-7`; el DV real es 8). No afecta a la app (se insertan directo en la BD), pero son datos inválidos. Se corregirá al crear las factories de la Fase 3. |

## Brechas conocidas

| ID | Área | Descripción | Motivo / mitigación |
|---|---|---|---|
| B-01 | Backend · MinIO | El fixture `client` (`tests/conftest.py`) sustituye `app.main.ensure_bucket` por un no-op. El arranque real contra MinIO (comprobar/crear el bucket) **no se ejecuta en ninguna prueba**. | Sin MinIO alcanzable, urllib3 reintenta ~6 s por cada `TestClient` (la suite pasaba de ~3,5 min a ~24 min). La Fase 3 mockea MinIO por diseño (sin red real). Trabajo futuro: un job de integración con un contenedor MinIO, o un test unitario de `ensure_bucket` con un cliente falso. |
| B-02 | Backend · migraciones | El CI ejecuta `alembic upgrade head` (la cadena de migraciones aplica en BD vacía), pero **no** `alembic check` (deriva modelo ↔ migración). | `alembic check` falla hoy por H-01 y por un falso positivo: `ix_products_name_search_trgm` es un índice funcional que solo existe en la migración `a1b2c3d4e5f6`. Se puede activar cuando H-01 se resuelva y el índice se excluya en `env.py` (`include_object`). |
| B-03 | Backend · lint | El gate de ruff cubre solo errores de runtime (`E9`, `F63`, `F7`, `F82`). Queda deuda de pyflakes fuera del gate: 70 `F401` (imports sin usar), 2 `F811`, 2 `F841`, 1 `F403` (medido el 2026-11-03 con ruff 0.17.3). | Se excluye `F821` en `app/models/*`: son 23 referencias adelantadas en strings de SQLAlchemy (`Mapped["Cart"]`) que resuelve el registry de mappers, no Python. Siguiente escalón: añadir `F` completo tras limpiar imports (parte de ellos son re-exportaciones intencionales en `app/models/__init__.py`). |
| B-04 | Frontend · lint | `--max-warnings 11`: los 11 warnings son `react-hooks/exhaustive-deps`. El ratchet impide que aparezcan nuevos, pero no elimina los existentes. | Corregirlos cambia cuándo se disparan los efectos (lógica de componentes): queda fuera del alcance de pruebas. |

## Paridad de validación front ↔ back (Fase 2)

Frontend: `RehniMarket-frontend/src/shared/validation/` (`rules.ts`, `nit.ts`, `schemas.ts`, hook `useFormValidation`).

| Regla | Backend | Frontend | Usada en | Paridad |
|---|---|---|---|---|
| Nombre completo: 3 ≤ len(trim) y len ≤ 60 | `SchemaRegister.py:29` | `fullNameRule` | RegisterUser, RegisterCompany | Exacta (longitud en puntos de código) |
| Contraseña: ≥ 8, mayúscula, minúscula, número | `SchemaRegister.py:44` (y `SchemaResetPassword.py`) | `passwordRule` | RegisterUser, RegisterCompany | Exacta (`\p{Nd}` = `\d` de Python) |
| Teléfono: solo dígitos, exactamente 10 | `SchemaRegister.py:69` | `phoneRule` | RegisterUser, RegisterCompany | Cliente más estricto: solo dígitos ASCII (H-03) |
| Email | `EmailStr` (email-validator 2.3.0) | `emailRule` (zod `email` + trim + dominios de uso especial) | RegisterUser, RegisterCompany | Parcial: el backend acepta local-part Unicode (`ñandú@…`) y el cliente no |
| Razón social: 3 ≤ len(trim) y len ≤ 50 | `SchemaRegister.py:106` | `companyNameRule` | RegisterCompany | Exacta |
| Dirección: len(trim) ≥ 5 | `SchemaRegister.py:121` | `companyAddressRule` | RegisterCompany | Exacta |
| NIT: solo dígitos, ≥ 5 | `SchemaRegister.py:131` | `nitRule` | RegisterCompany | Cliente más estricto: solo dígitos ASCII (H-03); sin máximo en ambos (H-02) |
| DV: un dígito | `SchemaRegister.py:146` | `nitDvRule` | RegisterCompany | Cliente más estricto: ASCII (H-03) |
| DV = módulo 11 DIAN del NIT | `SchemaRegister.py:161` + `NitValidator.py` | `isValidNitDv` + `registerCompanySchema` | RegisterCompany | Exacta, incluida la condición «solo si los campos de empresa son válidos» |
| Contraseñas coinciden | — (solo cliente) | `registerUserSchema`, `registerCompanySchema` | RegisterUser, RegisterCompany | N/A |
| Motivo de devolución: 5 ≤ len(trim) ≤ 500 | `SchemaReturn.py:16` | `returnReasonRule` | RequestReturnModal | Exacta (antes el cliente solo validaba el mínimo) |
| Número de guía: 3 ≤ len(trim) ≤ 80 | `SchemaOrder.py:95` | `trackingNumberRule` | company/OrderDetailModal | Exacta (antes el cliente solo validaba el mínimo) |

### Schemas del backend revisados sin `field_validator`/`model_validator`

No se agregó ningún validador: las reglas de negocio de estos schemas ya están protegidas por
restricciones `Field(...)`/`Literal`/`EmailStr` o en el servicio. Las brechas reales encontradas
(H-02, H-03) están en validadores existentes y corregirlas es cambiar lógica: siguen abiertas. H-04 y H-05 se
corrigieron con aprobación en `6bc1c81`.

| Schema | Decisión | Motivo |
|---|---|---|
| `UpdateOrderStatusRequest.status: str` | No agregar | `OrderService.py:343` valida contra `OrderStatusEnum` (400 `VALIDATION_ERROR`) y `ALLOWED_TRANSITIONS`. Un `Literal` cambiaría el contrato de 400 a 422. |
| `VerifyEmailRequest.code`, `RefreshRequest.refresh_token` | No agregar | Se comparan contra la BD; un formato inválido equivale a un código incorrecto. |
| `LoginRequest`, `ForgotPasswordRequest`, `ResendVerificationCodeRequest`, `ChangeEmailRequestOnlyRegistered` | No agregar | `EmailStr` ya valida; aplicar la regla de contraseña en el login rompería cuentas antiguas. |
| `UpdateCompanyStatusRequest` | No agregar | El motivo obligatorio al suspender se valida en `CompanyService.py:388` (400 `MISSING_REQUIRED_FIELD`), porque solo aplica cuando la empresa pasa de activa a suspendida, algo que el schema no sabe. |
| `UpdateReportStatusRequest` | No agregar | `status` es `Literal` (además, `ReportService.py:173` lo revalida); `adminResponse` es opcional por diseño. |
| `AddFavoriteRequest`, `CheckoutRequest` | No agregar | Solo `UUID`; `FavoriteService.py:73` devuelve 404 si el producto no existe y `CheckoutService.py:54` filtra la dirección por `user_id`. |
| `*StatusRequest` (`is_active: bool`), `GenerateCombinationsRequest`, `SetProductAttributesRequest` | No agregar | Tipos estrictos; las reglas de catálogo se validan en el servicio contra la BD. |
| `CreateColorRequest`, `UpdateColorRequest` | No agregar | Clases vacías sin campos (legado). |
