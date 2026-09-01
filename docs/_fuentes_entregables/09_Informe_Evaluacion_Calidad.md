<!-- Fuente del entregable 09 (Criterio SENA 9). Hallazgos reales H-01..H-18. No se ocultan hallazgos. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## INFORME DE EVALUACION DE CALIDAD DEL SOFTWARE

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 9 — REGISTRO E INFORME DE EVALUACION DE CALIDAD

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

Este es el informe de evaluacion de calidad de RehniMarket. Documenta la metodologia de evaluacion, las pruebas realizadas, el registro estructurado de hallazgos (positivos y negativos), los defectos, las correcciones aplicadas y el estado posterior, el resultado de la evaluacion segun ISO/IEC 25010, las limitaciones y las lecciones aprendidas.

Este informe NO oculta hallazgos. Cada hallazgo negativo se marca con uno de los estados: RESUELTO, PARCIAL, PENDIENTE o NO APLICA.

Fuente: `docs/INFORME_CALIDAD_REHNIMARKET.md` y la evidencia de la carpeta `evidencias/`.

Vocabulario de estado: IMPLEMENTADO (el codigo existe y es coherente); VERIFICADO (ademas de existir, se comprobo su comportamiento durante el analisis); PARCIAL (implementado con limitaciones o solo en una parte del sistema); NO VERIFICADO (existe pero su funcionamiento no se comprobo); PENDIENTE (no existe; es alcance futuro o mejora).

# 2. METODOLOGIA DE EVALUACION

La evaluacion fue estatica y basada en evidencia. Tecnicas aplicadas sobre el repositorio: inspeccion de codigo, revision de arquitectura, revision de configuracion, revision de las pruebas existentes, revision de la documentacion contra el codigo, revision del manejo de errores, revision de seguridad, revision de mantenibilidad, revision responsive y revision de validaciones.

Alcance analizado: backend (24 routers, 28 modulos de modelo, servicios, repositorios, 29 esquemas, alembic con 10 migraciones), frontend web (11 funcionalidades, aprox. 166 componentes), aplicacion movil (aprox. 38 pantallas), base de datos, Docker e infraestructura, APIs, seguridad, pruebas y documentacion.

Fuera del alcance: pruebas de penetracion, escaneo dinamico de vulnerabilidades, analisis de composicion de software automatizado ejecutado, pruebas de carga o estres, pruebas de usabilidad con usuarios, y validacion funcional exhaustiva de cada flujo en ejecucion.

No se afirma que el software sea seguro al 100 % ni libre de errores. Los hallazgos reflejan lo observable en el codigo a la fecha.

# 3. PRUEBAS REALIZADAS

[[TABLA]] Pruebas y verificaciones ejecutadas (2026-08-31).

| Verificacion | Resultado | Evidencia |
|---|---|---|
| Suite pytest completa del backend | 113 passed, 783 warnings, en 622,94 s (codigo de salida 0). Tres ejecuciones con el mismo resultado. Los avisos son de la deprecacion de datetime.utcnow(), sin efecto funcional | evidencias/tests/pytest.txt |
| Cobertura de codigo del backend | TOTAL 62 % (7516 sentencias, 2850 sin cubrir). Sin umbral fijado aun (accion AP-03) | evidencias/tests/pytest-cov.txt |
| tsc -b y eslint frontend web | Ambos codigo de salida 0, sin errores | evidencias/tests/frontend-tsc-eslint.txt |
| vite build frontend web | Compila; bundle principal aprox. 729 kB (aviso de chunk > 500 kB) | evidencias/tests/frontend-tsc-eslint.txt |
| tsc --noEmit y eslint app movil | tsc 0 (con strict activado); eslint 0 errores, 3 avisos cosmeticos | evidencias/tests/mobile-lint.txt |
| pip-audit backend | 8 vulnerabilidades -> 1 tras actualizar 4 paquetes; la restante (ecdsa) sin parche y no explotable (HS256) | evidencias/security/pip-audit.txt, reporte.json |
| pnpm audit frontend / movil | frontend 7 -> 6 (bump de react-router-dom; resto de build/lint); movil 7 (transitivas de Expo) | evidencias/security/pnpm-audit-*.txt |
| Autorizacion por rol contra la API | 401 sin token; 403 comprador hacia admin/empresa/recarga; 200 en rutas permitidas | evidencias/security/roles/roles_permisos.txt |
| Muestra de aceptacion contra la API | 28/28 comprobaciones aprobadas | evidencias/acceptance/resultados.txt |
| Respaldo y restauracion | Aprobados: 37 tablas, conteos = origen, 166 objetos, alembic_version = a1b2c3d4e5f6 | evidencias/backup/ |
| Prueba de rendimiento basica | 900 solicitudes, 0 errores; catalogo p95 66,1 ms secuencial | evidencias/performance/resultado.txt |
| Despliegue completo (stack dev) | 4 servicios Up; salud OK; /docs 200; alembic current a1b2c3d4e5f6 (head) | evidencias/deployment/ |

