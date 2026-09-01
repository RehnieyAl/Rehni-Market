<!-- Fuente del entregable 07 (Criterio SENA 7). Solo informacion verificable. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## MARCOS DE CALIDAD (ISO/IEC 25010) Y PROCESO PERSONAL DE SOFTWARE (PSP)

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 7 — MARCOS DE CALIDAD Y PSP

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

Este documento presenta la aplicacion de marcos de calidad de software a RehniMarket, usando ISO/IEC 25010 como modelo de calidad de producto y la familia ISO/IEC 25000 (SQuaRE) como marco del proceso de evaluacion, y documenta la practica de Proceso Personal de Software (PSP) del desarrollador unico del proyecto: planificacion, estimacion, seguimiento, registro de defectos y retrospectiva.

Regla aplicada en todo el documento: se distingue de forma explicita entre MEDICION REAL (un comando ejecutado, una prueba corrida, un conteo verificado) y ESTIMACION RETROSPECTIVA (un valor reconstruido a posteriori, que no debe leerse como medicion). No se inventa ninguna medicion.

Fuentes: `docs/INFORME_CALIDAD_REHNIMARKET.md` (secciones 4, 5, 6), `docs/BITACORA_PSP_REHNIMARKET.md`, y la evidencia de las carpetas `evidencias/tests/`, `evidencias/security/`, `evidencias/performance/` y `evidencias/backup/`.

# 2. CALIDAD DEL SOFTWARE

La calidad de software es el grado en que el producto satisface necesidades declaradas e implicitas. Se evalua mediante un modelo de calidad, la medicion de atributos y el registro estructurado de hallazgos. En RehniMarket, que mueve stock, precios y un saldo interno (RehniCoin) equivalente a dinero, las caracteristicas de calidad prioritarias son la seguridad, la adecuacion funcional, la fiabilidad, la mantenibilidad y la usabilidad.

RehniMarket NO esta certificado en ninguna norma ISO ni evaluado formalmente en CMMI. Estos marcos se usan como guia de evaluacion, no como sello de conformidad.

# 3. MARCOS DE REFERENCIA

[[TABLA]] Marcos de referencia y su uso en este documento.

| Marco | Uso |
|---|---|
| ISO/IEC 25010 (modelo de calidad de producto) | Estructura la evaluacion en ocho caracteristicas de calidad de producto (seccion 5) |
| ISO/IEC 25000 (SQuaRE, familia de normas de calidad) | Marco general que agrupa el modelo de calidad, la medicion y la evaluacion; organiza el proceso de evaluacion (definicion de requisitos, medicion, registro, mejora) |
| CMMI (Capability Maturity Model Integration) | Referencia conceptual unicamente, para situar la madurez de las practicas de proceso (gestion de configuracion con Git y lockfiles; aseguramiento de calidad con pytest y verificaciones estaticas); sin valoracion formal ni asignacion de nivel |
| PSP (Personal Software Process) | Disciplina de trabajo individual: planificacion, estimacion de tamanio y tiempo, seguimiento del esfuerzo y registro de defectos por fase (secciones 7 a 10) |

# 4. METODOLOGIA DE EVALUACION

La evaluacion de calidad fue estatica y basada en evidencia. Tecnicas aplicadas: inspeccion de codigo (routers, servicios, repositorios, modelos, middleware, componentes), revision de arquitectura, revision de configuracion, revision de las pruebas existentes, revision de la documentacion contra el codigo, revision del manejo de errores, revision de seguridad, revision de mantenibilidad, revision responsive y revision de validaciones.

Comandos efectivamente ejecutados (MEDICION REAL). Evidencia en `evidencias/`:

[[TABLA]] Comandos ejecutados durante la evaluacion (medicion real).

