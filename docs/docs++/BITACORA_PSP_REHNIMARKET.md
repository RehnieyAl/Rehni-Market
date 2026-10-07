# Bitácora PSP — RehniMarket

> **PSP** = *Personal Software Process*. Disciplina de trabajo **individual**.
> **Criterio de evaluación:** 7 — *Aplicación de marcos de calidad y PSP*.
> **Autor / único desarrollador:** RehnieyAL (Yeinher Algarin).
> **Fecha de elaboración de la bitácora:** 2026-08-31.
> **Periodo cubierto:** 2026-06-02 → 2026-08-31.
>
> ---
>
> ### Aviso de honestidad (obligatorio)
>
> Durante el desarrollo **no se llevó un registro de tiempo en vivo** (no hubo hoja
> de tiempos por fase ni cronómetro por tarea). Por lo tanto:
>
> - Las **fechas y los hitos** de este documento son **reales**: provienen del historial
>   de Git (`git log`) y del `CHANGELOG.md`.
> - Los **tiempos y esfuerzos** por fase son **estimaciones retrospectivas** — se marcan
>   siempre como `(est. retro.)`. No deben leerse como mediciones.
> - El **registro de defectos** se reconstruye a partir de los hallazgos ya documentados
>   en `docs/INFORME_CALIDAD_REHNIMARKET.md` (H-01…H-18) y de los `Fixed` del `CHANGELOG.md`
>   y comentarios `PENDIENTE` del código. Es un registro **a posteriori**, no un log de fase.
>
> Esta bitácora sirve para **evidenciar la práctica de PSP como disciplina individual**
> (planificación, estimación, seguimiento, registro de defectos, retrospectiva), asumiendo
> abiertamente que se adopta de forma retrospectiva en este proyecto y que en el próximo
> debe llevarse desde el día 1.

---

> **Nota de normalización Docker (posterior a este documento):** donde el texto diga `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` / `.env.prod.example` / imágenes `*:prod` / contenedores `*-prod` / volumen `minio_prod_data`, léase la configuración **por defecto** ya normalizada: `docker-compose.yml`, `RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`, `.env.public.example`, `rehni-market-backend` / `rehni-market-frontend`, `rehni-backend` / `rehni-frontend`, `minio_data`. El modo desarrollo pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo. Tabla completa en `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`.

## 1. Planificación

### 1.1 Alcance planificado (fase inicial)

El backlog inicial está en `Historia de usuario.md` (anexo histórico): ~53 historias
"completadas" previstas + ~25 "pendientes". El alcance **realmente comprometido y entregado**
quedó consolidado en `docs/RehniMarket-HU.md` (29 HU) y `docs/RehniMarket-Requisitos.docx`
(65 RF + 31 RNF).

### 1.2 Fases del proyecto (PSP simplificado)

| Fase PSP | Actividad en RehniMarket |
|---|---|
| **Planificación** | Definición de alcance, actores, backlog de HU. |
| **Diseño** | Modelo de datos (ORM), arquitectura por capas, contrato de API, arquitectura de variantes/atributos. |
| **Codificación** | Implementación de backend (routers/servicios/repos), frontend web, app móvil. |
| **Revisión de código** | Autorrevisión + comentarios `PENDIENTE` en el código; revisión previa a cada `ver X`. |
| **Pruebas** | Suite `pytest` del backend (113), `tsc`/`eslint` del frontend, pruebas manuales. |
| **Post-mortem** | `INFORME_CALIDAD_REHNIMARKET.md`, este documento, y las secciones de "lecciones aprendidas". |

### 1.3 Estimación vs. real (a nivel de hitos — fechas REALES de Git)

