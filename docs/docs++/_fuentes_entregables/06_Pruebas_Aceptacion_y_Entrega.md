<!-- Fuente del entregable 06 (Criterio SENA 6). Documento clave para la sustentacion presencial. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## PRUEBAS DE ACEPTACION Y ENTREGA FORMAL

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 6 — PRUEBAS DE ACEPTACION Y ENTREGA FORMAL

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

# 1. OBJETIVO

Verificar, mediante pruebas de aceptacion reproducibles, que RehniMarket cumple los flujos funcionales comprometidos y los criterios de aceptacion definidos, y dejar preparada la matriz de pruebas para ejecutarla presencialmente con el instructor, junto con el guion de demostracion y el formato de acta de entrega.

Este documento distingue de forma explicita, en todo momento:

- Pruebas YA EJECUTADAS (con evidencia versionada en la carpeta `evidencias/`).
- Pruebas que se ejecutaran DURANTE LA SUSTENTACION, marcadas como ESTADO: PENDIENTE DE EJECUCION PRESENCIAL.

No se inventa ningun resultado futuro. Ningun caso pendiente aparece como aprobado.

# 2. ALCANCE

## 2.1 Incluido

- Flujo de autenticacion y de cuenta (registro, verificacion, login, recuperacion, refresh, cierre de sesion).
- Catalogo publico (listado, busqueda difusa, filtros, orden, ofertas, novedades, detalle, variantes).
- Carrito (agregar producto y variante, cambiar cantidad, eliminar, validacion de stock).
- Checkout con pago en RehniCoin (direccion, subtotal, IVA, total, saldo insuficiente, exito, reserva atomica de stock).
- Pedidos (listado, detalle, cancelacion cuando aplica, seguimiento por transportadora).
- Favoritos, resenas condicionadas a compra entregada, direcciones, billetera RehniCoin.
- Panel de empresa (perfil, productos y variantes, descuentos, pedidos recibidos, finanzas) — solo web.
- Panel de administracion (empresas, usuarios, catalogo, anuncios, reportes, transportadoras, liquidaciones, recarga de RehniCoin) — solo web.
- Casos negativos y de seguridad de acceso.
- Verificacion responsive (web y movil) y de infraestructura y API.

## 2.2 Excluido / fuera del alcance comprometido

- Pago con dinero real (el unico medio de pago es RehniCoin).
- Empaquetado nativo de la app movil (sin `eas.json`).
- Panel de empresa y de administracion en la app movil.
- Campana de pruebas de carga con herramienta especializada y auditoria de accesibilidad (ver documento 08).
- Requisito RF-065 (reembolso automatico al cancelar un pedido individual): NO implementado.

# 3. PREPARACION DEL ENTORNO

Datos tomados de `docker-compose.yml`, los `Dockerfile`, `.env.example` y la documentacion de despliegue. Lo no definido se marca "Por registrar" al ejecutar.

[[TABLA]] Ambiente de pruebas.

| Componente | Valor / configuracion |
|---|---|
| Orquestacion | Docker Compose (docker-compose.yml, servicios minio, postgres, backend, frontend) |
| Base de datos | PostgreSQL 17 (postgres:17-alpine), puerto host 5434; base de pruebas automatizadas rehnimarket_test creada por tests/conftest.py |
| Almacenamiento de objetos | MinIO (minio/minio:latest), puerto host 9000, bucket uploads |
| Backend | Python 3.13, FastAPI 0.135.1, Uvicorn 0.41.0; URL http://localhost:8001; migraciones automaticas al arrancar |
| Frontend web | Node 22, pnpm 11.15.0, React 19, Vite 8; dev server en http://localhost:5173 |
| Aplicacion movil | Expo ~54, React Native 0.81.5; ejecucion con Expo Go en Android; EXPO_PUBLIC_API_URL = IP del backend |
| Navegador para las pruebas web | Navegador moderno con JavaScript habilitado. Marca/version: Por registrar |
| Dispositivo movil | Android con Expo Go. Modelo, version y resolucion: Por registrar |
| Datos de prueba | Con RUN_SEED=true el backend crea roles, catalogos, atributos, transportadoras y las cuentas admin/owner. La carga de empresas/productos de ejemplo esta comentada: los productos de prueba se crean desde el panel de empresa |
| Cuenta SMTP | Gmail con contrasena de aplicacion. Cuenta usada: Por registrar |
| Numero de WhatsApp para recargas | VITE_REHNIMARKET_WHATSAPP / EXPO_PUBLIC_REHNIMARKET_WHATSAPP. Por registrar |

