# Especificación de Requisitos Funcionales — Rehni-Market

## 1. Información general

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | Rehni-Market (RehniMarket) |
| **Programa de formación** | Análisis y Desarrollo de Software (ADSO) — SENA |
| **Nombre del documento** | Especificación de Requisitos Funcionales |
| **Fuente principal** | `docs/docs++/RehniMarket-HU.md` (Historias de Usuario — RehniMarket) |
| **Versión del documento** | 1.0 |
| **Fecha de elaboración** | 2026-10-09 |
| **Estado** | Borrador para validación |
| **Integrantes / responsables** | No disponible en la fuente consultada |

> **Nota sobre autoría institucional:** la fuente `RehniMarket-HU.md` no registra nombres de integrantes, instructor, ficha ni centro de formación. Esos campos se dejan expresamente sin diligenciar para no introducir datos no verificados.

---

## 2. Introducción

Este documento especifica los **requisitos funcionales (RF)** del sistema Rehni-Market, derivados de forma directa y trazable de las historias de usuario consignadas en `RehniMarket-HU.md`.

Cada requisito expresa **qué debe hacer el sistema**, no cómo está construido. Los requisitos se obtuvieron descomponiendo cada historia de usuario en sus criterios de aceptación y convirtiendo cada capacidad funcional verificable en un enunciado único con la estructura "El sistema debe…".

Alcance de la derivación:

- Toda la información proviene de las historias HU-001 a HU-029, sus criterios de aceptación y el resumen de cobertura de la fuente.
- No se agregaron funcionalidades, límites, tiempos, cantidades ni permisos que la fuente no documente.
- La agrupación por módulos reproduce el **"4. Resumen de cobertura"** de `RehniMarket-HU.md`, sin crear módulos nuevos.
- Los criterios de aceptación de la fuente están redactados como listas de verificación **sin marcar** (`- [ ]`). Por lo tanto, este documento **no afirma que ningún requisito esté implementado, probado o aceptado**: describe el comportamiento requerido y su origen documental.
- Las ambigüedades, contradicciones y vacíos detectados no se resolvieron por iniciativa propia; se registran en la sección 8 (Observaciones y pendientes de validación).

---

## 3. Alcance funcional

Rehni-Market es un **marketplace** que conecta empresas vendedoras con usuarios compradores (`RehniMarket-HU.md` §1). Según la fuente, el sistema soporta las siguientes capacidades:

1. **Exploración pública del catálogo** sin cuenta: home con productos destacados y categorías, listado completo con filtros y ordenamiento, búsqueda por nombre, detalle de producto con variantes de color y opiniones, y perfil público de empresa vendedora.
2. **Autenticación y gestión de cuenta**: registro diferenciado de comprador y de empresa, verificación de correo por código, inicio de sesión, recuperación de contraseña, retorno al contexto de origen tras autenticarse, cierre de sesión y administración de los datos personales de cualquier actor autenticado.
3. **Compra**: favoritos persistentes, carrito con control de stock, checkout con dirección de envío obligatoria, cálculo de subtotal, impuesto del 19 % y total, y pago exclusivo con saldo de RehniCoins.
4. **Pedidos**: consulta y cancelación por parte del comprador, y gestión del ciclo de estados por parte de la empresa vendedora.
5. **Reseñas y calificaciones**: reseña condicionada a compra entregada, con recálculo del promedio del producto y de la empresa.
6. **Billetera RehniCoin**: consulta de saldo e historial de movimientos, solicitud de recarga canalizada por WhatsApp y acreditación manual por parte de la administración.
7. **Operación de la empresa vendedora**: perfil comercial, publicación y mantenimiento del catálogo propio (productos, descuentos, variantes de color, imágenes y especificaciones), cuentas bancarias, balance y liquidaciones.
8. **Administración de la plataforma**: cuentas de usuario, empresas y su certificación, catálogo global (categorías, especificaciones y colores), anuncios del home, liquidaciones a empresas, recargas de RehniCoins y panel de estadísticas, con un conjunto de capacidades reservadas al rol Owner.

**Actores involucrados:** Visitante, Usuario, Empresa, Administrador y Owner (ver sección 4).

**Módulos funcionales respaldados por la fuente** (§4 de `RehniMarket-HU.md`): Catálogo público y búsqueda; Autenticación y cuenta; Favoritos; Carrito y compra; Pedidos; Reseñas y calificaciones; RehniCoins; Direcciones; Empresa (perfil y productos); Finanzas de empresa; Administración de usuarios y empresas; Catálogo administrativo y anuncios; Liquidaciones; Panel administrativo.

**Fuera del alcance de este documento:** requisitos no funcionales, decisiones de arquitectura, modelo de datos, endpoints, tareas de desarrollo y cualquier funcionalidad del repositorio que no esté respaldada por una historia de usuario (ver observación OBS-017).

---

## 4. Actores del sistema

| Actor | Descripción | Fuente |
|---|---|---|
| **Visitante** | Cualquier persona que navega Rehni-Market sin haber iniciado sesión. Puede explorar el catálogo público, pero no puede comprar, guardar favoritos ni acceder a ningún panel privado. | `RehniMarket-HU.md` §2 — Actores |
| **Usuario** | Comprador autenticado (rol `user`). Puede gestionar favoritos, comprar, gestionar pedidos, reseñar productos entregados y usar su saldo de RehniCoins. | `RehniMarket-HU.md` §2 — Actores |
| **Empresa** | Cuenta vendedora autenticada (rol `company`). Publica y administra su catálogo de productos, gestiona los pedidos que recibe y su información financiera. | `RehniMarket-HU.md` §2 — Actores |
| **Administrador** | Personal interno de la plataforma (rol `admin`). Administra usuarios, empresas, catálogo global, anuncios, liquidaciones a empresas y recargas de RehniCoins. | `RehniMarket-HU.md` §2 — Actores |
| **Owner** | Personal interno con el nivel más alto de privilegios (rol `owner`). Posee todas las capacidades de `admin` más un conjunto reducido de capacidades exclusivas sobre otras cuentas administrativas. | `RehniMarket-HU.md` §2 — Actores; §3.4 HU-029 |

> La fuente presenta `admin` y `owner` en una sola fila ("Administrador / Owner"). Se desdoblan en dos actores porque HU-022 y HU-029 les asignan capacidades distintas. No se añadieron actores ni roles adicionales.

---

## 5. Listado de requisitos funcionales

**Convenciones:**

- **Prioridad:** la fuente no documenta prioridad en ninguna historia de usuario, por lo que todos los requisitos se registran como **"Por definir"** (ver OBS-001). No se asignaron prioridades inferidas.
- **CA n:** criterio de aceptación número *n* de la historia indicada, en el orden en que aparece en `RehniMarket-HU.md`.
- Un mismo criterio de aceptación puede originar varios requisitos cuando describe capacidades independientes; dos historias pueden converger en un mismo requisito cuando expresan la misma capacidad (no se duplica).

### 5.1 Módulo: Catálogo público y búsqueda

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-001 | Catálogo público y búsqueda | Productos destacados en el Home | El sistema debe mostrar en el Home una selección de productos destacados accesible sin haber iniciado sesión. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 1 |
| RF-002 | Catálogo público y búsqueda | Categorías disponibles en el Home | El sistema debe mostrar en el Home las categorías de productos disponibles. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 1 |
| RF-003 | Catálogo público y búsqueda | Listado completo de productos | El sistema debe permitir al Visitante acceder al listado completo de productos del catálogo. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 2 |
| RF-004 | Catálogo público y búsqueda | Filtrado del listado de productos | El sistema debe permitir filtrar el listado de productos por categoría, rango de precio, disponibilidad de stock y descuento. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 2 |
| RF-005 | Catálogo público y búsqueda | Ordenamiento del listado | El sistema debe permitir ordenar el listado de productos, por ejemplo por precio o por descuento. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 3 |
| RF-006 | Catálogo público y búsqueda | Búsqueda de productos por nombre | El sistema debe permitir buscar productos por nombre desde el buscador del encabezado y desde el listado de productos. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 4 |
| RF-007 | Catálogo público y búsqueda | Visualización de anuncios en el Home | El sistema debe mostrar en el Home únicamente los anuncios publicitarios que la administración haya configurado y mantenga activos. | Por definir | HU-001 — Explorar y buscar el catálogo público; HU-025 — Gestionar los anuncios del Home | HU-001, CA 5; HU-025, CA 3 |
| RF-008 | Catálogo público y búsqueda | Datos de catálogo provenientes de la fuente real | El sistema debe mostrar el precio, el descuento y el stock de cada producto tomándolos del catálogo real cargado por las empresas, sin valores simulados. | Por definir | HU-001 — Explorar y buscar el catálogo público | HU-001, CA 6 |
| RF-009 | Catálogo público y búsqueda | Acceso al detalle de producto desde cualquier listado | El sistema debe permitir acceder al detalle de un producto desde el Home, las categorías, los resultados de búsqueda y los productos relacionados. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 1 |
| RF-010 | Catálogo público y búsqueda | Información comercial del producto | El sistema debe mostrar en el detalle del producto su categoría, nombre, precio actual y, cuando exista descuento vigente, el precio anterior tachado y el porcentaje de descuento. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 2 |
| RF-011 | Catálogo público y búsqueda | Calificación del producto en el detalle | El sistema debe mostrar en el detalle del producto su calificación promedio real con la cantidad de opiniones o, cuando no existan reseñas, un estado que indique que aún no tiene opiniones. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 2 |
| RF-012 | Catálogo público y búsqueda | Galería de imágenes del producto | El sistema debe mostrar la galería de imágenes del producto en su detalle. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 3 |
| RF-013 | Catálogo público y búsqueda | Selección de variante de color en el detalle | El sistema debe permitir seleccionar cada variante de color de un producto y mostrar la imagen, el precio y el stock correspondientes a la variante seleccionada. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 3 |
| RF-014 | Catálogo público y búsqueda | Stock disponible en el detalle | El sistema debe mostrar en el detalle del producto el stock disponible real. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 4 |
| RF-015 | Catálogo público y búsqueda | Opiniones de compradores en el detalle | El sistema debe mostrar en el detalle del producto las opiniones existentes de otros compradores. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 4 |
| RF-016 | Catálogo público y búsqueda | Datos del vendedor y acceso a su perfil | El sistema debe mostrar en el detalle del producto los datos de la empresa vendedora y permitir acceder a su perfil público. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 5 |
| RF-017 | Catálogo público y búsqueda | Posición inicial del detalle de producto | El sistema debe presentar la página de detalle de producto desde su parte superior cualquiera sea el origen de navegación, sin conservar la posición de desplazamiento de la pantalla anterior. | Por definir | HU-002 — Consultar el detalle de un producto | HU-002, CA 6 |
| RF-018 | Catálogo público y búsqueda | Acceso al perfil público de la empresa | El sistema debe permitir acceder al perfil público de una empresa desde el detalle de cualquiera de sus productos. | Por definir | HU-003 — Consultar el perfil público de una empresa | HU-003, CA 1 |
| RF-019 | Catálogo público y búsqueda | Identidad y verificación en el perfil de empresa | El sistema debe mostrar en el perfil público de la empresa su nombre, su logo y su estado de verificación real. | Por definir | HU-003 — Consultar el perfil público de una empresa | HU-003, CA 2 |
| RF-020 | Catálogo público y búsqueda | Calificación agregada de la empresa | El sistema debe mostrar en el perfil público de la empresa su calificación, como promedio y cantidad de opiniones de todos sus productos. | Por definir | HU-003 — Consultar el perfil público de una empresa | HU-003, CA 2 |
| RF-021 | Catálogo público y búsqueda | Catálogo paginado de la empresa | El sistema debe listar de forma paginada, en el perfil público de la empresa, únicamente sus productos activos y disponibles. | Por definir | HU-003 — Consultar el perfil público de una empresa | HU-003, CA 3 |

