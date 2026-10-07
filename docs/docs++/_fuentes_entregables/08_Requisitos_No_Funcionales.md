<!-- Fuente del entregable 08 (Criterio SENA 8). RNF reales tomados de docs/RehniMarket-Requisitos.docx. No se inventan RNF. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## EVALUACION DE REQUISITOS NO FUNCIONALES

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 8 — REQUISITOS NO FUNCIONALES

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

Este documento contiene TODOS los requisitos no funcionales (RNF) reales del proyecto RehniMarket. La fuente es `docs/RehniMarket-Requisitos.docx` (secciones 5 y 6), elaborado mediante auditoria del codigo fuente actual. NO se inventan requisitos adicionales.

Para cada RNF se documenta: ID, nombre, descripcion, categoria, criterio de aceptacion, evidencia, estado y metodo de verificacion. El estado y la evidencia se presentan con el valor de la fuente y, cuando el estado real verificado del codigo actual difiere de la fuente (por ejemplo, la suite de pruebas que se anadio en la version 2.3), se anota la diferencia de forma expresa.

Nota metodologica de la fuente: el proyecto no registra mediciones de tiempos de respuesta ni pruebas de carga; cuando una categoria suele expresarse con una metrica de rendimiento, la fuente usa en su lugar un criterio verificable por revision de codigo, en vez de inventar un numero nunca medido.

# 2. RESUMEN

El proyecto define 31 requisitos no funcionales (RNF-001 a RNF-031). Estado global segun la fuente: 27 implementados, 2 parciales, 2 no implementados.

[[TABLA]] Resumen de los 31 requisitos no funcionales.

| ID | Nombre | Categoria | Estado |
|---|---|---|---|
| RNF-001 | Autenticacion basada en JWT (access + refresh token) | Seguridad | Implementado |
| RNF-002 | Renovacion silenciosa de sesion | Seguridad | Implementado |
| RNF-003 | Autorizacion centralizada por rol y por ruta | Seguridad | Implementado |
| RNF-004 | Verificacion de pertenencia (ownership) sobre los propios recursos | Seguridad | Implementado |
| RNF-005 | Cifrado irreversible de contrasenas | Seguridad | Implementado |
| RNF-006 | Verificacion de correo obligatoria | Seguridad | Implementado |
| RNF-007 | Recuperacion de contrasena por codigo de un solo uso | Seguridad | Implementado |
| RNF-008 | Secretos y credenciales fuera del codigo fuente | Seguridad | Implementado |
| RNF-009 | Almacenamiento seguro de sesion en el cliente movil | Seguridad | Implementado |
| RNF-010 | Restriccion de acciones administrativas sensibles al nivel de privilegio correcto | Seguridad | Implementado |
| RNF-011 | Paginacion en listados de volumen potencialmente alto | Rendimiento | Implementado |
| RNF-012 | Calculo de contadores agregados con una sola consulta agrupada | Rendimiento | Implementado |
| RNF-013 | Contrato de errores consistente entre backend y frontend | Usabilidad | Implementado |
| RNF-014 | Restauracion del contexto tras iniciar sesion desde una accion protegida | Usabilidad | Implementado |
| RNF-015 | Verificacion de salud del backend y su conectividad | Disponibilidad | Implementado |
| RNF-016 | Reinicio automatico de los servicios ante fallos | Confiabilidad | Implementado |
| RNF-017 | Atomicidad e idempotencia en operaciones financieras criticas | Confiabilidad | Implementado |
| RNF-018 | Arquitectura en capas consistente en todo el backend | Mantenibilidad | Implementado |
| RNF-019 | Control de versiones del esquema de base de datos | Mantenibilidad | Implementado |
| RNF-020 | Auditoria de vulnerabilidades de dependencias | Mantenibilidad | Implementado |
| RNF-021 | Servicios desacoplados y escalables de forma independiente | Escalabilidad | Implementado |
| RNF-022 | Almacenamiento de archivos independiente del servidor de aplicacion | Portabilidad | Implementado |
| RNF-023 | Configuracion externalizada por entorno | Portabilidad | Implementado |
| RNF-024 | Compilacion y tipado estricto del frontend web | Compatibilidad | Implementado |
| RNF-025 | Interfaz web adaptable a distintos tamanos de pantalla | Compatibilidad | Implementado |
| RNF-026 | Levantamiento de todo el stack con un solo comando | Despliegue | Implementado |
| RNF-027 | Verificacion estatica antes de integrar cambios en el backend | Calidad | Parcial |
| RNF-028 | Suite de pruebas automatizadas | Calidad | No implementado (en la fuente); ver nota de estado actual |
| RNF-029 | Ejecucion del cliente movil sobre Android e iOS | Compatibilidad movil | Parcial |
| RNF-030 | Adaptacion del cliente movil a distintos anchos de pantalla de telefono | Compatibilidad movil | Implementado |
| RNF-031 | Diseno diferenciado para tablet | Compatibilidad movil | No implementado |

