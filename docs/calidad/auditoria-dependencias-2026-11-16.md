# Auditoría de dependencias — 2026-11-16 (v1.0.1)

Incidencia [#45](https://github.com/RehnieyAl/Rehni-Market/issues/45) · acción M-08 del plan de
mejora (`docs/plan-calidad.md`) · característica ISO/IEC 25010: **seguridad**.

## 1. Cómo se auditó

| Componente | Comando | Qué cubre |
|---|---|---|
| Backend | `uv export --frozen --no-emit-project --format requirements-txt` y `pip-audit -r … --require-hashes --disable-pip` | Las versiones exactas de `uv.lock`, sin resolver nada nuevo; producción (`--no-dev`) y desarrollo (`--only-dev`) por separado |
| Frontend | `pnpm audit --prod` y `pnpm audit` | `pnpm-lock.yaml`; lo que llega al navegador se comprobó buscando cada paquete en `dist/assets` |
| Móvil | `pnpm audit --prod` y `pnpm audit` | Solo informativo |

Las severidades de pip-audit (que no las informa) se tomaron de la base de advisories de GitHub.

## 2. Antes

### Backend (producción: 11 avisos en 5 paquetes; desarrollo: 15 en 2)

| Paquete | Versión | Vulnerabilidad | Severidad | ¿Producción? | Corregida en |
|---|---|---|---|---|---|
| python-jose | 3.5.0 | GHSA-3qf3-8w2g-rqmx (CVE-2026-85394): confusión de algoritmo con llaves públicas DER | Crítica | Sí (firma y verifica los JWT) | Sin arreglo |
| certifi | 2026.2.25 | GHSA-6q48-6c7w-9gw2: CA raíz emSign con intermedias comprometidas | Crítica | Sí | 2026.10.18 |
| ecdsa | 0.19.2 | GHSA-wj6h-64fc-37mp (CVE-2024-23342): ataque de tiempo Minerva | Alta | Por python-jose | Sin arreglo |
| pyasn1 | 0.6.4 | GHSA-2qm8-x737-gmw5, GHSA-fm9c-5rcf-2q5p, GHSA-mm57-4v3p-rchx, GHSA-9m75-vc3g-4x39 (DoS) | Alta | Por python-jose y rsa | 0.6.5 |
| dnspython | 2.8.0 | GHSA-45c3-73f7-pv4m, GHSA-vvf4-9x63-8xvv (DoS) | Alta | Sí (email-validator) | 2.9.2 |
| filelock | 4.0.12 | 13 avisos (p. ej. GHSA-v4x8-3wr5-3wq8, symlink) | Alta | No (pip-audit, desarrollo) | 4.2.1 |

### Frontend (`--prod`: 17 — 11 altas, 5 moderadas, 1 baja; completo: 44)

| Paquete | Versión | Vulnerabilidades | Severidad máx. | ¿Llega al navegador? | Corregida en |
|---|---|---|---|---|---|
| vite | 8.1.0 | GHSA-587h-7wmj-h5pm y 4 más | Alta | No (compilación) | 8.1.6 |
| postcss | 8.5.16 | GHSA-r28c-9q8g-f849, GHSA-fxqj-rqcc-2cmp | Alta | No | 8.5.23 |
| nanoid | 3.3.15 | GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 | Alta | No (el texto «nanoid» del bundle es el validador de zod) | 3.3.18 |
| source-map-js | 1.2.1 | GHSA-68fv-2mgg-jv7q | Alta | No | 1.2.2 |
| brace-expansion | 5.0.8 | GHSA-rgw5-rvv9-x895 y 3 más | Alta | No (dependencia directa sin uso) | 5.0.12 |
| follow-redirects | 1.16.0 | GHSA-q3jh-wrc6-jgq8 y 2 más | Alta | No (adaptador Node de axios) | 1.16.2 |
| undici, browserslist, zod (de eslint), @vitest/mocker, minimatch | — | 27 avisos | Alta | No (desarrollo) | Ver §3 |

`pnpm audit --prod` contaba como «producción» herramientas de compilación porque `@tailwindcss/vite`,
`tailwindcss` y `brace-expansion` estaban en `dependencies`.

### Móvil (informativo): 69 avisos en dependencias de producción

1 crítica (`shell-quote`, herramienta de Metro/Expo), 37 altas, 24 moderadas y 7 bajas. En la app
corre `axios` 1.19.0 (7 altas, corregidas en 1.20.0); el resto son herramientas de compilación y
del servidor de desarrollo (`node-forge`, `undici`, `compression`, `image-size`…).

## 3. Qué se corrigió

| Cambio | Motivo |
|---|---|
| **python-jose → PyJWT 2.15.1** (`app/services/authentication/JWTService.py`) | python-jose no tiene versión corregida. PyJWT emite el mismo formato (HS256, `sub`, `exp`); `algorithms=["HS256"]` queda fijo en el código y la variable `ALGORITHM` del `.env` desaparece. Salen también `ecdsa`, `rsa`, `pyasn1` y `six`, que solo llegaban por python-jose |
| Tokens emitidos por python-jose siguen siendo válidos | `tests/test_jwt.py::TestPythonJoseCompatibility`: un access y un refresh token generados con python-jose 3.5.0 abren sesión y renuevan con PyJWT; desplegar no cierra sesiones |
| `/auth/refresh` con token vencido o sin `sub` respondía **500** | Ahora 401 (`REFRESH_TOKEN_EXPIRED` o `REFRESH_TOKEN_INVALID`); `verify_token` exige `exp` y `sub`, y rechaza un `sub` que no sea UUID |
| `certifi` 2026.10.18, `dnspython` 2.9.2, `filelock` 4.2.1 (desarrollo) | Versión mínima corregida; sin cambios de versión mayor |
| `vite` 8.1.6, `vitest` y `@vitest/coverage-v8` 4.1.12 | Parches |
| `overrides` en `RehniMarket-frontend/pnpm-workspace.yaml`: `postcss` 8.5.23, `nanoid` 3.3.18, `source-map-js` 1.2.2, `follow-redirects` 1.16.2, `brace-expansion` 5.0.12, `undici` 8.12.2, `browserslist` 4.28.7, `zod` 4.6.6 | Transitivas; cada selector solo alcanza el rango vulnerable y no frena versiones nuevas |
| `@tailwindcss/vite` y `tailwindcss` a `devDependencies`; se quita `brace-expansion` | `--prod` mide ahora lo que de verdad se sirve; la imagen Docker usa `pnpm install` completo y compila igual |

Pruebas del JWT (`tests/test_jwt.py`, 22): token válido, vencido, firma y payload alterados, `alg`
`none`, HS512/HS384, encabezado RS256, `sub` ausente o que no es UUID, refresh válido, vencido,
mal formado, sin `sub`, y access y refresh intercambiados: todos 401 salvo los válidos.

## 4. Después

| Componente | Resultado |
|---|---|
| Backend (`uv.lock` completo, producción y desarrollo) | **0 vulnerabilidades** |
| Frontend `pnpm audit --prod` | **0 vulnerabilidades** |
| Frontend `pnpm audit` completo | 1 moderada de desarrollo: `minimatch` (excepción, §5) |
| Móvil | Sin cambios (fuera del alcance de esta versión; §6) |

Verificación: backend 370 pruebas pasan (6 xfailed), cobertura 66,82 %, ruff limpio; frontend lint,
`tsc`, 184 pruebas y build; imágenes Docker de backend y frontend construidas (PyJWT 2.15.1 en la
imagen y sin `jose`; el frontend sirve `index.html` y sus assets desde `/srv`).

## 5. Qué quedó y por qué

| ID | Paquete | Motivo | Revisión |
|---|---|---|---|
| GHSA-g3hv-75wg-m249 | `minimatch` 10.2.5 (frontend, desarrollo, moderada) | Llega por eslint y typescript-eslint y no corre en producción; el arreglo exige minimatch 11 (versión mayor) y ninguna versión de eslint lo usa todavía | 2027-02-16 |

Las excepciones viven en `.github/auditoria-excepciones.txt`; el CI las ignora solo hasta su fecha de
revisión y falla cuando vence.

## 6. Móvil

No se corrigió en esta versión (pedido: solo informativo). Lo prioritario es `axios` ≥ 1.20.0, que
corre dentro de la app. Dependabot quedó configurado para el móvil y propondrá esos arreglos.

## 7. Para que no vuelva a pasar

- **CI, job `auditoria`** (`.github/workflows/ci.yml`): `pip-audit` sobre todo `uv.lock` (falla con
  cualquier aviso conocido: pip-audit no filtra por severidad) y `pnpm audit --prod --audit-level=high`.
  Falla también si una excepción venció. Para que bloquee el merge hay que agregarlo como check
  obligatorio en el ruleset de `main`.
- **Dependabot** (`.github/dependabot.yml`): semanal (lunes 07:00, America/Bogota) para uv, npm
  (frontend y móvil) y github-actions, con un PR agrupado para menores y parches y otro para arreglos
  de seguridad por ecosistema; las versiones mayores llegan aparte.
- **Deuda relacionada**: `pyproject.toml` fija con `==` dependencias transitivas; se cambiaron solo
  las necesarias y la limpieza quedó en la incidencia [#57](https://github.com/RehnieyAl/Rehni-Market/issues/57).