# 4. INVENTARIO DE PRUEBAS AUTOMATIZADAS

Solo el backend tiene pruebas automatizadas. El frontend web y la app movil no tienen ningun archivo de prueba (hallazgo H-05).

[[TABLA]] Pruebas automatizadas del backend por archivo.

| Archivo | Funciones test_ | Area que cubre |
|---|---|---|
| test_public_and_commerce.py | 21 | Catalogo publico, detalle de producto, imagen inicial, carrito y checkout, descuento de stock atomico, concurrencia, snapshot de pedido |
| test_catalog_attributes.py | 24 | Atributos de catalogo y opciones (administracion) |
| test_variants.py | 22 | Generacion y resolucion de variantes de producto |
| test_product_search.py | 15 | Busqueda difusa (pg_trgm / unaccent) |
| test_offers_and_new.py | 14 | Secciones "Ofertas" y "Novedades", precio de tarjeta con descuento |
| test_advertisements.py | 10 | Anuncios del Home y segmentacion |
| test_pricing.py | 7 | Resolucion de precio (descuentos de producto y de variante, ventana temporal) |
| Total | 113 | En 25 clases de prueba |

Tipo: pruebas de servicio / integracion ligera. `tests/conftest.py` crea una base `rehnimarket_test` en el mismo PostgreSQL, construye el esquema con `Base.metadata.create_all`, replica las extensiones `pg_trgm` / `unaccent` y usa el cliente de pruebas de FastAPI. Ejercitan la logica de negocio contra una base de datos real, sin levantar la aplicacion completa ni MinIO ni SMTP. NO existen pruebas de API de extremo a extremo, de frontend, de movil, de contrato ni de navegador.

# 5. REGISTRO DE HALLAZGOS POSITIVOS

[[TABLA]] Hallazgos positivos.

| ID | Hallazgo | Categoria | Estado |
|---|---|---|---|
| P-01 | Arquitectura por capas consistente en el backend (router -> service -> repository -> model) | Mantenibilidad | VERIFICADO (por inspeccion) |
| P-02 | Reserva de stock en el checkout atomica y segura ante concurrencia (UPDATE condicional, orden determinista, rollback total) con prueba de concurrencia | Fiabilidad | VERIFICADO (prueba ejecutada) |
| P-03 | Autorizacion por rol con revalidacion en cada peticion del estado de la cuenta y de la empresa | Seguridad | VERIFICADO (por inspeccion) |
| P-04 | Contrato de error uniforme con 102 codigos catalogados y manejo centralizado en el cliente | Compatibilidad / Usabilidad | IMPLEMENTADO |
| P-05 | Reglas de negocio centralizadas y parametrizadas (IVA 19 %, comision 5 %, precios) | Adecuacion funcional / Mantenibilidad | IMPLEMENTADO |
| P-06 | Migraciones de base de datos versionadas en cadena lineal, aplicadas al arranque | Mantenibilidad / Portabilidad | IMPLEMENTADO |
| P-07 | Contenerizacion completa de la plataforma de servidor con dependencias fijadas | Portabilidad | IMPLEMENTADO |
| P-08 | Suite de 113 pruebas de servicio / integracion en el backend contra PostgreSQL real | Pruebas | VERIFICADO (113/113 pasan) |
| P-09 | Frontend: tsc -b y eslint pasan sin errores; el build de produccion compila | Mantenibilidad | VERIFICADO |
| P-10 | Diseno responsivo aplicado y atencion a accesibilidad (52 componentes con aria-*) | Responsive / Accesibilidad | IMPLEMENTADO |
| P-11 | Hash de contrasenas con bcrypt; secretos fuera del control de versiones | Seguridad | IMPLEMENTADO |
| P-12 | Documentacion de arquitectura del subdominio mas complejo (variantes) y del procedimiento de auditoria | Documentacion | IMPLEMENTADO |
| P-13 | El codigo senala explicitamente pendientes conocidos (comentarios de pendiente), lo que evidencia seguimiento de deuda tecnica | Proceso / Mantenibilidad | IMPLEMENTADO |

