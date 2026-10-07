# Manual de Usuario — RehniMarket

> **Documento:** Manual de Usuario Final
> **Proyecto:** RehniMarket
> **Contexto académico:** SENA — Tecnólogo en Análisis y Desarrollo de Software (ADSO), Sexto Trimestre.
> **Criterio de evaluación asociado:** *Documentación Técnica y Manuales de Usuario — Elabora la documentación del proceso de implantación, incluyendo manual de instalación, manual técnico y manual de usuario final bajo estándares de calidad.*
> **Base de elaboración:** auditoría directa del código fuente del repositorio (backend, frontend web y aplicación móvil), de `docs/RehniMarket-HU.md`, de los archivos `README` y `CHANGELOG`, y de la configuración del proyecto.
> **Fecha:** 2026-08-30
> **Regla aplicada:** solo se documentan funcionalidades verificadas en el código actual. Toda diferencia entre la documentación previa y la implementación real se señala de forma explícita.

---

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Objetivo del manual](#2-objetivo-del-manual)
3. [Alcance](#3-alcance)
4. [Roles del sistema](#4-roles-del-sistema)
5. [Requisitos para utilizar RehniMarket](#5-requisitos-para-utilizar-rehnimarket)
6. [Acceso a RehniMarket](#6-acceso-a-rehnimarket)
7. [Navegación del usuario](#7-navegación-del-usuario)
8. [Carrito de compras](#8-carrito-de-compras)
9. [Proceso de compra](#9-proceso-de-compra)
10. [Direcciones](#10-direcciones)
11. [RehniCoin](#11-rehnicoin)
12. [Pedidos](#12-pedidos)
13. [Favoritos](#13-favoritos)
14. [Reseñas](#14-reseñas)
15. [Funcionalidades de Empresa](#15-funcionalidades-de-empresa)
16. [Funcionalidades de Administrador](#16-funcionalidades-de-administrador)
17. [Seguridad básica para usuarios](#17-seguridad-básica-para-usuarios)
18. [Mensajes y errores frecuentes](#18-mensajes-y-errores-frecuentes)
19. [Preguntas frecuentes](#19-preguntas-frecuentes)
20. [Limitaciones conocidas](#20-limitaciones-conocidas)
21. [Conclusión](#21-conclusión)

---

## 1. Introducción

**RehniMarket** es una plataforma de comercio electrónico de tipo *marketplace* (mercado con múltiples vendedores). En ella conviven tres actividades principales:

- **Compradores** que exploran un catálogo de productos publicados por distintas empresas, arman un carrito, y pagan con un saldo interno llamado **RehniCoin**.
- **Empresas vendedoras** que publican y administran sus productos (con variantes de color, descuentos e imágenes), gestionan los pedidos que reciben y consultan su información financiera.
- **Administración de la plataforma** (roles Administrador y Owner) que aprueba empresas, administra el catálogo global de categorías, publica anuncios, recarga saldo de RehniCoin a los compradores y genera las liquidaciones de pago a las empresas.

El sistema está compuesto por:

- Una **aplicación web** (para compradores, empresas y administración).
- Una **aplicación móvil** (Android, mediante Expo), orientada **exclusivamente a compradores y visitantes**.
- Un **servidor (API)** que concentra toda la lógica de negocio y es la autoridad final sobre precios, stock, saldos y permisos.

El pago dentro de RehniMarket **no usa dinero real directamente**: se realiza con **RehniCoin**, donde **1 RehniCoin equivale a 1 peso colombiano**. El saldo de RehniCoin solo lo acredita un Administrador de forma manual, después de verificar el pago por fuera de la plataforma.

---

## 2. Objetivo del manual

Este documento explica **cómo usar RehniMarket** desde el punto de vista de una persona usuaria final. Describe paso a paso las pantallas, las acciones disponibles y lo que ocurre al ejecutarlas, tanto en la **plataforma web** como en la **aplicación móvil**.

**Está dirigido a:**

| Público | Uso del manual |
|---|---|
| Compradores (rol Usuario) | Guía completa: registro, compra, pedidos, favoritos, reseñas, RehniCoin, direcciones. |
| Empresas vendedoras (rol Empresa) | Referencia de las funciones del panel de empresa (solo web). |
| Administración (roles Administrador y Owner) | Referencia de las funciones del panel administrativo (solo web). |
| Jurado / evaluador SENA | Evidencia del alcance funcional real del sistema. |

No es un manual de instalación ni un manual técnico; esos documentos se entregan por separado.

---

## 3. Alcance

Este manual cubre las funcionalidades **efectivamente implementadas** en el código a la fecha indicada. Cuando una función existe en un canal y no en otro, se indica de forma explícita.

### 3.1 Plataforma web

Cubre el 100% de los roles y módulos del sistema:

- Catálogo público, categorías, búsqueda, ofertas, novedades, detalle de producto y **perfil público de empresa**.
- Cuenta de usuario: registro (comprador y empresa), verificación de correo, inicio y cierre de sesión, recuperación de contraseña, configuración de cuenta.
- Compra: carrito, checkout, direcciones, RehniCoin, pedidos.
- Favoritos y **reseñas** (escribir, ver y eliminar la propia).
- **Reportar** un producto o una empresa.
- Panel de **Empresa**: perfil, productos y variantes, pedidos, finanzas (cuentas bancarias, balance, liquidaciones).
- Panel de **Administrador / Owner**: usuarios, empresas, catálogo, anuncios, reportes, transportadoras, liquidaciones, recargas de RehniCoin, estadísticas.

### 3.2 Aplicación móvil

Orientada **solo a Visitante y Usuario (comprador)**. Si una cuenta de Empresa, Administrador u Owner inicia sesión en la app móvil, el sistema **cierra su sesión automáticamente** (esos paneles no existen en móvil).

La app móvil cubre:

- Catálogo (Inicio), categorías, búsqueda, ofertas, novedades y detalle de producto (con selección de variante).
- Cuenta: registro **de comprador únicamente**, verificación de correo, inicio/cierre de sesión, recuperación de contraseña, configuración de cuenta.
- Carrito, checkout, direcciones, pedidos (lista y detalle) y RehniCoin (saldo, movimientos y solicitud de recarga por WhatsApp).
- Favoritos.
- Calificación promedio del producto (solo lectura).

### 3.3 Funciones NO disponibles en móvil (sí en web)

| Función | Web | Móvil |
|---|---|---|
| Perfil público de empresa ("Ver tienda") | Sí | **No** |
| Escribir / ver el listado de reseñas de un producto | Sí | **No** (solo se muestra la calificación promedio) |
| Reportar producto o empresa | Sí | **No** |
| Registro como Empresa | Sí | **No** (solo registro de comprador) |
| Panel de Empresa | Sí | **No** |
| Panel de Administrador / Owner | Sí | **No** |

---

## 4. Roles del sistema

RehniMarket define **cuatro roles de cuenta** (`user`, `company`, `admin`, `owner`) más la condición de **Visitante** (sin sesión). Los permisos por rol están definidos y verificados en el servidor: la interfaz solo refleja lo que el servidor autoriza.

### 4.1 Visitante (sin iniciar sesión)

| Puede hacer | Módulos accesibles | Restricciones |
|---|---|---|
| Ver el catálogo, categorías, ofertas y novedades. | Home, catálogo, detalle de producto. | No puede agregar productos al carrito ni comprar. |
| Buscar productos por nombre. | Búsqueda. | Al intentar una acción que requiere cuenta, es enviado a **iniciar sesión**. |
| Ver el detalle de un producto (imágenes, precio, descuento, variantes, stock, opiniones). | Detalle de producto. | — |
| Ver el perfil público de una empresa y su calificación (**solo web**). | Perfil de empresa. | — |
| Registrarse e iniciar sesión. | Registro / Login. | — |

Al intentar agregar al carrito, marcar un favorito o entrar al checkout sin sesión, el sistema redirige al inicio de sesión y, tras autenticarse correctamente, **regresa a la pantalla exacta** desde la que partió.

### 4.2 Usuario (comprador — rol `user`)

Es la cuenta de compra. Disponible en **web y móvil**.

| Puede hacer | Módulos |
|---|---|
| Todo lo del Visitante. | Catálogo, búsqueda, detalle. |
| Agregar productos (y variantes) al carrito; actualizar cantidades; eliminar; vaciar el carrito. | Carrito. |
| Completar la compra pagando con RehniCoin. | Checkout. |
| Consultar sus pedidos, ver el detalle y **cancelar** un pedido mientras esté "pendiente" o "pagado". | Pedidos. |
| Gestionar sus **direcciones** de envío (crear, editar, eliminar, marcar predeterminada). | Direcciones. |
| Consultar su **saldo de RehniCoin** y el historial de movimientos; solicitar una recarga (vía WhatsApp). | RehniCoin / Billetera. |
| Marcar y quitar **favoritos**; ver su lista de favoritos. | Favoritos. |
| Escribir **una reseña** de un producto que le fue **entregado**; eliminar su propia reseña (**solo web**). | Reseñas. |
| **Reportar** un producto o una empresa (**solo web**). | Reportes. |
| Actualizar su nombre, teléfono, correo y foto de perfil; cambiar su contraseña. | Configuración de cuenta. |

**Restricciones:** un Usuario **no** puede vender, ni acceder a paneles de Empresa o Administración, ni acreditar saldo a ninguna billetera.

### 4.3 Empresa (vendedor — rol `company`)

Cuenta de vendedor. Disponible **solo en la plataforma web**.

| Puede hacer | Módulos |
|---|---|
| Consultar y actualizar el perfil comercial (nombre, contacto). | Mi tienda. |
| Actualizar el logo y el banner de la empresa. | Mi tienda. |
| Crear productos (nombre, descripción, categoría, precio, stock, imágenes y especificaciones definidas por la categoría). | Productos. |
| Definir un **descuento por porcentaje** sobre un producto y activarlo/desactivarlo. | Productos. |
| Editar un producto, activar/desactivar su visibilidad pública y eliminarlo. | Productos. |
| Crear **variantes** (p. ej. por color), cada una con su precio, descuento, stock e imágenes propias; editarlas y eliminarlas. | Productos → Variantes. |
| Consultar los pedidos que incluyen sus productos, con contadores por estado, y ver el detalle. | Pedidos. |
| **Avanzar el estado** de un pedido según el flujo permitido (pendiente/pagado → en preparación → enviado → entregado) o cancelarlo mientras esté pendiente o pagado. | Pedidos. |
| Registrar la información de envío (transportadora y número de guía) al marcar un pedido como enviado. | Pedidos. |
| Registrar cuentas bancarias y marcar una como predeterminada; editarlas y eliminarlas. | Finanzas. |
| Consultar su **balance disponible** y el historial de **liquidaciones** generadas por la administración, con su estado (pendiente/pagada). | Finanzas. |
| Actualizar los datos de la cuenta del representante y cambiar la contraseña. | Configuración de cuenta. |

**Restricciones:**

- Si el certificado está **pendiente** de revisión, el inicio de sesión es rechazado con el mensaje *"Tu empresa esta en revision"*; si la empresa fue **suspendida**, con *"Tu empresa se encuentra suspendida."*
- Si el certificado fue **rechazado**, la empresa **sí puede iniciar sesión** con su correo y contraseña (el flujo normal, sin nada especial): una vez dentro solo ve **Mi tienda** — con el **motivo del rechazo** — para poder **reemplazar el certificado**; el resto del panel (Productos, Pedidos, Finanzas...) permanece bloqueado hasta que la administración apruebe el nuevo certificado.
- Una empresa **no** puede comprar, ni marcar favoritos, ni cambiar por sí misma su estado de verificación ni el motivo de un rechazo.
- Solo puede gestionar sus **propios** productos, variantes y pedidos.
- El panel de Empresa **no existe en la aplicación móvil**.

### 4.4 Administrador (rol `admin`)

Gestión de la plataforma. Disponible **solo en la plataforma web**.

| Puede hacer | Módulos |
|---|---|
| Ver estadísticas generales, actividad reciente y usuarios recientes. | Inicio. |
| Consultar usuarios y su detalle; actualizar su información; **bloquear/desbloquear**; eliminar cuentas. | Usuarios. |
| Consultar empresas y su detalle; **aprobar o rechazar** la certificación; **activar/desactivar (suspender)** la cuenta de una empresa. | Empresas. |
| Administrar el **catálogo global**: crear/editar/activar/eliminar categorías; definir las especificaciones que las empresas completan por categoría; administrar atributos y opciones de variante (incluyendo colores). | Catálogo. |
| Crear, editar, activar/desactivar y eliminar **anuncios** del Home. | Anuncios. |
| Consultar **reportes** de productos y empresas, ver el detalle y cambiar su estado. | Reportes. |
| Administrar el catálogo de **transportadoras** (crear, editar, activar/desactivar). | Transportadoras. |
| Generar **liquidaciones** de pago a empresas por periodo, ver la vista previa, listarlas y marcarlas como pagadas. | Liquidaciones. |
| **Recargar el saldo de RehniCoin** de un usuario identificándolo por su correo, y consultar el historial de recargas. | RehniCoin. |
| Actualizar los datos de su propia cuenta y cambiar la contraseña. | Configuración de cuenta. |

**Restricciones:** un Administrador **no** puede asignar, modificar ni bloquear cuentas con rol **Owner**; esas acciones están reservadas al Owner. Ninguna cuenta Owner puede ser eliminada.

### 4.5 Owner (propietario — rol `owner`)

Es el nivel de privilegio más alto. Tiene **todas las capacidades del Administrador** y, además:

| Capacidad exclusiva |
|---|
| Asignar el rol Owner a otra cuenta. |
| Modificar y bloquear/desbloquear otras cuentas Owner. |

**Restricción absoluta:** ninguna cuenta Owner puede ser eliminada, ni siquiera por otro Owner. La gestión de administradores se realiza dentro de la vista **Usuarios** del panel (no existe una sección aparte).

### 4.6 Resumen de acceso por rol

| Módulo | Visitante | Usuario | Empresa | Administrador | Owner |
|---|:--:|:--:|:--:|:--:|:--:|
| Catálogo / búsqueda / detalle | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carrito y checkout | — | ✅ | — | — | — |
| Pedidos (comprador) | — | ✅ | — | — | — |
| Favoritos | — | ✅ | — | — | — |
| Reseñas (escribir) | — | ✅ | — | — | — |
| RehniCoin (saldo/movimientos) | — | ✅ | — | — | — |
| Recargar RehniCoin a un usuario | — | — | — | ✅ | ✅ |
| Panel de Empresa | — | — | ✅ | — | — |
| Panel de Administración | — | — | — | ✅ | ✅ |
| Gestionar cuentas Owner | — | — | — | — | ✅ |

---

## 5. Requisitos para utilizar RehniMarket

### 5.1 Usuario de la plataforma web

| Requisito | Detalle |
|---|---|
| Dispositivo | Computador o dispositivo con navegador web moderno. La interfaz es responsiva (se adapta a pantallas de escritorio y móviles). |
| Navegador | Un navegador actualizado con JavaScript habilitado (la aplicación es una *Single Page Application* construida con React). |
| Conexión a Internet | Necesaria de forma permanente: todas las operaciones consultan el servidor. |
| Cuenta de correo electrónico | Obligatoria para registrarse: la verificación de la cuenta y la recuperación de contraseña se realizan por correo. |
| Dirección web de la plataforma | Proporcionada por quien administra el despliegue. |

### 5.2 Usuario de la aplicación móvil

| Requisito | Detalle |
|---|---|
| Sistema operativo | Android. La app está construida con Expo/React Native; la guía del proyecto describe su uso mediante **Expo Go** para pruebas. La distribución como archivo instalable (APK) o en tiendas **no está configurada** en el repositorio (ver [Limitaciones conocidas](#20-limitaciones-conocidas)). |
| Aplicación Expo Go | Requerida para ejecutar la app en modo de desarrollo/prueba (según `RehniMarket-mobile/README.md`). |
| Conexión a Internet | Necesaria de forma permanente. El dispositivo debe poder alcanzar el servidor de RehniMarket (misma red local en el escenario de prueba con Expo Go). |
| Cuenta de correo electrónico | Obligatoria para registrarse y recuperar el acceso. |

> **Nota:** el repositorio no define requisitos de hardware específicos (memoria, procesador). No se incluyen cifras porque no pueden justificarse con el proyecto.

---

## 6. Acceso a RehniMarket

### 6.1 Acceso como Visitante

No requiere ninguna acción: al abrir la plataforma web o la app móvil, se puede navegar el catálogo, ver categorías, ofertas, novedades, el detalle de los productos y —en web— el perfil de las empresas. Las acciones que requieren cuenta (carrito, favoritos, compra) piden iniciar sesión en el momento en que se intentan.

### 6.2 Registro

**Registro de comprador (web y móvil):**

1. Abrir la opción **"Crear cuenta" / "Registrarme"**.
2. Ingresar: **nombre completo**, **correo electrónico**, **teléfono** (10 dígitos) y **contraseña** (con su confirmación).
3. Aceptar los términos (casilla de la interfaz).
4. Enviar el formulario. La cuenta se crea en estado **no verificado**.
5. El sistema envía un **código de verificación** al correo indicado.

**Registro de empresa (solo web):**

1. Abrir **"Registrar empresa"**.
2. Ingresar los datos comerciales de la empresa y del representante, incluido el **NIT** y el **certificado** requerido.
3. Enviar el formulario. Se crea la cuenta de empresa en estado **no verificado** (correo) y con **certificación pendiente** de aprobación por la administración.
4. Verificar el correo (igual que un comprador).
5. La administración revisa el certificado: si lo **aprueba**, la empresa queda habilitada para usar todo el panel; si lo **rechaza**, registra un **motivo obligatorio** que la empresa puede consultar iniciando sesión normalmente (ver [6.4](#64-inicio-de-sesión) y [15.1](#151-mi-tienda-perfil-de-la-empresa)). Para **subir un certificado nuevo** la empresa usa la página independiente **`/actualizar-certificado`** (correo + contraseña + PDF, sin sesión), lo que deja el certificado de nuevo **pendiente** de revisión.

### 6.3 Verificación de cuenta

1. Tras registrarse, ir a la pantalla de **verificación de correo**.
2. Ingresar el **código** recibido por correo.
3. Si el código es correcto, la cuenta queda verificada y ya se puede iniciar sesión.

**Detalles del código de verificación:**

- El código tiene una validez de **5 minutos**.
- Solo hay **un código activo** a la vez por cuenta. Reintentar el inicio de sesión con una cuenta no verificada **no** genera un código nuevo si el anterior sigue vigente.
- Existe una **espera mínima de 60 segundos** para volver a solicitar un código: *"Debes esperar antes de solicitar un nuevo código de verificación."*
- Si el código **expiró**, al intentar verificar el sistema informa *"El codigo expiro. Se ha enviado uno nuevo a tu correo electronico"* y envía uno nuevo automáticamente.
- Si el correo del registro fue incorrecto, se puede **corregir el correo** antes de completar la verificación (opción "cambiar correo"); el sistema reenvía el código a la nueva dirección.

### 6.4 Inicio de sesión

1. Abrir **"Iniciar sesión"**.
2. Ingresar **correo** y **contraseña**.
3. Al autenticarse correctamente:
   - Si llegó al login desde una acción protegida (p. ej. intentar comprar), el sistema lo **regresa a esa pantalla**.
   - Si entró directamente al login, es dirigido al **Home**.

**Situaciones especiales al iniciar sesión:**

| Situación | Mensaje |
|---|---|
| Correo o contraseña incorrectos | *"Correo o contraseña incorrecta."* (no se indica cuál de los dos falló) |
| Cuenta no verificada | *"Tu correo no ha sido verificado. Te enviamos un código de verificación a tu correo electrónico."* y dirige a verificar |
| Cuenta bloqueada por la administración | *"Tu cuenta se encuentra bloqueada. Contacta con un administrador."* |
| Empresa con certificación pendiente | *"Tu empresa esta en revision"* |
| Empresa con certificación rechazada | Inicia sesión con normalidad; ve **Mi tienda** (motivo del rechazo + botón a `/actualizar-certificado`) y **Configuración de cuenta**, el resto del panel queda bloqueado. El nuevo certificado se sube desde `/actualizar-certificado` (correo + contraseña + PDF, sin sesión) |
| Empresa suspendida | *"Tu empresa se encuentra suspendida."* |

### 6.5 Cierre de sesión

- **Web:** desde el menú de cuenta o desde el panel del rol correspondiente, opción **"Cerrar sesión"**.
- **Móvil:** en la pestaña **Perfil**, opción **"Cerrar sesión"** (pide confirmación).

Al cerrar sesión, la aplicación deja de usar las credenciales y las secciones protegidas vuelven a requerir inicio de sesión.

> Si la sesión **expira** mientras se navega una pantalla protegida, la aplicación intenta renovarla automáticamente. Si no es posible, redirige al inicio de sesión con el aviso de que la sesión expiró; al volver a entrar, regresa a esa misma pantalla.

### 6.6 Recuperación de contraseña

1. En el inicio de sesión, elegir **"¿Olvidaste tu contraseña?"**.
2. Ingresar el **correo** de la cuenta.
3. El sistema envía un **código de recuperación** al correo.
4. En la pantalla **"Restablecer contraseña"**, ingresar el código y la **nueva contraseña**.
5. Confirmar. Ya se puede iniciar sesión con la nueva contraseña.

Si el correo no corresponde a ninguna cuenta: *"No existe una cuenta registrada con este correo"*. Si el código es incorrecto: *"El codigo de recuperacion es incorrecto"*.

**Cambio de contraseña estando con sesión iniciada:**

- **Web:** en *Configuración de cuenta → Seguridad*, la opción "Cambiar contraseña" **reutiliza el flujo de recuperación**: envía un código al correo de la cuenta y lleva a la pantalla de restablecimiento.
- **Móvil:** en *Configuración de cuenta*, "Cambiar contraseña" envía el código al correo y **cierra la sesión** para que el usuario cree la nueva contraseña y vuelva a entrar.

---

## 7. Navegación del usuario

### 7.1 Página principal (Home)

**Web** — muestra, en este orden:

1. **Anuncios (Hero):** banner(es) visual(es) que administra la plataforma. Cada anuncio es una **imagen**; al tocarlo puede llevar a un enlace o a una sección del catálogo (producto, categoría, empresa u ofertas), según lo configure la administración. *Los anuncios no contienen texto ni botones: son únicamente imágenes.*
2. **Categorías:** acceso rápido a las categorías de productos.
3. **Ofertas:** productos con descuento activo.
4. **Novedades:** productos publicados recientemente.

**Móvil** — la pestaña **Inicio** muestra un encabezado con buscador, los anuncios, las categorías, y secciones de productos (incluye "productos del día"/destacados, ofertas y novedades según la configuración del Home).

**Acciones disponibles:** tocar una categoría, una oferta, una novedad o un producto para abrir su detalle o el listado correspondiente; usar el buscador; en web, ir al carrito o a favoritos desde la barra superior.

### 7.2 Catálogo

Es el listado general de productos.

- **Muestra:** tarjetas de producto con imagen, nombre, empresa, precio actual y —si hay descuento— el precio anterior tachado y el porcentaje. Cada tarjeta muestra la imagen de la primera variante disponible del producto.
- **Acciones:**
  - Abrir el **detalle** del producto (toca la tarjeta).
  - **Filtrar** por categoría y **paginar** los resultados (web).
  - **Marcar/quitar favorito** desde la tarjeta (requiere sesión de Usuario; un Visitante es enviado al login).
- **Qué sucede:** al abrir un producto, la página **siempre inicia desde arriba** (no conserva la posición de desplazamiento anterior).

### 7.3 Categorías

- **Muestra:** el listado de **categorías activas** de la plataforma (definidas por la administración).
- **Acciones:** seleccionar una categoría para ver sus productos.
- **Qué sucede:** se abre el listado de productos filtrado por esa categoría.

### 7.4 Búsqueda

- **Web:** buscador en la barra superior con **resultados en vivo** (se actualizan mientras se escribe) en un desplegable; también existe una vista de resultados.
- **Móvil:** pantalla de **búsqueda** accesible desde el encabezado de Inicio.
- **Cómo funciona:** busca productos **por nombre**. La búsqueda es **tolerante a errores de escritura y a las tildes** (por ejemplo, "audifonos" encuentra "audífonos").
- **Qué sucede:** al elegir un resultado se abre el detalle del producto.

### 7.5 Ofertas

- **Ruta web:** `/offers` — **Móvil:** pantalla "Ofertas".
- **Muestra:** productos que tienen un **descuento activo** en este momento (a nivel de producto o de alguna de sus variantes disponibles). El precio mostrado es el mejor precio con descuento vigente.
- **Acciones:** abrir el detalle, marcar favorito, paginar.

### 7.6 Novedades

- **Ruta web:** `/new` — **Móvil:** pantalla "Novedades".
- **Muestra:** los productos **publicados más recientemente** que están activos y disponibles.
- **Acciones:** abrir el detalle, marcar favorito, paginar.

### 7.7 Detalle del producto

**Muestra:**

- Categoría, nombre y **calificación promedio real** con la cantidad de opiniones (o un estado de "aún sin opiniones"); nunca muestra "0.0".
- **Precio actual** y, si aplica, el **precio anterior tachado** y el **porcentaje de descuento**.
- **Galería de imágenes**.
- Si el producto tiene **variantes**: selección de variante (p. ej. color y otras características como talla o capacidad). Al elegir una combinación de variante se actualizan **imagen, precio y stock** correspondientes a esa variante.
- **Stock disponible real** de la variante seleccionada (o del producto si no tiene variantes).
- Indicación de si el precio **incluye IVA** (según lo defina la empresa para ese producto).
- **Datos del vendedor** (empresa): logo, nombre y si es **empresa verificada**.
- **Web:** enlace al **perfil público de la empresa**, cuatro **tarjetas informativas**
  (envío nacional, vendedor verificado/registrado, devolución fácil, compra protegida),
  pestañas de *Descripción / Especificaciones / Opiniones*, la sección de **opiniones de
  compradores**, un bloque de **Preguntas frecuentes**, productos relacionados y las
  opciones **"Reportar producto"** y (desde el perfil de empresa) **"Reportar empresa"**.
  La página de detalle usa un **tema visual oscuro**; el resto del sitio no cambia.
- **Móvil:** el detalle muestra la calificación promedio, pero **no muestra el listado de opiniones**, ni permite escribir reseñas, ni abrir el perfil de la empresa, ni reportar.

**Acciones:**

| Acción | Qué sucede |
|---|---|
| Seleccionar variante | Se recalculan imagen, precio y stock de esa variante. Si una combinación no está disponible, se indica. |
| Elegir cantidad | Se puede aumentar/disminuir respetando el stock disponible. |
| **Agregar al carrito** | Requiere sesión de Usuario. Si el producto tiene variantes, **se debe seleccionar una variante**. El producto queda en el carrito. Un Visitante es enviado al login y regresa al producto. |
| **Marcar favorito** | Requiere sesión de Usuario; se guarda en el servidor. |
| **Reportar** (solo web) | Abre un formulario para indicar el **motivo**, una **descripción** y adjuntar **imágenes** opcionales. Al enviarlo: *"Reporte enviado. Un administrador revisará este producto."* |

---

## 8. Carrito de compras

El carrito está disponible para el rol **Usuario**, en **web y móvil**. La descripción siguiente corresponde al comportamiento real del servidor.

### 8.1 Agregar un producto

- Se agrega desde el **detalle del producto**, indicando la **cantidad**.
- Si el producto **tiene variantes**, es obligatorio **seleccionar una variante**; de lo contrario el servidor responde *"Este producto requiere seleccionar una variante."*
- Si el producto (o la variante elegida) **no tiene stock**, no se agrega: *"Producto sin stock disponible."*
- Si ya existe esa misma línea en el carrito, la cantidad se **suma**. Si el total supera el stock: *"Solo hay N unidades disponibles."*

### 8.2 Seleccionar variante y cantidad

- La variante se elige en el detalle del producto **antes** de agregar. Cada línea del carrito queda asociada a la variante seleccionada (con su nombre, color y opciones legibles, p. ej. "Color: Negro · Talla: 40").
- El stock que aplica a cada línea es el de **esa variante** (o el del producto si no tiene variantes).

### 8.3 Actualizar la cantidad

- Desde el carrito se puede **aumentar o disminuir** la cantidad de cada producto disponible.
- La cantidad **no puede superar el stock disponible**. Si se intenta, el servidor responde *"Solo hay N unidades disponibles."*
- La cantidad mínima es **1**: para quitar un producto se usa la opción de eliminar, no bajar a 0.

### 8.4 Eliminar un producto / vaciar el carrito

- Cada línea tiene la opción de **eliminar**.
- Existe la opción **"Vaciar carrito"** que elimina todas las líneas.
- Estas acciones **siempre están disponibles**, incluso si el carrito tiene productos agotados.

### 8.5 Productos sin stock y validación de stock

RehniMarket **no bloquea todo el carrito** cuando un producto se queda sin stock. Todos los productos siguen mostrándose, los disponibles siguen funcionando con normalidad y siempre se puede **eliminar** cualquier línea (incluida la agotada).

**En la plataforma web:**

- El producto sin stock se identifica como **"Agotado"**; el que tiene una cantidad mayor a las unidades disponibles se marca como **"Sin stock suficiente"**, con la indicación de cuántas unidades quedan.
- Se puede **reducir** la cantidad del producto que excede el stock (el control de cantidad ajusta directamente al máximo disponible).
- **El botón para continuar al pago ("Ir a pagar" / "Confirmar compra") se deshabilita** mientras exista al menos un producto agotado o con la cantidad por encima del stock. Al corregir o eliminar esas líneas, el botón se vuelve a habilitar.

**En la aplicación móvil:**

- El producto sin stock se identifica con el texto *"Este producto ya no tiene stock disponible."*
- El control de cantidad no permite superar las unidades disponibles.
- El botón de pago **no se deshabilita** por productos agotados; si se intenta comprar, **el servidor rechaza la operación** con el mensaje correspondiente (*"Producto no disponible"* / stock insuficiente) y **no se cobra nada** (ver [sección 9](#9-proceso-de-compra)). En ese caso conviene eliminar del carrito el producto agotado antes de reintentar.

### 8.6 Subtotal, IVA y Total

En el carrito y en el checkout se muestran:

| Concepto | Cómo se calcula |
|---|---|
| **Subtotal** | Suma del precio unitario (con descuento aplicado) por la cantidad de cada línea. |
| **IVA** | 19%. Se aplica **solo sobre los productos marcados con IVA** por la empresa vendedora; los demás no suman IVA. Si ninguna línea aplica IVA, se muestra **"No aplica"**. |
| **Total** | Subtotal + IVA. |

Todos estos montos los calcula el **servidor**. El total definitivo se confirma en el checkout, que vuelve a calcular con la misma regla.

### 8.7 Restricciones para continuar al checkout

Para completar el pago se requiere, en todos los casos:

1. El carrito tiene al menos un producto.
2. **Ningún** producto está agotado ni con la cantidad por encima del stock disponible (el servidor lo revalida siempre; en web, además, el botón se deshabilita antes).
3. Hay una **dirección** seleccionada en el checkout.
4. El **saldo de RehniCoin** alcanza para cubrir el total.

---

## 9. Proceso de compra

El pago se realiza **con RehniCoin**. La compra genera **un pedido por cada empresa vendedora** presente en el carrito.

### Paso 1 — Carrito

Revisar los productos, cantidades, subtotal, IVA y total (ver [sección 8](#8-carrito-de-compras)). Continuar con **"Ir a pagar"**.

### Paso 2 — Dirección

El checkout requiere una **dirección de envío** con nombre completo y teléfono.

- Si la cuenta **ya tiene direcciones**, se preselecciona la marcada como **predeterminada** (o la primera disponible).
- Se puede **cambiar** la dirección seleccionada.

### Paso 3 — Selección / creación de dirección

- Si la cuenta **no tiene ninguna dirección**, el sistema abre el formulario para **agregar una** antes de poder continuar.
- Los datos que se piden son los de la dirección de envío y contacto (etiqueta, nombre completo, teléfono, dirección, ciudad y departamento).
- Al confirmar la compra, la dirección se **guarda como copia (snapshot)** en el pedido: si luego se edita o elimina esa dirección, el pedido conserva los datos con los que se realizó.

### Paso 4 — Productos

El checkout muestra el listado de productos a comprar (cantidad, nombre, variante y subtotal por línea). Si alguna línea quedó **agotada** o **sin stock suficiente**, se marca y el botón de confirmar se deshabilita, con un enlace para volver al carrito y corregir.

### Paso 5 — Resumen

Muestra **Subtotal**, **IVA** (19% sobre las líneas que aplican) y **Total**, calculados por el servidor.

### Paso 6 — RehniCoin

- Se muestra el **saldo de RehniCoin** de la cuenta.
- Si el saldo **no alcanza** para el total, se informa con un aviso y un enlace para solicitar una recarga; el botón de confirmar permanece deshabilitado.

### Paso 7 — Confirmación

Al pulsar **"Confirmar compra"**:

1. El servidor **revalida** que cada producto siga activo, que la empresa no esté suspendida y que la variante siga vigente.
2. **Reserva el stock de forma segura**: descuenta las unidades compradas de cada producto o variante en una sola operación. Si dos personas compran al mismo tiempo la última unidad, **solo una** lo consigue.
3. Verifica el saldo de RehniCoin y lo **descuenta**.
4. Crea **un pedido por empresa** vendedora.
5. **Vacía el carrito**.
6. Envía un correo **"Pedido recibido"** por cada pedido creado.

### Paso 8 — Resultado de la compra

- **Éxito:** se muestra una pantalla de confirmación ("¡Tu compra fue confirmada!") con acceso a **"Mis pedidos"**.
- Los pedidos nacen en estado **"pendiente"**.

### 9.1 Qué sucede en cada situación

| Situación | Comportamiento |
|---|---|
| No hay dirección seleccionada | El sistema abre el formulario/selector de dirección. Como respaldo, el servidor responde *"Debes registrar una dirección para continuar con la compra."* |
| El saldo de RehniCoin no alcanza | Aviso *"Tu saldo de RehniCoin no alcanza para completar la compra."* y el botón de confirmar se mantiene deshabilitado. No se realiza la compra. |
| Un producto se quedó sin stock justo antes de pagar | El servidor rechaza el checkout con *"'{producto}' ya no tiene suficiente stock disponible."* **Nada se cobra ni se descuenta** (la operación se revierte completa). La aplicación **recarga el carrito**, muestra el mensaje real y deja el botón deshabilitado hasta que se corrija. Los demás productos **no se pierden**. |
| El producto o la variante ya no existe / la empresa fue suspendida | El servidor responde que ese producto/variante "ya no está disponible" y se recarga el carrito. La compra no se completa. |
| Error inesperado | Se muestra el mensaje del servidor o *"No se pudo completar la compra. Intenta de nuevo."* El error **no se oculta**; la compra no se realiza. |

---

## 10. Direcciones

Disponible para el rol **Usuario** en **web** (panel *Direcciones* y durante el checkout) y en **móvil** (pantalla *Mis direcciones* y durante el checkout).

| Función | Disponible | Descripción |
|---|---|---|
| **Consultar** | Sí | Lista de todas las direcciones registradas por el usuario. |
| **Crear** | Sí | Formulario con etiqueta, nombre completo, teléfono, dirección, ciudad y departamento. |
| **Seleccionar** | Sí | Durante el checkout se elige cuál dirección usar. |
| **Marcar predeterminada** | Sí | La dirección predeterminada se preselecciona automáticamente al comprar. |
| **Actualizar** | Sí | Editar los datos de una dirección existente. |
| **Eliminar** | Sí | Quitar una dirección. Los pedidos ya realizados con esa dirección conservan sus datos (snapshot). |

---

## 11. RehniCoin

### 11.1 Qué es

**RehniCoin** es el saldo interno con el que se pagan las compras dentro de RehniMarket. **1 RehniCoin = 1 peso colombiano.** Cada cuenta de Usuario tiene una billetera asociada.

### 11.2 Cómo se consulta el saldo

- **Web:** panel *RehniCoins* (o *Billetera*), muestra el **saldo actual** y el **historial paginado de movimientos**.
- **Móvil:** pantalla *RehniCoin* (accesible desde Perfil), con saldo y movimientos. El saldo también aparece resumido en la pestaña Perfil.

Cada movimiento indica su **tipo** (recarga, compra, reembolso o ajuste), **fecha**, **descripción** y **monto**. El saldo y los movimientos provienen siempre del servidor.

### 11.3 Cómo interviene durante una compra

En el checkout se compara el saldo con el total. Si alcanza, al confirmar la compra el total se **descuenta** de la billetera y queda registrado como un movimiento de tipo "compra".

### 11.4 Solicitud de recarga

RehniMarket **no** permite recargar saldo automáticamente desde la aplicación. El flujo es:

1. En la billetera, elegir **"Recargar RehniCoins"**.
2. Seleccionar una cantidad sugerida o escribir un **monto propio** (número entero mayor a cero).
3. Al confirmar, la aplicación **abre una conversación de WhatsApp** hacia el número oficial de RehniMarket, con un mensaje que incluye la cantidad solicitada y el correo de la cuenta.
4. **El saldo NO se acredita automáticamente.** Solo se actualiza cuando un **Administrador** realiza la recarga manualmente después de verificar el pago por fuera de la plataforma.
5. Si el número de WhatsApp no está configurado en el entorno, la aplicación **avisa el error** en lugar de abrir una conversación inválida ("Contacto no disponible").

### 11.5 Qué ocurre si el saldo es insuficiente

En el checkout se muestra el aviso *"Tu saldo no alcanza para esta compra"* con un enlace para recargar, y el botón **"Confirmar compra" permanece deshabilitado**. Si aun así se intentara, el servidor responde *"Tu saldo de RehniCoin no alcanza para completar la compra."* y no realiza la compra.

---

## 12. Pedidos

### 12.1 Consulta de pedidos

- **Web:** panel *Mis pedidos*.
- **Móvil:** pantalla *Tus pedidos* (accesible desde Perfil).

Se muestra el listado **paginado** de pedidos del usuario, con su estado actual. Cada pedido corresponde a **una empresa vendedora**.

### 12.2 Estados

| Estado | Significado |
|---|---|
| **Pendiente** (`pending`) | Pedido creado. Estado inicial tras la compra. |
| **Pagado** (`paid`) | Estado contemplado por el sistema para el pedido. |
| **En preparación** (`processing`) | La empresa aceptó el pedido y lo está preparando. |
| **Enviado** (`shipped`) | La empresa despachó el pedido; puede incluir transportadora y número de guía. |
| **Entregado** (`delivered`) | Pedido recibido por el comprador. Estado final. |
| **Cancelado** (`cancelled`) | Pedido anulado. Estado final. |

**Flujo de estados permitido:** Pendiente/Pagado → En preparación → Enviado → Entregado. Desde Pendiente o Pagado también se puede pasar a Cancelado. Un pedido **Entregado** o **Cancelado** no admite más cambios.

### 12.3 Detalle del pedido

El detalle muestra los productos comprados (con nombre y variante tal como estaban al momento de la compra), cantidades, precios unitarios, subtotal, IVA, total, la dirección de envío registrada y el estado con su historial/línea de tiempo.

### 12.4 Información de envío

Cuando la empresa marca el pedido como **Enviado**, puede registrar la **transportadora** y el **número de guía**. En web, el detalle del pedido muestra esa información y, cuando la transportadora tiene una URL de rastreo configurada, un **enlace de seguimiento** con el número de guía.

### 12.5 Cancelación

El **Usuario** puede cancelar un pedido **únicamente mientras su estado sea "Pendiente" o "Pagado"**. Una vez que la empresa lo pone "En preparación", "Enviado" o "Entregado", ya no puede cancelarlo desde su cuenta. Si se intenta: *"Este pedido ya está en preparación y no se puede cancelar."*

> **Importante:** la cancelación de un pedido por parte del comprador **no reembolsa RehniCoin** automáticamente. El reembolso automático de RehniCoin solo ocurre en un caso específico: cuando la **administración suspende a una empresa**, sus pedidos en estado Pendiente, Pagado o En preparación se cancelan **y se reembolsan** al comprador.

### 12.6 Seguimiento

No existe un seguimiento en tiempo real dentro de RehniMarket. El "seguimiento" consiste en:

- El **estado** del pedido, que la empresa actualiza.
- El **enlace externo de rastreo** de la transportadora (cuando aplica), en el detalle del pedido en web.

### 12.7 Devoluciones (web)

Cuando un pedido está **Entregado**, en el detalle del pedido aparece, junto a cada
producto, el botón **"Solicitar devolución"**.

1. El comprador pulsa **Solicitar devolución** en el producto que quiere devolver.
2. Escribe **obligatoriamente el motivo** (mínimo 5 caracteres) y envía la solicitud.
3. La devolución queda **En revisión**. Solo se puede tener **una devolución activa por
   producto** del pedido.
4. La **empresa vendedora** revisa la solicitud y la **aprueba** o la **rechaza**:
   - **Aprobada:** se reintegra el valor del producto (con IVA si aplicaba) a la
     **billetera RehniCoin** del comprador. El detalle del pedido muestra
     *"Devolución aprobada · Reembolso acreditado en RehniCoin: $…"*.
   - **Rechazada:** la empresa indica un motivo, que el comprador ve en el detalle del
     pedido: *"Devolución rechazada — Motivo: …"*. Si el motivo del rechazo lo permite,
     el comprador puede volver a solicitar la devolución de ese producto.

El comprador recibe un correo cuando la devolución se aprueba o se rechaza. La solicitud
**no** cambia el estado del pedido (sigue *Entregado*).

> Solo se pueden devolver productos de **pedidos propios** y **entregados**. El comprador
> nunca decide el resultado ni el monto: eso lo controla el sistema y la empresa vendedora.

---

## 13. Favoritos

**Implementado.** Disponible para el rol **Usuario** en **web y móvil**.

| Acción | Descripción |
|---|---|
| Marcar favorito | Desde la tarjeta de un producto en cualquier listado. Se guarda en el **servidor**, no solo en la pantalla. |
| Persistencia | Al recargar la página o volver a la sección, el producto sigue mostrándose como favorito si lo está. |
| Quitar favorito | Desde la tarjeta o desde la lista de favoritos. El cambio también persiste. |
| Ver la lista | Panel *Favoritos* (web) / pestaña *Favoritos* (móvil). Quitar un favorito desde ahí actualiza su estado en el resto de la aplicación. |

**Restricción:** los favoritos **no están disponibles** para cuentas de tipo Empresa, Administrador ni Owner. Un Visitante que intenta marcar un favorito es enviado al inicio de sesión y, tras autenticarse, regresa al mismo producto.

---

## 14. Reseñas

**Implementado en la plataforma web.** En la aplicación móvil solo se muestra la **calificación promedio** del producto; **no** hay listado de opiniones ni formulario para escribirlas.

| Función (web) | Descripción |
|---|---|
| **Ver opiniones** | En el detalle del producto, sección "Opiniones de compradores": resumen (promedio, total y distribución por estrellas) y comentarios. |
| **Escribir una reseña** | Solo el rol **Usuario**, y solo si tiene **al menos un pedido de ese producto en estado "Entregado"**. Se califica de **1 a 5 estrellas** y se agrega un **comentario opcional**. |
| **Una reseña por producto** | Si el usuario ya reseñó el producto, el sistema lo indica ("Ya reseñaste este producto") en lugar de mostrar el formulario nuevamente. Si intenta crear otra: *"Ya reseñaste este producto. Edita tu reseña en vez de crear otra."* |
| **Eliminar la propia reseña** | El usuario puede eliminar su reseña (con confirmación). |

Si el usuario aún no tiene el producto entregado, la sección indica: *"Podrás reseñar este producto una vez que te sea entregado."*

La **calificación promedio y el conteo de opiniones** que se muestran en el producto y en el perfil de la empresa se recalculan a partir de las reseñas reales existentes; nunca se muestran valores simulados.

> **Nota técnica:** el servidor también admite **editar** una reseña propia; en la interfaz web actual la sección de opiniones ofrece **crear** y **eliminar** la reseña propia. La edición como acción visible en la interfaz no está confirmada.

---

## 15. Funcionalidades de Empresa

> Disponibles **solo en la plataforma web**, en el **Panel Empresa**. Con certificación **pendiente** o **rechazada** solo se puede usar **Mi tienda** (ver el estado, el motivo si fue rechazado, y reemplazar el certificado) y **Configuración de cuenta**; **Productos**, **Pedidos** y **Finanzas** exigen certificación **aprobada**.

El panel tiene siete secciones: **Inicio**, **Productos**, **Pedidos**, **Devoluciones**, **Finanzas**, **Mi tienda** y **Configuración de cuenta**.

### 15.1 Mi tienda (perfil de la empresa)

- Consultar y **actualizar** los datos del perfil comercial (nombre, información de contacto).
- **Actualizar el logo y el banner** de la empresa.
- Consultar el **estado de verificación** (certificado aprobado, pendiente o rechazado) y, si fue **rechazado**, el **motivo**. Es informativo: lo determina la administración y la empresa no puede cambiar el estado ni el motivo directamente.
- Si el certificado está **rechazado**, en **Mi tienda** aparece el botón **"Actualizar certificado"**, que lleva a la página **`/actualizar-certificado`**. Esa página es **independiente del panel**: pide **correo + contraseña + el nuevo PDF** y no necesita haber iniciado sesión (ver [15.1-bis](#151-bis-actualizar-certificado-página-independiente)). Al enviarlo, el estado vuelve a **pendiente**, el certificado anterior deja de ser válido y la administración debe revisarlo de nuevo; la empresa **no** queda aprobada automáticamente. Mientras el certificado esté **pendiente** o **aprobado**, la operación se rechaza.

### 15.1-bis Actualizar certificado (página independiente)

La página **`/actualizar-certificado`** permite a una empresa **rechazada** subir un
certificado nuevo **sin entrar al panel**. Es un flujo aparte del inicio de sesión
normal: **no** genera ninguna sesión ni token.

Pide tres datos:

| Campo | |
|---|---|
| Correo electrónico | El de la cuenta de la empresa. |
| Contraseña | La misma del inicio de sesión. |
| Nuevo certificado | Archivo **PDF**, **máximo 5 MB**. |

Al pulsar **"Actualizar certificado"** el servidor verifica el correo y la contraseña,
comprueba que la empresa esté **rechazada**, guarda el nuevo PDF y deja el certificado
en estado **pendiente**, borrando el motivo del rechazo anterior. Mensajes:

- Credenciales incorrectas → *"Correo o contraseña incorrectos."* (no revela si el
  correo existe).
- La empresa no está rechazada (ya aprobada o ya en revisión) → *"El certificado de
  esta empresa no puede actualizarse en este momento."*
- Archivo que no es PDF o pesa más de 5 MB → *"El certificado debe ser un archivo PDF
  de máximo 5 MB."*
- Éxito → *"Certificado actualizado correctamente. Tu empresa volverá a revisión."*

> El motivo del rechazo **no** se muestra en esta página; se consulta en **Mi tienda**
> (iniciando sesión) o en el correo de rechazo, que ya lo incluye.

### 15.2 Productos

- **Crear un producto:** nombre, descripción, categoría, precio, stock, imágenes y —si la categoría lo define— sus **especificaciones**.
- **Descuento:** definir un descuento por **porcentaje** sobre el producto y activarlo/desactivarlo.
- **Editar** la información y las imágenes de un producto.
- **Activar/desactivar** la visibilidad pública del producto y **eliminarlo**.
- **Variantes:** crear variantes (por ejemplo, por color y otras características como talla o capacidad), cada una con su **precio, descuento, stock e imágenes propias**; editarlas y eliminarlas. Existe un asistente para **generar variantes** a partir de combinaciones de atributos.
- Un producto y sus variantes solo pueden ser gestionados **por la empresa que los creó**.

### 15.3 Pedidos

- Ver el **listado de pedidos** que incluyen productos de la empresa, con **contadores por estado** (pendientes, en proceso, completados, cancelados).
- Ver el **detalle** de un pedido.
- **Avanzar el estado** siguiendo el flujo permitido (Pendiente/Pagado → En preparación → Enviado → Entregado) o **cancelarlo** mientras esté Pendiente o Pagado.
- Al marcar un pedido como **Enviado**, registrar la **transportadora** (del catálogo de transportadoras activas) y el **número de guía**.
- Si se intenta una transición no permitida: *"No se puede pasar de '{estado}' a '{estado}'."*

### 15.3-bis Devoluciones

Sección **Devoluciones** del Panel Empresa. Muestra únicamente las solicitudes de
devolución de **pedidos de esta empresa** (nunca de otra empresa).

- Lista con filtros por estado (**En revisión**, **Aprobadas**, **Rechazadas**) y
  búsqueda por referencia del pedido, correo o nombre del comprador.
- En el **detalle** de una solicitud: pedido, comprador, producto, cantidad, valor,
  fecha y **motivo del comprador**.
- Para una solicitud **En revisión**, dos acciones:
  - **Aprobar devolución:** se reintegra el valor del producto (con IVA si aplicaba) a
    la billetera **RehniCoin** del comprador, en el momento de aprobar. La solicitud
    pasa a **Aprobada** y no admite más cambios.
  - **Rechazar devolución:** exige **obligatoriamente** un motivo (por ejemplo,
    *"El producto presenta daños causados por el comprador."*). El motivo se guarda y
    se le muestra al comprador. La solicitud pasa a **Rechazada**.
- La empresa no puede cambiar arbitrariamente el estado ni re-evaluar una solicitud ya
  resuelta.

### 15.4 Finanzas

- **Cuentas bancarias:** registrar una o más, marcar una como **predeterminada**, editarlas y eliminarlas.
- **Balance:** consultar el balance disponible de la empresa.
- **Liquidaciones:** consultar el historial de liquidaciones generadas por la administración, con su estado (**pendiente** o **pagada**). Las liquidaciones se calculan sobre las ventas válidas menos la **comisión de la plataforma (5%)** y requieren que la empresa tenga una **cuenta bancaria predeterminada**.

### 15.5 Configuración de cuenta

Actualizar nombre, teléfono, correo y foto del representante; cambiar la contraseña (mediante código al correo).

---

## 16. Funcionalidades de Administrador

> Disponibles **solo en la plataforma web**, en el **Panel Administrador / Panel Propietario**. El Owner ve el mismo panel más sus capacidades exclusivas.

Secciones: **Inicio**, **Empresas**, **Usuarios**, **Catálogo**, **Anuncios**, **Reportes**, **Transportadoras**, **Liquidaciones**, **RehniCoin** y **Configuración de cuenta**.

### 16.1 Inicio (estadísticas)

Resumen general de la plataforma: **estadísticas** (totales de usuarios, empresas y actividad), **actividad reciente** y **usuarios recientes**.

### 16.2 Empresas

- Consultar el listado de empresas y el **detalle** de cada una (incluye su certificado).
- **Aprobar o rechazar** la certificación. Al **rechazar** es obligatorio registrar un **motivo**; la empresa lo consulta desde su panel y puede reemplazar el certificado. Al **aprobar**, cualquier motivo de rechazo anterior deja de mostrarse. Solo una empresa **aprobada** se muestra como "empresa verificada" a los compradores.
- **Activar o desactivar (suspender)** la cuenta de una empresa. Al suspenderla, sus pedidos en Pendiente/Pagado/En preparación se **cancelan y se reembolsan** en RehniCoin a los compradores.

### 16.3 Usuarios

- Consultar el listado de usuarios y el **detalle** de cada uno.
- **Actualizar** la información de una cuenta.
- **Bloquear / desbloquear** una cuenta (cambiar su estado activa/bloqueada).
- **Eliminar** una cuenta.
- **Recargar RehniCoin** a un usuario desde su detalle (misma función de la sección RehniCoin).
- Restricciones de rol: un Administrador **no** puede modificar, bloquear ni asignar el rol **Owner**. Solo el **Owner** puede asignar/modificar/bloquear cuentas Owner. **Ninguna** cuenta Owner puede eliminarse.

### 16.4 Catálogo

- Crear, editar, **activar/desactivar** y eliminar **categorías** de productos.
- Definir las **especificaciones** (campos) que las empresas completan al crear un producto de cada categoría.
- Administrar los **atributos y opciones de variante** (incluidos los **colores** disponibles).

### 16.5 Anuncios

- Crear un anuncio con **imagen** (y una imagen específica para móvil, opcional), un **enlace** o un **destino de catálogo** (producto, categoría, empresa u ofertas, con criterios como descuento mínimo, stock máximo o antigüedad), un **orden** y el estado **activo/inactivo**.
- **Editar**, **activar/desactivar** y **eliminar** anuncios.
- Solo los anuncios **activos** se muestran a los visitantes en el Home.

> **Diferencia con la documentación previa:** el documento de historias de usuario menciona anuncios "con imagen, texto y enlace". En la implementación actual **el anuncio es únicamente un banner visual**: no tiene título, descripción ni texto de botón. Conserva las imágenes, el enlace/destino y los criterios de segmentación.

### 16.6 Reportes

- Consultar el listado de **reportes** enviados por los usuarios (sobre productos o empresas), ver el **detalle** (motivo, descripción, imágenes) y **cambiar el estado** del reporte.

### 16.7 Transportadoras

- Administrar el catálogo de **transportadoras** que las empresas usan al despachar: crear, editar y **activar/desactivar**. Cada transportadora puede tener una URL de rastreo con un marcador para el número de guía.

### 16.8 Liquidaciones

- Consultar una **vista previa** de la liquidación de una empresa para un periodo disponible.
- **Generar** la liquidación (ventas válidas menos la comisión del 5%). Requiere que la empresa tenga **cuenta bancaria predeterminada**.
- Consultar el listado de liquidaciones con su estado.
- **Marcar como pagada** una liquidación pendiente. Una liquidación ya pagada **no** puede volver a marcarse como pagada.

### 16.9 RehniCoin

- **Recargar** el saldo de un usuario identificándolo por su **correo electrónico**, indicando la **cantidad** y una **descripción** opcional. El nuevo saldo queda disponible de inmediato.
- Consultar el **historial de recargas** realizadas (usuario receptor, monto y administrador responsable).
- Esta acción es **exclusiva de Administrador y Owner**.

### 16.10 Capacidad exclusiva del Owner

Dentro de la vista **Usuarios**, el Owner puede **asignar el rol Owner** a otra cuenta y **modificar/bloquear** cuentas Owner. No existe una sección separada para esto.

---

## 17. Seguridad básica para usuarios

Recomendaciones de uso que dependen del propio usuario:

| Recomendación | Motivo |
|---|---|
| **No compartir las credenciales** (correo y contraseña) con nadie. | Cualquiera con ellas puede comprar con tu saldo de RehniCoin y ver tus datos. |
| **Cerrar sesión** al usar un equipo o dispositivo compartido o público. | La sesión permanece activa hasta cerrarla o hasta que expire. |
| Usar una **contraseña robusta y única** (larga, con combinación de caracteres, no reutilizada de otros servicios). | Reduce el riesgo de que adivinen o reutilicen tu contraseña. |
| Cambiar la contraseña si sospechas que alguien la conoce. | El cambio se hace verificando tu correo. |
| Mantener **acceso a tu correo electrónico** y protegerlo. | La verificación de cuenta y la recuperación de contraseña dependen del correo. |
| Verificar que la **dirección web** de RehniMarket sea la oficial antes de ingresar tus datos. | Evita ingresar credenciales en sitios falsos. |
| No divulgar el contenido de los **correos de verificación/recuperación** ni sus códigos. | Un código permite verificar la cuenta o restablecer la contraseña. |
| Revisar tu **historial de movimientos de RehniCoin** y tus **pedidos** periódicamente. | Permite detectar actividad que no reconoces. |
| Al solicitar una recarga por **WhatsApp**, confirmar que el número corresponde al canal oficial de RehniMarket. | La solicitud incluye tu correo; el pago se coordina fuera de la plataforma. |

> RehniMarket **nunca** acredita saldo de RehniCoin de forma automática por una solicitud: siempre lo hace un administrador tras verificar el pago. Desconfía de cualquier mensaje que ofrezca "recargas instantáneas" fuera de este flujo.

---

## 18. Mensajes y errores frecuentes

Los mensajes citados provienen del código del proyecto.

| Situación | Mensaje / comportamiento | Acción recomendada |
|---|---|---|
| Correo o contraseña incorrectos al iniciar sesión | *"Correo o contraseña incorrecta."* | Verificar los datos. El sistema no revela cuál de los dos falló. |
| Cuenta sin verificar al iniciar sesión | *"Tu correo no ha sido verificado. Te enviamos un código de verificación a tu correo electrónico."* | Ir a la pantalla de verificación e ingresar el código recibido. |
| Solicitar un código de verificación demasiado pronto | *"Debes esperar antes de solicitar un nuevo código de verificación."* | Esperar (mínimo 60 segundos) y volver a intentar. |
| Código de verificación vencido | *"El codigo expiro. Se ha enviado uno nuevo a tu correo electronico"* | Revisar el correo y usar el nuevo código (válido 5 minutos). |
| Código de verificación incorrecto | *"El código de verificación es incorrecto."* | Volver a escribir el código exactamente como llegó. |
| Cuenta bloqueada | *"Tu cuenta se encuentra bloqueada. Contacta con un administrador."* | Contactar a la administración de la plataforma. |
| Empresa en revisión | *"Tu empresa esta en revision"* | Esperar a que la administración apruebe la certificación. |
| Empresa rechazada | Inicio de sesión normal; solo se ve **Mi tienda** con el motivo del rechazo | Subir el nuevo certificado desde **`/actualizar-certificado`** (o el botón en Mi tienda) — correo + contraseña + PDF, sin necesidad de sesión — y esperar la nueva revisión. |
| Empresa suspendida | *"Tu empresa se encuentra suspendida."* | Contactar a la administración. |
| Correo ya registrado (registro) | *"El correo ya se encuentra registrado"* | Iniciar sesión o recuperar la contraseña. |
| NIT ya registrado (registro de empresa) | *"El NIT ya se encuentra registrado"* | Verificar el NIT; puede que la empresa ya tenga cuenta. |
| Recuperación con correo inexistente | *"No existe una cuenta registrada con este correo"* | Verificar el correo escrito. |
| Código de recuperación incorrecto | *"El codigo de recuperacion es incorrecto"* | Revisar el correo y reintentar con el código correcto. |
| Agregar al carrito un producto con variantes sin elegir variante | *"Este producto requiere seleccionar una variante."* | Elegir la variante en el detalle del producto. |
| Producto sin stock al agregarlo | *"Producto sin stock disponible."* | El producto está agotado; intentar más tarde u otra variante. |
| Cantidad mayor al stock disponible | *"Solo hay N unidades disponibles."* | Ajustar la cantidad a lo disponible. |
| Carrito con un producto agotado | **Web:** la línea se marca "Agotado" / "Sin stock suficiente" y el botón de pago se **deshabilita**. **Móvil:** se marca la línea y el servidor rechaza el pago si se intenta. | Eliminar el producto agotado o reducir la cantidad. |
| Checkout sin dirección | *"Debes registrar una dirección para continuar con la compra."* | Agregar o seleccionar una dirección. |
| Saldo insuficiente en el checkout | *"Tu saldo de RehniCoin no alcanza para completar la compra."* | Solicitar una recarga (WhatsApp) y esperar la acreditación del administrador. |
| Stock agotado durante el checkout | *"'{producto}' ya no tiene suficiente stock disponible."* — **no se cobra nada** | Volver al carrito, ajustar o eliminar el producto y reintentar. |
| Cancelar un pedido que ya no es cancelable | *"Este pedido ya está en preparación y no se puede cancelar."* | Contactar a la empresa vendedora si es necesario. |
| Intentar reseñar sin compra entregada | *"Podrás reseñar este producto una vez que te sea entregado."* | Esperar a que el pedido llegue al estado "Entregado". |
| Reseñar un producto ya reseñado | *"Ya reseñaste este producto. Edita tu reseña en vez de crear otra."* | Usar la reseña existente o eliminarla y crear una nueva. |
| Enviar un reporte de producto | *"Reporte enviado. Un administrador revisará este producto."* | Ninguna; el reporte queda registrado. |
| Número de WhatsApp de recargas no configurado | *"Contacto no disponible"* (móvil) / aviso equivalente en web | Informar a la administración; la recarga por este canal no está disponible temporalmente. |
| Sesión expirada durante la navegación | Aviso de sesión expirada y redirección al inicio de sesión | Volver a iniciar sesión; se regresa a la pantalla donde se estaba. |
| Error interno del servidor | *"Error interno del servidor."* | Reintentar más tarde; si persiste, informar a la administración. |

---

## 19. Preguntas frecuentes

**¿Necesito una cuenta para ver los productos?**
No. Cualquier visitante puede explorar el catálogo, las categorías, las ofertas, las novedades y el detalle de los productos. La cuenta se necesita para el carrito, los favoritos y la compra.

**¿Con qué se paga en RehniMarket?**
Con **RehniCoin**, el saldo interno de la plataforma. 1 RehniCoin equivale a 1 peso colombiano. No se ingresa una tarjeta ni se paga en efectivo dentro de la aplicación.

**¿Cómo consigo saldo de RehniCoin?**
Se solicita una recarga desde la billetera; la aplicación abre un chat de WhatsApp con el número oficial. El pago se coordina fuera de la plataforma y **un administrador acredita el saldo manualmente** después de verificarlo. La solicitud por sí sola no suma saldo.

**¿Puedo comprar productos de varias empresas en una sola compra?**
Sí. Al confirmar, el sistema genera **un pedido por cada empresa** presente en el carrito.

**¿Se agrega IVA a todo?**
No. El IVA del 19% se aplica **solo a los productos que la empresa vendedora marcó con IVA**. Si ninguno aplica, el checkout muestra "No aplica".

**Un producto de mi carrito se agotó. ¿Pierdo los demás?**
No. El producto agotado se marca y el botón de pago se deshabilita hasta que lo elimines o ajustes la cantidad. Los demás productos permanecen. Si el stock cambia justo al confirmar, la compra se rechaza completa **sin cobrarte** y el carrito se actualiza.

**¿Puedo cancelar un pedido?**
Sí, pero **solo mientras esté "Pendiente" o "Pagado"**. Cuando la empresa lo pone "En preparación", "Enviado" o "Entregado", ya no puedes cancelarlo desde tu cuenta. La cancelación por el comprador **no** devuelve RehniCoin automáticamente.

**¿Cuándo puedo dejar una reseña?**
Cuando tengas **al menos un pedido de ese producto en estado "Entregado"**. Puedes dejar **una** reseña por producto y eliminarla si quieres. (Función disponible en la web.)

**¿Puedo usar la aplicación móvil si tengo una cuenta de empresa o de administrador?**
No. La app móvil es para **compradores y visitantes**. Si inicias sesión con una cuenta de empresa o administración, la app cierra la sesión automáticamente. Esos paneles están **solo en la web**.

**Registré mi empresa pero no puedo iniciar sesión.**
Depende del estado del certificado. Si está **pendiente** de revisión, el inicio de sesión se rechaza con *"Tu empresa esta en revision"*; hay que esperar a que la administración lo revise. Si fue **rechazado**, sí puedes iniciar sesión con tu correo y contraseña: entra a **Mi tienda** para ver el **motivo**; el resto del panel permanece bloqueado hasta que el nuevo certificado sea aprobado. Para **subir el nuevo certificado** puedes usar el botón "Actualizar certificado" de Mi tienda o ir directamente a **`/actualizar-certificado`**, una página independiente que solo pide correo + contraseña + el PDF y **no requiere iniciar sesión**.

**Cambié mi correo o mi nombre. ¿Tengo que volver a iniciar sesión?**
No. Los cambios en *Configuración de cuenta* se reflejan de inmediato (por ejemplo, el nombre en el menú).

**Olvidé mi contraseña.**
Usa "¿Olvidaste tu contraseña?" en el inicio de sesión: recibirás un código por correo para crear una nueva.

**¿Los favoritos se guardan si cambio de dispositivo?**
Sí. Los favoritos se guardan en el servidor y están asociados a tu cuenta.

**¿Puedo ver dónde va mi paquete?**
Puedes ver el **estado** del pedido (que la empresa actualiza) y, si la empresa registró transportadora y número de guía, un **enlace de rastreo** de la transportadora en el detalle del pedido (web). No hay seguimiento en tiempo real dentro de RehniMarket.

---

## 20. Limitaciones conocidas

Esta sección es intencionalmente honesta. Describe lo que **no** está disponible, lo que tiene alcance limitado y las diferencias entre canales.

### 20.1 Diferencias entre plataforma web y aplicación móvil

| Funcionalidad | Estado |
|---|---|
| **Perfil público de empresa** ("Ver tienda") | Solo **web**. En móvil el detalle del producto muestra el vendedor pero **no enlaza a su perfil**. |
| **Listado de reseñas de un producto** y **escribir reseñas** | Solo **web**. En móvil solo se ve la calificación promedio. |
| **Reportar** un producto o una empresa | Solo **web**. |
| **Registro de Empresa** | Solo **web**. El registro en móvil es únicamente para compradores. |
| **Panel de Empresa** (productos, pedidos, finanzas) | Solo **web**. |
| **Panel de Administrador / Owner** | Solo **web**. |
| Uso de la app móvil con cuentas Empresa/Administrador/Owner | **No permitido**: la app cierra la sesión automáticamente. |
| Bloqueo del botón de pago cuando el carrito tiene un producto agotado | Solo **web** deshabilita el botón de forma preventiva. En **móvil** el pago se intenta y lo **rechaza el servidor** (sin cobrar). |
| Etiqueta "Sin stock suficiente" (cantidad mayor al stock, con stock > 0) | Solo **web**. En móvil solo se marca el caso de stock en cero. |

### 20.2 Funcionalidades con alcance limitado

| Tema | Limitación |
|---|---|
| **Recarga de RehniCoin** | No es automática. Depende de un contacto por **WhatsApp** y de la acción **manual** de un administrador. Requiere que el número de WhatsApp esté **configurado en el entorno**; si no lo está, la solicitud no puede realizarse. |
| **Reembolsos de RehniCoin** | El reembolso automático **solo** ocurre cuando la administración **suspende una empresa** (se reembolsan sus pedidos en Pendiente/Pagado/En preparación). La **cancelación de un pedido por el comprador no reembolsa** RehniCoin. |
| **Seguimiento de envíos** | No hay seguimiento en tiempo real. Se limita al **estado** del pedido y a un **enlace externo** de la transportadora (cuando la empresa lo registra y la transportadora tiene URL de rastreo). |
| **Editar una reseña** | El servidor lo admite, pero la interfaz web ofrece de forma visible **crear** y **eliminar** la reseña propia; la edición como opción visible no está confirmada. |
| **Anuncios del Home** | Son **banners visuales** (imagen + enlace/destino). No tienen título, descripción ni texto de botón, a diferencia de lo que sugiere la documentación de historias de usuario. |
| **Estado "Pagado" de los pedidos** | El estado `paid` está definido en el sistema, pero los pedidos **nacen en "Pendiente"** tras la compra. |
| **Consola de administración de imágenes (MinIO)** | Las imágenes se almacenan en un servicio de objetos; su administración directa es tarea del equipo técnico, no del usuario final. |

### 20.3 Funcionalidades que dependen de la configuración del despliegue

| Tema | Dependencia |
|---|---|
| Envío de correos (verificación, recuperación, notificaciones de pedido) | Requiere una cuenta de correo (SMTP) configurada por el equipo técnico. Si no está configurada, los códigos y notificaciones **no llegan**. |
| Recarga de RehniCoin por WhatsApp | Requiere el número oficial configurado en el entorno de cada aplicación. |
| Visualización de imágenes de productos | Requiere que la dirección del servidor de imágenes esté correctamente configurada para el entorno donde se accede. |
| Aplicación móvil como instalable (APK) o en tiendas | **No configurada** en el repositorio. El uso documentado es mediante **Expo Go** en un entorno de prueba. |

### 20.4 Funcionalidades no implementadas / no encontradas

| Funcionalidad | Estado |
|---|---|
| Pago con dinero real (pasarela de pagos, tarjeta, PSE, etc.) | **No existe.** El único medio de pago es RehniCoin. |
| Notificaciones push en la aplicación móvil | **No encontradas** en el proyecto. |
| Chat directo entre comprador y empresa dentro de la plataforma | **No existe.** |
| Devoluciones / reclamos gestionados dentro de la plataforma | **No existe** un módulo específico de devoluciones (más allá de la cancelación de pedidos según su estado). |
| Cupones o códigos de descuento | **No existen.** Los descuentos los define cada empresa por producto o variante. |
| Recuperar/editar reseñas desde la app móvil | **No existe.** |
| Ver el perfil de empresa desde la app móvil | **No existe.** |

---

## 21. Conclusión

Este documento describe el **funcionamiento actual** de RehniMarket, verificado directamente contra el código fuente del proyecto (backend, aplicación web y aplicación móvil), la documentación de historias de usuario y la configuración del repositorio.

RehniMarket es una plataforma de comercio electrónico **funcional** para su propósito académico: permite a un comprador registrarse, explorar un catálogo con productos de varias empresas, armar un carrito con validación real de stock, pagar con RehniCoin, hacer seguimiento del estado de sus pedidos, gestionar direcciones y favoritos, y dejar reseñas de lo que compró. Las empresas cuentan con un panel web completo para publicar y administrar su catálogo, atender pedidos y consultar sus finanzas, y la administración dispone de herramientas para gobernar la plataforma (empresas, usuarios, catálogo, anuncios, reportes, liquidaciones y recargas de saldo).

Las **limitaciones** señaladas en la [sección 20](#20-limitaciones-conocidas) —la ausencia de pago con dinero real, la recarga de RehniCoin dependiente de un proceso manual, el alcance reducido de la aplicación móvil frente a la web, y los anuncios como banners únicamente visuales— forman parte del estado real del sistema y están documentadas de forma explícita para que la evaluación disponga de una imagen fiel del alcance entregado.

El comportamiento aquí descrito coincide entre la interfaz y el servidor: la **autoridad final** sobre stock, precios, saldos, estados de pedido y permisos reside siempre en el servidor, y la interfaz —web o móvil— refleja lo que el servidor autoriza.

---

*Fin del Manual de Usuario — RehniMarket.*
