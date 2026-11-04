# Inventario de archivos `.env` — 04/11/2026

Rama `docs/implantacion-s1-s4`. Solo nombres de variables y resultados de comparación: **no se incluye ningún valor de secreto**. Las coincidencias se compararon valor contra valor con un script local que no imprimía los valores. Las credenciales de las URL de base de datos se compararon contra `.env.postgres` y solo se registró verdadero/falso.

La sección 1 describe los archivos **antes** de los cambios en las plantillas de ese mismo día. Esos cambios están en la sección 6.

---

## 1. Archivos

| Sigla | Archivo | En Git | Quién lo carga |
|---|---|---|---|
| R | `.env` | no | compose: interpolación `${…}` y build args del frontend |
| Rx | `.env.example` | sí | plantilla local del `.env` raíz |
| Dp | `deploy/env.prod.example` | sí | plantilla de producción del `.env` raíz |
| PG / PGx | `.env.postgres` / `.env.postgres.example` | no / sí | `env_file` de `postgres` y `pgbouncer` (`docker-compose.yml:27-28,67-68`) |
| MN / MNx | `.env.minio` / `.env.minio.example` | no / sí | `env_file` de `minio` y del backend (`docker-compose.yml:6-7,125-127`) |
| B | `RehniMarket-backend/.env` | no | `env_file` del backend (`docker-compose.yml:125-126`) + `load_dotenv()` (`app/Config.py:3`) |
| Bd | `RehniMarket-backend/.env.dev` | no | `docker-compose.dev.yml:9-10,34-35,72-73`: compartido por minio, postgres y backend |
| Bx | `RehniMarket-backend/.env.example` | sí | plantilla de desarrollo local |
| Bp | `RehniMarket-backend/.env.public.example` | sí | plantilla de producción del backend |
| F | `RehniMarket-frontend/.env` | no | Vite en `pnpm dev` (en `docker-compose.dev.yml` el directorio va montado) |
| Fl | `RehniMarket-frontend/.env.local` | no | Vite en `pnpm dev`; prevalece sobre F |
| Fx | `RehniMarket-frontend/.env.example` | sí | plantilla |
| M / Mx | `RehniMarket-mobile/.env` / `.env.example` | no / sí | Expo |
| — | `backups/migracion_estado.env` | no | estado de `scripts/migracion/migrar.sh:19` (`SHA`, `TS`, `VALIDACION`); no es configuración |

`.gitignore` ignora `.env` y `.env.*` en cualquier nivel salvo `!.env*.example`; `git ls-files` confirma que no hay ningún `.env` real versionado. Los `.dockerignore` del backend y del frontend excluyen los `.env`: no entran en las imágenes.

## 2. Matriz de variables

Leyenda de clase: 🔴 secreta · 🟠 sensible (identificador o correo) · 🟢 pública. En la columna de coincidencia, "=" compara archivos reales con reales y plantillas con plantillas.

