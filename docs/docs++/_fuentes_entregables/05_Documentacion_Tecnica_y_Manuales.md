<!-- Fuente del entregable 05 (Criterio SENA 5). Consolida sin duplicar. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## DOCUMENTACION TECNICA Y MANUALES

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 5 — DOCUMENTACION TECNICA Y MANUALES

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

Este documento organiza y resume la documentacion tecnica y de usuario de RehniMarket. Para evitar duplicacion, presenta el contenido esencial de cada manual y remite al documento fuente completo del repositorio para el detalle. Los tres manuales de referencia son:

- Manual de instalacion: `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`, secciones 7 y 13.
- Manual tecnico: `docs/MANUAL_TECNICO_REHNIMARKET.md` (30 secciones).
- Manual de usuario final: `docs/MANUAL_USUARIO_REHNIMARKET.md` (21 secciones).

Documentos de apoyo: `RehniMarket-backend/README.md`, `RehniMarket-backend/CHANGELOG.md`, `RehniMarket-backend/app/docs/ARQUITECTURA-VARIANTES.md`, `RehniMarket-backend/app/docs/AUDITORIA.md`, `docs/RehniMarket-HU.md` y `docs/RehniMarket-Requisitos.docx`.

[[TABLA]] Mapa de la documentacion del proyecto.

| Documento | Contenido | Estado |
|---|---|---|
| DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md | Infraestructura, hardware medido, software, variables de entorno, instalacion desde cero, verificacion, problemas conocidos | Completo |
| MANUAL_TECNICO_REHNIMARKET.md | Arquitectura, capas, modelos y relaciones, ER textual, autenticacion, JWT, roles, productos, empresas, checkout, PostgreSQL, Alembic, MinIO, Docker, endpoints, Swagger, errores, seguridad, pruebas, despliegue, mantenimiento | Completo |
| MANUAL_USUARIO_REHNIMARKET.md | Uso de la plataforma por rol y por canal (web y movil): acceso, catalogo, carrito, compra, pedidos, RehniCoin, favoritos, resenas, panel de empresa, panel de administracion, errores frecuentes, preguntas frecuentes, limitaciones | Completo |
| README.md / CHANGELOG.md del backend | Stack real, migraciones, routers, tests, historial de versiones; nota historica sobre el nombre interno "Lubix" | Corregidos (2026-08-31) |
| ARQUITECTURA-VARIANTES.md | Modelo de variantes y atributos genericos por categoria (el subdominio mas complejo) | Completo; cadena de migraciones actualizada |
| AUDITORIA.md | Procedimiento de auditoria de dependencias con pip-audit | Completo |
| README.md del frontend web | Es la plantilla por defecto de Vite; sin contenido propio | PENDIENTE de reescritura (mejora menor) |

# 2. PARTE A — MANUAL DE INSTALACION

Fuente completa: `docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md` secciones 7 y 13. El detalle de infraestructura, hardware, puertos y variables esta en el documento 01 de esta entrega.

## 2.1 Requisitos

Host con Linux, Docker Engine y el plugin Docker Compose v2. Para la app movil: Node.js, pnpm y Expo Go en un Android de la misma red. Cuenta de Gmail con "contrasena de aplicacion" para el correo transaccional.

## 2.2 Instalacion desde cero

```
# 1) Herramientas base
git --version ; docker --version ; docker compose version

# 2) Codigo
git clone https://github.com/RehnieyAl/Rehni-Market.git
cd Rehni-Market

# 3) Variables de entorno del backend
cp RehniMarket-backend/.env.example RehniMarket-backend/.env
#   Definir como minimo: POSTGRES_USER/PASSWORD/DB, URL_DATABASE (host "postgres"),
#   MINIO_ROOT_USER/PASSWORD, MINIO_URL=minio:9000, SECRET_KEY (openssl rand -hex 32),
#   ALGORITHM=HS256, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_DAYS,
#   URL_FRONTEND, URL_BACKEND, GMAIL_USERNAME, GMAIL_APP_PASSWORD, RUN_SEED=false

# 4) Variables de entorno del frontend
cp RehniMarket-frontend/.env.example RehniMarket-frontend/.env   # VITE_API_URL=http://localhost:8001

# 5) Construir y levantar
docker compose build
docker compose up -d
docker compose ps          # los 4 contenedores en "Up"

# 6) Verificar
curl http://localhost:8001/health/database     # {"Base de datos":"OK"}
#   abrir http://localhost:8001/docs y http://localhost:5173
```