### 5.2 Módulo: Autenticación y cuenta

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-022 | Autenticación y cuenta | Registro de cuenta de comprador | El sistema debe permitir al Visitante registrarse como comprador indicando nombre, correo, teléfono y contraseña. | Por definir | HU-004 — Registrarme como comprador o como empresa | HU-004, CA 1 |
| RF-023 | Autenticación y cuenta | Registro de cuenta de empresa | El sistema debe permitir al Visitante registrarse como empresa indicando sus datos comerciales. | Por definir | HU-004 — Registrarme como comprador o como empresa | HU-004, CA 2 |
| RF-024 | Autenticación y cuenta | Cuenta pendiente de verificación de correo | El sistema debe dejar toda cuenta recién registrada en estado pendiente de verificación de correo e impedir su inicio de sesión mientras no se verifique. | Por definir | HU-004 — Registrarme como comprador o como empresa; HU-005 — Verificar mi correo electrónico | HU-004, CA 3; HU-005, CA 4 |
| RF-025 | Autenticación y cuenta | Certificación pendiente de la empresa recién registrada | El sistema debe dejar la certificación de una empresa recién registrada en estado pendiente de aprobación por la administración, permitiéndole iniciar sesión. | Por definir | HU-004 — Registrarme como comprador o como empresa | HU-004, CA 4 |
| RF-026 | Autenticación y cuenta | Ocultamiento público de la condición de empresa verificada | El sistema debe omitir públicamente la condición de "empresa verificada" de una empresa mientras su certificación no haya sido aprobada por la administración. | Por definir | HU-004 — Registrarme como comprador o como empresa; HU-023 — Gestionar empresas registradas | HU-004, CA 4; HU-023, CA 2 |
| RF-027 | Autenticación y cuenta | Envío del código de verificación de correo | El sistema debe enviar un código de verificación al correo indicado en el registro. | Por definir | HU-005 — Verificar mi correo electrónico | HU-005, CA 1 |
| RF-028 | Autenticación y cuenta | Verificación de la cuenta mediante código | El sistema debe permitir ingresar el código recibido para verificar la cuenta. | Por definir | HU-005 — Verificar mi correo electrónico | HU-005, CA 2 |
| RF-029 | Autenticación y cuenta | Corrección del correo y reenvío del código | El sistema debe permitir corregir el correo registrado antes de completar la verificación y reenviar el código de verificación al nuevo correo. | Por definir | HU-005 — Verificar mi correo electrónico | HU-005, CA 3 |
| RF-030 | Autenticación y cuenta | Rechazo informado del acceso sin verificar | El sistema debe rechazar el intento de inicio de sesión de una cuenta no verificada, indicar explícitamente que falta verificar el correo y dirigir al actor a completar ese paso. | Por definir | HU-005 — Verificar mi correo electrónico | HU-005, CA 4 |
| RF-031 | Autenticación y cuenta | Inicio de sesión con correo y contraseña | El sistema debe permitir iniciar sesión con correo y contraseña a toda cuenta registrada y verificada. | Por definir | HU-006 — Iniciar sesión y recuperar mi contraseña | HU-006, CA 1 |
| RF-032 | Autenticación y cuenta | Solicitud de código de recuperación de contraseña | El sistema debe permitir solicitar un código de recuperación de contraseña, enviándolo al correo de la cuenta. | Por definir | HU-006 — Iniciar sesión y recuperar mi contraseña | HU-006, CA 2 |
| RF-033 | Autenticación y cuenta | Definición de nueva contraseña con código | El sistema debe permitir definir una nueva contraseña presentando el código de recuperación recibido. | Por definir | HU-006 — Iniciar sesión y recuperar mi contraseña | HU-006, CA 2 |
| RF-034 | Autenticación y cuenta | Mensaje de credenciales inválidas sin discriminar el dato | El sistema debe informar el fallo de inicio de sesión por credenciales inválidas sin revelar cuál de los dos datos es incorrecto. | Por definir | HU-006 — Iniciar sesión y recuperar mi contraseña | HU-006, CA 3 |
| RF-035 | Autenticación y cuenta | Destino por defecto tras iniciar sesión | El sistema debe dirigir al Home al actor que inicia sesión sin haber sido redirigido previamente desde una acción o sección protegida. | Por definir | HU-006 — Iniciar sesión y recuperar mi contraseña; HU-007 — Regresar al contexto donde estaba después de iniciar sesión | HU-006, CA 4; HU-007, CA 3 |
| RF-036 | Autenticación y cuenta | Redirección al inicio de sesión ante acciones protegidas | El sistema debe dirigir al inicio de sesión al Visitante sin sesión que intente agregar un producto al carrito, comprarlo, marcarlo como favorito o acceder a una sección que requiere sesión, incluidos los paneles de comprador, empresa o administración y el checkout. | Por definir | HU-007 — Regresar al contexto donde estaba después de iniciar sesión; HU-010 — Gestionar mis productos favoritos; HU-011 — Gestionar mi carrito de compras; HU-012 — Completar una compra | HU-007, CA 1; HU-010, CA 6; HU-011, CA 5; HU-012, CA 6 |
| RF-037 | Autenticación y cuenta | Retorno a la pantalla de origen tras autenticarse | El sistema debe regresar automáticamente al actor, tras iniciar sesión con éxito desde una redirección por acción protegida, a la pantalla exacta desde la que partió. | Por definir | HU-007 — Regresar al contexto donde estaba después de iniciar sesión; HU-010 — Gestionar mis productos favoritos; HU-011 — Gestionar mi carrito de compras; HU-012 — Completar una compra | HU-007, CA 2; HU-010, CA 6; HU-011, CA 5; HU-012, CA 6 |
| RF-038 | Autenticación y cuenta | Retorno tras expiración de la sesión | El sistema debe regresar al actor a la misma pantalla protegida que estaba navegando cuando su sesión expiró, una vez que vuelva a iniciar sesión. | Por definir | HU-007 — Regresar al contexto donde estaba después de iniciar sesión | HU-007, CA 4 |
| RF-039 | Autenticación y cuenta | Precedencia de la verificación de correo sobre el retorno | El sistema debe dirigir a verificar su correo a la cuenta no verificada, en lugar de aplicar el retorno a la pantalla de origen. | Por definir | HU-007 — Regresar al contexto donde estaba después de iniciar sesión | HU-007, CA 5 |
| RF-040 | Autenticación y cuenta | Precedencia de la autorización por rol sobre el retorno | El sistema debe responder con el mensaje de acceso denegado correspondiente al actor autenticado que no tiene permiso sobre una sección, sin tratarlo como no autenticado ni redirigirlo al inicio de sesión. | Por definir | HU-007 — Regresar al contexto donde estaba después de iniciar sesión | HU-007, CA 5 |
| RF-041 | Autenticación y cuenta | Cierre de sesión | El sistema debe permitir a cualquier actor autenticado cerrar su sesión desde el menú de su cuenta o desde el panel correspondiente a su rol. | Por definir | HU-008 — Cerrar sesión | HU-008, CA 1 |
| RF-042 | Autenticación y cuenta | Invalidación del acceso tras cerrar sesión | El sistema debe dejar de usar las credenciales del actor al cerrar sesión e impedir el acceso a secciones protegidas hasta que vuelva a iniciar sesión. | Por definir | HU-008 — Cerrar sesión | HU-008, CA 2 |
| RF-043 | Autenticación y cuenta | Consulta de los datos de la cuenta | El sistema debe permitir a cualquier actor autenticado consultar su nombre, correo y foto de perfil actuales desde "Configuración de cuenta", disponible en su respectivo panel. | Por definir | HU-009 — Gestionar mi cuenta personal | HU-009, CA 1 |
| RF-044 | Autenticación y cuenta | Actualización de los datos de la cuenta | El sistema debe permitir a cualquier actor autenticado actualizar su nombre, su correo y su foto de perfil. | Por definir | HU-009 — Gestionar mi cuenta personal | HU-009, CA 2 |
| RF-045 | Autenticación y cuenta | Cambio de contraseña | El sistema debe permitir a cualquier actor autenticado cambiar su contraseña. | Por definir | HU-009 — Gestionar mi cuenta personal | HU-009, CA 3 |
| RF-046 | Autenticación y cuenta | Propagación inmediata de los cambios de cuenta | El sistema debe reflejar de inmediato en el resto del sistema los cambios realizados sobre los datos de la cuenta, sin requerir un nuevo inicio de sesión. | Por definir | HU-009 — Gestionar mi cuenta personal | HU-009, CA 4 |