| Variable | Archivos | Coincidencia | La lee | Clase |
|---|---|---|---|---|
| `SECRET_KEY` | B, Bd, Bx, Bp | B = Bd ⚠️; Bx = Bp (marcador) | backend `app/Config.py:29`; CI inline | 🔴 |
| `ALGORITHM` | B, Bd, Bx, Bp | coinciden en todos | `app/Config.py:30`; CI | 🟢 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | B, Bd, Bx, Bp | coinciden en todos | `app/Config.py:31`; CI | 🟢 |
| `REFRESH_TOKEN_DAYS` | B, Bd, Bx, Bp | B = Bx = Bp; Bd difiere | `app/Config.py:32`; CI | 🟢 |
| `GMAIL_USERNAME` | B, Bd, Bx, Bp | B = Bd; plantillas con marcador distinto | `app/Config.py:33` | 🟠 |
| `GMAIL_APP_PASSWORD` | B, Bd, Bx, Bp | B = Bd ⚠️; plantillas con marcador distinto | `app/Config.py:34` | 🔴 |
| `URL_DATABASE` | B, Bd, Bx, Bp | B = Bd; usuario, contraseña y BD **coinciden con PG**; plantillas con marcadores | `app/Config.py:20`, Alembic; CI | 🔴 (lleva la contraseña) |
| `URL_DATABASE_POOLED` | B, Bp | en B las credenciales coinciden con PG; falta en Bd y Bx | `app/Config.py:28` (sin definir → `URL_DATABASE`), `app/database/Connection.py:16` | 🔴 |
| `URL_FRONTEND` | B, Bd, Bx, Bp | difiere en los 4 (lo esperado); en Bd apunta a una IP de red distinta de su `URL_BACKEND`, posiblemente obsoleta | `app/Config.py:35`; CI | 🟢 |
| `URL_BACKEND` | B, Bd, Bx, Bp | difiere en los 4 (lo esperado) | `app/Config.py:46`; CI | 🟢 |
| `MINIO_URL` | B, Bd, Bx, Bp | coinciden en todos | `app/Config.py:36`; CI | 🟢 |
| `MINIO_ROOT_USER` | MN, MNx, Bd | MN = Bd | minio; backend `app/Config.py:37` (vía `.env.minio`); backup/restore (`docker exec … printenv`); CI | 🟠 |
| `MINIO_ROOT_PASSWORD` | MN, MNx, Bd | MN = Bd ⚠️ (no sigue el criterio de generación de la sección 6) | minio; backend `app/Config.py:38`; backup/restore; CI | 🔴 |
| `POSTGRES_USER` / `POSTGRES_DB` | PG, PGx, Bd | PG = Bd | postgres, pgbouncer; scripts (`backup_rehnimarket.sh`, `restore_rehnimarket.sh`, `acceptance_smoke.sh`, `migracion/*`) siempre con `docker exec`; CI y `docker-compose.test.yml` inline | 🟠 / 🟢 |
| `POSTGRES_PASSWORD` | PG, PGx, Bd | PG = Bd ⚠️ (no sigue el criterio de generación de la sección 6) | igual que la fila anterior | 🔴 |
| `RUN_SEED` | B, Bd, Bx, Bp | B y plantillas desactivado; Bd activado | `app/Config.py:45`, `app/main.py:52`; CI | 🟢 |
| `RATE_LIMIT_ENABLED` | B, Bx, Bp | B = Bx (`false`); Bp `true`; falta en Bd (vale `false` por defecto) ⚠️ | `app/Config.py:47`, `app/main.py:110`; CI | 🟢 |
| `USER_NAME_OWNER` / `OWNER_DEFAULT` | B, Bd, Bx, Bp | B = Bd; plantillas vacías | `app/Config.py:42-43`, `app/utils/seed.py:1651-1652` | 🟠 |
| `OWNER_PASSWORD_DEFAULT` | B, Bd, Bx, Bp | B = Bd ⚠️; plantillas vacías | `app/Config.py:44`, `app/utils/seed.py:1653` | 🔴 |
| `USER_NAME_ADMIN` / `ADMIN_DEFAULT` | B, Bd, Bx, Bp | B = Bd; plantillas vacías | solo `app/Config.py:39-40`; **ningún código usa** `config.ADMIN_NAME` ni `config.ADMIN_DEFAULT` | 🟠 |
| `PASSWORD_DEFAULT` | B, Bd, Bx, Bp | B = Bd ⚠️; plantillas vacías | solo `app/Config.py:41`; **ningún código usa** `config.PASSWORD_DEFAULT` | 🔴 |
| `BACKEND_BIND` | R, Rx, Dp | R = Rx | `docker-compose.yml:146` | 🟢 |
| `DOCS_ENABLED` | R, Rx, Dp | R = Rx | compose `docker-compose.yml:140` → `app/Config.py:49` | 🟢 |
| `CORS_EXTRA_ORIGINS` | R, Rx, Dp | R = Rx | compose `docker-compose.yml:142` (y `docker-compose.tls-local.yml:21`) → `app/Config.py:54` | 🟢 |
| `VITE_API_URL` | R, Rx, Fl, Fx, Dp | R = Rx; Fl difiere (`localhost`); Fx vacío | build arg `docker-compose.yml:164` → `RehniMarket-frontend/Dockerfile:15,18`; `src/api/Client.ts`, `src/api/setupAuthInterceptor.ts` | 🟢 |
| `VITE_REHNIMARKET_WHATSAPP` | R, Rx, F, Fx, Dp | R = F; Rx difiere; Fx vacío | build arg `docker-compose.yml:165`; `src/features/wallet/utils/rechargeWhatsapp.ts` | 🟢 |
| `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_REHNIMARKET_WHATSAPP` | M, Mx | Mx vacío | `RehniMarket-mobile/src/config/env.ts` | 🟢 |
| `SITE_ADDRESS` / `API_ADDRESS` | Dp | — | compose `docker-compose.yml:181-182` → `caddy/Caddyfile:38,44`, `deploy/Caddyfile:43,49` | 🟢 |
| `ACME_EMAIL` | Dp | — | `deploy/compose.prod.yaml:25` → `deploy/Caddyfile:17` | 🟠 |
| `FRONTEND_PORT` | Dp | — | `docker-compose.yml:188` | 🟢 |
| `SHA` / `TS` / `VALIDACION` | `backups/migracion_estado.env` | — | `scripts/migracion/migrar.sh` | 🟢 (estado) |

