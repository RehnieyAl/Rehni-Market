# Fase 1 — Análisis de los manuales de RehniMarket

Fecha: 06/11/2026 · Rama: `docs/actualizar-manuales` · Base de código: `develop` (API 2.6.0, Alembic `c3e5a7f9d1b2`).
Anexo con el inventario completo de la interfaz por archivo: `docs/Manuales/ANALISIS-FASE-1-anexo-interfaz.md`.

---

## 0. Hallazgo bloqueante: los originales son PDF convertidos a Word

Los dos archivos de diseño **no son documentos de Word editables en el sentido normal**. Son conversiones de PDF a DOCX hechas por OnlyOffice (`docProps/app.xml`: `ONLYOFFICE/10.0.0.169`), de los PDF 2.0 del 30/10/2026.

| Rasgo | Manual de usuario -ORIGINAL.dotx | Manual Tecnico -original.docx |
|---|---|---|
| Páginas / secciones | 19 / 19 (una sección por página) | 40 / 40 |
| Márgenes de página | 0 cm en todas | 0 cm en todas |
| Cuadros de texto con posición absoluta (`wps:txbx`) | 1.138 (uno por línea de texto) | 5.004 |
| Dibujos anclados (`wp:anchor`) | 1.306 | 5.604 |
| Líneas dibujadas (`a:custGeom`, bordes de tablas) | 168 | 600 |
| Tablas reales (`w:tbl`) | **0** | **0** |
| Encabezado / pie reales (`header*.xml`, `footer*.xml`) | **No existen** | **No existen** |
| `numbering.xml` (listas) | No existe | No existe |
| Campo de tabla de contenido | No (es texto fijo con puntos) | No |
| Número de página | Texto fijo en cada página | Texto fijo |
| Estilos usados | Normal (935 párrafos) y Heading 1 (278, incluye el título repetido de cada página) | Normal (4.388) y Heading 1 (732) |
| Fuente | Liberation Serif | Liberation Serif |
| Colores | Cabecera de tabla gris (`D9D9D9`/`EDEDED`), líneas negras, resaltado amarillo | Igual |
| Imágenes | Solo el logo (`image1.png`), repetido en cada página | Igual |

**Consecuencia.** El diseño visible (título «Manual … — RehniMarket» con el logo a la derecha arriba, tablas No./Descripción/Detalle con cabecera gris, número de página centrado abajo) está «pintado» página por página. No hay flujo de texto:

- Cambiar un texto **de la misma longitud** dentro de un cuadro sí es posible.
- **Agregar** un párrafo, una fila, un paso o una sección **no es posible** sin reposicionar a mano todos los cuadros y líneas de las páginas siguientes. El texto no pasa a la página siguiente, las tablas no crecen (sus bordes son líneas sueltas) y no se crean páginas nuevas.
- La tabla de contenido y los números de página no se actualizan.
- No hay un «párrafo o tabla del mismo tipo» que copiar con `deepcopy`: cada línea es un cuadro aparte.

El manual de usuario debe crecer de 19 a unas 60–80 páginas (capturas, tablas de menús, flujos y mensajes). El técnico agrega requisitos funcionales, plataforma, despliegue y ANS, y saca el diccionario. Con estos archivos, las reglas de la sección 2 del plan (editar runs, deepcopy, conservar estilos, TOC, numeración) no se pueden cumplir.

**Fuentes editables buscadas** (disco, papelera, recuperación de OnlyOffice, historial de Git):
- `~/Documentos/mis archivos/proyecto/docs++/01_MODULO_A_DESPLIEGUE/Manual de usuario.docx` y `Manual Tecnico.docx` (06/10/2026): son DOCX reales, pero de la **versión 1.0**, con otra estructura (narrativa, sin tablas No./Descripción/Detalle).
- `~/.local/share/onlyoffice/desktopeditors/recover/…`: versiones de agosto del manual de instalación.
- Papelera: `05_Documentacion_Tecnica_y_Manuales.docx` (31/08, Word para Mac, otra estructura).
- **No apareció la fuente desde la que se exportó el PDF 2.0.**

### Opciones (necesito tu decisión antes de la fase 2)