# 6. REGISTRO DE HALLAZGOS NEGATIVOS

Estados usados: RESUELTO (corregido en esta entrega y verificado), PARCIAL (atendido parcialmente o mitigado), PENDIENTE (no atendido), NO APLICA.

[[TABLA]] Hallazgos negativos H-01 a H-18.

| ID | Hallazgo | Categoria | Severidad | Estado |
|---|---|---|---|---|
| H-01 | CORS abierto a cualquier origen con credenciales habilitadas | Seguridad | Medio | RESUELTO (allow_origins desde URL_FRONTEND + locales; allow_credentials coherente) |
| H-02 | Middleware de limitacion de tasa implementado pero desactivado | Seguridad | Bajo | PARCIAL (activable con RATE_LIMIT_ENABLED; forzado a true en produccion; falta almacen compartido para varias replicas) |
| H-03 | Sin TLS en el Compose de desarrollo; MinIO con secure=False en red interna | Seguridad / Infraestructura | Medio (publicacion real) | PARCIAL (docker-compose.prod.yml asume un reverse proxy TLS por delante, no incluido; depende del dominio) |
| H-04 | SECRET_KEY de ejemplo trivial en la plantilla | Seguridad | Bajo (documental) | RESUELTO (.env.example y .env.prod.example con placeholder e instruccion openssl rand -hex 32) |
| H-05 | Sin pruebas automatizadas en el frontend ni en la app movil | Pruebas | Medio | PENDIENTE |
| H-06 | strict de TypeScript no activado en el frontend web (si en la app movil) | Mantenibilidad | Bajo | PENDIENTE (config.; activarlo puede requerir resolver muchos errores de tipo) |
| H-07 | Sin linter ni verificador de tipos para el backend Python (ruff / mypy / black ausentes) | Mantenibilidad | Bajo | PENDIENTE |
| H-08 | README.md y CHANGELOG.md del backend obsoletos (nombre "Lubix", version antigua) | Documentacion | Bajo | RESUELTO (ambos reescritos al estado real; nota historica sobre Lubix) |
| H-09 | Desalineacion entre el .env real y el .env.example (nombres de seed, variable IP no usada) | Configuracion / Mantenibilidad | Bajo | PARCIAL (documentado en el Manual Tecnico seccion 22) |
| H-10 | Sin integracion continua: las verificaciones dependen de ejecucion manual | Proceso | Bajo | PENDIENTE |
| H-11 | Historial de commits pobre (12 commits, mensajes sin convencion) | Proceso / Mantenibilidad | Bajo | PENDIENTE (recogido en el plan de mejora del proceso personal, PSP-3) |
| H-12 | Logging minimo; monitor de errores (sentry-sdk) declarado pero no inicializado | Fiabilidad / Observabilidad | Bajo | PARCIAL |
| H-13 | Dependencias declaradas y no usadas: sentry-sdk (backend), react-device-detect (frontend) | Mantenibilidad | Bajo | PENDIENTE |
| H-14 | Documentacion desviada: HU-025 describe anuncios con texto; el codigo los define como banners solo visuales (migracion d4e5f6a7b8c9) | Adecuacion funcional / Documentacion | Bajo | PARCIAL (el codigo es la fuente; los manuales ya reflejan banners visuales; falta corregir el texto de la HU) |
| H-15 | Documentacion desviada: HU-004 dice que una empresa pendiente puede iniciar sesion; el codigo lo bloquea con COMPANY_PENDING | Adecuacion funcional / Documentacion | Bajo | PARCIAL (el codigo es la fuente; falta corregir el texto de la HU) |
| H-16 | build_media_url() devolvia una IP fija hardcodeada, ignorando URL_BACKEND | Portabilidad | Bajo | RESUELTO (MEDIA_BASE_URL = config.URL_BACKEND or fallback) |
| H-17 | Solo existia una configuracion de docker-compose orientada a desarrollo | Portabilidad / Disponibilidad | Bajo | PARCIAL (docker-compose.prod.yml + Dockerfile.prod creados, construidos y probados en aislado; falta el despliegue real con TLS) |
| H-18 | App movil sin empaquetado nativo configurado (sin eas.json, sin android/ ni ios/) | Portabilidad | Bajo | PENDIENTE |

## 6.1 Resumen del estado de los hallazgos negativos

[[TABLA]] Distribucion de los hallazgos negativos por estado.