| Hito | Estimado (est. retro.) | Real (Git / CHANGELOG) | Desvío |
|---|---|---|---|
| Base: auth JWT + modelos + MinIO + Docker (`1.1.x`) | ~2 semanas | 2026-06-02 → 2026-06-19 (~2,5 sem) | +25 % |
| Dashboards empresa/comprador iniciales | ~1 semana | 2026-06-16 → 2026-07-15 (con pausa) | — (hubo interrupción) |
| Renombrado Lubix → RehniMarket + estabilización | ~3 días | 2026-08-10 → 2026-08-17 | +100 % (arrastró bugs: commit "version estable con bugs") |
| Refactor a arquitectura por capas + features (`ver 2.0`) | ~1 semana | 2026-08-17 → 2026-08-27 (~1,5 sem) | +50 % |
| Arquitectura genérica de variantes/atributos + descuentos | ~4 días | dentro de `2.0`–`2.4` (2026-08-27 → 29) | subestimado (fue el subdominio más complejo) |
| Carrito + checkout + pedidos + billetera + reseñas + reportes + payouts + transportadoras | ~1 semana | `ver 2.1`–`2.4` (2026-08-27 → 29), muy intensivo | fuerte compresión al final |
| Suite de pruebas backend (113) | ~2 días | `ver 2.3` (2026-08-29) | acorde |
| Documentación de entrega (despliegue, calidad, manuales, migración, pruebas) | ~2 días | 2026-08-30 → 2026-08-31 | +50 % |

**Lectura:** la subestimación se concentró en (a) el refactor arquitectónico de `ver 2.0`,
(b) la arquitectura de variantes genéricas, y (c) la documentación de cierre. El patrón
típico de PSP en desarrolladores sin histórico previo: **optimismo en tareas de diseño y de
integración**.

---

## 2. Seguimiento (hitos reales)

Fuente: `git log --format='%h | %ai | %s'` del repositorio raíz + `CHANGELOG.md`.

| Fecha | Commit / versión | Contenido | Fase dominante |
|---|---|---|---|
| 2026-06-02 | `[1.1.0]` | MinIO, pip-audit, uv, Docker funcional | Codificación / Infra |
| 2026-06-16 | `[1.1.1]` | Modelos ORM (company/products/catalog), JWT access+refresh, roles, seed | Diseño + Codificación |
| 2026-06-18 | `[1.1.1b]` | Lógica inicial de dashboards comprador/vendedor | Codificación |
| 2026-06-19 | `[1.1.2]` | Endpoints de dashboard de empresa | Codificación |
| 2026-07-15 | `def39ce` "New version alpha" | Reorganización | Codificación |
| 2026-07-17 | `71b1c82` "aplicar .gitignore" | Higiene de repo | — |
| 2026-08-01 | `4793cf7` "update 1.1" | (commit gigante: 10142 archivos — se versionó `node_modules` por error y luego se corrigió con `.gitignore`) | **Defecto de proceso** (ver D-01) |
| 2026-08-10 | `80262e5` "version estable con bugs" | Entrega intermedia con defectos conocidos | Codificación / Pruebas insuficientes |
| 2026-08-12 | `22311f4` / `320d753` "new feature" | Features | Codificación |
| 2026-08-17 | `07839d5` "rehni-Market-1.3.1" | **Renombrado Lubix → RehniMarket** | Codificación |
| 2026-08-27 | `3b592e0` "ver 2.0" | Refactor mayor a capas + features (301 archivos, +24727 líneas) | Diseño + Codificación |
| 2026-08-28 | `1fa813c` "ver 2.1" | Carrito, checkout, pedidos, direcciones, favoritos, panel comprador/admin | Codificación |
| 2026-08-28 | `88e4e1a` "ver 2.2" | Billetera RehniCoin, reseñas, reportes, liquidaciones | Codificación |
| 2026-08-29 | `7e5c726` "ver 2.3" | **Suite de pruebas (113)**, checkout atómico | Pruebas |
| 2026-08-29 | `917a647` "ver 2.4" | Búsqueda difusa, IVA por producto, transportadoras, anuncios visuales | Codificación |
| 2026-08-30/31 | (árbol de trabajo, sin commit) | Expansión app móvil, ajustes de esquemas, documentación de entrega | Codificación + Post-mortem |