| Opción | Qué se hace | Resultado |
|---|---|---|
| **A. Reconstruir con el mismo diseño (recomendada)** | Se crea un DOCX de flujo normal que reproduce el diseño del original: Liberation Serif, encabezado real con «Manual … — RehniMarket» y el logo a la derecha, número de página centrado en un pie real, tablas reales No./Descripción/Detalle con cabecera gris `D9D9D9` y bordes negros, mismos tamaños y espaciados. El texto 2.0 sale del original y luego se corrige y amplía. **Antes de seguir, te muestro 3 páginas lado a lado (original vs. nuevo) para que las apruebes.** | Editable en OnlyOffice, con tabla de contenido real, numeración real y espacio ilimitado. Es un archivo nuevo, pero visualmente igual al tuyo. |
| B. Editar los cuadros del original | Solo cambios que caben en el mismo espacio: quitar [COMPLETAR], corregir textos, poner los diagramas en lugar de los marcadores del técnico. | Se conserva el archivo, pero **no** se puede agregar lo que pide la fase 2 (secciones, pasos, tablas, capturas). |
| C. Me das la fuente 2.0 | Si existe el DOCX desde el que se exportó el PDF del 30/10, aplico el plan de edición tal como lo escribiste. | Ideal, si el archivo existe. |

El **Diccionario de datos** tiene el mismo problema: copiar el técnico original hereda 40 páginas de cuadros fijos. Con la opción A se arma con el mismo diseño.

---

## 1. Inventario de los documentos originales (3.1)

### 1.1 Manual de usuario (-ORIGINAL.dotx, 19 páginas)

- **Portada (pág. 1):** SENA, programa, «TRIMESTRE: SEXTO [COMPLETAR]», competencia [COMPLETAR], proyecto, criterio de evaluación 5 [COMPLETAR], «MANUAL DE USUARIO — VERSIÓN 2.0», autor [COMPLETAR], fecha 30/10/2026.
- **Tabla de contenido (pág. 2):** texto fijo; incluye la página 19 de control.
- **Secciones (todas en tablas No./Descripción/Detalle dibujadas):**
  1. Alcance (con tabla de perfiles)
  2. Requisitos de conocimiento (tabla por perfil)
  3. Requerimientos de hardware y software
  4. Política de seguridad
  5. Ingreso al sistema: 5.1 Registro de comprador, 5.2 Registro de empresa, 5.3 Inicio de sesión, 5.4 Recuperación de contraseña, 5.5 Cierre de sesión
  6. Interfaz gráfica
  7. Mapa de navegación (tabla opción | función | rol)
  8. Funciones: 8.1 a 8.14 (consultar productos, comprar, pedidos, RehniCoin, direcciones/favoritos/cuenta, reseñas/reportes, móvil, productos, pedidos y devoluciones de empresa, finanzas y tienda, empresas y usuarios, catálogo/anuncios/transportadoras, reportes y RehniCoin, liquidaciones)
  9. Mesa de ayuda
  10. Mensajes de error (tabla de 44: mensaje | dónde aparece | causa | acción)
  - Glosario, Bibliografía y Control del documento
- **Marcadores:** 50 capturas «[Captura de pantalla de …]» (Figuras 5.1–8.50), resaltadas en amarillo. 13 «[COMPLETAR …]»: portada (4), hardware (3), política, URL, y en la mesa de ayuda el responsable, el correo, el WhatsApp, el horario y la herramienta. También el autor 2.0 en el control del documento.
- **Encabezado / pie:** no hay partes reales; en cada página el título y el logo son cuadros y el número de página es texto.

### 1.2 Manual técnico (-original.docx, 40 páginas)

- **Portada** igual a la de usuario, con «MANUAL TÉCNICO — VERSIÓN 2.0».
- **Secciones:** 1 Alcance (objetivos; límites con [COMPLETAR: URL y proveedor]); 2 Descripción de procesos (remite a `docs/docs++/Requisitos-Funcionales.md`); 3 Diagramas UML; 4 Administración de usuarios; 5 Modelo relacional (enumerados y diccionario 5.1–5.37); 6 Plataforma (6.1 Instalación, 6.2 Migraciones, 6.3 Variables); 7 Código fuente (7.1 Estructura, 7.2 Relación de archivos, 7.3 Endpoints (156), 7.4 Catálogo de errores); 8 ANS («propuesta» con [COMPLETAR/validar]); 9 Limitaciones (13); Glosario, Bibliografía y Control.
- **Marcadores de imagen (15):** ver el numeral 4 de este informe. 5 [COMPLETAR].

