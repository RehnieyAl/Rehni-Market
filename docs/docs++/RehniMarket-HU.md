# Historias de Usuario — RehniMarket

## 1. Introducción

Este documento reúne las Historias de Usuario (HU) que describen el comportamiento real y actualmente implementado de RehniMarket, un marketplace que conecta empresas vendedoras con usuarios compradores.

No se encontró ningún documento previo de Historias de Usuario en el repositorio (se buscó por nombre, por contenido y en el historial de control de versiones, incluyendo archivos ya eliminados). El único artefacto histórico localizado fue un listado de endpoints muy temprano, correspondiente a una versión anterior del proyecto bajo el nombre "Lubix", ya obsoleto y sin relación con la arquitectura actual (por ejemplo, contemplaba un inicio de sesión de empresa por NIT que ya no existe). Por esa razón, este documento se construyó en su totalidad a partir de una auditoría directa del código fuente actual (frontend y backend), que es la única fuente confiable de lo que el sistema realmente hace hoy.

Cada historia describe una funcionalidad verificada en el código: rutas del backend (FastAPI), reglas de negocio en los servicios, y su implementación real en la interfaz. No se documentan funcionalidades planeadas, mencionadas solo en comentarios, o presentes únicamente en diseños visuales.

## 2. Actores

| Actor | Descripción |
|---|---|
| **Visitante** | Cualquier persona que navega RehniMarket sin haber iniciado sesión. Puede explorar el catálogo público, pero no puede comprar, guardar favoritos ni acceder a ningún panel privado. |
| **Usuario** | Comprador autenticado (rol `user`). Puede favoritos, comprar, gestionar pedidos, reseñar productos entregados y usar su saldo de RehniCoins. |
| **Empresa** | Cuenta vendedora autenticada (rol `company`). Publica y administra su catálogo de productos, gestiona los pedidos que recibe y su información financiera. |
| **Administrador / Owner** | Personal interno de la plataforma (roles `admin` y `owner`). Administra usuarios, empresas, catálogo global, anuncios, liquidaciones a empresas y recargas de RehniCoins. El rol `owner` tiene todas las capacidades de `admin` más un conjunto reducido de capacidades exclusivas sobre otras cuentas administrativas. |

## 3. Historias de Usuario

### 3.1 Visitante

## HU-001 — Explorar y buscar el catálogo público

**Como:** Visitante
**Quiero:** navegar el catálogo de productos, filtrarlo y buscar por nombre sin necesidad de una cuenta
**Para:** poder decidir qué comprar antes de registrarme

### Criterios de aceptación

- [ ] El visitante puede ver en el Home una selección de productos destacados y las categorías disponibles.
- [ ] El visitante puede acceder al listado completo de productos y filtrarlo por categoría, rango de precio, disponibilidad de stock y descuento.
- [ ] El visitante puede ordenar el listado (por ejemplo, por precio o por descuento).
- [ ] El visitante puede buscar productos por nombre desde el buscador del encabezado o desde el listado.
- [ ] El Home puede mostrar anuncios publicitarios configurados por la administración.
- [ ] Ningún dato mostrado (precio, descuento, stock) es simulado: proviene del catálogo real cargado por las empresas.

## HU-002 — Consultar el detalle de un producto

**Como:** Visitante
**Quiero:** ver toda la información pública de un producto
**Para:** evaluar si quiero comprarlo

### Criterios de aceptación

- [ ] El visitante puede acceder al detalle de un producto desde cualquier listado (Home, categorías, resultados de búsqueda, productos relacionados).
- [ ] El detalle muestra categoría, nombre, calificación promedio real con cantidad de opiniones (o un estado que indica que aún no tiene opiniones), precio actual y, si aplica, el precio anterior tachado y el porcentaje de descuento.
- [ ] El detalle muestra la galería de imágenes del producto y, si el producto tiene variantes de color, permite seleccionar cada una para ver su propia imagen, precio y stock.
- [ ] El detalle muestra el stock disponible real y las opiniones existentes de otros compradores.
- [ ] El detalle muestra los datos del vendedor (empresa) y permite acceder a su perfil público.
- [ ] Al acceder al detalle desde cualquier origen, la página siempre inicia desde la parte superior, sin conservar la posición de scroll de la pantalla anterior.

## HU-003 — Consultar el perfil público de una empresa