### 5.3 Módulo: Favoritos

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-047 | Favoritos | Marcar un producto como favorito | El sistema debe permitir al Usuario autenticado marcar un producto como favorito desde su tarjeta en cualquier listado. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 1 |
| RF-048 | Favoritos | Persistencia de los favoritos en el servidor | El sistema debe persistir los favoritos en el servidor, de modo que el producto siga mostrándose como favorito al recargar la página o al navegar a otra sección y volver. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 2 y CA 3 |
| RF-049 | Favoritos | Quitar un producto de favoritos | El sistema debe permitir al Usuario quitar un producto de sus favoritos y conservar ese cambio tras recargar la página. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 4 |
| RF-050 | Favoritos | Listado de favoritos del Usuario | El sistema debe permitir al Usuario consultar en su panel el listado completo de sus productos favoritos. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 5 |
| RF-051 | Favoritos | Sincronización del estado de favorito entre pantallas | El sistema debe actualizar el estado de favorito de un producto en cualquier otra pantalla donde se muestre cuando el Usuario lo quita desde el listado de favoritos. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 5 |
| RF-052 | Favoritos | Restricción de favoritos al rol Usuario | El sistema debe mantener la funcionalidad de favoritos no disponible para las cuentas de tipo Empresa y Administrador. | Por definir | HU-010 — Gestionar mis productos favoritos | HU-010, CA 7 |

### 5.4 Módulo: Carrito y compra

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-053 | Carrito y compra | Agregar un producto al carrito | El sistema debe permitir al Usuario autenticado agregar a su carrito un producto desde el detalle del producto, indicando la cantidad y, si aplica, la variante de color específica. | Por definir | HU-011 — Gestionar mi carrito de compras | HU-011, CA 1 |
| RF-054 | Carrito y compra | Ajuste de cantidades limitado por el stock | El sistema debe permitir aumentar o disminuir la cantidad de un producto del carrito sin superar el stock disponible. | Por definir | HU-011 — Gestionar mi carrito de compras | HU-011, CA 2 |
| RF-055 | Carrito y compra | Quitar un producto del carrito | El sistema debe permitir al Usuario quitar un producto de su carrito. | Por definir | HU-011 — Gestionar mi carrito de compras | HU-011, CA 3 |
| RF-056 | Carrito y compra | Vaciar el carrito | El sistema debe permitir al Usuario vaciar por completo su carrito. | Por definir | HU-011 — Gestionar mi carrito de compras | HU-011, CA 3 |
| RF-057 | Carrito y compra | Subtotal del carrito | El sistema debe mostrar en el carrito el subtotal de los productos agregados. | Por definir | HU-011 — Gestionar mi carrito de compras | HU-011, CA 4 |
| RF-058 | Carrito y compra | Dirección de envío obligatoria para comprar | El sistema debe exigir que el Usuario tenga registrada una dirección de envío para completar la compra y solicitarle agregarla antes de continuar cuando no tenga ninguna. | Por definir | HU-012 — Completar una compra | HU-012, CA 1 |
| RF-059 | Carrito y compra | Cálculo del total de la compra | El sistema debe calcular el subtotal de la compra, un impuesto del 19 % y el total a pagar. | Por definir | HU-012 — Completar una compra | HU-012, CA 2 |
| RF-060 | Carrito y compra | Pago con saldo de RehniCoins | El sistema debe realizar el pago de la compra con el saldo de RehniCoins de la cuenta del Usuario y validar que el saldo disponible alcance a cubrir el total a pagar. | Por definir | HU-012 — Completar una compra | HU-012, CA 2 |
| RF-061 | Carrito y compra | Bloqueo de la compra por saldo insuficiente | El sistema debe informar al Usuario que su saldo no alcanza y no permitir confirmar la compra en ese caso. | Por definir | HU-012 — Completar una compra | HU-012, CA 3 |
| RF-062 | Carrito y compra | Bloqueo de la compra por stock insuficiente | El sistema debe informar al Usuario y no completar la compra cuando algún producto del carrito ya no tenga stock suficiente al momento de confirmar. | Por definir | HU-012 — Completar una compra | HU-012, CA 4 |
| RF-063 | Carrito y compra | Generación de pedidos por empresa vendedora | El sistema debe generar, al confirmar la compra con éxito, un pedido por cada empresa vendedora involucrada en el carrito. | Por definir | HU-012 — Completar una compra | HU-012, CA 5 |
| RF-064 | Carrito y compra | Vaciado del carrito tras la compra | El sistema debe dejar el carrito vacío tras confirmar la compra con éxito. | Por definir | HU-012 — Completar una compra | HU-012, CA 5 |
| RF-065 | Carrito y compra | Descuento del saldo tras la compra | El sistema debe descontar del saldo de RehniCoins del Usuario el importe de la compra confirmada con éxito. | Por definir | HU-012 — Completar una compra | HU-012, CA 5 |

### 5.5 Módulo: Pedidos

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-066 | Pedidos | Listado de pedidos del Usuario | El sistema debe permitir al Usuario consultar el listado de sus pedidos con su estado actual: pendiente, pagado, en preparación, enviado, entregado o cancelado. | Por definir | HU-013 — Consultar y cancelar mis pedidos | HU-013, CA 1 |
| RF-067 | Pedidos | Detalle de un pedido del Usuario | El sistema debe permitir al Usuario consultar el detalle de cada uno de sus pedidos. | Por definir | HU-013 — Consultar y cancelar mis pedidos | HU-013, CA 1 |
| RF-068 | Pedidos | Cancelación de pedido por el Usuario | El sistema debe permitir al Usuario cancelar un pedido únicamente mientras su estado sea pendiente o pagado, e impedirlo una vez que la empresa lo haya puesto en preparación, enviado o entregado. | Por definir | HU-013 — Consultar y cancelar mis pedidos | HU-013, CA 2 |
| RF-069 | Pedidos | Inmutabilidad de los estados finales del pedido | El sistema debe impedir cualquier cambio de estado sobre un pedido que se encuentre cancelado o entregado. | Por definir | HU-013 — Consultar y cancelar mis pedidos; HU-020 — Gestionar los pedidos que recibo | HU-013, CA 3; HU-020, CA 4 |
| RF-070 | Pedidos | Listado de pedidos de la Empresa | El sistema debe permitir a la Empresa consultar el listado de pedidos que incluyen sus productos, con su estado y el conteo de pedidos por estado. | Por definir | HU-020 — Gestionar los pedidos que recibo | HU-020, CA 1 |
| RF-071 | Pedidos | Detalle de un pedido para la Empresa | El sistema debe permitir a la Empresa consultar el detalle de un pedido que incluya sus productos. | Por definir | HU-020 — Gestionar los pedidos que recibo | HU-020, CA 2 |
| RF-072 | Pedidos | Avance del estado del pedido por la Empresa | El sistema debe permitir a la Empresa avanzar el estado de un pedido siguiendo el flujo permitido: pendiente o pagado → en preparación → enviado → entregado. | Por definir | HU-020 — Gestionar los pedidos que recibo | HU-020, CA 3 |
| RF-073 | Pedidos | Cancelación de pedido por la Empresa | El sistema debe permitir a la Empresa cancelar un pedido mientras su estado sea pendiente o pagado. | Por definir | HU-020 — Gestionar los pedidos que recibo | HU-020, CA 3 |

### 5.6 Módulo: Reseñas y calificaciones

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-074 | Reseñas y calificaciones | Reseña condicionada a pedido entregado | El sistema debe permitir al Usuario reseñar un producto únicamente si tiene al menos un pedido de ese producto en estado entregado. | Por definir | HU-014 — Escribir una reseña de un producto comprado | HU-014, CA 1 |
| RF-075 | Reseñas y calificaciones | Registro de calificación y comentario | El sistema debe permitir al Usuario calificar el producto de 1 a 5 estrellas y agregar un comentario opcional. | Por definir | HU-014 — Escribir una reseña de un producto comprado | HU-014, CA 2 |
| RF-076 | Reseñas y calificaciones | Límite de una reseña por producto | El sistema debe permitir al Usuario una sola reseña por producto e indicárselo, en lugar de mostrar nuevamente el formulario, cuando ya la haya escrito. | Por definir | HU-014 — Escribir una reseña de un producto comprado | HU-014, CA 3 |
| RF-077 | Reseñas y calificaciones | Eliminación de la propia reseña | El sistema debe permitir al Usuario eliminar su propia reseña. | Por definir | HU-014 — Escribir una reseña de un producto comprado | HU-014, CA 4 |
| RF-078 | Reseñas y calificaciones | Recálculo de la calificación promedio | El sistema debe recalcular, a partir de las reseñas reales existentes, la calificación promedio y el conteo de opiniones que se muestran en el producto y en el perfil de la empresa. | Por definir | HU-014 — Escribir una reseña de un producto comprado | HU-014, CA 5 |

### 5.7 Módulo: RehniCoins

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-079 | RehniCoins | Consulta del saldo de RehniCoins | El sistema debe permitir al Usuario consultar desde su panel su saldo actual de RehniCoins, donde 1 RehniCoin equivale a 1 peso colombiano. | Por definir | HU-015 — Consultar mi saldo y movimientos de RehniCoins | HU-015, CA 1 |
| RF-080 | RehniCoins | Historial de movimientos de la billetera | El sistema debe permitir al Usuario consultar el historial paginado de movimientos de su billetera, indicando el tipo de movimiento (recarga, compra, reembolso o ajuste), la fecha, la descripción y el monto. | Por definir | HU-015 — Consultar mi saldo y movimientos de RehniCoins | HU-015, CA 2 |
| RF-081 | RehniCoins | Origen del saldo y de los movimientos | El sistema debe obtener del servidor el saldo y los movimientos que presenta al Usuario, sin calcularlos ni simularlos en la pantalla. | Por definir | HU-015 — Consultar mi saldo y movimientos de RehniCoins | HU-015, CA 3 |
| RF-082 | RehniCoins | Selección de la cantidad a recargar | El sistema debe permitir al Usuario elegir la cantidad de RehniCoins a solicitar entre valores sugeridos o escribiendo un monto propio, admitiendo únicamente números enteros mayores que cero. | Por definir | HU-016 — Solicitar una recarga de RehniCoins | HU-016, CA 1 |
| RF-083 | RehniCoins | Canalización de la solicitud de recarga por WhatsApp | El sistema debe abrir, al confirmar la solicitud, una conversación de WhatsApp hacia el número oficial de Rehni-Market con un mensaje que incluya la cantidad solicitada y el correo de la cuenta del Usuario. | Por definir | HU-016 — Solicitar una recarga de RehniCoins | HU-016, CA 2 |
| RF-084 | RehniCoins | No acreditación automática por la solicitud | El sistema debe no acreditar saldo alguno como efecto de la solicitud de recarga, actualizando el saldo únicamente cuando un Administrador realice la recarga de forma manual. | Por definir | HU-016 — Solicitar una recarga de RehniCoins | HU-016, CA 3 |
| RF-085 | RehniCoins | Aviso por número de WhatsApp no configurado | El sistema debe informar el error, en lugar de intentar abrir una conversación inválida, cuando el número de WhatsApp de contacto no esté configurado en el entorno. | Por definir | HU-016 — Solicitar una recarga de RehniCoins | HU-016, CA 4 |
| RF-086 | RehniCoins | Recarga manual del saldo de un Usuario | El sistema debe permitir al Administrador recargar saldo a la billetera de un Usuario identificándolo por su correo electrónico e indicando la cantidad y una descripción opcional. | Por definir | HU-027 — Recargar el saldo de RehniCoins de un usuario | HU-027, CA 1 |
| RF-087 | RehniCoins | Restricción de la acreditación de saldo por rol | El sistema debe restringir la acreditación de saldo en una billetera a las cuentas Administrador y Owner, impidiéndola a cualquier otro rol. | Por definir | HU-027 — Recargar el saldo de RehniCoins de un usuario | HU-027, CA 2 |
| RF-088 | RehniCoins | Historial de recargas realizadas | El sistema debe permitir al Administrador consultar el historial paginado de recargas realizadas, con el usuario receptor, el monto y el administrador responsable de cada una. | Por definir | HU-027 — Recargar el saldo de RehniCoins de un usuario | HU-027, CA 3 |
| RF-089 | RehniCoins | Disponibilidad inmediata del saldo recargado | El sistema debe dejar disponible de inmediato el nuevo saldo del Usuario tras la recarga. | Por definir | HU-027 — Recargar el saldo de RehniCoins de un usuario | HU-027, CA 4 |

