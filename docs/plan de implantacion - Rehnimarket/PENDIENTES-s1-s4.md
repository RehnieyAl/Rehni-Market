# Pendientes del plan de implantación — Semanas 1 a 4

Fecha: 04/11/2026. Rama `docs/implantacion-s1-s4`.

Fuentes de los requisitos: repositorio del bootcamp (`bc-implantacion`): `docs/plan-curricular.md`, `docs/plan-implantacion-template.md` y, por semana, `rubrica-evaluacion.md`, `3-proyecto/README.md` y `3-proyecto/starter/`. Los PDF de `actividad  a realizar/` tratan las actividades 2 a 4 y el informe de diseño, no la implantación.

Regla aplicada: todo dato sale del repositorio (archivo:línea), de la salida de un comando ejecutado el 04/11/2026 o de una página oficial citada. Lo demás queda marcado con `<!-- PENDIENTE: ... -->` en el archivo correspondiente.

---

## 1. Estado por semana

| Semana | Sección del plan | Estado | Bloqueos principales |
|---|---|---|---|
| 1 | §1 Ficha técnica (archivo `1)`) | **Con pendientes** | Concurrencia esperada (los 50 usuarios son un supuesto), licencias sin verificar, versión puntual de Ubuntu, salida del script en el servidor real, validación del mínimo de 2 vCPU y crecimiento de datos |
| 2 | §2 Migración (archivo `2)`) | **Completa** | — (ensayo sobre una copia restaurada, §2.9) |
| 2 | §3 Respaldo v0 (archivo `3)`) | **Con pendientes** | Acuerdo de RPO/RTO con el cliente, copias 2 y 3, cifrado y programación automática (parte de la semana 6) |
| 2 | §5.0 Plan de instalación v0 (archivo `5)`) | **Con pendientes** | Duraciones del cronograma en el servidor y roles adicionales |
| 3 | §4 Hosting y dominio (archivo `4)`) | **Con pendientes** | Proveedor del VPS, dominio (registrador, responsable, vencimiento), usuario solo SFTP y frecuencia de copia externa |
| 4 | §5.1-5.4 Despliegue v1 (archivo `5)`) | **Con pendientes** | Etiqueta `v1.0.0`, despliegue en servidor Ubuntu `/opt/rehnimarket` con evidencia, todo lo de la nube y los costos |

Condiciones de las rúbricas:
- **S1 (CE-2 ≤ 30/60):** la medición real ya está, pero falta la salida del script en el servidor Linux de producción. La salida en el equipo de desarrollo está pegada.
- **S2 (CE-4 ≤ 15/35):** **cumplida**. Hay evidencia de restauración real con conteos antes y después (§3.5).
- **S3 (Producto ≤ 60/100):** **cumplida**. Hay evidencia de la prueba local del reverse proxy (§4.5, dos pruebas).
- **S4 (Producto ≤ 60/100):** **sin cumplir**. Falta la evidencia de la prueba de humo en el servidor y en la nube. Ya existe la del stack local (§5.2), que no cuenta como despliegue.

---

## 2. Lo que se llenó y de dónde sale