Comandos de preparacion:

```
docker compose up -d
docker compose ps                    # 4 servicios "Up"; postgres/minio/backend "healthy"
curl http://localhost:8001/health/database
# Crear datos de prueba: registrar 1 empresa, aprobarla desde el panel admin,
# crear 1-2 productos con variantes, y acreditar RehniCoin a la cuenta compradora.
```

# 4. PRECONDICIONES

- El stack levanta y las comprobaciones de salud pasan (documento 01).
- El seed creo los roles y las cuentas admin/owner.
- Existe al menos una cuenta compradora verificada.
- Existe al menos una empresa con certificacion aprobada y con productos (algunos con variantes, algunos con descuento, alguno marcado con IVA).
- La cuenta compradora tiene saldo de RehniCoin acreditado por un administrador.
- El correo SMTP funciona (para verificacion, recuperacion y correos de pedido).

# 5. RESUMEN DE LA MATRIZ DE PRUEBAS

La matriz completa esta en `docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` seccion 7 (funcionales) y seccion 8 (negativos). Contiene aproximadamente 240 casos.

[[TABLA]] Distribucion de la matriz de pruebas de aceptacion.

| Modulo | Casos definidos | Con respaldo objetivo actual | Pendientes de ejecucion presencial | No aplica |
|---|---|---|---|---|
| Autenticacion (7.1) | 20 | 7 (muestra tecnica) | 12 | 1 (registro de empresa en movil) |
| Catalogo (7.2) | 11 | 4 (muestra tecnica) + apoyo de pytest en busqueda/ofertas/novedades | 6 | 1 (perfil de empresa en movil) |
| Producto (7.3) | 9 | apoyo de pytest (variantes, precios, snapshot) | 9 | 0 |
| Carrito (7.4) | 16 | 2 (muestra tecnica) + apoyo de pytest en stock | 14 | 0 |
| Checkout (7.5) | 15 | 4 con prueba automatizada VERIFICADA (atomicidad y concurrencia) + 2 (muestra tecnica) | 9 | 0 |
| Pedidos (7.6) | 6 | 1 (listado, muestra tecnica) | 5 | 0 |
| Favoritos (7.7) | 6 | 0 | 6 | 0 |
| Resenas (7.8) | 7 | 0 | 6 | 1 (movil) |
| Direcciones (7.9) | 5 | 1 (creacion, muestra tecnica) | 4 | 0 |
| RehniCoin (7.10) | 6 | 0 | 6 | 0 |
| Panel de empresa (7.11) | 16 | 0 | 16 | 0 |
| Panel de administracion (7.12) | 22 | 0 | 22 | 0 |
| Infraestructura y API (7.13) | 11 | 3 (comandos ejecutados) | 8 | 0 |
| Casos negativos (8) | 42 | 1 (concurrencia, pytest) | 41 | 0 |
| Responsive (9) | 16 | 0 (solo verificacion estatica) | 16 | 0 |
| Integracion (10) | 14 | 1 (lado backend, pytest) | 13 | 0 |
| Total | aprox. 240 | 9 con respaldo objetivo | aprox. 231 pendientes | 6 no aplica |

Interpretacion honesta: de aproximadamente 240 casos definidos, 9 tienen respaldo objetivo (pruebas automatizadas o comandos ejecutados) y el resto esta PENDIENTE DE EJECUCION PRESENCIAL. Ninguna prueba de aceptacion con un usuario final se ha ejecutado ni firmado a la fecha.

# 6. PRUEBAS YA EJECUTADAS (CON EVIDENCIA)

## 6.1 Suite de pruebas automatizadas del backend