Nota de consistencia: RNF-019 y RNF-028 en la fuente reflejan un estado anterior a la version 2.3. El estado verificado del codigo actual se anota en la ficha de cada uno (secciones 4 y 8).

# 3. CATEGORIA: SEGURIDAD

## RNF-001 — Autenticacion basada en JWT (access + refresh token)

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Toda ruta protegida exige un access token JWT valido; existe un refresh token separado para renovar la sesion. |
| Criterio de aceptacion | Una peticion sin token valido a una ruta no publica recibe 401; un token marcado type=refresh no sirve como access token y viceversa. |
| Evidencia | app/services/authentication/JWTService.py; app/middleware/AuthMiddleware.py (verify_token); evidencias/security/roles/roles_permisos.txt |
| Metodo de verificacion | Verificacion binaria (cumple / no cumple); comprobada con acceptance_smoke.sh (AC-AUTH-16, AC-AUTH-19) |
| Estado | Implementado |

## RNF-002 — Renovacion silenciosa de sesion

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | El cliente renueva el access token automaticamente ante un 401, sin pedir credenciales de nuevo. |
| Criterio de aceptacion | Una peticion que falla por token expirado se reintenta automaticamente tras renovar, de forma transparente para el usuario. |
| Evidencia | app/services/authentication/RefreshTokenService.py; POST /auth/refresh; frontend src/api/setupAuthInterceptor.ts |
| Metodo de verificacion | Verificacion binaria; refresh probado en acceptance_smoke.sh (AC-AUTH-19) |
| Estado | Implementado |

## RNF-003 — Autorizacion centralizada por rol y por ruta

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | El acceso a cada endpoint no publico esta gobernado por una lista explicita de rutas permitidas por rol. |
| Criterio de aceptacion | Un rol sin el prefijo de ruta permitido recibe 403 antes de ejecutar cualquier logica del endpoint. |
| Evidencia | app/middleware/RolePermissions.py (ROLES_PERMISSIONS_ROUTERS, FULL_ACCESS_ROLES); app/middleware/AuthMiddleware.py; evidencias/security/roles/roles_permisos.txt |
| Metodo de verificacion | Verificacion binaria; comprobada con acceptance_smoke.sh (AC-AUTH-17, AC-AUTH-17b, AC-SEC) y con la suite pytest (tokens de los 4 roles) |
| Estado | Implementado |

## RNF-004 — Verificacion de pertenencia (ownership) sobre los propios recursos

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Los servicios filtran explicitamente por el dueno real del recurso (usuario o empresa), no solo por el rol. |
| Criterio de aceptacion | Un usuario o empresa no puede leer ni modificar un pedido, direccion, producto o cuenta bancaria de otro, aunque conozca su identificador. |
| Evidencia | OrderRepository.get_user_order / get_company_order filtran por user_id / company_id; delete_product_service valida el company_id del producto |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-005 — Cifrado irreversible de contrasenas

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Las contrasenas nunca se guardan ni se comparan en texto plano. |
| Criterio de aceptacion | La base de datos solo almacena el hash de la contrasena, generado con un algoritmo de hashing con sal (bcrypt). |
| Evidencia | app/utils/Security.py (hash_password / verify_password via passlib + bcrypt) |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-006 — Verificacion de correo obligatoria

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Una cuenta no puede iniciar sesion hasta confirmar su correo con un codigo. |
| Criterio de aceptacion | Un intento de login con una cuenta no verificada es rechazado explicitamente, sin emitir tokens. |
| Evidencia | ModelUser.verified; LoginService.py; evidencias/acceptance/resultados.txt (AC-AUTH-07a) |
| Metodo de verificacion | Verificacion binaria; comprobada con acceptance_smoke.sh |
| Estado | Implementado |

