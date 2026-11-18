# Plan de Implantación — RehniMarket

> Plantilla: `bc-implantacion/docs/plan-implantacion-template.md`. Documento consolidado para la
> semana 9 (gate): resume las secciones 1 a 8 y enlaza la evidencia completa de cada semana en
> [`docs/implantacion/`](implantacion/README.md) (un archivo por semana, con la plantilla del
> bootcamp); las secciones 9 y 10 están completas aquí. Si este resumen y un archivo de semana no
> coinciden, manda el archivo de semana. Solo datos sintéticos: ninguna IP, contraseña ni token real.

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Versión del plan | 1.1 |
| Versión del software | 1.0.1 ([`CHANGELOG.md`](../CHANGELOG.md); releases [v1.0.0](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.0) y [v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1)) |
| Fecha | 2026-11-18 |
| Alcance funcional | SRS: 31 RF y 28 RNF ([`docs/requisitos/requisitos.md`](requisitos/requisitos.md)); avance y deuda: [`docs/backlog-final.md`](backlog-final.md) |
| Servidor de producción | VM Ubuntu Server 24.04.5 LTS en Microsoft Azure (Azure for Students; 2 vCPU, 3,8 GiB, 29 GB), clon en `~/Rehni-Market`, con un solo `docker-compose.yml` y `.env` de `deploy/env.prod.example` |
| URL | <https://rehnimarket.duckdns.org> (web) y <https://apirehnimarket.duckdns.org> (API) |
| Guía operativa | [`deploy/README.md`](../deploy/README.md) y [`deploy/checklist-azure.md`](../deploy/checklist-azure.md) |

## Evidencias por semana

| Semana | Sección del plan | Archivo |
|---|---|---|
| 1 | §1 | [`semana-01-ficha-tecnica.md`](implantacion/semana-01-ficha-tecnica.md) |
| 2 | §2, §3 (v0), §5 (v0) | [`semana-02-migracion-respaldo-instalacion.md`](implantacion/semana-02-migracion-respaldo-instalacion.md) |
| 3 | §4 | [`semana-03-hosting-y-dominio.md`](implantacion/semana-03-hosting-y-dominio.md) |
| 4 | §5 (v1) | [`semana-04-procedimiento-despliegue.md`](implantacion/semana-04-procedimiento-despliegue.md) |
| 5 | §6 y §2.8 | [`semana-05-configuracion-y-verificacion.md`](implantacion/semana-05-configuracion-y-verificacion.md) |
| 6 | §7 y §3 (final) | [`semana-06-seguridad-y-respaldo.md`](implantacion/semana-06-seguridad-y-respaldo.md) |
| 7 | §8 | [`semana-07-pipeline-y-monitoreo.md`](implantacion/semana-07-pipeline-y-monitoreo.md) |

Estado y pendientes de cada una: [`docs/implantacion/README.md`](implantacion/README.md).

---

## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

Frontend React servido por Caddy + API FastAPI + PgBouncer + PostgreSQL 17 + MinIO, en un solo
`docker-compose.yml`. SO: Ubuntu Server 24.04 LTS (soporte estándar hasta mayo de 2029). Matriz
medida con k6 (50 usuarios concurrentes): **mínimo 2 vCPU, 4 GB de RAM, 30 GB SSD**; recomendado 6
vCPU, 8 GB y 60 GB. La VM de producción tiene 2 vCPU, 3,8 GiB y 29 GB, con 2 GiB de swap para
compilar. Verificación con `scripts/verificar-requisitos.sh`.
Detalle: [semana 1](implantacion/semana-01-ficha-tecnica.md).

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