**Como:** Visitante
**Quiero:** ver el perfil de una empresa vendedora
**Para:** conocer su catálogo y su reputación antes de comprarle

### Criterios de aceptación

- [ ] El visitante puede acceder al perfil de una empresa desde el detalle de cualquiera de sus productos.
- [ ] El perfil muestra el nombre, logo, estado de verificación real de la empresa y su calificación (promedio y cantidad de opiniones de todos sus productos).
- [ ] El perfil lista los productos activos y disponibles de esa empresa, paginados.

## HU-004 — Registrarme como comprador o como empresa

**Como:** Visitante
**Quiero:** crear una cuenta de comprador o de empresa
**Para:** poder usar las funcionalidades reservadas a usuarios registrados

### Criterios de aceptación

- [ ] El visitante puede registrarse indicando sus datos como comprador (nombre, correo, teléfono, contraseña).
- [ ] El visitante puede registrarse como empresa indicando sus datos comerciales.
- [ ] Al registrarse, la cuenta queda pendiente de verificación de correo antes de poder iniciar sesión.
- [ ] Una empresa recién registrada queda con su certificación pendiente de aprobación por la administración; puede iniciar sesión, pero su condición de "empresa verificada" no se muestra públicamente hasta ser aprobada.

## HU-005 — Verificar mi correo electrónico

**Como:** Visitante recién registrado
**Quiero:** confirmar mi correo con un código
**Para:** poder activar mi cuenta e iniciar sesión

### Criterios de aceptación

- [ ] El sistema envía un código de verificación al correo indicado en el registro.
- [ ] El visitante puede ingresar el código para verificar su cuenta.
- [ ] Si el correo ingresado en el registro fue incorrecto, el visitante puede corregirlo antes de completar la verificación, y el sistema reenvía el código al nuevo correo.
- [ ] Un intento de inicio de sesión con una cuenta no verificada es rechazado e indica explícitamente que falta verificar el correo, dirigiendo al visitante a completar ese paso.

## HU-006 — Iniciar sesión y recuperar mi contraseña

**Como:** Visitante con una cuenta registrada
**Quiero:** iniciar sesión, y recuperar el acceso si olvidé mi contraseña
**Para:** poder usar mi cuenta

### Criterios de aceptación

- [ ] El visitante puede iniciar sesión con su correo y contraseña.
- [ ] Si el visitante olvidó su contraseña, puede solicitar un código de recuperación a su correo y definir una nueva contraseña con ese código.
- [ ] Si el inicio de sesión falla por credenciales inválidas, el sistema lo informa sin revelar cuál de los dos datos es incorrecto.
- [ ] Al iniciar sesión sin haber llegado desde ninguna acción protegida, el visitante es dirigido al Home.

## HU-007 — Regresar al contexto donde estaba después de iniciar sesión

**Como:** Visitante
**Quiero:** que, al iniciar sesión luego de intentar una acción que requiere cuenta, el sistema me regrese exactamente a donde estaba
**Para:** no perder lo que estaba haciendo (el producto que miraba, el carrito, la sección que quería usar)

### Criterios de aceptación

- [ ] Si el visitante intenta agregar un producto al carrito, comprarlo, marcarlo como favorito, o acceder a una sección que requiere sesión (por ejemplo, un panel de comprador, empresa o administración, o el checkout), y no tiene sesión, el sistema lo dirige al inicio de sesión.
- [ ] Al iniciar sesión con éxito desde ese flujo, el sistema lo regresa automáticamente a la pantalla exacta desde la que partió.
- [ ] Si el visitante entró directamente al inicio de sesión sin haber sido redirigido desde ninguna acción, después de autenticarse es dirigido al Home.
- [ ] Si la sesión expira mientras el usuario navega una pantalla protegida, al volver a iniciar sesión regresa a esa misma pantalla.
- [ ] Este comportamiento no reemplaza los flujos de verificación de correo ni de autorización por rol: una cuenta no verificada sigue siendo dirigida a verificar su correo, y un usuario autenticado sin permiso sobre una sección sigue recibiendo el mensaje de acceso denegado correspondiente en lugar de ser tratado como no autenticado.

### 3.2 Usuario

## HU-008 — Cerrar sesión

**Como:** Usuario, Empresa o Administrador autenticado
**Quiero:** cerrar mi sesión
**Para:** proteger mi cuenta al dejar de usar el sistema

### Criterios de aceptación