### 5.8 Módulo: Direcciones

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-090 | Direcciones | Registro de direcciones de envío | El sistema debe permitir al Usuario registrar una o más direcciones de envío con sus datos de contacto y de ubicación. | Por definir | HU-017 — Gestionar mis direcciones de envío | HU-017, CA 1 |
| RF-091 | Direcciones | Edición de una dirección de envío | El sistema debe permitir al Usuario editar una dirección de envío existente. | Por definir | HU-017 — Gestionar mis direcciones de envío | HU-017, CA 2 |
| RF-092 | Direcciones | Eliminación de una dirección de envío | El sistema debe permitir al Usuario eliminar una dirección de envío existente. | Por definir | HU-017 — Gestionar mis direcciones de envío | HU-017, CA 2 |
| RF-093 | Direcciones | Dirección predeterminada y su preselección | El sistema debe permitir al Usuario marcar una dirección como predeterminada y preseleccionarla al momento de comprar. | Por definir | HU-017 — Gestionar mis direcciones de envío | HU-017, CA 3 |

### 5.9 Módulo: Empresa (perfil y productos)

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-094 | Empresa (perfil y productos) | Consulta del perfil comercial | El sistema debe permitir a la Empresa consultar los datos de su perfil comercial, incluidos el nombre y la información de contacto. | Por definir | HU-018 — Gestionar el perfil de mi empresa | HU-018, CA 1 |
| RF-095 | Empresa (perfil y productos) | Actualización del perfil comercial | El sistema debe permitir a la Empresa actualizar los datos de su perfil comercial, incluidos el nombre y la información de contacto. | Por definir | HU-018 — Gestionar el perfil de mi empresa | HU-018, CA 1 |
| RF-096 | Empresa (perfil y productos) | Actualización de logo y banner | El sistema debe permitir a la Empresa actualizar su logo y su imagen de banner. | Por definir | HU-018 — Gestionar el perfil de mi empresa | HU-018, CA 2 |
| RF-097 | Empresa (perfil y productos) | Consulta del estado de verificación | El sistema debe permitir a la Empresa consultar su estado de verificación: certificado aprobado, pendiente o rechazado. | Por definir | HU-018 — Gestionar el perfil de mi empresa | HU-018, CA 3 |
| RF-098 | Empresa (perfil y productos) | Estado de verificación no modificable por la Empresa | El sistema debe impedir que la Empresa modifique por sí misma su estado de verificación, que es determinado por la administración. | Por definir | HU-018 — Gestionar el perfil de mi empresa | HU-018, CA 3 |
| RF-099 | Empresa (perfil y productos) | Creación de un producto | El sistema debe permitir a la Empresa crear un producto indicando nombre, descripción, categoría, precio, stock, imágenes y, cuando la categoría las defina, sus especificaciones. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 1 |
| RF-100 | Empresa (perfil y productos) | Descuento sobre un producto | El sistema debe permitir a la Empresa definir un descuento porcentual sobre un producto y activarlo o desactivarlo. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 2 |
| RF-101 | Empresa (perfil y productos) | Edición de un producto | El sistema debe permitir a la Empresa editar la información de un producto ya creado, incluidas sus imágenes. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 3 |
| RF-102 | Empresa (perfil y productos) | Visibilidad pública del producto | El sistema debe permitir a la Empresa activar y desactivar la visibilidad pública de un producto. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 4 |
| RF-103 | Empresa (perfil y productos) | Eliminación de un producto | El sistema debe permitir a la Empresa eliminar un producto de su catálogo. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 4 |
| RF-104 | Empresa (perfil y productos) | Creación de variantes de color | El sistema debe permitir a la Empresa crear variantes de color para un producto, cada una con su propio precio, descuento, stock e imágenes. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 5 |
| RF-105 | Empresa (perfil y productos) | Edición de una variante | El sistema debe permitir a la Empresa editar una variante de color existente. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 6 |
| RF-106 | Empresa (perfil y productos) | Eliminación de una variante | El sistema debe permitir a la Empresa eliminar una variante de color existente. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 6 |
| RF-107 | Empresa (perfil y productos) | Gestión exclusiva por la empresa propietaria | El sistema debe permitir la gestión de un producto y de sus variantes únicamente a la misma empresa que los creó. | Por definir | HU-019 — Publicar y gestionar mis productos | HU-019, CA 7 |

### 5.10 Módulo: Finanzas de empresa

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-108 | Finanzas de empresa | Registro de cuentas bancarias | El sistema debe permitir a la Empresa registrar una o más cuentas bancarias. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 1 |
| RF-109 | Finanzas de empresa | Cuenta bancaria predeterminada | El sistema debe permitir a la Empresa marcar una de sus cuentas bancarias como predeterminada, que será la utilizada para sus liquidaciones. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 1 |
| RF-110 | Finanzas de empresa | Edición de una cuenta bancaria | El sistema debe permitir a la Empresa editar una cuenta bancaria registrada. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 2 |
| RF-111 | Finanzas de empresa | Eliminación de una cuenta bancaria | El sistema debe permitir a la Empresa eliminar una cuenta bancaria registrada. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 2 |
| RF-112 | Finanzas de empresa | Consulta del balance disponible | El sistema debe permitir a la Empresa consultar su balance disponible. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 3 |
| RF-113 | Finanzas de empresa | Consulta del historial de liquidaciones | El sistema debe permitir a la Empresa consultar el historial de liquidaciones ya generadas por la administración, con su estado: pendiente o pagada. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias | HU-021, CA 3 |
| RF-114 | Finanzas de empresa | Cuenta bancaria predeterminada requerida para liquidar | El sistema debe exigir que la empresa tenga configurada una cuenta bancaria predeterminada para que pueda existir una liquidación suya. | Por definir | HU-021 — Gestionar mi información financiera y cuentas bancarias; HU-026 — Generar y administrar liquidaciones a empresas | HU-021, CA 4; HU-026, CA 5 |

### 5.11 Módulo: Administración de usuarios y empresas

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-115 | Administración de usuarios y empresas | Listado de usuarios registrados | El sistema debe permitir al Administrador consultar el listado de usuarios registrados. | Por definir | HU-022 — Gestionar cuentas de usuario | HU-022, CA 1 |
| RF-116 | Administración de usuarios y empresas | Detalle de una cuenta de usuario | El sistema debe permitir al Administrador consultar el detalle de cada cuenta de usuario. | Por definir | HU-022 — Gestionar cuentas de usuario | HU-022, CA 1 |
| RF-117 | Administración de usuarios y empresas | Actualización de una cuenta de usuario | El sistema debe permitir al Administrador actualizar la información de una cuenta de usuario. | Por definir | HU-022 — Gestionar cuentas de usuario | HU-022, CA 2 |
| RF-118 | Administración de usuarios y empresas | Cambio de estado de una cuenta | El sistema debe permitir al Administrador cambiar el estado de una cuenta entre activa y bloqueada. | Por definir | HU-022 — Gestionar cuentas de usuario | HU-022, CA 2 |
| RF-119 | Administración de usuarios y empresas | Eliminación de una cuenta | El sistema debe permitir al Administrador eliminar una cuenta. | Por definir | HU-022 — Gestionar cuentas de usuario | HU-022, CA 3 |
| RF-120 | Administración de usuarios y empresas | Restricción del Administrador frente al rol Owner | El sistema debe impedir que un Administrador que no sea Owner modifique una cuenta Owner, la bloquee o asigne el rol Owner a una cuenta. | Por definir | HU-022 — Gestionar cuentas de usuario; HU-029 — Administrar cuentas con privilegios elevados | HU-022, CA 4; HU-029, CA 1 y CA 2 |
| RF-121 | Administración de usuarios y empresas | Prohibición de eliminar cuentas Owner | El sistema debe impedir la eliminación de cualquier cuenta con rol Owner por parte de cualquier actor, incluido otro Owner. | Por definir | HU-022 — Gestionar cuentas de usuario; HU-029 — Administrar cuentas con privilegios elevados | HU-022, CA 5; HU-029, CA 3 |
| RF-122 | Administración de usuarios y empresas | Listado de empresas registradas | El sistema debe permitir al Administrador consultar el listado de empresas registradas. | Por definir | HU-023 — Gestionar empresas registradas | HU-023, CA 1 |
| RF-123 | Administración de usuarios y empresas | Detalle de una empresa registrada | El sistema debe permitir al Administrador consultar el detalle de cada empresa registrada. | Por definir | HU-023 — Gestionar empresas registradas | HU-023, CA 1 |
| RF-124 | Administración de usuarios y empresas | Aprobación o rechazo de la certificación de una empresa | El sistema debe permitir al Administrador aprobar o rechazar la certificación de una empresa. | Por definir | HU-023 — Gestionar empresas registradas | HU-023, CA 2 |
| RF-125 | Administración de usuarios y empresas | Activación o desactivación de la cuenta de una empresa | El sistema debe permitir al Administrador activar o desactivar la cuenta de una empresa. | Por definir | HU-023 — Gestionar empresas registradas | HU-023, CA 3 |
| RF-126 | Administración de usuarios y empresas | Asignación del rol Owner reservada al Owner | El sistema debe permitir asignar el rol Owner a otra cuenta únicamente a una cuenta Owner. | Por definir | HU-029 — Administrar cuentas con privilegios elevados | HU-029, CA 1 |
| RF-127 | Administración de usuarios y empresas | Administración de cuentas Owner reservada al Owner | El sistema debe permitir modificar, bloquear o desbloquear una cuenta Owner únicamente a otra cuenta Owner. | Por definir | HU-029 — Administrar cuentas con privilegios elevados | HU-029, CA 2 |
| RF-128 | Administración de usuarios y empresas | Alcance de capacidades del rol Owner | El sistema debe otorgar al rol Owner las mismas capacidades que al rol Administrador descritas en las historias HU-022 a HU-028, además de las capacidades exclusivas de HU-029. | Por definir | HU-029 — Administrar cuentas con privilegios elevados | HU-029, CA 4; §2 — Actores |

