# Capturas de pantalla pendientes

Generado por `docs/Manuales/scripts/generar_manuales.py`. Cada captura corresponde a un recuadro amarillo del documento: borrar el recuadro, pegar la imagen en su lugar (en línea con el texto) y conservar el pie de figura. Guardar el archivo con el nombre indicado.

Formato: PNG, ventana del navegador a 1366 × 768 o más, sin datos personales reales. Resaltar con un recuadro o una flecha roja lo que indica la columna «Qué resaltar».

## Datos de prueba que deben estar cargados

Todo se toma en el entorno local (https://rehnimarket) con el stack levantado y `RUN_SEED=true` la primera vez.

| Dato | Cómo se carga |
|---|---|
| Cuenta propietario | El seed la crea con `USER_NAME_OWNER`, `OWNER_DEFAULT` y `OWNER_PASSWORD_DEFAULT` de `RehniMarket-backend/.env`. |
| 5 empresas con productos y variantes (TechNova, GameZone, UrbanStyle, KawaiiWorld, AudioMax) | El seed las crea con el correo `<empresa>@rehnimarket.test` y la contraseña `SEED_COMPANY_PASSWORD` de `RehniMarket-backend/app/utils/seed.py`. Quedan **pendientes**: con el propietario, en Empresas, aprobar TechNova, UrbanStyle y AudioMax; marcar GameZone como «Certificado inválido» (para las figuras del certificado no válido) y dejar KawaiiWorld pendiente. |
| 4 transportadoras (Servientrega, Coordinadora, Interrapidísimo, Envía) | Las crea el seed. |
| Cuenta administrador | Registrar un comprador (por ejemplo, admin@rehnimarket.test) y, con el propietario, cambiarle el rol a Administrador en Usuarios. |
| Comprador con saldo, dirección y favoritos | Registrarse en /register-user (por ejemplo, comprador@rehnimarket.test), verificar el correo, agregar dos direcciones y tres favoritos. Con el administrador, recargar 2.000.000 RC en RehniCoin y corregir una de las recargas. |
| Pedidos en todos los estados | Con el comprador, comprar productos de TechNova en varias compras (una con productos de dos empresas). Con TechNova: dejar uno en Pendiente/Pagado, avanzar otro a En preparación, otro a Enviado (transportadora y guía) y dos a Entregado. Con el comprador, cancelar un pedido pagado. |
| Devoluciones | Con el comprador, solicitar la devolución de un producto de cada pedido entregado. Con TechNova: aprobar una y dejar otra En revisión (y rechazar una tercera, si hay). |
| Reseñas y reportes | Con el comprador, reseñar un producto entregado y reportar un producto y una empresa con una imagen de evidencia. Con el administrador, dejar un reporte En revisión y resolver otro. |
| Liquidaciones | Con TechNova, registrar una cuenta bancaria predeterminada en Finanzas. Con el propietario, generar la liquidación del mes de las entregas y marcar otra como pagada (puede requerir pedidos entregados en dos meses distintos). |
| Anuncios | Con el administrador, crear al menos tres anuncios de tipos distintos (Producto específico, Categoría y Black Friday), uno de ellos con imagen móvil. |
| Ofertas | Con TechNova, configurar un descuento vigente en dos productos. |

## Manual de usuario

### Visitante (plataforma web)

Cuenta: Visitante (sin iniciar sesión)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 5.1 Página de inicio | `fig-5-1-pagina-de-inicio.png` | / | Menú superior, anuncios del carrusel, categorías, “Ofertas especiales”, “Novedades” y la sección “¿Tienes una empresa?” | Menú superior (recuadro rojo) |
| [ ] | 5.2 Opción para registrarse | `fig-5-2-opcion-para-registrarse.png` | / | Menú superior completo | Botón “Registrarse” (flecha roja) |
| [ ] | 5.3 Registro de comprador | `fig-5-3-registro-de-comprador.png` | /register-user (formulario “Crear una cuenta”) | Campos diligenciados y un mensaje de validación en vivo visible bajo “Teléfono” | Mensaje de validación y botón “Crear cuenta” |
| [ ] | 5.4 Verificación del correo | `fig-5-4-verificacion-del-correo.png` | /verify-email (página “Verifica tu correo”) | Código digitado y contador de reenvío | Casillas del código y botón “Verificar correo” |
| [ ] | 5.5 Acceso al registro de empresa | `fig-5-5-acceso-al-registro-de-empresa.png` | / (sección “¿Tienes una empresa?”) | Sección visible con su botón | Botón “Registrar mi empresa” |
| [ ] | 5.6 Registro de empresa | `fig-5-6-registro-de-empresa.png` | /register-company (formulario “Registrar empresa”) | Datos diligenciados, NIT con su DV y el PDF adjunto | Campos “NIT” y “DV”, y el certificado adjunto |
| [ ] | 5.8 Inicio de sesión | `fig-5-8-inicio-de-sesion.png` | /login (página “Bienvenido de nuevo”) | Correo y contraseña diligenciados | Botón “Iniciar sesión” e icono del ojo |
| [ ] | 5.10 Solicitud de recuperación | `fig-5-10-solicitud-de-recuperacion.png` | /forgot-password (página “¿Olvidaste tu contraseña?”) | Correo digitado | Botón “Enviar código” |
| [ ] | 5.11 Nueva contraseña | `fig-5-11-nueva-contrasena.png` | /reset-password (página “Nueva contraseña”) | Código y nueva contraseña diligenciados | Botón “Guardar nueva contraseña” |
| [ ] | 7.2 Búsqueda de productos | `fig-7-2-busqueda-de-productos.png` | / (barra de búsqueda) | Sugerencias desplegadas para un texto como “teclado” | Barra de búsqueda y sugerencias |
| [ ] | 7.3 Filtros del catálogo | `fig-7-3-filtros-del-catalogo.png` | /products | Filtros aplicados y resultados | Panel de filtros |
| [ ] | 7.4 Detalle del producto | `fig-7-4-detalle-del-producto.png` | /products/:id | Producto con variantes y stock | Selector de variantes y stock |
| [ ] | 7.5 Perfil de la empresa | `fig-7-5-perfil-de-la-empresa.png` | /company/:companyId | Perfil público con productos y calificación | Calificación y botón “Reportar empresa” |
| [ ] | 7.6 Ofertas | `fig-7-6-ofertas.png` | /offers | Productos con descuento y el precio rebajado | Precio con descuento de una tarjeta |
| [ ] | 7.7 Novedades | `fig-7-7-novedades.png` | /new | Productos más recientes | Título de la página |
| [ ] | 9.1 Mensaje del servidor | `fig-9-1-mensaje-del-servidor.png` | /login | Alerta “Correo o contraseña incorrecta.” después de un intento fallido | Alerta (recuadro rojo) |
| [ ] | 9.2 Validación en vivo | `fig-9-2-validacion-en-vivo.png` | /register-user | Mensaje “El número de teléfono debe tener exactamente 10 dígitos.” bajo el campo | Mensaje bajo el campo |
| [ ] | 9.3 Sesión expirada | `fig-9-3-sesion-expirada.png` | /login | Aviso “Tu sesión ha expirado. Inicia sesión nuevamente.” | Aviso |
| [ ] | 9.4 Estado vacío | `fig-9-4-estado-vacio.png` | /cart | Mensaje “Tu carrito está vacío” | Mensaje del estado vacío |

### Comprador (plataforma web)

Cuenta: Comprador — cuenta de prueba registrada en /register-user (ej. comprador@rehnimarket.test)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 5.9 Menú de la cuenta | `fig-5-9-menu-de-la-cuenta.png` | / (sesión iniciada) | Menú de la cuenta desplegado con nombre, correo y rol | Menú desplegado (recuadro rojo) |
| [ ] | 5.12 Cierre de sesión | `fig-5-12-cierre-de-sesion.png` | /user/dashboard (menú lateral) | Menú lateral completo del panel | Opción “Cerrar sesión” al final del menú |
| [ ] | 6.2 Elementos de la interfaz | `fig-6-2-elementos-de-la-interfaz.png` | /user/dashboard | Panel con el menú lateral, la barra superior, el contenido y una alerta de éxito visible | Menú lateral, barra superior y alerta (recuadros rojos) |
| [ ] | 6.3 Menú de la tienda | `fig-6-3-menu-de-la-tienda.png` | / | Menú superior con todas sus opciones visibles, incluidas “Ofertas” y “Novedades” | Opciones del menú y los iconos de búsqueda, favoritos y carrito |
| [ ] | 6.4 Menú del panel del comprador | `fig-6-4-menu-del-panel-del-comprador.png` | /user/dashboard | Menú lateral expandido con todas las opciones | Opciones del menú lateral |
| [ ] | 7.1 Panel Inicio del comprador | `fig-7-1-panel-inicio-del-comprador.png` | /user/dashboard | Saldo, pedidos pendientes, favoritos, último pedido y recomendados con datos | Indicadores superiores |
| [ ] | 7.8 Agregar al carrito | `fig-7-8-agregar-al-carrito.png` | /products/:id | Variante y cantidad seleccionadas | Botones “Agregar al carrito” y “Comprar ahora” |
| [ ] | 7.9 Carrito de compras | `fig-7-9-carrito-de-compras.png` | /cart | Productos y resumen | Botón “Ir a pagar” |
| [ ] | 7.10 Dirección de envío | `fig-7-10-direccion-de-envio.png` | /checkout (ventana “Dirección de entrega”) | Direcciones registradas y una seleccionada | Botón “Continuar” |
| [ ] | 7.11 Resumen de la compra | `fig-7-11-resumen-de-la-compra.png` | /checkout | Resumen con subtotal, IVA, total y saldo | Botón “Confirmar compra” |
| [ ] | 7.12 Compra confirmada | `fig-7-12-compra-confirmada.png` | /checkout | Mensaje “¡Tu compra fue confirmada!” | Mensaje de confirmación |
| [ ] | 7.13 Lista de pedidos | `fig-7-13-lista-de-pedidos.png` | /user/dashboard?tab=orders | Lista de pedidos con estados distintos | Botón “Ver detalle” |
| [ ] | 7.14 Detalle del pedido | `fig-7-14-detalle-del-pedido.png` | /user/dashboard?tab=orders (ventana del pedido) | Línea de estados y productos | Línea de estados |
| [ ] | 7.15 Seguimiento del envío | `fig-7-15-seguimiento-del-envio.png` | /user/dashboard?tab=orders (pedido “Enviado”) | Transportadora y número de guía | Botón “Consultar seguimiento” |
| [ ] | 7.16 Cancelación del pedido | `fig-7-16-cancelacion-del-pedido.png` | /user/dashboard?tab=orders (pedido “Pagado”) | Confirmación de cancelación abierta | Botón “Cancelar pedido” |
| [ ] | 7.17 Solicitud de devolución | `fig-7-17-solicitud-de-devolucion.png` | /user/dashboard?tab=orders (pedido “Entregado”) | Formulario “Solicitar devolución” con el motivo | Campo del motivo y botón “Enviar solicitud” |
| [ ] | 7.18 Billetera RehniCoin | `fig-7-18-billetera-rehnicoin.png` | /user/dashboard?tab=wallet | Saldo y movimientos de varios tipos | Saldo disponible |
| [ ] | 7.19 Solicitud de recarga | `fig-7-19-solicitud-de-recarga.png` | /user/dashboard?tab=wallet (ventana “Recargar RehniCoins”) | Una cantidad seleccionada | Botón “Confirmar solicitud” |
| [ ] | 7.20 Direcciones | `fig-7-20-direcciones.png` | /user/dashboard?tab=addresses | Formulario de dirección diligenciado | Botón “Guardar dirección” |
| [ ] | 7.21 Favoritos | `fig-7-21-favoritos.png` | /user/dashboard?tab=favorites | Productos guardados | Botón “Quitar de favoritos” |
| [ ] | 7.22 Configuración de cuenta | `fig-7-22-configuracion-de-cuenta.png` | /user/dashboard?tab=profile | Secciones “Perfil”, “Cuenta” y “Seguridad” | Botones “Editar perfil”, “Editar correo” y “Cambiar contraseña” |
| [ ] | 7.23 Reseña del producto | `fig-7-23-resena-del-producto.png` | /products/:id (sección “Opiniones de compradores”) | Formulario de reseña con la calificación | Estrellas y botón “Enviar reseña” |
| [ ] | 7.24 Reporte de producto | `fig-7-24-reporte-de-producto.png` | /products/:id (ventana de reporte) | Motivo y una evidencia cargada | Botón “Enviar reporte” |

### Empresa (plataforma web)

Cuenta: Empresa — TechNova, technova@rehnimarket.test (seed, certificado aprobado)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 6.5 Menú del panel de empresa | `fig-6-5-menu-del-panel-de-empresa.png` | /company/dashboard | Menú lateral expandido con todas las opciones | Opciones del menú lateral |
| [ ] | 7.25 Panel Inicio de la empresa | `fig-7-25-panel-inicio-de-la-empresa.png` | /company/dashboard | Etiqueta “Empresa verificada”, indicadores y productos recientes | Etiqueta de verificación e indicadores |
| [ ] | 7.26 Nuevo producto | `fig-7-26-nuevo-producto.png` | /company/dashboard?tab=products (formulario “Crear nuevo producto”) | Datos diligenciados | Botón “Crear y agregar variantes” |
| [ ] | 7.27 Generación de variantes | `fig-7-27-generacion-de-variantes.png` | /company/dashboard?tab=products (ventana “Generar combinaciones”) | Ejes seleccionados y combinaciones listadas | Botón “Crear seleccionadas” |
| [ ] | 7.28 Variante | `fig-7-28-variante.png` | /company/dashboard?tab=products (ventana “Agregar variante”) | Precio, stock e imágenes con una marcada como “Principal” | Estrella “Principal” |
| [ ] | 7.29 Descuento | `fig-7-29-descuento.png` | /company/dashboard?tab=products (edición del producto) | Descuento diligenciado | Campos de descuento |
| [ ] | 7.30 Lista de productos | `fig-7-30-lista-de-productos.png` | /company/dashboard?tab=products | Lista con productos activos, inactivos y agotados | Acciones de una fila |
| [ ] | 7.31 Pedidos de la empresa | `fig-7-31-pedidos-de-la-empresa.png` | /company/dashboard?tab=orders | Pestañas y lista de pedidos | Pestañas y buscador |
| [ ] | 7.32 Información de envío | `fig-7-32-informacion-de-envio.png` | /company/dashboard?tab=orders (detalle del pedido) | Transportadora y número de guía diligenciados | Botón “Guardar información de envío” |
| [ ] | 7.33 Cambio de estado | `fig-7-33-cambio-de-estado.png` | /company/dashboard?tab=orders (pedido “Pagado”) | Detalle del pedido con el botón de avance | Botón “Iniciar procesamiento” |
| [ ] | 7.34 Pestañas de devoluciones | `fig-7-34-pestanas-de-devoluciones.png` | /company/dashboard?tab=returns | Pestañas “Todas”, “En revisión”, “Aprobadas” y “Rechazadas” con solicitudes | Pestañas |
| [ ] | 7.35 Resolución de devolución | `fig-7-35-resolucion-de-devolucion.png` | /company/dashboard?tab=returns (detalle) | Solicitud “En revisión” con el motivo del comprador | Botones “Aprobar devolución” y “Rechazar devolución” |
| [ ] | 7.36 Resumen financiero | `fig-7-36-resumen-financiero.png` | /company/dashboard?tab=finance | Resumen con valores | Indicadores del resumen |
| [ ] | 7.37 Cuenta bancaria | `fig-7-37-cuenta-bancaria.png` | /company/dashboard?tab=finance (formulario de cuenta) | Datos diligenciados | Casilla “Cuenta predeterminada” |
| [ ] | 7.38 Mi tienda | `fig-7-38-mi-tienda.png` | /company/dashboard?tab=company | Logo, banner, información y estado de la empresa | Botones “Descargar plantilla” y “Editar” |
| [ ] | 7.40 Configuración de cuenta de la empresa | `fig-7-40-configuracion-de-cuenta-de-la-empresa.png` | /company/dashboard?tab=profile | Secciones “Perfil”, “Cuenta” y “Seguridad” | Botón “Editar perfil” |

### Empresa con certificado no válido (plataforma web)

Cuenta: Empresa con certificado marcado como inválido (ej. GameZone, gamezone@rehnimarket.test); Empresa con certificado marcado como inválido (sin sesión)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 5.7 Certificado no válido | `fig-5-7-certificado-no-valido.png` | /login (ventana “Certificado no válido”) | Ventana abierta después de intentar iniciar sesión con una empresa cuyo certificado fue marcado como inválido, con el motivo visible | Botón “Actualizar certificado” |
| [ ] | 7.39 Actualización del certificado | `fig-7-39-actualizacion-del-certificado.png` | /actualizar-certificado | Correo, contraseña y PDF seleccionado | Campo “Nuevo certificado” |

### Administrador (plataforma web)

Cuenta: Administrador — cuenta de prueba con rol admin (asignado por el propietario)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 7.41 Panel Inicio del administrador | `fig-7-41-panel-inicio-del-administrador.png` | /admin/dashboard | Indicadores de usuarios y empresas, usuarios recientes y actividad reciente | Indicadores superiores |
| [ ] | 7.42 Empresas | `fig-7-42-empresas.png` | /admin/dashboard?tab=companies | Filtros y lista con empresas en distintos estados | Filtro de certificado y botón “Ver empresa” |
| [ ] | 7.43 Revisión del certificado | `fig-7-43-revision-del-certificado.png` | /admin/dashboard?tab=companies (ventana “Revisar certificado”) | Opciones y motivo diligenciado | Opciones de la decisión |
| [ ] | 7.44 Suspensión de empresa | `fig-7-44-suspension-de-empresa.png` | /admin/dashboard?tab=companies (ventana “¿Suspender la empresa…?”) | Motivo diligenciado | Botón “Suspender empresa” |
| [ ] | 7.45 Usuarios | `fig-7-45-usuarios.png` | /admin/dashboard?tab=users (ventana “Detalle de usuario”) | Detalle en modo edición con el cambio de rol | Campo “Cambio de rol” y botón “Guardar cambios” |
| [ ] | 7.46 Atributos de categoría | `fig-7-46-atributos-de-categoria.png` | /admin/dashboard?tab=products (ventana “Atributos y variantes”) | Atributos de una categoría con sus opciones | Botón “Agregar” |
| [ ] | 7.47 Transportadoras | `fig-7-47-transportadoras.png` | /admin/dashboard?tab=carriers | Lista y formulario de transportadora | Botón “Nueva transportadora” |
| [ ] | 7.48 Tipos de anuncio | `fig-7-48-tipos-de-anuncio.png` | /admin/dashboard?tab=hero (ventana “Nuevo anuncio”) | “Tipo de anuncio” desplegado y una imagen cargada | Lista “Tipo de anuncio” |
| [ ] | 7.49 Vista previa del anuncio | `fig-7-49-vista-previa-del-anuncio.png` | /admin/dashboard?tab=hero (ventana “Vista previa del anuncio”) | Vista “Desktop / tablet” y “Móvil” | Las dos vistas |
| [ ] | 7.50 Detalle del reporte | `fig-7-50-detalle-del-reporte.png` | /admin/dashboard?tab=reports (ventana “Detalle del reporte”) | Reporte con evidencias y acciones | Botones “Marcar en revisión”, “Resolver” y “Rechazar” |
| [ ] | 7.51 Recarga de RehniCoin | `fig-7-51-recarga-de-rehnicoin.png` | /admin/dashboard?tab=wallet | Formulario diligenciado y “Últimas recargas” | Botón “Recargar saldo” |
| [ ] | 7.52 Corrección de recarga | `fig-7-52-correccion-de-recarga.png` | /admin/dashboard?tab=wallet (ventana “Corregir recarga”) | Nueva cantidad y motivo | Campo “Nueva cantidad correcta (RC)” |
| [ ] | 7.56 Configuración de cuenta del administrador | `fig-7-56-configuracion-de-cuenta-del-administrador.png` | /admin/dashboard?tab=account | Secciones “Perfil”, “Cuenta” y “Seguridad” | Botón “Cambiar contraseña” |

### Propietario (plataforma web)

Cuenta: Propietario — cuenta owner del seed (OWNER_DEFAULT)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 6.6 Menú del panel administrativo | `fig-6-6-menu-del-panel-administrativo.png` | /admin/dashboard | Menú lateral expandido con “Liquidaciones” visible | Opciones del menú lateral y “Liquidaciones” |
| [ ] | 7.53 Filtros de liquidaciones | `fig-7-53-filtros-de-liquidaciones.png` | /admin/dashboard?tab=payouts | Filtros y lista de liquidaciones | Filtros “Todas”, “Pendientes”, “Procesando”, “Pagadas” y “Fallidas” |
| [ ] | 7.54 Generación de liquidación | `fig-7-54-generacion-de-liquidacion.png` | /admin/dashboard?tab=payouts (ventana “Generar liquidación”) | Vista previa calculada | Vista previa y botón “Generar liquidación” |
| [ ] | 7.55 Pago de liquidación | `fig-7-55-pago-de-liquidacion.png` | /admin/dashboard?tab=payouts (ventana “Marcar liquidación como pagada”) | Valor y cuenta destino | Botón “Confirmar pago” |

Carpeta: `docs/Manuales/capturas/usuario/`

## Manual técnico

### Propietario (plataforma web)

Cuenta: Propietario — cuenta owner del seed (OWNER_DEFAULT)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 4.1 Administración de usuarios | `fig-4-1-administracion-de-usuarios.png` | https://<dominio>/admin/dashboard?tab=users | Lista de usuarios con roles distintos y la ventana “Detalle de usuario” abierta | Columna “Rol” y acciones de la fila |

### Equipo local con la CA de Caddy instalada (sin iniciar sesión) (plataforma web)

Cuenta: Equipo local con la CA de Caddy instalada (sin iniciar sesión)

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 6.1 Aplicación con HTTPS | `fig-6-1-aplicacion-con-https.png` | https://rehnimarket | Página de inicio abierta en el navegador con el candado de conexión segura y el certificado de la CA local de Caddy reconocido como válido | Candado y detalle del certificado |
| [ ] | 7.1 Documentación de la API | `fig-7-1-documentacion-de-la-api.png` | https://api.rehnimarket/docs | Swagger UI con DOCS_ENABLED=true y los grupos de endpoints desplegados | Título “RehniMarket API 2.6.0” y la lista de grupos |

### Cuenta con acceso al proyecto en SonarCloud (plataforma web)

Cuenta: Cuenta con acceso al proyecto en SonarCloud

| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |
|---|---|---|---|---|---|
| [ ] | 6.2 Panel de SonarCloud | `fig-6-2-panel-de-sonarcloud.png` | https://sonarcloud.io (proyecto RehniMarket) | Resumen del último análisis de develop con el quality gate y las métricas de confiabilidad, seguridad y mantenibilidad | Estado del quality gate |

Carpeta: `docs/Manuales/capturas/tecnico/`