Migración big bang de clientes del sistema anterior (`legacy-data/clientes_legado.csv`) a `users`,
con staging, 9 reglas de rechazo, 11 controles (`scripts/migracion/validar.sql`) y rollback
selectivo por ejecución. Ensayo sobre una copia (04/11/2026): `origen=100 migrados=73
rechazados=27`, checksum igual, 12,2 s. Plan: [semana 2](implantacion/semana-02-migracion-respaldo-instalacion.md);
ejecución en la VM (§2.8): [semana 5](implantacion/semana-05-configuracion-y-verificacion.md#28-evidencia-de-migración-ejecutada-se-agrega-a-la-sección-2), pendiente.

## 3. Plan de respaldo — Semanas 2 y 6 (CE-4)

`scripts/respaldar.sh`: `pg_dump` de la base + copia del bucket de MinIO, con `.sha256`, retención de
7. **RPO 24 h, RTO 4 h.** Restauración real medida el 04/11/2026 (1,0 s la base, 12,8 s la
verificación completa, conteos iguales). Versión final con cron, cifrado `age`, regla 3-2-1 y
restauración de desastre: [semana 6](implantacion/semana-06-seguridad-y-respaldo.md#3-plan-de-respaldo-final-reemplaza-la-versión-de-la-semana-2);
v0 y evidencia: [semana 2](implantacion/semana-02-migracion-respaldo-instalacion.md). Runbook:
[`docs/runbooks/restaurar-respaldo.md`](runbooks/restaurar-respaldo.md).

## 4. Hosting y dominio — Semana 3 (CE-1)

IaaS: VM de Azure con los cinco servicios en contenedores. DNS en DuckDNS: `rehnimarket.duckdns.org`
y `apirehnimarket.duckdns.org`, registros A con TTL 60. Caddy es el único punto de entrada y obtiene
los certificados de Let's Encrypt (vigentes hasta el 15/02/2027). Abiertos a Internet: 22 (solo IP
del administrador), 80 y 443. Detalle: [semana 3](implantacion/semana-03-hosting-y-dominio.md).

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

Liberación por etiqueta SemVer + `CHANGELOG.md` + release (v1.0.0 y v1.0.1). Instalación en la VM en
15 pasos, actualización con respaldo previo y revisión de migraciones, y rollback con
`git checkout <anterior>` (con restauración si la migración no es compatible). 17 migraciones
clasificadas; `head` = `d7e3f1a9c5b2`; entre v1.0.0 y v1.0.1 no hay migraciones. Nube = Azure IaaS
(no Render/Neon, por el compose único). Costo de referencia: 38,82 USD/mes.
v1: [semana 4](implantacion/semana-04-procedimiento-despliegue.md); v0 (10 secciones y cronograma):
[semana 2](implantacion/semana-02-migracion-respaldo-instalacion.md#5-plan-de-instalación-v0).

## 6. Configuración y verificación — Semana 5 (CE-1)

Inventario de configuración por ambiente (un solo `.env`, 600), servicios con dependencias,
healthcheck y política de reinicio, `GET /health/database` (503 si cae la base), prueba de humo de
7 verificaciones, casos funcionales y lista posterior al despliegue. Detalle:
[semana 5](implantacion/semana-05-configuracion-y-verificacion.md).

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1)

SSH solo con llave y sin `root`, NSG con 22/80/443, redes `edge` y `data` (41 verificaciones en
producción, 0 fallan), inventario de secretos con rotación, único owner garantizado por la base.
Brecha: la app usa el rol dueño de la base (#44). Detalle:
[semana 6](implantacion/semana-06-seguridad-y-respaldo.md).

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

CI (`ci.yml`: `backend`, `frontend`, `auditoria`) en cada push y PR, ruleset activo en `main` y
`develop`, PR #67 rechazado por el CI. Despliegue manual en la VM; faltan `release.yml` con GHCR,
`desplegar.sh`, ambiente `produccion` y monitoreo externo. Detalle:
[semana 7](implantacion/semana-07-pipeline-y-monitoreo.md).

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

Plantilla: `bc-implantacion/bootcamp/week-08-mantenimiento_soporte_y_capacitacion/3-proyecto/starter/entregable-s08-mantenimiento-soporte-y-capacitacion.md`.

### 9.1 Plan de mantenimiento

#### Calendario

| Tarea | Tipo | Frecuencia | Automática / manual | Responsable (rol) | ¿Requiere ventana? |
|---|---|---|---|---|:---:|
| Parches de seguridad del SO | Preventivo | Diaria | Automática (`unattended-upgrades`) [PENDIENTE: activar en la VM] | Administrador de la VM | No |
| Reinicio por parches del kernel | Preventivo | Mensual | Manual | Administrador de la VM | Sí |
| Respaldo | Preventivo | Diaria 02:00 UTC | Automática (cron, [semana 6](implantacion/semana-06-seguridad-y-respaldo.md), §3.2) | Administrador de la VM | No |
| Restauración de prueba (`--verify-only`) | Preventivo | Mensual y tras cada migración | Manual | Responsable técnico | No |
| Auditoría de dependencias (`pnpm audit`, `pip-audit`) | Preventivo | Mensual | Manual | Responsable técnico | No |
| Revisión de SonarCloud e incidencias abiertas | Correctivo | Semanal | Manual | Responsable técnico | No |
| Renovación de certificados TLS | Preventivo | Automática (Caddy) | Automática | — | No |

Ventana de mantenimiento propuesta: domingos de 02:00 a 04:00 (hora de Colombia), aviso a los
usuarios con 48 h de anticipación mediante un anuncio del Home. [PENDIENTE: acordar con el cliente]

#### Fin de soporte

Fuente: API de <https://endoflife.date>, consultada el 2026-11-16.

| Componente | Versión | Fin de soporte | Acción planeada |
|---|---|---|---|
| Ubuntu Server | 24.04 LTS | 2029-05-31 (soporte estándar) | Migrar a 26.04 LTS antes de esa fecha |
| PostgreSQL | 17 | 2029-11-08 | Actualizar a una versión mayor con `pg_dump`/`pg_restore` (sección 2) |
| Python | 3.13 | 2029-10-31 (solo seguridad desde 2026-10-01) | Evaluar 3.14 en 2027 |
| Node.js (solo build) | 22 | 2027-04-30 | Pasar a Node 24 LTS antes de abril de 2027 |

#### Política de actualizaciones

| Tipo | Plazo | Cómo se decide |
|---|---|---|
| Parche de seguridad de una dependencia en la imagen desplegada | 7 días | CI en verde → PR → versión PATCH |
| Parche de seguridad solo de build/desarrollo | 30 días | Igual, agrupado |
| Versión menor/mayor de framework | Por trimestre | Rama propia, CI y prueba de humo |

`.github/dependabot.yml` (v1.0.1, #45): semanal para uv, npm (frontend y móvil) y github-actions, agrupado; el job `auditoria` del CI falla con vulnerabilidades conocidas (excepciones con fecha en `.github/auditoria-excepciones.txt`). Informe completo: [`docs/calidad/auditoria-dependencias-2026-11-16.md`](calidad/auditoria-dependencias-2026-11-16.md).

Resultado de la auditoría (2026-11-16):

| Herramienta | Hallazgo | Severidad | ¿En la imagen desplegada? | Decisión |
|---|---|---|:---:|---|
| `pnpm audit --prod` | 17 avisos: `vite`, `postcss`, `source-map-js`, `brace-expansion`, `nanoid`, `follow-redirects` | 11 altos, 5 moderados, 1 bajo | No: ninguno llega al bundle (comprobado en `dist/assets`; solo compilación) | **Corregido en v1.0.1**: 0 en `--prod` |
| `pip-audit` (dependencias de producción del backend) | 11 avisos: `certifi`, `dnspython`, `ecdsa`, `pyasn1`, `python-jose` | 2 críticas, 9 altas | Sí (imagen del backend) | **Corregido en v1.0.1**: python-jose reemplazado por PyJWT, `certifi`, `dnspython` y `pyasn1` corregidos; 0 avisos |

### 9.2 Soporte

Equipo de una persona: N1 a N3 los atiende el responsable técnico.

| Nivel | Quién (rol) | Resuelve | Horario |
|---|---|---|---|
| N0 | Ayudas en línea (Manual de usuario y preguntas frecuentes) | Dudas de uso | Siempre |
| N1 | Responsable técnico | Cuentas, contraseñas, datos mal ingresados | Lunes a viernes, 08:00–17:00 |
| N2 | Responsable técnico | Fallos de servicio, respaldos, despliegues | Igual |
| N3 | Responsable técnico | Defectos de código y migraciones | Igual |

Canal único de reporte: [PENDIENTE: correo de soporte; en `docs/Manuales/scripts/datos_comunes.py` figura como `[VERIFICAR]`].

| Prioridad | Primera respuesta | Solución o alternativa |
|---|---|---|
| P1 (servicio caído o dinero mal cobrado) | 4 h hábiles | 1 día hábil |
| P2 (función principal degradada) | 1 día hábil | 3 días hábiles |
| P3 (función secundaria) | 2 días hábiles | 10 días hábiles |
| P4 (consulta o cosmético) | 3 días hábiles | Próxima versión |

Estos tiempos son una propuesta para el acta (sección 10.4).

#### Runbooks

| Runbook | Alerta o síntoma | Probado por (rol, otro equipo) | Correcciones tras la prueba |
|---|---|---|---|
| `docs/runbooks/salud-en-rojo.md` | Contenedor `unhealthy` o `/health/database` ≠ 200 | [PENDIENTE] | |
| `docs/runbooks/restaurar-respaldo.md` | Pérdida o corrupción de datos | Sección 3.5 (responsable técnico); [PENDIENTE: tercero en el simulacro] | |

### 9.3 Capacitación

| Público | Objetivos observables | Sesión (duración, modalidad) | Materiales | Cómo se evalúa |
|---|---|---|---|---|
| Compradores | Registrarse, verificar el correo y comprar un producto con RehniCoin sin ayuda en menos de 5 min | 30 min, virtual | Manual de usuario (cap. comprador), cuenta de prueba con saldo | Tarea de verificación + encuesta |
| Empresas | Publicar un producto con dos variantes y despachar un pedido con guía en menos de 10 min | 45 min, virtual | Manual de usuario (cap. empresa) | Tarea de verificación |
| Administración (N1) | Verificar una empresa, recargar RehniCoin y generar una liquidación | 45 min, presencial | Manual de usuario (cap. admin) | Tarea de verificación |
| Operación (N2) | Ejecutar la prueba de humo, un respaldo y `--verify-only` | 60 min, presencial | Este plan (secciones 3, 5 y 6), runbooks | Ejecución observada |

Cronograma:

| Fecha | Público | Responsable (rol) | Participantes esperados |
|---|---|---|---|
| [PENDIENTE] | Sesión simulada (compradores + empresas) | Responsable técnico | [PENDIENTE: cliente simulado] |

Registro de la sesión simulada: `docs/aceptacion/sesion-capacitacion.md`.

### 9.4 Ayudas en línea

| Ayuda | Enlace | Versión del software | Probada por (rol) |
|---|---|---|---|
| Guía rápida (Manual de usuario) | `docs/Manuales/Manual de usuario.pdf` | 1.0.0 | [PENDIENTE] |
| Preguntas frecuentes | Capítulo de preguntas frecuentes del Manual de usuario | 1.0.0 | [PENDIENTE] |
| Documentación de la API | `https://api.<dominio>/docs` (con `DOCS_ENABLED=true`) | 1.0.0 | — |

Dónde se enlazan: `README.md` (sección de documentación). [PENDIENTE: enlace desde la aplicación]

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

Plantilla: `bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/3-proyecto/starter/entregable-s09-aceptacion-y-entrega.md`.

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Versión del plan | 1.1 |
| Versión del software | 1.0.1 |
| Fecha | 2026-11-18 |

### 10.1 Consolidación

| Sección | Completa según la lista (teoría 04) | Observaciones |
|---|:---:|---|
| 1. Ficha técnica | Parcial | Falta la salida de `verificar-requisitos.sh` en la VM ([semana 1](implantacion/semana-01-ficha-tecnica.md)) |
| 2. Migración | Parcial | Plan y ensayo completos ([semana 2](implantacion/semana-02-migracion-respaldo-instalacion.md)); falta la ejecución en la VM con huellas ([semana 5](implantacion/semana-05-configuracion-y-verificacion.md), §2.8) |
| 3. Respaldo | Parcial | Restauración probada por el responsable; faltan cron, cifrado, copias 2 y 3 y la restauración por un tercero ([semana 6](implantacion/semana-06-seguridad-y-respaldo.md)) |
| 4. Hosting y dominio | Sí | Azure + DuckDNS + Let's Encrypt con evidencia del 18/11/2026; falta la vigencia de DuckDNS ([semana 3](implantacion/semana-03-hosting-y-dominio.md)) |
| 5. Instalación | Parcial | v1.0.0 y v1.0.1 liberadas y desplegadas; faltan humo en verde y rollback cronometrado en la VM ([semana 4](implantacion/semana-04-procedimiento-despliegue.md)) |
| 6. Configuración | Parcial | Faltan falla rápida en variables obligatorias, rotación de logs y humo contra la VM ([semana 5](implantacion/semana-05-configuracion-y-verificacion.md)) |
| 7. Seguridad | Parcial | Faltan salidas de `sshd`/NSG, prueba desde fuera, separar roles de BD (#44) y escáner de secretos ([semana 6](implantacion/semana-06-seguridad-y-respaldo.md)) |
| 8. Pipeline y monitoreo | Parcial | CI y ruleset con rechazo real; faltan `release.yml`, `desplegar.sh`, ambiente `produccion` y monitoreo externo ([semana 7](implantacion/semana-07-pipeline-y-monitoreo.md)) |
| 9. Mantenimiento, soporte, capacitación | Sí | Sesión de capacitación sin ejecutar |

Registro de cambios del plan:

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-11-16 | Consolidación de las secciones 1-5 (carpeta de las semanas 1-4, hoy en [`implantacion/historico/`](implantacion/historico/)) y nuevas secciones 6-10 |
| 1.1 | 2026-11-18 | Una evidencia por semana en `docs/implantacion/` (semanas 1 a 7, con la plantilla de cada una); este plan resume y enlaza. Corregido: Azure en lugar de Oracle, etiquetas v1.0.0 y v1.0.1 publicadas, clon en `~/Rehni-Market`, DuckDNS con TTL 60, 17 migraciones, ruleset activo |
| 1.2 | [PENDIENTE: fecha del simulacro] | Correcciones del simulacro |

### 10.2 Pruebas de aceptación

| Campo | Valor |
|---|---|
| Casos ejecutados / total | [PENDIENTE] / 9 |
| Criterios de salida acordados | Ver `docs/aceptacion/pruebas-de-aceptacion.md` §3 ([PENDIENTE: firma del cliente simulado]) |
| Defectos (bloqueantes / mayores / menores / cosméticos) | [PENDIENTE] |
| Decisión | [PENDIENTE] |

Detalle de casos y resultados: [`docs/aceptacion/pruebas-de-aceptacion.md`](aceptacion/pruebas-de-aceptacion.md).

### 10.3 Simulacro cruzado

| Campo | Valor |
|---|---|
| Equipo que instaló | [PENDIENTE: tercero (compañero o instructor)] |
| Duración / tiempo máximo | [PENDIENTE] / 90 min |
| Huellas | [PENDIENTE] |
| Prueba de humo | [PENDIENTE] |
| Resultado | [PENDIENTE] |
| Desviaciones y corrección aplicada | [PENDIENTE] |

Registro firmado por el observador: [`docs/aceptacion/registro-del-simulacro.md`](aceptacion/registro-del-simulacro.md).
Paquete para quien instala: [`docs/aceptacion/guion-del-simulacro.md`](aceptacion/guion-del-simulacro.md).

### 10.4 Acta de entrega

Enlace: [`docs/aceptacion/acta-de-entrega.md`](aceptacion/acta-de-entrega.md) (sin firmas reales ni secretos).

### 10.5 Socialización y lecciones aprendidas

Guion de 10 minutos: [`docs/aceptacion/socializacion.md`](aceptacion/socializacion.md).

| Qué funcionó | Qué no funcionó | Qué haríamos distinto |
|---|---|---|
| Compose único: lo que se prueba en local es lo que corre en el servidor | Se quitó el CI de pruebas (2026-11-05) y estuvo 11 días sin correr | Proteger `main` con checks obligatorios desde el primer día |
| Restauración medida con huellas y conteos (3.5) | El despliegue fuera de local quedó para el final | Desplegar en la semana 4, aunque sea en una VM gratuita |
| Hallazgos de pruebas registrados con su test (`REGISTRO.md`) | Un solo rol de BD para app y migraciones | Separar roles al crear la base |
| [PENDIENTE: lo que salga del simulacro] | | |

Retroalimentación recibida en la socialización y qué se hizo con ella: [PENDIENTE].