| Estado | Cantidad | Hallazgos |
|---|---|---|
| RESUELTO | 4 | H-01, H-04, H-08, H-16 |
| PARCIAL | 6 | H-02, H-03, H-09, H-12, H-17, y (H-14 / H-15 como par de documentacion) |
| PENDIENTE | 7 | H-05, H-06, H-07, H-10, H-11, H-13, H-18 |
| NO APLICA | 0 | — |

Nota: H-14 y H-15 son desviaciones de documentacion cuyo codigo esta implementado correctamente; se cuentan como PARCIAL porque falta corregir el texto de dos historias de usuario.

# 7. EVALUACION DE SEGURIDAD Y SEVERIDAD

[[TABLA]] Resumen de severidad de los hallazgos de seguridad (actualizado 2026-08-31).

| Severidad | Cantidad | Detalle |
|---|---|---|
| Critico | 0 | — |
| Alto | 0 | — |
| Medio | 1 | S-11 (TLS): solo para una publicacion real; el reverse proxy TLS depende del dominio |
| Bajo | 4 | S-10 (limitacion de tasa en memoria), S-12 (credenciales root de MinIO), S-14 (observabilidad de errores), S-15 (puertos publicados en desarrollo) |
| Positivo | resto | S-01 a S-08, S-16; S-09 (CORS), S-13 (SECRET_KEY) y S-17 (auditoria de dependencias) pasaron a Positivo tras las correcciones de esta entrega |

Ninguno de los hallazgos residuales es explotable de forma trivial en el entorno de aula o de demostracion local.

# 8. DEFECTOS Y CORRECCIONES

## 8.1 Defectos corregidos en esta entrega

[[TABLA]] Correcciones aplicadas en la entrega y su verificacion.

| Correccion | Hallazgo | Archivo | Verificacion |
|---|---|---|---|
| CORS restringido a URL_FRONTEND + origenes locales | H-01 | app/middleware/CorsMiddleware.py | 113/113 pytest siguen pasando; el frontend usa Authorization: Bearer, no cookies |
| build_media_url() usa config.URL_BACKEND | H-16 | app/services/NasService.py | Comportamiento identico en el entorno actual |
| Limitacion de tasa activable por RATE_LIMIT_ENABLED (default false) | H-02 | app/Config.py, app/main.py, app/middleware/RateLimitMiddleware.py | Nulo por defecto; forzado a true en docker-compose.prod.yml |
| SECRET_KEY con placeholder e instruccion | H-04 | .env.example, .env.prod.example | Solo plantilla |
| README.md y CHANGELOG.md reescritos | H-08 | RehniMarket-backend/ | Solo documentacion |
| Comprobaciones de salud en docker-compose.yml | (mejora AP-08) | docker-compose.yml | Informativo, sin condition: service_healthy en dev |
| Dependencias con CVE actualizadas (8 -> 1) | S-17 | pyproject.toml, uv.lock; frontend package.json, pnpm-lock.yaml | 113/113 pytest; tsc / eslint / vite build OK |
| Configuracion de produccion (docker-compose.prod.yml, Dockerfile.prod, nginx.conf, .env.prod.example) | H-17 | raiz y RehniMarket-frontend/ | Construida y probada en un proyecto Compose aislado |

## 8.2 Estado posterior a las correcciones

Tras las correcciones del 2026-08-31, el trabajo restante que requiere una persona o un servidor es: pruebas de aceptacion con usuario final, capacitacion y acta firmada (criterio 6); despliegue real con reverse proxy TLS (criterio 3); y campana de carga con k6, SLO y auditoria de accesibilidad (criterio 8). El resto (integracion continua, pruebas de cliente, umbral de cobertura, usuario de MinIO de minimo privilegio, correccion del texto de dos historias de usuario) esta en el plan de mejora continua (documento 10) con horizonte asignado.

# 9. RESULTADO DE LA EVALUACION SEGUN ISO/IEC 25010

[[TABLA]] Estado final por caracteristica.

| Caracteristica | Estado |
|---|---|
| Adecuacion funcional | PARCIAL — cobertura funcional amplia e implementada; 2 desviaciones documentacion frente a codigo; sin trazabilidad historia-prueba |
| Eficiencia de desempeno | MEDICION BASICA REALIZADA — 900 solicitudes, 0 errores; sin SLO; k6 no ejecutado |
| Compatibilidad | IMPLEMENTADO — contrato de API unico para web y movil; integraciones SMTP / MinIO / WhatsApp |
| Usabilidad | PARCIAL — sistema de diseno y estados de interfaz implementados; sin evaluacion formal con usuarios |
| Fiabilidad | PARCIAL — checkout atomico probado; observabilidad minima |
| Seguridad | PARCIAL, mejorada — autenticacion y autorizacion solidas; CORS, SECRET_KEY, build_media_url y dependencias con CVE corregidos; pendiente el reverse proxy TLS y MinIO de minimo privilegio |
| Mantenibilidad | PARCIAL — arquitectura solida y tipado fuerte; sin integracion continua, sin linter Python, strict off en el frontend |
| Portabilidad | PARCIAL — contenerizada y reproducible; configuracion de produccion construida y probada; app movil sin empaquetado |
| Pruebas | PARCIAL — 113/113 en el backend; 0 en frontend y movil; cobertura 62 %; sin integracion continua |
| Documentacion | Mejorada — despliegue, manual tecnico, manual de usuario, migracion, pruebas, calidad, bitacora PSP; README y CHANGELOG del backend corregidos |