### 5.12 Módulo: Catálogo administrativo y anuncios

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-129 | Catálogo administrativo y anuncios | Creación de categorías de productos | El sistema debe permitir al Administrador crear categorías de productos. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 1 |
| RF-130 | Catálogo administrativo y anuncios | Edición de categorías de productos | El sistema debe permitir al Administrador editar una categoría de productos existente. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 1 |
| RF-131 | Catálogo administrativo y anuncios | Activación o desactivación de categorías | El sistema debe permitir al Administrador activar o desactivar una categoría de productos. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 1 |
| RF-132 | Catálogo administrativo y anuncios | Eliminación de categorías de productos | El sistema debe permitir al Administrador eliminar una categoría de productos. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 1 |
| RF-133 | Catálogo administrativo y anuncios | Definición de especificaciones por categoría | El sistema debe permitir al Administrador definir las especificaciones que las empresas deben completar al crear un producto de cada categoría. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 2 |
| RF-134 | Catálogo administrativo y anuncios | Creación de colores para variantes | El sistema debe permitir al Administrador crear los colores disponibles para las variantes de producto. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 3 |
| RF-135 | Catálogo administrativo y anuncios | Edición de colores para variantes | El sistema debe permitir al Administrador editar un color disponible para variantes de producto. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 3 |
| RF-136 | Catálogo administrativo y anuncios | Eliminación de colores para variantes | El sistema debe permitir al Administrador eliminar un color disponible para variantes de producto. | Por definir | HU-024 — Gestionar el catálogo de la plataforma | HU-024, CA 3 |
| RF-137 | Catálogo administrativo y anuncios | Creación de un anuncio | El sistema debe permitir al Administrador crear un anuncio con imagen, texto y enlace. *(Enunciado conservado literalmente de la fuente; ver OBS-005.)* | Por definir | HU-025 — Gestionar los anuncios del Home | HU-025, CA 1 |
| RF-138 | Catálogo administrativo y anuncios | Edición de un anuncio | El sistema debe permitir al Administrador editar un anuncio existente. | Por definir | HU-025 — Gestionar los anuncios del Home | HU-025, CA 2 |
| RF-139 | Catálogo administrativo y anuncios | Activación o desactivación de un anuncio | El sistema debe permitir al Administrador activar o desactivar un anuncio. | Por definir | HU-025 — Gestionar los anuncios del Home | HU-025, CA 2 y CA 3 |
| RF-140 | Catálogo administrativo y anuncios | Eliminación de un anuncio | El sistema debe permitir al Administrador eliminar un anuncio. | Por definir | HU-025 — Gestionar los anuncios del Home | HU-025, CA 2 |

### 5.13 Módulo: Liquidaciones

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-141 | Liquidaciones | Generación de una liquidación | El sistema debe permitir al Administrador generar una liquidación para una empresa correspondiente a un periodo disponible, calculada sobre sus ventas válidas menos la comisión de la plataforma. | Por definir | HU-026 — Generar y administrar liquidaciones a empresas | HU-026, CA 1 |
| RF-142 | Liquidaciones | Vista previa de una liquidación | El sistema debe permitir al Administrador consultar una vista previa de una liquidación antes de generarla. | Por definir | HU-026 — Generar y administrar liquidaciones a empresas | HU-026, CA 2 |
| RF-143 | Liquidaciones | Listado de liquidaciones generadas | El sistema debe permitir al Administrador consultar el listado de liquidaciones generadas con su estado: pendiente o pagada. | Por definir | HU-026 — Generar y administrar liquidaciones a empresas | HU-026, CA 3 |
| RF-144 | Liquidaciones | Marcado de una liquidación como pagada | El sistema debe permitir al Administrador marcar como pagada una liquidación en estado pendiente. | Por definir | HU-026 — Generar y administrar liquidaciones a empresas | HU-026, CA 4 |
| RF-145 | Liquidaciones | Bloqueo del remarcado de una liquidación pagada | El sistema debe impedir que una liquidación ya pagada vuelva a marcarse como pagada. | Por definir | HU-026 — Generar y administrar liquidaciones a empresas | HU-026, CA 4 |

### 5.14 Módulo: Panel administrativo

| ID | Módulo | Nombre del requisito | Descripción del requisito funcional | Prioridad | Historia de usuario asociada | Criterio de aceptación / fuente |
|---|---|---|---|---|---|---|
| RF-146 | Panel administrativo | Estadísticas generales de la plataforma | El sistema debe presentar al Administrador, al ingresar a su panel, las estadísticas generales de la plataforma, incluidos los totales relevantes de usuarios y empresas. *(Enumeración no cerrada en la fuente; ver OBS-006.)* | Por definir | HU-028 — Consultar el panel de estadísticas de la plataforma | HU-028, CA 1 |
| RF-147 | Panel administrativo | Consulta de la actividad reciente | El sistema debe permitir al Administrador consultar la actividad reciente de la plataforma. | Por definir | HU-028 — Consultar el panel de estadísticas de la plataforma | HU-028, CA 2 |
| RF-148 | Panel administrativo | Consulta de los usuarios más recientes | El sistema debe permitir al Administrador consultar los usuarios más recientes registrados. | Por definir | HU-028 — Consultar el panel de estadísticas de la plataforma | HU-028, CA 2 |

---

## 6. Matriz de trazabilidad

Todas las referencias corresponden al archivo `docs/docs++/RehniMarket-HU.md`. La columna "Referencia en la fuente" indica la sección y la historia donde se encuentra el criterio.

