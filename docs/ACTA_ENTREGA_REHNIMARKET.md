# Acta de Entrega y Aceptación — RehniMarket

> **Criterio de evaluación:** 6 — *Pruebas de aceptación y entrega formal*.
>
> **ESTADO: PLANTILLA SIN DILIGENCIAR.** Este documento se completa y **se firma el
> día de la entrega formal**, después de:
> 1. ejecutar las pruebas de aceptación del núcleo con el usuario final
>    (`docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` §7),
> 2. realizar la(s) capacitación(es) (§14 del mismo documento),
> 3. adjuntar la carpeta `evidencias/`.
>
> No debe firmarse antes de cumplir los criterios de aceptación de `PLAN_PRUEBAS` §13.2.
> Los campos con `____` los completa una persona; **ninguna firma se genera automáticamente**.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## 1. Identificación

| Campo | Contenido |
|---|---|
| Nombre del proyecto | RehniMarket — Plataforma de comercio electrónico *marketplace* |
| Programa / trimestre | Tecnólogo en Análisis y Desarrollo de Software (ADSO) — Sexto trimestre |
| Institución | SENA |
| Repositorio | `https://github.com/RehnieyAl/Rehni-Market.git` |
| Versión entregada | `__________`  (commit: `__________`) |
| Fecha de entrega | `____ / ____ / 2026` |
| Lugar | `______________________________` |

## 2. Alcance entregado

RehniMarket se entrega como **plataforma funcional en entorno de demostración local
(Docker Compose)**, compuesta por:

- **Backend** — API REST FastAPI + PostgreSQL 17 + MinIO. 24 routers, ~130 rutas,
  10 migraciones Alembic, 113 pruebas automatizadas (**113 pasan**, ver
  `evidencias/tests/pytest.txt`).
- **Frontend web** — React 19 + Vite. Cuatro roles (Visitante, Usuario, Empresa,
  Administrador/Owner). Compila y pasa verificación estática (`evidencias/tests/frontend-tsc-eslint.txt`).
- **App móvil** — Expo / React Native. Visitante y comprador. Se ejecuta con Expo Go.

Cobertura funcional: **62 de 65 requisitos funcionales** implementados de forma completa
(`docs/RehniMarket-Requisitos.docx` §7; `docs/CONSOLIDADO_AVANCE_REHNIMARKET.md`).

## 3. Entregables