| Verificacion | Comando | Resultado | Evidencia |
|---|---|---|---|
| Suite pytest completa del backend | pytest -q en un contenedor efimero | 113 passed, 783 warnings, en 622,94 s (codigo de salida 0); tres ejecuciones con el mismo resultado | evidencias/tests/pytest.txt |
| Cobertura de codigo del backend | pytest --cov=app --cov-report=term-missing | TOTAL 62 % (7516 sentencias, 2850 sin cubrir) | evidencias/tests/pytest-cov.txt |
| tsc -b frontend web | ./node_modules/.bin/tsc -b | codigo de salida 0, sin errores de tipos | evidencias/tests/frontend-tsc-eslint.txt |
| eslint frontend web | ./node_modules/.bin/eslint . | codigo de salida 0 | evidencias/tests/frontend-tsc-eslint.txt |
| vite build frontend web | vite build --outDir <tmp> | built OK; bundle principal aprox. 729 kB (aviso de chunk > 500 kB) | evidencias/tests/frontend-tsc-eslint.txt |
| tsc --noEmit app movil | ./node_modules/.bin/tsc --noEmit | codigo de salida 0 (con "strict": true) | evidencias/tests/mobile-lint.txt |
| eslint app movil | ./node_modules/.bin/eslint . | 0 errores, 3 avisos cosmeticos | evidencias/tests/mobile-lint.txt |
| pip-audit backend | uv run --group dev pip-audit | 8 vulnerabilidades en 5 paquetes; 7 corregidas (click, pip, pyasn1, pydantic-settings); 1 sin fix (ecdsa), no explotable con HS256 | evidencias/security/pip-audit.txt, reporte.json |
| pnpm audit frontend / movil | pnpm audit | frontend 7 -> 6 (bump de react-router-dom; resto de build/lint); movil 7 (transitivas de Expo) | evidencias/security/pnpm-audit-*.txt |
| Respaldo y restauracion | scripts/backup_rehnimarket.sh + scripts/restore_rehnimarket.sh | Aprobados: 37 tablas, conteos = origen, 166 objetos, alembic_version = a1b2c3d4e5f6 | evidencias/backup/ |
| Prueba de rendimiento basica | scripts/perf_test.sh | 900 solicitudes, 0 errores; catalogo p95 66,1 ms secuencial | evidencias/performance/resultado.txt |
| Muestra de aceptacion | scripts/acceptance_smoke.sh | 28/28 comprobaciones aprobadas | evidencias/acceptance/resultados.txt |

# 5. EVALUACION SEGUN ISO/IEC 25010

Se evaluaron las ocho caracteristicas del modelo de calidad de producto.

[[TABLA]] Evaluacion de las ocho caracteristicas de ISO/IEC 25010.

| Caracteristica | Evaluacion resumida | Estado |
|---|---|---|
| Adecuacion funcional | Cobertura amplia del dominio marketplace (catalogo con busqueda difusa, carrito, checkout con IVA 19 % y comision 5 %, RehniCoin, pedidos con maquina de estados, resenas condicionadas, favoritos, panel de empresa y de administracion). Reglas de negocio centralizadas (TaxConfig, PayoutConfig, pricing). Dos desviaciones documentacion frente a codigo registradas (H-14, H-15) | PARCIAL (funcionalidad extensa e implementada; consistencia documental con desviaciones registradas) |
| Eficiencia de desempeno | Linea base ejecutada el 2026-08-31: 900 solicitudes, 0 errores; catalogo p95 66 ms secuencial / 353 ms concurrente x10; busqueda y detalle p95 aprox. 26 ms. Positivo: pool_pre_ping, indice GIN de trigramas, paginacion. Negativo: bundle JS de aprox. 729 kB sin code-splitting. Plantilla k6 lista, NO ejecutada; sin SLO acordado | MEDICION BASICA REALIZADA (falta k6 + SLO) |
| Compatibilidad | Backend y clientes se comunican por HTTP/JSON con un contrato de error uniforme. El frontend web consume la misma API que la app movil. Interoperabilidad con SMTP de Gmail, MinIO (S3) y enlace de WhatsApp. Servicios aislados en contenedores | IMPLEMENTADO |
| Usabilidad | Sistema de diseno propio (primitivas de interfaz, estados de carga con Skeleton, estados vacios, alertas globales), navegacion por rol con enlaces profundos, mensajes de error en espanol provenientes del backend. 52 componentes con atributos aria-* / role. Sin pruebas de usabilidad con usuarios ni metricas (SUS, tasa de exito de tareas) | PARCIAL (buenas practicas implementadas; sin evaluacion formal) |
| Fiabilidad | Punto fuerte del proyecto: el checkout descuenta stock con un UPDATE condicional atomico por linea, ordenado de forma determinista para evitar bloqueos mutuos, y bloquea la billetera con SELECT ... FOR UPDATE; ante fallo hace rollback completo. Prueba de concurrencia (test_concurrent_checkout_of_last_unit_lets_only_one_win). Debilidades: sin monitorizacion de errores en ejecucion (sentry-sdk declarado pero no inicializado), logging minimo | PARCIAL (operaciones criticas robustas y probadas; observabilidad debil) |
| Seguridad | Autenticacion JWT (HS256) con access + refresh; middleware que revalida el estado de la cuenta y de la empresa en cada peticion; autorizacion por lista blanca de rutas por rol; hash bcrypt; secretos fuera del control de versiones. Corregido en esta entrega: CORS restringido, SECRET_KEY con placeholder, rate limiting activable y forzado en produccion, docker-compose.prod.yml endurecido, dependencias con CVE actualizadas (8 -> 1). Residual: reverse proxy con TLS para una publicacion real; MinIO de minimo privilegio | PARCIAL, mejorada en esta entrega |
| Mantenibilidad | Arquitectura por capas consistente en el backend, organizacion por funcionalidad en el frontend, tipado fuerte de extremo a extremo (Pydantic, TypeScript), migraciones versionadas en cadena lineal (10, sin ramas), configuracion centralizada, documentacion de arquitectura del subdominio de variantes. Debilidades: strict de TypeScript no activado en el frontend web; sin linter ni verificador de tipos para Python; sin integracion continua; historial de commits pobre; dependencias declaradas y no usadas | PARCIAL (estructura solida; brechas en tooling de calidad y disciplina de proceso) |
| Portabilidad | Toda la plataforma de servidor contenerizada; dependencias fijadas de forma reproducible (uv.lock, pnpm-lock.yaml); configuracion externalizada por variables de entorno. En esta entrega se anadio la configuracion de produccion, construida y probada. Limitaciones: modelos ORM atados al dialecto PostgreSQL; app movil sin empaquetado nativo | PARCIAL |

