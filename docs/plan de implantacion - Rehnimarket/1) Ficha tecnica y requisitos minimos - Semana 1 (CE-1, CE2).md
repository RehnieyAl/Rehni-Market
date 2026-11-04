| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | V1.1 |
| Fecha | 21/10/2026 |
| Actualizado | 04/11/2026 (SO de producción, inventario verificado, medición de consumo y verificación) |

---


## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

## 1.1 Descripción técnica

Rehni-Market es una plataforma de comercio electrónico que permite a los usuarios consultar productos, gestionar el carrito de compra y realizar pedidos, mientras que las empresas pueden publicar y administrar sus productos. Los administradores y el propietario gestionan usuarios, empresas, permisos y diferentes aspectos administrativos.

**Arquitectura.** La solución sigue una arquitectura de **frontend web + API backend + servicios de infraestructura**, desplegada con Docker Compose (`docker-compose.yml`) en un único servidor. El navegador solo se comunica con Caddy (contenedor `frontend`), que sirve el frontend y hace de reverse proxy de la API; la base de datos y el almacenamiento de archivos quedan dentro de la red interna de Docker.

| Servicio (contenedor) | Tecnología | Función | Puerto en el servidor |
|---|---|---|---|
| `rehni-frontend` | Caddy 2.11 + build de React 19 (Vite) | Sirve el frontend y actúa como reverse proxy de la API | 8080 (HTTP, `docker-compose.yml:188`). 8443 (HTTPS) solo con la variante de prueba `docker-compose.tls-local.yml`; en producción 80 y 443 (sección 4.5) |
| `rehni-backend` | FastAPI sobre Python 3.13 y Uvicorn | API REST; al arrancar aplica las migraciones de Alembic (`docker-compose.yml:144`) | 8000 (`docker-compose.yml:146`; en producción solo en `127.0.0.1`) |
| `pgbouncer_pool` | PgBouncer | Pool de conexiones entre la API y PostgreSQL | No se publica |
| `rehni-postgres` | PostgreSQL 17 | Base de datos relacional | No se publica |
| `rehni-minio` | MinIO | Almacenamiento de imágenes y archivos (bucket `uploads`) | No se publica |

**Sistema operativo seleccionado.** Producción: **Ubuntu Server 24.04 LTS** (x86_64/amd64) con Docker Engine y el plugin Docker Compose; detalle en la sección 1.3. El equipo de desarrollo, donde se hicieron las mediciones de esta sección, usa CachyOS Linux x86_64.

**Requisitos mínimos (resumen de la matriz 1.5).** 2 vCPU, 4 GB de RAM, 30 GB de disco SSD, red de 100 Mbps, arquitectura x86_64, Ubuntu Server 24.04 LTS, Docker 24.0 o superior y los puertos 8080 y 8000 libres (80 y 443 en producción).

**Verificación.** El script `scripts/verificar-requisitos.sh` comprueba CPU, RAM, disco, arquitectura, sistema operativo, versión de Docker y puertos, y termina con código `0` si todo cumple (resultado en la sección 1.7).

## 1.2 Inventario de software

Versiones obtenidas el 04/11/2026 de los contenedores en marcha (`caddy version`, `postgres --version`, `pgbouncer --version`, `minio --version`, `python --version`), de `RehniMarket-backend/uv.lock` / metadatos del paquete instalado y de `RehniMarket-frontend/pnpm-lock.yaml` / `node_modules/<paquete>/package.json`.