---

## 2. Inventario del sistema (3.2)

### 2.1 Rutas web (`RehniMarket-frontend/src/routers/AppRouter.tsx`)

| Ruta | Perfil | Cómo se llega | Propósito |
|---|---|---|---|
| `/` | Todos | Logo, «Inicio» | Inicio: anuncios (Hero), categorías, ofertas especiales, novedades, «¿Tienes una empresa?» |
| `/categories` | Todos | Menú «Categorías» | Catálogo por categoría |
| `/products` | Todos | Menú «Productos», búsqueda, anuncios | Lista con filtros y orden |
| `/offers` | Todos | Menú «Ofertas», «Ver todas» de Ofertas especiales | Productos con descuento vigente |
| `/new` | Todos | Menú «Novedades», «Ver todas» | Lo más reciente |
| `/products/:id` | Todos | Tarjeta de producto | Detalle, variantes, reseñas, reportar |
| `/company/:companyId` | Todos | «Ver tienda» | Perfil público de la empresa |
| `/cart` | Visitante y comprador | Ícono carrito | Carrito |
| `/checkout` | Comprador (`RequireAuth area="user"`) | «Ir a pagar» | Pago con RehniCoin |
| `/register-user`, `/register-company` | Visitante | «Registrarse», «Registrar mi empresa» | Registro |
| `/verify-email` | Visitante | Tras registrarse o iniciar sesión sin verificar | Código de verificación |
| `/login`, `/forgot-password`, `/reset-password` | Visitante | «Iniciar sesión» | Acceso y recuperación |
| `/actualizar-certificado` | Empresa (sin sesión) | Modal «Certificado no válido», Mi tienda | Subir un nuevo certificado con correo y contraseña |
| `/user/dashboard?tab=…` | Comprador | Menú de la cuenta | Panel: home, orders, favorites, wallet, addresses, profile |
| `/company/dashboard?tab=…` | Empresa | Menú de la cuenta | Panel: home, products, orders, returns, finance, company, profile |
| `/admin/dashboard?tab=…` | Administrador y propietario | Menú de la cuenta | Panel: home, companies, users, products (Catálogo), hero (Anuncios), reports, carriers, payouts (solo propietario), wallet, account |

**Redirecciones** (`RequireAuth.tsx`, `roleAccess.ts`):
- Sin sesión en una ruta protegida → `/login`; tras iniciar sesión vuelve a la ruta pedida.
- Rol sin permiso → al «home» de su rol: administrador y propietario a `/admin/dashboard`, empresa a `/company/dashboard`, comprador a `/`.
- Tras el login, todos los roles van a `/`.
- Si la sesión no se puede renovar → `/login` con el aviso «Tu sesión ha expirado. Inicia sesión nuevamente.».

**404:** no existe ruta comodín (`*`). Una URL inexistente muestra la página en blanco. Es una función a medio hacer (numeral 3.5).

**Elementos globales:**
- Barra superior con «Iniciar sesión», «Registrarse», «Mi cuenta», «Mis favoritos» (Heart), «Mi carrito» (ShoppingCart), búsqueda (Search) con sugerencias, «Buscando…» y «No se encontraron productos».
- Menú de la cuenta (`ProfileDropdown`: accesos del panel y «Cerrar sesión», LogOut).
- Aviso inferior en celulares: «Estás usando RehniMarket en el navegador… la app para Android llegará pronto.», con «Cerrar aviso» (X).
- Pie con columnas Comprar, Vender y Soporte, y redes sociales.
- Panel: barra lateral (PanelLeft/PanelLeftClose para contraer, «Volver a la tienda» con ArrowLeft, «Cerrar sesión») y barra superior («Abrir menú de navegación» con Menu).

### 2.2 Pantallas móviles (Expo Router, `RehniMarket-mobile/src/app`)