## 5.1 Subcaracteristicas evaluadas

De la evaluacion detallada del informe de calidad (seccion 7), las subcaracteristicas con evidencia son: usabilidad de construccion de la interfaz (IMPLEMENTADO), rendimiento con linea base (MEDICION BASICA), seguridad de la logica de autorizacion (PARCIAL), disponibilidad con reinicio automatico y endpoints de salud (PARCIAL, sin healthcheck en el momento del analisis, ya anadidos), mantenibilidad estructural (PARCIAL), escalabilidad posible por diseno pero no preparada ni probada (PARCIAL), compatibilidad del contrato de API unico (IMPLEMENTADO), portabilidad de la plataforma de servidor (PARCIAL), accesibilidad con atencion a la semantica pero sin auditoria formal (PARCIAL), y diseno responsive aplicado (IMPLEMENTADO).

# 6. METRICAS DISPONIBLES

Se distingue entre lo medido y lo estimado.

[[TABLA]] Metricas de calidad: reales y estimadas.

| Metrica | Valor | Tipo |
|---|---|---|
| Pruebas automatizadas del backend | 113 funciones en 7 archivos; 113/113 aprobadas | MEDICION REAL |
| Cobertura de sentencias del backend | 62 % (7516 sentencias, 2850 sin cubrir) | MEDICION REAL |
| Muestra de aceptacion contra la API | 28/28 comprobaciones aprobadas | MEDICION REAL |
| Prueba de rendimiento | 900 solicitudes, 0 errores; catalogo media 60,8 ms / p95 66,1 ms secuencial | MEDICION REAL (linea base, sin SLO) |
| Vulnerabilidades de dependencias del backend | 8 -> 1 (la restante no explotable) | MEDICION REAL |
| Verificacion estatica del frontend y de la app movil | 0 errores | MEDICION REAL |
| Restauracion de respaldo | 37 tablas y 166 objetos, conteos = origen | MEDICION REAL |
| Densidad de defectos (defectos/KLOC) | No disponible | No calculada (el conteo de defectos es retrospectivo y parcial) |
| Esfuerzo total del proyecto | aprox. 375 horas | ESTIMACION RETROSPECTIVA |
| Distribucion del esfuerzo por fase | ver seccion 9 | ESTIMACION RETROSPECTIVA |
| Duracion del proyecto | aprox. 13 semanas (2026-06-02 a 2026-08-31), con pausas | REAL (fechas de Git) |
| Numero de commits | 12 en el repositorio raiz | REAL |