Comando: ejecucion de `pytest` en un contenedor efimero (`docker compose run --rm --no-deps -T backend sh -c 'cd /app && uv run --group dev pytest -q'`).

Resultado: 113 passed, 783 warnings in 622,94s (tres ejecuciones completas con el mismo resultado 113/113). Cobertura de sentencias del paquete `app/`: 62 % (7516 sentencias, 2850 sin cubrir). Los avisos son todos de la deprecacion de `datetime.utcnow()`, sin efecto funcional.

Cubre: catalogo publico, detalle de producto, carrito y checkout (incluida la reserva atomica de stock y la concurrencia), atributos de catalogo, variantes, busqueda difusa, secciones de ofertas y novedades, anuncios y resolucion de precios. Incluye la prueba `test_concurrent_checkout_of_last_unit_lets_only_one_win`, que verifica que ante dos compras simultaneas de la ultima unidad solo una gana, sin stock negativo ni pedido duplicado.

Evidencia: `evidencias/tests/pytest.txt`, `evidencias/tests/pytest-cov.txt`.

## 6.2 Muestra tecnica de aceptacion contra la API real

Comando: `scripts/acceptance_smoke.sh` contra la API real levantada con `docker compose`.

Resultado: 28 comprobaciones, 28 aprobadas, 0 fallidas.

[[TABLA]] Detalle de la muestra tecnica de aceptacion (28/28 aprobadas).

| Comprobacion | Resultado obtenido | Estado |
|---|---|---|
| AC-AUTH-01 Registro de comprador | HTTP 200 | PASA |
| AC-AUTH-07a Login antes de verificar | HTTP 400, EMAIL_NOT_VERIFIED | PASA |
| AC-AUTH-06 Reenvio de codigo antes de 60 s | HTTP 429, RESEND_COOLDOWN_ACTIVE | PASA |
| AC-AUTH-04 Verificacion con el codigo real de la base | HTTP 200 (codigo 783149) | PASA |
| AC-AUTH-07 Login exitoso tras verificar | HTTP 200 con access_token | PASA |
| AC-AUTH-12b Login con contrasena incorrecta | HTTP 400, INVALID_CREDENTIALS | PASA |
| AC-AUTH-19 Refresh token | HTTP 200 con nuevo access_token | PASA |
| AC-AUTH-16 Ruta protegida sin token | HTTP 401 | PASA |
| AC-AUTH-17 Comprador hacia ruta de admin | HTTP 403, FORBIDDEN | PASA |
| AC-AUTH-17b Comprador hacia ruta de empresa | HTTP 403 | PASA |
| AC-SEC Comprador intenta acreditarse saldo | HTTP 403 (no autorizado) | PASA |
| AC-CAT-02 Catalogo publico sin sesion | HTTP 200 (total 26) | PASA |
| AC-CAT-03 Busqueda difusa tolerante a tildes | search='audifono' -> 3 resultados | PASA |
| AC-CAT-07 Seccion Ofertas | HTTP 200 | PASA |
| AC-CAT-08 Seccion Novedades | HTTP 200 | PASA |
| AC-PROD-07 Agregar producto con variantes sin seleccionar variante | HTTP 400, VALIDATION_ERROR (rechazado) | PASA |
| AC-CART-01 Agregar al carrito | HTTP 200 | PASA |
| AC-CART-07 Persistencia: GET /cart devuelve la linea | 1 linea | PASA |
| AC-CHK-02 Direccion creada y seleccionada | correcto | PASA |
| AC-CHK-06 Checkout sin saldo | HTTP 402, INSUFFICIENT_BALANCE; NO se creo pedido | PASA |
| AC-CHK-05 Checkout con saldo | HTTP 200; pedido creado (0 -> 1); saldo 100000000 -> 99999881 (-119 = 100 + IVA 19 %); carrito vaciado | PASA |
| AC-ORD-01 Listado de pedidos del comprador | HTTP 200 | PASA |
| AC-INF-02 Salud de base de datos | OK | PASA |
| AC-INF-04 Esquema de la API (/openapi.json) | HTTP 200 | PASA |

Evidencia: `evidencias/acceptance/resultados.txt`.

