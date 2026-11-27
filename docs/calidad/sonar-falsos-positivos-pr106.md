# SonarCloud · falsos positivos del PR #106 (2026-11-26)

El Quality Gate del PR #106 falló por *Reliability Rating* (67 bugs) y *Security Rating* (1 vulnerabilidad).
Se revisaron los 68 hallazgos uno por uno contra el código:

| Hallazgo | Cantidad | Veredicto | Acción |
|---|---|---|---|
| `python:S930` «unexpected named argument 'scope'» | 63 | Falso positivo | Marcar en SonarCloud |
| `css:S8776` «Missing scoping root» | 3 | Falso positivo | Marcar en SonarCloud |
| `pythonbugs:S2259` «attribute access on a value that can be 'None'» | 1 | Falso positivo | Marcar en SonarCloud |
| `python:S2068` contraseña fija en `seed_demo.py` | 1 | **Real** | Corregido en código (ver abajo) |

No se desactivó ninguna regla ni se añadieron `# NOSONAR`: las reglas siguen activas para el resto del código.

## Por qué son falsos positivos

**`python:S930` (63).** Todas las líneas son `database: Session = Depends(get_db, scope="function")`. La
versión que fija `uv.lock` es **FastAPI 0.135.1**, y en ella la firma es
`Depends(dependency=None, *, use_cache=True, scope: Literal['function', 'request'] | None = None)`. El
analizador de Sonar no reconoce ese parámetro. `scope="function"` es necesario: cierra la
sesión de base de datos al terminar el endpoint y no después de enviar la respuesta, lo que evita el bloqueo
del pool de PgBouncer bajo carga. Quitarlo cambiaría el comportamiento en producción.
`tests/test_db_session_scope.py` lo demuestra en ejecución (con `"function"` la dependencia ya está cerrada
mientras se envía la respuesta; con `"request"`, no) y falla si algún router usa `Depends(get_db)` sin `scope`.

**`css:S8776` (3).** Son `&:hover` y `&:active` dentro de bloques `@utility fill-hover` y `@utility brand-link`
de `src/index.css`. `@utility` es una directiva de Tailwind CSS v4 (el proyecto usa `^4.3.2`) que define la
raíz del anidamiento; Sonar analiza el archivo como CSS estándar y no la reconoce. Evidencia del build:
`.fill-hover:hover:not(:disabled){box-shadow:inset 0 0 0 1px #ffffff52}`, `.fill-hover:active:not(:disabled){scale:.98}`
y `.brand-link:hover{text-decoration-thickness:2px}` en `dist/assets/index-*.css`.

**`pythonbugs:S2259` (1).** En `app/services/variants/resolver.py`, `option.attribute` está justo después de
`if option is None: api_error(...)`. `api_error` (`app/core/Exceptions.py`) está anotada `-> NoReturn` y
termina con un `raise HTTPException` incondicional, así que `option` nunca es `None` en esa línea. Sonar no
sigue la anotación entre módulos. Regresión: `test_unknown_option_rejected` exige 404 con
`CATALOG_ATTRIBUTE_OPTION_NOT_FOUND` (no un 500 por `AttributeError`).

## Vulnerabilidad corregida: contraseña de las empresas demo

`SEED_COMPANY_PASSWORD = "RehniSeed2026*"` ya existía en `develop` (antes en `seed.py`); el refactor la movió
de archivo. Ahora:

- La clave sale de la variable de entorno `SEED_DEMO_PASSWORD` y debe cumplir la política de contraseñas
  de la app (`check_password_strength`). Si falta o es débil, **no se crea ninguna cuenta demo**.
- `deploy/env.prod.example` la deja vacía junto con `RUN_SEED=false` y una prueba lo verifica.
- Pruebas en `tests/test_seed_demo_companies.py`: sin clave o con clave débil no hay cuentas; con clave
  válida la cuenta abre con ella y no con la antigua.

Pendiente de verificación del propietario (no se consultó producción): la clave antigua sigue en el
historial de git. Si alguna base se sembró con ella, esas cuentas siguen abriendo con esa clave:

```sql
SELECT email, "isActive" FROM users WHERE email LIKE '%@rehnimarket.example' OR email LIKE '%@rehnimarket.test';
```

Si aparecen filas en producción, desactivarlas o cambiarles la clave.

## Code smells del mismo análisis

No bloquean el Quality Gate (mantenibilidad A), pero aparecen entre las anotaciones del PR.

| Regla | Cantidad | Veredicto |
|---|---|---|
| `python:S6903` `datetime.utcnow()` | 3 | **Corregido**: `datetime.now(timezone.utc).replace(tzinfo=None)`, el mismo valor UTC sin zona que guardan las columnas (una fecha con zona fallaría al compararse con ellas). Se cambiaron también las otras 3 de `publicService/Products.py`; las demás del proyecto ya existían antes del PR. |
| `python:S8495` tuplas de distinto largo | 1 | **Corregido**: `_catalog_order` devuelve una lista de criterios para `order_by(*...)`, cuyo largo depende del orden pedido. |
| `python:S8396` campo `Optional` sin valor por defecto | 15 | **Aceptado por diseño** («Won't fix»): todos son modelos de **respuesta**. Sin valor por defecto, la clave es obligatoria aunque pueda ser `null`: si un servicio olvida un campo, la validación falla en vez de responder `null` en silencio. Ningún campo de petición está afectado. El OpenAPI los publica como *obligatorios que admiten null* y la web los tipa igual (`string \| null`, sin `?`); `= None` los volvería opcionales. |
| `typescript:S6845` `tabIndex` en elemento no interactivo | 3 | **Falso positivo**: son contenedores con desplazamiento (`role="region"` con nombre); `tabIndex={0}` permite desplazarlos con el teclado, como exige la regla `scrollable-region-focusable` de axe. La galería además maneja flechas. |
| `typescript:S6852` `tablist` no enfocable | 1 | **Falso positivo**: patrón de pestañas WAI-ARIA con *roving tabindex*; el foco va a las pestañas, no al contenedor. |
| `python:S8786` / `typescript:S8786` expresión regular costosa | 3 | **Corregido**: `[^@\s]+@[^@\s]+\.[^@\s]+` retrocedía de forma cuadrática (50 000 caracteres malformados: 1,6 s en el navegador; 8 000: 208 ms en Python). Se cambió por `[^@\s]+@[^@\s][^@\s.]*\.[^@\s]+`, lineal (< 0,1 ms) y **equivalente**: 0 diferencias sobre todas las cadenas de hasta 9 caracteres de `a . @ espacio tab` en Python y de hasta 8 en JavaScript (4,4 millones). En la web queda en `shared/utils/emailPattern.ts`; pruebas en `emailPattern.test.ts` y `tests/test_contact_email_validation.py`. |

## Cómo marcarlos en SonarCloud

Necesita el permiso *Administer Issues* del proyecto (el propietario lo tiene).

1. Abrir `https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&pullRequest=106&resolved=false&types=BUG`.
2. En el panel izquierdo, filtrar **Rule** = `python:S930`.
3. Marcar la casilla de selección de todos los resultados y pulsar **Bulk Change**.
4. Elegir **Mark as False Positive** y añadir el comentario: «FastAPI 0.135.1 admite Depends(scope=...);
   ver docs/calidad/sonar-falsos-positivos-pr106.md». Aplicar.
5. Repetir con **Rule** = `css:S8776` (comentario: «@utility de Tailwind v4») y `pythonbugs:S2259`
   (comentario: «api_error -> NoReturn»).
   Para los code smells: `typescript:S6845` y `typescript:S6852` como **False Positive**, y
   `python:S8396` como **Won't Fix** (comentario: «modelos de respuesta: clave obligatoria anulable»).
6. Volver a la pestaña del PR: el Quality Gate se recalcula al momento. Si el check de GitHub no se
   actualiza, relanzar el workflow «SonarCloud Analysis» del PR.

Si después del merge estos hallazgos vuelven a aparecer en el análisis de `develop` o `main`, se marcan igual,
filtrando por la rama en lugar del PR.

## Ubicaciones y claves (análisis de `0620fba`)

Rutas relativas a `RehniMarket-backend/` o `RehniMarket-frontend/`.

| Regla | Archivo:línea | Clave de SonarCloud | Veredicto |
|---|---|---|---|
| `python:S930` | `app/routers/AddressRouter.py:32` | `AaIbL1CZsLF0D2GC6XjD` | Falso positivo |
| `python:S930` | `app/routers/AddressRouter.py:51` | `AaIbL1CZsLF0D2GC6XjE` | Falso positivo |
| `python:S930` | `app/routers/AddressRouter.py:62` | `AaIbL1CZsLF0D2GC6XjF` | Falso positivo |
| `python:S930` | `app/routers/AddressRouter.py:71` | `AaIbL1CZsLF0D2GC6XjG` | Falso positivo |
| `python:S930` | `app/routers/AdminBankRouter.py:33` | `AaIbL1DCsLF0D2GC6XjP` | Falso positivo |
| `python:S930` | `app/routers/AdminBankRouter.py:48` | `AaIbL1DCsLF0D2GC6XjQ` | Falso positivo |
| `python:S930` | `app/routers/AdminBankRouter.py:70` | `AaIbL1DCsLF0D2GC6XjR` | Falso positivo |
| `python:S930` | `app/routers/AdminPayoutRouter.py:41` | `AaIbL1DusLF0D2GC6Xjd` | Falso positivo |
| `python:S930` | `app/routers/AdminPayoutRouter.py:92` | `AaIbL1DusLF0D2GC6Xje` | Falso positivo |
| `python:S930` | `app/routers/AdminPayoutRouter.py:101` | `AaIbL1DusLF0D2GC6Xjf` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:43` | `AaIbL1CEsLF0D2GC6Xi6` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:51` | `AaIbL1CEsLF0D2GC6Xi7` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:59` | `AaIbL1CEsLF0D2GC6Xi8` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:68` | `AaIbL1CEsLF0D2GC6Xi9` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:78` | `AaIbL1CEsLF0D2GC6Xi-` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:87` | `AaIbL1CEsLF0D2GC6Xi_` | Falso positivo |
| `python:S930` | `app/routers/AdminReturnRouter.py:96` | `AaIbL1CEsLF0D2GC6XjA` | Falso positivo |
| `python:S930` | `app/routers/AdminUserRouters.py:55` | `AaIbL1BusLF0D2GC6Xiv` | Falso positivo |
| `python:S930` | `app/routers/AdminUserRouters.py:67` | `AaIbL1BusLF0D2GC6Xiw` | Falso positivo |
| `python:S930` | `app/routers/AuthRouters.py:89` | `AaIbL1DcsLF0D2GC6XjV` | Falso positivo |
| `python:S930` | `app/routers/AuthRouters.py:103` | `AaIbL1DcsLF0D2GC6XjW` | Falso positivo |
| `python:S930` | `app/routers/AuthRouters.py:126` | `AaIbL1DcsLF0D2GC6XjX` | Falso positivo |
| `python:S930` | `app/routers/AuthRouters.py:142` | `AaIbL1DcsLF0D2GC6XjY` | Falso positivo |
| `python:S930` | `app/routers/BankAccountRouter.py:33` | `AaIbL1BYsLF0D2GC6Xiq` | Falso positivo |
| `python:S930` | `app/routers/BankAccountRouter.py:42` | `AaIbL1BYsLF0D2GC6Xir` | Falso positivo |
| `python:S930` | `app/routers/BankAccountRouter.py:51` | `AaIbL1BYsLF0D2GC6Xis` | Falso positivo |
| `python:S930` | `app/routers/BankAccountRouter.py:70` | `AaIbL1BYsLF0D2GC6Xit` | Falso positivo |
| `python:S930` | `app/routers/CartRouter.py:32` | `AaIbL1DmsLF0D2GC6XjZ` | Falso positivo |
| `python:S930` | `app/routers/CartRouter.py:51` | `AaIbL1DmsLF0D2GC6Xja` | Falso positivo |
| `python:S930` | `app/routers/CartRouter.py:62` | `AaIbL1DmsLF0D2GC6Xjb` | Falso positivo |
| `python:S930` | `app/routers/CartRouter.py:70` | `AaIbL1DmsLF0D2GC6Xjc` | Falso positivo |
| `python:S930` | `app/routers/CheckoutRouter.py:22` | `AaIbL1BlsLF0D2GC6Xiu` | Falso positivo |
| `python:S930` | `app/routers/CompanyFollowRouter.py:37` | `AaIbL1B8sLF0D2GC6Xi1` | Falso positivo |
| `python:S930` | `app/routers/CompanyFollowRouter.py:47` | `AaIbL1B8sLF0D2GC6Xi2` | Falso positivo |
| `python:S930` | `app/routers/CompanyFollowRouter.py:57` | `AaIbL1B8sLF0D2GC6Xi3` | Falso positivo |
| `python:S930` | `app/routers/CompanyPayoutRouter.py:41` | `AaIbL1CMsLF0D2GC6XjB` | Falso positivo |
| `python:S930` | `app/routers/CompanyPayoutRouter.py:49` | `AaIbL1CMsLF0D2GC6XjC` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:110` | `AaIbL1BOsLF0D2GC6Xih` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:130` | `AaIbL1BOsLF0D2GC6Xii` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:140` | `AaIbL1BOsLF0D2GC6Xij` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:265` | `AaIbL1BOsLF0D2GC6Xik` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:465` | `AaIbL1BOsLF0D2GC6Xil` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:602` | `AaIbL1BOsLF0D2GC6Xim` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:631` | `AaIbL1BOsLF0D2GC6Xin` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:642` | `AaIbL1BOsLF0D2GC6Xio` | Falso positivo |
| `python:S930` | `app/routers/CompanyRouter.py:660` | `AaIbL1BOsLF0D2GC6Xip` | Falso positivo |
| `python:S930` | `app/routers/FavoriteRouter.py:26` | `AaIbL1C0sLF0D2GC6XjM` | Falso positivo |
| `python:S930` | `app/routers/FavoriteRouter.py:35` | `AaIbL1C0sLF0D2GC6XjN` | Falso positivo |
| `python:S930` | `app/routers/FavoriteRouter.py:44` | `AaIbL1C0sLF0D2GC6XjO` | Falso positivo |
| `python:S930` | `app/routers/OrderRouter.py:47` | `AaIbL1DKsLF0D2GC6XjS` | Falso positivo |
| `python:S930` | `app/routers/OrderRouter.py:58` | `AaIbL1DKsLF0D2GC6XjT` | Falso positivo |
| `python:S930` | `app/routers/OrderRouter.py:67` | `AaIbL1DKsLF0D2GC6XjU` | Falso positivo |
| `python:S930` | `app/routers/PlatformSettingsRouter.py:25` | `AaIbL1CDsLF0D2GC6Xi4` | Falso positivo |
| `python:S930` | `app/routers/PlatformSettingsRouter.py:33` | `AaIbL1CDsLF0D2GC6Xi5` | Falso positivo |
| `python:S930` | `app/routers/ReturnRouter.py:28` | `AaIbL1CrsLF0D2GC6XjJ` | Falso positivo |
| `python:S930` | `app/routers/ReturnRouter.py:36` | `AaIbL1CrsLF0D2GC6XjK` | Falso positivo |
| `python:S930` | `app/routers/ReturnRouter.py:47` | `AaIbL1CrsLF0D2GC6XjL` | Falso positivo |
| `python:S930` | `app/routers/ReviewRouter.py:33` | `AaIbL1B0sLF0D2GC6Xix` | Falso positivo |
| `python:S930` | `app/routers/ReviewRouter.py:44` | `AaIbL1B0sLF0D2GC6Xiy` | Falso positivo |
| `python:S930` | `app/routers/ReviewRouter.py:54` | `AaIbL1B0sLF0D2GC6Xiz` | Falso positivo |
| `python:S930` | `app/routers/ReviewRouter.py:65` | `AaIbL1B0sLF0D2GC6Xi0` | Falso positivo |
| `python:S930` | `app/routers/WalletRouter.py:30` | `AaIbL1CisLF0D2GC6XjH` | Falso positivo |
| `python:S930` | `app/routers/WalletRouter.py:51` | `AaIbL1CisLF0D2GC6XjI` | Falso positivo |
| `css:S8776` | `src/index.css:107` | `AaIbL1H_sLF0D2GC6Xjm` | Falso positivo |
| `css:S8776` | `src/index.css:110` | `AaIbL1H_sLF0D2GC6Xjn` | Falso positivo |
| `css:S8776` | `src/index.css:124` | `AaIbL1H_sLF0D2GC6Xjo` | Falso positivo |
| `pythonbugs:S2259` | `app/services/variants/resolver.py:26` | `AaIbL1ABsLF0D2GC6XiP` | Falso positivo |
| `typescript:S6845` | `src/features/admin/components/dashboard/payout/AdminPayouts.tsx:133` | `AaIbL1FWsLF0D2GC6Xjg` | Falso positivo |
| `typescript:S6845` | `src/features/company/components/dashboard/finance/PayoutsList.tsx:89` | `AaIbL1HRsLF0D2GC6Xjk` | Falso positivo |
| `typescript:S6845` | `src/features/public/products/components/ProductGallery.tsx:126` | `AaIbL1GKsLF0D2GC6Xjj` | Falso positivo |
| `typescript:S6852` | `src/features/public/products/components/ProductTabs.tsx:54` | `AaIbL1F9sLF0D2GC6Xji` | Falso positivo |
| `python:S8396` | `app/schemas/SchemaDashboard/SchemaBank.py:61` | `AaIbL1AusLF0D2GC6XiT` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/SchemaBank.py:68` | `AaIbL1AusLF0D2GC6XiU` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/SchemaBankAccount.py:37` | `AaIbL1AssLF0D2GC6XiR` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/SchemaBankAccount.py:39` | `AaIbL1AssLF0D2GC6XiS` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/ShemaCompany.py:27` | `AaIbL1AysLF0D2GC6XiV` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/ShemaCompany.py:31` | `AaIbL1AysLF0D2GC6XiW` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/ShemaCompany.py:33` | `AaIbL1AysLF0D2GC6XiX` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/ShemaCompany.py:35` | `AaIbL1AysLF0D2GC6XiY` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaDashboard/ShemaCompany.py:36` | `AaIbL1AysLF0D2GC6XiZ` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:49` | `AaIbL1A0sLF0D2GC6Xib` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:50` | `AaIbL1A0sLF0D2GC6Xic` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:53` | `AaIbL1A0sLF0D2GC6Xid` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:54` | `AaIbL1A0sLF0D2GC6Xie` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:60` | `AaIbL1A0sLF0D2GC6Xif` | Aceptado por diseño (Won't Fix) |
| `python:S8396` | `app/schemas/SchemaPlatformSettings.py:61` | `AaIbL1A0sLF0D2GC6Xig` | Aceptado por diseño (Won't Fix) |
| `python:S8786` | `app/schemas/SchemaDashboard/ShemaCompany.py:60` | `AaIbL1AysLF0D2GC6Xia` | Corregido en este PR |
| `typescript:S8786` | `src/features/admin/components/dashboard/site/SiteSettings.tsx:24` | `AaIbL1FksLF0D2GC6Xjh` | Corregido en este PR |
| `typescript:S8786` | `src/features/company/utils/contactValidation.ts:12` | `AaIbL1HgsLF0D2GC6Xjl` | Corregido en este PR |