## 2.3 Configuracion

Las migraciones se aplican automaticamente al arrancar el backend. La carga inicial de datos es opcional: poner `RUN_SEED=true`, reiniciar el backend, confirmar en los logs y volver a `RUN_SEED=false`. El seed crea roles, catalogos, atributos, transportadoras y las cuentas admin/owner por defecto; NO carga empresas ni productos de ejemplo (esa parte esta comentada en el codigo), por lo que los productos de prueba se crean desde el panel de empresa.

## 2.4 App movil

```
cd RehniMarket-mobile
cp .env.example .env       # EXPO_PUBLIC_API_URL=http://<IP-DEL-HOST>:8001
pnpm install
pnpm exec expo start --lan --port 8085
#   escanear el QR con Expo Go en un Android de la misma red
```

# 3. PARTE B — MANUAL TECNICO

Fuente completa: `docs/MANUAL_TECNICO_REHNIMARKET.md` (30 secciones). Resumen de los puntos clave.

## 3.1 Arquitectura y capas

Cliente-servidor de tres capas contenerizada. El backend aplica una arquitectura por capas: enrutado (`app/routers/`, 24 routers) -> servicios (`app/services/`, logica de negocio) -> repositorio (`app/repository/`, acceso a datos) -> modelos (`app/models/`, 28 modulos, aproximadamente 36 tablas). Configuracion transversal en `app/core/` (102 codigos de error, IVA 19 %, comision 5 %). Punto de entrada: `app/main.py`.

## 3.2 Modelos y relaciones

Aproximadamente 36 tablas (37 con `alembic_version`) agrupadas por dominio: roles y usuarios; empresas y finanzas; catalogo y atributos; productos e imagenes; variantes, opciones y atributos de variante; carrito; pedidos; billetera y movimientos; direcciones, favoritos y resenas; reportes; anuncios; transportadoras. Enumerados nativos de PostgreSQL para el estado de pedido, el estado de certificacion de empresa, el estado de liquidacion, el tipo de movimiento de billetera y los tipos y estados de reporte.

El modelo entidad-relacion en representacion textual esta en `MANUAL_TECNICO` seccion 11 y en el documento 09 de esta entrega. El repositorio NO contiene un diagrama ER grafico; su elaboracion queda como trabajo futuro.

## 3.3 Base de datos y migraciones

PostgreSQL 17. Motor SQLAlchemy con verificacion de conexion previa (`pool_pre_ping=True`). Esquema versionado con Alembic en 10 migraciones lineales (`29fe206320ce` -> `a1b2c3d4e5f6`). Extensiones `pg_trgm` y `unaccent` mas la funcion `rehni_search_norm` y un indice GIN para la busqueda difusa. Detalle en el documento 02.

## 3.4 MinIO

Bucket unico `uploads`. Las imagenes se sirven al cliente mediante el proxy `GET /media/proxy?path=...` del propio backend; el navegador nunca contacta directamente con MinIO. La URL la construye `build_media_url()` a partir de `URL_BACKEND`.

## 3.5 Autenticacion y roles

JWT de acceso y de refresco firmados con HS256; middleware unico que valida el token, revalida el estado de la cuenta y de la empresa en cada peticion y aplica la lista blanca de rutas por rol. Detalle completo en el documento 04.

## 3.6 Endpoints principales

Alrededor de 130 rutas en 24 routers. Documentacion interactiva en `/docs` (Swagger UI) y esquema en `/openapi.json`; ambas publicas.

[[TABLA]] Endpoints principales por router (resumen).