**Plantillas versionadas:** todos los valores secretos de Bx, Bp, PGx y MNx eran marcadores (`REEMPLAZAR_POR_…`, `CAMBIA_…`, `contraseña-de-aplicacion…`). Ninguna plantilla contenía un secreto real.

## 3. Variables `VITE_` y `EXPO_PUBLIC_`

Ninguna contiene un secreto. Son una URL de la API y un número de WhatsApp de contacto comercial, que va en claro dentro del bundle a propósito: se usa para el enlace `wa.me`. Si ese número fuera personal, conviene saber que acaba en el JavaScript público.

## 4. Variables que se leen pero no estaban en ninguna plantilla

| Variable | La lee | Valor por defecto | Estado tras el 04/11/2026 |
|---|---|---|---|
| `URL_DATABASE_POOLED` | `app/Config.py:28` | `URL_DATABASE` | documentada en Bx (comentada) y en Bp ya estaba |
| `REQUEST_LIMIT` | `app/Config.py:57` | `100` | documentada en Bx y Bp |
| `TIME_WINDOW` | `app/Config.py:58` | `60` | documentada en Bx y Bp |
| `UVICORN_WORKERS` | `docker-compose.yml:138,144`; `app/Config.py:65` | `3` en compose; `1` en el código | documentada en Rx y Dp |
| `FORWARDED_ALLOW_IPS` | `docker-compose.yml:139,144` | `172.16.0.0/12` | documentada en Rx y Dp |
| `PGBOUNCER_MAX_CLIENT_CONN` | `docker-compose.yml:79,143`; `app/Config.py:73` | `1200` en compose; `200` en el código | documentada en Rx y Dp |
| `BACKEND_PORT` | `docker-compose.yml:146` | `8000` | documentada en Rx y Dp |
| `SITE_ADDRESS` / `API_ADDRESS` | `docker-compose.yml:181-182` | `rehnimarket` / `api.rehnimarket` | documentadas en Rx (Dp ya las tenía) |
| `CADDY_TLS` | **nadie** (solo el ejemplo de `caddy/readme.md:243`) | — | anotada en Rx como obsoleta |
| `THREADPOOL_SIZE`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE` | `app/Config.py:66-70` | `40`, `20`, `30`, `5`, `1800` | **sin documentar** (fuera del alcance de este cambio) |
| `EMAIL_MAX_WORKERS`, `SMTP_TIMEOUT` | `app/Config.py:91-92` | `4`, `10` | **sin documentar** (fuera del alcance) |
| `FRONTEND_HTTPS_PORT` | `docker-compose.tls-local.yml:16,21` | `8443` | sin documentar (solo prueba local de HTTPS) |
| `TEST_DATABASE_URL` | `RehniMarket-backend/tests/conftest.py:24`; CI | — | sin documentar en plantillas (está en `ci.yml`) |
| `BASE_URL`, `FRONTEND_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD` 🔴 | `scripts/smoke-test.sh` | — | documentadas en la cabecera del script; se pasan por el entorno |
| `MIGRACION_ESTADO` | `scripts/migracion/migrar.sh:19` | `backups/migracion_estado.env` | documentada en el script |

## 5. Hallazgos

1. **Desarrollo y el `.env` local que sirve el puerto 8000 comparten secretos:** `SECRET_KEY`, `GMAIL_APP_PASSWORD` y las contraseñas del seed son iguales en B y Bd. Además, Bd repite las credenciales de PG y MN.
2. **Las contraseñas locales de Postgres y MinIO no siguen el criterio de generación** (`openssl rand -hex 32`).
3. **`RATE_LIMIT_ENABLED` está desactivado en B,** mientras que la plantilla de producción (Bp) lo activa.
4. **La contraseña de la base está duplicada:** vive en `.env.postgres` y otra vez dentro de `URL_DATABASE` y `URL_DATABASE_POOLED`. Hoy coinciden, pero se pueden desincronizar.
5. **`.env` raíz es idéntico a `.env.example`.**
6. **`RehniMarket-frontend/.env` solo duplica el WhatsApp del `.env` raíz.**
7. **Variables sin uso:** `USER_NAME_ADMIN`, `ADMIN_DEFAULT` y `PASSWORD_DEFAULT` se leen en `app/Config.py:39-41`, pero ningún código las usa.
8. **El procedimiento de producción usaba la plantilla de desarrollo:** el paso 5 de la §5.2 copiaba `RehniMarket-backend/.env.example` (con `RATE_LIMIT_ENABLED=false` y URL de `localhost`) en lugar de `.env.public.example`. Se corrigió el 04/11/2026 (sección 6).

## 6. Cambios aplicados el 04/11/2026 (solo plantillas y documentación, sin código)

- **`.env.example` y `deploy/env.prod.example`:** se añadieron `BACKEND_PORT`, `UVICORN_WORKERS`, `FORWARDED_ALLOW_IPS` y `PGBOUNCER_MAX_CLIENT_CONN`. En `.env.example` también `SITE_ADDRESS` y `API_ADDRESS`, y la nota de que `CADDY_TLS` está obsoleta. Todas comentadas con su valor por defecto y la cita archivo:línea.
- **`RehniMarket-backend/.env.example`:** se añadieron `URL_DATABASE_POOLED`, `REQUEST_LIMIT` y `TIME_WINDOW`, comentadas.
- **`RehniMarket-backend/.env.public.example`:**
  - `RATE_LIMIT_ENABLED=true`, más `REQUEST_LIMIT` y `TIME_WINDOW`.
  - Secretos con el marcador `CAMBIAR_generar_con_openssl_rand_hex_32` y el comando `openssl rand -hex 32`.
  - `GMAIL_APP_PASSWORD` con `CAMBIAR_contrasena_de_aplicacion_de_Google`, porque la emite Google.
  - Contraseñas del seed vacías a propósito: con `RUN_SEED=false` no se usan, y un marcador crearía una cuenta con una contraseña conocida si se activara el seed.
- **`.env.postgres.example` y `.env.minio.example`:** las contraseñas llevan el mismo marcador y el comando.
- **§5.2 del plan de implantación:**
  - Tabla de variables ampliada.
  - Paso 5 y estructura apuntan a `.env.public.example`.
  - Comprobación `grep` de marcadores antes de levantar los servicios.

## 7. Propuesta de estructura unificada (no aplicada; después de la entrega)

Principio: cada variable tiene un único dueño y cada contenedor recibe solo lo suyo. Se conservan las rutas actuales para no romper scripts ni documentación.

```
.env.example                       # infra/compose sin secretos (local + sección de producción)
deploy/env.prod.example            # overlay de producción del .env raíz
.env.postgres.example              # único dueño de POSTGRES_*
.env.minio.example                 # único dueño de MINIO_ROOT_*
RehniMarket-backend/.env.example   # app: JWT, correo, seed, URL_*, MINIO_URL, límites;
                                   #   sin repetir POSTGRES_* ni MINIO_ROOT_*