Nota: esta muestra tecnica NO reemplaza la prueba de aceptacion con un usuario final operando la interfaz y firmando. Es la evidencia tecnica reproducible de que el nucleo funcional se comporta segun el plan.

## 6.3 Verificacion estatica de los clientes

- Frontend web: `tsc -b` codigo de salida 0; `eslint .` codigo de salida 0; `vite build` compila (bundle principal aprox. 730 kB). Evidencia: `evidencias/tests/frontend-tsc-eslint.txt`.
- Aplicacion movil: `tsc --noEmit` codigo de salida 0 (modo estricto activado); `eslint .` 0 errores, 3 avisos cosmeticos. Evidencia: `evidencias/tests/mobile-lint.txt`.

## 6.4 Autorizacion por rol

`evidencias/security/roles/roles_permisos.txt`: sin token 401; token de rol usuario con 200 en sus grupos permitidos y 403 en rutas de empresa, de administracion y en la de acreditacion de saldo; token invalido 401.

# 7. PRUEBAS QUE SE EJECUTARAN DURANTE LA SUSTENTACION

Todas las pruebas de esta seccion tienen ESTADO: PENDIENTE DE EJECUCION PRESENCIAL. El ejecutor debe registrar el "Resultado obtenido", el "Estado" final (APROBADO / FALLIDO) y la evidencia (captura o video) en este mismo documento el dia de la sustentacion.

## 7.1 Formato de caso de prueba

Cada caso se registra con: ID, modulo, rol, canal (W = Web, M = Movil), precondiciones, procedimiento (pasos), resultado esperado, resultado obtenido (a registrar), estado (a registrar), evidencia (a registrar).

## 7.2 Nucleo funcional obligatorio para la sustentacion

[[TABLA]] Casos del nucleo funcional a ejecutar presencialmente.