# 7. PSP — PLANIFICACION Y AVISO DE HONESTIDAD

Durante el desarrollo NO se llevo un registro de tiempo en vivo (no hubo hoja de tiempos por fase ni cronometro por tarea). Por lo tanto:

- Las fechas y los hitos de este documento son REALES: provienen del historial de Git y del CHANGELOG.
- Los tiempos y esfuerzos por fase son ESTIMACIONES RETROSPECTIVAS. No deben leerse como mediciones.
- El registro de defectos se reconstruye a partir de los hallazgos ya documentados en el informe de calidad (H-01 a H-18), de los cambios "Fixed" del CHANGELOG y de los comentarios de pendiente del codigo. Es un registro a posteriori.

Esta bitacora evidencia la practica de PSP como disciplina individual (planificacion, estimacion, seguimiento, registro de defectos, retrospectiva), asumiendo abiertamente que se adopta de forma retrospectiva en este proyecto y que en el proximo debe llevarse desde el primer dia.

Alcance planificado: el backlog inicial (anexo historico) preveia alrededor de 53 historias completadas y 25 pendientes; el alcance realmente comprometido y entregado quedo consolidado en 29 historias de usuario y 65 requisitos funcionales mas 31 no funcionales. Estimacion inicial de duracion: aproximadamente 6 semanas.

# 8. PSP — SEGUIMIENTO POR HITOS REALES

Fuente: `git log` del repositorio raiz mas el CHANGELOG.

[[TABLA]] Hitos reales del proyecto.

| Fecha | Version / commit | Contenido | Fase dominante |
|---|---|---|---|
| 2026-06-02 | 1.1.0 | MinIO, pip-audit, uv, Docker funcional | Codificacion / Infra |
| 2026-06-16 | 1.1.1 | Modelos ORM, JWT access + refresh, roles, seed | Diseno + Codificacion |
| 2026-06-18 | 1.1.1b | Logica inicial de dashboards | Codificacion |
| 2026-06-19 | 1.1.2 | Endpoints del dashboard de empresa | Codificacion |
| 2026-08-01 | 4793cf7 "update 1.1" | Commit gigante: se versiono node_modules por error, corregido despues con .gitignore | Defecto de proceso (D-01) |
| 2026-08-10 | 80262e5 "version estable con bugs" | Entrega intermedia con defectos conocidos | Codificacion / pruebas insuficientes |
| 2026-08-17 | 07839d5 | Renombrado Lubix -> RehniMarket | Codificacion |
| 2026-08-27 | 3b592e0 "ver 2.0" | Refactor mayor a capas y funcionalidades (301 archivos, +24727 lineas) | Diseno + Codificacion |
| 2026-08-28 | 1fa813c "ver 2.1" | Carrito, checkout, pedidos, direcciones, favoritos, paneles | Codificacion |
| 2026-08-28 | 88e4e1a "ver 2.2" | Billetera RehniCoin, resenas, reportes, liquidaciones | Codificacion |
| 2026-08-29 | 7e5c726 "ver 2.3" | Suite de pruebas (113), checkout atomico | Pruebas |
| 2026-08-29 | 917a647 "ver 2.4" | Busqueda difusa, IVA por producto, transportadoras, anuncios visuales | Codificacion |
| 2026-08-30/31 | arbol de trabajo, sin commit | Expansion de la app movil, ajustes de esquemas, documentacion de entrega | Codificacion + Post-mortem |

Observacion de proceso: los mensajes de commit no siguen una convencion y no permiten trazar que historia de usuario cerro cada uno. Corregir en el proximo proyecto (Conventional Commits).

# 9. PSP — ESFUERZO (ESTIMACION RETROSPECTIVA)

Todos los numeros de esta seccion son estimaciones retrospectivas. Sirven para reflexion, no como medicion. Base: fechas de Git mas memoria del trabajo.

[[TABLA]] Esfuerzo estimado por fase (estimacion retrospectiva).

