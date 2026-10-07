# 📘 Plan de Implantación — [Nombre del proyecto]

<!-- 📝 Instrucción: cada equipo copia esta plantilla al repositorio de su proyecto real
(`docs/plan-implantacion.md`) y completa una sección por semana. En la semana 9 el documento
debe permitir que otro equipo instale el proyecto desde cero sin ayuda. Solo datos sintéticos:
nada de IPs, usuarios ni contraseñas reales. Modelo completo: el plan de la app de referencia,
referencia/docs/plan-implantacion.md. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | Yeinher Algarin |
| Versión del plan | V1.0 |
| Fecha | 07/10/2026 |

---

## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

Rehni-Market es una plataforma de comercio electrónico que permite a los usuarios consultar productos, gestionar un carrito y realizar pedidos, mientras que las empresas pueden publicar y administrar sus productos. Los administradores y el owner gestionan usuarios, empresas, permisos y diferentes aspectos administrativos. La solución utiliza una arquitectura basada en **frontend web + API backend + servicios de infraestructura**, desplegada mediante Docker Compose. El backend está desarrollado con FastAPI y utiliza PostgreSQL para persistencia y MinIO para almacenamiento de archivos.

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
| Nginx | Servidor web del frontend | 1.27-alpine | BSD-2-Clause | No |
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
| Puertos | 8000, 8080, 5434, 9000 | Según configuración de Docker Compose | Se utilizan para backend, frontend, PostgreSQL y MinIO según el entorno configurado. |


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
Procesadores       >= 1                   12                     CUMPLE
RAM (MB)           >= 4096                7150                   CUMPLE
Disco libre (GB)   >= 10 en /             67                     CUMPLE
Arquitectura       x86_64 aarch64         x86_64                 CUMPLE
Sistema operativo  cachyos >= 13          cachyos 0              NO CUMPLE
Docker             >= 24.0                29.6.2                 CUMPLE
Puerto 8080        libre                  libre                  CUMPLE
Puerto 8000        libre                  libre                  CUMPLE
Puerto 9000        libre                  libre                  CUMPLE
Puerto 5432        libre                  libre                  CUMPLE

RESULTADO: 1 requisito(s) no se cumplen.
```

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

<!-- 📝 Objetivos, origen/destino, mapeo, etapas, riesgos, validación (conteos, checksums),
rollback. En la semana 5 se agrega la evidencia de la migración ejecutada. -->

## 3. Plan de respaldo — Semanas 2 y 6 (CE-4)

<!-- 📝 Qué se respalda, frecuencia, RPO/RTO, regla 3-2-1, herramienta, cifrado, retención,
procedimiento de restauración probado. -->

## 4. Hosting y dominio — Semana 3 (CE-1)

<!-- 📝 Tipo de hosting elegido y justificación, dominio, registros DNS, reverse proxy, HTTPS,
método de transferencia de archivos. -->

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

<!-- 📝 Prerrequisitos, pasos numerados y verificables para instalar en servidor local y en la
nube, versión liberada, costos estimados. Semana 10 (opcional): subsección 5.10 con la
instalación automatizada (cloud-init + Ansible). -->

## 6. Configuración y verificación — Semana 5 (CE-1)

<!-- 📝 Variables de entorno por ambiente (sin valores reales), servicios, healthchecks,
smoke tests. -->

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1)

<!-- 📝 Matriz de usuarios/roles (sistema operativo y base de datos), políticas de acceso,
firewall, manejo de secretos, resultados de pruebas de privilegios. -->

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

<!-- 📝 Diagrama del pipeline, procedimiento de rollback, monitores configurados. -->

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

<!-- 📝 Plan de mantenimiento, niveles de soporte, plan de capacitación, enlaces a ayudas en
línea. -->

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

<!-- 📝 Resultado de pruebas de aceptación, resultado del simulacro cruzado, acta de entrega
con niveles de servicio acordados. -->