## RNF-007 — Recuperacion de contrasena por codigo de un solo uso

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | El restablecimiento de contrasena usa un codigo temporal enviado por correo, no reexpone ni pide la contrasena actual. |
| Criterio de aceptacion | El codigo es de un solo uso y expira; no existe ningun endpoint que devuelva una contrasena en texto plano. |
| Evidencia | app/services/authentication/ForgotPasswordService.py; ResetPasswordService.py; app/models/ModelCode.py |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-008 — Secretos y credenciales fuera del codigo fuente

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Claves y credenciales (JWT, SMTP, base de datos, MinIO) se leen de variables de entorno, no estan escritas en el codigo. |
| Criterio de aceptacion | Ningun secreto real aparece hardcodeado en el repositorio; .env.example documenta las variables sin valores reales. |
| Evidencia | app/Config.py; RehniMarket-backend/.env.example; .gitignore y .dockerignore excluyen los .env reales |
| Metodo de verificacion | Verificacion binaria; revision de .gitignore y busqueda de secretos en el codigo |
| Estado | Implementado |

## RNF-009 — Almacenamiento seguro de sesion en el cliente movil

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Los tokens en la app movil se guardan en almacenamiento seguro del sistema operativo, nunca la contrasena. |
| Criterio de aceptacion | Los tokens persisten solo en SecureStore (Keychain / Keystore), no en almacenamiento plano. |
| Evidencia | RehniMarket-mobile/src/api/session.ts (expo-secure-store) |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-010 — Restriccion de acciones administrativas sensibles al nivel de privilegio correcto

| Campo | Valor |
|---|---|
| Categoria | Seguridad |
| Descripcion | Las capacidades exclusivas de Owner sobre cuentas admin/owner se revalidan explicitamente en el servicio, no solo se asumen por el rol. |
| Criterio de aceptacion | Una cuenta admin (no owner) que intenta modificar, bloquear o asignar el rol owner recibe un rechazo explicito. |
| Evidencia | app/services/DashboardService/admin/UserService.py |
| Metodo de verificacion | Verificacion binaria por revision de codigo; caso presencial P-ADM-04 (documento 06) |
| Estado | Implementado |

# 4. CATEGORIA: RENDIMIENTO

## RNF-011 — Paginacion en listados de volumen potencialmente alto

