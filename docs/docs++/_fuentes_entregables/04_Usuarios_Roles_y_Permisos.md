<!-- Fuente del entregable 04 (Criterio SENA 4). Solo informacion verificable. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## GESTION DE USUARIOS, ROLES Y PERMISOS

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 4 — GESTION DE USUARIOS Y PERMISOS

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

# LISTA DE FIGURAS

<!-- LISTA-FIGURAS -->

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

Este documento describe la gestion de identidades y de control de acceso de RehniMarket: los usuarios y sus roles, la autenticacion con JSON Web Tokens (JWT) y tokens de refresco, la autorizacion por rol y por ruta, la proteccion de los endpoints, las restricciones especificas de cada rol, la recuperacion de contrasena y la verificacion de cuenta, con casos de acceso permitido y de acceso rechazado y sus evidencias reproducibles.

Fuentes: `app/middleware/AuthMiddleware.py`, `app/middleware/RolePermissions.py`, `app/middleware/PublicRoutes.py`, `app/services/authentication/`, `app/utils/Security.py`, `app/models/`, `docs/MANUAL_TECNICO_REHNIMARKET.md` §12-14, `docs/MANUAL_USUARIO_REHNIMARKET.md` §4, y la evidencia `evidencias/security/roles/roles_permisos.txt` y `evidencias/acceptance/resultados.txt`.

# 2. USUARIOS Y ROLES

## 2.1 Roles del sistema

RehniMarket define cinco roles. Los roles se crean en la carga inicial de datos (`app/utils/seed.py`).

[[TABLA]] Roles del sistema.

| Rol | Identificador | Como se obtiene | Alcance |
|---|---|---|---|
| Visitante | (sin sesion) | No requiere cuenta | Catalogo publico, busqueda, categorias, ofertas, novedades, detalle de producto, perfil publico de empresa (web) |
| Usuario (comprador) | user | Registro de comprador + verificacion de correo | Carrito, checkout, pedidos, favoritos, resenas, reportes, direcciones, billetera RehniCoin, configuracion de cuenta |
| Empresa (vendedor) | company | Registro de empresa (NIT + certificado) + verificacion de correo + aprobacion de la certificacion por un administrador | Panel de empresa (solo web): perfil, productos y variantes, descuentos, pedidos recibidos, finanzas |
| Administrador | admin | Cuenta creada por el seed o promovida por un Owner | Panel de administracion (solo web): estadisticas, empresas, usuarios, catalogo, anuncios, reportes, transportadoras, liquidaciones, recarga de RehniCoin |
| Owner (propietario) | owner | Cuenta creada por el seed | Todo lo del administrador mas asignar, modificar y bloquear cuentas Owner; ninguna cuenta Owner puede eliminarse |

## 2.2 Gestion de cuentas de usuario (por un administrador)

El administrador puede consultar el listado de usuarios y su detalle, actualizar la informacion de una cuenta, bloquear o desbloquear (`Users.isActive`) y eliminar una cuenta. Reglas verificadas en `app/services/DashboardService/admin/UserService.py`:

- Un administrador que no sea owner NO puede modificar, bloquear ni asignar el rol owner.
- Ninguna cuenta owner puede eliminarse, ni siquiera por otro owner.
- Solo una cuenta owner puede asignar el rol owner a otra cuenta o modificar/bloquear otra cuenta owner.

## 2.3 Gestion de cuentas de empresa

El registro de empresa crea el usuario con rol `company` y la empresa asociada (NIT, digito de verificacion y certificado en PDF subido a MinIO), con la certificacion en estado pendiente. El administrador aprueba o rechaza la certificacion. Solo una empresa aprobada aparece como verificada ante los compradores y puede iniciar sesion. Al suspender una empresa, sus pedidos en estado pendiente, pagado o en preparacion se cancelan y se reembolsan en RehniCoin al comprador (operacion atomica e idempotente, ver RNF-017 en el documento 08).

# 3. AUTENTICACION

## 3.1 Contrasenas

Las contrasenas se almacenan como hash `bcrypt` mediante `passlib` (`app/utils/Security.py`), con truncado seguro a 72 bytes. Nunca se almacenan ni se registran en texto plano. No existe ningun endpoint que devuelva una contrasena.

## 3.2 Verificacion de cuenta

Una cuenta no puede iniciar sesion hasta confirmar su correo con un codigo. Los codigos viven en la tabla `event_codes` (`app/models/ModelCode.py`), con un unico codigo activo por usuario y tipo. El codigo de verificacion de correo expira en 5 minutos. Hay un tiempo minimo de espera de 60 segundos para volver a solicitar un codigo; una solicitud dentro de ese tiempo responde con HTTP 429 y el codigo de error `RESEND_COOLDOWN_ACTIVE`. Se puede corregir el correo antes de completar la verificacion.

