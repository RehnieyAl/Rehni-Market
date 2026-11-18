# Entregable S01 — Ficha Técnica y Matriz de Requisitos

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket (Bootcamp de Implantación del SENA, semana 1) |
| Equipo | 1 persona: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Fecha | 2026-11-18 |

---

## 1.1 Descripción técnica

Plataforma de comercio electrónico: los compradores consultan productos, usan el carrito y pagan
pedidos con saldo interno (RehniCoin); las empresas publican y administran su catálogo; los
administradores y un único owner gestionan usuarios, empresas y permisos
([`docs/requisitos/requisitos.md`](../requisitos/requisitos.md): 31 RF y 28 RNF). Arquitectura API
+ SPA: frontend React servido por Caddy, que también es reverse proxy de la API FastAPI; PgBouncer,
PostgreSQL y MinIO en una red interna; cinco servicios en un solo
[`docker-compose.yml`](../../docker-compose.yml) para todos los ambientes.

## 1.2 Inventario de software

Versiones del plan de implantación v1.0, §1.2 (contenedores en marcha, `uv.lock` y
`pnpm-lock.yaml`, 04/11/2026), actualizadas con [`CHANGELOG.md`](../../CHANGELOG.md) (v1.0.1) y
[`deploy/README.md`](../../deploy/README.md) §3 (VM, 16/11/2026).

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| Ubuntu Server | Sistema operativo del servidor | 24.04.5 LTS | Obra agregada, cada paquete con su licencia; descarga y actualizaciones gratuitas (<https://canonical.com/legal/intellectual-property-policy>) | No |
| PostgreSQL | Base de datos | 17.10 (`postgres:17-alpine`) | PostgreSQL License | No |
| PgBouncer | Pool de conexiones | 1.26.0 (`edoburu/pgbouncer:latest`) | ISC | No |
| MinIO | Almacenamiento de imágenes y certificados | RELEASE.2026-10-23T20-06-51Z (`cgr.dev/chainguard/minio`, fijada por digest) | AGPLv3 | No |
| Caddy | Servidor web, reverse proxy y TLS | v2.11.7 (`caddy:2.11-alpine`) | Apache-2.0 | No |
| Python | Runtime del backend | 3.13.14 (`python:3.13-slim`) | PSF License v2 | No |
| uv | Dependencias del backend | 0.11.29 | MIT o Apache-2.0 | No |
| FastAPI + Uvicorn | Servidor de aplicaciones | 0.135.1 / 0.41.0 | MIT / BSD-3-Clause | No |
| SQLAlchemy / Alembic / Pydantic | ORM, migraciones y validación | 2.0.48 / 1.18.4 / 2.12.5 | MIT | No |
| PyJWT | Tokens de sesión | 2.15.1 | MIT | No |
| React / TypeScript / Vite / Tailwind CSS | Frontend | 19.2.7 / 6.0.3 / 8.1.6 / 4.3.2 | MIT / Apache-2.0 / MIT / MIT | No |
| Node.js / pnpm | Compilación del frontend | 22.23.1 / 11.15.0 | MIT / MIT | No |
| Docker Engine / Docker Compose | Contenedores | 29.9.3 / 5.7.1 (VM) | Apache-2.0 | No |

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server 24.04 LTS; 24.04.5 instalada en la VM de Azure ([`deploy/README.md`](../../deploy/README.md) §3) |
| Arquitectura | amd64 (x86_64) |
| Fin de soporte estándar | Mayo de 2029 (<https://ubuntu.com/about/release-cycle>, consultada el 04/11/2026) |
| Licencia | Sin costo (<https://canonical.com/legal/intellectual-property-policy>) |
| Requisitos mínimos oficiales (enlace) | <https://ubuntu.com/server/docs/reference/installation/system-requirements/>: RAM 1,5 GB (ISO) / 1 GB (cloud), sugerida 3 GB o más; disco 5 GB / 4 GB, sugerido 25 GB o más |

## 1.4 Medición de consumo

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---|---|---|
| `rehni-backend` (3 workers) | 341,3 MiB | 354,8 MiB | 193,2 % |
| `rehni-frontend` (Caddy) | 22,6 MiB | 47,2 MiB | 5,1 % |
| `pgbouncer_pool` | 17,2 MiB | 16,4 MiB | 9,5 % |
| `rehni-postgres` | 49,8 MiB | 86,3 MiB | 144,1 % |
| `rehni-minio` | 92,1 MiB | 143,4 MiB | 7,2 % |
| **Total** | **523,0 MiB** | **646,2 MiB** (máximo simultáneo) | **344,5 %** (máximo simultáneo) |

Carga simulada con: k6, 50 usuarios virtuales concurrentes (5 min de subida, 2 min sostenidos, 30 s de bajada) con `GET` a catálogo, búsqueda, detalle, ofertas y novedades (`git show 45ea99d:scripts/load_test.k6.js`), 04/11/2026 en el equipo de desarrollo (CachyOS x86_64, 12 procesadores, 7150 MB); 42 940 peticiones, 0 % de fallos, p95 = 75,91 ms. RAM = `memory.current + memory.swap.current` del cgroup de cada contenedor, porque el equipo usa swap. Plan de implantación v1.0, §1.4. [PENDIENTE: concurrencia esperada en hora pico, dato que da el cliente, para repetir con `tests/load/04-sustained.js`]

## 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 vCPU | 6 vCPU | Pico medido 3,45 procesadores × 1,5 = 5,2 → 6 |
| RAM | 4 GB | 8 GB | Pico medido 646,2 MiB × 1,5 = 0,95 GB + 3 GB sugeridos para el SO = 3,95 → 4 GB. Límites del compose: 2,25 GiB + 3 GB = 5,25 → 8 GB |
| Disco | 30 GB | 60 GB SSD | Medido: imágenes 1,25 GB + volúmenes 0,71 GB + respaldos 0,28 GB = 2,24 GB × 1,5 = 3,4 GB + 25 GB del SO = 28,4 → 30 GB |
| Tipo de disco / IOPS | SSD | SSD NVMe | Plan de implantación v1.0, §1.5 |
| Red | 100 Mbps | 1 Gbps | Medido con k6: 187 MB en 7,5 min = 3,3 Mbit/s con 50 usuarios, sin imágenes |
| Arquitectura | x86_64 | x86_64 | Imágenes construidas y medidas en x86_64 |
| Sistema operativo | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS | §1.3 |
| Docker / runtime | Docker 24.0 + Compose ≥ 2.24 | Docker Engine del repositorio oficial | `MIN_DOCKER_VERSION` de `scripts/verificar-requisitos.sh`; Compose ≥ 2.24 en [`deploy/README.md`](../../deploy/README.md) §3 |
| Puertos | 80 y 443 libres | 80 y 443 libres | Los publica Caddy en `docker-compose.yml`; la API (8000) y PostgreSQL (5433) solo en `127.0.0.1` |

Crecimiento estimado de datos: [PENDIENTE: registros por mes esperados (pedidos, productos, imágenes), dato que da el cliente; tamaño actual medido: base de 16 MB y MinIO de 23,09 MB con 865 productos y 4100 variantes de desarrollo]

## 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre | Un solo servidor para una implantación pequeña o mediana (plan de implantación v1.0, §1.6) |
| Nivel RAID del servidor de base de datos | RAID 1 | Espejo de dos discos: tolera la falla de uno (plan de implantación v1.0, §1.6) |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores Docker sobre una VM | Es como corre en producción: VM de Azure con los cinco servicios de `docker-compose.yml` |

## 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh` del repositorio del proyecto.

Servidor donde se ejecutó: VM Ubuntu 24.04 de Azure (producción), con `PORTS="80 443"`.

```
[PENDIENTE: salida de docs/evidencias/verificar-requisitos-azure-<fecha>.txt (comando «a» en la VM)]
```

Resultado: [PENDIENTE: cumple / no cumple según la salida de la VM. La VM tiene 3,8 GiB de RAM y 29 GB de disco (deploy/README.md §3), por debajo de los umbrales de 4096 MB y 30 GB]