| Ruta | Pantalla | Cómo se llega | Notas |
|---|---|---|---|
| `(auth)/login` | Iniciar sesión | Al abrir, «Iniciar sesión» en pantallas protegidas | Botón «Ingresar»; rechaza roles distintos de comprador: «Esta aplicación está disponible solo para cuentas de comprador.» |
| `(auth)/register` | Crear cuenta | «Regístrate» | «Registrarme»; casilla «Acepto los Términos y Condiciones y la Política de Privacidad» (sin enlace para leerlos) |
| `(auth)/verify-email` | Verificar correo | Tras registrarse | «Verificar correo», «¿El correo es incorrecto? Cambiar correo», reenvío |
| `(auth)/forgot-password`, `reset-password` | Recuperar / Restablecer contraseña | «¿Olvidaste tu contraseña?» | «Enviar código», «Guardar nueva contraseña» |
| `(tabs)/index` | Inicio | Pestaña «Inicio» | Banners, categorías, «Productos destacados», «Ofertas especiales», «Novedades», barra «Buscar productos...», ícono del carrito |
| `(tabs)/categories` | Categorías | Pestaña | — |
| `(tabs)/favorites`, `cart`, `profile` | Favoritos, Carrito, Perfil | Pestañas | Sin sesión muestran «Inicia sesión…» con el botón «Iniciar sesión» |
| `search` | Búsqueda | Barra de Inicio | Mínimo 2 caracteres; «Limpiar», «Volver» |
| `products/index` | Productos | «Ver todos» de Productos destacados | Filtros (Categoría, Rango de precio, Solo con descuento, Solo disponibles; «Aplicar», «Limpiar filtros») y orden (Relevancia, Menor precio, Mayor precio, Mayor descuento) |
| `offers`, `new` | Ofertas, Novedades | «Ver todos» de cada sección | — |
| `product/[id]` | Detalle | Tarjeta | «Compartir» (share), variantes, cantidad, vendedor |
| `checkout` | Checkout | «Ir a pagar» | «¡Compra confirmada!», «Ver mis pedidos», «Seguir comprando» |
| `orders/index`, `orders/[id]` | Mis pedidos, Detalle | Perfil | Filtro por estado; cancelar |
| `wallet` | RehniCoins | Perfil | «Recargar RehniCoins» → «Solicitar por WhatsApp» |
| `addresses` | Direcciones | Perfil | Agregar, editar, eliminar, «Hacer predeterminada» |
| `account` | Configuración de cuenta | Perfil (ícono settings) | Información personal, Seguridad, «Cerrar sesión» |

### 2.3 Elementos por pantalla

El detalle completo (íconos, botones, campos, títulos, estados vacíos, alertas) de los 149 archivos web y 65 móviles está en el anexo. Resumen de lo relevante para el manual:

- **Botones de solo ícono (web, lucide-react):** Heart (favorito), ShoppingCart (carrito, «Agregar»), Search, X (limpiar o cerrar), Eye («Ver detalle», «Ver usuario», «Ver empresa», «Ver anuncio»), Pencil (editar), Trash2 (eliminar), Power (activar/desactivar anuncio, categoría, transportadora), Lock/Unlock (bloquear/desbloquear usuario o empresa), Coins («Recargar RehniCoin» en Usuarios), SlidersHorizontal («Atributos y variantes»), Star («Marcar como predeterminada», imagen principal), Plus/Minus (cantidad), Download (plantillas), Upload, ChevronLeft/Right (carrusel y paginación), Menu, PanelLeft, ArrowLeft, LogOut, Eye/EyeOff (mostrar contraseña), Flag («Reportar»).
- **Formularios con validación en vivo** (`RehniMarket-frontend/src/shared/validation/`): registro de comprador y de empresa, solicitud de devolución y envío del pedido (ver 2.5).
- **Estados especiales:**
  - Cargando: Skeleton/Spinner, «Cargando…».
  - Vacío: EmptyState, por ejemplo «Tu carrito está vacío», «Aún no tienes favoritos», «Aún no has recibido pedidos».
  - Error: ErrorState, por ejemplo «No pudimos cargar tus pedidos» con «Reintentar» en el móvil.
  - Sin permiso: redirección.
  - Empresa sin verificar: insignia en Inicio y modal `CertificateRejectedModal` («Certificado no válido» / «Empresa rechazada», con el motivo, «Actualizar certificado» y «Entendido»).
  - Producto o empresa inexistente: «No encontramos este producto/esta empresa».

### 2.4 Flujos y estados