- [ ] Cualquier actor autenticado puede cerrar sesión desde el menú de su cuenta o desde el panel correspondiente a su rol.
- [ ] Al cerrar sesión, el sistema deja de usar sus credenciales y ya no permite acceder a secciones protegidas hasta volver a iniciar sesión.

## HU-009 — Gestionar mi cuenta personal

**Como:** Usuario, Empresa o Administrador autenticado
**Quiero:** consultar y actualizar mis datos personales (nombre, correo, foto de perfil) y cambiar mi contraseña
**Para:** mantener mi cuenta al día y segura

### Criterios de aceptación

- [ ] Cualquier actor autenticado puede ver su nombre, correo y foto de perfil actuales desde "Configuración de cuenta", disponible en su respectivo panel.
- [ ] Puede actualizar su nombre, correo y foto de perfil.
- [ ] Puede cambiar su contraseña.
- [ ] Los cambios se reflejan de inmediato en el resto del sistema (por ejemplo, el nombre mostrado en el menú de cuenta) sin requerir volver a iniciar sesión.

## HU-010 — Gestionar mis productos favoritos

**Como:** Usuario
**Quiero:** guardar productos como favoritos y quitarlos cuando quiera
**Para:** encontrarlos fácilmente más adelante

### Criterios de aceptación

- [ ] El usuario autenticado puede marcar un producto como favorito desde su tarjeta en cualquier listado.
- [ ] El sistema persiste el favorito en el servidor, no únicamente en la pantalla actual.
- [ ] Al recargar la página o navegar a otra sección y volver, el producto sigue mostrándose como favorito si lo está.
- [ ] El usuario puede quitar un producto de favoritos, y ese cambio también persiste tras recargar.
- [ ] El usuario puede consultar el listado completo de sus productos favoritos en su panel, y quitar un favorito desde ahí también actualiza su estado en cualquier otra pantalla donde ese producto se muestre.
- [ ] Un visitante sin sesión que intenta marcar un favorito es dirigido a iniciar sesión y, al autenticarse, regresa al mismo producto (ver HU-007).
- [ ] Esta funcionalidad no está disponible para cuentas de tipo Empresa ni Administrador.

## HU-011 — Gestionar mi carrito de compras

**Como:** Usuario
**Quiero:** agregar productos a un carrito y ajustarlo antes de comprar
**Para:** reunir varios productos y confirmar la compra cuando esté listo

### Criterios de aceptación

- [ ] El usuario autenticado puede agregar un producto (y, si aplica, una variante de color específica) a su carrito desde el detalle del producto, indicando la cantidad.
- [ ] El usuario puede aumentar o disminuir la cantidad de un producto en el carrito, sin superar el stock disponible.
- [ ] El usuario puede quitar un producto del carrito o vaciarlo por completo.
- [ ] El carrito muestra el subtotal de los productos agregados.
- [ ] Un visitante sin sesión que intenta agregar un producto al carrito es dirigido a iniciar sesión y regresa al mismo producto al autenticarse (ver HU-007).

## HU-012 — Completar una compra

**Como:** Usuario
**Quiero:** confirmar la compra de los productos de mi carrito
**Para:** recibir los productos que elegí

### Criterios de aceptación

- [ ] Para completar la compra, el usuario debe tener registrada una dirección de envío; si no tiene ninguna, el sistema le solicita agregarla antes de continuar.
- [ ] El pago se realiza con el saldo de RehniCoins de la cuenta del usuario; el sistema calcula el subtotal, un impuesto del 19% y el total a pagar, y valida que el saldo disponible alcance para cubrirlo.
- [ ] Si el saldo no alcanza, el sistema lo informa y no permite confirmar la compra.
- [ ] Si algún producto del carrito ya no tiene stock suficiente al momento de confirmar, el sistema lo informa y no completa la compra.
- [ ] Al confirmar la compra exitosamente, se generan uno o más pedidos (uno por empresa vendedora involucrada), el carrito queda vacío y el saldo de RehniCoins se descuenta.
- [ ] Un visitante sin sesión que intenta acceder al checkout es dirigido a iniciar sesión y regresa al checkout al autenticarse (ver HU-007).

## HU-013 — Consultar y cancelar mis pedidos

**Como:** Usuario
**Quiero:** ver el historial y el estado de mis pedidos, y cancelar uno si aún es posible
**Para:** hacer seguimiento a mis compras

