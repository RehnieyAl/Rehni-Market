# Pendientes del plan de implantación — Semanas 1 a 4

Fecha: 04/11/2026. Rama `docs/implantacion-s1-s4`.

Fuentes de los requisitos: repositorio del bootcamp (`bc-implantacion`): `docs/plan-curricular.md`, `docs/plan-implantacion-template.md` y, por semana, `rubrica-evaluacion.md`, `3-proyecto/README.md` y `3-proyecto/starter/`. Los PDF de `actividad  a realizar/` tratan las actividades 2 a 4 y el informe de diseño, no la implantación.

Regla aplicada: todo dato sale del repositorio (archivo:línea), de la salida de un comando ejecutado el 04/11/2026 o de una página oficial citada. Lo demás queda marcado con `<!-- PENDIENTE: ... -->` en el archivo correspondiente.

---

## 1. Estado por semana

| Semana | Sección del plan | Estado | Bloqueos principales |
|---|---|---|---|
| 1 | §1 Ficha técnica (archivo `1)`) | **Con pendientes** | Licencias sin verificar (PgBouncer, Python, uv; PostgreSQL, Node.js, pnpm, Docker y Compose sin verificar en la sesión), versión puntual de Ubuntu, salida del script en el servidor real, validación del mínimo de 2 vCPU y crecimiento de datos |
| 2 | §2 Migración (archivo `2)`) | **Con pendientes** | Duración de la carga (no hay registro del ensayo del 21/10/2026) |
| 2 | §3 Respaldo v0 (archivo `3)`) | **Con pendientes** | Acuerdo de RPO/RTO con el cliente, copias 2 y 3, cifrado y programación automática (parte de la semana 6) |
| 2 | §5.0 Plan de instalación v0 (archivo `5)`) | **Con pendientes** | Duraciones del cronograma y roles adicionales |
| 3 | §4 Hosting y dominio (archivo `4)`) | **Con pendientes** | Proveedor del VPS, dominio (registrador, responsable, vencimiento), usuario solo SFTP y frecuencia de copia externa |
| 4 | §5.1-5.4 Despliegue v1 (archivo `5)`) | **Con pendientes** | Etiqueta `v1.0.0`, despliegue en servidor Ubuntu `/opt/rehnimarket` con evidencia, todo lo de la nube y los costos |

Condiciones de las rúbricas que siguen sin cumplirse:
- **S1 (CE-2 ≤ 30/60):** la medición real ya está, pero falta la salida del script en el servidor Linux de producción. La salida en el equipo de desarrollo está pegada.
- **S2 (CE-4 ≤ 15/35):** **cumplida**. Hay evidencia de restauración real con conteos antes y después (§3.5).
- **S3 (Producto ≤ 60/100):** **cumplida**. Hay evidencia de la prueba local del reverse proxy (§4.5, dos pruebas).
- **S4 (Producto ≤ 60/100):** **sin cumplir**. Falta la evidencia de la prueba de humo en el servidor y en la nube.

---

## 2. Lo que se llenó y de dónde sale

### §1 Ficha técnica
| Dato | Fuente |
|---|---|
| Puertos 8080/8000 (se quitó 8443) | `docker-compose.yml:146,188`; 8443 solo con `docker-compose.tls-local.yml` |
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
| Cálculo de la matriz 1.5 | Medición 1.4 × 1,5 + requisitos sugeridos de Canonical; límites de `docker-compose.yml` |
| Tamaños en disco | `docker image ls`, `docker system df -v`, `pg_database_size`, `du -sh backups` |
| Salida de `verificar-requisitos.sh` (3 ejecuciones) | Ejecutado el 04/11/2026 14:19 UTC |
| Fila «Backend/Caddy» corregida | Caddy solo corre en `frontend` (`docker-compose.yml:159-188`) |
| Fila «Cloudflared / dns_tunel» quitada y PgBouncer añadido | Servicios reales de `docker-compose.yml` |

### §2 Migración
| Dato | Fuente |
|---|---|
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
| Motivo del paso a solo HTTP | Commit `926d421` (diff de `caddy/Caddyfile`, `docker-compose.yml`, `.env.example`) y comentario en `caddy/Caddyfile:9-10` |
| Tres configuraciones de Caddy y para qué sirve cada una | `caddy/Caddyfile`, `caddy/Caddyfile.tls-internal` (nuevo), `deploy/Caddyfile` (nuevo) |
| Evidencia HTTP y evidencia `tls internal` | `curl --resolve` ejecutado el 04/11/2026 14:21 UTC |
| Variables de producción (se quitaron `CADDY_TLS` y `FRONTEND_HTTPS_PORT`, que ya no existen) | `deploy/env.prod.example`, `deploy/compose.prod.yaml` |

### §5 Instalación y despliegue (nueva)
| Dato | Fuente |
|---|---|
| Plan v0 con 10 secciones | `docker-compose.yml`, `README.md` («Puesta en marcha»), secciones 1-4 |
| Comandos de instalación de Docker en Ubuntu 24.04 | <https://docs.docker.com/engine/install/ubuntu/> y <https://docs.docker.com/engine/install/linux-postinstall/>, consultadas el 04/11/2026 |
| Tabla de variables | `.env*.example`, `RehniMarket-backend/.env.example`, `docker-compose.yml`, `app/Config.py:28` (`URL_DATABASE_POOLED`) |
| Clasificación de las 16 migraciones | `upgrade()`/`downgrade()` de cada archivo de `RehniMarket-backend/alembic/versions/` |
| Proceso de liberación | `.github/workflows/ci.yml`, `docker-compose.yml:119,166` |
| Validación de `deploy/` | `docker compose ... config` y `caddy validate` (sin despliegue real) |
| `CHANGELOG.md` (raíz) | README («Funcionalidades») y versiones medidas |