| ID | Modulo | Rol | Canal | Procedimiento (resumen) | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| P-AUT-01 | Autenticacion | Visitante | W/M | Registrar un comprador nuevo con nombre, correo, telefono y contrasena | Cuenta creada, no verificada; se envia codigo; redirige a verificacion | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-02 | Autenticacion | Visitante | W/M | Verificar el correo con el codigo recibido | Cuenta verificada; se habilita el login | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-03 | Autenticacion | Visitante | W/M | Intentar iniciar sesion antes de verificar | Rechazo con mensaje de correo no verificado; dirige a verificar | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-04 | Autenticacion | Usuario | W/M | Iniciar sesion con credenciales validas | Sesion iniciada; redirige al Home o a la pantalla previa protegida | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-05 | Autenticacion | Visitante | W | Recuperar contrasena: solicitar codigo, definir nueva contrasena, iniciar sesion | Contrasena cambiada; login exitoso con la nueva | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-06 | Autenticacion | Empresa | W | Iniciar sesion con una empresa con certificacion pendiente | Bloqueado con el mensaje de empresa en revision (COMPANY_PENDING) | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-AUT-07 | Autenticacion | Empresa/Admin | M | Iniciar sesion en la app movil con una cuenta de empresa o admin | La app cierra la sesion automaticamente | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CAT-01 | Catalogo | Visitante | W/M | Abrir el Home | Se muestran banners, categorias, ofertas y novedades | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CAT-02 | Catalogo | Visitante | W/M | Buscar "audifonos" con y sin tilde y con un error de escritura | Resultados por nombre, tolerante a tildes y a errores | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CAT-03 | Catalogo | Visitante | W/M | Aplicar filtros de precio, descuento y disponibilidad y cambiar el orden | El listado se filtra y se reordena segun los parametros | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-PROD-01 | Producto | Visitante | W/M | Abrir un producto con variantes y cambiar de variante | Cambian imagen, precio y stock de la variante seleccionada | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-PROD-02 | Producto | Usuario | W/M | Agregar al carrito un producto con variantes sin seleccionar variante | Se impide; mensaje de variante obligatoria | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CAR-01 | Carrito | Usuario | W | Agregar dos productos, cambiar cantidades, eliminar una linea | El carrito refleja los cambios; subtotal correcto | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CAR-02 | Carrito | Usuario | W | Poner en el carrito un producto agotado o con stock insuficiente | La linea se marca "Agotado" o "Sin stock suficiente"; el boton de pago se deshabilita; la linea se puede eliminar | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CHK-01 | Checkout | Usuario | W | Intentar comprar sin direccion registrada | Se solicita agregar una direccion antes de continuar | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CHK-02 | Checkout | Usuario | W | Revisar el resumen: subtotal, IVA 19 % (solo en los productos con IVA) y total | Los valores provienen del backend y son correctos | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CHK-03 | Checkout | Usuario | W | Comprar con saldo de RehniCoin insuficiente | Se informa saldo insuficiente; NO se crea el pedido; NO se descuenta saldo | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-CHK-04 | Checkout | Usuario | W | Comprar con saldo suficiente, con productos de dos empresas | Se crea un pedido por empresa; el carrito queda vacio; el saldo se descuenta; el stock se descuenta | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ORD-01 | Pedidos | Usuario | W | Ver el listado de pedidos y el detalle de uno | Estados correctos; el detalle muestra el snapshot (producto, variante, precio, direccion) | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ORD-02 | Pedidos | Usuario | W | Cancelar un pedido en estado pendiente y luego intentar cancelar uno enviado | El primero se cancela; el segundo no permite cancelacion desde la cuenta | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-COIN-01 | RehniCoin | Usuario | W | Consultar el saldo y el historial de movimientos; solicitar una recarga | El saldo y los movimientos vienen del servidor; la solicitud abre WhatsApp; el saldo NO cambia hasta que un admin lo acredite | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-REV-01 | Resenas | Usuario | W | Intentar resenar un producto no comprado y luego resenar uno con pedido entregado | El primero no permite resena; el segundo si; una sola resena por producto | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-EMP-01 | Panel de empresa | Empresa | W | Crear un producto con especificaciones y generar variantes con stock y precio | El producto y sus variantes quedan creados y visibles en el catalogo | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-EMP-02 | Panel de empresa | Empresa | W | Ver un pedido recibido y avanzar su estado; registrar transportadora y guia al enviar | El estado avanza segun el flujo permitido; se guarda la guia | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-EMP-03 | Panel de empresa | Empresa | W | Registrar una cuenta bancaria predeterminada y consultar el balance | La cuenta se guarda; el balance se muestra | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ADM-01 | Panel de administracion | Admin | W | Aprobar la certificacion de una empresa y luego suspenderla | La empresa aprobada aparece verificada; al suspender, sus pedidos activos se cancelan y se reembolsan en RehniCoin | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ADM-02 | Panel de administracion | Admin | W | Acreditar RehniCoin a un comprador por su correo y ver el historial de recargas | El saldo del comprador aumenta de inmediato; queda registro en el historial | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ADM-03 | Panel de administracion | Admin | W | Generar la vista previa de una liquidacion y marcarla como pagada | La liquidacion descuenta la comision del 5 %; una ya pagada no se vuelve a marcar | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-ADM-04 | Panel de administracion | Admin/Owner | W | Intentar que un admin modifique una cuenta Owner; intentar eliminar una cuenta Owner | Ambas acciones se rechazan | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-RESP-01 | Responsive | Visitante | W | Redimensionar la ventana a ancho de movil y de escritorio | El layout se adapta (una a varias columnas) | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |
| P-RESP-02 | Responsive | Visitante | M | Abrir la app en el dispositivo y navegar Home y detalle de producto | La interfaz se adapta al ancho del dispositivo | Por registrar | PENDIENTE DE EJECUCION PRESENCIAL | Por registrar |

## 7.3 Casos negativos y de seguridad a ejecutar presencialmente

[[TABLA]] Casos negativos a ejecutar presencialmente.

