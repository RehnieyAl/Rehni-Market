# Implantación — evidencias por semana

Un archivo por semana del bootcamp `bc-implantacion` (semanas 1 a 7), cada uno con la plantilla
`3-proyecto/starter/entregable-s0N-*.md` de su semana, en el mismo orden y con los mismos títulos.
El documento consolidado es [`docs/plan-implantacion.md`](../plan-implantacion.md): resume cada
sección y enlaza aquí. Las semanas 8 y 9 están en el plan (§9 y §10) y en
[`docs/aceptacion/`](../aceptacion/).

| Semana | Tema | Entregable | Estado | Archivo |
|---|---|---|---|---|
| 1 | Plataforma tecnológica y hardware | Ficha técnica y matriz de requisitos (§1) + `scripts/verificar-requisitos.sh` | Parcial: 4 `[PENDIENTE]` | [`semana-01-ficha-tecnica.md`](semana-01-ficha-tecnica.md) |
| 2 | Plan de instalación, migración y respaldo | Plan de migración + respaldo v0 + instalación v0 (§2, §3, §5) + `scripts/respaldar.sh` | Parcial: 5 `[PENDIENTE]` | [`semana-02-migracion-respaldo-instalacion.md`](semana-02-migracion-respaldo-instalacion.md) |
| 3 | Hosting, dominio y transferencia | Estrategia de hosting y dominio (§4) + reverse proxy probado | Parcial: 2 `[PENDIENTE]` | [`semana-03-hosting-y-dominio.md`](semana-03-hosting-y-dominio.md) |
| 4 | Despliegue local y en la nube | Plan de instalación v1 (§5) + `deploy/` + `v1.0.0` + `CHANGELOG.md` | Parcial: 9 `[PENDIENTE]` | [`semana-04-procedimiento-despliegue.md`](semana-04-procedimiento-despliegue.md) |
| 5 | Configuración y pruebas en servidor | Configuración y verificación (§6) + migración ejecutada (§2.8) | Parcial: 9 `[PENDIENTE]` | [`semana-05-configuracion-y-verificacion.md`](semana-05-configuracion-y-verificacion.md) |
| 6 | Seguridad, usuarios y permisos | Usuarios, roles y secretos (§7) + respaldo final (§3) | Parcial: 23 `[PENDIENTE]` | [`semana-06-seguridad-y-respaldo.md`](semana-06-seguridad-y-respaldo.md) |
| 7 | CI/CD de despliegue y monitoreo | Pipeline y monitoreo (§8) | Parcial: 19 `[PENDIENTE]` | [`semana-07-pipeline-y-monitoreo.md`](semana-07-pipeline-y-monitoreo.md) |

Datos comunes a todas las semanas: versión **1.0.1** (releases
[v1.0.0](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.0) y
[v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1)); VM Ubuntu 24.04.5 de
Azure (Azure for Students) con el clon en `~/Rehni-Market`; `rehnimarket.duckdns.org` y
`apirehnimarket.duckdns.org` con Let's Encrypt; puertos abiertos 22 (solo el administrador), 80 y
443; redes `edge` y `data`; un solo `docker-compose.yml` y un solo `.env` (plantilla
[`deploy/env.prod.example`](../../deploy/env.prod.example)); RPO 24 h y RTO 4 h; `head` de Alembic
`d7e3f1a9c5b2`.

## Cumplimiento de la rúbrica de Producto

La rúbrica de cada semana pesa Conocimiento 30 %, Desempeño 40 % y Producto 30 %. Solo el Producto
se evalúa con el repositorio. Estimación del 18/11/2026, ítem por ítem, contra
`bootcamp/week-0N-*/rubrica-evaluacion.md` («Evidencia de Producto»):