| ID del requisito | Historia de usuario | Criterio de aceptación o regla de negocio | Referencia en la fuente |
|---|---|---|---|
| RF-001 | HU-001 | CA 1 — Selección de productos destacados en el Home | §3.1 / HU-001 |
| RF-002 | HU-001 | CA 1 — Categorías disponibles en el Home | §3.1 / HU-001 |
| RF-003 | HU-001 | CA 2 — Acceso al listado completo de productos | §3.1 / HU-001 |
| RF-004 | HU-001 | CA 2 — Filtros por categoría, precio, stock y descuento | §3.1 / HU-001 |
| RF-005 | HU-001 | CA 3 — Ordenamiento del listado | §3.1 / HU-001 |
| RF-006 | HU-001 | CA 4 — Búsqueda por nombre en encabezado y listado | §3.1 / HU-001 |
| RF-007 | HU-001; HU-025 | CA 5 (HU-001) y CA 3 (HU-025) — RN-028 | §3.1 / HU-001; §3.4 / HU-025 |
| RF-008 | HU-001 | CA 6 — RN-029 (datos no simulados) | §3.1 / HU-001 |
| RF-009 | HU-002 | CA 1 — Acceso al detalle desde cualquier listado | §3.1 / HU-002 |
| RF-010 | HU-002 | CA 2 — Categoría, nombre, precio, precio anterior y descuento | §3.1 / HU-002 |
| RF-011 | HU-002 | CA 2 — RN-018 (calificación real o estado sin opiniones) | §3.1 / HU-002 |
| RF-012 | HU-002 | CA 3 — Galería de imágenes | §3.1 / HU-002 |
| RF-013 | HU-002 | CA 3 — Variantes de color con imagen, precio y stock propios | §3.1 / HU-002 |
| RF-014 | HU-002 | CA 4 — Stock disponible real | §3.1 / HU-002 |
| RF-015 | HU-002 | CA 4 — Opiniones existentes | §3.1 / HU-002 |
| RF-016 | HU-002 | CA 5 — Datos del vendedor y acceso a su perfil | §3.1 / HU-002 |
| RF-017 | HU-002 | CA 6 — Inicio de la página desde la parte superior | §3.1 / HU-002 |
| RF-018 | HU-003 | CA 1 — Acceso al perfil desde el detalle del producto | §3.1 / HU-003 |
| RF-019 | HU-003 | CA 2 — Nombre, logo y estado de verificación real | §3.1 / HU-003 |
| RF-020 | HU-003 | CA 2 — RN-018 (calificación agregada de la empresa) | §3.1 / HU-003 |
| RF-021 | HU-003 | CA 3 — RN-030 (solo productos activos y disponibles, paginados) | §3.1 / HU-003 |
| RF-022 | HU-004 | CA 1 — Registro de comprador | §3.1 / HU-004 |
| RF-023 | HU-004 | CA 2 — Registro de empresa | §3.1 / HU-004 |
| RF-024 | HU-004; HU-005 | CA 3 (HU-004) y CA 4 (HU-005) — RN-001 | §3.1 / HU-004, HU-005 |
| RF-025 | HU-004 | CA 4 — Certificación pendiente con inicio de sesión permitido | §3.1 / HU-004 |
| RF-026 | HU-004; HU-023 | CA 4 (HU-004) y CA 2 (HU-023) — RN-002 | §3.1 / HU-004; §3.4 / HU-023 |
| RF-027 | HU-005 | CA 1 — Envío del código de verificación | §3.1 / HU-005 |
| RF-028 | HU-005 | CA 2 — Verificación mediante código | §3.1 / HU-005 |
| RF-029 | HU-005 | CA 3 — Corrección del correo y reenvío | §3.1 / HU-005 |
| RF-030 | HU-005 | CA 4 — RN-001 | §3.1 / HU-005 |
| RF-031 | HU-006 | CA 1 — Inicio de sesión con correo y contraseña | §3.1 / HU-006 |
| RF-032 | HU-006 | CA 2 — Código de recuperación por correo | §3.1 / HU-006 |
| RF-033 | HU-006 | CA 2 — Nueva contraseña con el código | §3.1 / HU-006 |
| RF-034 | HU-006 | CA 3 — RN-004 | §3.1 / HU-006 |
| RF-035 | HU-006; HU-007 | CA 4 (HU-006) y CA 3 (HU-007) — Destino por defecto | §3.1 / HU-006, HU-007 |
| RF-036 | HU-007; HU-010; HU-011; HU-012 | CA 1 (HU-007), CA 6 (HU-010), CA 5 (HU-011), CA 6 (HU-012) | §3.1 / HU-007; §3.2 / HU-010, HU-011, HU-012 |
| RF-037 | HU-007; HU-010; HU-011; HU-012 | CA 2 (HU-007), CA 6 (HU-010), CA 5 (HU-011), CA 6 (HU-012) | §3.1 / HU-007; §3.2 / HU-010, HU-011, HU-012 |
| RF-038 | HU-007 | CA 4 — Retorno tras expiración de sesión | §3.1 / HU-007 |
| RF-039 | HU-007 | CA 5 — RN-031 y RN-001 | §3.1 / HU-007 |
| RF-040 | HU-007 | CA 5 — RN-031 | §3.1 / HU-007 |
| RF-041 | HU-008 | CA 1 — Cierre de sesión desde el menú o el panel | §3.2 / HU-008 |
| RF-042 | HU-008 | CA 2 — Invalidación del acceso protegido | §3.2 / HU-008 |
| RF-043 | HU-009 | CA 1 — Consulta de nombre, correo y foto | §3.2 / HU-009 |
| RF-044 | HU-009 | CA 2 — Actualización de nombre, correo y foto | §3.2 / HU-009 |
| RF-045 | HU-009 | CA 3 — Cambio de contraseña | §3.2 / HU-009 |
| RF-046 | HU-009 | CA 4 — Propagación inmediata sin re-autenticación | §3.2 / HU-009 |
| RF-047 | HU-010 | CA 1 — Marcar favorito desde la tarjeta | §3.2 / HU-010 |
| RF-048 | HU-010 | CA 2 y CA 3 — Persistencia en el servidor | §3.2 / HU-010 |
| RF-049 | HU-010 | CA 4 — Quitar favorito con persistencia | §3.2 / HU-010 |
| RF-050 | HU-010 | CA 5 — Listado de favoritos en el panel | §3.2 / HU-010 |
| RF-051 | HU-010 | CA 5 — Sincronización entre pantallas | §3.2 / HU-010 |
| RF-052 | HU-010 | CA 7 — RN-005 | §3.2 / HU-010 |
| RF-053 | HU-011 | CA 1 — Agregar producto y variante con cantidad | §3.2 / HU-011 |
| RF-054 | HU-011 | CA 2 — RN-006 | §3.2 / HU-011 |
| RF-055 | HU-011 | CA 3 — Quitar producto del carrito | §3.2 / HU-011 |
| RF-056 | HU-011 | CA 3 — Vaciar el carrito | §3.2 / HU-011 |
| RF-057 | HU-011 | CA 4 — Subtotal del carrito | §3.2 / HU-011 |
| RF-058 | HU-012 | CA 1 — RN-007 | §3.2 / HU-012 |
| RF-059 | HU-012 | CA 2 — RN-009 (impuesto del 19 %) | §3.2 / HU-012 |
| RF-060 | HU-012 | CA 2 — RN-008 (pago con RehniCoins) | §3.2 / HU-012 |
| RF-061 | HU-012 | CA 3 — Bloqueo por saldo insuficiente | §3.2 / HU-012 |
| RF-062 | HU-012 | CA 4 — Bloqueo por stock insuficiente | §3.2 / HU-012 |
| RF-063 | HU-012 | CA 5 — RN-011 (un pedido por empresa) | §3.2 / HU-012 |
| RF-064 | HU-012 | CA 5 — Vaciado del carrito tras la compra | §3.2 / HU-012 |
| RF-065 | HU-012 | CA 5 — Descuento del saldo | §3.2 / HU-012 |
| RF-066 | HU-013 | CA 1 — Listado de pedidos con estado | §3.2 / HU-013 |
| RF-067 | HU-013 | CA 1 — Detalle del pedido | §3.2 / HU-013 |
| RF-068 | HU-013 | CA 2 — RN-012 | §3.2 / HU-013 |
| RF-069 | HU-013; HU-020 | CA 3 (HU-013) y CA 4 (HU-020) — RN-014 | §3.2 / HU-013; §3.3 / HU-020 |
| RF-070 | HU-020 | CA 1 — Listado y conteo por estado | §3.3 / HU-020 |
| RF-071 | HU-020 | CA 2 — Detalle del pedido | §3.3 / HU-020 |
| RF-072 | HU-020 | CA 3 — RN-013 (flujo de estados) | §3.3 / HU-020 |
| RF-073 | HU-020 | CA 3 — Cancelación en pendiente o pagado | §3.3 / HU-020 |
| RF-074 | HU-014 | CA 1 — RN-015 | §3.2 / HU-014 |
| RF-075 | HU-014 | CA 2 — RN-017 | §3.2 / HU-014 |
| RF-076 | HU-014 | CA 3 — RN-016 | §3.2 / HU-014 |
| RF-077 | HU-014 | CA 4 — Eliminación de la propia reseña | §3.2 / HU-014 |
| RF-078 | HU-014 | CA 5 — RN-018 | §3.2 / HU-014 |
| RF-079 | HU-015 | CA 1 — RN-010 (1 RehniCoin = 1 COP) | §3.2 / HU-015 |
| RF-080 | HU-015 | CA 2 — Historial paginado con tipo, fecha, descripción y monto | §3.2 / HU-015 |
| RF-081 | HU-015 | CA 3 — RN-029 | §3.2 / HU-015 |
| RF-082 | HU-016 | CA 1 — RN-020 (entero mayor que cero) | §3.2 / HU-016 |
| RF-083 | HU-016 | CA 2 — RN-032 | §3.2 / HU-016 |
| RF-084 | HU-016 | CA 3 — RN-019 | §3.2 / HU-016 |
| RF-085 | HU-016 | CA 4 — RN-032 | §3.2 / HU-016 |
| RF-086 | HU-027 | CA 1 — RN-019 (recarga manual por el administrador) | §3.4 / HU-027 |
| RF-087 | HU-027 | CA 2 — RN-021 | §3.4 / HU-027 |
| RF-088 | HU-027 | CA 3 — Historial paginado de recargas | §3.4 / HU-027 |
| RF-089 | HU-027 | CA 4 — Disponibilidad inmediata del saldo | §3.4 / HU-027 |
| RF-090 | HU-017 | CA 1 — Registro de direcciones | §3.2 / HU-017 |
| RF-091 | HU-017 | CA 2 — Edición de dirección | §3.2 / HU-017 |
| RF-092 | HU-017 | CA 2 — Eliminación de dirección | §3.2 / HU-017 |
| RF-093 | HU-017 | CA 3 — Dirección predeterminada y preselección | §3.2 / HU-017 |
| RF-094 | HU-018 | CA 1 — Consulta del perfil comercial | §3.3 / HU-018 |
| RF-095 | HU-018 | CA 1 — Actualización del perfil comercial | §3.3 / HU-018 |
| RF-096 | HU-018 | CA 2 — Logo y banner | §3.3 / HU-018 |
| RF-097 | HU-018 | CA 3 — RN-003 (consulta del estado de verificación) | §3.3 / HU-018 |
| RF-098 | HU-018 | CA 3 — RN-003 (no modificable por la empresa) | §3.3 / HU-018 |
| RF-099 | HU-019 | CA 1 — Creación de producto con especificaciones de la categoría | §3.3 / HU-019 |
| RF-100 | HU-019 | CA 2 — Descuento porcentual activable | §3.3 / HU-019 |
| RF-101 | HU-019 | CA 3 — Edición de producto e imágenes | §3.3 / HU-019 |
| RF-102 | HU-019 | CA 4 — Visibilidad pública del producto | §3.3 / HU-019 |
| RF-103 | HU-019 | CA 4 — Eliminación del producto | §3.3 / HU-019 |
| RF-104 | HU-019 | CA 5 — Variantes de color con datos propios | §3.3 / HU-019 |
| RF-105 | HU-019 | CA 6 — Edición de variante | §3.3 / HU-019 |
| RF-106 | HU-019 | CA 6 — Eliminación de variante | §3.3 / HU-019 |
| RF-107 | HU-019 | CA 7 — RN-022 | §3.3 / HU-019 |
| RF-108 | HU-021 | CA 1 — Registro de cuentas bancarias | §3.3 / HU-021 |
| RF-109 | HU-021 | CA 1 — Cuenta predeterminada para liquidaciones | §3.3 / HU-021 |
| RF-110 | HU-021 | CA 2 — Edición de cuenta bancaria | §3.3 / HU-021 |
| RF-111 | HU-021 | CA 2 — Eliminación de cuenta bancaria | §3.3 / HU-021 |
| RF-112 | HU-021 | CA 3 — Balance disponible | §3.3 / HU-021 |
| RF-113 | HU-021 | CA 3 — Historial de liquidaciones con estado | §3.3 / HU-021 |
| RF-114 | HU-021; HU-026 | CA 4 (HU-021) y CA 5 (HU-026) — RN-023 | §3.3 / HU-021; §3.4 / HU-026 |
| RF-115 | HU-022 | CA 1 — Listado de usuarios | §3.4 / HU-022 |
| RF-116 | HU-022 | CA 1 — Detalle de usuario | §3.4 / HU-022 |
| RF-117 | HU-022 | CA 2 — Actualización de la cuenta | §3.4 / HU-022 |
| RF-118 | HU-022 | CA 2 — Estado activa/bloqueada | §3.4 / HU-022 |
| RF-119 | HU-022 | CA 3 — Eliminación de cuenta | §3.4 / HU-022 |
| RF-120 | HU-022; HU-029 | CA 4 (HU-022), CA 1 y CA 2 (HU-029) — RN-026 | §3.4 / HU-022, HU-029 |
| RF-121 | HU-022; HU-029 | CA 5 (HU-022) y CA 3 (HU-029) — RN-027 | §3.4 / HU-022, HU-029 |
| RF-122 | HU-023 | CA 1 — Listado de empresas | §3.4 / HU-023 |
| RF-123 | HU-023 | CA 1 — Detalle de empresa | §3.4 / HU-023 |
| RF-124 | HU-023 | CA 2 — RN-002 y RN-003 | §3.4 / HU-023 |
| RF-125 | HU-023 | CA 3 — Activación/desactivación de la cuenta de empresa | §3.4 / HU-023 |
| RF-126 | HU-029 | CA 1 — RN-026 | §3.4 / HU-029 |
| RF-127 | HU-029 | CA 2 — RN-026 | §3.4 / HU-029 |
| RF-128 | HU-029 | CA 4 y §2 Actores — Alcance del rol Owner | §2; §3.4 / HU-029 |
| RF-129 | HU-024 | CA 1 — Creación de categorías | §3.4 / HU-024 |
| RF-130 | HU-024 | CA 1 — Edición de categorías | §3.4 / HU-024 |
| RF-131 | HU-024 | CA 1 — Activación/desactivación de categorías | §3.4 / HU-024 |
| RF-132 | HU-024 | CA 1 — Eliminación de categorías | §3.4 / HU-024 |
| RF-133 | HU-024 | CA 2 — Especificaciones obligatorias por categoría | §3.4 / HU-024 |
| RF-134 | HU-024 | CA 3 — Creación de colores | §3.4 / HU-024 |
| RF-135 | HU-024 | CA 3 — Edición de colores | §3.4 / HU-024 |
| RF-136 | HU-024 | CA 3 — Eliminación de colores | §3.4 / HU-024 |
| RF-137 | HU-025 | CA 1 — Anuncio con imagen, texto y enlace (ver OBS-005) | §3.4 / HU-025 |
| RF-138 | HU-025 | CA 2 — Edición de anuncio | §3.4 / HU-025 |
| RF-139 | HU-025 | CA 2 y CA 3 — RN-028 | §3.4 / HU-025 |
| RF-140 | HU-025 | CA 2 — Eliminación de anuncio | §3.4 / HU-025 |
| RF-141 | HU-026 | CA 1 — RN-025 y RN-023 | §3.4 / HU-026 |
| RF-142 | HU-026 | CA 2 — Vista previa de liquidación | §3.4 / HU-026 |
| RF-143 | HU-026 | CA 3 — Listado con estado | §3.4 / HU-026 |
| RF-144 | HU-026 | CA 4 — Marcado como pagada | §3.4 / HU-026 |
| RF-145 | HU-026 | CA 4 — RN-024 | §3.4 / HU-026 |
| RF-146 | HU-028 | CA 1 — Estadísticas generales (ver OBS-006) | §3.4 / HU-028 |
| RF-147 | HU-028 | CA 2 — Actividad reciente | §3.4 / HU-028 |
| RF-148 | HU-028 | CA 2 — Usuarios más recientes | §3.4 / HU-028 |