### §1 Ficha técnica
| Dato | Fuente |
|---|---|
| Puertos 80/443 (Caddy, HTTPS) y 8000 (API); PostgreSQL solo en `127.0.0.1:5433` | `docker-compose.yml:50,166,224-226` (compose único, 04/11/2026) |
| SO de producción: Ubuntu Server 24.04 LTS | Decisión del responsable (respuesta del 04/11/2026) |
| Fin de soporte (mayo de 2029; ESM hasta mayo de 2034) | <https://ubuntu.com/about/release-cycle>, cita literal, consultada el 04/11/2026 |
| Licencia de Ubuntu | <https://canonical.com/legal/intellectual-property-policy>, cita literal |
| Requisitos oficiales de Ubuntu 24.04 (RAM y disco) | <https://ubuntu.com/server/docs/reference/installation/system-requirements/>, cita literal |
| Versiones de PostgreSQL 17.10, PgBouncer 1.26.0, MinIO RELEASE.2025-09-07T16-13-09Z, Caddy v2.11.7, Python 3.13.14, uv 0.11.29 y Node 22.23.1 | `--version` dentro de cada contenedor o imagen |
| FastAPI, Uvicorn, SQLAlchemy, Alembic y Pydantic, con su licencia | `importlib.metadata` en `rehni-backend` (coincide con `uv.lock`) |
| React, Vite, TypeScript y Tailwind, con su licencia | `pnpm-lock.yaml` y `node_modules/<pkg>/package.json` |
| Licencia de Caddy: Apache-2.0 (antes decía BSD-2-Clause y versión 1.27-alpine, que era la de nginx) | Etiqueta OCI de `caddy:2.11-alpine`; `RehniMarket-frontend/Dockerfile:22` |
| Licencia de MinIO: AGPLv3 | `/licenses/LICENSE` de la imagen |
| Docker 29.6.2 / Compose 5.3.1 | `docker version`, `docker compose version` |
| Medición en reposo y en pico (tabla 1.4) | `docker stats` + `memory.current`/`memory.swap.current` del cgroup; k6 con 50 VUs de 14:22:42 a 14:30:13 UTC |
| Cálculo de la matriz 1.5 (con el supuesto de 50 usuarios marcado) | Medición 1.4 × 1,5 + requisitos sugeridos de Canonical; límites de `docker-compose.yml` |
| Tamaños en disco | `docker image ls`, `docker system df -v`, `pg_database_size`, `du -sh backups` |
| Salida de `verificar-requisitos.sh` (3 ejecuciones) | Ejecutado el 04/11/2026 14:19 UTC |
| Fila «Backend/Caddy» corregida | Caddy solo corre en `frontend` (`docker-compose.yml:193-255`) |
| Fila «Cloudflared / dns_tunel» quitada y PgBouncer añadido | Servicios reales de `docker-compose.yml` |

### §2 Migración
| Dato | Fuente |
|---|---|
| Ensayo completo (carga, transformación, validación y rollback): 12,2 s para las opciones 3-5, `OK=10 FALLA=0`, 73 migrados y 27 rechazados, rollback en 0,1 s | Ensayo del 04/11/2026 14:41 UTC sobre `rehnimarket_ensayo`, restaurada del respaldo `2026-11-04_14-31` y eliminada al terminar (§2.9) |
| Duración del respaldo previo: 1 min 58 s (antes: «menos de 1 minuto») | `backups/backup.log`, 04/11/2026 |
| Encabezado y comentarios de la plantilla, eliminados | Formato de `plan-implantacion-template.md` |

### §3 Respaldo
| Dato | Fuente |
|---|---|
| Evidencia de restauración: conteos de 9 tablas, `alembic_version`, 1,0 s | Respaldo `2026-11-04_14-15` restaurado en `rehnimarket_verif` (base aparte, eliminada después) |
| Verificación completa: 38 tablas y 4351 objetos, 12,8 s | `scripts/restore_rehnimarket.sh 2026-11-04_14-15 --verify-only` |
| Equivalencia `respaldar.sh` ↔ `backup_rehnimarket.sh` | `scripts/respaldar.sh` (1 línea, `exec`); ejecución con `--no-stop` el 04/11/2026 |
| Corrección de la carrera de `pg_isready` en `--verify-only` | Primer intento fallido (`PostgreSQL desechable no arranco`) y segundo correcto tras el cambio |

### §4 Hosting y dominio
| Dato | Fuente |
|---|---|
| Caddyfile único con HTTPS automático (reemplaza las tres configuraciones anteriores y el paso a solo HTTP del commit `926d421`) | `caddy/Caddyfile`; `caddy adapt` con `localhost`, `rehnimarket` y `ejemplo.com`, con y sin `CADDY_LOCAL_CERTS` |
| Evidencia `tls internal` con `rehnimarket` / `api.rehnimarket` (`CADDY_LOCAL_CERTS=local_certs`, `curl --resolve --cacert`) | Ejecutada el 04/11/2026 21:51 UTC |
| PostgreSQL en `127.0.0.1:5433` también en producción (nunca `0.0.0.0`) | `docker-compose.yml:50`; `docker compose port postgres 5432` → `127.0.0.1:5433` |
| Variables de producción (sin `CADDY_TLS`, `ACME_EMAIL`, `FRONTEND_PORT` ni `FRONTEND_HTTPS_PORT`) | `deploy/env.prod.example` |