## 3.3 Recuperacion de contrasena

El restablecimiento usa un codigo temporal enviado por correo (expira en 15 minutos, de un solo uso). No reexpone ni pide la contrasena actual. Servicios: `ForgotPasswordService.py` y `ResetPasswordService.py`. El cambio de contrasena con sesion iniciada reutiliza el mismo flujo.

## 3.4 JWT y tokens de refresco

El servicio de JWT (`app/services/authentication/JWTService.py`) emite:

- Token de acceso: carga `{ sub, role, type: "access", exp }`, expiracion corta (por ejemplo 30 minutos segun `ACCESS_TOKEN_EXPIRE_MINUTES`).
- Token de refresco: carga `{ sub, type: "refresh", exp }`, expiracion en dias (por ejemplo 15 segun `REFRESH_TOKEN_DAYS`).

Ambos se firman con el algoritmo HS256 y la clave simetrica `SECRET_KEY`. El middleware rechaza un token de refresco usado como token de acceso y viceversa. El token de refresco se persiste en la tabla `refreshToken` (`app/models/ModelRefreshToken.py`); el endpoint `POST /auth/refresh` valida que exista, no este expirado y que la cuenta y la empresa sigan activas antes de emitir un nuevo token de acceso. El cliente web y el movil renuevan el token de acceso de forma transparente ante un HTTP 401 (interceptores en `src/api/setupAuthInterceptor.ts` y equivalente movil).

[[FIGURA]] Flujo de autenticacion y de sesion (representacion textual).

```
Registro  --->  Cuenta NO verificada  --->  Codigo por correo (5 min)
                                                   |
                                       Verificar correo (POST /auth/verify-email-user)
                                                   |
                                            Cuenta verificada
                                                   |
     Login (POST /auth/login-user)  --->  { access_token (30 min), refresh_token (15 dias) }
                                                   |
     Cada peticion protegida:
       Authorization: Bearer <access_token>
       -> middleware valida firma, type=access, expiracion
       -> carga el usuario, revalida Users.isActive y Company.CompanyStatus
       -> comprueba el rol contra la lista blanca de rutas
                                                   |
     access_token expirado  -->  el cliente llama POST /auth/refresh con el refresh_token
       -> si el refresh es valido y la cuenta/empresa sigue activa: nuevo access_token
       -> si no: sesion no recuperable, redireccion a login
```

# 4. AUTORIZACION Y PERMISOS

## 4.1 Middleware unico

La autorizacion se aplica en un unico middleware (`app/middleware/AuthMiddleware.py`). Para cada peticion NO publica:

1. Valida el token (firma, `type`, expiracion).
2. Carga el usuario desde la base de datos.
3. Revalida que la cuenta este activa (`Users.isActive`; cuenta bloqueada -> HTTP 403) y que la empresa no este suspendida (`Company.CompanyStatus`; empresa suspendida -> HTTP 403, con `reason` si existe) AUNQUE el JWT siga vigente.
4. Comprueba el rol contra la lista blanca de rutas (`app/middleware/RolePermissions.py`).

Las rutas publicas se definen explicitamente en `app/middleware/PublicRoutes.py`.

## 4.2 Lista blanca de rutas por rol

[[TABLA]] Lista blanca de rutas por rol.