| ID | Escenario | Resultado esperado | Estado |
|---|---|---|---|
| N-01 | Registro con un correo ya registrado | Rechazo con mensaje claro | PENDIENTE DE EJECUCION PRESENCIAL |
| N-02 | Registro con telefono de menos de 10 digitos | Validacion de formulario impide enviar | PENDIENTE DE EJECUCION PRESENCIAL |
| N-03 | Verificar con un codigo incorrecto o expirado | Rechazo; se puede solicitar uno nuevo tras 60 s | PENDIENTE DE EJECUCION PRESENCIAL |
| N-04 | Navegar directamente a /checkout sin sesion | Redirige a login; tras autenticarse regresa a /checkout | PENDIENTE DE EJECUCION PRESENCIAL |
| N-05 | Comprador navega a /company/dashboard o /admin/dashboard | Acceso denegado (el backend responde 403) | PENDIENTE DE EJECUCION PRESENCIAL |
| N-06 | Agregar al carrito mas unidades que el stock disponible | Se rechaza con el mensaje de stock insuficiente | PENDIENTE DE EJECUCION PRESENCIAL |
| N-07 | Confirmar la compra cuando un producto del carrito quedo sin stock | Se informa y no se completa la compra | PENDIENTE DE EJECUCION PRESENCIAL |
| N-08 | Intentar acceder al detalle de un pedido de otro usuario (cambiando el id en la URL o la peticion) | Acceso denegado | PENDIENTE DE EJECUCION PRESENCIAL |
| N-09 | Empresa intenta editar un producto de otra empresa | Acceso denegado | PENDIENTE DE EJECUCION PRESENCIAL |
| N-10 | Reintentar la suspension de una empresa ya suspendida | No genera un segundo reembolso (idempotencia) | PENDIENTE DE EJECUCION PRESENCIAL |
| N-11 (VERIFICADO) | Dos compras simultaneas de la ultima unidad | Solo una gana; sin stock negativo ni pedido duplicado | APROBADO (pytest, evidencias/tests/pytest.txt) |

# 8. CRITERIOS DE ACEPTACION

## 8.1 Criterios funcionales

Una funcionalidad se considera aceptada cuando, con datos representativos: cumple el flujo esperado; no produce errores criticos (pantallas en blanco, cierres inesperados, respuestas HTTP 5xx no controladas); respeta la autenticacion y los permisos (401/403 cuando corresponde); los datos mostrados provienen del backend y no se calculan en el cliente; los errores de operaciones criticas se muestran sin ocultarse; el sistema impide operaciones invalidas (comprar sin stock, sin direccion o sin saldo; acceder a datos de otro usuario); hay consistencia entre web y movil cuando la funcionalidad existe en ambos; y el carrito, los favoritos, las direcciones y la sesion persisten en el servidor.

## 8.2 Clasificacion de defectos

[[TABLA]] Clasificacion de defectos y efecto sobre la aceptacion.

| Severidad | Definicion | Efecto |
|---|---|---|
| Critico | Impide una operacion esencial o compromete datos/saldo (no se puede comprar; se cobra sin crear el pedido; stock negativo; se accede a datos de otro usuario; caida total de un componente) | Bloquea la aceptacion; debe corregirse y re-probarse antes de firmar |
| Alto | Un flujo principal falla en un escenario comun, con solucion alterna dificil (checkout falla con saldo suficiente; los estados de pedido no avanzan; el login de un rol valido no funciona) | Bloquea la aceptacion salvo acuerdo expreso con plan de correccion y fecha, registrado en el acta |
| Medio | Un flujo secundario falla o uno principal falla en un escenario poco comun, con solucion alterna | No bloquea; se registra en el acta con prioridad y responsable |
| Bajo | Defecto cosmetico o de detalle sin impacto funcional | No bloquea; se registra como observacion |
| Funcionalidad pendiente (alcance futuro) | Elemento fuera del alcance comprometido | No es un defecto; se lista como trabajo futuro |

## 8.3 Umbral de aceptacion

- 0 defectos Criticos abiertos.
- 0 defectos Altos abiertos (o con plan de correccion aceptado y firmado).
- Todos los casos del nucleo (autenticacion, catalogo, carrito, checkout, pedidos, RehniCoin) y los casos negativos de seguridad de acceso ejecutados y aprobados.
- Los casos de los paneles de empresa y administracion ejecutados y aprobados en su mayoria; los pendientes, con acuerdo escrito.
- Capacitacion al usuario realizada con evidencia.
- Acta de entrega diligenciada y firmada por ambas partes.