### §5 Instalación y despliegue (nueva)
| Dato | Fuente |
|---|---|
| Plan v0 con 10 secciones | `docker-compose.yml`, `README.md` («Puesta en marcha»), secciones 1-4 |
| Duración de la migración en el cronograma (12,2 s) | Ensayo de la §2.9 |
| Comandos de instalación de Docker en Ubuntu 24.04 | <https://docs.docker.com/engine/install/ubuntu/> y <https://docs.docker.com/engine/install/linux-postinstall/>, consultadas el 04/11/2026 |
| Tabla de variables (ampliada el 04/11/2026 con `URL_DATABASE_POOLED`, `REQUEST_LIMIT`, `TIME_WINDOW`, `UVICORN_WORKERS`, `FORWARDED_ALLOW_IPS`, `PGBOUNCER_MAX_CLIENT_CONN` y `BACKEND_PORT`; marcadores de secretos y `RATE_LIMIT_ENABLED=true` en producción) | `.env*.example`, `deploy/env.prod.example`, `RehniMarket-backend/.env.public.example`, `docker-compose.yml:99,158-166,211-226`, `app/Config.py:28,47,57-58,65,73`; inventario en `docs/plan de implantacion - Rehnimarket/evidencias/inventario-env-2026-11-04.md` |
| Clasificación de las 16 migraciones | `upgrade()`/`downgrade()` de cada archivo de `RehniMarket-backend/alembic/versions/` |
| Proceso de liberación | `.github/workflows/ci.yml`, `docker-compose.yml:139,200` |
| Compose único (sin `deploy/compose.prod.yaml` ni `deploy/Caddyfile`) y justificación frente a la rúbrica | `docker compose config`, `caddy adapt` (sin despliegue real); §5.2 «Por qué no hay `deploy/compose.prod.yaml`» |
| MinIO de Chainguard: `chown -R 65532:65532` del volumen existente | Error `file access denied` reproducido y corregido el 04/11/2026 (§5.2) |
| `scripts/smoke-test.sh` (solo HTTP, `BASE_URL`) y su salida local con HTTPS: 7 pasan, 0 fallan, contra `https://api.localhost` y `https://localhost` | Ejecutado el 04/11/2026 a las 21:51:24 UTC |
| `CHANGELOG.md` (raíz) | README («Funcionalidades») y versiones medidas |

---

## 3. Lo que debes completar tú

