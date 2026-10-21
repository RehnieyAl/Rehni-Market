| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | V1.1 |
| Fecha | 21/10/2026 |

---


## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

Rehni-Market es una plataforma de comercio electrónico que permite a los usuarios consultar productos, gestionar un carrito y realizar pedidos, mientras que las empresas pueden publicar y administrar sus productos. Los administradores y el owner gestionan usuarios, empresas, permisos y diferentes aspectos administrativos.

**Arquitectura.** La solución sigue una arquitectura de **frontend web + API backend + servicios de infraestructura**, desplegada con Docker Compose (`docker-compose.yml`) en un único servidor. El navegador solo se comunica con Caddy (frontend) y con la API; la base de datos y el almacenamiento de archivos quedan dentro de la red interna de Docker.

| Servicio (contenedor) | Tecnología | Función | Puerto en el servidor |
|---|---|---|---|
| `rehni-frontend` | Caddy 2.11 + build de React 19 (Vite) | Sirve el frontend y actúa como proxy inverso con HTTPS | 8080 (HTTP) y 8443 (HTTPS) |
| `rehni-backend` | FastAPI sobre Python 3.13 y Uvicorn | API REST; al arrancar aplica las migraciones de Alembic | 8000 |
| `pgbouncer_pool` | PgBouncer | Pool de conexiones entre la API y PostgreSQL | No se publica |
| `rehni-postgres` | PostgreSQL 17 | Base de datos relacional | No se publica |
| `rehni-minio` | MinIO | Almacenamiento de imágenes y archivos (bucket `uploads`) | No se publica |

**Sistema operativo seleccionado.** CachyOS Linux x86_64 (*rolling release*, basada en Arch Linux) con Docker Engine y Docker Compose; detalle en la sección 1.3.

**Requisitos mínimos (resumen de la matriz 1.5).** 2 vCPU, 4 GB de RAM, 30 GB de disco SSD, red de 100 Mbps, arquitectura x86_64, Docker 24.0 o superior y los puertos 8080, 8443 y 8000 libres.

**Verificación.** El script `scripts/verificar-requisitos.sh` comprueba CPU, RAM, disco, arquitectura, sistema operativo, versión de Docker y puertos, y termina con código `0` en el servidor del proyecto (resultado en la sección 1.7).

## 1.2 Inventario de software

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| PostgreSQL | Base de datos relacional | 17 / `postgres:17-alpine` | PostgreSQL License | No |
| FastAPI | Framework para API REST | 0.135.1 | MIT | No |
| Uvicorn | Servidor ASGI | 0.41.0 | BSD-3-Clause | No |
| SQLAlchemy | ORM y acceso a PostgreSQL | Según `requirements.txt` | MIT | No |
| Alembic | Migraciones de base de datos | Según `requirements.txt` | MIT | No |
| Pydantic | Validación y esquemas de datos | Según `requirements.txt` | MIT | No |
| MinIO | Almacenamiento de objetos/archivos | Según Docker Compose | AGPLv3 | No |
| React | Biblioteca para frontend | 19 | MIT | No |
| TypeScript | Tipado estático del frontend | Según `package.json` | Apache-2.0 | No |
| Vite | Herramienta de desarrollo y compilación | 8 | MIT | No |
| Tailwind CSS | Framework de estilos | Según `package.json` | MIT | No |
| Node.js | Runtime para frontend | 22 | MIT | No |
| pnpm | Gestor de paquetes | 11.15.0 | MIT | No |
| Caddy | Servidor web del frontend | 1.27-alpine | BSD-2-Clause | No |
| Docker | Contenedorización | Según entorno instalado | Apache-2.0 | No |
| Docker Compose | Orquestación de servicios | Según entorno instalado | Apache-2.0 | No |

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | CachyOS Linux |
| Arquitectura | x86_64 |
| Fin de soporte estándar | No aplica bajo el esquema de soporte de Ubuntu LTS |
| Licencia | Software libre / componentes bajo sus respectivas licencias |
| Requisitos mínimos oficiales (enlace) | No se dispone en la información del proyecto de un enlace oficial de requisitos mínimos del servidor |

**Nota:** el entorno registrado del proyecto utiliza el kernel **7.1.4-1-cachyos**.

## 1.4 Medición de consumo

Esta sección requiere datos obtenidos directamente mediante `docker stats`. Como esos valores no están disponibles, no se inventan.

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| RehniMarket Backend | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| RehniMarket Frontend/Nginx | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| PostgreSQL | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| MinIO | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| Cloudflared / dns_tunel | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| **Total** | **Pendiente** | **Pendiente** | **Pendiente** |

**Carga simulada con:** pruebas funcionales y de aceptación del proyecto. Para completar técnicamente esta sección se debe ejecutar `docker stats` en reposo y durante una prueba de carga, por ejemplo utilizando k6.



## 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | 2 vCPU | 4 vCPU | Permite ejecutar simultáneamente backend, frontend/Nginx, PostgreSQL, MinIO y servicios auxiliares. |
| RAM | 4 GB | 8 GB | Permite ejecutar Docker Compose con los servicios principales y disponer de margen para PostgreSQL y MinIO. |
| Disco | 30 GB | 60 GB SSD | Contempla sistema, imágenes Docker, base de datos, archivos e imágenes almacenadas en MinIO. |
| Tipo de disco / IOPS | SSD | SSD NVMe | Mejora los tiempos de acceso de PostgreSQL, Docker y almacenamiento de archivos. |
| Red | 100 Mbps | 1 Gbps | Adecuado para transferencia de imágenes, comunicación entre servicios y acceso concurrente. |
| Arquitectura | x86_64 | x86_64 | Compatible con el entorno Linux y las imágenes Docker utilizadas. |
| Sistema operativo | Linux x86_64 | CachyOS Linux x86_64 | Es el entorno utilizado actualmente para el desarrollo y ejecución. |
| Docker / runtime | Docker + Docker Compose | Docker actualizado + Docker Compose | Permite ejecutar y administrar los servicios de manera reproducible. |
| Puertos | 8080, 8443 y 8000 libres | Igual | Son los que publica `docker-compose.yml`: 8080 (HTTP) y 8443 (HTTPS) del frontend (Caddy) y 8000 de la API. PostgreSQL, PgBouncer y MinIO no publican puertos: solo son accesibles dentro de la red de Docker. |


## 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Torre | Para una implementación pequeña o mediana resulta suficiente y facilita mantenimiento y ampliaciones. |
| Nivel RAID del servidor de base de datos | RAID 1 | Permite mantener una copia espejo y tolerar la falla de una unidad. |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores Docker | Es la plataforma utilizada por Rehni-Market y permite aislar los diferentes servicios. |

**Servidor donde se ejecutó:** entorno Linux CachyOS utilizado para ejecutar Rehni-Market mediante Docker Compose.

## 1.7 Verificación de requisitos

**Script:** `scripts/verificar-requisitos.sh` del repositorio del proyecto.

**Servidor donde se ejecutó:** entorno Linux CachyOS utilizado para ejecutar Rehni-Market mediante Docker Compose.

```text
REQUISITO          ESPERADO               ENCONTRADO             ESTADO
------------------------------------------------------------------------
Procesadores       >= 2                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 30 en /             66                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  cachyos >= rolling     cachyos rolling        CUMPLE
Docker             >= 24.0                29.6.2                 CUMPLE
Puerto 8080        libre                  libre                  CUMPLE
Puerto 8443        libre                  libre                  CUMPLE
Puerto 8000        libre                  libre                  CUMPLE
RESULTADO: el servidor cumple todos los requisitos mínimos.
```