### Criterios de aceptación

- [ ] El usuario puede consultar el listado de sus pedidos con su estado actual (pendiente, pagado, en preparación, enviado, entregado o cancelado) y el detalle de cada uno.
- [ ] El usuario puede cancelar un pedido únicamente mientras su estado sea "pendiente" o "pagado"; una vez que la empresa lo pone en preparación, enviado o entregado, ya no puede cancelarlo desde su cuenta.
- [ ] Un pedido cancelado o entregado no admite más cambios de estado.

## HU-014 — Escribir una reseña de un producto comprado

**Como:** Usuario
**Quiero:** calificar y comentar un producto que ya me fue entregado
**Para:** compartir mi experiencia con otros compradores

### Criterios de aceptación

- [ ] El usuario solo puede reseñar un producto si tiene al menos un pedido de ese producto en estado "entregado".
- [ ] El usuario puede calificar de 1 a 5 estrellas y agregar un comentario opcional.
- [ ] El usuario solo puede dejar una reseña por producto; si ya la escribió, el sistema se lo indica en lugar de mostrar el formulario nuevamente.
- [ ] El usuario puede eliminar su propia reseña.
- [ ] La calificación promedio y el conteo de opiniones que se muestran en el producto y en el perfil de la empresa se recalculan a partir de las reseñas reales existentes.

## HU-015 — Consultar mi saldo y movimientos de RehniCoins

**Como:** Usuario
**Quiero:** ver mi saldo actual y el historial de movimientos de mi billetera RehniCoin
**Para:** saber con cuánto saldo cuento y en qué se usó

### Criterios de aceptación

- [ ] El usuario puede consultar su saldo actual de RehniCoins (1 RehniCoin equivale a 1 peso colombiano) desde su panel.
- [ ] El usuario puede consultar el historial paginado de movimientos de su billetera, con el tipo de movimiento (recarga, compra, reembolso o ajuste), fecha, descripción y monto.
- [ ] El saldo y los movimientos mostrados provienen siempre del servidor; no se calculan ni se simulan en la pantalla.

## HU-016 — Solicitar una recarga de RehniCoins

**Como:** Usuario
**Quiero:** solicitar una recarga de saldo eligiendo una cantidad
**Para:** tener saldo suficiente para comprar

### Criterios de aceptación

- [ ] El usuario puede elegir una cantidad de RehniCoins a solicitar entre valores sugeridos o escribiendo un monto propio, siempre que sea un número entero mayor a cero.
- [ ] Al confirmar la solicitud, el sistema abre una conversación de WhatsApp hacia el número oficial de RehniMarket (configurado por la plataforma, no incorporado dentro de la aplicación) con un mensaje que incluye la cantidad solicitada y el correo de la cuenta del usuario.
- [ ] La solicitud **no acredita saldo automáticamente**: el saldo de RehniCoins solo se actualiza cuando un administrador realiza la recarga manualmente después de verificar el pago fuera de la plataforma (ver HU-021).
- [ ] Si el número de WhatsApp de contacto no está configurado en el entorno, el sistema informa el error en lugar de intentar abrir una conversación inválida.

## HU-017 — Gestionar mis direcciones de envío

**Como:** Usuario
**Quiero:** registrar y administrar mis direcciones de envío
**Para:** usarlas al momento de comprar

### Criterios de aceptación

- [ ] El usuario puede registrar una o más direcciones de envío con sus datos de contacto y ubicación.
- [ ] El usuario puede editar o eliminar una dirección existente.
- [ ] El usuario puede marcar una dirección como predeterminada, y esa es la que se preselecciona al momento de comprar.

### 3.3 Empresa

## HU-018 — Gestionar el perfil de mi empresa

**Como:** Empresa
**Quiero:** mantener actualizada la información pública de mi negocio
**Para:** que los compradores confíen y me encuentren

### Criterios de aceptación

- [ ] La empresa puede consultar y actualizar los datos de su perfil comercial (nombre, información de contacto).
- [ ] La empresa puede actualizar su logo y su imagen de banner.
- [ ] El estado de verificación de la empresa (certificado aprobado, pendiente o rechazado) es informativo y lo determina la administración; la empresa puede consultarlo pero no cambiarlo por sí misma.

## HU-019 — Publicar y gestionar mis productos

**Como:** Empresa
**Quiero:** crear, editar, desactivar y eliminar los productos que vendo, incluidas sus variantes e imágenes
**Para:** mantener mi catálogo actualizado en la plataforma