# 9. GUION DE DEMOSTRACION PRESENCIAL

Orden recomendado para demostrar el sistema al instructor. Duracion estimada: 35 a 45 minutos.

1. Infraestructura (3 min). Mostrar `docker compose ps` con los cuatro servicios "Up" y "healthy". Abrir `http://localhost:8001/docs` (Swagger) y `http://localhost:8001/health/database`.
2. Catalogo publico como Visitante (4 min). Abrir el Home (banners, categorias, ofertas, novedades). Buscar "audifonos" con y sin tilde. Aplicar un filtro de precio y cambiar el orden. Abrir un producto con variantes y cambiar de variante (imagen, precio, stock).
3. Registro y verificacion (4 min). Crear una cuenta compradora nueva. Mostrar el correo con el codigo. Verificar. Intentar iniciar sesion antes de verificar para mostrar el rechazo.
4. Seguridad de acceso (3 min). Con la sesion de comprador, intentar navegar a `/admin/dashboard` y a `/company/dashboard` para mostrar el 403. Mostrar `evidencias/security/roles/roles_permisos.txt`.
5. Panel de empresa (6 min). Iniciar sesion con una empresa aprobada. Crear un producto con especificaciones y generar variantes con stock y precio. Aplicar un descuento.
6. Panel de administracion (4 min). Iniciar sesion como admin. Acreditar RehniCoin a la cuenta compradora por su correo. Mostrar el historial de recargas.
7. Compra completa como comprador (8 min). Agregar productos al carrito (incluir uno agotado para mostrar el bloqueo del pago). Crear una direccion. Revisar el resumen (subtotal, IVA, total). Intentar comprar con saldo insuficiente (mostrar el rechazo y que NO se crea pedido). Acreditar mas saldo. Comprar. Mostrar el carrito vaciado, el saldo descontado y el pedido creado.
8. Pedidos y envio (4 min). Como empresa, avanzar el estado del pedido y registrar la transportadora y la guia al enviar. Como comprador, ver el detalle del pedido y el enlace de seguimiento. Cancelar un pedido en pendiente y mostrar que uno enviado ya no se puede cancelar.
9. Concurrencia y calidad (3 min). Mostrar la salida de `evidencias/tests/pytest.txt` (113/113) y explicar la prueba de concurrencia del checkout. Mostrar `evidencias/acceptance/resultados.txt` (28/28).
10. App movil (opcional, 4 min). Abrir la app en Expo Go. Navegar Home y detalle de producto. Mostrar que una cuenta de empresa cierra la sesion automaticamente.

# 10. CAPACITACION AL USUARIO

Estado global: NO REALIZADA. No existe evidencia de ninguna sesion de capacitacion ejecutada. El plan esta preparado en `docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` seccion 14 para tres audiencias.

[[TABLA]] Plan de capacitacion (a ejecutar durante la implantacion).

| Sesion | Contenido | Duracion estimada | Evidencia requerida | Estado |
|---|---|---|---|---|
| Comprador | Registro, verificacion, login, recuperacion; navegacion y catalogo; carrito y stock; checkout y RehniCoin; pedidos, favoritos y resenas; app movil | aprox. 90 min | Lista de asistencia + grabacion + una compra de prueba realizada por el usuario | NO REALIZADA |
| Empresa | Acceso y perfil; productos y variantes; descuentos; pedidos y estados; transportadora y guia; finanzas y liquidaciones | aprox. 80 min | Lista de asistencia + grabacion + un producto con variantes creado por la empresa | NO REALIZADA |
| Administrador / Owner | Panel y estadisticas; empresas y usuarios; catalogo, anuncios y transportadoras; liquidaciones y RehniCoin; restricciones de las cuentas Owner | aprox. 75 min | Lista de asistencia + grabacion + una recarga de prueba | NO REALIZADA |

# 11. ACTA DE ENTREGA

El formato completo del acta esta en `docs/ACTA_ENTREGA_REHNIMARKET.md`. ESTADO: SIN DILIGENCIAR. Se completa y se firma el dia de la entrega formal, despues de ejecutar las pruebas de aceptacion con el usuario final, realizar la capacitacion y adjuntar la carpeta de evidencias. NO se incluyen firmas, nombres de asistentes ni fechas de sesiones porque no existen.

