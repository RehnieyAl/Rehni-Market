# Plan de Implantación — RehniMarket

> Las semanas 1 a 7 están en un entregable por semana en
> [`docs/implantacion/`](implantacion/README.md); aquí quedan el índice y las secciones 9 y 10.
> Solo datos sintéticos: ninguna IP, usuario ni contraseña real.

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona: Yeinher Jose Algarin Cardozo, aprendiz ADSO, ficha 3171618 |
| Versión del plan | 1.1 |
| Versión del software | 1.0.1 ([`CHANGELOG.md`](../CHANGELOG.md); releases [v1.0.0](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.0) y [v1.0.1](https://github.com/RehnieyAl/Rehni-Market/releases/tag/v1.0.1)) |
| Fecha | 2026-11-18 |
| Alcance funcional | SRS: 31 RF y 28 RNF ([`docs/requisitos/requisitos.md`](requisitos/requisitos.md)); avance y deuda: [`docs/backlog-final.md`](backlog-final.md) |
| Servidor de producción | VM Ubuntu Server 24.04.5 LTS en Microsoft Azure (Azure for Students), proyecto en `~/Rehni-Market` |

## Índice de entregables (semanas 1 a 7)

| Semana | Sección del plan | Entregable |
|---|---|---|
| 1 | 1. Ficha técnica y requisitos mínimos | [`entregable-s01-ficha-tecnica.md`](implantacion/entregable-s01-ficha-tecnica.md) |
| 2 | 2. Migración, 3. Respaldo (v0) y 5. Instalación (v0) | [`entregable-s02-planes.md`](implantacion/entregable-s02-planes.md) |
| 3 | 4. Hosting y dominio | [`entregable-s03-hosting-y-dominio.md`](implantacion/entregable-s03-hosting-y-dominio.md) |
| 4 | 5. Instalación y despliegue (v1) | [`entregable-s04-procedimiento-despliegue.md`](implantacion/entregable-s04-procedimiento-despliegue.md) |
| 5 | 6. Configuración y verificación, y 2.8 Migración ejecutada | [`entregable-s05-configuracion-y-verificacion.md`](implantacion/entregable-s05-configuracion-y-verificacion.md) |
| 6 | 7. Seguridad, usuarios y permisos, y 3. Respaldo (final) | [`entregable-s06-seguridad-y-respaldo.md`](implantacion/entregable-s06-seguridad-y-respaldo.md) |
| 7 | 8. Pipeline de despliegue y monitoreo | [`entregable-s07-pipeline-y-monitoreo.md`](implantacion/entregable-s07-pipeline-y-monitoreo.md) |

---

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

### 9.1 Plan de mantenimiento

#### Calendario

| Tarea | Tipo | Frecuencia | Automática / manual | Responsable (rol) | ¿Requiere ventana? |
|---|---|---|---|---|:---:|
| Parches de seguridad del SO | Preventivo | Diaria | Automática (`unattended-upgrades`) [PENDIENTE: activar en la VM] | Administrador de la VM | No |
| Reinicio por parches del kernel | Preventivo | Mensual | Manual | Administrador de la VM | Sí |
| Respaldo | Preventivo | Diaria 02:00 UTC | Automática (cron, sección 7) | Administrador de la VM | No |
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

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo | 1 persona (responsable técnico) |
| Versión del plan | 1.0 |
| Versión del software | 1.0.0 |
| Fecha | 2026-11-16 |

### 10.1 Consolidación

| Sección | Completa según la lista (teoría 04) | Observaciones |
|---|:---:|---|
| 1. Ficha técnica | Parcial | Falta la salida de `verificar-requisitos.sh` en la VM |
| 2. Migración | Sí | Ensayo sobre copia (2.9); falta la ejecución en producción |
| 3. Respaldo | Parcial | Restauración probada (3.5); faltan cron, cifrado y copias 2 y 3 |
| 4. Hosting y dominio | Parcial | Falta proveedor confirmado y dominio |
| 5. Instalación | Parcial | Pasos completos; falta evidencia en la VM |
| 6. Configuración | Sí | Falta prueba de humo contra la VM |
| 7. Seguridad | Parcial | Falta firewall, SSH y separar roles de BD |
| 8. Pipeline y monitoreo | Parcial | CI restaurado; falta monitor externo y runs enlazados |
| 9. Mantenimiento, soporte, capacitación | Sí | Sesión de capacitación sin ejecutar |

Registro de cambios del plan:

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-11-16 | Consolidación de las secciones 1-5 (archivos de `docs/plan de implantacion - Rehnimarket/`) y nuevas secciones 6-10 |
| 1.1 | [PENDIENTE] | Correcciones del simulacro |

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