| Sem | Ítem de la rúbrica (puntos) | ¿Cumple? | Puntos | Qué falta |
|---|---|:---:|---:|---|
| 1 | CE-1: SO justificado (versión, arquitectura, fin de soporte, licencia, requisitos enlazados), inventario con versión y licencia, plataforma física, RAID y ejecución (40) | Sí | 40 | — |
| 1 | CE-2: consumo medido, mínimos y recomendados con margen, script en un servidor Linux con salida (60) | Parcial | 45 | Salida del script en la VM (comando «a») |
| 2 | CE-3: origen, objetivo, estrategia, mapeo con rechazos, validaciones, rollback con responsable, riesgos (35) | Sí | 35 | — |
| 2 | CE-4: inventario, RPO/RTO, 3-2-1, retención, cifrado, restauración en 8 pasos, evidencia real, calendario (35) | Parcial | 32 | RPO/RTO sin aceptar por el cliente |
| 2 | CE-5: 10 secciones, pasos con acción, comando y resultado, prerrequisitos, cronograma con punto de no retorno (30) | Parcial | 24 | Tiempos del cronograma medidos en la VM |
| 3 | Hosting por componente con alternativa (25) | Sí | 25 | — |
| 3 | Dominio y DNS con TTL y responsable de renovación (20) | Parcial | 16 | Vigencia del subdominio de DuckDNS |
| 3 | Camino de la petición y puertos justificados (15) | Sí | 15 | — |
| 3 | Reverse proxy en el repositorio, probado localmente (25) | Sí | 25 | — |
| 3 | Transferencia con autenticación por llave (15) | Parcial | 12 | Usuario solo SFTP para respaldos |
| 4 | CE-1: servidor preparado con estructura, permisos y variables (20) | Sí | 18 | Permisos con `ls -l` en la VM (semana 6) |
| 4 | CE-1: nube con secretos fuera del repo y límites con fuente (20) | Parcial | 16 | Región y saldo de la suscripción |
| 4 | CE-5: liberación documentada y aplicada (15) | Sí | 15 | — |
| 4 | CE-5: instalación, actualización y rollback con comandos y resultado (25) | Parcial | 18 | Rollback ejecutado y cronometrado (comando «c») |
| 4 | CE-5: clasificación de migraciones (10) | Sí | 10 | — |
| 4 | CE-5: costos con recomendación (10) | Parcial | 7 | Alternativa 2 incompleta |
| 4 | Condición: humo en el servidor y en la nube, si no, máximo 60 | No | **60** (84 sin tope) | Humo en verde contra producción (comando «b») |
| 5 | CE-1: inventario por ambiente con secretos (15) | Sí | 15 | — |
| 5 | CE-1: servicios con dependencias, reinicio, healthcheck y rotación de logs (15) | Parcial | 10 | `logging:` en el compose |
| 5 | CE-1: falla rápida con mensaje claro (10) | Parcial | 4 | Validar variables obligatorias en `Config.py` |
| 5 | CE-1: humo ampliado, casos funcionales y lista posterior (15) | Parcial | 12 | Humo contra la VM y F-07 |
| 5 | CE-3: migración ejecutada, diferencias, huellas, ventana, humo y rollback (45; máximo 20 sin huellas) | Parcial | 8 | Ejecutar la migración en la VM |
| 6 | CE-1: usuarios del SO, permisos y `sudo` limitado (15) | Parcial | 8 | `id`, `ls -ld`, `sudo -l` en la VM; usuario de servicio |
| 6 | CE-1: SSH solo con llave, firewall y base no expuesta (15) | Parcial | 8 | `sshd -T`, NSG/UFW y `nc` desde fuera |
| 6 | CE-1: roles de BD con mínimo privilegio y pruebas negativas (15) | No | 3 | #44 |
| 6 | CE-1: inventario de secretos con ubicación, permisos y rotación (10) | Parcial | 8 | Escáner de secretos sobre el historial |
| 6 | CE-4: respaldo automático y cifrado, retención y verificación (15) | Parcial | 4 | cron y `age` en la VM |
| 6 | CE-4: 3-2-1 con copia fuera del sitio y contraseña fuera del servidor (10) | Parcial | 3 | Copias 2 y 3 |
| 6 | CE-4: procedimiento de restauración de desastre (10) | Sí | 10 | — |
| 6 | CE-4: restauración por otra persona con huellas y tiempo (10; máximo 20 de 45 sin ella) | No | 0 | Tercero (simulacro) |
| 7 | CE-1: secretos del pipeline en el ambiente `produccion` (10) | Parcial | 3 | Crear el ambiente |
| 7 | CE-1: `desplegar.sh` con un fallo detenido (15) | No | 3 | `desplegar.sh` |
| 7 | CE-1: monitoreo externo con salud, versión, latido y alertas (15) | No | 3 | Uptime Kuma y canal |
| 7 | CE-5: CI con prueba y regla en `main`, con un rechazo (15) | Sí | 15 | — |
| 7 | CE-5: liberación por etiqueta que construye, prueba, publica y despliega (20) | No | 5 | `release.yml` + GHCR |
| 7 | CE-5: verificación y rollback sin reconstruir, cronometrado (15) | Parcial | 3 | Comando «c» y `workflow_dispatch` |
| 7 | CE-5: procedimiento escrito con la regla de migraciones (10) | Sí | 9 | — |
| 7 | Condición: sin run de liberación en verde, CE-5 máximo 30/60 | No | **30** de CE-5 | `release.yml` |

| Semana | Producto (de 100) |
|---|---:|
| 1 | 85 |
| 2 | 91 |
| 3 | 93 |
| 4 | 60 (84 al registrar los comandos «b» y «c») |
| 5 | 49 |
| 6 | 44 |
| 7 | 39 |

## Histórico

[`historico/`](historico/): guía anterior de Oracle Cloud (no se usa: producción es Azure),
pendientes de las semanas 1-4 del 04/11/2026 y el inventario de los `.env` de antes de unificarlos.