| Rol | Acceso |
|---|---|
| Visitante | Solo rutas publicas: /public/*, /auth/* (registro, verificacion, login, recuperacion, refresh), /media/proxy, /health/*, /docs, /openapi.json |
| usuario | /auth/me, /cart, /checkout, /orders, /favorites, /addresses, /wallet/me, /wallet/transactions, /reviews, /reports |
| empresa | /company/dashboard/*, /company/bank-accounts, /company/payouts, /company/balance, /auth/me |
| administrador / owner | Acceso total (bypass en el middleware). Las capacidades exclusivas del owner se protegen a nivel de servicio |

## 4.3 Proteccion de endpoints

- Toda ruta no listada como publica exige `Authorization: Bearer <access_token>`; sin token la respuesta es HTTP 401.
- Un rol sin el prefijo de ruta permitido recibe HTTP 403 ANTES de ejecutar cualquier logica del endpoint.
- Verificacion de pertenencia (ownership): ademas del rol, los servicios filtran por el dueno real del recurso (por ejemplo `OrderRepository.get_user_order` filtra por `user_id`; `delete_product_service` valida el `company_id` del producto). Un usuario o empresa no puede leer ni modificar un pedido, direccion, producto o cuenta bancaria de otro, aunque conozca su identificador.
- El endpoint `POST /wallet/recharge` existe en el router de billetera pero el rol `user` NO lo tiene en su lista blanca: solo `admin` y `owner` pueden acreditar saldo (via `POST /admin/wallet/recharge`).
- Validacion de entrada con Pydantic en todos los endpoints; un cuerpo invalido responde HTTP 422 con el codigo `VALIDATION_ERROR`.

## 4.4 Contrato de error uniforme

Todos los errores de negocio usan el formato `{ detail: { code, message } }` con un `code` perteneciente al catalogo de 102 codigos de `app/core/ErrorCodes.py`. Codigos relevantes para acceso: `EMAIL_NOT_VERIFIED`, `INVALID_CREDENTIALS`, `RESEND_COOLDOWN_ACTIVE`, `COMPANY_PENDING`, `COMPANY_SUSPENDED`, `FORBIDDEN`, `VALIDATION_ERROR`, `INSUFFICIENT_BALANCE`.

# 5. CASOS DE ACCESO PERMITIDO Y RECHAZADO

## 5.1 Casos de acceso permitido

[[TABLA]] Casos de acceso permitido (verificados).

| Caso | Resultado esperado | Estado | Evidencia |
|---|---|---|---|
| Registro de comprador con correo no registrado | HTTP 200; cuenta no verificada; codigo enviado | EJECUTADO | acceptance/resultados.txt (AC-AUTH-01) |
| Verificacion de correo con el codigo real | HTTP 200; cuenta verificada | EJECUTADO | acceptance/resultados.txt (AC-AUTH-04) |
| Login con credenciales validas de una cuenta verificada | HTTP 200 con access_token | EJECUTADO | acceptance/resultados.txt (AC-AUTH-07) |
| Renovacion de sesion con refresh token valido | HTTP 200 con nuevo access_token | EJECUTADO | acceptance/resultados.txt (AC-AUTH-19) |
| Comprador accede a sus rutas permitidas (/cart, /orders, /favorites, /addresses, /wallet) | HTTP 200 | EJECUTADO | security/roles/roles_permisos.txt |
| Comprador crea una direccion y realiza checkout con saldo suficiente | Pedido creado, saldo descontado, carrito vaciado | EJECUTADO | acceptance/resultados.txt (AC-CHK-05) |

## 5.2 Casos de acceso rechazado

[[TABLA]] Casos de acceso rechazado (verificados).

| Caso | Resultado esperado | Estado | Evidencia |
|---|---|---|---|
| Login antes de verificar el correo | HTTP 400, codigo EMAIL_NOT_VERIFIED, sin emitir tokens | EJECUTADO | acceptance/resultados.txt (AC-AUTH-07a) |
| Solicitar reenvio de codigo antes de 60 s | HTTP 429, codigo RESEND_COOLDOWN_ACTIVE | EJECUTADO | acceptance/resultados.txt (AC-AUTH-06) |
| Login con contrasena incorrecta | HTTP 400, codigo INVALID_CREDENTIALS, sin revelar cual dato fallo | EJECUTADO | acceptance/resultados.txt (AC-AUTH-12b) |
| Peticion a una ruta protegida sin token | HTTP 401 | EJECUTADO | acceptance/resultados.txt (AC-AUTH-16), security/roles/ |
| Peticion con un token invalido | HTTP 401 | EJECUTADO | security/roles/roles_permisos.txt |
| Comprador hacia una ruta de administracion | HTTP 403, codigo FORBIDDEN | EJECUTADO | acceptance/resultados.txt (AC-AUTH-17), security/roles/ |
| Comprador hacia una ruta de empresa | HTTP 403 | EJECUTADO | acceptance/resultados.txt (AC-AUTH-17b), security/roles/ |
| Comprador intenta acreditarse saldo (POST /wallet/recharge) | HTTP 403 (no autorizado) | EJECUTADO | acceptance/resultados.txt (AC-SEC), security/roles/ |
| Empresa con certificacion pendiente intenta iniciar sesion | Bloqueado, codigo COMPANY_PENDING | Definido; ejecucion con usuario PENDIENTE | plan de pruebas AC-AUTH-09 |
| Empresa suspendida realiza cualquier peticion autenticada | HTTP 403, codigo COMPANY_SUSPENDED | Definido; ejecucion con usuario PENDIENTE | plan de pruebas |
| App movil: cuenta de empresa o admin inicia sesion | La app cierra la sesion automaticamente (el area de usuario no admite role distinto de "user") | Definido; ejecucion con usuario PENDIENTE | plan de pruebas AC-AUTH-18 |

# 6. RESUMEN DE LA COBERTURA DE PRUEBAS DE ACCESO

- Muestra tecnica de aceptacion (`scripts/acceptance_smoke.sh`, ejecutada 2026-08-31): 28/28 comprobaciones aprobadas, de las cuales 11 son de autenticacion y de autorizacion por rol. Evidencia: `evidencias/acceptance/resultados.txt`.
- Verificacion de la autorizacion por rol contra la API real (`evidencias/security/roles/roles_permisos.txt`): sin token 401; token de rol usuario con 200 en sus grupos permitidos y 403 en rutas de empresa, de administracion y en la de acreditacion de saldo; token invalido 401.
- Suite de pruebas del backend (`pytest`, 113/113, `evidencias/tests/pytest.txt`): el archivo de configuracion crea tokens para los cuatro roles y las pruebas ejercitan la logica de negocio con esos roles.
- Pruebas de acceso con un usuario final operando la interfaz web y movil: PENDIENTE (documento 06).

# 7. HALLAZGOS DE SEGURIDAD RELACIONADOS CON EL ACCESO

Del informe de calidad (documento 09), los hallazgos positivos y las debilidades relativas a identidad y acceso:

[[TABLA]] Estado de los controles de acceso.

| Control | Estado | Nota |
|---|---|---|
| JWT access + refresh con distincion de tipo | Positivo | Se rechaza el refresh usado como access |
| Refresh tokens persistidos y revocables | Positivo | Servicio de renovacion que rechaza cuentas bloqueadas/suspendidas |
| Autorizacion por rol con revalidacion en cada peticion | Positivo | Se revalida Users.isActive y Company.CompanyStatus |
| Hash de contrasenas con bcrypt | Positivo | Truncado seguro a 72 bytes |
| Verificacion de correo obligatoria + cooldown de 60 s | Positivo | Un unico codigo activo por usuario |
| Restriccion de la recarga de saldo a admin/owner | Positivo | El rol user no tiene la ruta en su lista blanca |
| Capacidades exclusivas de owner protegidas a nivel de servicio | Positivo | UserService.py revalida, no asume por el rol |
| CORS restringido a URL_FRONTEND | Corregido (2026-08-31) | Antes permitia cualquier origen |
| SECRET_KEY | Corregido (2026-08-31) | La plantilla trae un marcador; generar el valor real por entorno |
| Limitacion de tasa en los endpoints de autenticacion | Activable | RATE_LIMIT_ENABLED; forzado a true en produccion; conteo en memoria del proceso (para varias replicas falta un almacen compartido) |
| Credenciales de MinIO | Debilidad Baja | Se usa el usuario root de MinIO como credencial de la aplicacion; recomendado un usuario de minimo privilegio |

# 8. EVIDENCIAS

[[TABLA]] Evidencias del criterio 4.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| roles/roles_permisos.txt | Salida de comando | evidencias/security/ | 401 sin token; 200/403 por rol para el rol usuario; 401 con token invalido | EJECUTADO |
| acceptance/resultados.txt | Salida de comando | evidencias/acceptance/ | 11 comprobaciones de autenticacion y autorizacion aprobadas | EJECUTADO |
| tests/pytest.txt | Salida de comando | evidencias/tests/ | 113/113 pruebas del backend con tokens de los cuatro roles | EJECUTADO |
| Codigo del middleware | Codigo fuente | RehniMarket-backend/app/middleware/ | Implementacion de la autorizacion centralizada | EJECUTADO |
| Captura de un intento de acceso rechazado (403) y de un login exitoso, en la interfaz | Captura de pantalla | docs/evidencias/04_usuarios_permisos/ | Comportamiento visual ante el instructor | PENDIENTE (capturar en la sustentacion) |

# 9. CONCLUSION

RehniMarket implementa una gestion de identidades y de control de acceso solida y verificada: autenticacion con JWT de acceso y de refresco firmados con HS256, hash de contrasenas con bcrypt, verificacion de correo obligatoria, recuperacion de contrasena por codigo de un solo uso, y una autorizacion centralizada en un unico middleware que revalida el estado de la cuenta y de la empresa en cada peticion y aplica una lista blanca de rutas por rol, complementada con verificacion de pertenencia sobre los propios recursos. Los casos de acceso permitido y rechazado se probaron contra la API real y su resultado esta versionado en `evidencias/`. Lo pendiente es la validacion de estos flujos por un usuario final operando la interfaz y las capturas correspondientes (documento 06).
