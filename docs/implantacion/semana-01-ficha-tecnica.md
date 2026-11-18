# Entregable S01 — Ficha Técnica y Matriz de Requisitos

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Fecha | 2026-11-18 |
| Semana | 1 de 9 — Plataforma tecnológica y hardware (CE-1, CE-2) |
| Guía del bootcamp | `bc-implantacion/bootcamp/week-01-plataforma_tecnologica_y_hardware/3-proyecto/README.md`, plantilla `3-proyecto/starter/entregable-s01-ficha-tecnica.md`, rúbrica `rubrica-evaluacion.md` |
| Sección del plan consolidado | [§1 de `docs/plan-implantacion.md`](../plan-implantacion.md#1-ficha-técnica-y-requisitos-mínimos--semana-1-ce-1-ce-2) |
| Estado | Parcial: 4 `[PENDIENTE]` (2 se cierran con la salida del comando «a» en la VM) |

---

## 1.1 Descripción técnica

RehniMarket es una plataforma de comercio electrónico: los compradores consultan productos, usan el
carrito y hacen pedidos pagados con saldo interno (RehniCoin); las empresas publican y administran
su catálogo; los administradores y el único owner gestionan usuarios, empresas y permisos.

**Arquitectura:** frontend web (SPA de React) + API REST (FastAPI) + servicios de infraestructura,
todo en contenedores con **un solo** [`docker-compose.yml`](../../docker-compose.yml) para
desarrollo y producción. Solo cambia el `.env` de la raíz (plantilla de producción:
[`deploy/env.prod.example`](../../deploy/env.prod.example)). El navegador solo habla con Caddy, que
sirve el frontend y hace de reverse proxy de la API; la base de datos y el almacenamiento quedan en
la red interna `data`.

| Servicio (contenedor) | Tecnología | Función | Puerto en el servidor |
|---|---|---|---|
| `rehni-frontend` | Caddy 2.11 + build de React 19 (Vite) | Frontend y reverse proxy; termina HTTPS | `0.0.0.0:80` y `0.0.0.0:443` (TCP y UDP) |
| `rehni-backend` | FastAPI, Python 3.13, Uvicorn | API REST; aplica las migraciones de Alembic al arrancar | `127.0.0.1:8000` (solo el servidor) |
| `pgbouncer_pool` | PgBouncer | Pool de conexiones API → PostgreSQL | No se publica |
| `rehni-postgres` | PostgreSQL 17 | Base de datos | `127.0.0.1:5433` (solo el servidor) |
| `rehni-minio` | MinIO | Imágenes y certificados PDF (bucket `uploads`) | No se publica |

Usuarios: compradores, empresas vendedoras, administradores y un owner. Requisitos funcionales y no
funcionales: [`docs/requisitos/requisitos.md`](../requisitos/requisitos.md) (31 RF, 28 RNF).

## 1.2 Inventario de software

Versiones tomadas el 04/11/2026 de los contenedores en marcha (`--version` de cada binario), de
`RehniMarket-backend/uv.lock` y de `RehniMarket-frontend/pnpm-lock.yaml`. Licencias del archivo de
licencia o metadato de la imagen, o de la página oficial citada.

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| Ubuntu Server | SO del servidor de producción | 24.04.5 LTS (VM de Azure, [`deploy/README.md`](../../deploy/README.md) §3) | Obra agregada; cada paquete con su licencia. «You can download, install and receive updates to Ubuntu for free» (<https://canonical.com/legal/intellectual-property-policy>) | No |
| PostgreSQL | Base de datos | 17.10 (`postgres:17-alpine`) | PostgreSQL License (<https://www.postgresql.org/about/licence/>) | No |
| PgBouncer | Pool de conexiones | 1.26.0 (`edoburu/pgbouncer:latest`) | ISC (`COPYRIGHT` del repositorio oficial) | No |
| MinIO | Almacenamiento de objetos | RELEASE.2026-10-23T20-06-51Z (`cgr.dev/chainguard/minio`, fijada por digest) | AGPLv3 | No |
| Caddy | Servidor web, reverse proxy y TLS | v2.11.7 (`caddy:2.11-alpine`) | Apache-2.0 | No |
| Python | Runtime del backend | 3.13.14 (`python:3.13-slim`) | PSF License v2 | No |
| uv | Dependencias del backend | 0.11.29 | MIT o Apache-2.0 | No |
| FastAPI / Uvicorn | Framework y servidor ASGI | 0.135.1 / 0.41.0 | MIT / BSD-3-Clause | No |
| SQLAlchemy / Alembic / Pydantic | ORM, migraciones y validación | 2.0.48 / 1.18.4 / 2.12.5 | MIT | No |
| PyJWT | Firma de tokens (desde v1.0.1, reemplaza a python-jose) | 2.15.1 ([`CHANGELOG.md`](../../CHANGELOG.md)) | MIT | No |
| React / TypeScript / Vite / Tailwind CSS | Frontend | 19.2.7 / 6.0.3 / 8.1.6 (v1.0.1) / 4.3.2 | MIT / Apache-2.0 / MIT / MIT | No |
| Node.js / pnpm | Compilación del frontend | 22.23.1 / 11.15.0 | MIT / MIT | No |
| Docker Engine / Compose | Contenedores | 29.9.3 / 5.7.1 en la VM ([`deploy/README.md`](../../deploy/README.md) §3) | Apache-2.0 | No |
| DuckDNS | Subdominios y DNS | Servicio | Gratuito | No |
| Let's Encrypt | Certificados TLS | Servicio (emisor automático de Caddy) | Gratuito | No |

Ningún componente genera costo de licencia. El único costo es la VM de Azure (semana 4, §5.4).

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server 24.04 LTS (Noble); instalada 24.04.5 LTS en la VM de Azure ([`deploy/README.md`](../../deploy/README.md) §3) |
| Arquitectura | amd64 (x86_64) |
| Fin de soporte estándar | Mayo de 2029; mantenimiento extendido (ESM) hasta mayo de 2034 (<https://ubuntu.com/about/release-cycle>, consultada el 04/11/2026) |
| Licencia | Sin costo (<https://canonical.com/legal/intellectual-property-policy>) |
| Requisitos mínimos oficiales (enlace) | <https://ubuntu.com/server/docs/reference/installation/system-requirements/>: RAM mínima 1,5 GB (ISO) / 1 GB (imagen cloud), sugerida «3 GB or more»; disco mínimo 5 GB / 4 GB, sugerido «25 GB or more». La página no fija un mínimo de CPU |

**Por qué Ubuntu Server 24.04 LTS:** LTS con soporte hasta 2029, imagen oficial en Azure, Docker
Engine la admite (<https://docs.docker.com/engine/install/ubuntu/>) y es el SO que pide el bootcamp.

## 1.4 Medición de consumo

Medido el 04/11/2026 en el equipo de desarrollo (CachyOS x86_64, 12 procesadores, 7150 MB de RAM,
swap en `zram`) con los cinco servicios del compose. Como el equipo usa swap, se midió también
`memory.current + memory.swap.current` del cgroup de cada contenedor: es la columna que se usa para
dimensionar.

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---|---|---|
| `rehni-backend` (3 workers) | 341,3 MiB | 354,8 MiB | 193,2 % |
| `rehni-frontend` (Caddy) | 22,6 MiB | 47,2 MiB | 5,1 % |
| `pgbouncer_pool` | 17,2 MiB | 16,4 MiB | 9,5 % |
| `rehni-postgres` | 49,8 MiB | 86,3 MiB | 144,1 % |
| `rehni-minio` | 92,1 MiB | 143,4 MiB | 7,2 % |
| **Total** | **523,0 MiB** | **646,2 MiB** (máximo simultáneo) | **344,5 %** (≈ 3,4 procesadores, máximo simultáneo) |

Carga simulada con: k6, 50 usuarios virtuales concurrentes (5 min de subida, 2 min sostenidos,
30 s de bajada) sobre catálogo, búsqueda, detalle, ofertas y novedades (solo `GET` a `/public/*`).
Script de entonces: `git show 45ea99d:scripts/load_test.k6.js` (hoy reemplazado por
[`tests/load/`](../../tests/load/)). Resultado: 42 940 peticiones, 0 % de fallos, p95 = 75,91 ms.
Supuesto: 50 usuarios no es una concurrencia acordada con el cliente (los RNF de rendimiento no fijan
usuarios). [PENDIENTE: concurrencia esperada en hora pico, acordada con el cliente, para repetir con `tests/load/04-sustained.js`].

Datos en disco (mismo día): imágenes 1,25 GB, volúmenes 0,71 GB, base de datos 16 MB, 7 respaldos
282 MB.

## 1.5 Matriz de requisitos

Recomendado = consumo medido + 50 %, más lo que Canonical sugiere para el propio SO (§1.3).

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 vCPU | 6 vCPU para 50 usuarios concurrentes | Pico simultáneo 3,45 procesadores × 1,5 = 5,2 → 6. Con 2 vCPU el compose baja los límites (`BACKEND_CPUS=2`, `POSTGRES_CPUS=1.5`, [`deploy/README.md`](../../deploy/README.md) §3), que es la configuración de la VM |
| RAM | 4 GB | 8 GB | Servicios: 646,2 MiB × 1,5 ≈ 0,95 GB; SO: 3 GB sugeridos → 3,95 → 4 GB. Los límites del compose suman 2,25 GiB; 3 + 2,25 = 5,25 GB caben con margen en 8 GB |
| Disco | 30 GB | 60 GB SSD | SO 25 GB + proyecto 2,24 GB × 1,5 = 3,4 GB → 28,4 → 30 GB. El recomendado deja espacio a imágenes reconstruidas y respaldos |
| Tipo de disco / IOPS | SSD | SSD NVMe | PostgreSQL y la compilación de imágenes dependen de la latencia del disco |
| Red | 100 Mbps | 1 Gbps | k6: 3,3 Mbit/s con 50 usuarios sin imágenes; las imágenes por `/media/proxy` suben ese tráfico |
| Arquitectura | x86_64 | x86_64 | Las imágenes se construyen y prueban en x86_64; arm64 no se ha probado |
| Sistema operativo | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS | §1.3 |
| Docker / runtime | Docker 24.0 + Compose ≥ 2.24 | Docker Engine actual del repositorio oficial | 24.0 es `MIN_DOCKER_VERSION` del script; la VM tiene 29.9.3 |
| Puertos | 80 y 443 libres para Caddy | Igual | Los únicos abiertos a Internet (semana 3, §4.4). 8000 y 5433 solo en `127.0.0.1` |

Crecimiento estimado de datos: hoy 16 MB de base y 23 MB de imágenes con 865 productos y 4100
variantes (datos de desarrollo). [PENDIENTE: registros por mes esperados (pedidos, productos, imágenes) según el cliente, para calcular registros/mes × tamaño × meses].

**Comparación con la VM de producción** (medido el 16/11/2026, [`deploy/README.md`](../../deploy/README.md) §3):
2 vCPU, 3,8 GiB de RAM, 29 GB de disco, Ubuntu 24.04.5. Cumple CPU, SO y Docker; la RAM queda
justo por debajo de los 4 GB (Azure reserva memoria del tamaño nominal) y el disco a 1 GB del
mínimo. Mitigación aplicada: 2 GiB de swap para compilar y compilar una imagen a la vez
([`deploy/README.md`](../../deploy/README.md) §3 y §6).

## 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre | Si el cliente lo alojara en sus instalaciones: un solo servidor pequeño, sin rack ni chasis blade, fácil de ampliar |
| Nivel RAID del servidor de base de datos | RAID 1 | Dos discos espejo: tolera la falla de uno con la mitad de capacidad útil, suficiente para 30–60 GB. RAID no reemplaza el respaldo (semana 2, §3) |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores Docker sobre una VM | Es como corre hoy en Azure: la VM aísla el sistema y los contenedores aíslan cada servicio con límites de CPU y memoria |

## 1.7 Verificación de requisitos

Script: [`scripts/verificar-requisitos.sh`](../../scripts/verificar-requisitos.sh). Umbrales por
defecto = matriz §1.5 (2 CPU, 4096 MB, 30 GB, x86_64, Ubuntu ≥ 24.04, Docker ≥ 24.0, puertos
`80 443 8000`). Chequeo propio: un puerto ocupado por un contenedor `rehni-*` en marcha no cuenta
como conflicto.

Servidor donde se ejecutó: VM Ubuntu 24.04 de Azure (producción), con `PORTS="80 443"`.

```
[PENDIENTE: salida de `PORTS="80 443" bash scripts/verificar-requisitos.sh` en la VM (comando «a» del 18/11/2026), con fecha y código de salida]
```

Ejecuciones de apoyo en el equipo de desarrollo (04/11/2026; entonces el script revisaba los puertos
`8080 8000`, que el compose único ya no usa). Fallos provocados a propósito:

| Ejecución | Resultado | Qué prueba |
|---|---|---|
| Equipo de desarrollo con umbrales de producción | Código 1: `Sistema operativo cachyos rolling NO CUMPLE` | Detecta un SO distinto del exigido |
| `OS_ID=cachyos MIN_OS_VERSION=rolling` | Código 0: todo `CUMPLE` | Umbral de SO ajustable por variable |
| Contenedor `ubuntu:24.04` sin Docker | Código 1: `Docker no instalado NO CUMPLE` | Reconoce Ubuntu 24.04 y detecta la falta de Docker |

Salidas completas:

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

Resultado: [PENDIENTE: cumple / no cumple en la VM, según la salida de arriba. Si RAM o disco salen `NO CUMPLE` por los 3,8 GiB y 29 GB, documentar la excepción con la mitigación de swap de §1.5].