Ninguna area se califica como NO IMPLEMENTADA.

# 10. LIMITACIONES DE ESTE INFORME

- El analisis fue estatico: no incluyo pruebas de penetracion, escaneo dinamico ni pruebas de carga con herramienta especializada.
- No hay medicion formal de rendimiento (SLO) ni auditoria de accesibilidad.
- La ejecucion completa de la suite se realizo, pero no se ha ejecutado una prueba de aceptacion con un usuario final.
- No hay evidencia de una evaluacion de calidad previa formal; esta es la primera. Se recomienda repetir la evaluacion de forma periodica.

# 11. LECCIONES APRENDIDAS

1. Centralizar la configuracion evita errores y facilita la portabilidad; tambien obliga a mantener la plantilla al dia.
2. La separacion frontend/backend con un contrato de error explicito reduce el acoplamiento; ese contrato debe tener una unica fuente de verdad (hoy los codigos estan triplicados y se sincronizan a mano).
3. Las operaciones que afectan dinero y stock deben resolverse en el servidor de forma atomica; el frontend solo deshabilita botones como conveniencia. Es la decision de diseno mas valiosa del proyecto.
4. La validacion de stock debe informar sin bloquear todo el flujo (etiquetas "Agotado" / "Sin stock suficiente", boton de pago deshabilitado solo cuando corresponde, posibilidad de eliminar la linea).
5. El tipado fuerte de extremo a extremo detecta errores antes de ejecutar; aplicar el mismo rigor en todas partes (hoy el frontend no usa strict y no tiene pruebas).
6. Documentar la arquitectura del subdominio mas complejo paga; la documentacion de comportamiento envejece mas rapido que la de arquitectura y necesita revision periodica.
7. La reutilizacion de componentes y de un cliente HTTP unico simplifica el mantenimiento.
8. La contenerizacion desde el inicio hace reproducible el entorno; mantener una sola configuracion (desarrollo) dejo el despliegue de produccion como deuda.

# 12. EVIDENCIAS

[[TABLA]] Evidencias del criterio 9.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| INFORME_CALIDAD_REHNIMARKET.md | Documento | docs/ | Informe de evaluacion de calidad completo (hallazgos, lecciones, matriz, estado final) | EJECUTADO |
| tests/pytest.txt, pytest-cov.txt | Salida de comando | evidencias/tests/ | 113/113 pruebas; cobertura 62 % | EJECUTADO |
| security/pip-audit.txt, reporte.json, pnpm-audit-*.txt | Salida de comando | evidencias/security/ | Auditoria de dependencias y su reduccion | EJECUTADO |
| acceptance/resultados.txt | Salida de comando | evidencias/acceptance/ | Muestra de aceptacion 28/28 | EJECUTADO |
| performance/resultado.txt | Salida de comando | evidencias/performance/ | Linea base de rendimiento | EJECUTADO |
| backup/ (todos) | Salida de comando | evidencias/backup/ | Respaldo y restauracion aprobados | EJECUTADO |
| Captura de la salida de pytest y del informe durante la sustentacion | Captura de pantalla | docs/evidencias/09_evaluacion/ | Presentacion ante el instructor | PENDIENTE (capturar en la sustentacion) |

# 13. CONCLUSION

RehniMarket cuenta con un proceso de evaluacion de calidad reproducible: metodologia declarada, comandos realmente ejecutados con sus salidas versionadas en `evidencias/`, y un registro estructurado de 13 hallazgos positivos y 18 hallazgos negativos con estado explicito (4 RESUELTOS, 6 PARCIALES, 7 PENDIENTES, 0 NO APLICA). El estado general de calidad es PARCIAL con mejora respecto de la evaluacion previa. No se oculta ningun hallazgo y no se afirma que el software sea seguro al 100 % ni libre de errores.
