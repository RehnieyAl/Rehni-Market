<!-- Fuente del entregable 10 (Criterio SENA 10). Plan basado exclusivamente en hallazgos reales. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## PLAN DE MEJORA CONTINUA

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 10 — PLAN DE MEJORA CONTINUA

---

Autor: RehnieyAL (Yeinher Algarin) — desarrollador unico del proyecto

Instructor: ____________________________ (dato no disponible en la documentacion del proyecto)

Ficha / grupo: ____________________________ (dato no disponible)

Ciudad: ____________________________ (dato no disponible)

Anio: 2026

Repositorio: https://github.com/RehnieyAl/Rehni-Market.git

Rama analizada: feature/owner — ultimo commit publicado: 917a647 ("ver 2.4")

Fecha de elaboracion de este documento: 2026-08-31

<!-- PAGEBREAK -->

# TABLA DE CONTENIDO

<!-- TOC -->

<!-- PAGEBREAK -->

# LISTA DE TABLAS

<!-- LISTA-TABLAS -->

<!-- PAGEBREAK -->

# NOTA SOBRE LA CONFIGURACION DOCKER

Este documento se elaboro cuando la configuracion endurecida se distribuia como `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `RehniMarket-backend/.env.prod` y `.env.prod.example`, junto a un `docker-compose.yml` de desarrollo. Los nombres se normalizaron despues. Donde este documento diga los nombres antiguos, leanse los normalizados:

| Antes | Ahora |
|---|---|
| docker-compose.prod.yml | docker-compose.yml (configuracion por defecto) |
| docker-compose.yml (desarrollo) | docker-compose.dev.yml |
| RehniMarket-frontend/Dockerfile.prod | RehniMarket-frontend/Dockerfile |
| RehniMarket-frontend/Dockerfile (dev) | RehniMarket-frontend/Dockerfile.dev |
| RehniMarket-backend/.env.prod | RehniMarket-backend/.env |
| RehniMarket-backend/.env (dev) | RehniMarket-backend/.env.dev |
| RehniMarket-backend/.env.prod.example | RehniMarket-backend/.env.public.example |
| imagenes rehni-market-backend:prod / rehni-market-frontend:prod | rehni-market-backend / rehni-market-frontend |
| contenedores rehni-backend-prod / rehni-frontend-prod | rehni-backend / rehni-frontend |
| volumen minio_prod_data | minio_data |

Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo por ser un registro historico de esa prueba.

<!-- PAGEBREAK -->

# 1. INTRODUCCION

Este documento define el plan de mejora continua de RehniMarket. Cada accion se deriva de un hallazgo real registrado en el informe de evaluacion de calidad (documento 09, hallazgos H-01 a H-18) o de un riesgo identificado. NO se incluye ninguna accion que no responda a un hallazgo real.

Cada accion se documenta con: identificador, hallazgo relacionado, problema, accion correctiva, accion preventiva, responsable, prioridad, estado y evidencia.

Regla de honestidad: una accion se marca HECHO solo si esta efectivamente realizada y verificada. Una accion propuesta pero no ejecutada se marca PENDIENTE o PARCIAL. No se afirma que una mejora fue realizada si solamente esta propuesta.

Contexto: RehniMarket lo desarrolla una sola persona. El campo "Responsable" es, en todos los casos, el desarrollador del proyecto. El campo "Horizonte" indica cuando se preve abordar cada accion: esta entrega, corto plazo o medio plazo.

Fuente: `docs/INFORME_CALIDAD_REHNIMARKET.md` seccion 13, `docs/AUDITORIA_FINAL_REHNIMARKET.md` y la evidencia de `evidencias/`.

# 2. RESUMEN

El plan define 27 acciones: 11 correctivas (AC), 9 preventivas (AP) y 8 mejoras futuras (MF). A la fecha de este documento, aproximadamente 10 estan cerradas (HECHO), varias PARCIALES y el resto PENDIENTES con horizonte asignado.

[[TABLA]] Resumen del estado de las 27 acciones.

| Tipo | Total | HECHO | PARCIAL | PENDIENTE |
|---|---|---|---|---|
| Correctivas (AC) | 11 | 6 | 2 | 3 |
| Preventivas (AP) | 9 | 1 | 2 | 6 |
| Mejoras futuras (MF) | 8 | 0 (1 con parte hecha) | 4 | 3 |
| Total | 27 | 7 | 8 | 12 |

[[TABLA]] Prioridades del plan.

| Prioridad | Definicion |
|---|---|
| Alta | Impacto en seguridad o fiabilidad, o bloqueante para produccion |
| Media | Mejora relevante de calidad |
| Baja | Pulido o deuda menor |

# 3. ACCIONES CORRECTIVAS

## AC-01 — Restringir CORS a los origenes reales del frontend

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-01 / riesgo R-01 |
| Problema | CORS permitia cualquier origen (allow_origins=["*"]) con allow_credentials=True |
| Accion correctiva | Construir allow_origins desde URL_FRONTEND + origenes locales de desarrollo; allow_credentials coherente con la lista |
| Accion preventiva | Documentar que URL_FRONTEND debe definirse siempre; no volver a usar "*" en produccion |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Esta entrega |
| Estado | HECHO — app/middleware/CorsMiddleware.py construye la lista desde URL_FRONTEND; allow_credentials solo con lista concreta |
| Evidencia | app/middleware/CorsMiddleware.py; 113/113 pytest siguen pasando |

## AC-02 — Activar el middleware de limitacion de tasa

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-02 |
| Problema | El middleware de limitacion de tasa estaba implementado pero comentado |
| Accion correctiva | Hacerlo activable con RATE_LIMIT_ENABLED; forzarlo a true en docker-compose.prod.yml |
| Accion preventiva | Respaldar el conteo en un almacen compartido si hay varias replicas |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Corto plazo |
| Estado | PARCIAL — activacion HECHA (Config.py, main.py, .env.example; forzado en produccion). Falta el almacen compartido para varias replicas |
| Evidencia | app/main.py, app/Config.py, docker-compose.prod.yml |

## AC-03 — SECRET_KEY largo y aleatorio por entorno

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-04 / riesgo R-01 |
| Problema | La plantilla .env.example sugeria una clave trivial |
| Accion correctiva | .env.example y .env.prod.example con un placeholder explicito e instruccion openssl rand -hex 32 |
| Accion preventiva | Generar el valor real por entorno en el despliegue; rotarlo ante sospecha de fuga |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Esta entrega |
| Estado | HECHO (a nivel de plantilla). Generar el valor real es una accion del despliegue |
| Evidencia | .env.example, .env.prod.example |

## AC-04 — build_media_url() a partir de config.URL_BACKEND

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-16 |
| Problema | build_media_url() devolvia una IP fija hardcodeada, ignorando URL_BACKEND; las URLs de imagen se romperian al migrar de host |
| Accion correctiva | MEDIA_BASE_URL = config.URL_BACKEND or fallback |
| Accion preventiva | Definir siempre URL_BACKEND en el .env |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Esta entrega |
| Estado | HECHO |
| Evidencia | app/services/NasService.py |

## AC-05 — Actualizar README.md y CHANGELOG.md del backend

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-08 / riesgo R-07 |
| Problema | README y CHANGELOG conservaban el nombre "Lubix" y una version antigua |
| Accion correctiva | Reescribir ambos al estado real (nombre RehniMarket, stack real, 10 migraciones, 24 routers, 113 tests); nota historica sobre Lubix |
| Accion preventiva | Revisar la documentacion de proyecto contra el codigo en cada entrega |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Esta entrega |
| Estado | HECHO |
| Evidencia | RehniMarket-backend/README.md, CHANGELOG.md |

## AC-06 — Alinear .env.example con las variables que lee app/Config.py

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-09 / riesgo R-07 |
| Problema | El .env.example usa nombres de variables de seed distintos a los del .env real; el .env real incluye una variable IP que el codigo no lee |
| Accion correctiva | Incluir USER_NAME_ADMIN en el .env.example; documentar IP como no leida |
| Accion preventiva | Mantener el .env.example como fuente unica de las variables validas |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Esta entrega |
| Estado | HECHO (parcial) — .env.example incluye USER_NAME_ADMIN; IP documentada en el Manual Tecnico seccion 22. Falta eliminar IP del .env real |
| Evidencia | .env.example, Manual Tecnico seccion 22 |

## AC-07 — Alinear docs/RehniMarket-HU.md (HU-004, HU-025) con el codigo

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-14, H-15 / riesgo R-07 |
| Problema | HU-004 dice que una empresa pendiente puede iniciar sesion (el codigo lo bloquea); HU-025 describe anuncios con texto (el codigo los define como banners visuales) |
| Accion correctiva | Editar el texto de HU-004 y HU-025 en RehniMarket-HU.md para reflejar el codigo, o registrar la desviacion |
| Accion preventiva | Revisar las historias de usuario contra el codigo en cada entrega |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Corto plazo |
| Estado | PARCIAL (documentado) — la desviacion esta registrada en el Plan de Pruebas seccion 16.2 y en el Manual de Usuario; los manuales ya reflejan el comportamiento real. Falta editar el texto de las dos historias |
| Evidencia | Plan de Pruebas seccion 16.2; Manual de Usuario secciones 16.5 y 20 |

## AC-08 — Activar strict de TypeScript en el frontend web

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-06 |
| Problema | El tsconfig del frontend web no activa "strict" (si en la app movil) |
| Accion correctiva | Activar "strict": true en tsconfig.app.json y resolver los errores de tipo resultantes |
| Accion preventiva | Mantener el mismo rigor de tipos en todos los componentes del proyecto |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE — riesgo de cambios amplios; se aborda con mas tiempo |
| Evidencia | RehniMarket-frontend/tsconfig.app.json |

## AC-09 — Resolver dependencias declaradas y no usadas

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-13 |
| Problema | sentry-sdk (backend, sin inicializar) y react-device-detect (frontend, sin importar) estan declaradas y no se usan |
| Accion correctiva | Inicializar sentry-sdk o quitarlo; quitar react-device-detect |
| Accion preventiva | Revisar dependencias declaradas frente a usadas en cada entrega |
| Responsable | Desarrollador del proyecto |
| Prioridad | Baja |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | pyproject.toml, package.json |

## AC-10 — Normalizar nombres y mensajes

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Seccion 9.3 del informe de calidad |
| Problema | Un archivo de esquema mal nombrado (ShemaCompany.py, falta la "c"); mensajes con errores de tildes |
| Accion correctiva | Renombrar el archivo; normalizar las tildes en los mensajes de cara al usuario |
| Accion preventiva | Revision de nomenclatura en la lista de comprobacion de revision de codigo (PSP-2) |
| Responsable | Desarrollador del proyecto |
| Prioridad | Baja |
| Horizonte | Medio plazo |
| Estado | PENDIENTE — el renombrado toca muchos imports; se hace con pruebas de regresion |
| Evidencia | app/schemas/SchemaDashboard/ShemaCompany.py |

## AC-11 — Actualizar dependencias con vulnerabilidad conocida

| Campo | Valor |
|---|---|
| Hallazgo relacionado | S-17 |
| Problema | pip-audit reporto 8 vulnerabilidades en 5 paquetes del backend; pnpm audit reporto avisos en el frontend y la app movil |
| Accion correctiva | Actualizar click, pip, pyasn1 y pydantic-settings (backend); react-router-dom (frontend) |
| Accion preventiva | Ejecutar pip-audit y pnpm audit antes de cada entrega y guardar el reporte |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Esta entrega |
| Estado | HECHO — backend 8 -> 1 (la restante, ecdsa, sin parche y no explotable con HS256); frontend 7 -> 6 (resto de build/lint) |
| Evidencia | evidencias/security/pip-audit.txt, reporte.json, pnpm-audit-*.txt |

# 4. ACCIONES PREVENTIVAS

## AP-01 — Integracion continua

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-10 / riesgo R-02 |
| Problema | Sin integracion continua: las verificaciones dependen de ejecucion manual |
| Accion correctiva | (no aplica: es preventiva) |
| Accion preventiva | Configurar un flujo de integracion continua que ejecute pytest, tsc -b, eslint y las auditorias en cada cambio |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Corto plazo |
| Estado | PENDIENTE |
| Evidencia | Ausencia de .github/workflows/ |

## AP-02 — Pruebas automatizadas de frontend y de app movil

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-05 / riesgo R-02 |
| Problema | El frontend web y la app movil no tienen ningun archivo de prueba |
| Accion preventiva | Anadir pruebas al frontend (por ejemplo con Vitest) y a la app movil (jest-expo ya esta configurado), empezando por carrito, checkout y autenticacion |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | 0 archivos *.test.* / *.spec.* en RehniMarket-frontend/src y RehniMarket-mobile/src |

## AP-03 — Medir cobertura y fijar un umbral

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Pendiente PEND-07 |
| Problema | No habia medicion de cobertura de pruebas |
| Accion preventiva | Medir con pytest --cov y fijar un umbral en pyproject.toml tras la primera medicion |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Esta entrega |
| Estado | PARCIAL — cobertura medida: TOTAL 62 %. Falta fijar el umbral en pyproject.toml |
| Evidencia | evidencias/tests/pytest-cov.txt |

## AP-04 — Auditoria de dependencias en cada entrega

| Campo | Valor |
|---|---|
| Hallazgo relacionado | S-17 / riesgo R-06 |
| Problema | Las vulnerabilidades de dependencias no se detectaban de forma continua |
| Accion preventiva | Ejecutar pip-audit y pnpm audit en cada entrega y en la integracion continua; guardar el reporte |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Esta entrega |
| Estado | PARCIAL — pip-audit y pnpm audit ejecutados y guardados. Falta integrarlo en la integracion continua |
| Evidencia | evidencias/security/ |

## AP-05 — Linter y verificador de tipos para el backend Python

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-07 |
| Problema | No hay ruff, mypy ni black en el backend |
| Accion preventiva | Anadir ruff (y opcionalmente mypy) al grupo dev y a la integracion continua |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | pyproject.toml |

## AP-06 — Convencion de commits

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-11 |
| Problema | Historial de commits sin convencion; no permite trazar historia de usuario a commit |
| Accion preventiva | Adoptar Conventional Commits y rama por funcionalidad |
| Responsable | Desarrollador del proyecto |
| Prioridad | Baja |
| Horizonte | Corto plazo |
| Estado | PENDIENTE — recogido en la bitacora PSP (PSP-3) |
| Evidencia | git log --oneline |

## AP-07 — Fuente unica para los codigos de error

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Riesgo R-03 |
| Problema | Los enumerados de codigos de error existen en 3 lugares (backend, frontend, movil) y se sincronizan a mano |
| Accion preventiva | Generar los ErrorCode del frontend y de la app movil desde una unica fuente |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | app/core/ErrorCodes.py, src/shared/types/ErrorCode.ts, RehniMarket-mobile/src/types/ErrorCode.ts |

## AP-08 — Comprobaciones de salud en docker-compose.yml

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Seccion 7.4 del informe de calidad |
| Problema | Docker no conocia el estado real de los contenedores (sin healthcheck) |
| Accion preventiva | Anadir healthcheck para postgres (pg_isready), minio (/minio/health/live) y backend (/health/database) |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Esta entrega |
| Estado | HECHO |
| Evidencia | docker-compose.yml; evidencias/deployment/01_docker_compose_ps.txt |

## AP-09 — Logging estructurado y monitor de errores

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-12 / riesgo R-05 |
| Problema | Logging minimo (3 usos de logging) y 38 usos de traceback.print_exc() a stdout; sentry-sdk declarado pero no inicializado |
| Accion preventiva | Inicializar un registro estructurado y un monitor de errores (aprovechar sentry-sdk) |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | grep de sentry, logging, traceback en app/ |

# 5. MEJORAS FUTURAS

## MF-01 — Configuracion de produccion endurecida + reverse proxy con TLS

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-03, H-17 |
| Problema | Solo existia una configuracion de Compose orientada a desarrollo; sin TLS |
| Accion de mejora | docker-compose.prod.yml endurecido, Dockerfile.prod (Nginx), nginx.conf, .env.prod.example; reverse proxy con TLS por delante |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Corto plazo |
| Estado | HECHO (parcial) — la configuracion de produccion esta creada, construida y probada en un proyecto Compose aislado. FALTA: el reverse proxy con TLS (depende del dominio) y el despliegue real en un servidor |
| Evidencia | docker-compose.prod.yml; evidencias/deployment/10_prod_compose_smoke.txt |

## MF-02 — Respaldo automatizado y prueba de restauracion

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Riesgo R-04 / pendiente PEND-04 |
| Problema | No habia estrategia de respaldo implementada ni probada |
| Accion de mejora | Scripts de respaldo y restauracion coordinados; automatizarlos con cron o systemd y copia externa cifrada |
| Responsable | Desarrollador del proyecto |
| Prioridad | Alta |
| Horizonte | Esta entrega |
| Estado | PARCIAL — scripts creados y ejecutados una vez con prueba de restauracion aprobada. FALTA: la automatizacion (cron / systemd) y la copia externa cifrada |
| Evidencia | scripts/backup_rehnimarket.sh, scripts/restore_rehnimarket.sh; evidencias/backup/ |

## MF-03 — Campana de carga y objetivos de nivel de servicio

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Pendiente PEND-01 |
| Problema | No existia medicion de rendimiento; no hay SLO acordados |
| Accion de mejora | (a) linea base basica; (b) campana con la herramienta k6 sobre catalogo y checkout; definir SLO |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Corto plazo |
| Estado | PARCIAL — linea base basica ejecutada (perf_test.sh: 900 solicitudes, 0 errores). La plantilla k6 (scripts/load_test.k6.js) esta LISTA pero NO EJECUTADA; no hay resultados de k6 ni SLO acordado |
| Evidencia | evidencias/performance/resultado.txt; scripts/load_test.k6.js |

## MF-04 — Auditoria de accesibilidad

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Pendiente PEND-02 |
| Problema | Sin auditoria formal de accesibilidad del frontend |
| Accion de mejora | Auditoria con Lighthouse o axe; plan de correcciones WCAG |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE — NO REALIZADA |
| Evidencia | — |

## MF-05 — Fragmentacion del bundle del frontend

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Eficiencia de desempeno (informe de calidad seccion 6) |
| Problema | Bundle JS unico de aprox. 729 kB sin code-splitting (aviso de Vite) |
| Accion de mejora | Fragmentar el bundle por ruta |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | Aviso de vite build (evidencias/tests/frontend-tsc-eslint.txt) |

## MF-06 — Empaquetado nativo de la app movil

| Campo | Valor |
|---|---|
| Hallazgo relacionado | H-18 / pendiente PEND-05 |
| Problema | La app movil no tiene empaquetado nativo configurado |
| Accion de mejora | Configurar EAS Build para generar APK/AAB firmados |
| Responsable | Desarrollador del proyecto |
| Prioridad | Media |
| Horizonte | Medio plazo |
| Estado | PENDIENTE |
| Evidencia | RehniMarket-mobile/ (sin eas.json) |

## MF-07 — Matriz de trazabilidad historia-endpoint-prueba

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Adecuacion funcional / Pruebas |
| Problema | No hay una columna de prueba automatizada por historia de usuario |
| Accion de mejora | Mantener una matriz historia-endpoint-prueba viva en cada entrega |
| Responsable | Desarrollador del proyecto |
| Prioridad | Baja |
| Horizonte | Corto plazo |
| Estado | PARCIAL — la matriz existe en el Plan de Pruebas seccion 16 y en el documento de requisitos seccion 6; falta la columna de prueba automatizada por historia |
| Evidencia | docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md seccion 16 |

## MF-08 — Artefactos de PSP

| Campo | Valor |
|---|---|
| Hallazgo relacionado | Criterio 7 SENA / pendiente PEND-08 |
| Problema | No habia artefactos de Proceso Personal de Software en el repositorio |
| Accion de mejora | Elaborar la bitacora PSP (retrospectiva, con aviso de honestidad) y llevar el registro en vivo en el proximo proyecto |
| Responsable | Desarrollador del proyecto |
| Prioridad | Baja |
| Horizonte | Esta entrega |
| Estado | HECHO (retrospectivo) — docs/BITACORA_PSP_REHNIMARKET.md. El registro en vivo queda para el proximo proyecto (PSP-1) |
| Evidencia | docs/BITACORA_PSP_REHNIMARKET.md |

# 6. ACCIONES CRITICAS PRIORIZADAS

Las cinco acciones de mayor prioridad para el estado actual del proyecto:

1. Endurecer la seguridad de transporte e infraestructura para una publicacion real: reverse proxy con TLS (MF-01, parte pendiente).
2. Establecer integracion continua que ejecute todas las verificaciones existentes (AP-01).
3. Anadir pruebas automatizadas a frontend y app movil (AP-02).
4. Automatizar el respaldo de base de datos y de MinIO con copia externa cifrada (MF-02, parte pendiente).
5. Ejecutar la campana de carga con k6 y acordar los SLO (MF-03, parte pendiente).

# 7. SEGUIMIENTO

Mecanismo propuesto: una entrada por accion en el sistema de gestion del repositorio (issues), con etiqueta de tipo (correctiva / preventiva / mejora), prioridad y horizonte. Revision del estado del plan en cada entrega. A la fecha, el seguimiento se realiza en este documento y en el informe de calidad (documento 09) seccion 13.

# 8. EVIDENCIAS

[[TABLA]] Evidencias del criterio 10.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| INFORME_CALIDAD_REHNIMARKET.md seccion 13 | Documento | docs/ | Plan de mejora con 27 acciones, cada una trazada a un hallazgo | EJECUTADO |
| AUDITORIA_FINAL_REHNIMARKET.md | Documento | docs/ | Consolidado del estado de cada criterio y de las acciones cerradas | EJECUTADO |
| evidencias/ (todas las subcarpetas) | Salidas de comando | evidencias/ | Prueba de que las acciones marcadas HECHO estan efectivamente realizadas | EJECUTADO |
| Captura del plan y del estado de las acciones durante la sustentacion | Captura de pantalla | docs/evidencias/10_mejora/ | Presentacion ante el instructor | PENDIENTE (capturar en la sustentacion) |

# 9. CONCLUSION

RehniMarket cuenta con un plan de mejora continua de 27 acciones, todas derivadas de hallazgos reales del informe de evaluacion de calidad. Aproximadamente 7 estan efectivamente cerradas y verificadas con evidencia, 8 estan parcialmente atendidas y 12 permanecen pendientes con horizonte asignado. El documento marca HECHO unicamente lo que esta realizado y verificado, y no afirma que ninguna mejora este completa si solo esta propuesta.