| Fase PSP | Esfuerzo estimado (horas) | Porcentaje |
|---|---|---|
| Planificacion | aprox. 15 | 4 % |
| Diseno (modelo de datos, arquitectura, API) | aprox. 55 | 15 % |
| Codificacion backend | aprox. 150 | 40 % |
| Codificacion frontend web | aprox. 90 | 24 % |
| Codificacion app movil | aprox. 25 | 7 % |
| Revision de codigo (autorrevision) | aprox. 10 | 3 % |
| Pruebas (suite mas manuales) | aprox. 15 | 4 % |
| Documentacion / post-mortem | aprox. 15 | 4 % |
| Total | aprox. 375 horas | 100 % (redondeado) |

Distribucion observada frente a la referencia PSP: codificacion aprox. 71 % (frente a un 50-60 % recomendado); revision de codigo aprox. 3 % (PSP sugiere 10-15 %, sub-invertido); pruebas aprox. 4 % en horas pero con alto rendimiento (113 pruebas que cubren el nucleo critico). Diseno concentrado al inicio y luego un rediseno mayor (version 2.0) que un mejor diseno inicial podria haber reducido.

[[TABLA]] Comparacion estimado inicial frente a real.

| Dimension | Estimado inicial | Real | Comentario |
|---|---|---|---|
| Duracion total | aprox. 6 semanas | aprox. 13 semanas, con pausas | +115 %: subestimacion clasica mas interrupciones |
| Numero de historias entregadas | aprox. 53 (backlog inicial) | 29 consolidadas (cobertura equivalente o mayor: 62/65 RF) | El backlog inicial estaba sobre-desglosado |
| Refactors mayores | 0 previstos | 1 grande (version 2.0) + 1 de subdominio (variantes) | Diseno inicial insuficiente |
| Cobertura de pruebas | "pruebas al final" | 113 en el backend, 0 en los clientes | Desigual |
| Deuda tecnica al cierre | — | 9 items abiertos (documentados) | Aceptable para proyecto academico; priorizada en el plan de mejora (documento 10) |

# 10. PSP — REGISTRO DE DEFECTOS

Reconstruido a posteriori. Fase de inyeccion: donde se origino. Fase de deteccion: cuando se noto. Fase de correccion: cuando (o si) se resolvio.

[[TABLA]] Registro de defectos: resumen.

| Categoria | Total | Corregidos | Abiertos |
|---|---|---|---|
| Proceso | 5 | 2 | 3 |
| Codigo (detectados y corregidos durante el desarrollo) | 4 | 4 | 0 |
| Deuda tecnica / auditoria | 11 | 5 | 6 |
| Total | 20 | 11 | 9 |

[[TABLA]] Defectos de codigo detectados y corregidos durante el desarrollo.

| ID | Defecto | Fase de inyeccion | Fase de deteccion | Correccion | Estado |
|---|---|---|---|---|---|
| D-06 | NasService hacia entrada y salida de red en el import del modulo, lo que rompia la coleccion de pytest | Codificacion (integracion MinIO) | Pruebas | Se movio a ensure_bucket() en el ciclo de vida | Corregido (version 2.4) |
| D-07 | El codigo de verificacion se creaba pero no se confirmaba en el login; la sesion lo revertia y el codigo enviado nunca coincidia | Codificacion (auth) | Pruebas manuales | database.commit() antes de responder el error | Corregido |
| D-08 | Reintentar el login de una cuenta no verificada regeneraba el codigo y reiniciaba el temporizador | Codificacion (auth) | Pruebas manuales | Regenerar solo si no hay codigo activo | Corregido |
| D-09 | Reserva de stock en el checkout no atomica (condicion de carrera en la ultima unidad) | Diseno (checkout) | Diseno de las pruebas de concurrencia | UPDATE condicional + orden determinista + FOR UPDATE en la billetera + rollback total | Corregido (version 2.3) |

Los defectos de proceso (D-01 a D-05) y los de deuda o auditoria (D-10 a D-20, correspondientes a los hallazgos H-01 a H-18) se detallan en la bitacora PSP y en el documento 09. En esta entrega se corrigieron D-01, D-10, D-11, D-13, D-15 y se atendio en gran parte D-17.

# 11. LECCIONES APRENDIDAS (PSP)