**Cobertura de la trazabilidad:** los 148 requisitos tienen historia de usuario y criterio de aceptación identificados. Las 29 historias de usuario de la fuente (HU-001 a HU-029) originan al menos un requisito. No quedaron requisitos sin trazar ni historias sin cubrir.

---

## 7. Reglas de negocio

Reglas de negocio **explícitas** en las historias de usuario. No se incluyen reglas inferidas ni derivadas del código.

| ID | Regla de negocio | Requisitos relacionados | Fuente |
|---|---|---|---|
| RN-001 | Una cuenta debe tener su correo verificado antes de poder iniciar sesión; el intento sin verificar se rechaza indicando explícitamente el motivo. | RF-024, RF-030, RF-039 | HU-004 CA 3; HU-005 CA 4; HU-007 CA 5 |
| RN-002 | Solo una empresa con certificación aprobada por la administración se muestra como "empresa verificada" ante los compradores. | RF-026, RF-124 | HU-004 CA 4; HU-023 CA 2 |
| RN-003 | El estado de verificación de una empresa (aprobado, pendiente o rechazado) lo determina la administración; para la empresa es informativo y no modificable. | RF-097, RF-098, RF-124 | HU-018 CA 3; HU-023 CA 2 |
| RN-004 | Un fallo de inicio de sesión por credenciales inválidas no revela cuál de los dos datos es incorrecto. | RF-034 | HU-006 CA 3 |
| RN-005 | La funcionalidad de favoritos está disponible únicamente para el rol Usuario; no para Empresa ni Administrador. | RF-052 | HU-010 CA 7 |
| RN-006 | La cantidad de un producto en el carrito no puede superar el stock disponible. | RF-054 | HU-011 CA 2 |
| RN-007 | Completar una compra requiere que el Usuario tenga registrada al menos una dirección de envío. | RF-058, RF-093 | HU-012 CA 1 |
| RN-008 | El pago de una compra se realiza con el saldo de RehniCoins de la cuenta del Usuario. | RF-060, RF-061, RF-065 | HU-012 CA 2 y CA 3 |
| RN-009 | El total de una compra incluye un impuesto del 19 % sobre el subtotal. | RF-059 | HU-012 CA 2 |
| RN-010 | 1 RehniCoin equivale a 1 peso colombiano. | RF-079 | HU-015 CA 1 |
| RN-011 | Una compra genera un pedido por cada empresa vendedora involucrada. | RF-063 | HU-012 CA 5 |
| RN-012 | El Usuario puede cancelar un pedido únicamente mientras su estado sea pendiente o pagado. | RF-068 | HU-013 CA 2 |
| RN-013 | El flujo de estados de un pedido es: pendiente o pagado → en preparación → enviado → entregado. | RF-072, RF-066 | HU-020 CA 3; HU-013 CA 1 |
| RN-014 | Un pedido entregado o cancelado no admite más cambios de estado. | RF-069 | HU-013 CA 3; HU-020 CA 4 |
| RN-015 | Un Usuario solo puede reseñar un producto del que tenga al menos un pedido en estado entregado. | RF-074 | HU-014 CA 1 |
| RN-016 | Un Usuario puede dejar una sola reseña por producto. | RF-076 | HU-014 CA 3 |
| RN-017 | La calificación de una reseña es de 1 a 5 estrellas y el comentario es opcional. | RF-075 | HU-014 CA 2 |
| RN-018 | La calificación promedio y el conteo de opiniones del producto y de la empresa se recalculan a partir de las reseñas reales existentes. | RF-011, RF-020, RF-078 | HU-014 CA 5; HU-002 CA 2; HU-003 CA 2 |
| RN-019 | Una solicitud de recarga no acredita saldo automáticamente: el saldo se actualiza solo cuando un Administrador realiza la recarga manualmente tras verificar el pago fuera de la plataforma. | RF-084, RF-086 | HU-016 CA 3; HU-027 (narrativa y CA 1) |
| RN-020 | El monto de una solicitud de recarga debe ser un número entero mayor que cero. | RF-082 | HU-016 CA 1 |
| RN-021 | Acreditar saldo en una billetera es exclusivo de las cuentas Administrador y Owner. | RF-087 | HU-027 CA 2 |
| RN-022 | Un producto y sus variantes solo pueden ser gestionados por la empresa que los creó. | RF-107 | HU-019 CA 7 |
| RN-023 | Una liquidación requiere que la empresa tenga configurada una cuenta bancaria predeterminada. | RF-114, RF-109, RF-141 | HU-021 CA 4; HU-026 CA 5 |
| RN-024 | Una liquidación ya pagada no puede volver a marcarse como pagada. | RF-145 | HU-026 CA 4 |
| RN-025 | El valor de una liquidación se calcula sobre las ventas válidas de la empresa en el periodo menos la comisión de la plataforma. | RF-141 | HU-026 CA 1 |
| RN-026 | Un Administrador que no sea Owner no puede modificar ni bloquear una cuenta Owner, ni asignar el rol Owner; esas acciones son exclusivas del rol Owner. | RF-120, RF-126, RF-127 | HU-022 CA 4; HU-029 CA 1 y CA 2 |
| RN-027 | Ninguna cuenta con rol Owner puede eliminarse, ni siquiera por otro Owner. | RF-121 | HU-022 CA 5; HU-029 CA 3 |
| RN-028 | Solo los anuncios activos se muestran a los visitantes en el Home. | RF-007, RF-139 | HU-025 CA 3 |
| RN-029 | Los datos mostrados al actor (precio, descuento, stock, saldo y movimientos) provienen del catálogo real y del servidor; no se simulan ni se calculan en la pantalla. | RF-008, RF-081 | HU-001 CA 6; HU-015 CA 3 |
| RN-030 | El perfil público de una empresa lista únicamente sus productos activos y disponibles. | RF-021 | HU-003 CA 3 |
| RN-031 | El retorno al contexto de origen tras iniciar sesión no reemplaza los flujos de verificación de correo ni de autorización por rol. | RF-039, RF-040 | HU-007 CA 5 |
| RN-032 | La solicitud de recarga se canaliza por WhatsApp hacia el número oficial configurado por la plataforma, que no está incorporado dentro de la aplicación; si no está configurado, el sistema informa el error. | RF-083, RF-085 | HU-016 CA 2 y CA 4 |

---

## 8. Observaciones y pendientes de validación

Los siguientes puntos **no fueron resueltos** en este documento y requieren confirmación del equipo del proyecto.