| Entidad | Estados en pantalla | Significado / transición |
|---|---|---|
| Pedido | Pendiente → Pagado → **En preparación** → Enviado → Entregado; Cancelado | Botones de la empresa: «Iniciar procesamiento», «Marcar enviado», «Marcar entregado». El comprador cancela en Pendiente o Pagado. |
| Pestañas de pedidos (empresa) | Todos, Pendientes, En proceso (= en preparación + enviados), Completados, Cancelados | + buscador por referencia, correo o nombre |
| Devolución | En revisión, Aprobada, Rechazada | Pestañas: Todas, En revisión, Aprobadas, Rechazadas, con buscador |
| Certificado de empresa | Pendiente, Aprobado, Certificado inválido, Rechazado | Filtros de Empresas: Todas, Pendientes, Certificado inválido, Rechazadas, Aprobadas |
| Insignia en Inicio de empresa | Empresa pendiente de verificación / verificada / Certificado no válido / Empresa rechazada | — |
| Liquidación | Pendiente, Procesando, Pagada, Fallida | Filtros: Todas, Pendientes, Procesando, Pagadas, Fallidas |
| Reporte | Pendiente, En revisión, Resuelto, Rechazado | Filtros por estado y por tipo (Productos/Empresas) |
| Movimiento RehniCoin | Recarga, Compra, Reembolso, Ajuste | — |
| Cuenta bancaria | Ahorros, Corriente, Nequi, Daviplata | Predeterminada |
| Usuario | Activo / Bloqueado; roles Usuario, Empresa, Administrador, Propietario | La empresa tiene «Rol protegido»; solo un propietario gestiona propietarios |

### 2.5 Mensajes visibles

| Origen | Cantidad aprox. | Dónde |
|---|---|---|
| Backend (`api_error` y middlewares) | 186 mensajes (97 códigos) | `docs/Manuales/scripts/datos/errores.json`; se muestran en alertas |
| Validación en vivo (frontend) | 21 | `RehniMarket-frontend/src/shared/validation/rules.ts`, `schemas.ts` |
| Alertas propias del frontend (éxito y error) | ~85 web + ~20 móvil | `showAlert` / `Alert.alert` (anexo) |
| Sesión | «Tu sesión ha expirado. Inicia sesión nuevamente.», «Tu cuenta se encuentra bloqueada.», «Tu empresa se encuentra suspendida.» (+ motivo) | `RehniMarket-frontend/src/api/session.ts`, `apiErrorHandler.ts` |
| Estados vacíos y de error | ~70 | anexo |

**Nota sobre los mensajes de sesión pedidos** («Token requerido», «Token expirado», «Token inválido», «Servicio temporalmente no disponible. Intenta de nuevo.»): los envía el backend (`RehniMarket-backend/app/middleware/AuthMiddleware.py`). En la web el usuario normalmente **no** los ve, porque el interceptor renueva el token y, si no puede, redirige a `/login` con «Tu sesión ha expirado. Inicia sesión nuevamente.». Propongo documentar los dos: el texto que ve el usuario y el del servidor, que aparece cuando falla otra cosa.

---

## 3. Comparación (3.3)

### 3.1 Documentado y correcto

La verificación automática de las 261 citas entre comillas del manual 2.0 contra el código encontró **256 textos idénticos** a la interfaz. Las otras 5 son cortes de línea del PDF o mensajes del backend. Son correctos los flujos de registro, verificación, inicio de sesión, recuperación, carrito, checkout, pedidos, cancelación, devolución, billetera y recarga por WhatsApp, direcciones, favoritos, reseñas, reportes, productos, variantes y descuentos, envío, finanzas y cuentas bancarias, Mi tienda, actualización de certificado, empresas, usuarios, catálogo, transportadoras, reportes, recarga y corrección, y liquidaciones, así como los 44 mensajes de error.

### 3.2 Desactualizado