### Criterios de aceptación

- [ ] La empresa puede crear un producto indicando nombre, descripción, categoría, precio, stock, imágenes y, si la categoría lo define, sus especificaciones.
- [ ] La empresa puede definir un descuento sobre un producto (porcentaje) y activarlo o desactivarlo.
- [ ] La empresa puede editar la información de un producto ya creado, incluidas sus imágenes.
- [ ] La empresa puede activar/desactivar la visibilidad pública de un producto y eliminarlo.
- [ ] La empresa puede crear variantes de color para un producto, cada una con su propio precio, descuento, stock e imágenes propias.
- [ ] La empresa puede editar o eliminar una variante existente.
- [ ] Los productos y variantes creados por una empresa solo pueden ser gestionados por esa misma empresa.

## HU-020 — Gestionar los pedidos que recibo

**Como:** Empresa
**Quiero:** consultar los pedidos de mis productos y actualizar su estado
**Para:** informar a mis compradores el avance de su compra

### Criterios de aceptación

- [ ] La empresa puede consultar el listado de pedidos que incluyen sus productos, con su estado y el conteo de pedidos por estado.
- [ ] La empresa puede consultar el detalle de un pedido.
- [ ] La empresa puede avanzar el estado de un pedido siguiendo el flujo permitido (pendiente o pagado → en preparación → enviado → entregado), o cancelarlo mientras esté pendiente o pagado.
- [ ] Un pedido entregado o cancelado no admite más cambios de estado.

## HU-021 — Gestionar mi información financiera y cuentas bancarias

**Como:** Empresa
**Quiero:** registrar mi cuenta bancaria y consultar mi balance y liquidaciones
**Para:** recibir los pagos que me corresponden por mis ventas

### Criterios de aceptación

- [ ] La empresa puede registrar una o más cuentas bancarias y marcar una como predeterminada, la que se usará para sus liquidaciones.
- [ ] La empresa puede editar o eliminar una cuenta bancaria.
- [ ] La empresa puede consultar su balance disponible y el historial de liquidaciones ya generadas por la administración, con su estado (pendiente o pagada).
- [ ] Una liquidación requiere que la empresa tenga configurada una cuenta bancaria predeterminada.

### 3.4 Administrador

## HU-022 — Gestionar cuentas de usuario

**Como:** Administrador
**Quiero:** consultar, editar, bloquear/desbloquear y eliminar cuentas de usuario
**Para:** mantener la plataforma en orden y actuar ante cuentas problemáticas

### Criterios de aceptación

- [ ] El administrador puede consultar el listado de usuarios registrados y el detalle de cada uno.
- [ ] El administrador puede actualizar la información de una cuenta y cambiar su estado (activa/bloqueada).
- [ ] El administrador puede eliminar una cuenta.
- [ ] Un administrador (no Owner) no puede modificar, bloquear ni asignar el rol Owner a una cuenta; esas acciones están reservadas al rol Owner (ver HU-026).
- [ ] Ninguna cuenta con rol Owner puede eliminarse, ni siquiera por otro Owner.

## HU-023 — Gestionar empresas registradas

**Como:** Administrador
**Quiero:** revisar las empresas registradas, aprobar o rechazar su certificación, y activar/desactivar su cuenta
**Para:** asegurar que solo empresas legítimas operen en la plataforma

### Criterios de aceptación

- [ ] El administrador puede consultar el listado de empresas registradas y el detalle de cada una.
- [ ] El administrador puede aprobar o rechazar la certificación de una empresa; solo una empresa aprobada se muestra como "empresa verificada" ante los compradores.
- [ ] El administrador puede activar o desactivar la cuenta de una empresa.

## HU-024 — Gestionar el catálogo de la plataforma

**Como:** Administrador
**Quiero:** administrar las categorías de productos, sus especificaciones y los colores disponibles
**Para:** mantener organizado el catálogo que usan todas las empresas

### Criterios de aceptación

- [ ] El administrador puede crear, editar, activar/desactivar y eliminar categorías de productos.
- [ ] El administrador puede definir las especificaciones (campos propios) que las empresas deben completar al crear un producto de cada categoría.
- [ ] El administrador puede crear, editar y eliminar los colores disponibles para variantes de producto.

## HU-025 — Gestionar los anuncios del Home