RehniMarket-backend/.env.dev.example  # SOLO overrides de dev (URL_*, RUN_SEED,
                                      #   REFRESH_TOKEN_DAYS, SECRET_KEY propio)
deploy/backend.env.prod.example    # = .env.public.example, movido junto al resto de producción
RehniMarket-frontend/.env.example  # solo pnpm dev; documentar que .env.local prevalece
RehniMarket-mobile/.env.example    # sin cambios
scripts/verificar-env.sh           # nuevo: claves de las plantillas vs. lo que leen
                                   #   Config.py, compose, Vite y Expo; se ejecuta en CI
```

- **Desarrollo:** `docker-compose.dev.yml` cargaría `.env.postgres`, `.env.minio`, `RehniMarket-backend/.env` y, al final, `.env.dev` con solo los overrides.
- **Opcional (cambia código):** `app/Config.py` derivaría `URL_DATABASE` de `POSTGRES_*` cuando no esté definida, para eliminar la duplicación de la contraseña (hallazgo 4).
- **Documentar** las variables que la sección 4 deja "sin documentar".
- **Quitar** `USER_NAME_ADMIN`, `ADMIN_DEFAULT` y `PASSWORD_DEFAULT` de las plantillas, o implementar su uso (hallazgo 7).

### Archivos que habría que tocar

**Versionados:**
- Plantillas: `.env.example`, `deploy/env.prod.example`, `RehniMarket-backend/.env.example`, `RehniMarket-backend/.env.public.example` (mover), `RehniMarket-backend/.env.dev.example` (nuevo), `RehniMarket-frontend/.env.example`.
- Compose y CI: `RehniMarket-backend/.gitignore`, `docker-compose.dev.yml`, `.github/workflows/ci.yml`, `scripts/verificar-env.sh` (nuevo).
- Código, solo si se elige derivar `URL_DATABASE`: `docker-compose.yml` y `RehniMarket-backend/app/Config.py`.
- Documentación con referencias a estas rutas:
  - `deploy/Caddyfile`, `deploy/compose.prod.yaml`, `CHANGELOG.md`, `RehniMarket-backend/CHANGELOG.md`
  - `docs/plan de implantacion - Rehnimarket/4)`, `5)` y `PENDIENTES-s1-s4.md`
  - unos 20 archivos de `docs/docs++/`

**Locales, no versionados (cada uno en su máquina):**
- `RehniMarket-backend/.env.dev`: reducirlo a solo overrides.
- `RehniMarket-frontend/.env`: eliminarlo.
- `.env.postgres`, `.env.minio`, `RehniMarket-backend/.env`: rotar las credenciales.
