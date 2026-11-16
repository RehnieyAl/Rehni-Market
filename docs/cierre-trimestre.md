# Cierre del Trimestre — RehniMarket

> Plantilla: `bc-asesoria-proyecto/bootcamp/week-09-sprint_8_cierre_y_avance_90/3-proyecto/starter/entregable-s09-cierre-final.md`.
> Equipo de 1 persona: las verificaciones cruzadas las hace un tercero o se reemplazan por
> autoensayo (`docs/autoensayo-por-capa.md`). Fecha: 2026-11-16.

## 1. Gate Docker de Entrega — sin alternativa

**Checklist obligatorio** (copiado de `bc-asesoria-proyecto/docs/docker-guia.md`, checklist de la semana 9):

- [x] `git clone` limpio + `cp .env.example .env` + `docker compose up` levanta el proyecto completo
- [x] Backend, frontend y base de datos corren cada uno en su propio contenedor (además MinIO y PgBouncer)
- [x] No hay ningún proceso corriendo fuera de Docker para que el proyecto funcione
- [ ] El Sprint Review final se demuestra sobre la versión containerizada, no sobre el entorno local del aprendiz — [PENDIENTE: demo de la sección 5]

**Resultado del gate**: ☒ Pasa &nbsp;&nbsp; ☐ No pasa

**Evidencia**: el 2026-11-16, en el equipo de desarrollo (CachyOS, Docker Compose 5.7.0), sobre
el commit `6b054d0`: `git clone` en una carpeta nueva, `cp .env.example .env` y
`docker compose up -d --build --wait` → 5 servicios `healthy` en 2 min 04 s, y
`scripts/smoke-test.sh` → `7 pasan, 0 fallan` (catálogo con 787 productos del seed y login con la
cuenta owner de desarrollo). Salida completa: `docs/pruebas/evidencias/2026-11-16_gate-docker.txt`.
Verificado solo por el responsable técnico: [PENDIENTE: repetirlo con un compañero o el
instructor en otra máquina y anotar quién, cuándo y dónde].

**Si no pasa**: antes de esta semana no pasaba. Con solo `cp .env.example .env`, compose fallaba
porque exigía `.env.minio`, `.env.postgres` y `RehniMarket-backend/.env`; y copiando las cuatro
plantillas tampoco arrancaba, porque `URL_DATABASE` usaba `CAMBIA_CLAVE` y `POSTGRES_PASSWORD`
otro marcador. Corregido en `6b054d0` (sección 3).

## 2. Avance del Proyecto

| Métrica | Valor |
|---|---|
| Historias totales del backlog | 36 (catálogo RF-01…RF-36 del Manual técnico) · SRS original: [PENDIENTE] |
| Historias en estado "Hecho" | 36 (3 con defectos abiertos) |
| % de avance | 100 % frente al catálogo RF · [PENDIENTE: % frente al SRS original] |

**Meta:** ≥90%. Detalle por historia con su evidencia: [`docs/backlog-final.md`](backlog-final.md).
El cálculo frente al catálogo RF no reemplaza al SRS: si el SRS tenía historias que no están en
el catálogo (por ejemplo, de la app móvil), bajan el porcentaje y deben listarse en «No
alcanzado» con su justificación. [PENDIENTE: SRS y enlace al tablero de GitHub Projects para que
la medición sea trazable.]

## 3. Code Review Final

**Alcance revisado**: todo el repositorio (backend, frontend web, infraestructura y scripts), con
tres fuentes: SonarCloud sobre `main` (análisis del 2026-11-13: 55 bugs, 8 vulnerabilidades),
la suite de pruebas y sus hallazgos (`docs/pruebas/REGISTRO.md`) y una revisión manual de
limpieza para la entrega (debug, archivos basura, CI, configuración). La app móvil se revisó
solo en Sonar (2 hallazgos): está fuera del alcance de la entrega.

**Hallazgos bloqueantes corregidos esta semana**:
- Gate Docker: el clon limpio no levantaba (`6b054d0`).
- CI sin pruebas: el workflow con pytest y Vitest se había quitado el 2026-11-05; restaurado en
  `bd94ed0` y umbral de cobertura del backend subido de 60 a 64 (`c7c34e1`).
- Código de depuración: 4 `print()` en `app/services/email/EmailService.py` reemplazados por
  `logging` (`4652db5`). Hoy hay 0 `print(` en `app/` y 0 `console.log` en el frontend.
- Archivos basura: 192 archivos de `RehniMarket-backend/.git.old/` versionados en esta rama (no en
  `main`), sacados del
  índice (`c8a7b28`).
