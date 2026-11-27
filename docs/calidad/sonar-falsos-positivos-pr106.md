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

**`css:S8776` (3).** Son `&:hover` y `&:active` dentro de bloques `@utility fill-hover` y `@utility brand-link`
de `src/index.css`. `@utility` es una directiva de Tailwind CSS v4 que define la raíz del anidamiento; Sonar
analiza el archivo como CSS estándar y no la reconoce. El build (Vite + Tailwind) lo compila sin errores.

**`pythonbugs:S2259` (1).** En `app/services/variants/resolver.py`, `option.attribute` está justo después de
`if option is None: api_error(...)`. `api_error` (`app/core/Exceptions.py`) está anotada `-> NoReturn` y
siempre lanza `HTTPException`, así que `option` nunca es `None` en esa línea. Sonar no sigue la anotación
entre módulos.

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

## Cómo marcarlos en SonarCloud

Necesita el permiso *Administer Issues* del proyecto (el propietario lo tiene).

1. Abrir `https://sonarcloud.io/project/issues?id=RehnieyAl_Rehni-Market&pullRequest=106&resolved=false&types=BUG`.
2. En el panel izquierdo, filtrar **Rule** = `python:S930`.
3. Marcar la casilla de selección de todos los resultados y pulsar **Bulk Change**.
4. Elegir **Mark as False Positive** y añadir el comentario: «FastAPI 0.135.1 admite Depends(scope=...);
   ver docs/calidad/sonar-falsos-positivos-pr106.md». Aplicar.
5. Repetir con **Rule** = `css:S8776` (comentario: «@utility de Tailwind v4») y `pythonbugs:S2259`
   (comentario: «api_error -> NoReturn»).
6. Volver a la pestaña del PR: el Quality Gate se recalcula al momento. Si el check de GitHub no se
   actualiza, relanzar el workflow «SonarCloud Analysis» del PR.

Si después del merge estos hallazgos vuelven a aparecer en el análisis de `develop` o `main`, se marcan igual,
filtrando por la rama en lugar del PR.

## Ubicaciones

#### `python:S930` (63)

| Archivo | Líneas |
|---|---|
| `RehniMarket-backend/app/routers/AddressRouter.py` | 32, 51, 62, 71 |
| `RehniMarket-backend/app/routers/AdminBankRouter.py` | 33, 48, 70 |
| `RehniMarket-backend/app/routers/AdminPayoutRouter.py` | 41, 92, 101 |
| `RehniMarket-backend/app/routers/AdminReturnRouter.py` | 43, 51, 59, 68, 78, 87, 96 |
| `RehniMarket-backend/app/routers/AdminUserRouters.py` | 55, 67 |
| `RehniMarket-backend/app/routers/AuthRouters.py` | 89, 103, 126, 142 |
| `RehniMarket-backend/app/routers/BankAccountRouter.py` | 33, 42, 51, 70 |
| `RehniMarket-backend/app/routers/CartRouter.py` | 32, 51, 62, 70 |
| `RehniMarket-backend/app/routers/CheckoutRouter.py` | 22 |
| `RehniMarket-backend/app/routers/CompanyFollowRouter.py` | 37, 47, 57 |
| `RehniMarket-backend/app/routers/CompanyPayoutRouter.py` | 41, 49 |
| `RehniMarket-backend/app/routers/CompanyRouter.py` | 110, 130, 140, 265, 465, 602, 631, 642, 660 |
| `RehniMarket-backend/app/routers/FavoriteRouter.py` | 26, 35, 44 |
| `RehniMarket-backend/app/routers/OrderRouter.py` | 47, 58, 67 |
| `RehniMarket-backend/app/routers/PlatformSettingsRouter.py` | 25, 33 |
| `RehniMarket-backend/app/routers/ReturnRouter.py` | 28, 36, 47 |
| `RehniMarket-backend/app/routers/ReviewRouter.py` | 33, 44, 54, 65 |
| `RehniMarket-backend/app/routers/WalletRouter.py` | 30, 51 |

#### `css:S8776` (3)

| Archivo | Líneas |
|---|---|
| `RehniMarket-frontend/src/index.css` | 107, 110, 124 |

#### `pythonbugs:S2259` (1)

| Archivo | Líneas |
|---|---|
| `RehniMarket-backend/app/services/variants/resolver.py` | 26 |