---

## 3. Lo que debes completar tú

| Archivo | Sección | Qué falta | De dónde sale |
|---|---|---|---|
| `1)` | 1.2 | Licencias de PgBouncer, Python y uv. Confirmar PostgreSQL, Node.js, pnpm, Docker y Compose | Repositorio o página oficial de cada proyecto |
| `1)` | 1.3 | Versión puntual 24.04.x | `lsb_release -d` en el servidor |
| `1)` | 1.5 CPU | Validar el mínimo de 2 vCPU | k6 (`VUS=50`) en una VM de 2 vCPU |
| `1)` | 1.5 Red | (Opcional) ancho de banda con imágenes | Medición propia |
| `1)` | 1.5 | Crecimiento estimado de datos | Registros/mes esperados según el cliente |
| `1)` | 1.7 | Salida de `PORTS="80 443" bash scripts/verificar-requisitos.sh` con fecha | Servidor Ubuntu Server 24.04 |
| `2)` | 2.3 | Duración real de la carga de la migración | `time` sobre las opciones 3-5 de `migrar.sh` en un ensayo (escribe en `users`: con respaldo y rollback) |
| `3)` | 3.2 | Acuerdo de RPO/RTO | Acta o correo del cliente con fecha |
| `3)` | 3.3 | Programación diaria, copias 2 y 3, cifrado y custodia de la llave | Decisión del responsable (semana 6) |
| `4)` | 4.1 | Proveedor del VPS | Decisión del responsable (con los precios de la §5.4) |
| `4)` | 4.2 | Registrador, responsable de pago y renovación, fecha de vencimiento | Cliente y panel del registrador |
| `4)` | 4.6 | Usuario solo SFTP en el destino externo; frecuencia de copia externa | Semana 6 y §3.3 |
| `5)` | Encabezado, 5.1 | Crear la etiqueta `v1.0.0` y poner su fecha en `CHANGELOG.md` | Tú (`git tag -a v1.0.0 ...`) |
| `5)` | 5.0 Roles | Roles adicionales (administrador del servidor, contacto del cliente) | Equipo y cliente |
| `5)` | 5.0 Cronograma | Duración de verificar, desplegar y verificar en el servidor, y de la migración | Medirlo en el servidor |
| `5)` | 5.1 | Si se etiquetan las imágenes con la versión o se publican en GHCR | Decisión (semana 7) |
| `5)` | 5.2 Variables | Valor de `URL_DATABASE_POOLED` en el `.env` real | `.env` del servidor |
| `5)` | 5.2 Evidencia | Salida de `smoke-test.sh` y `ps` en `/opt/rehnimarket` | Servidor Ubuntu |
| `5)` | 5.3 | Proveedor y plan, región, almacenamiento de imágenes (MinIO o S3), URL pública, procedimiento, rollback, límites del free tier con fuente y fecha, y prueba de humo | Tus cuentas (Render, Neon o Supabase) |
| `5)` | 5.4 | Precios mensuales y anuales de las dos alternativas, horas de administración, dominio y recomendación | Páginas de precios con fecha de consulta |
| `CHANGELOG.md` | `[1.0.0]` | Fecha de la versión | Fecha de la etiqueta |

Decisiones que tomé y debes validar:
- **Frecuencias de la §4.6:** «en cada liberación» y «en la instalación inicial y al rotar un secreto».
- **CPU recomendada de 6 vCPU:** sale del cálculo 3,45 × 1,5 sobre lo medido con 50 usuarios.
- **Criterio SemVer de la §5.1:** cuándo sube MAJOR, MINOR o PATCH.
- **Estructura `/opt/rehnimarket/` de la §5.2:** es el clon del repositorio, con los volúmenes gestionados por Docker.

---

## 4. Lo que no se puede verificar en local, y cómo comprobarlo

| Qué | Por qué no se verificó | Cómo comprobarlo |
|---|---|---|
| `deploy/Caddyfile` con Let's Encrypt | Necesita un dominio público que apunte al servidor y los puertos 80 y 443 abiertos | En el servidor: `docker compose -f docker-compose.yml -f deploy/compose.prod.yaml up -d` y `curl -I http://<dominio>/`, que debe dar `308` hacia `https://`; luego `curl -fsS https://api.<dominio>/health/database` y `curl -v https://<dominio>/ 2>&1 \| grep issuer`, con el emisor de Let's Encrypt |
| Instalación completa en Ubuntu 24.04 (`/opt/rehnimarket`) | No hay VM ni VPS en esta sesión | Seguir la tabla «Instalación inicial» de la §5.2 paso a paso y pegar la salida de los pasos 4, 7, 8 y 9 |
| `smoke-test.sh` | Registra un comprador `acc.<TS>@gmail.com` y dispararía un correo de verificación real | Ejecutarlo en el servidor: `bash scripts/smoke-test.sh` debe terminar con `[FALLA]` en 0 |
| Actualización y rollback «probados» (exigidos por la rúbrica de la semana 4) | Hacen falta dos versiones etiquetadas y el servidor | Tras crear `v1.0.0`, desplegar una versión posterior y volver con las tablas de la §5.2 |
| Mínimo de 2 vCPU | El equipo de desarrollo tiene 12 procesadores | k6 con `VUS=50` en una VM de 2 vCPU: comparar el p95 y los fallos con la §1.4 |
| Medición con el SO de producción | Se midió en CachyOS con swap en `zram` | Repetir la §1.4 en el servidor: `docker stats` durante `k6 run -e BASE_URL=http://localhost:8000 -e VUS=50 scripts/load_test.k6.js` |
| Despliegue en la nube | No hay cuentas en esta sesión | Ver §5.3. `smoke-test.sh` no sirve tal cual en un PaaS (usa `docker exec`) |