| Manual 2.0 | Código actual | Archivo |
|---|---|---|
| 8.3: estado «En proceso» | Se muestra «En preparación» («En proceso» es solo una pestaña de la empresa) | `RehniMarket-frontend/src/features/orders/utils/orderStatus.ts` |
| 5.2: formulario «Crear cuenta empresarial», botón «Registrar empresa» | Al revés: título «Registrar empresa», botón «Crear cuenta empresarial» | `…/features/public/auth/pages/RegisterCompany.tsx` |
| 6 Interfaz gráfica / 7 Mapa: los paneles sin «Inicio» | Todos los paneles empiezan en «Inicio» | `RehniMarket-frontend/src/shared/config/dashboardNavigation.tsx` |
| 3 Hardware: versiones [COMPLETAR] | Chrome/Edge 111, Firefox 128, Safari 16.4 (Tailwind 4); Android 7.0, iOS 15.1 (Expo SDK 54) | `package.json` |
| 4 Seguridad: sin duración de sesión ni límite de peticiones | Access token 30 min, refresh 15 días, `localStorage` (web) / SecureStore (móvil), 100 peticiones por minuto | `RehniMarket-backend/.env.public.example`, `api/session.ts` |
| 8.12 Anuncios: no explica los tipos | 8 tipos con configuración distinta, plantillas descargables y vista previa desktop/móvil | `AdvertisementFormModal.tsx` |
| 8.9 Devoluciones: sin pestañas ni buscador | Pestañas y buscador | `features/company/components/dashboard/Returns.tsx` |
| 8.7 Móvil: solo login, compra y checkout | Además búsqueda, ofertas, novedades, recuperación, filtros y orden, compartir | `RehniMarket-mobile/src/app` |
| 9 Mesa de ayuda: [COMPLETAR] y GLPI | GitHub Issues y horario L-V 8:00–17:00 | — |

### 3.3 Existe y no está documentado

- **Paneles Inicio:**
  - Comprador: «Hola, <nombre>», Saldo RehniCoin, Pedidos pendientes, Favoritos, Último pedido y Recomendados para ti.
  - Empresa: banner, logo, insignia de verificación, indicadores y Productos recientes.
  - Administrador: Usuarios, Empresas, Usuarios recientes y Actividad reciente.
- **Ofertas (/offers) y Novedades (/new)** en web, y sus secciones en el Inicio de la web y del móvil.
- **Configuración de cuenta** de empresa y de administrador: la misma pantalla «Perfil / Cuenta / Seguridad».
- **Liquidaciones:** filtros Todas, Pendientes, Procesando, Pagadas y Fallidas.
- **Empresa:**
  - Pestañas y buscador de pedidos y devoluciones.
  - «Mostrar variantes eliminadas».
  - Imagen principal de la variante.
  - «Descargar plantilla» de logo y banner.
  - «Estado de la empresa» y «Motivo del rechazo» en Mi tienda.
  - Modal de certificado no válido o rechazado.
- **Administrador:**
  - Cambio de rol con «Rol protegido».
  - Desbloquear empresa.
  - Filtros de reportes por tipo y estado.
  - «Suspender empresa» desde un reporte.
  - Activar o desactivar categorías, atributos, anuncios y transportadoras (Power).
  - Plantillas de anuncio web y móvil.
  - «Monto (RC)» desde Usuarios.
- **Móvil:**
  - Búsqueda, filtros, orden, ofertas, novedades y compartir producto.
  - Filtro de pedidos por estado.
  - Recuperar contraseña.
  - Mensaje de rol rechazado.
  - Pantallas «Inicia sesión para…» de cada pestaña.
- **Global:**
  - Aviso «la app para Android llegará pronto».
  - Redirección tras el login a la ruta pedida.
  - «Tu sesión ha expirado…».
  - Mostrar/ocultar contraseña.
- **Mensajes:** 21 validaciones en vivo, unos 85 mensajes propios del frontend y mensajes de sesión.

### 3.4 Documentado y ya no existe

No se encontró ninguna función documentada que haya desaparecido. Solo sobran los textos de relleno «[COMPLETAR …]», «GLPI» y la referencia a `docs/docs++` del técnico (esa carpeta se borró del repo en `50b25de`).

### 3.5 Funciones a medio hacer (propuesta: no documentarlas como funcionales)