| Campo | Valor |
|---|---|
| Categoria | Rendimiento |
| Descripcion | Los listados de pedidos, usuarios, empresas, resenas, reportes y movimientos de billetera estan paginados, no devuelven todo el conjunto de una vez. |
| Criterio de aceptacion | Toda respuesta de listado expone page/limit/total y limita el tamanio de pagina. |
| Evidencia | *PaginatedResponse en app/schemas/**; parametros page/limit en los repositorios |
| Metodo de verificacion | Verificacion binaria por revision de codigo; no se midieron tiempos de respuesta reales |
| Estado | Implementado |

## RNF-012 — Calculo de contadores agregados con una sola consulta agrupada

| Campo | Valor |
|---|---|
| Categoria | Rendimiento |
| Descripcion | Los conteos que antes requeririan una consulta por estado o entidad se resuelven con una unica consulta agrupada. |
| Criterio de aceptacion | Un conteo por estado o categoria se resuelve con un solo query (GROUP BY), no con un bucle de consultas individuales. |
| Evidencia | OrderRepository.count_company_orders_by_status; publicService/Products.py get_catalogs_service (product_count) |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

Nota de rendimiento medido (no exigido por estos RNF pero relevante para el criterio 8): la prueba `scripts/perf_test.sh` ejecuto 900 solicitudes con 0 errores; catalogo media 60,8 ms / p95 66,1 ms secuencial; busqueda y detalle p95 aprox. 26 ms. Es una LINEA BASE, no un objetivo de nivel de servicio. La campana de carga con la herramienta k6 (`scripts/load_test.k6.js`) esta PREPARADA pero NO EJECUTADA; no existen resultados de k6 ni SLO acordados.

# 5. CATEGORIA: USABILIDAD

## RNF-013 — Contrato de errores consistente entre backend y frontend

| Campo | Valor |
|---|---|
| Categoria | Usabilidad |
| Descripcion | Todos los errores de negocio usan el mismo formato (codigo + mensaje), permitiendo que el frontend reaccione de forma consistente. |
| Criterio de aceptacion | Todo error de negocio expone un campo code perteneciente al catalogo compartido de codigos, no un mensaje libre sin clasificar. |
| Evidencia | app/core/ErrorCodes.py + app/core/Exceptions.py (api_error); frontend src/shared/types/ErrorCode.ts |
| Metodo de verificacion | Verificacion binaria; comprobada en acceptance_smoke.sh (varios codigos de error observados) |
| Estado | Implementado |

## RNF-014 — Restauracion del contexto tras iniciar sesion desde una accion protegida

| Campo | Valor |
|---|---|
| Categoria | Usabilidad |
| Descripcion | El sistema no descarta la intencion del usuario (producto, variante, cantidad, pantalla) al pedirle iniciar sesion. |
| Criterio de aceptacion | Tras autenticarse desde una accion protegida, el usuario vuelve exactamente a la pantalla o seleccion desde la que partio. |
| Evidencia | Web: src/api/session.ts (postLoginRedirect); Movil: src/api/session.ts (PendingAction) + useRequireUser.ts |
| Metodo de verificacion | Verificacion binaria por revision de codigo; caso presencial N-04 (documento 06) |
| Estado | Implementado |

# 6. CATEGORIA: DISPONIBILIDAD

## RNF-015 — Verificacion de salud del backend y su conectividad

| Campo | Valor |
|---|---|
| Categoria | Disponibilidad |
| Descripcion | Existen endpoints dedicados para comprobar que la base de datos y la conectividad de red del backend funcionan. |
| Criterio de aceptacion | Los endpoints de salud responden un estado explicito (OK / ERROR) sin requerir autenticacion. |
| Evidencia | app/routers/HealthRouter.py (/health/database, /health/internet); evidencias/deployment/03_health_endpoints.txt |
| Metodo de verificacion | Ejecucion de comando (curl) verificada el 2026-08-31 |
| Estado | Implementado |

# 7. CATEGORIA: CONFIABILIDAD

## RNF-016 — Reinicio automatico de los servicios ante fallos

| Campo | Valor |
|---|---|
| Categoria | Confiabilidad |
| Descripcion | Los contenedores de base de datos, almacenamiento y backend se reinician automaticamente si el proceso termina inesperadamente. |
| Criterio de aceptacion | La politica de reinicio de cada servicio esta configurada (restart: always en desarrollo; restart: unless-stopped en produccion). |
| Evidencia | docker-compose.yml (restart: always en minio, postgres, backend); docker-compose.prod.yml (restart: unless-stopped) |
| Metodo de verificacion | Verificacion binaria por revision de configuracion |
| Estado | Implementado |

## RNF-017 — Atomicidad e idempotencia en operaciones financieras criticas

| Campo | Valor |
|---|---|
| Categoria | Confiabilidad |
| Descripcion | El reembolso automatico al suspender una empresa no se ejecuta dos veces sobre el mismo pedido, y revierte todo ante un error. El checkout reserva stock y cobra de forma atomica. |
| Criterio de aceptacion | Reintentar la suspension sobre pedidos ya reembolsados no genera un segundo reembolso; cualquier excepcion hace rollback de la transaccion completa; ante dos compras simultaneas de la ultima unidad solo una gana. |
| Evidencia | OrderService.cancel_and_refund_company_orders_for_suspension; WalletRepository.has_order_been_refunded (guard de idempotencia); CheckoutService.py; tests/test_public_and_commerce.py::test_concurrent_checkout_of_last_unit_lets_only_one_win |
| Metodo de verificacion | Prueba automatizada ejecutada (evidencias/tests/pytest.txt, 113/113) |
| Estado | Implementado (VERIFICADO) |

# 8. CATEGORIA: MANTENIBILIDAD

## RNF-018 — Arquitectura en capas consistente en todo el backend

| Campo | Valor |
|---|---|
| Categoria | Mantenibilidad |
| Descripcion | El backend sigue de forma uniforme el patron router -> service -> repository -> model. |
| Criterio de aceptacion | Los routers son delgados (delegan a servicios); la logica de negocio vive en services; el acceso a datos vive en repository. |
| Evidencia | Estructura de app/routers, app/services, app/repository, app/models |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-019 — Control de versiones del esquema de base de datos

| Campo | Valor |
|---|---|
| Categoria | Mantenibilidad |
| Descripcion | Todo cambio de esquema queda registrado como una migracion versionada y reversible (upgrade / downgrade). |
| Criterio de aceptacion | El esquema actual puede reconstruirse desde cero encadenando las migraciones, y revertirse migracion por migracion. |
| Evidencia | alembic/versions/*.py; evidencias/deployment/08_alembic_current.txt |
| Metodo de verificacion | Ejecucion de comando (alembic current) verificada el 2026-08-31 |
| Estado | Implementado. NOTA DE CONSISTENCIA: la fuente menciona "23 migraciones" y una cabeza distinta; ese dato es anterior a la version 2.0. El estado verificado del codigo actual es de 10 migraciones lineales con cabeza a1b2c3d4e5f6. |

## RNF-020 — Auditoria de vulnerabilidades de dependencias

| Campo | Valor |
|---|---|
| Categoria | Mantenibilidad |
| Descripcion | El proyecto incluye una herramienta dedicada para detectar vulnerabilidades conocidas en sus dependencias. |
| Criterio de aceptacion | Existe un comando dedicado (pip-audit) documentado para ejecutar la auditoria. |
| Evidencia | pyproject.toml (grupo dev, pip-audit); RehniMarket-backend/app/docs/AUDITORIA.md; evidencias/security/pip-audit.txt |
| Metodo de verificacion | Ejecucion de comando (pip-audit) verificada el 2026-08-31: 8 -> 1 vulnerabilidad |
| Estado | Implementado. La fuente indicaba que no se registraba un reporte reciente; en esta entrega SI se ejecuto y se guardo la evidencia. |

# 9. CATEGORIA: ESCALABILIDAD

## RNF-021 — Servicios desacoplados y escalables de forma independiente

| Campo | Valor |
|---|---|
| Categoria | Escalabilidad |
| Descripcion | Backend, frontend, base de datos y almacenamiento de archivos son contenedores independientes, sin estado compartido en el proceso del backend. |
| Criterio de aceptacion | Cada servicio puede reiniciarse o reconstruirse sin afectar el estado interno de los demas (el estado vive en PostgreSQL y MinIO, no en memoria del backend). |
| Evidencia | docker-compose.yml (servicios minio, postgres, backend, frontend) |
| Metodo de verificacion | Verificacion binaria por revision de configuracion. Limitacion: el middleware de limitacion de tasa mantiene el conteo en memoria del proceso; para varias replicas falta un almacen compartido. La escalabilidad es posible por diseno pero NO esta preparada ni probada. |
| Estado | Implementado (posible por diseno; no probada con replicas) |

# 10. CATEGORIA: PORTABILIDAD

## RNF-022 — Almacenamiento de archivos independiente del servidor de aplicacion

| Campo | Valor |
|---|---|
| Categoria | Portabilidad |
| Descripcion | Las imagenes y certificados no se guardan en el disco del contenedor del backend, sino en un almacen de objetos aparte (MinIO). |
| Criterio de aceptacion | El backend puede recrearse sin perder ningun archivo subido, siempre que el volumen de MinIO se conserve. |
| Evidencia | app/services/NasService.py (cliente MinIO); docker-compose.yml (servicio minio + volumen dedicado) |
| Metodo de verificacion | Verificacion binaria por revision de codigo; respaldo y restauracion de MinIO probados (evidencias/backup/) |
| Estado | Implementado |

## RNF-023 — Configuracion externalizada por entorno

| Campo | Valor |
|---|---|
| Categoria | Portabilidad |
| Descripcion | Ningun host, credencial ni URL de otro servicio esta fijado en el codigo; todo se lee de variables de entorno. |
| Criterio de aceptacion | El mismo codigo corre en un entorno distinto (otro host de base de datos, otra URL de frontend) sin modificar una sola linea, solo el .env. |
| Evidencia | app/Config.py; RehniMarket-backend/.env.example; docker-compose.prod.yml usa .env.prod |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

# 11. CATEGORIA: COMPATIBILIDAD (WEB)

## RNF-024 — Compilacion y tipado estricto del frontend web

| Campo | Valor |
|---|---|
| Categoria | Compatibilidad |
| Descripcion | El frontend web compila sin errores de tipos y pasa lint antes de considerarse listo para desplegar. |
| Criterio de aceptacion | tsc -b --noEmit y eslint . terminan sin errores. |
| Evidencia | evidencias/tests/frontend-tsc-eslint.txt |
| Metodo de verificacion | Ejecucion de comando verificada el 2026-08-31: ambos comandos codigo de salida 0. Nota: strict de TypeScript NO esta activado en el tsconfig del frontend (hallazgo H-06); si en la app movil. |
| Estado | Implementado (compila y pasa lint; strict no activado) |

## RNF-025 — Interfaz web adaptable a distintos tamanos de pantalla

| Campo | Valor |
|---|---|
| Categoria | Compatibilidad |
| Descripcion | Los componentes del frontend web usan clases responsive para adaptarse de movil a escritorio. |
| Criterio de aceptacion | Los layouts cambian de disposicion segun el ancho de pantalla (breakpoints sm:/md:/lg:). |
| Evidencia | 44 archivos .tsx del frontend usan al menos un breakpoint responsive de Tailwind |
| Metodo de verificacion | Verificacion estatica por conteo; ejecucion en dispositivos PENDIENTE (casos presenciales P-RESP-01/02, documento 06) |
| Estado | Implementado (verificacion estatica; sin prueba visual automatizada) |

# 12. CATEGORIA: DESPLIEGUE

## RNF-026 — Levantamiento de todo el stack con un solo comando

| Campo | Valor |
|---|---|
| Categoria | Despliegue |
| Descripcion | PostgreSQL, MinIO, backend y frontend se orquestan juntos via Docker Compose, sin pasos manuales adicionales de instalacion. |
| Criterio de aceptacion | "docker compose up -d" deja los cuatro servicios corriendo y comunicados entre si. |
| Evidencia | docker-compose.yml; evidencias/deployment/01_docker_compose_ps.txt |
| Metodo de verificacion | Ejecucion de comando verificada el 2026-08-31: 4 servicios Up, 3 healthy |
| Estado | Implementado (VERIFICADO) |

# 13. CATEGORIA: CALIDAD

## RNF-027 — Verificacion estatica antes de integrar cambios en el backend

| Campo | Valor |
|---|---|
| Categoria | Calidad |
| Descripcion | El codigo Python del backend puede compilarse e importarse sin errores de sintaxis antes de aplicarlo. |
| Criterio de aceptacion | py_compile y la resolucion de relaciones de SQLAlchemy (configure_mappers) terminan sin errores sobre los modulos tocados. |
| Evidencia | Revision manual + py_compile ad-hoc. NO existe un linter ni un verificador de tipos configurado para el backend (ruff / mypy / black ausentes, hallazgo H-07) |
| Metodo de verificacion | Verificacion manual / py_compile |
| Estado | Parcial (no hay tooling automatizado de verificacion estatica para Python) |

## RNF-028 — Suite de pruebas automatizadas

| Campo | Valor |
|---|---|
| Categoria | Calidad |
| Descripcion | El proyecto cuenta con pruebas automaticas (unitarias / integracion) que se ejecutan antes de cada cambio. |
| Criterio de aceptacion | Un comando unico (pytest) ejecuta la suite y reporta resultados. |
| Evidencia | RehniMarket-backend/tests/ (7 archivos, 113 funciones); evidencias/tests/pytest.txt (113 passed); pytest-cov.txt (cobertura 62 %) |
| Metodo de verificacion | Ejecucion de comando verificada el 2026-08-31 |
| Estado | En la fuente: No implementado (la fuente es anterior a la version 2.3). ESTADO ACTUAL VERIFICADO: Implementado en el backend (113/113 pruebas). NO existen pruebas automatizadas en el frontend web ni en la app movil (hallazgo H-05). |

# 14. CATEGORIA: COMPATIBILIDAD MOVIL

## RNF-029 — Ejecucion del cliente movil sobre Android e iOS

| Campo | Valor |
|---|---|
| Categoria | Compatibilidad movil |
| Descripcion | La app movil esta construida con Expo / React Native, orientada a correr en ambas plataformas. |
| Criterio de aceptacion | El proyecto expone scripts dedicados para iniciar en Android e iOS y usa exclusivamente APIs multiplataforma de Expo / React Native. |
| Evidencia | RehniMarket-mobile/package.json (scripts android / ios / web, dependencia expo) |
| Metodo de verificacion | Configuracion presente; NO hay evidencia en el repositorio de una ejecucion verificada en un dispositivo o emulador real. No hay empaquetado nativo (sin eas.json, sin android/ ni ios/) |
| Estado | Parcial |

## RNF-030 — Adaptacion del cliente movil a distintos anchos de pantalla de telefono

| Campo | Valor |
|---|---|
| Categoria | Compatibilidad movil |
| Descripcion | Las pantallas implementadas (Home, detalle de producto) calculan sus dimensiones en funcion del ancho real del dispositivo. |
| Criterio de aceptacion | Los elementos de ancho variable (carrusel de banners, galeria de imagenes) se recalculan a partir del ancho de la ventana, no de un valor fijo. |
| Evidencia | RehniMarket-mobile/src/screens/home/components/BannerCarousel.tsx; ProductGallery.tsx (Dimensions.get) |
| Metodo de verificacion | Verificacion binaria por revision de codigo |
| Estado | Implementado |

## RNF-031 — Diseno diferenciado para tablet

| Campo | Valor |
|---|---|
| Categoria | Compatibilidad movil |
| Descripcion | Las pantallas del cliente movil ofrecerian una disposicion distinta (mas columnas, otro layout) en pantallas de tablet. |
| Criterio de aceptacion | Existiria al menos un punto de quiebre de layout especifico para anchos de tablet. |
| Evidencia | No se encontro uso de useWindowDimensions ni breakpoints de tablet en RehniMarket-mobile/src; las grillas de producto usan un numero fijo de columnas |
| Metodo de verificacion | Busqueda en el codigo: no aplica |
| Estado | No implementado |

# 15. EVIDENCIAS

[[TABLA]] Evidencias del criterio 8.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| RehniMarket-Requisitos.docx (secciones 5 y 6) | Documento | docs/ | Los 31 RNF reales con descripcion, criterio de aceptacion y estado | EJECUTADO |
| tests/pytest.txt, pytest-cov.txt | Salida de comando | evidencias/tests/ | RNF-017, RNF-028 (backend): pruebas ejecutadas | EJECUTADO |
| security/pip-audit.txt | Salida de comando | evidencias/security/ | RNF-020: auditoria de dependencias ejecutada | EJECUTADO |
| performance/resultado.txt | Salida de comando | evidencias/performance/ | Linea base de rendimiento (RNF-011, RNF-012 en contexto) | EJECUTADO |
| deployment/01, 03, 08 | Salida de comando | evidencias/deployment/ | RNF-015, RNF-016, RNF-019, RNF-026 | EJECUTADO |
| security/roles/roles_permisos.txt | Salida de comando | evidencias/security/ | RNF-001, RNF-003 | EJECUTADO |
| tests/frontend-tsc-eslint.txt, mobile-lint.txt | Salida de comando | evidencias/tests/ | RNF-024, RNF-027 | EJECUTADO |
| scripts/load_test.k6.js | Codigo fuente (plantilla) | scripts/ | Campana de carga preparada | NO EJECUTADA (sin resultados k6 ni SLO) |
| Auditoria de accesibilidad (WCAG / axe / Lighthouse) | Reporte | docs/evidencias/08_rnf/ | Cumplimiento de accesibilidad | NO REALIZADA |
| Pruebas responsive en dispositivos reales | Captura / video | docs/evidencias/08_rnf/ | RNF-025, RNF-030 | PENDIENTE (documento 06) |

# 16. LO QUE FALTA PARA COMPLETAR EL CRITERIO 8

- Ejecutar la campana de carga con la herramienta k6 (`scripts/load_test.k6.js`) y acordar objetivos de nivel de servicio (SLO). ESTADO: NO EJECUTADO. La plantilla esta lista.
- Realizar una auditoria formal de accesibilidad (WCAG / axe / Lighthouse) del frontend. ESTADO: NO REALIZADA.
- Ejecutar las pruebas responsive en dispositivos y resoluciones reales (documento 06). ESTADO: PENDIENTE.
- Configurar un linter y un verificador de tipos para el backend Python (RNF-027). ESTADO: PENDIENTE.
- Anadir pruebas automatizadas al frontend web y a la app movil (RNF-028). ESTADO: PENDIENTE.

# 17. CONCLUSION

RehniMarket define 31 requisitos no funcionales derivados del codigo real. Segun la fuente, 27 estan implementados, 2 son parciales y 2 no estan implementados; con el estado verificado del codigo actual, RNF-028 pasa a implementado en el backend (113 pruebas ejecutadas) y RNF-020 cuenta con evidencia reciente. Las brechas del criterio 8 se concentran en actividades no ejecutadas y claramente identificadas: la campana de carga con k6 y los SLO, la auditoria de accesibilidad, las pruebas responsive en dispositivos, el tooling de verificacion estatica de Python y las pruebas de cliente. No se inventa ningun requisito ni ninguna medicion.