- Vulnerabilidad `docker:S6470` (CRITICAL): `COPY . .` metía `RehniMarket-backend/.git.old` y los
  `.env.*` en la imagen del backend. `.dockerignore` corregido y verificado con `ls -a /app` en una
  imagen reconstruida (#46).
- Fallos esperados sin incidencia: cada `xfail`/`it.todo` cita ahora su incidencia (`31d87a9`).

Revisados y descartados como falsos positivos o código intencional (Sonar). La primera revisión
descartaba también `docker:S6470` y `python:S2068`; al revisarlos de nuevo resultaron reales y
están abajo y en la sección 4.

| Regla | Ubicación | Motivo |
|---|---|---|
| `plsql:DeleteOrUpdateWithoutWhereCheck` (BLOCKER) | `scripts/migracion/transformar.sql:96` | El `UPDATE` recorre a propósito toda la tabla de staging `migracion.normalizados` para marcar motivos de rechazo |
| `pythonbugs:S2259` | `CertificateUpdateService.py:38` | `api_error` es `NoReturn` (`18b3d61`); `company` no puede ser `None` en esa línea |

**Hallazgos NO bloqueantes** → ver sección 4 (Deuda Técnica).

## 4. Deuda Técnica Documentada para el Siguiente Trimestre

| Qué | Por qué no se resolvió | Impacto | Prioridad |
|---|---|---|---|
| H-07 y H-08: liquidaciones que pagan dos veces o incluyen devoluciones (#36, #37) | Cambian la lógica de dinero; requieren diseño y aprobación | Alto: la empresa recibe más de lo que vendió | P1 |
| H-06: borrar una dirección usada en un pedido responde 500 (#35) | Necesita migración (FK `ondelete`) | Medio: error sin mensaje para el comprador | P2 |
| Dependencias con avisos de seguridad (17 en web, 11 en backend) y sin Dependabot (#45) | Actualizar exige volver a probar todo el sistema | Medio-alto (`python-jose`/`ecdsa` en la imagen desplegada) | P1 |
| Un solo rol de BD para app y migraciones (#44) | Cambia el despliegue y el `.env` | Medio: la app podría borrar tablas | P2 |
| Cobertura por debajo del 80 %: backend 70 % líneas, frontend 10,6 % (#42) | Falta de tiempo; se priorizó la lógica de dinero | Medio: regresiones en paneles admin/empresa sin detectar | P2 |
| Sin pruebas E2E (#43) | No se alcanzó la fase 5 del plan de pruebas | Medio | P2 |
| 53 promesas sin manejar (`typescript:S9383`) en web y móvil | Corrección mecánica pero en muchos archivos | Bajo-medio: errores silenciosos en la UI | P3 |
| Contenedores como root y `uv:latest` sin fijar en `RehniMarket-backend/Dockerfile` (Sonar `S6471`, `S8544`, `S8541`) | Requiere probar permisos de volúmenes | Bajo-medio | P3 |
| Contraseña fija de las empresas del seed (`python:S2068`, #47) | Requiere cambiar el seed y el `.env` de desarrollo | Medio si se activa `RUN_SEED` en un servidor expuesto | P2 |
| H-01 deriva modelo ↔ migración (#32), B-01…B-04 (#38–#41) | Bajo impacto; dependen unas de otras | Bajo | P3 |
| H-02 y H-03 validación de NIT y dígitos no ASCII (#33, #34) | Cambian reglas de validación ya publicadas | Bajo | P3 |
| App móvil sin pruebas ni despliegue | Fuera del alcance de la entrega | — | P4 |

## 5. Demo Integrada

Guion por rol: [`docs/demo-e2e.md`](demo-e2e.md).

- **Flujo demostrado**: empresa publica un producto con variantes → administración la verifica y
  recarga RehniCoin a un comprador → el comprador compra, cancela y recibe el reembolso → la
  empresa despacha otro pedido y resuelve una devolución. [PENDIENTE: ejecutarlo y cronometrarlo]
- **Se ejecutó sobre contenedores**: ☐ Sí &nbsp;&nbsp; ☐ No — [PENDIENTE: marcar al ejecutar sobre el clon limpio o la URL de la VM]
- **Caso de error mostrado**: compra con saldo insuficiente (CA-06) y DV de NIT inválido (CA-02). [PENDIENTE]

## 6. Hand-off al Siguiente Trimestre

- **Qué queda por codificar**: corregir H-07/H-08 (#36, #37) y H-06 (#35); actualizar
  dependencias (#45); separar roles de BD (#44); pruebas E2E de registro, compra y cancelación
  (#43); subir la cobertura del frontend empezando por `features/admin` y `features/company` (#42).
- **Qué queda por documentar**: SRS original y % frente a él (`docs/backlog-final.md`); evidencia
  del despliegue en la VM en `docs/plan-implantacion.md` (§1.7, §5.2, §6.4, §7.2);
  resultados de aceptación y del simulacro (`docs/aceptacion/`).
- **Qué queda por implementar/desplegar**: VM Ubuntu 24.04 en Azure con dominio y HTTPS, etiqueta
  `v1.0.0`, cron del respaldo con cifrado `age` y copias 2 y 3, monitor externo de salud,
  activar el ruleset de `main`.
- **Riesgos o bloqueos conocidos**: equipo de 1 persona (todo el conocimiento en una sola
  cabeza: mitigado con el plan de implantación y los runbooks); el correo transaccional depende
  de una cuenta de Gmail; la app móvil quedó sin cerrar.

Para un desarrollador nuevo: `README.md` (inicio rápido con el gate de la sección 1),
`docs/plan-implantacion.md`, `docs/estrategia-pruebas.md`, el Manual técnico y las incidencias
con las etiquetas `hallazgo-pruebas` y `deuda-tecnica`.

## 7. Roles del Equipo (Sprint 8)

| Integrante | Rol |
|---|---|
| RehnieyAL (equipo de 1 persona) | Scrum Master |
| RehnieyAL | Product Owner |
| RehnieyAL | Dev |
| RehnieyAL | QA (con revisión de un tercero: [PENDIENTE]) |