| Entregable | Ubicación | Entregado |
|---|---|:--:|
| Código fuente del backend | `RehniMarket-backend/` | ☐ |
| Código fuente del frontend web | `RehniMarket-frontend/` | ☐ |
| Código fuente de la app móvil | `RehniMarket-mobile/` | ☐ |
| Orquestación Docker (dev) | `docker-compose.yml`, `Dockerfile` (x2) | ☐ |
| Orquestación Docker (prod, plantilla) | `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `nginx.conf`, `.env.prod.example` | ☐ |
| Plantilla de prueba de carga | `scripts/load_test.k6.js` (no ejecutada) | ☐ |
| Migraciones de base de datos | `RehniMarket-backend/alembic/` | ☐ |
| Scripts de backup y restauración | `scripts/backup_rehnimarket.sh`, `scripts/restore_rehnimarket.sh` | ☐ |
| Documentación de despliegue e instalación | `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` | ☐ |
| Manual técnico | `docs/MANUAL_TECNICO_REHNIMARKET.md` | ☐ |
| Manual de usuario final | `docs/MANUAL_USUARIO_REHNIMARKET.md` | ☐ |
| Plan de migración y respaldos | `docs/PLAN_MIGRACION_REHNIMARKET.md` | ☐ |
| Plan de pruebas de aceptación (con matriz diligenciada) | `docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` | ☐ |
| Informe de aseguramiento y calidad | `docs/INFORME_CALIDAD_REHNIMARKET.md` | ☐ |
| Bitácora PSP | `docs/BITACORA_PSP_REHNIMARKET.md` | ☐ |
| Requisitos e historias de usuario | `docs/RehniMarket-Requisitos.docx`, `docs/RehniMarket-HU.md` | ☐ |
| Consolidado de avance | `docs/CONSOLIDADO_AVANCE_REHNIMARKET.md` | ☐ |
| Auditoría final | `docs/AUDITORIA_FINAL_REHNIMARKET.md` | ☐ |
| Carpeta de evidencias | `evidencias/` | ☐ |
| Registro de capacitación (asistencia / grabación) | `evidencias/acceptance/capacitacion/` | ☐ |

## 4. Componentes entregados y estado

| Componente | Estado de entrega | Observaciones |
|---|---|---|
| Backend (API + PostgreSQL + MinIO) | `____________` | Despliegue local reproducible; healthchecks configurados. |
| Frontend web | `____________` | Demo local con `pnpm dev`. Se entrega además `docker-compose.prod.yml` + `Dockerfile.prod` (Nginx), probados en aislado. NO desplegado a un servidor de producción. |
| App móvil | `____________` | Se ejecuta con Expo Go; sin empaquetado APK/AAB. |

## 5. Pruebas de aceptación

- **Muestra técnica ejecutada contra la API** (registro, verificación, login, roles/permisos,
  catálogo, carrito, stock, checkout con RehniCoin, pedidos, casos negativos):
  `evidencias/acceptance/resultados.txt` — resultado: `____ pasan / ____ fallan`.
- **Pruebas de aceptación con el usuario final** (matriz `PLAN_PRUEBAS` §7): ejecutadas
  el `____ / ____ / 2026`. Resultado: `____` casos aprobados de `____` ejecutados.
  Evidencia: `evidencias/acceptance/`.
- **Defectos abiertos al momento de la firma:**
  - Críticos: `____`   Altos: `____`   Medios: `____`   Bajos: `____`
  - (0 críticos y 0 altos son condición para firmar — `PLAN_PRUEBAS` §13.2.)

## 6. Capacitación

| Sesión | Fecha | Asistentes | Evidencia |
|---|---|---|---|
| Comprador (registro, catálogo, carrito, checkout, pedidos) | `__________` | `__________` | `__________` |
| Empresa (productos, variantes, pedidos, finanzas) | `__________` | `__________` | `__________` |
| Administrador / Owner (empresas, usuarios, catálogo, anuncios, liquidaciones, RehniCoin) | `__________` | `__________` | `__________` |

## 7. Pendientes / trabajo futuro (no bloquean la aceptación)

_(Listar los defectos Medios/Bajos con prioridad y responsable, y los elementos de trabajo
futuro: `docker-compose.prod.yml` + endurecimiento de seguridad para producción, empaquetado
de la app móvil, CI, pruebas de cliente, automatización del backup — ver
`docs/INFORME_CALIDAD_REHNIMARKET.md` §13 y `docs/AUDITORIA_FINAL_REHNIMARKET.md`.)_

- `______________________________________________________________`
- `______________________________________________________________`
- `______________________________________________________________`

## 8. Niveles de servicio acordados

_(RehniMarket no define SLO cuantitativos de latencia/disponibilidad. La línea base de
rendimiento medida está en `evidencias/performance/resultado.txt`. Acordar aquí lo que
aplique para el contexto académico.)_

- `______________________________________________________________`

## 9. Declaración de aceptación

El usuario / instructor declara haber recibido los entregables listados en la sección 3,
haber presenciado la ejecución de las pruebas de aceptación de la sección 5 y la
capacitación de la sección 6, y **acepta** el proyecto RehniMarket con los pendientes
registrados en la sección 7.

| | Responsable de la entrega | Responsable de la recepción (usuario / instructor) |
|---|---|---|
| **Nombre** | `______________________` | `______________________` |
| **Rol** | Desarrollador del proyecto | `______________________` |
| **Documento** | `______________________` | `______________________` |
| **Fecha** | `____ / ____ / 2026` | `____ / ____ / 2026` |
| **Firma** | `______________________` | `______________________` |

---

*Acta de Entrega y Aceptación — RehniMarket. Plantilla generada el 2026-08-31.*