**Observación de proceso:** los mensajes de commit ("ver 2.x", "new feature", "version
estable con bugs") **no siguen una convención** y no permiten trazar qué HU cerró cada uno.
Corregir en el próximo proyecto (Conventional Commits).

---

## 3. Registro de defectos

Reconstruido a posteriori. `Fase de inyección` = dónde se originó; `Fase de detección` =
cuándo se notó; `Fase de corrección` = cuándo (o si) se resolvió.

### 3.1 Defectos de proceso

| ID | Defecto | F. inyección | F. detección | F. corrección | Estado | Evidencia |
|---|---|---|---|---|---|---|
| D-01 | `node_modules` versionado en Git (commit `4793cf7`, 10142 archivos) | Codificación | Revisión de repo | Codificación (`71b1c82` retroactivo + `.gitignore`) | **Corregido** | `git log --shortstat` |
| D-02 | Mensajes de commit sin convención; imposible trazar HU→commit | Planificación de proceso | Auditoría de calidad | No corregido | **Abierto** (proceso) | `git log --oneline` |
| D-03 | Sin control de tiempo por fase (no se aplicó PSP desde el inicio) | Planificación | Elaboración de esta bitácora | Mitigado (bitácora retrospectiva) | **Abierto** (para el próximo proyecto) | este documento |
| D-04 | Sin CI: verificaciones (`pytest`, `tsc`, `eslint`) solo manuales | Diseño de proceso | Auditoría de calidad (H-10) | No corregido | **Abierto** | ausencia de `.github/workflows/` |
| D-05 | Documentación de entrega comprimida en los últimos 2 días | Planificación | Post-mortem | Parcial | **Mitigado** | fechas de `docs/` |

### 3.2 Defectos de código (detectados y corregidos durante el desarrollo)

| ID | Defecto | F. inyección | F. detección | F. corrección | Estado | Evidencia |
|---|---|---|---|---|---|---|
| D-06 | `NasService` hacía I/O de red (`bucket_exists`) **en el import del módulo** → rompía la colección de `pytest` y cualquier `import app.main` fuera de la red de Docker | Codificación (integración MinIO) | Pruebas (colección de pytest) | Codificación — se movió a `ensure_bucket()` en el `lifespan` | **Corregido** (`ver 2.4`) | `CHANGELOG` §2.4 Fixed; `app/services/NasService.py` |
| D-07 | En el login, el código de verificación se creaba pero **no se `commit()`eaba**; `get_db()` lo revertía → el código enviado por correo nunca coincidía | Codificación (auth) | Pruebas manuales de verificación | Codificación — `database.commit()` antes de `api_error(EMAIL_NOT_VERIFIED)` | **Corregido** | `CHANGELOG` §2.4 Fixed; memoria `email-verification-flow` |
| D-08 | Reintentar el login de una cuenta no verificada regeneraba el código y **reiniciaba el temporizador de 5 min** / podía spamear correos | Codificación (auth) | Pruebas manuales | Codificación — `issue_verification_code()` solo regenera si no hay código activo | **Corregido** | `CodeService.py` |
| D-09 | Reserva de stock en checkout no atómica (condición de carrera en la última unidad) | Diseño (checkout) | Diseño de pruebas de concurrencia | Codificación — `UPDATE ... WHERE stock >= qty` + orden determinista + `FOR UPDATE` en wallet + rollback total | **Corregido** (`ver 2.3`) | `test_concurrent_checkout_of_last_unit_lets_only_one_win` (PASA) |

### 3.3 Defectos / deuda abiertos (de la auditoría de calidad — `INFORME_CALIDAD` §11.2)

| ID (bitácora) | ID informe | Defecto | F. inyección | F. detección | Estado |
|---|---|---|---|---|---|
| D-10 | H-16 | `build_media_url()` devolvía una **IP fija hardcodeada** (`192.168.40.25:8001`), ignorando `URL_BACKEND` | Codificación (MinIO/media) | Auditoría de calidad | **Corregido en esta entrega** (usa `config.URL_BACKEND`) |
| D-11 | H-01 | CORS `allow_origins=["*"]` con `allow_credentials=True` | Codificación (middleware) | Auditoría | **Corregido en esta entrega** (restringe a `URL_FRONTEND`) |
| D-12 | H-02 | `RateLimitMiddleware` implementado pero desactivado | Diseño | Auditoría | **Abierto** (documentado; activarlo requiere validar impacto) |
| D-13 | H-04 | `SECRET_KEY` de ejemplo trivial en `.env.example` | Codificación | Auditoría | **Corregido en esta entrega** (`.env.example` con placeholder claro + instrucción) |
| D-14 | H-06 | `strict` de TypeScript no activado en el frontend web | Configuración | Auditoría | **Abierto** (activarlo puede requerir resolver muchos errores de tipo) |
| D-15 | H-08 | `README.md` / `CHANGELOG.md` del backend obsoletos ("Lubix", v1.1.2) | Documentación | Auditoría | **Corregido en esta entrega** |
| D-16 | H-14 / H-15 | Historias de usuario (HU-004, HU-025) desalineadas con el código | Documentación | Auditoría | **Documentado** (`PLAN_PRUEBAS` §16.2); el código es la fuente |
| D-17 | H-17 | Solo `docker-compose` de desarrollo | Diseño de infra | Auditoría | **Corregido en gran parte** — `docker-compose.prod.yml` + `Dockerfile.prod` creados y probados en aislado (`evidencias/deployment/10_prod_compose_smoke.txt`); falta el despliegue real con TLS |
| D-18 | H-05 | Sin pruebas automatizadas en frontend/móvil | Diseño de proceso | Auditoría | **Abierto** |
| D-19 | H-12 | Logging mínimo; `sentry-sdk` declarado, no inicializado | Codificación | Auditoría | **Abierto** |
| D-20 | H-09 | Desalineación `.env` real vs `.env.example` (nombres de seed, variable `IP`) | Configuración | Auditoría | **Abierto** (documentado en el Manual Técnico §22) |

### 3.4 Resumen del registro de defectos

| Categoría | Total | Corregidos | Abiertos |
|---|---:|---:|---:|
| Proceso | 5 | 2 | 3 |
| Código (durante desarrollo) | 4 | 4 | 0 |
| Deuda / auditoría | 11 | 5 | 6 |
| **Total** | **20** | **11** | **9** |

**Densidad de defectos:** no se calcula una densidad formal (defectos/KLOC) porque el
conteo de defectos es retrospectivo y parcial; se registra el dato como no disponible.

---

## 4. Esfuerzo (estimación retrospectiva)

> **Todos los números de esta sección son `(est. retro.)`.** Sirven para reflexión, no
> como medición. Base: fechas de Git + memoria del trabajo.

| Fase PSP | Esfuerzo estimado (h) `(est. retro.)` | % |
|---|---:|---:|
| Planificación | ~15 | 4 % |
| Diseño (modelo de datos, arquitectura, API) | ~55 | 15 % |
| Codificación backend | ~150 | 40 % |
| Codificación frontend web | ~90 | 24 % |
| Codificación app móvil | ~25 | 7 % |
| Revisión de código (autorrevisión) | ~10 | 3 % |
| Pruebas (suite + manuales) | ~15 | 4 % |
| Documentación / post-mortem | ~15 | 4 % |
| **Total** | **~375 h** | 100 % |

**Distribución observada vs. ideal PSP:**

- Codificación ~71 % (backend+web+móvil) frente a un ~50-60 % recomendado.
- Revisión de código ~3 % (PSP sugiere 10-15 %). **Sub-invertido.**
- Pruebas ~4 % en horas, pero con alto rendimiento (113 pruebas automatizadas que cubren el
  núcleo crítico). El problema no es el volumen sino la **cobertura desigual** (0 en clientes).
- Diseño concentrado al inicio y luego un **rediseño mayor** (`ver 2.0`) que un mejor diseño
  inicial podría haber reducido.

---

## 5. Comparación estimado vs. real

| Dimensión | Estimado inicial | Real | Comentario |
|---|---|---|---|
| Duración total | ~6 semanas | ~13 semanas (2026-06-02 → 2026-08-31), con pausas | +115 % — subestimación clásica + interrupciones |
| Nº de HU entregadas | ~53 (backlog inicial) | 29 consolidadas (cobertura funcional equivalente o mayor: 62/65 RF) | El backlog inicial estaba sobre-desglosado |
| Refactors mayores | 0 previstos | 1 grande (`ver 2.0`) + 1 de subdominio (variantes) | Diseño inicial insuficiente |
| Cobertura de pruebas | "pruebas al final" | 113 backend / 0 clientes | Desigual |
| Deuda técnica al cierre | — | 9 ítems abiertos (documentados) | Aceptable para proyecto académico; priorizada en `INFORME_CALIDAD` §13 |

---

## 6. Lecciones aprendidas (PSP)

1. **Aplicar PSP desde el día 1, no al final.** No se puede reconstruir un log de tiempo
   fiable; lo único recuperable son las fechas de commit. En el próximo proyecto: hoja de
   tiempos por fase y por tarea desde el primer día.
2. **El diseño de datos merece más tiempo por adelantado.** El refactor `ver 2.0` y la
   migración de "variante = color" a "atributos genéricos por categoría" (con backfill,
   `b6f8fd31fbe`) fueron caros. Un modelo de datos más pensado al inicio los habría evitado
   o reducido.
3. **La revisión de código propia estuvo sub-invertida** (~3 %). Los defectos D-06, D-07,
   D-08 se detectaron en pruebas o en producción cuando una lista de revisión (checklist de
   "I/O en imports", "commit antes de responder error", "condiciones de carrera") los habría
   atrapado antes.
4. **Centralizar la lógica crítica funcionó.** `pricing.resolve_price`, `TaxConfig.compute_tax`,
   `CheckoutService` y el cálculo único de `availableStock` evitaron duplicación y bugs de
   inconsistencia. Mantener este principio.
5. **La documentación de comportamiento envejece rápido.** HU-004 y HU-025 quedaron
   desalineadas con el código. Revisar la documentación funcional contra el código en cada
   entrega, no solo al final.
6. **Convención de commits + trazabilidad HU↔commit↔prueba.** Su ausencia (D-02) hace la
   auditoría más lenta. Adoptar Conventional Commits y una matriz de trazabilidad viva.
7. **CI aunque sea mínima.** Ejecutar `pytest` + `tsc` + `eslint` en cada push habría dado
   una red de seguridad que hoy depende de disciplina manual (D-04).

---

## 7. Plan de mejora del proceso personal (para el próximo proyecto)

| # | Acción | Prioridad |
|---|---|---|
| PSP-1 | Hoja de registro de tiempo por fase desde el día 1 (plantilla PSP: plan / real por fase). | Alta |
| PSP-2 | Checklist de revisión de código personal (I/O en imports, commit/rollback, concurrencia, validación de ownership, secretos). | Alta |
| PSP-3 | Convención de commits (Conventional Commits) + rama por feature. | Media |
| PSP-4 | CI mínima (GitHub Actions): `pytest`, `tsc -b`, `eslint`, `pip-audit`. | Alta |
| PSP-5 | Matriz de trazabilidad HU ↔ endpoint ↔ prueba, mantenida en cada entrega. | Media |
| PSP-6 | Registro de defectos en vivo (issue por defecto, con fase de inyección/detección). | Media |
| PSP-7 | Presupuesto explícito de tiempo para diseño de datos (≥ 15 % del total) antes de codificar. | Alta |

---

*Fin de la Bitácora PSP — RehniMarket.*