| ID | Tipo | Observación | Afecta |
|---|---|---|---|
| OBS-001 | Criterio ausente | Ninguna de las 29 historias de usuario documenta prioridad, estimación ni valor de negocio. Por ello los 148 requisitos quedaron con prioridad "Por definir". Se requiere una sesión de priorización para completar esa columna. | RF-001 a RF-148 |
| OBS-002 | Estado de verificación | Los criterios de aceptación de la fuente están redactados como listas de verificación sin marcar (`- [ ]`). Este documento no afirma que ningún requisito esté implementado, probado ni aceptado. Se requiere definir el mecanismo de registro de la aceptación. | RF-001 a RF-148 |
| OBS-003 | Referencia cruzada incorrecta | HU-016 CA 3 remite a "(ver HU-021)" para la recarga manual realizada por el administrador, pero esa capacidad está descrita en **HU-027**; HU-021 corresponde a finanzas de empresa. | RF-084, RF-086, RN-019 |
| OBS-004 | Referencia cruzada incorrecta | HU-022 CA 4 remite a "(ver HU-026)" para las acciones reservadas al rol Owner, pero esas restricciones están en **HU-029**; HU-026 corresponde a liquidaciones. | RF-120, RN-026 |
| OBS-005 | Posible contradicción con el proyecto | HU-025 CA 1 describe el anuncio "con imagen, texto y enlace". En el repositorio, `RehniMarket-backend/app/models/ModelAdvertisement.py` define imagen de escritorio, imagen móvil, enlace, orden, estado activo y criterios de segmentación, **sin campos de texto**, y existe la migración `d4e5f6a7b8c9_advertisement_drop_text_fields`. RF-137 conserva el enunciado de la historia de usuario; debe validarse si la historia está desactualizada o si el texto del anuncio sigue siendo un requisito. | RF-137 |
| OBS-006 | Criterio no verificable | HU-028 CA 1 enumera las estadísticas con "por ejemplo, totales relevantes de usuarios, empresas y actividad reciente", una lista abierta. RF-146 no es completamente verificable hasta que se defina el conjunto exacto de indicadores del panel. | RF-146 |
| OBS-007 | Modalidad ambigua | HU-001 CA 5 afirma que "el Home **puede** mostrar anuncios publicitarios". No se precisa si la presencia de anuncios es obligatoria, cuántos se muestran ni en qué posición del Home. | RF-007 |
| OBS-008 | Detalle insuficiente | HU-019 CA 1 menciona que las especificaciones se completan "si la categoría lo define", y HU-024 CA 2 que el administrador las define, pero no se documentan los tipos de especificación admitidos ni si son obligatorias para publicar. | RF-099, RF-133 |
| OBS-009 | Dato no documentado | HU-026 CA 1 menciona la "comisión de la plataforma", las "ventas válidas" y un "periodo disponible" sin definir el porcentaje de comisión, qué venta se considera válida ni la duración del periodo. | RF-141, RN-025 |
| OBS-010 | Detalle insuficiente | HU-012 CA 2 fija un impuesto del 19 % sin indicar si aplica a todas las categorías de producto ni cómo se distribuye cuando una compra genera varios pedidos (uno por empresa). | RF-059, RF-063, RN-009, RN-011 |
| OBS-011 | Nomenclatura por confirmar | HU-013 y HU-020 nombran los estados del pedido en español ("pendiente, pagado, en preparación, enviado, entregado, cancelado") sin los identificadores usados por el sistema. Debe confirmarse la correspondencia exacta antes de redactar casos de prueba. | RF-066, RF-068, RF-069, RF-072, RF-073, RN-013 |
| OBS-012 | Detalle asimétrico | HU-004 CA 1 enumera los datos del registro de comprador (nombre, correo, teléfono, contraseña), pero CA 2 solo dice "sus datos comerciales" para la empresa, sin enumerarlos. RF-023 no detalla campos por ese motivo. | RF-023 |
| OBS-013 | Dato no documentado | Ni HU-005 ni HU-006 documentan la vigencia del código de verificación o de recuperación, el número de intentos admitidos ni límites de reenvío. No se añadieron esos valores. | RF-027, RF-029, RF-032, RF-033 |
| OBS-014 | Posible conflicto de reglas | HU-009 CA 2 permite a cualquier actor autenticado actualizar su correo, y CA 4 exige que el cambio se refleje de inmediato sin volver a iniciar sesión. No se documenta si el nuevo correo debe verificarse, lo que podría entrar en conflicto con RN-001. | RF-044, RF-046, RN-001 |
| OBS-015 | Efecto no documentado | HU-022 CA 3 permite eliminar una cuenta sin documentar el efecto sobre sus pedidos, reseñas, favoritos y saldo de billetera asociados. | RF-119 |
| OBS-016 | Efecto no documentado | HU-017 CA 2 permite eliminar una dirección sin documentar qué ocurre si es la predeterminada o si está referenciada por pedidos existentes. | RF-092, RF-093 |
| OBS-017 | Funcionalidad del proyecto sin historia de usuario | El repositorio contiene un módulo de devoluciones (`app/models/ModelReturnRequest.py`, `app/services/commerce/ReturnService.py`, `app/repository/ReturnRepository.py` y la migración `f7a2b9c1d3e4_return_requests`) que **ninguna historia de usuario de la fuente describe**. No se derivaron requisitos para esa funcionalidad por falta de respaldo documental. Se requiere escribir las historias de usuario correspondientes o confirmar que el módulo queda fuera del alcance. | Ninguno (vacío de cobertura) |
| OBS-018 | Trazabilidad por confirmar | HU-010 CA 6, HU-011 CA 5 y HU-012 CA 6 no describen capacidades propias: remiten a HU-007. Se trazaron a RF-036 y RF-037 en lugar de generar requisitos nuevos, para no duplicar. Debe confirmarse que esa interpretación es correcta. | RF-036, RF-037 |
| OBS-019 | Requisito dependiente | RF-128 (alcance de capacidades del rol Owner) se define por herencia de las historias HU-022 a HU-028. Su verificación depende de todos los requisitos de los módulos administrativos, por lo que no puede probarse de forma aislada. | RF-128 |
| OBS-020 | Fórmula por confirmar | HU-003 CA 2 define la calificación de la empresa como "promedio y cantidad de opiniones de todos sus productos", mientras HU-014 CA 5 la refiere al recálculo desde las reseñas. No se documenta si el promedio de la empresa se calcula sobre todas las reseñas o como promedio de promedios por producto. | RF-020, RF-078, RN-018 |
| OBS-021 | Ausencia de línea base | La propia fuente (§1) declara que no existía documento previo de historias de usuario y que fue construida mediante auditoría del código actual. No existe, por tanto, una línea base de requisitos aprobada contra la cual validar este documento; debe someterse a revisión y aprobación formal. | Documento completo |
| OBS-022 | Alcance excluido | Este documento cubre únicamente requisitos funcionales. Los requisitos no funcionales se encuentran fuera de su alcance y se documentan por separado (`docs/docs++/_fuentes_entregables/08_Requisitos_No_Funcionales.md`). | Documento completo |

---

## 9. Resumen final

**Total de requisitos funcionales identificados: 148** (RF-001 a RF-148), derivados de **29 historias de usuario** (HU-001 a HU-029) y **4 actores** (5 contando el desdoblamiento de Administrador y Owner), con **32 reglas de negocio** explícitas y **22 observaciones** pendientes de validación.

### 9.1 Requisitos por módulo

| # | Módulo funcional | Rango de IDs | Cantidad | Historias de usuario cubiertas |
|---|---|---|---|---|
| 1 | Catálogo público y búsqueda | RF-001 – RF-021 | 21 | HU-001, HU-002, HU-003 |
| 2 | Autenticación y cuenta | RF-022 – RF-046 | 25 | HU-004, HU-005, HU-006, HU-007, HU-008, HU-009 |
| 3 | Favoritos | RF-047 – RF-052 | 6 | HU-010 |
| 4 | Carrito y compra | RF-053 – RF-065 | 13 | HU-011, HU-012 |
| 5 | Pedidos | RF-066 – RF-073 | 8 | HU-013, HU-020 |
| 6 | Reseñas y calificaciones | RF-074 – RF-078 | 5 | HU-014 |
| 7 | RehniCoins | RF-079 – RF-089 | 11 | HU-015, HU-016, HU-027 |
| 8 | Direcciones | RF-090 – RF-093 | 4 | HU-017 |
| 9 | Empresa (perfil y productos) | RF-094 – RF-107 | 14 | HU-018, HU-019 |
| 10 | Finanzas de empresa | RF-108 – RF-114 | 7 | HU-021 |
| 11 | Administración de usuarios y empresas | RF-115 – RF-128 | 14 | HU-022, HU-023, HU-029 |
| 12 | Catálogo administrativo y anuncios | RF-129 – RF-140 | 12 | HU-024, HU-025 |
| 13 | Liquidaciones | RF-141 – RF-145 | 5 | HU-026 |
| 14 | Panel administrativo | RF-146 – RF-148 | 3 | HU-028 |
| | **Total** | **RF-001 – RF-148** | **148** | **29 historias (HU-001 a HU-029)** |

### 9.2 Requisitos por actor principal

| Actor principal | Cantidad aproximada de requisitos | Módulos |
|---|---|---|
| Visitante | 21 | Catálogo público y búsqueda |
| Visitante / cualquier actor autenticado | 25 | Autenticación y cuenta |
| Usuario | 47 | Favoritos; Carrito y compra; Pedidos (RF-066 a RF-069); Reseñas y calificaciones; RehniCoins (RF-079 a RF-085); Direcciones |
| Empresa | 25 | Pedidos (RF-070 a RF-073); Empresa (perfil y productos); Finanzas de empresa |
| Administrador / Owner | 30 | Administración de usuarios y empresas; Catálogo administrativo y anuncios; Liquidaciones; Panel administrativo; RehniCoins (RF-086 a RF-089) |

> RF-069 se comparte entre Usuario y Empresa, y RF-114 entre Empresa y Administrador; los conteos por actor son indicativos y su suma no coincide necesariamente con 148.

### 9.3 Verificaciones realizadas antes de publicar

- Identificadores RF únicos y consecutivos de RF-001 a RF-148, sin saltos ni repeticiones.
- Cada requisito tiene historia de usuario y criterio de aceptación identificados en la matriz de trazabilidad (sección 6).
- Las capacidades expresadas en más de una historia se consolidaron en un solo requisito (RF-007, RF-024, RF-026, RF-035, RF-036, RF-037, RF-069, RF-114, RF-120, RF-121) en lugar de duplicarse.
- Los criterios que describían varias capacidades independientes se descompusieron en requisitos separados (por ejemplo HU-004 CA 4 → RF-025 y RF-026; HU-017 CA 2 → RF-091 y RF-092; HU-019 CA 4 → RF-102 y RF-103).
- No se incluyeron atributos de calidad (rendimiento, seguridad, usabilidad, disponibilidad) como requisitos. Los enunciados que mencionan comportamiento observable (RF-017, RF-034, RF-046, RF-089) describen funciones concretas del sistema establecidas por un criterio de aceptación, no metas de calidad.
- Las reglas de negocio se separaron en la sección 7 y se mantienen vinculadas a sus requisitos en ambos sentidos.
- Los roles (`user`, `company`, `admin`, `owner`), los módulos y los nombres de estado coinciden con `RehniMarket-HU.md`.
- No se afirma la implementación ni la prueba de ningún requisito (ver OBS-002).
- Los totales de esta sección se calcularon contando las filas de las tablas de la sección 5 de este documento.