| Archivo | Sección | Qué falta | De dónde sale |
|---|---|---|---|
| `1)` | 1.4 y 1.5 | **Concurrencia esperada** (usuarios simultáneos en hora pico), para repetir k6 con ese valor y recalcular CPU y RAM | Acuerdo con el cliente; en el repo no hay ningún dato |
| `1)` | 1.2 | Licencias de PgBouncer, Python y uv. Confirmar PostgreSQL, Node.js, pnpm, Docker y Compose | Repositorio o página oficial de cada proyecto |
| `1)` | 1.3 | Versión puntual 24.04.x | `lsb_release -d` en el servidor |
| `1)` | 1.5 CPU | Validar el mínimo de 2 vCPU | k6 en una VM de 2 vCPU |
| `1)` | 1.5 Red | (Opcional) ancho de banda con imágenes | Medición propia |
| `1)` | 1.5 | Crecimiento estimado de datos | Registros/mes esperados según el cliente |
| `1)` | 1.7 | Salida de `PORTS="80 443" bash scripts/verificar-requisitos.sh` con fecha | Servidor Ubuntu Server 24.04 |
| `3)` | 3.2 | Acuerdo de RPO/RTO | Acta o correo del cliente con fecha |
| `3)` | 3.3 | Programación diaria, copias 2 y 3, cifrado y custodia de la llave | Decisión del responsable (semana 6) |
| `4)` | 4.1 | Proveedor del VPS | Decisión del responsable (con los precios de la §5.4) |
| `4)` | 4.2 | Registrador, responsable de pago y renovación, fecha de vencimiento | Cliente y panel del registrador |
| `4)` | 4.6 | Usuario solo SFTP en el destino externo; frecuencia de copia externa | Semana 6 y §3.3 |
| `5)` | Encabezado, 5.1 | Crear la etiqueta `v1.0.0` y poner su fecha en `CHANGELOG.md` | Tú (`git tag -a v1.0.0 ...`) |
| `5)` | 5.0 Roles | Roles adicionales (administrador del servidor, contacto del cliente) | Equipo y cliente |
| `5)` | 5.0 Cronograma | Duración de verificar, desplegar y verificar en el servidor | Medirlo en el servidor |
| `5)` | 5.1 | Si se etiquetan las imágenes con la versión o se publican en GHCR | Decisión (semana 7) |
| `5)` | 5.2 Variables | Valor de `URL_DATABASE_POOLED` en el `.env` real | `.env` del servidor |
| `5)` | 5.2 Variables | Generar secretos propios de producción (`SECRET_KEY`, `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `GMAIL_APP_PASSWORD`) y no reutilizar los de desarrollo | `openssl rand -hex 32` en el servidor; `GMAIL_APP_PASSWORD`, contraseña de aplicación nueva emitida por Google. Inventario del 04/11/2026: hoy `RehniMarket-backend/.env` y `.env.dev` comparten `SECRET_KEY` y `GMAIL_APP_PASSWORD` |
| Todos | — | Reestructurar los `.env` según el inventario del 04/11/2026: después de la entrega | `docs/plan de implantacion - Rehnimarket/evidencias/inventario-env-2026-11-04.md` (propuesta y lista de archivos) |
| `5)` | 5.2 Prueba de humo | Crear en cada entorno (servidor y nube) una **cuenta de comprador de prueba ya verificada**, para no usar la de administrador | Tú, desde el panel o con el flujo normal de registro y verificación |
| `5)` | 5.2 Evidencia | Salida de `smoke-test.sh` y `ps` en `/opt/rehnimarket`, repetida con el compose único | Servidor Ubuntu |
| `5)` | 5.2 Estructura | **Confirmar con el instructor que el compose único cumple el entregable `deploy/`** (rúbrica de la semana 4 `:64-65` y `3-proyecto/README.md:13-14` piden `deploy/compose.prod.yaml` y la configuración del proxy; aquí son el `docker-compose.yml` y el `caddy/Caddyfile` únicos más `deploy/env.prod.example`) | Instructor |
| `5)` | 5.3 | Proveedor y plan, región, almacenamiento de imágenes (MinIO o S3), URL pública, procedimiento, rollback, límites del free tier con fuente y fecha, y prueba de humo con `BASE_URL` público | Tus cuentas (Render, Neon o Supabase) |
| `5)` | 5.4 | Precios mensuales y anuales de las dos alternativas, horas de administración, dominio y recomendación | Páginas de precios con fecha de consulta |
| `CHANGELOG.md` | `[1.0.0]` | Fecha de la versión | Fecha de la etiqueta |

---

## 4. Decisiones que tomé yo y debes validar

| # | Decisión | Dónde | Por qué la tomé | Qué la confirmaría o la cambiaría |
|---|---|---|---|---|
| D-1 | **50 usuarios concurrentes** en la prueba de carga (**supuesto, no es la carga esperada**) | §1.4 y §1.5 | La propuse como carga moderada porque el equipo de desarrollo tiene 7 GB y ya usaba swap; tú la elegiste entre las opciones. En el repo no hay ninguna cifra de concurrencia esperada (RNF-011 y RNF-012 no fijan usuarios), y el 1000 por defecto de `load_test.k6.js:8` tampoco está justificado | La concurrencia acordada con el cliente: repetir k6 con ese valor |
| D-2 | **CPU recomendada de 6 vCPU** y RAM recomendada de 8 GB | §1.5 | Cálculo del bootcamp (medido × 1,5) aplicado a lo medido con D-1: 3,45 × 1,5 = 5,2 → 6 | Cambia si cambia D-1 |
| D-3 | Mínimo de 2 vCPU sin medir | §1.5 | Se mantuvo el valor que ya tenía el plan | k6 en una VM de 2 vCPU |
| D-4 | Frecuencias de la §4.6: «en cada liberación» y «en la instalación inicial y al rotar un secreto» | §4.6 | Se deducen del procedimiento de la §5, no de un acuerdo | Tu política de despliegue y de rotación de secretos |
| D-5 | Criterio SemVer: MAJOR con migración no compatible hacia atrás o cambio incompatible de la API; MINOR con funcionalidad compatible; PATCH con corrección | §5.1 | Hacía falta un criterio y el proyecto no tenía uno escrito | Tu criterio de versionado |
| D-6 | Estructura `/opt/rehnimarket/` = clon del repositorio, con los volúmenes gestionados por Docker | §5.2 | Es lo que permite el `git pull` / `git checkout` de la actualización y el rollback | Si prefieres copiar solo `docker-compose.yml`, `caddy/` y el `.env`, y usar imágenes publicadas (semana 7) |
| D-7 | No usar `alembic downgrade` como rollback; con migraciones no compatibles, restaurar el respaldo | §5.2 | `d4e5f6a7b8c9` recrea vacías las columnas borradas y `b6f8fd31fbe` borra filas al bajar | — |
| D-8 | `a7c4e1f9b2d8` (valor nuevo del enum) clasificada como «Condicional» | §5.2 | La versión anterior no conoce `NEEDS_UPDATE` si alguna empresa tiene ese estado | Probar el rollback con una empresa en `NEEDS_UPDATE` |
| D-9 | Pasos de la prueba de humo (health, catálogo, `/cart` sin token, login fallido con `smoke-no-existe@example.com`, login + `/auth/me`, frontend) | `scripts/smoke-test.sh` | Cubren lo que pediste sin escribir datos ni enviar correos. El login fallido usa un correo inexistente: el backend responde antes de cualquier envío | Si quieres añadir más rutas de solo lectura |
| D-10 | En la ejecución local, la cuenta de prueba fue la de **administrador** del `.env` local | §5.2 | En la base de desarrollo no había un comprador con contraseña conocida y el script no puede registrar usuarios | Crear un comprador de prueba verificado por entorno (§3, fila «5.2 Prueba de humo») |
| D-11 | Ensayo de la migración sin detener la aplicación | §2.9 | Se hizo sobre una base aparte que la aplicación no usa. En producción la ventana sí detiene `frontend` y `backend` (§2.3) | — |

**Observación (sin cambios en el código):** `backup_rehnimarket.sh` detiene el backend durante todo el respaldo (1 min 58 s medidos, casi todo en la copia de MinIO), así que la API no responde en ese tiempo. La opción `--no-stop` lo evita, pero entonces la base y la copia de MinIO pueden quedar desalineadas. Hay que decidir el enfoque al automatizar el respaldo diario (semana 6).

---

## 5. Lo que no se puede verificar en local, y cómo comprobarlo

| Qué | Por qué no se verificó | Cómo comprobarlo |
|---|---|---|
| `caddy/Caddyfile` con Let's Encrypt (dominio público en el `.env`) | Necesita un dominio público que apunte al servidor y los puertos 80 y 443 abiertos | En el servidor: `docker compose up -d` con el `.env` de `deploy/env.prod.example` y `curl -I http://<dominio>/`, que debe dar `308` hacia `https://`; luego `curl -fsS https://api.<dominio>/health/database` y `curl -v https://<dominio>/ 2>&1 \| grep issuer`, con el emisor de Let's Encrypt |
| Instalación completa en Ubuntu 24.04 (`/opt/rehnimarket`) | No hay VM ni VPS en esta sesión | Seguir la tabla «Instalación inicial» de la §5.2 paso a paso y pegar la salida de los pasos 4, 7, 8 y 9 |
| `smoke-test.sh` en el servidor y en la nube | Solo se ejecutó contra el stack local | `BASE_URL=https://api.<dominio> FRONTEND_URL=https://<dominio> SMOKE_EMAIL=... SMOKE_PASSWORD=... bash scripts/smoke-test.sh`: debe dar `7 pasan, 0 fallan` y código `0` |
| Actualización y rollback «probados» (exigidos por la rúbrica de la semana 4) | Hacen falta dos versiones etiquetadas y el servidor | Tras crear `v1.0.0`, desplegar una versión posterior y volver con las tablas de la §5.2 |
| Mínimo de 2 vCPU | El equipo de desarrollo tiene 12 procesadores | k6 en una VM de 2 vCPU: comparar el p95 y los fallos con la §1.4 |
| Medición con el SO de producción | Se midió en CachyOS con swap en `zram` | Repetir la §1.4 en el servidor: `docker stats` durante `k6 run -e BASE_URL=http://localhost:8000 -e VUS=<concurrencia acordada> scripts/load_test.k6.js` |
| Migración en producción | El ensayo fue sobre una copia en el equipo de desarrollo | Ejecutar `migrar.sh` en la ventana (orden 1 → 2 → 3 → 4 → 5 → 7) y comparar el tiempo con los 12,2 s del ensayo |
| Despliegue en la nube | No hay cuentas en esta sesión | Ver §5.3 |