**Como:** Administrador
**Quiero:** crear y administrar los anuncios publicitarios que se muestran en el Home
**Para:** destacar promociones o contenido relevante para los compradores

### Criterios de aceptación

- [ ] El administrador puede crear un anuncio con imagen, texto y enlace.
- [ ] El administrador puede editar, activar/desactivar y eliminar un anuncio.
- [ ] Solo los anuncios activos se muestran a los visitantes en el Home.

## HU-026 — Generar y administrar liquidaciones a empresas

**Como:** Administrador
**Quiero:** generar las liquidaciones de pago a las empresas por sus ventas y marcarlas como pagadas
**Para:** formalizar el pago periódico a cada empresa vendedora

### Criterios de aceptación

- [ ] El administrador puede generar una liquidación para una empresa correspondiente a un periodo disponible, calculada sobre sus ventas válidas menos la comisión de la plataforma.
- [ ] El administrador puede consultar una vista previa de una liquidación antes de generarla.
- [ ] El administrador puede consultar el listado de liquidaciones generadas, con su estado (pendiente o pagada).
- [ ] El administrador puede marcar una liquidación pendiente como pagada; una liquidación ya pagada no puede volver a marcarse como pagada.
- [ ] Generar una liquidación para una empresa requiere que esa empresa tenga una cuenta bancaria predeterminada configurada.

## HU-027 — Recargar el saldo de RehniCoins de un usuario

**Como:** Administrador
**Quiero:** acreditar saldo de RehniCoins a la cuenta de un comprador y consultar el historial de recargas realizadas
**Para:** completar manualmente las solicitudes de recarga después de verificar el pago (ver HU-016)

### Criterios de aceptación

- [ ] El administrador puede recargar saldo a la billetera de un usuario identificándolo por su correo electrónico, indicando la cantidad y una descripción opcional.
- [ ] Esta acción es exclusiva de las cuentas Administrador y Owner; ningún otro rol puede acreditar saldo a una billetera.
- [ ] El administrador puede consultar el historial paginado de recargas realizadas, con el usuario receptor, el monto y el administrador responsable de cada una.
- [ ] El nuevo saldo del usuario queda disponible de inmediato tras la recarga.

## HU-028 — Consultar el panel de estadísticas de la plataforma

**Como:** Administrador
**Quiero:** ver un resumen general del estado de la plataforma
**Para:** tener visibilidad rápida de su actividad

### Criterios de aceptación

- [ ] El administrador puede consultar estadísticas generales (por ejemplo, totales relevantes de usuarios, empresas y actividad reciente) al ingresar a su panel.
- [ ] El administrador puede consultar la actividad reciente y los usuarios más recientes registrados.

## HU-029 — Administrar cuentas con privilegios elevados (exclusivo Owner)

**Como:** Owner
**Quiero:** ser el único capaz de otorgar o modificar el rol Owner, y de administrar cuentas con ese rol
**Para:** proteger el nivel más alto de privilegios de la plataforma frente a otras cuentas administrativas

### Criterios de aceptación

- [ ] Solo una cuenta Owner puede asignar el rol Owner a otra cuenta.
- [ ] Solo una cuenta Owner puede modificar o bloquear/desbloquear otra cuenta Owner.
- [ ] Ninguna cuenta Owner puede ser eliminada por ningún actor, incluyendo otro Owner.
- [ ] Fuera de estas restricciones, el rol Owner cuenta con las mismas capacidades que el rol Administrador descritas en las historias HU-022 a HU-028.

## 4. Resumen de cobertura

| Módulo | Historias |
|---|---|
| Catálogo público y búsqueda | HU-001, HU-002, HU-003 |
| Autenticación y cuenta | HU-004, HU-005, HU-006, HU-007, HU-008, HU-009 |
| Favoritos | HU-010 |
| Carrito y compra | HU-011, HU-012 |
| Pedidos | HU-013, HU-020 |
| Reseñas y calificaciones | HU-014 |
| RehniCoins | HU-015, HU-016, HU-027 |
| Direcciones | HU-017 |
| Empresa (perfil y productos) | HU-018, HU-019 |
| Finanzas de empresa | HU-021 |
| Administración de usuarios y empresas | HU-022, HU-023, HU-029 |
| Catálogo administrativo y anuncios | HU-024, HU-025 |
| Liquidaciones | HU-026 |
| Panel administrativo | HU-028 |