| Elemento | Situación | Propuesta |
|---|---|---|
| Pie: «Guía de vendedores», «Comisiones», «Centro de ayuda», «Términos y condiciones», «Política de privacidad» | Sin enlace (`Footer.tsx`, sin `to`) | Nota «Funcionalidad en desarrollo» en el mapa de navegación, como en 2.0 |
| Pie: redes sociales (Facebook, Instagram, YouTube, LinkedIn) | Íconos sin enlace | Igual |
| Ruta inexistente (404) | Página en blanco, sin mensaje | Mencionarlo en Mesa de ayuda («si ve una página en blanco, vuelva a Inicio») y en el anexo de limitaciones del técnico |
| Ícono de usuario en la barra superior del panel (UserCircle) | Decorativo, sin acción | No documentarlo como botón |
| Móvil: aceptar términos | Casilla sin enlace para leer los términos | Indicar que los términos se consultan en el registro web |
| Endpoints de colores (`/admin/dashboard/create-color`…) | Sin pantalla en el panel | Solo en el técnico (limitación) |
| Aviso «la app para Android llegará pronto» | Informativo | Documentarlo como aviso |
| Preguntas frecuentes y tarjetas de confianza del detalle | Texto fijo | Describirlas como información, no como función |

---

## 4. Imágenes del manual técnico

| Figura 2.0 | Lugar | PNG | Plan |
|---|---|---|---|
| 2.1 Diagrama de casos de uso | Procesos | `casos-de-uso.png` (sustituido) | Pasan a ser 3: `casos-de-uso-comprador.png`, `casos-de-uso-empresa.png`, `casos-de-uso-administrador.png` |
| 2.2 Mapa de navegación por rol | Procesos | `navegacion.png` | Insertar; verificar contra `dashboardNavigation.tsx` (ya incluye Inicio) |
| 3.1 Diagrama de clases | UML | `clases.png` | Insertar; el esquema no cambió (misma revisión de Alembic) |
| 3.2 Secuencia de compra | UML | `secuencia-compra.png` | Insertar |
| 3.3 Secuencia de inicio de sesión | UML | `secuencia-login.png` | Insertar |
| 3.4 Arquitectura | UML | `arquitectura.png` (ya regenerada con HTTPS, dos dominios y SMTP) | Insertar aquí una vez |
| 4.1 Administración de usuarios | Usuarios | — | Recuadro de captura |
| 5.1 Modelo relacional | Modelo | `modelo-relacional.png` (10103 × 7550) | Página horizontal o división por módulos |
| 5.2 Tablas en PostgreSQL | Modelo | — | Recuadro de captura |
| 6.1 Componentes de la plataforma | Plataforma | `arquitectura.png` | «ver Figura 3.4» (no se repite) |
| 6.2 Servicios en ejecución | Plataforma | — | Salida de `docker compose ps` como bloque de código |
| 6.3 Swagger en /docs | Plataforma | — | Recuadro de captura |
| 6.4 Bucket de MinIO | Plataforma | — | Recuadro de captura (o texto con `mc ls`) |
| 6.5 Instalación con Docker | Plataforma | — | Salida como bloque de código |
| 7.1 Estructura del proyecto | Código | — | Árbol de directorios como texto |
| nuevas | Plataforma | — | Recuadros: app en https://rehnimarket con certificado válido, panel de SonarCloud |

**Diagramas con PNG insertables: 9** (3 casos de uso, navegación, clases, 2 secuencias, arquitectura y modelo relacional). **Capturas pendientes del técnico: 5** (usuarios, tablas en PostgreSQL, Swagger, app con HTTPS, SonarCloud). MinIO es opcional.

---

## 5. Total estimado de capturas del manual de usuario

Criterio del plan: una por paso cuando cambia la pantalla, una general por panel y por menú, y una de ejemplo por tipo de error.

| Grupo | Web | Móvil |
|---|---|---|
| Tienda pública, ingreso y cuenta (registro, verificación, login, recuperación, certificado) | 18 | 8 |
| Comprador (Inicio, catálogo, ofertas, novedades, carrito, checkout, pedidos, devolución, billetera, direcciones, favoritos, reseñas, reportes, configuración) | 32 | 16 |
| Empresa (Inicio con estados, productos, variantes, descuentos, pedidos, envío, devoluciones, finanzas, cuentas, Mi tienda, configuración) | 30 | — |
| Administrador (Inicio, empresas, usuarios, catálogo, anuncios por tipo, reportes, transportadoras, RehniCoin, configuración) | 30 | — |
| Propietario (liquidaciones con filtros, generar, pagar, cuentas de propietario) | 6 | — |
| Ejemplos de mensajes (validación, servidor, sesión, vacío) | 8 | 2 |
| **Total** | **≈124** | **≈26** |

**Total estimado: unas 150 capturas** en el manual de usuario, más 5 en el técnico.
