| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | v0 (semana 2) |
| Fecha | 04/11/2026 |

---

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

### 5.0 Plan de instalación v0 (semana 2)

| # | Sección | Contenido |
|---|---|---|
| 1 | Alcance | Instalar los cinco servicios de `docker-compose.yml` (`frontend` con Caddy, `backend`, `pgbouncer`, `postgres`, `minio`) en un servidor Ubuntu Server 24.04 LTS con Docker Compose. La app móvil (`RehniMarket-mobile/`) no forma parte de `docker-compose.yml` y queda fuera de este plan |
| 2 | Ambientes | **Desarrollo:** CachyOS, `docker compose up -d` (carga `docker-compose.override.yml`), solo HTTP en `:8080` y API en `:8000`. **Prueba local de HTTPS:** override `docker-compose.tls-local.yml` (sección 4.5). **Producción:** Ubuntu Server 24.04 LTS, `docker-compose.yml` + `deploy/compose.prod.yaml`, HTTPS en `:443`. **Nube:** <!-- PENDIENTE: proveedor y plan (sección 5.3) --> |
| 3 | Roles | Responsable técnico (Yeinher Algarin): ejecuta la instalación, decide el rollback (sección 2.6). Cliente: aprueba el resultado y el reporte de rechazos de la migración (sección 2.6). <!-- PENDIENTE: otros roles (administrador del servidor, contacto del cliente) si los hay --> |
| 4 | Prerrequisitos | Ver sección 1 (ficha técnica): matriz 1.5 y `scripts/verificar-requisitos.sh` con código de salida `0` |
| 5 | Preparación | Ubuntu Server 24.04 LTS con Docker Engine y el plugin Compose instalados según la guía oficial (paso 2 de la instalación inicial), usuario de despliegue en el grupo `docker`, DNS apuntando al servidor (sección 4.3) y puertos 80/443/22 abiertos (sección 4.4) |
| 6 | Procedimiento | Ver sección 5.2 (instalación inicial, actualización y rollback) |
| 7 | Migración de datos | Esquema: el backend aplica `alembic upgrade head` al arrancar (`docker-compose.yml:144`). Datos del sistema anterior: sección 2 (`scripts/migracion/migrar.sh`) |
| 8 | Verificación | `docker compose ps` con los cinco servicios `healthy`, `curl` a `/health/database` y `bash scripts/smoke-test.sh` (sección 5.2) |
| 9 | Rollback | Ver sección 5.2 (rollback) y la clasificación de migraciones |
| 10 | Cronograma | Ver tabla de abajo |

#### Cronograma de la ventana

| Fase | Duración | Acumulado |
|---|---|---|
| Verificar requisitos (`verificar-requisitos.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Respaldo previo (`respaldar.sh`) | 1 min 58 s (medido el 04/11/2026 en desarrollo, sección 3.5) | |
| `git pull` + `docker compose ... up -d --build` (incluye `alembic upgrade head`) | <!-- PENDIENTE: medir en el servidor --> | |
| Verificación (`ps`, `/health/database`, `smoke-test.sh`) | <!-- PENDIENTE: medir en el servidor --> | |
| Migración de datos del sistema anterior (si aplica, sección 2) | <!-- PENDIENTE: no hay medición registrada (sección 2.3) --> | |

**Punto de no retorno:** el arranque del backend con la nueva imagen, porque ejecuta `alembic upgrade head` (`docker-compose.yml:144`). Si la versión trae una migración **no compatible hacia atrás** (tabla de clasificación de la sección 5.2), volver a la versión anterior exige restaurar el respaldo previo (sección 3.4) y se pierde lo escrito después de él.

<!-- Secciones 5.1 a 5.4 (procedimiento de despliegue v1): semana 4. -->