Campos minimos del acta: identificacion del proyecto y del programa; version entregada (commit); lugar y fecha; lista de entregables con casillas de verificacion; estado de cada componente; resultados de las pruebas de aceptacion (casos aprobados de casos ejecutados; defectos abiertos por severidad); registro de las sesiones de capacitacion; pendientes y trabajo futuro; niveles de servicio acordados; y la declaracion de aceptacion con las firmas del responsable de la entrega y del responsable de la recepcion.

# 12. EVIDENCIAS

[[TABLA]] Evidencias del criterio 6.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| tests/pytest.txt | Salida de comando | evidencias/tests/ | 113/113 pruebas del backend, incluida la concurrencia del checkout | EJECUTADO |
| tests/pytest-cov.txt | Salida de comando | evidencias/tests/ | Cobertura de sentencias 62 % | EJECUTADO |
| acceptance/resultados.txt | Salida de comando | evidencias/acceptance/ | 28/28 comprobaciones de aceptacion contra la API real | EJECUTADO |
| tests/frontend-tsc-eslint.txt | Salida de comando | evidencias/tests/ | Verificacion estatica del frontend sin errores | EJECUTADO |
| tests/mobile-lint.txt | Salida de comando | evidencias/tests/ | Verificacion estatica de la app movil sin errores | EJECUTADO |
| security/roles/roles_permisos.txt | Salida de comando | evidencias/security/ | Autorizacion por rol (401/403/200) | EJECUTADO |
| PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md | Documento | docs/ | Matriz completa de aproximadamente 240 casos | EJECUTADO |
| ACTA_ENTREGA_REHNIMARKET.md | Documento (plantilla) | docs/ | Formato de acta listo para diligenciar y firmar | SIN DILIGENCIAR |
| Capturas de navegador de cada caso presencial | Captura de pantalla / video | docs/evidencias/06_pruebas_aceptacion/ | Ejecucion de la matriz con un usuario final | PENDIENTE DE EJECUCION PRESENCIAL |
| Listas de asistencia y grabaciones de las capacitaciones | Documento / video | docs/evidencias/06_pruebas_aceptacion/ | Realizacion de la capacitacion | PENDIENTE |
| Acta firmada | Documento | docs/evidencias/06_pruebas_aceptacion/ | Aceptacion formal | PENDIENTE |

# 13. CHECKLIST FINAL PARA LA SUSTENTACION

- [ ] Levantar el stack y confirmar las comprobaciones de salud.
- [ ] Crear los datos de prueba (empresa aprobada, productos con variantes y descuento, saldo de RehniCoin).
- [ ] Ejecutar los casos del nucleo (seccion 7.2) y registrar cada resultado y su evidencia en este documento.
- [ ] Ejecutar los casos negativos de seguridad de acceso (seccion 7.3).
- [ ] Ejecutar las pruebas responsive en el navegador y en el dispositivo.
- [ ] Ejecutar la suite completa de pytest y guardar la salida.
- [ ] Ejecutar tsc y eslint del frontend y de la app movil y guardar las salidas.
- [ ] Realizar las sesiones de capacitacion y guardar la evidencia.
- [ ] Diligenciar y firmar el acta de entrega.
- [ ] Confirmar el avance (ver documento 11).

# 14. CONCLUSION

RehniMarket tiene el plan de pruebas de aceptacion completo (aproximadamente 240 casos), una muestra tecnica de 28 comprobaciones ejecutada contra la API real (28/28) y la suite de 113 pruebas automatizadas del backend (113/113), todo con evidencia reproducible y versionada. Lo que queda para completar el criterio 6 son actividades que requieren la participacion de personas: ejecutar la matriz de pruebas con un usuario final operando la interfaz, tomar las capturas, realizar la capacitacion y firmar el acta. Este documento deja esas pruebas preparadas como matriz reproducible y aporta el guion de demostracion para la sustentacion, sin declarar aprobado ningun caso que aun no se haya ejecutado.