| Router / prefijo | Endpoints representativos |
|---|---|
| /auth | register-user, register-company, verify-email-user, change-email, resend-verification-code, login-user, forgot-password-user, reset-password-user, refresh, me |
| /health | database, internet |
| /public | catalogs, colors, advertisements, products (filtros), products/daily, products/offers, products/new, products/{id}, products/{id}/reviews, catalogs/{id}/attributes, company/{id}, company/{id}/products, company/{id}/rating |
| /media | proxy?path=uploads/... |
| /cart | GET, add, item/{id} (PATCH/DELETE), clear |
| /checkout | POST { addressId } |
| /orders | GET, {id}, {id}/cancel |
| /favorites, /reviews, /reports, /addresses, /wallet | operaciones del comprador |
| /company/dashboard | perfil, productos, variantes, descuentos, pedidos recibidos, envio, transportadoras |
| /company | bank-accounts, payouts, balance |
| /admin/dashboard | statistics, recent-activities, recent-users, empresas, usuarios, catalogo, atributos, transportadoras |
| /admin/wallet | recharge, history |
| /admin/payouts | generate, preview, available-periods, {id}/pay |
| /admin/reports | listado, {id}, {id}/status |

## 3.7 Manejo de errores

Contrato uniforme `{ detail: { code, message } }` con 102 codigos catalogados. Manejador global de errores de validacion de Pydantic (HTTP 422, codigo `VALIDATION_ERROR`).

## 3.8 Docker y despliegue

`docker-compose.yml` (desarrollo) con cuatro servicios y comprobaciones de salud; `docker-compose.prod.yml` (produccion endurecida) construido y probado en aislado. Detalle en los documentos 01 y 03.

## 3.9 Mantenimiento

Tareas periodicas: ejecutar `pytest` antes de cada cambio relevante; ejecutar `pip-audit` antes de cada entrega; verificar la revision de Alembic tras cada despliegue; ejecutar el respaldo coordinado (documento 02). Para anadir un endpoint: crear el esquema Pydantic, el servicio, el metodo de repositorio si aplica, y el router; registrar el router en `app/main.py`. Para un cambio de esquema: `alembic revision --autogenerate`, revisar la migracion generada, probar `upgrade` y `downgrade`.

# 4. PARTE C — MANUAL DE USUARIO

Fuente completa: `docs/MANUAL_USUARIO_REHNIMARKET.md` (21 secciones). Resumen por funcion.

## 4.1 Roles y canales

La plataforma web cubre los cinco roles. La aplicacion movil esta orientada al Visitante y al comprador; su alcance minimo garantizado es Home, detalle de producto y autenticacion. Las funciones de comprador ampliadas en la app movil (carrito, checkout, pedidos, billetera, direcciones) estan en el arbol de trabajo y su validacion completa esta PENDIENTE. No existen paneles de empresa ni de administracion en la app movil.

## 4.2 Acceso

Registro de comprador o de empresa; verificacion de correo por codigo (5 minutos, reenvio con espera de 60 segundos); inicio y cierre de sesion; recuperacion de contrasena por codigo; renovacion de sesion transparente. Una empresa solo puede iniciar sesion si su certificacion fue aprobada por un administrador.

## 4.3 Navegacion y catalogo

Home con anuncios (banners visuales), categorias, seccion de ofertas y seccion de novedades. Catalogo con busqueda difusa (tolerante a tildes y a errores de escritura), filtros por categoria, precio, descuento y disponibilidad, y ordenamiento. Detalle de producto con galeria, seleccion de variante (imagen, precio y stock por variante), calificacion real y datos del vendedor.

## 4.4 Carrito y compra

El carrito valida el stock por producto o por variante; marca cada linea como "Agotado" o "Sin stock suficiente" y deshabilita el boton de pago si hay al menos una linea no disponible. El checkout requiere una direccion de envio, calcula subtotal, IVA del 19 % (aplicado por producto segun `applies_tax`) y total, y cobra con el saldo de RehniCoin. Si el saldo no alcanza, se informa y no se completa la compra. Al confirmar se genera un pedido por cada empresa vendedora, el carrito queda vacio y el saldo se descuenta.

## 4.5 Pedidos

Estados: pendiente, pagado, en preparacion, enviado, entregado, cancelado. El comprador puede cancelar solo mientras el pedido este en pendiente o pagado. La cancelacion individual NO reembolsa RehniCoin ni repone stock (requisito RF-065 no implementado). El detalle del pedido conserva un snapshot (producto, variante, atributos, precio y direccion) tal como estaban al comprar. Seguimiento por transportadora con enlace externo de rastreo.

## 4.6 RehniCoin