1. Aplicar PSP desde el primer dia, no al final. No se puede reconstruir un registro de tiempo fiable; lo unico recuperable son las fechas de commit.
2. El diseno de datos merece mas tiempo por adelantado. El refactor de la version 2.0 y la migracion del modelo de variantes fueron caros.
3. La revision de codigo propia estuvo sub-invertida (aprox. 3 %). Los defectos D-06, D-07 y D-08 se detectaron en pruebas cuando una lista de comprobacion los habria atrapado antes.
4. Centralizar la logica critica funciono (resolucion de precio, calculo de IVA, disponibilidad de stock). Mantener este principio.
5. La documentacion de comportamiento envejece rapido. Revisarla contra el codigo en cada entrega.
6. Convencion de commits mas matriz de trazabilidad historia-commit-prueba. Su ausencia hace la auditoria mas lenta.
7. Integracion continua, aunque sea minima. Ejecutar pytest, tsc y eslint en cada cambio habria dado una red de seguridad automatica.

# 12. LIMITACIONES DE LA EVALUACION

- El analisis fue estatico: no incluyo pruebas de penetracion, escaneo dinamico de vulnerabilidades ni pruebas de carga con herramienta especializada.
- No hay medicion formal de rendimiento (SLO) ni auditoria de accesibilidad.
- El registro de defectos y el esfuerzo por fase son retrospectivos.
- No se realiza una valoracion formal de nivel CMMI (ni se debe: el marco se usa solo como referencia).
- RehniMarket no esta certificado en ninguna norma.

# 13. PLAN DE MEJORA DEL PROCESO PERSONAL

[[TABLA]] Acciones de mejora del proceso personal para el proximo proyecto.

| # | Accion | Prioridad |
|---|---|---|
| PSP-1 | Hoja de registro de tiempo por fase desde el dia 1 | Alta |
| PSP-2 | Lista de comprobacion de revision de codigo personal (entrada/salida en imports, confirmacion antes de responder un error, concurrencia, verificacion de pertenencia, secretos) | Alta |
| PSP-3 | Convencion de commits (Conventional Commits) mas rama por funcionalidad | Media |
| PSP-4 | Integracion continua minima: pytest, tsc -b, eslint, pip-audit | Alta |
| PSP-5 | Matriz de trazabilidad historia-endpoint-prueba, mantenida en cada entrega | Media |
| PSP-6 | Registro de defectos en vivo (una entrada por defecto, con fase de inyeccion y de deteccion) | Media |
| PSP-7 | Presupuesto explicito de tiempo para el diseno de datos (al menos 15 % del total) antes de codificar | Alta |

# 14. EVIDENCIAS

[[TABLA]] Evidencias del criterio 7.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| INFORME_CALIDAD_REHNIMARKET.md | Documento | docs/ | Evaluacion ISO/IEC 25010 completa | EJECUTADO |
| BITACORA_PSP_REHNIMARKET.md | Documento | docs/ | Practica de PSP: planificacion, seguimiento, 20 defectos, esfuerzo, retrospectiva | EJECUTADO |
| tests/pytest.txt, pytest-cov.txt | Salida de comando | evidencias/tests/ | 113/113 pruebas; cobertura 62 % | EJECUTADO |
| security/pip-audit.txt, reporte.json | Salida de comando | evidencias/security/ | Auditoria de dependencias 8 -> 1 | EJECUTADO |
| performance/resultado.txt | Salida de comando | evidencias/performance/ | Linea base de rendimiento (900 solicitudes, 0 errores) | EJECUTADO |
| Captura de la salida de pytest y del informe de calidad durante la sustentacion | Captura de pantalla | docs/evidencias/07_calidad_psp/ | Presentacion ante el instructor | PENDIENTE (capturar en la sustentacion) |

# 15. CONCLUSION

RehniMarket aplica ISO/IEC 25010 como modelo de calidad de producto, con una evaluacion de las ocho caracteristicas sustentada en evidencia real, y documenta la practica de PSP del desarrollador unico (planificacion, seguimiento por hitos reales de Git, registro de 20 defectos con fase de inyeccion, deteccion y correccion, esfuerzo estimado retrospectivo y retrospectiva). El estado general de calidad es PARCIAL con mejora respecto de la evaluacion previa: las bases (arquitectura, seguridad de la logica, transaccionalidad, contenerizacion, pruebas del backend) estan bien establecidas. El documento distingue en todo momento la medicion real de la estimacion retrospectiva y declara abiertamente que el registro de tiempo PSP no se llevo en vivo.