Licencias: del archivo de licencia o metadato de la imagen o paquete, o del repositorio o página oficial citados (consultados el 04/11/2026).

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| Ubuntu Server | Sistema operativo del servidor de producción | 24.04 LTS | Obra agregada: cada paquete con su propia licencia; descarga y actualizaciones gratuitas (sección 1.3) | No |
| PostgreSQL | Base de datos relacional | 17.10 (`postgres:17-alpine`) | PostgreSQL License («PostgreSQL is released under the PostgreSQL License», <https://www.postgresql.org/about/licence/>) | No |
| PgBouncer | Pool de conexiones | 1.26.0 (`edoburu/pgbouncer:latest`, `docker-compose.yml:64`) | ISC (`COPYRIGHT` del repositorio oficial, «ISC License», <https://github.com/pgbouncer/pgbouncer/blob/master/COPYRIGHT>; también el metadato `apk` de la imagen: `license: ISC`, aunque registra el paquete 1.25.2 y el binario es 1.26.0) | No |
| MinIO | Almacenamiento de objetos/archivos | RELEASE.2025-09-07T16-13-09Z (fijado por digest, `docker-compose.yml:3`) | AGPLv3 (`/licenses/LICENSE` de la imagen) | No |
| Caddy | Servidor web y reverse proxy (contenedor `frontend`) | v2.11.7 (`caddy:2.11-alpine`, `RehniMarket-frontend/Dockerfile:22`) | Apache-2.0 (etiqueta `org.opencontainers.image.licenses` de la imagen) | No |
| Python | Runtime del backend | 3.13.14 (`python:3.13-slim`, `RehniMarket-backend/Dockerfile:1`) | PSF License v2 (`/usr/local/lib/python3.13/LICENSE.txt` de la imagen `python:3.13-slim`, L73: «PYTHON SOFTWARE FOUNDATION LICENSE VERSION 2») | No |
| uv | Gestor de dependencias del backend | 0.11.29 (`ghcr.io/astral-sh/uv:latest`, `RehniMarket-backend/Dockerfile:5`) | MIT o Apache-2.0, a elección («uv is licensed under either of … Apache License, Version 2.0 … MIT license … at your option», <https://github.com/astral-sh/uv>) | No |
| FastAPI | Framework para API REST | 0.135.1 | MIT | No |
| Uvicorn | Servidor ASGI | 0.41.0 | BSD-3-Clause | No |
| SQLAlchemy | ORM y acceso a PostgreSQL | 2.0.48 | MIT | No |
| Alembic | Migraciones de base de datos | 1.18.4 | MIT | No |
| Pydantic | Validación y esquemas de datos | 2.12.5 | MIT | No |
| React | Biblioteca para frontend | 19.2.7 | MIT | No |
| TypeScript | Tipado estático del frontend | 6.0.3 | Apache-2.0 | No |
| Vite | Herramienta de desarrollo y compilación | 8.1.0 | MIT | No |
| Tailwind CSS | Framework de estilos | 4.3.2 | MIT | No |
| Node.js | Runtime de compilación del frontend | 22.23.1 (`node:22-alpine`, `RehniMarket-frontend/Dockerfile:1`) | Texto de permiso de la licencia MIT (`LICENSE` de <https://github.com/nodejs/node>: «Node.js is licensed for use as follows: … Permission is hereby granted, free of charge…»; incluye componentes de terceros con sus licencias) | No |
| pnpm | Gestor de paquetes | 11.15.0 (`RehniMarket-frontend/Dockerfile:6`) | MIT («The MIT License (MIT)», `LICENSE` de <https://github.com/pnpm/pnpm>) | No |
| Docker Engine | Contenedorización | 29.6.2 (equipo de desarrollo, `docker version`) | Apache-2.0 (`LICENSE` de <https://github.com/moby/moby>: «Apache License Version 2.0») | No |
| Docker Compose | Orquestación de servicios | 5.3.1 (equipo de desarrollo, `docker compose version`) | Apache-2.0 (`LICENSE` de <https://github.com/docker/compose>: «Apache License Version 2.0») | No |

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server 24.04 LTS (Noble) |
| Arquitectura | amd64 (x86_64). Canonical también publica arm64 y otras: «Ubuntu Server supports various 64-bit architectures and 32-bit arm.» |
| Fin de soporte estándar | Mayo de 2029. Fila de 24.04 LTS en <https://ubuntu.com/about/release-cycle>: «Standard security maintenance / May 2029 / Expanded security maintenance / May 2034». La misma página: «LTS are released every two years and receive 5 years of standard security maintenance.» |
| Licencia | Sin costo. <https://canonical.com/legal/intellectual-property-policy> (redirección de `ubuntu.com/licensing`): «Ubuntu is an aggregate work of many works, each covered by their own licence(s).» y «You can download, install and receive updates to Ubuntu for free.» |
| Requisitos mínimos oficiales (enlace) | <https://ubuntu.com/server/docs/reference/installation/system-requirements/> («The numbers below are true for Ubuntu 24.04 LTS (Noble) amd64»): RAM mínima 1.5 GB (ISO) / 1 GB (imágenes cloud), sugerida «3 GB or more»; almacenamiento mínimo 5 GB (ISO) / 4 GB (cloud), sugerido «25 GB or more». La página no fija un mínimo de CPU. |

Páginas consultadas el 04/11/2026. La versión puntual (24.04.x) no aparece en esas páginas. <!-- PENDIENTE: anotar la versión puntual (24.04.x) instalada en el servidor (`lsb_release -d`). -->

**Equipo de desarrollo (donde se midió).** CachyOS Linux x86_64 (*rolling release*, sin `VERSION_ID`), kernel 7.1.4-1-cachyos, 12 procesadores, 7150 MB de RAM y swap en `zram` (`/proc/swaps`).

## 1.4 Medición de consumo

Medido el 04/11/2026 en el equipo de desarrollo (12 procesadores, 7150 MB de RAM, swap en `zram`), con los cinco servicios de `docker-compose.yml`.

- **Reposo:** 3 muestras de `docker stats --no-stream` entre las 14:14:22 y las 14:14:37 UTC, sin tráfico; se toma la mayor de cada servicio.
- **Carga simulada con:** `k6 run -e BASE_URL=http://localhost:8000 -e VUS=50 scripts/load_test.k6.js`, de 14:22:42 a 14:30:13 UTC. Son 50 usuarios virtuales concurrentes (5 min de subida, 2 min sostenidos, 30 s de bajada) que recorren catálogo, búsqueda, detalle, ofertas y novedades (solo `GET` a `/public/*`). Resultado de k6: 42 940 peticiones (95,4/s), 0 % de fallos, p95 = 75,91 ms y todos los umbrales del script en verde. Durante la prueba se tomaron 88 muestras de `docker stats` (cada ~5 s); se toma la mayor de cada servicio. **Supuesto:** 50 usuarios concurrentes **no es la carga esperada del cliente**. No hay ningún dato de concurrencia esperada en el repositorio (los requisitos no funcionales de rendimiento, RNF-011 y RNF-012 de `docs/docs++/Analisis_Requisitos_RehniMarket.md:412-413`, no fijan usuarios). Se eligió 50 como carga moderada para no agotar la memoria del equipo de desarrollo (7 GB, ya con swap en uso). El valor por defecto del script, 1000 (`scripts/load_test.k6.js:8`), tampoco está justificado por un requisito. <!-- PENDIENTE: concurrencia esperada (usuarios simultáneos en hora pico) acordada con el cliente; repetir k6 con ese valor y recalcular la matriz 1.5. -->
- **RAM + swap:** el equipo usa swap en `zram`, así que `docker stats` (memoria residente) no muestra lo que el servicio tiene en swap. Por eso se registra también `memory.current + memory.swap.current` del cgroup de cada contenedor (`/sys/fs/cgroup/system.slice/docker-<id>.scope/`). Es la columna que se usa para dimensionar.

| Servicio | RAM reposo (`docker stats`) | RAM + swap reposo (cgroup) | RAM pico (`docker stats`) | RAM + swap pico (cgroup) | CPU pico |
|---|---:|---:|---:|---:|---:|
| `rehni-backend` (FastAPI, 3 workers) | 26,8 MiB | 341,3 MiB | 295,4 MiB | 354,8 MiB | 193,2 % |
| `rehni-frontend` (Caddy) | 9,1 MiB | 22,6 MiB | 44,0 MiB | 47,2 MiB | 5,1 % |
| `pgbouncer_pool` (PgBouncer) | 5,6 MiB | 17,2 MiB | 9,2 MiB | 16,4 MiB | 9,5 % |
| `rehni-postgres` (PostgreSQL) | 22,9 MiB | 49,8 MiB | 43,5 MiB | 86,3 MiB | 144,1 % |
| `rehni-minio` (MinIO) | 13,3 MiB | 92,1 MiB | 116,5 MiB | 143,4 MiB | 7,2 % |
| **Total** | **77,7 MiB** | **523,0 MiB** | **508,6 MiB** (suma de picos) | **646,2 MiB** (máximo simultáneo) | **344,5 %** (máximo simultáneo, 14:27:29 UTC) |

100 % de CPU equivale a un procesador completo: el pico simultáneo de 344,5 % son unos 3,4 procesadores ocupados por los cinco servicios a la vez. k6 corrió en el mismo equipo y su consumo no está en la tabla.

Datos en disco medidos el mismo día:
- Imágenes del proyecto: 1245 MB en total (`rehni-market-backend` 533 MB, `postgres:17-alpine` 424 MB, `rehni-market-frontend` 102 MB, `caddy:2.11-alpine` 94,6 MB, MinIO 62 MB, PgBouncer 30 MB).
- Volúmenes: `postgres_data` 559,8 MB, `backend_venv` 127,4 MB, `minio_data` 23,09 MB.
- Base de datos: `pg_database_size` = 16 MB.
- Respaldos: 282 MB en `backups/` con 7 conservados (cada uno: 1,6 MB el dump y 14 MB el `.tar.gz` de MinIO).


## 1.5 Matriz de requisitos

Recomendado = consumo medido + 50 % (rango del 30-50 % de la guía del bootcamp), más lo que Canonical sugiere para el propio sistema operativo (sección 1.3).

| Requisito | Mínimo | Recomendado | Justificación (cálculo) |
|---|---|---|---|
| CPU | 2 vCPU | 6 vCPU (**supuesto: 50 usuarios concurrentes**, sección 1.4) | Pico simultáneo medido con 50 usuarios concurrentes: 3,45 procesadores; 3,45 × 1,5 = 5,2 → 6 vCPU para esa concurrencia con p95 < 121 ms. Si la concurrencia acordada con el cliente es otra, este valor cambia. El mínimo de 2 vCPU sirve para menos concurrencia o mayor latencia. <!-- PENDIENTE: el mínimo no se midió en una VM de 2 vCPU; validarlo repitiendo k6 en la VM del laboratorio. --> |
| RAM | 4 GB | 8 GB | Servicios (mismo supuesto de 50 usuarios): pico simultáneo de RAM + swap de 646,2 MiB; × 1,5 = 969 MiB (≈ 0,95 GB). Sistema operativo: Canonical sugiere 3 GB o más. 3 + 0,95 = 3,95 → mínimo de 4 GB. Recomendado de 8 GB: los límites de `docker-compose.yml` suman 2304 MiB (1G + 768M + 256M + 128M + 128M, L20, L57, L108, L156, L198), y 3 GB + 2,25 GB = 5,25 GB caben con margen en 8 GB |
| Disco | 30 GB | 60 GB SSD | Sistema operativo: Canonical sugiere 25 GB o más. Proyecto medido: imágenes 1,25 GB + volúmenes 0,71 GB + respaldos 0,28 GB = 2,24 GB; × 1,5 = 3,4 GB. 25 + 3,4 = 28,4 → mínimo de 30 GB. El recomendado de 60 GB deja espacio a las imágenes que se reconstruyen en cada actualización y al crecimiento de datos |
| Tipo de disco / IOPS | SSD | SSD NVMe | Mejora los tiempos de acceso de PostgreSQL, Docker y almacenamiento de archivos. |
| Red | 100 Mbps | 1 Gbps | En la prueba de carga k6 recibió 187 MB en 7,5 min (415 kB/s ≈ 3,3 Mbit/s) con 50 usuarios, sin imágenes (solo JSON de `/public/*`). Las imágenes de MinIO (por `/media/proxy`) suben ese tráfico. <!-- PENDIENTE: medir el ancho de banda con imágenes si se quiere justificar el mínimo con un dato propio. --> |
| Arquitectura | x86_64 | x86_64 | Las imágenes del proyecto se construyen y miden en x86_64. Ubuntu Server 24.04 admite amd64 y arm64, pero arm64 no se ha probado con este stack |
| Sistema operativo | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS | SO de producción elegido (sección 1.3), con soporte estándar hasta mayo de 2029 |
| Docker / runtime | Docker 24.0 + plugin Compose | Docker Engine actual del repositorio oficial + plugin Compose | 24.0 es el umbral de `verificar-requisitos.sh` (`MIN_DOCKER_VERSION`). El desarrollo usa Docker 29.6.2 y Compose 5.3.1 |
| Puertos | 8080 y 8000 libres (desarrollo); 80 y 443 libres (producción) | Igual | `docker-compose.yml` publica 8080 (Caddy, L188) y 8000 (API, L146). En producción, `FRONTEND_PORT=80` y `deploy/compose.prod.yaml` publican 80 y 443, y la API queda solo en `127.0.0.1`. PostgreSQL, PgBouncer y MinIO no publican puertos: solo son accesibles dentro de la red de Docker |

Crecimiento estimado de datos: hoy la base ocupa 16 MB y MinIO 23,09 MB, con 865 productos y 4100 variantes (sección 3.5). <!-- PENDIENTE: registros/mes esperados (pedidos, productos e imágenes nuevas) según el cliente, para calcular registros/mes × tamaño promedio × meses. -->


## 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre | Para una implementación pequeña o mediana resulta suficiente y facilita mantenimiento y ampliaciones. |
| Nivel RAID del servidor de base de datos | RAID 1 | Permite mantener una copia espejo y tolerar la falla de una unidad. |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores Docker | Es la plataforma utilizada por Rehni-Market y permite aislar los diferentes servicios. |

## 1.7 Verificación de requisitos

**Script:** `scripts/verificar-requisitos.sh` del repositorio del proyecto. Umbrales por defecto = matriz 1.5 (Ubuntu ≥ 24.04, puertos 8080 y 8000). Chequeo propio: si un puerto lo ocupa un contenedor `rehni-*` en marcha, no lo cuenta como conflicto (aparece `RehniMarket` en ENCONTRADO).

**1. Equipo de desarrollo, umbrales de producción** (`bash scripts/verificar-requisitos.sh`, 2026-11-04 14:19 UTC, código de salida `1`):

```text
REQUISITO          ESPERADO               ENCONTRADO             ESTADO
------------------------------------------------------------------------
Procesadores       >= 2                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 30 en /             52                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  ubuntu >= 24.04        cachyos rolling        NO CUMPLE
Docker             >= 24.0                29.6.2                 CUMPLE
Puerto 8080        libre                  RehniMarket            CUMPLE
Puerto 8000        libre                  RehniMarket            CUMPLE

RESULTADO: 1 requisito(s) no se cumplen.
```

**2. Equipo de desarrollo, SO de desarrollo** (`OS_ID=cachyos MIN_OS_VERSION=rolling bash scripts/verificar-requisitos.sh`, misma hora, código de salida `0`):

```text
REQUISITO          ESPERADO               ENCONTRADO             ESTADO
------------------------------------------------------------------------
Procesadores       >= 2                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 30 en /             52                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  cachyos >= rolling     cachyos rolling        CUMPLE
Docker             >= 24.0                29.6.2                 CUMPLE
Puerto 8080        libre                  RehniMarket            CUMPLE
Puerto 8000        libre                  RehniMarket            CUMPLE

RESULTADO: el servidor cumple todos los requisitos mínimos.
```

**3. Contenedor `ubuntu:24.04`** (`docker run --rm -v "$PWD/scripts:/s:ro" ubuntu:24.04 bash /s/verificar-requisitos.sh`, código de salida `1`). Comprueba que el chequeo de SO reconoce Ubuntu 24.04; Docker no está instalado dentro del contenedor y CPU, RAM y disco son los del anfitrión:

```text
REQUISITO          ESPERADO               ENCONTRADO             ESTADO
------------------------------------------------------------------------
Procesadores       >= 2                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 30 en /             52                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  ubuntu >= 24.04        ubuntu 24.04           CUMPLE
Docker             >= 24.0                no instalado           NO CUMPLE
Puerto 8080        libre                  libre                  CUMPLE
Puerto 8000        libre                  libre                  CUMPLE

RESULTADO: 1 requisito(s) no se cumplen.
```

**Resultado.** El hardware del equipo de desarrollo cumple la matriz. El único `NO CUMPLE` de la ejecución 1 es el sistema operativo, porque el equipo no es el servidor de producción. <!-- PENDIENTE: ejecutar `PORTS="80 443" bash scripts/verificar-requisitos.sh` en el servidor Ubuntu Server 24.04 LTS (VM del laboratorio o VPS) y pegar aquí la salida con fecha; el resultado esperado es código 0. -->