1 RehniCoin equivale a 1 peso colombiano. El usuario consulta su saldo y el historial de movimientos (recarga, compra, reembolso, ajuste). La solicitud de recarga abre una conversacion de WhatsApp con el numero oficial; el saldo NO se acredita automaticamente: solo un administrador lo acredita tras verificar el pago fuera de la plataforma.

## 4.7 Favoritos y resenas

Favoritos persistidos en el servidor (solo rol usuario). Resenas condicionadas a tener al menos un pedido del producto en estado "entregado"; una resena por producto; el usuario puede eliminar su propia resena.

## 4.8 Administracion de productos (empresa)

Un producto es la identidad; la unidad comprable es la variante. La empresa crea productos con especificaciones por categoria, genera variantes (producto cartesiano de las combinaciones) con su propio stock y precio, define descuentos por porcentaje o valor fijo con ventana temporal, y activa, desactiva o da de baja logica. Solo la empresa que creo un producto puede gestionarlo.

## 4.9 Administracion de la plataforma

Estadisticas, aprobacion y suspension de empresas (con reembolso al suspender), gestion de usuarios, catalogo global (categorias, atributos), anuncios, reportes, transportadoras, liquidaciones (comision del 5 %, requiere cuenta bancaria predeterminada de la empresa) y recarga de RehniCoin a un usuario identificado por su correo.

## 4.10 Solucion de problemas

`docs/MANUAL_USUARIO_REHNIMARKET.md` seccion 18 lista los mensajes y errores frecuentes con su causa y su solucion (por ejemplo: correo no verificado, codigo expirado, saldo insuficiente, producto agotado, empresa en revision). La seccion 19 responde preguntas frecuentes y la seccion 20 documenta las limitaciones conocidas.

# 5. CONSISTENCIA Y DESVIACIONES DOCUMENTADAS

Se registran dos desviaciones entre la documentacion de historias de usuario y el codigo, tomando el codigo como fuente:

- HU-025: las historias describen anuncios "con imagen, texto y enlace"; el codigo los define como banners solo visuales tras la migracion `d4e5f6a7b8c9`. Los manuales tecnico y de usuario ya reflejan el comportamiento real (banners visuales).
- HU-004: las historias indican que una empresa con certificacion pendiente puede iniciar sesion; el codigo lo bloquea con el codigo de error `COMPANY_PENDING`. Los manuales ya reflejan el bloqueo.

La correccion del texto de estas dos historias en `docs/RehniMarket-HU.md` queda como pendiente menor; el resto de la documentacion ya es consistente con el codigo.

# 6. EVIDENCIAS

[[TABLA]] Evidencias del criterio 5.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| Los tres manuales (.md) | Documento | docs/ | Documentacion de instalacion, tecnica y de usuario completa | EJECUTADO |
| 03_health_endpoints.txt (Swagger / OpenAPI) | Salida de comando | evidencias/deployment/ | La API publica su documentacion interactiva (130 rutas) | EJECUTADO |
| README.md / CHANGELOG.md del backend | Codigo fuente | RehniMarket-backend/ | Documentacion de proyecto actualizada al estado real | EJECUTADO |
| Captura de /docs (Swagger UI) y de un manual abierto | Captura de pantalla | docs/evidencias/05_documentacion/ | La documentacion es navegable ante el instructor | PENDIENTE (capturar en la sustentacion) |
| Diagrama ER grafico | Figura | docs/evidencias/05_documentacion/ | Representacion visual del modelo de datos | PENDIENTE (el ER textual existe en MANUAL_TECNICO seccion 11) |

# 7. CONCLUSION

RehniMarket cuenta con documentacion tecnica y de usuario completa y verificable: un manual de instalacion, un manual tecnico de 30 secciones y un manual de usuario de 21 secciones, mas los documentos de apoyo (README y CHANGELOG del backend corregidos, arquitectura de variantes, procedimiento de auditoria). La API publica su documentacion interactiva en `/docs`. Las unicas mejoras pendientes son la reescritura del README del frontend (hoy la plantilla de Vite), la elaboracion de un diagrama ER grafico (el textual ya existe) y la correccion del texto de dos historias de usuario para eliminar dos desviaciones ya documentadas.
