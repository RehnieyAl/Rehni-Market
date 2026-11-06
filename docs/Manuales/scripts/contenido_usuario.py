"""Contenido del Manual de usuario de RehniMarket.

Cada sección es (nivel, número, título, bloques). Los bloques se describen en
docx_base.pintar_bloques. Redacción: voz pasiva para describir y modo
imperativo (infinitivo) para las instrucciones.
"""

from datos_comunes import SOPORTE


def P(t): return ("p", t)
def SUB(t): return ("sub", t)
def PASO(n, titulo, texto=""): return ("paso", n, titulo, texto)
def UL(*items): return ("ul", list(items))
def OL(*items): return ("ol", list(items))
def NOTA(t): return ("nota", t)
def TABLA(enc, filas, anchos=None): return ("tabla", enc, filas, anchos)
def IMG(ruta, titulo): return ("img", ruta, titulo)
def CAP(pantalla, estado, archivo, titulo): return ("captura", pantalla, estado, archivo, titulo)


INTRO = [
    P("Este manual sigue la estructura de la guía FAVA-SENA «Manuales técnicos de la aplicación». "
      "Cada elemento se presenta en una tabla No. / Descripción / Detalle y las funciones se explican "
      "paso a paso por perfil de usuario."),
]

SECCIONES = [
    # ------------------------------------------------------------------ 1
    (1, "1", "Alcance", [
        P("En este manual se describe la funcionalidad de RehniMarket, un marketplace que conecta a "
          "compradores con empresas vendedoras mediante una aplicación web y una aplicación móvil. Las "
          "compras se pagan con RehniCoin, el saldo interno de la plataforma (1 RehniCoin equivale a "
          "1 peso colombiano)."),
        P("Se documentan el registro, el ingreso, la navegación, las funciones de cada perfil y los "
          "mensajes de error. Para el correcto uso de la aplicación se deben seguir cuidadosamente los "
          "pasos de cada opción."),
        TABLA(["Perfil", "Rol en el sistema", "Canal disponible"], [
            ["Visitante", "Sin cuenta", "Web y móvil (consulta)"],
            ["Comprador", "user", "Web y móvil"],
            ["Empresa (vendedor)", "company", "Solo web"],
            ["Administrador", "admin", "Solo web"],
            ["Administrador — subperfil Propietario", "owner", "Solo web"],
        ], [5.0, 3.0, 3.8]),
        P("El **Propietario** se trata en este manual como un subperfil del Administrador: usa el mismo "
          "panel administrativo y suma la opción «Liquidaciones» y la gestión de cuentas de propietario."),
        SUB("Contacto de soporte"),
        P("Si el comportamiento del sistema no es el descrito en este manual, comunicarse con la mesa de "
          "ayuda:"),
        TABLA(["Canal", "Dato"], [
            ["Correo electrónico", SOPORTE["correo"]],
            ["Reporte de fallas", SOPORTE["issues"]],
            ["WhatsApp", SOPORTE["whatsapp"]],
            ["Horario", SOPORTE["horario"]],
        ], [3.5, 8.3]),
        P("Los casos en los que se debe acudir a la mesa de ayuda se describen en el numeral 8."),
    ]),

    # ------------------------------------------------------------------ 2
    (1, "2", "Requisitos de conocimiento para manejar el sistema", [
        TABLA(["Perfil", "Conocimientos requeridos"], [
            ["Visitante y comprador", "Uso básico de navegadores o de aplicaciones móviles, y manejo de "
             "correo electrónico para recibir códigos."],
            ["Empresa (vendedor)", "Lo anterior, más manejo de archivos PDF e imágenes, y conocimientos "
             "básicos de inventario, precios y envíos."],
            ["Administrador y propietario", "Informática básica, conocimiento de las políticas de la "
             "plataforma y de los procesos de verificación de empresas, recargas y liquidaciones."],
        ], [4.0, 7.8]),
        P("Todos los perfiles deben conocer la política de seguridad descrita en el numeral 4."),
    ]),

    # ------------------------------------------------------------------ 3
    (1, "3", "Requerimientos de hardware y software", [
        P("Estos requerimientos aplican al equipo del usuario (cliente) y no al servidor. Los requisitos "
          "del servidor se describen en el Manual técnico."),
        SUB("Aplicación web"),
        TABLA(["Elemento", "Mínimo", "Recomendado"], [
            ["Procesador", "Doble núcleo de 1,6 GHz", "Cuatro núcleos de 2,0 GHz o superior"],
            ["Memoria RAM", "4 GB", "8 GB"],
            ["Pantalla", "1366 × 768 (también funciona en celulares y tabletas)", "1920 × 1080"],
            ["Conexión a internet", "5 Mbps", "10 Mbps o superior"],
            ["Sistema operativo", "Windows 10, macOS 12, una distribución Linux actual, Android 10 o iOS 16.4",
             "La versión más reciente del sistema"],
            ["Navegador", "Chrome 111, Edge 111, Firefox 128 o Safari 16.4",
             "La versión más reciente de Chrome, Edge, Firefox o Safari"],
            ["Otros", "Lector de PDF. Empresas: certificado de Cámara de Comercio en PDF de máximo 5 MB",
             "WhatsApp para solicitar recargas"],
        ], [3.0, 4.6, 4.2]),
        P("Las versiones mínimas de los navegadores corresponden a las que exige Tailwind CSS 4, con el que "
          "se construyó la interfaz web; en versiones anteriores la página puede verse incompleta."),
        SUB("Aplicación móvil"),
        TABLA(["Elemento", "Mínimo", "Recomendado"], [
            ["Sistema operativo", "Android 7.0 (API 24) o iOS 15.1", "Android 13 o iOS 17 o superior"],
            ["Memoria RAM", "3 GB", "4 GB o más"],
            ["Almacenamiento libre", "200 MB", "500 MB"],
            ["Conexión", "Datos móviles o Wi-Fi", "Wi-Fi o 4G"],
            ["Otros", "WhatsApp para solicitar recargas", "—"],
        ], [3.0, 4.6, 4.2]),
        P("Las versiones mínimas de Android e iOS son las de Expo SDK 54, la versión con la que se "
          "construyó la aplicación móvil."),
    ]),

    # ------------------------------------------------------------------ 4
    (1, "4", "Política de seguridad", [
        P("Antes de ingresar al sistema se deben leer y aceptar los términos y condiciones que se muestran "
          "en el registro. Su incumplimiento puede llevar al bloqueo de la cuenta o a la suspensión de la "
          "empresa."),
        SUB("Contraseñas"),
        OL("La contraseña debe tener mínimo 8 caracteres, con al menos una letra mayúscula, una letra "
           "minúscula y un número. Los formularios validan estas reglas mientras se escribe.",
           "No compartir la contraseña ni los códigos enviados al correo.",
           "Las contraseñas se guardan cifradas: ni siquiera un administrador puede consultarlas."),
        SUB("Códigos enviados al correo"),
        OL("El código de verificación de correo vence a los **5 minutos**.",
           "El código de recuperación de contraseña vence a los **15 minutos**.",
           "Para solicitar un código nuevo se deben esperar **60 segundos**. Solo el último código "
           "enviado es válido."),
        SUB("Sesión"),
        OL("Al iniciar sesión se entregan dos credenciales: un **access token**, válido por **30 minutos**, "
           "y un **refresh token**, válido por **15 días**. Mientras el refresh token esté vigente, la "
           "sesión se renueva sola sin volver a pedir la contraseña.",
           "En la web la sesión queda guardada en el navegador (almacenamiento local) hasta que se cierra; "
           "en el celular, en el almacenamiento seguro del dispositivo. Por eso se debe oprimir «Cerrar "
           "sesión» al usar un equipo compartido.",
           "El servidor limita el número de peticiones por dirección IP (100 por minuto en producción). "
           "Al superarlo se muestra «Demasiadas solicitudes. Intenta nuevamente más tarde.».",
           "Toda la comunicación viaja cifrada por HTTPS.",
           "Cada cuenta solo puede acceder a las funciones de su rol; las demás opciones no se muestran o "
           "responden con un mensaje de permiso."),
        SUB("Recargas"),
        P("Solicitar recargas de RehniCoin únicamente por el canal oficial de WhatsApp. Ningún "
          "administrador pide contraseñas ni códigos para acreditar una recarga."),
    ]),

    # ------------------------------------------------------------------ 5
    (1, "5", "Ingreso al sistema", [
        P(f"La aplicación web se abre en {SOPORTE['url_produccion']}. Al digitar la dirección se muestra "
          "la página de inicio de la tienda. Para las funciones personales se debe tener una cuenta con el "
          "correo verificado."),
        CAP("Página de inicio de la tienda (/)", "con el menú superior, los anuncios, las categorías y "
            "las secciones de ofertas y novedades", "u-inicio-tienda.png", "Página de inicio"),
    ]),
    (2, "5.1", "Registro de comprador", [
        PASO(1, "Abrir el formulario.", "Oprimir «Registrarse» en el menú superior."),
        CAP("Menú superior de la página de inicio", "con el botón «Registrarse» señalado",
            "u-menu-registrarse.png", "Opción para registrarse"),
        PASO(2, "Diligenciar los datos.",
             "Ingresar «Nombre completo», «Teléfono», «Correo electrónico», «Contraseña» y «Confirmar "
             "contraseña». Aceptar los términos y oprimir «Crear cuenta». Cada campo se valida mientras se "
             "escribe: el nombre debe tener entre 3 y 60 caracteres, el teléfono exactamente 10 dígitos y "
             "la contraseña cumplir las reglas del numeral 4."),
        CAP("Formulario «Crear una cuenta» (/register-user)", "con los campos diligenciados y un mensaje de "
            "validación en vivo visible", "u-registro-comprador.png", "Registro de comprador"),
        PASO(3, "Verificar el correo.",
             "Ingresar el código de 6 dígitos recibido y oprimir «Verificar correo». Si no llega, oprimir "
             "«Reenviar código» (disponible a los 60 segundos). Para corregir la dirección, oprimir «¿El "
             "correo es incorrecto? Cambiarlo»."),
        CAP("Página «Verifica tu correo» (/verify-email)", "con el código digitado y el contador de reenvío",
            "u-verificar-correo.png", "Verificación del correo"),
    ]),
    (2, "5.2", "Registro de empresa", [
        PASO(1, "Abrir el formulario.",
             "Oprimir «Registrar mi empresa» en la sección «¿Tienes una empresa?» de la página de inicio, o "
             "«Registra tu empresa» en el pie de página."),
        CAP("Sección «¿Tienes una empresa?» de la página de inicio", "con el botón «Registrar mi empresa»",
            "u-acceso-registro-empresa.png", "Acceso al registro de empresa"),
        PASO(2, "Diligenciar los datos.",
             "Completar los datos del representante (nombre, teléfono, correo y contraseña) y los «Datos de "
             "la empresa»: «Nombre de la empresa» (3 a 50 caracteres), «Dirección» (mínimo 5 caracteres), "
             "«NIT» (solo números, mínimo 5 dígitos) y «DV» (un dígito). El formulario calcula el dígito de "
             "verificación y avisa si no coincide con el NIT. Adjuntar el «Certificado de Cámara de "
             "Comercio» en PDF de máximo 5 MB, aceptar los términos y oprimir «Registrar empresa»."),
        CAP("Formulario «Crear cuenta empresarial» (/register-company)", "con los datos, el NIT con su DV y "
            "el PDF adjunto", "u-registro-empresa.png", "Registro de empresa"),
        PASO(3, "Esperar la aprobación.",
             "Verificar el correo como en el numeral 5.1. Después, un administrador revisa el certificado. "
             "Mientras tanto se puede iniciar sesión y consultar el estado en el panel «Inicio» de la "
             "empresa (numeral 7.2.1), pero las demás opciones del panel quedan bloqueadas."),
    ]),
    (2, "5.3", "Inicio de sesión", [
        PASO(1, "Ingresar los datos.",
             "Oprimir «Iniciar sesión», digitar «Correo electrónico» y «Contraseña», y oprimir el botón "
             "«Iniciar sesión»."),
        CAP("Formulario de inicio de sesión (/login)", "con correo y contraseña diligenciados",
            "u-login.png", "Inicio de sesión"),
        PASO(2, "Comprobar el ingreso.",
             "Todos los perfiles llegan a la tienda. Oprimir el icono de la cuenta en el menú superior: se "
             "despliega el menú con «Inicio» y los accesos principales del panel del perfil, la "
             "configuración de la cuenta y «Cerrar sesión»."),
        CAP("Menú superior con la sesión iniciada", "con el menú de la cuenta desplegado",
            "u-menu-cuenta.png", "Menú de la cuenta"),
        TABLA(["Perfil", "Panel", "Accesos del menú de la cuenta"], [
            ["Comprador", "/user/dashboard", "Inicio, Mis pedidos, Favoritos, RehniCoins"],
            ["Empresa", "/company/dashboard", "Inicio, Productos, Pedidos, Finanzas, Mi tienda"],
            ["Administrador", "/admin/dashboard", "Inicio, Empresas, Usuarios, Catálogo"],
            ["Administrador — Propietario", "/admin/dashboard", "Los del administrador y Liquidaciones"],
        ], [3.6, 3.4, 4.8]),
        P("En la aplicación móvil solo pueden ingresar compradores; una cuenta de otro perfil es rechazada "
          "al iniciar sesión."),
    ]),
    (2, "5.4", "Recuperación de contraseña", [
        PASO(1, "Solicitar el código.",
             "En el inicio de sesión oprimir «¿Olvidaste tu contraseña?», ingresar el correo y oprimir "
             "«Enviar código». El código vence a los 15 minutos."),
        CAP("Página «¿Olvidaste tu contraseña?» (/forgot-password)", "con el correo digitado",
            "u-olvide-contrasena.png", "Solicitud de recuperación"),
        PASO(2, "Crear la contraseña.",
             "Ingresar el «Código de 6 dígitos», la «Nueva contraseña» y «Confirmar contraseña». Oprimir "
             "«Guardar nueva contraseña»."),
        CAP("Página de restablecimiento (/reset-password)", "con el código y la nueva contraseña",
            "u-restablecer-contrasena.png", "Nueva contraseña"),
        P("En la aplicación móvil el proceso es el mismo: oprimir «¿Olvidaste tu contraseña?» en la pantalla "
          "de ingreso (numeral 7.1.8)."),
    ]),
    (2, "5.5", "Cierre de sesión", [
        P("Abrir el menú de la cuenta y oprimir «Cerrar sesión». En los paneles, esta opción aparece al "
          "final del menú lateral. En el celular se encuentra en «Perfil». Al cerrar sesión se borran del "
          "equipo las credenciales guardadas."),
        CAP("Menú lateral de un panel", "con la opción «Cerrar sesión» al final", "u-cerrar-sesion.png",
            "Cierre de sesión"),
    ]),

    # ------------------------------------------------------------------ 6
    (1, "6", "Mapa de navegación", [
        P("La navegación se divide en la tienda pública y un panel por perfil. Cada panel abre en la opción "
          "«Inicio», que resume el estado de la cuenta. Para acceder a cada opción se deben tener los "
          "permisos correspondientes; de lo contrario, el sistema no permite el acceso."),
        IMG("diagramas/png/navegacion.png", "Mapa de navegación por perfil"),
    ]),
    (2, "6.1", "Interfaz gráfica", [
        P("La aplicación web fue desarrollada con React y la móvil con Expo y React Native. La interfaz "
          "hace uso de formularios, listas de selección, botones, pestañas, ventanas emergentes y alertas."),
        UL("**Menú superior (tienda):** «Inicio», «Categorías», «Productos», «Ofertas» y «Novedades»; "
           "búsqueda, favoritos, carrito y cuenta.",
           "**Menú lateral (paneles):** las opciones de cada perfil, con «Inicio» en primer lugar. En "
           "pantallas pequeñas se abre con «Abrir menú de navegación».",
           "**Formularios:** validan cada campo mientras se escribe y terminan con un botón para enviar.",
           "**Ventanas emergentes:** muestran detalles y piden confirmación.",
           "**Alertas:** informan el resultado de cada operación.",
           "**Paginación:** permite recorrer las listas con «Anterior» y «Siguiente».",
           "**Barra inferior (móvil):** «Inicio», «Categorías», «Favoritos», «Carrito» y «Perfil»."),
    ]),
    (2, "6.2", "Opciones de la tienda", [
        TABLA(["Opción", "Función", "Perfil"], [
            ["Inicio", "Muestra anuncios, categorías, ofertas y novedades", "Todos"],
            ["Categorías", "Explora el catálogo por categoría", "Todos"],
            ["Productos", "Lista los productos con filtros", "Todos"],
            ["Ofertas", "Productos con descuento vigente (/offers)", "Todos"],
            ["Novedades", "Productos más recientes (/new)", "Todos"],
            ["Buscar", "Busca productos, marcas o categorías", "Todos"],
            ["Mis favoritos (icono)", "Abre los favoritos", "Comprador"],
            ["Mi carrito (icono)", "Abre el carrito", "Visitante y comprador"],
            ["Iniciar sesión / Registrarse", "Dan acceso a la cuenta", "Visitante"],
        ], [3.6, 5.6, 2.6]),
        P("Funcionalidad en desarrollo: en el pie de página, «Guía de vendedores», «Comisiones», «Centro de "
          "ayuda», «Términos y condiciones» y «Política de privacidad» aún no tienen destino."),
        CAP("Menú superior de la tienda", "con todas sus opciones visibles, incluidas «Ofertas» y "
            "«Novedades»", "u-menu-tienda.png", "Menú de la tienda"),
    ]),
    (2, "6.3", "Opciones de los paneles", [
        TABLA(["Panel", "Opciones del menú lateral (en orden)"], [
            ["Comprador (/user/dashboard)", "Inicio · Mis pedidos · Favoritos · RehniCoins · Direcciones · "
             "Configuración de cuenta"],
            ["Empresa (/company/dashboard)", "Inicio · Productos · Pedidos · Devoluciones · Finanzas · "
             "Mi tienda · Configuración de cuenta"],
            ["Administrador (/admin/dashboard)", "Inicio · Empresas · Usuarios · Catálogo · Anuncios · "
             "Reportes · Transportadoras · RehniCoin · Configuración de cuenta"],
            ["Administrador — subperfil Propietario", "Las mismas del administrador, más «Liquidaciones» "
             "(antes de «RehniCoin»)"],
        ], [4.2, 7.6]),
        P("Todos los paneles incluyen «Volver a la tienda» y «Cerrar sesión». En la aplicación móvil, desde "
          "«Perfil» se accede a «Mis pedidos», «Favoritos», «RehniCoin», «Mis direcciones», «Configuración "
          "de cuenta» y «Cerrar sesión»."),
        CAP("Aplicación móvil", "con la barra inferior de navegación", "u-movil-barra.png",
            "Barra de navegación móvil"),
    ]),

    # ------------------------------------------------------------------ 7
    (1, "7", "Descripción de las funciones del sistema", [
        P("A continuación se describen las funciones por perfil de usuario: comprador (7.1), empresa "
          "(7.2) y administrador con su subperfil propietario (7.3)."),
    ]),
    (2, "7.1", "Comprador (y visitante)", []),
    (3, "7.1.1", "Panel Inicio del comprador", [
        P("Al abrir el panel del comprador se muestra «Inicio» con el saludo «Hola, <nombre>» y un resumen de "
          "la cuenta:"),
        UL("**Saldo RehniCoin:** saldo disponible.",
           "**Pedidos pendientes:** pedidos en curso.",
           "**Favoritos:** cantidad de productos guardados.",
           "**Último pedido:** la compra más reciente, con acceso a su detalle.",
           "**Recomendados para ti:** productos sugeridos de la tienda."),
        CAP("Panel Inicio del comprador (/user/dashboard)", "con saldo, pedidos pendientes, favoritos, último "
            "pedido y recomendados", "u-inicio-comprador.png", "Panel Inicio del comprador"),
    ]),
    (3, "7.1.2", "Consultar y filtrar productos", [
        PASO(1, "Buscar.", "Digitar en «Buscar productos, marcas o categorías…» y seleccionar un resultado."),
        CAP("Barra de búsqueda del menú superior", "con sugerencias de productos", "u-busqueda.png",
            "Búsqueda de productos"),
        PASO(2, "Filtrar.", "En «Productos» usar «Categoría», «Rango de precio», «Solo con descuento», «Solo "
             "disponibles» y «Ordenar por». Oprimir «Limpiar» para quitar los filtros."),
        CAP("Página Productos (/products)", "con filtros aplicados", "u-productos-filtros.png",
            "Filtros del catálogo"),
        PASO(3, "Consultar el detalle.", "Abrir un producto para ver imágenes, precio, IVA, variantes, stock, "
             "«Descripción», «Especificaciones» y «Opiniones de compradores». Oprimir «Ver tienda» para "
             "consultar el perfil de la empresa."),
        CAP("Detalle de un producto (/products/:id)", "con variantes y stock", "u-detalle-producto.png",
            "Detalle del producto"),
        CAP("Perfil público de una empresa (/company/:companyId)", "con productos y calificación",
            "u-perfil-empresa.png", "Perfil de la empresa"),
    ]),
    (3, "7.1.3", "Ofertas y Novedades", [
        P("En el menú superior se encuentran dos accesos directos al catálogo:"),
        UL("**Ofertas (/offers):** se muestran los productos con un descuento vigente en alguna de sus "
           "variantes disponibles. La tarjeta muestra el mejor precio con descuento.",
           "**Novedades (/new):** se muestra lo último que se publicó en RehniMarket, de lo más reciente a "
           "lo más antiguo."),
        P("Oprimir «Ofertas» o «Novedades» y luego un producto para abrir su detalle. Si no hay productos se "
          "muestra «No hay ofertas disponibles en este momento.» o «No hay novedades disponibles en este "
          "momento.». La página de inicio incluye las mismas secciones con la opción de ver todo."),
        CAP("Página Ofertas (/offers)", "con productos con descuento y el precio rebajado",
            "u-ofertas.png", "Ofertas"),
        CAP("Página Novedades (/new)", "con los productos más recientes", "u-novedades.png", "Novedades"),
    ]),
    (3, "7.1.4", "Comprar productos", [
        P("Las cuentas de empresa y de administración no pueden comprar. Para comprar se necesita una "
          "dirección y saldo suficiente."),
        PASO(1, "Agregar al carrito.", "Seleccionar las opciones de la variante y la «Cantidad». Oprimir "
             "«Agregar al carrito» o «Comprar ahora»."),
        CAP("Detalle de un producto", "con la variante y la cantidad seleccionadas", "u-agregar-carrito.png",
            "Agregar al carrito"),
        PASO(2, "Revisar el carrito.", "En «Mi carrito» usar «Agregar una unidad» o «Quitar una unidad», "
             "«Eliminar producto» y «Vaciar carrito». Los productos pueden mostrar «Agotado» o «Sin stock "
             "suficiente». Oprimir «Ir a pagar»."),
        CAP("Página Mi carrito (/cart)", "con productos y resumen", "u-carrito.png", "Carrito de compras"),
        PASO(3, "Elegir la dirección.", "En «Dirección de envío» oprimir «Cambiar» para usar otra dirección. "
             "Si no hay ninguna, oprimir «Elegir dirección para continuar» y luego «Nueva dirección»."),
        CAP("Página Checkout (/checkout)", "con la selección de dirección", "u-checkout-direccion.png",
            "Dirección de envío"),
        PASO(4, "Confirmar la compra.", "Verificar «Subtotal», «IVA», «Total» y «Saldo RehniCoin». Oprimir "
             "«Confirmar compra». El IVA es del 19 % en los productos que lo aplican."),
        CAP("Página Checkout", "con el resumen y el botón «Confirmar compra»", "u-checkout-resumen.png",
            "Resumen de la compra"),
        CAP("Confirmación de compra", "con el mensaje «¡Tu compra fue confirmada!»",
            "u-compra-confirmada.png", "Compra confirmada"),
        P("Si el carrito tiene productos de varias empresas, se genera un pedido por empresa."),
    ]),
    (3, "7.1.5", "Gestionar pedidos y devoluciones", [
        PASO(1, "Consultar.", "Abrir «Mis pedidos» y oprimir «Ver detalle». Los estados son «Pendiente», "
             "«Pagado», «En proceso», «Enviado», «Entregado» y «Cancelado»."),
        CAP("Opción Mis pedidos del panel del comprador", "con la lista de pedidos", "u-mis-pedidos.png",
            "Lista de pedidos"),
        CAP("Detalle de un pedido", "con la línea de estados y los productos", "u-detalle-pedido.png",
            "Detalle del pedido"),
        PASO(2, "Hacer seguimiento.", "Cuando la empresa registra el envío se muestran «Transportadora» y "
             "«Número de guía». Oprimir «Consultar seguimiento»."),
        CAP("Detalle de un pedido enviado", "con el botón «Consultar seguimiento»", "u-seguimiento.png",
            "Seguimiento del envío"),
        PASO(3, "Cancelar.", "Oprimir «Cancelar pedido» y confirmar. Solo se puede cancelar en estado "
             "pendiente o pagado. El valor se reembolsa en RehniCoin y el stock se repone automáticamente."),
        CAP("Detalle de un pedido pendiente", "con el botón «Cancelar pedido»", "u-cancelar-pedido.png",
            "Cancelación del pedido"),
        PASO(4, "Solicitar una devolución.", "Disponible solo en la web y para pedidos entregados. En el "
             "producto oprimir «Solicitar devolución», escribir el «Motivo de la devolución» (entre 5 y 500 "
             "caracteres) y oprimir «Enviar solicitud». La empresa decide y, si aprueba, el dinero regresa a "
             "RehniCoin."),
        CAP("Detalle de un pedido entregado", "con el formulario «Solicitar devolución»",
            "u-solicitar-devolucion.png", "Solicitud de devolución"),
    ]),
    (3, "7.1.6", "Gestionar RehniCoin", [
        PASO(1, "Consultar.", "Abrir «RehniCoins» para ver «Saldo disponible» y «Movimientos»."),
        CAP("Opción RehniCoins del panel del comprador", "con el saldo y los movimientos",
            "u-billetera.png", "Billetera RehniCoin"),
        PASO(2, "Solicitar una recarga.", "Oprimir «Recargar RehniCoins», elegir un valor u «Otra cantidad» "
             "y oprimir «Confirmar solicitud». La solicitud continúa por WhatsApp. La recarga no es "
             "automática: un administrador la acredita después de verificar el pago. En el celular, el botón "
             "es «Solicitar por WhatsApp»."),
        CAP("Ventana «Recargar RehniCoins»", "con una cantidad seleccionada", "u-recarga.png",
            "Solicitud de recarga"),
    ]),
    (3, "7.1.7", "Direcciones, favoritos, cuenta, reseñas y reportes", [
        PASO(1, "Administrar direcciones.", "En «Direcciones» oprimir «Agregar dirección». Ingresar «Nombre "
             "de referencia», «Nombre completo», «Teléfono», «Dirección», «Ciudad» y «Departamento»; las "
             "«Indicaciones adicionales (opcional)» no son obligatorias. Oprimir «Guardar dirección». Usar "
             "«Marcar como predeterminada» o «Eliminar dirección» según se necesite."),
        CAP("Opción Direcciones del panel del comprador", "con el formulario diligenciado",
            "u-direcciones.png", "Direcciones"),
        PASO(2, "Administrar favoritos.", "Oprimir el icono de corazón de un producto. Consultar la lista en "
             "«Favoritos» y usar «Quitar de favoritos» para retirarlo."),
        CAP("Opción Favoritos del panel del comprador", "con productos guardados", "u-favoritos.png",
            "Favoritos"),
        PASO(3, "Configurar la cuenta.", "En «Configuración de cuenta» se muestran las secciones «Perfil», "
             "«Cuenta» y «Seguridad». Usar «Cambiar foto» y «Editar perfil» (nombre y teléfono), «Editar "
             "correo» y «Cambiar contraseña»; esta última envía un código al correo. Esta opción es igual "
             "para todos los perfiles."),
        CAP("Opción Configuración de cuenta", "con las secciones «Perfil», «Cuenta» y «Seguridad»",
            "u-configuracion-comprador.png", "Configuración de cuenta"),
        PASO(4, "Escribir una reseña.", "Solo es posible en la web, en productos entregados y una vez por "
             "producto. En el detalle del producto seleccionar la calificación, completar «Escribe tu reseña» "
             "y oprimir «Enviar reseña». La reseña se puede editar o borrar con «Eliminar reseña»."),
        CAP("Sección Opiniones de compradores del detalle del producto", "con el formulario de reseña",
            "u-resena.png", "Reseña del producto"),
        PASO(5, "Reportar.", "Disponible en la web. Oprimir «Reportar» en un producto o «Reportar empresa» "
             "en un perfil. Escribir el «Motivo», agregar «Descripción (opcional)» y «Evidencias "
             "(opcional)» con «Añadir imágenes» (hasta 5 imágenes JPEG, PNG o WEBP de máximo 5 MB cada "
             "una). Oprimir «Enviar reporte»."),
        CAP("Ventana de reporte", "con el motivo y una evidencia", "u-reporte.png", "Reporte de producto"),
    ]),
    (3, "7.1.8", "Aplicación móvil", [
        P("La aplicación móvil está disponible para visitantes y compradores. Incluye inicio, búsqueda, "
          "categorías, ofertas, novedades, carrito, checkout, pedidos y cancelación, billetera, direcciones, "
          "favoritos, cuenta y recuperación de contraseña. Las devoluciones, las reseñas y los reportes se "
          "realizan en la web."),
        PASO(1, "Ingresar.", "Digitar «Correo electrónico» y «Contraseña» y oprimir «Ingresar». Para crear "
             "una cuenta oprimir «Regístrate» y luego «Registrarme»."),
        CAP("Pantalla Iniciar sesión de la aplicación móvil", "con los datos diligenciados",
            "u-movil-login.png", "Inicio de sesión móvil"),
        PASO(2, "Recuperar la contraseña.", "En la pantalla de ingreso oprimir «¿Olvidaste tu contraseña?», "
             "ingresar el correo y oprimir «Enviar código». En «Restablecer contraseña» ingresar el código, "
             "la «Nueva contraseña» y «Confirmar contraseña», y oprimir «Guardar nueva contraseña»."),
        CAP("Pantalla «Recuperar contraseña» de la aplicación móvil", "con el correo digitado",
            "u-movil-recuperar.png", "Recuperación de contraseña móvil"),
        PASO(3, "Buscar.", "En «Inicio» oprimir la barra «Buscar productos...» y escribir al menos 2 "
             "caracteres. Oprimir «Limpiar» para borrar el texto o «Volver» para regresar."),
        CAP("Pantalla de búsqueda de la aplicación móvil", "con resultados para un texto de búsqueda",
            "u-movil-busqueda.png", "Búsqueda móvil"),
        PASO(4, "Consultar ofertas y novedades.", "En «Inicio» se muestran las secciones «Productos "
             "destacados», «Ofertas especiales» y «Novedades». Oprimir la opción de ver todo de cada sección "
             "para abrir la lista completa."),
        CAP("Pantalla Inicio de la aplicación móvil", "con productos destacados, ofertas especiales y "
            "novedades", "u-movil-inicio.png", "Inicio móvil"),
        CAP("Pantalla de ofertas de la aplicación móvil", "con la lista completa de productos con "
            "descuento", "u-movil-ofertas.png", "Ofertas móvil"),
        CAP("Pantalla de novedades de la aplicación móvil", "con la lista de productos recientes",
            "u-movil-novedades.png", "Novedades móvil"),
        PASO(5, "Comprar.", "Seleccionar un producto, agregarlo al «Carrito» y oprimir «Ir a pagar». "
             "Confirmar en «Checkout»."),
        CAP("Pantalla Checkout de la aplicación móvil", "con dirección, resumen y saldo",
            "u-movil-checkout.png", "Checkout móvil"),
        CAP("Pantalla RehniCoin de la aplicación móvil", "con saldo y movimientos", "u-movil-billetera.png",
            "Billetera móvil"),
    ]),

    (2, "7.2", "Empresa (vendedor)", []),
    (3, "7.2.1", "Panel Inicio de la empresa y estado de verificación", [
        P("Al abrir el panel de empresa se muestra «Inicio» con el banner, el logo, el nombre de la "
          "empresa, el año desde el que es miembro y una etiqueta con el estado de verificación:"),
        TABLA(["Etiqueta", "Significado", "Qué hacer"], [
            ["Empresa pendiente de verificación", "El certificado está en revisión.", "Esperar la revisión."],
            ["Empresa verificada", "El certificado fue aprobado.", "Usar todas las opciones del panel."],
            ["Certificado no válido", "El administrador pidió un certificado nuevo.",
             "Actualizar el certificado (numeral 7.2.5)."],
            ["Empresa rechazada", "El administrador rechazó la empresa.", "Acudir a la mesa de ayuda."],
        ], [3.8, 4.0, 4.0]),
        P("Con la empresa verificada, «Inicio» muestra además los indicadores «Productos publicados» (total "
          "en el catálogo), «Activos» (visibles para compradores), «Desactivados» (ocultos) y «Agotados» "
          "(sin stock disponible), y la tabla «Productos recientes» con producto, precio, stock y estado."),
        P("Mientras la empresa no esté verificada, solo están disponibles «Inicio», la consulta del perfil "
          "y la actualización del certificado; las demás opciones responden con el mensaje del estado "
          "(numeral 9)."),
        CAP("Panel Inicio de la empresa (/company/dashboard)", "con la etiqueta «Empresa verificada», los "
            "indicadores y los productos recientes", "u-inicio-empresa.png", "Panel Inicio de la empresa"),
        CAP("Panel Inicio de la empresa", "con la etiqueta «Empresa pendiente de verificación»",
            "u-inicio-empresa-pendiente.png", "Empresa pendiente de verificación"),
    ]),
    (3, "7.2.2", "Administrar productos", [
        P("Estas funciones requieren una empresa verificada."),
        PASO(1, "Crear el producto.", "En «Productos» oprimir «Nuevo producto». Ingresar «Nombre del "
             "producto», «Categoría» y «Descripción». Marcar «Este producto aplica IVA (19%)» si corresponde, "
             "completar «Especificaciones del producto» y oprimir «Crear y agregar variantes»."),
        CAP("Formulario «Crear nuevo producto»", "con los datos diligenciados", "u-nuevo-producto.png",
            "Nuevo producto"),
        PASO(2, "Crear variantes.", "En «Variantes» oprimir «Generar», seleccionar «Ejes a combinar», «Precio "
             "base» y «Stock base». Oprimir «Ver combinaciones» y luego «Crear seleccionadas». Para una sola "
             "variante oprimir «Agregar», ingresar «Nombre», «SKU», «Precio», «Stock» e «Imágenes», y "
             "oprimir «Crear variante». El producto se vende por sus variantes: la imagen de la tarjeta es "
             "la primera imagen de la primera variante disponible."),
        CAP("Ventana «Generar combinaciones»", "con ejes seleccionados", "u-generar-variantes.png",
            "Generación de variantes"),
        CAP("Formulario de variante", "con precio, stock e imágenes", "u-variante.png", "Variante"),
        PASO(3, "Configurar descuentos.", "Seleccionar «Tipo»: «Porcentaje (%)» o «Monto fijo ($)». Definir "
             "«Inicio (opcional)» y «Fin (opcional)». Un producto con descuento vigente aparece en «Ofertas»."),
        CAP("Campos de descuento en la edición del producto", "con un descuento diligenciado",
            "u-descuento.png", "Descuento"),
        PASO(4, "Mantener los productos.", "En la lista usar «Editar producto», «Desactivar producto» o "
             "«Activar producto», y «Eliminar producto»."),
        CAP("Opción Productos del panel de empresa", "con la lista y sus acciones", "u-lista-productos.png",
            "Lista de productos"),
    ]),
    (3, "7.2.3", "Gestionar pedidos", [
        PASO(1, "Consultar el pedido.", "En «Pedidos» usar las pestañas «Todos», «Pendientes», «En proceso», "
             "«Completados» y «Cancelados». Oprimir «Ver detalle»."),
        CAP("Opción Pedidos del panel de empresa", "con la lista de pedidos", "u-pedidos-empresa.png",
            "Pedidos de la empresa"),
        PASO(2, "Registrar el envío.", "Oprimir «Editar envío», seleccionar la «Transportadora», escribir el "
             "«Número de guía» (entre 3 y 80 caracteres) y oprimir «Guardar información de envío». Si no se "
             "elige transportadora se muestra «Selecciona una transportadora.»."),
        CAP("Detalle de un pedido de la empresa", "con los datos de envío", "u-envio.png",
            "Información de envío"),
        PASO(3, "Avanzar el estado.", "Oprimir, en orden, «Iniciar procesamiento», «Marcar enviado» y "
             "«Marcar entregado»."),
        CAP("Detalle de un pedido de la empresa", "con el botón «Iniciar procesamiento»",
            "u-estado-pedido.png", "Cambio de estado"),
    ]),
    (3, "7.2.4", "Resolver devoluciones", [
        PASO(1, "Filtrar las solicitudes.", "En «Devoluciones» usar las pestañas «Todas», «En revisión», "
             "«Aprobadas» y «Rechazadas». Las solicitudes nuevas quedan en «En revisión»."),
        CAP("Opción Devoluciones del panel de empresa", "con las pestañas «Todas», «En revisión», «Aprobadas» "
            "y «Rechazadas»", "u-devoluciones-pestanas.png", "Pestañas de devoluciones"),
        PASO(2, "Decidir.", "Oprimir «Ver detalle», revisar el «Motivo del comprador» y oprimir «Aprobar "
             "devolución» o «Rechazar devolución». Para rechazar es obligatorio el «Motivo del rechazo». Al "
             "aprobar, el valor del producto se reembolsa en RehniCoin al comprador."),
        CAP("Detalle de una solicitud de devolución", "con los botones aprobar y rechazar",
            "u-devolucion-detalle.png", "Resolución de devolución"),
    ]),
    (3, "7.2.5", "Finanzas, Mi tienda y certificado", [
        PASO(1, "Consultar finanzas.", "En «Finanzas» se muestran «Resumen financiero», «Liquidaciones» y "
             "«Cuentas bancarias». La comisión de la plataforma es del 5 %."),
        CAP("Opción Finanzas del panel de empresa", "con el resumen financiero", "u-finanzas.png",
            "Resumen financiero"),
        PASO(2, "Registrar la cuenta bancaria.", "En «Cuentas bancarias» oprimir «Nueva cuenta». Ingresar "
             "«Titular de la cuenta», «Documento», «Banco», «Tipo de cuenta» y «Número de cuenta». Marcar "
             "«Cuenta predeterminada (a esta se giran las liquidaciones)» y oprimir «Guardar cuenta». Sin "
             "cuenta predeterminada no se puede liquidar."),
        CAP("Formulario de cuenta bancaria", "con los datos diligenciados", "u-cuenta-bancaria.png",
            "Cuenta bancaria"),
        PASO(3, "Actualizar la tienda.", "En «Mi tienda» usar «Cambiar logo», «Cambiar banner» y «Actualizar "
             "imágenes». Oprimir «Editar» para cambiar los datos y «Guardar»."),
        CAP("Opción Mi tienda del panel de empresa", "con logo, banner e información", "u-mi-tienda.png",
            "Mi tienda"),
        PASO(4, "Actualizar el certificado.", "Si fue marcado como no válido, oprimir «Actualizar "
             "certificado». En /actualizar-certificado ingresar correo, contraseña y «Nuevo certificado» en "
             "PDF de máximo 5 MB. La empresa vuelve a revisión. Una empresa rechazada no puede hacerlo y debe "
             "contactar a la mesa de ayuda."),
        CAP("Página Actualizar certificado (/actualizar-certificado)", "con el PDF seleccionado",
            "u-actualizar-certificado.png", "Actualización del certificado"),
    ]),
    (3, "7.2.6", "Configuración de cuenta de la empresa", [
        P("La opción «Configuración de cuenta» del panel de empresa administra los datos del representante "
          "(la persona que inicia sesión), no los de la tienda, que se editan en «Mi tienda»."),
        PASO(1, "Editar el perfil.", "En «Perfil» oprimir «Cambiar foto» para subir la foto, y «Editar "
             "perfil» para cambiar «Nombre» (mínimo 3 caracteres) y «Teléfono» (10 dígitos). Oprimir "
             "«Guardar»."),
        PASO(2, "Cambiar el correo.", "En «Cuenta» oprimir «Editar correo», digitar el nuevo «Correo "
             "electrónico» y oprimir «Guardar». Si el correo ya está en uso se muestra «No se pudo "
             "actualizar el correo. Es posible que ya esté en uso.»."),
        PASO(3, "Cambiar la contraseña.", "En «Seguridad» oprimir «Cambiar contraseña» y luego «Enviar "
             "código». Continuar con el código recibido como en el numeral 5.4."),
        CAP("Configuración de cuenta del panel de empresa", "con las secciones «Perfil», «Cuenta» y "
            "«Seguridad»", "u-configuracion-empresa.png", "Configuración de cuenta de la empresa"),
    ]),

    (2, "7.3", "Administrador (y subperfil Propietario)", [
        P("El propietario usa el mismo panel administrativo y tiene todas las funciones de esta sección. "
          "Además, solo él puede generar y pagar liquidaciones (numeral 7.3.8) y crear, editar o bloquear "
          "cuentas con el rol propietario."),
    ]),
    (3, "7.3.1", "Panel Inicio del administrador", [
        P("Al abrir el panel administrativo se muestra «Inicio» con el «Resumen general de RehniMarket»:"),
        UL("**Usuarios:** registrados, activos, bloqueados y administradores.",
           "**Empresas:** registradas, activas y bloqueadas.",
           "**Usuarios recientes:** últimos usuarios registrados, con su rol y estado.",
           "**Actividad reciente:** últimos movimientos administrativos (aprobaciones, bloqueos y cambios)."),
        CAP("Panel Inicio del administrador (/admin/dashboard)", "con los indicadores de usuarios y "
            "empresas, usuarios recientes y actividad reciente", "u-inicio-admin.png",
            "Panel Inicio del administrador"),
    ]),
    (3, "7.3.2", "Gestionar empresas", [
        PASO(1, "Revisar el certificado.", "En «Empresas» usar «Todas», «Pendientes», «Certificado "
             "inválido», «Rechazadas» y «Aprobadas». Oprimir «Ver empresa» y «Ver certificado»."),
        CAP("Opción Empresas del panel administrativo", "con los filtros y la lista", "u-empresas.png",
            "Empresas"),
        PASO(2, "Decidir.", "Oprimir «Aprobar certificado» o «Rechazar o solicitar cambios». En este último, "
             "elegir «Rechazar» o «Certificado inválido — Solicitar actualización», escribir el «Motivo» y "
             "oprimir «Confirmar»."),
        CAP("Ventana «Revisar certificado»", "con las opciones y el motivo", "u-revisar-certificado.png",
            "Revisión del certificado"),
        PASO(3, "Suspender una empresa.", "Oprimir «Bloquear empresa», escribir el «Motivo de suspensión» y "
             "confirmar con «Suspender empresa». Los pedidos en proceso se cancelan y reembolsan según las "
             "reglas del sistema."),
        CAP("Ventana «Suspender empresa»", "con el motivo diligenciado", "u-suspender-empresa.png",
            "Suspensión de empresa"),
    ]),
    (3, "7.3.3", "Gestionar usuarios", [
        P("En «Usuarios» buscar la cuenta y oprimir «Ver usuario». Usar «Editar información», «Bloquear "
          "usuario» o «Desbloquear usuario», y «Recargar RehniCoin». Una cuenta no puede modificarse a sí "
          "misma desde esta opción (usar «Configuración de cuenta»). Solo un propietario puede asignar el "
          "rol propietario o modificar y bloquear cuentas de propietario."),
        CAP("Opción Usuarios del panel administrativo", "con la lista y sus acciones", "u-usuarios.png",
            "Usuarios"),
    ]),
    (3, "7.3.4", "Catálogo y transportadoras", [
        PASO(1, "Administrar categorías.", "En «Catálogo» oprimir «Nueva categoría», ingresar «Nombre», "
             "«Descripción», «Orden visual» e imagen. En la lista usar «Atributos y variantes» para definir "
             "«Nombre», «Rol», «Entrada» y «Unidad», y oprimir «Agregar»."),
        CAP("Ventana «Atributos y variantes»", "con atributos de una categoría", "u-atributos.png",
            "Atributos de categoría"),
        PASO(2, "Administrar transportadoras.", "En «Transportadoras» oprimir «Nueva transportadora», "
             "ingresar «Nombre» y «URL de seguimiento», y oprimir «Crear transportadora»."),
        CAP("Opción Transportadoras del panel administrativo", "con el formulario", "u-transportadoras.png",
            "Transportadoras"),
    ]),
    (3, "7.3.5", "Gestionar anuncios", [
        P("Los anuncios son las imágenes del carrusel de la página de inicio. Son solo visuales: se componen "
          "de una imagen, una imagen opcional para móvil y un destino al que lleva el clic."),
        PASO(1, "Crear el anuncio.", "En «Anuncios» oprimir «Nuevo anuncio». Cargar la imagen con «Subir "
             "imagen» y, si se desea, «Subir imagen móvil». Definir «Orden» y «Estado»."),
        PASO(2, "Elegir el tipo de anuncio.", "Seleccionar el «Tipo de anuncio». El destino se calcula según "
             "el tipo:"),
        TABLA(["Tipo de anuncio", "Configuración requerida", "Destino del clic"], [
            ["Producto específico", "Buscar y seleccionar el producto", "Detalle del producto"],
            ["Categoría", "Seleccionar la categoría; descuento mínimo opcional",
             "Productos de la categoría"],
            ["Empresa", "Buscar y seleccionar la empresa", "Perfil público de la empresa"],
            ["Promoción", "Descuento mínimo (%)", "Productos con al menos ese descuento"],
            ["Black Friday", "Descuento mínimo (%)", "Productos con al menos ese descuento"],
            ["Cyber Days", "Descuento mínimo (%)", "Productos con al menos ese descuento"],
            ["Liquidación", "Descuento mínimo y/o stock máximo", "Productos con descuento o pocas unidades"],
            ["Nuevos lanzamientos", "Antigüedad máxima en días", "Productos publicados en esos días"],
        ], [3.4, 4.4, 4.0]),
        P("También se puede elegir «Manual (escribir destino a mano)» y escribir el enlace, por ejemplo "
          "/products. Usar «Ver anuncio» para la vista previa y los iconos de la lista para editar, "
          "activar o desactivar y eliminar."),
        CAP("Formulario de anuncio", "con el «Tipo de anuncio» desplegado y una imagen cargada",
            "u-anuncio-tipos.png", "Tipos de anuncio"),
    ]),
    (3, "7.3.6", "Atender reportes", [
        P("En «Reportes» oprimir «Ver reporte». Revisar el «Motivo» y las «Evidencias». Oprimir «Marcar en "
          "revisión», «Resolver» o «Rechazar», agregar la «Respuesta administrativa (opcional)» y "
          "confirmar. Un reporte resuelto ya no se puede modificar."),
        CAP("Ventana «Detalle del reporte»", "con evidencias y acciones", "u-reporte-detalle.png",
            "Detalle del reporte"),
    ]),
    (3, "7.3.7", "Recargar y corregir RehniCoin", [
        PASO(1, "Recargar saldo.", "Después de verificar el pago, en «RehniCoin» ingresar «Correo del "
             "usuario», «Cantidad (RC)» y «Descripción (opcional)». Oprimir «Recargar saldo». El máximo por "
             "operación es de 10.000.000 RC."),
        CAP("Opción RehniCoin del panel administrativo", "con el formulario y las últimas recargas",
            "u-recarga-admin.png", "Recarga de RehniCoin"),
        PASO(2, "Corregir una recarga.", "En «Últimas recargas» oprimir «Corregir recarga», ingresar «Nueva "
             "cantidad correcta (RC)» y «Motivo de la corrección». Una recarga solo se puede corregir una "
             "vez y la corrección no puede dejar el saldo en negativo."),
        CAP("Ventana «Corregir recarga»", "con la nueva cantidad", "u-corregir-recarga.png",
            "Corrección de recarga"),
    ]),
    (3, "7.3.8", "Liquidaciones (solo propietario)", [
        P("Una liquidación es el pago mensual a una empresa por sus ventas entregadas, menos la comisión "
          "del 5 %."),
        PASO(1, "Filtrar.", "En «Liquidaciones» usar los filtros «Todas», «Pendientes», «Procesando», "
             "«Pagadas» y «Fallidas»."),
        CAP("Opción Liquidaciones del panel administrativo (propietario)", "con los filtros «Todas», "
            "«Pendientes», «Procesando», «Pagadas» y «Fallidas»", "u-liquidaciones-filtros.png",
            "Filtros de liquidaciones"),
        PASO(2, "Generar.", "Oprimir «Generar liquidación». Buscar la «Empresa», seleccionar «Mes a liquidar» "
             "y revisar la «Vista previa». Oprimir «Generar liquidación»."),
        CAP("Ventana «Generar liquidación»", "con la vista previa", "u-generar-liquidacion.png",
            "Generación de liquidación"),
        PASO(3, "Pagar.", "Transferir el valor fuera de la plataforma. Oprimir «Ver detalle», «Marcar como "
             "pagada» y «Confirmar pago». Se envía un correo a la empresa."),
        CAP("Ventana «Marcar liquidación como pagada»", "con el valor y la cuenta destino",
            "u-pagar-liquidacion.png", "Pago de liquidación"),
    ]),
    (3, "7.3.9", "Configuración de cuenta del administrador", [
        P("La opción «Configuración de cuenta» del panel administrativo es la misma de los demás perfiles: "
          "«Perfil» (foto, nombre y teléfono), «Cuenta» (correo) y «Seguridad» (cambio de contraseña con "
          "código al correo). Seguir los pasos del numeral 7.2.6."),
        P("Un administrador no puede cambiar su propio rol ni bloquearse desde «Usuarios»: los cambios de su "
          "cuenta se hacen aquí y los de rol, con otro administrador o con el propietario."),
        CAP("Configuración de cuenta del panel administrativo", "con las secciones «Perfil», «Cuenta» y "
            "«Seguridad»", "u-configuracion-admin.png", "Configuración de cuenta del administrador"),
    ]),

    # ------------------------------------------------------------------ 8
    (1, "8", "Información sobre la mesa de ayuda", [
        P("La mesa de ayuda brinda soporte de primer nivel a los usuarios. Los casos que no puede resolver "
          "se escalan al desarrollador, según los acuerdos de niveles de servicio del Manual técnico."),
        TABLA(["Dato", "Detalle"], [
            ["Correo de soporte", SOPORTE["correo"]],
            ["WhatsApp", SOPORTE["whatsapp"]],
            ["Horario de atención", SOPORTE["horario"]],
            ["Herramienta de casos", f"GitHub Issues: {SOPORTE['issues']}"],
        ], [3.6, 8.2]),
        SUB("Cuándo acudir a la mesa de ayuda"),
        UL("Cuenta bloqueada, o empresa suspendida o rechazada.",
           "Recarga de RehniCoin pagada y no acreditada, o acreditada con un valor incorrecto.",
           "Pedido con saldo o stock inconsistente.",
           "Cambios de rol o permisos de una cuenta.",
           "Mensajes «Error interno del servidor.» o «Servicio temporalmente no disponible. Intenta de "
           "nuevo.» que persisten después de reintentar.",
           "Cualquier comportamiento distinto al descrito en este manual."),
        SUB("Cómo reportar un caso"),
        OL("Escribir al correo de soporte o crear un issue en GitHub Issues con un título corto.",
           "Indicar el perfil, la opción del menú y los pasos realizados.",
           "Copiar el mensaje exacto que mostró el sistema y adjuntar una captura de pantalla.",
           "No incluir contraseñas ni códigos de verificación."),
    ]),

    # ------------------------------------------------------------------ 9
    (1, "9", "Descripción de los mensajes de error", [
        P("Los mensajes se muestran tal como los envía el sistema. Los primeros corresponden a las reglas "
          "del servidor; los del final, a las validaciones en vivo de los formularios y a la sesión."),
    ]),
]

E = lambda m, c, a: [m, c, a]

ERRORES_SERVIDOR = [
    E("Correo o contraseña incorrecta.", "Los datos de inicio de sesión no coinciden.",
      "Verificar los datos o recuperar la contraseña."),
    E("Tu correo no ha sido verificado. Te enviamos un código de verificación a tu correo electrónico.",
      "La cuenta no tiene el correo verificado.", "Ingresar el código recibido."),
    E("Tu cuenta se encuentra bloqueada. Contacta con un administrador.", "La cuenta fue bloqueada.",
      "Acudir a la mesa de ayuda."),
    E("Tu empresa esta en revision", "El certificado de la empresa está pendiente.", "Esperar la revisión."),
    E("El certificado que presentaste no es válido. Debes subir uno nuevo para que tu empresa vuelva a revisión.",
      "El certificado fue marcado como inválido.", "Oprimir «Actualizar certificado»."),
    E("Tu empresa fue rechazada. Para volver a operar debe intervenir un administrador.",
      "La empresa fue rechazada.", "Acudir a la mesa de ayuda."),
    E("Tu empresa se encuentra suspendida.", "La empresa fue suspendida.", "Acudir a la mesa de ayuda."),
    E("El correo ya se encuentra registrado", "El correo ya tiene una cuenta.",
      "Iniciar sesión o usar otro correo."),
    E("El NIT ya se encuentra registrado", "El NIT ya pertenece a otra empresa.", "Verificar el NIT."),
    E("Las contraseñas no coinciden.", "«Contraseña» y «Confirmar contraseña» son distintas.",
      "Digitar la misma contraseña en los dos campos."),
    E("La contraseña debe tener al menos 8 caracteres.", "La contraseña es corta.",
      "Usar una contraseña de 8 caracteres o más."),
    E("El código de verificación es incorrecto.", "El código no coincide.", "Revisar el código del correo."),
    E("El código de verificación ha expirado. Solicita un nuevo código.", "Pasaron más de 5 minutos.",
      "Oprimir «Reenviar código»."),
    E("Debes esperar antes de solicitar un nuevo código de verificación.", "Pasaron menos de 60 segundos.",
      "Esperar y reintentar."),
    E("El codigo de recuperacion es incorrecto", "El código de recuperación no coincide.",
      "Revisar el código o solicitar uno nuevo."),
    E("No existe una cuenta registrada con ese correo.", "El correo no existe en el sistema.",
      "Verificar el correo."),
    E("El certificado debe ser un archivo PDF.", "El archivo no es PDF.", "Adjuntar un PDF."),
    E("El certificado debe pesar como máximo 5 MB.", "El archivo es muy grande.", "Reducir el archivo."),
    E("Tu carrito está vacío.", "No hay productos en el carrito.", "Agregar productos."),
    E("Debes registrar una dirección para continuar con la compra.", "No hay dirección de envío.",
      "Agregar una dirección."),
    E("Tu saldo de RehniCoin no alcanza para completar la compra.", "El saldo es insuficiente.",
      "Solicitar una recarga."),
    E("Solo hay {n} unidades disponibles.", "La cantidad supera el stock.", "Reducir la cantidad."),
    E("Producto sin stock disponible.", "El producto está agotado.", "Elegir otro producto."),
    E("Este producto requiere seleccionar una variante.", "Falta elegir la variante.",
      "Seleccionar las opciones."),
    E("Solo las cuentas de tipo comprador pueden realizar compras.", "La cuenta no es de comprador.",
      "Usar una cuenta de comprador."),
    E("Este pedido ya está en preparación y no se puede cancelar.", "El pedido avanzó de estado.",
      "Acudir a la mesa de ayuda."),
    E("Este pedido ya fue cancelado y reembolsado.", "El pedido ya está cancelado.",
      "Revisar los movimientos de RehniCoin."),
    E("Solo puedes solicitar la devolución de un pedido que ya fue entregado.", "El pedido no está entregado.",
      "Esperar la entrega."),
    E("Ya existe una solicitud de devolución activa para este producto.", "Ya hay una solicitud en revisión.",
      "Esperar la respuesta de la empresa."),
    E("Solo puedes reseñar productos que ya te hayan entregado.", "No hay una compra entregada del producto.",
      "Esperar la entrega."),
    E("Ya reseñaste este producto. Edita tu reseña en vez de crear otra.", "Ya existe una reseña.",
      "Editar la reseña existente."),
    E("Este producto ya está en tus favoritos.", "El favorito ya existe.", "Ninguna."),
    E("Solo se permiten imágenes en formato JPEG, PNG o WEBP.", "El formato del archivo no es válido.",
      "Usar un formato permitido."),
    E("Esta cuenta ya tiene liquidaciones asociadas y no se puede eliminar.", "La cuenta bancaria está en uso.",
      "Conservar la cuenta."),
    E("La empresa no tiene una cuenta bancaria predeterminada registrada.", "No hay cuenta predeterminada.",
      "Registrar la cuenta y marcarla como predeterminada."),
    E("No hay ventas válidas (pedidos entregados) en el periodo solicitado.", "No hay ventas entregadas.",
      "Elegir otro periodo."),
    E("Ya existe una liquidación generada para esta empresa en este periodo.", "La liquidación ya existe.",
      "Consultar la liquidación existente."),
    E("Solo el propietario puede gestionar liquidaciones.", "La cuenta no es propietario.",
      "Usar una cuenta de propietario."),
    E("Esta recarga ya fue corregida y no puede corregirse de nuevo.", "La recarga ya se corrigió.",
      "Acudir a la mesa de ayuda."),
    E("La corrección dejaría el saldo del usuario en negativo.", "El saldo quedaría negativo.",
      "Revisar el valor."),
    E("No puedes modificar tu propia cuenta desde esta opción.", "Se intentó editar la cuenta propia en "
      "«Usuarios».", "Usar «Configuración de cuenta»."),
    E("Solo un Owner puede asignar el rol Owner.", "Permiso insuficiente.", "Acudir al propietario."),
    E("Demasiadas solicitudes. Intenta nuevamente más tarde.", "Se superó el límite de peticiones.",
      "Esperar un minuto y reintentar."),
    E("Error interno del servidor.", "Ocurrió un error no previsto.",
      "Reintentar y, si persiste, acudir a la mesa de ayuda."),
]

ERRORES_VALIDACION = [
    E("El número de teléfono solo puede contener números.", "El teléfono tiene letras, espacios o signos.",
      "Escribir solo dígitos, sin +57 ni guiones."),
    E("El número de teléfono debe tener exactamente 10 dígitos.", "El teléfono no tiene 10 dígitos.",
      "Escribir el celular de 10 dígitos."),
    E("El nombre completo debe tener al menos 3 caracteres.", "El nombre es muy corto.",
      "Escribir el nombre completo."),
    E("El nombre completo no debe exceder los 60 caracteres.", "El nombre es muy largo.",
      "Abreviar el nombre."),
    E("La contraseña debe contener al menos una letra mayúscula.", "Falta una mayúscula.",
      "Agregar una letra mayúscula."),
    E("La contraseña debe contener al menos una letra minúscula.", "Falta una minúscula.",
      "Agregar una letra minúscula."),
    E("La contraseña debe contener al menos un número.", "Falta un número.", "Agregar un número."),
    E("Ingresa un correo electrónico válido.", "El correo no tiene un formato válido.",
      "Escribir un correo como nombre@dominio.com."),
    E("El nombre de la empresa debe tener al menos 3 caracteres.", "El nombre de la empresa es corto.",
      "Escribir la razón social."),
    E("El nombre de la empresa no debe exceder los 50 caracteres.", "El nombre de la empresa es largo.",
      "Abreviar el nombre."),
    E("La dirección debe tener al menos 5 caracteres.", "La dirección de la empresa es corta.",
      "Escribir la dirección completa."),
    E("El NIT solo puede contener números.", "El NIT tiene puntos, guiones o letras.",
      "Escribir el NIT sin puntos ni dígito de verificación."),
    E("El NIT debe tener al menos 5 caracteres.", "El NIT tiene menos de 5 dígitos.", "Revisar el NIT."),
    E("El dígito de verificación solo puede contener números.", "El DV no es numérico.",
      "Escribir un dígito del 0 al 9."),
    E("El dígito de verificación debe tener exactamente un dígito.", "El DV está vacío o tiene más de un "
      "dígito.", "Escribir un solo dígito."),
    E("El dígito de verificación no coincide con el NIT ingresado.", "El DV no corresponde al NIT.",
      "Revisar el NIT y el DV en el RUT."),
    E("Cuéntanos el motivo de la devolución (mínimo 5 caracteres).", "El motivo es muy corto.",
      "Describir el motivo con más detalle."),
    E("El motivo no debe exceder los 500 caracteres.", "El motivo es muy largo.", "Resumir el motivo."),
    E("El número de guía debe tener al menos 3 caracteres.", "La guía es muy corta.",
      "Copiar el número de guía completo."),
    E("El número de guía no debe exceder los 80 caracteres.", "La guía es muy larga.",
      "Revisar el número de guía."),
    E("Selecciona una transportadora.", "No se eligió transportadora al registrar el envío.",
      "Elegir la transportadora de la lista."),
]

ERRORES_SESION = [
    E("Token requerido", "Se abrió una opción que exige sesión sin haber iniciado sesión.",
      "Iniciar sesión."),
    E("Token expirado", "La sesión venció y no se pudo renovar (por ejemplo, pasaron más de 15 días).",
      "Iniciar sesión de nuevo."),
    E("Token inválido", "Las credenciales guardadas están dañadas o fueron revocadas.",
      "Cerrar sesión e iniciar sesión de nuevo."),
    E("Servicio temporalmente no disponible. Intenta de nuevo.", "El servidor no pudo consultar la base "
      "de datos en ese momento.", "Esperar unos segundos y reintentar; si persiste, acudir a la mesa de "
      "ayuda."),
]

TABLAS_ERRORES = [
    ("9.1", "Mensajes del servidor", ERRORES_SERVIDOR),
    ("9.2", "Validaciones en vivo de los formularios", ERRORES_VALIDACION),
    ("9.3", "Mensajes de sesión", ERRORES_SESION),
]

GLOSARIO = [
    ("ANS", "acrónimo de Acuerdo de Niveles de Servicio."),
    ("Access token", "credencial de sesión de corta duración (30 minutos)."),
    ("Carrito", "lista de productos que se desea comprar."),
    ("Checkout", "paso final en el que se confirma la compra."),
    ("DV", "dígito de verificación del NIT."),
    ("Liquidación", "pago mensual a una empresa por sus ventas entregadas, menos la comisión."),
    ("Mesa de ayuda", "personal dedicado a dar soporte a los usuarios."),
    ("NIT", "Número de Identificación Tributaria."),
    ("Propietario (owner)", "subperfil del administrador con el mayor nivel administrativo."),
    ("Refresh token", "credencial que renueva la sesión sin pedir la contraseña (15 días)."),
    ("RehniCoin", "saldo interno de la plataforma; 1 RehniCoin equivale a 1 COP."),
    ("SKU", "código que identifica una variante."),
    ("Variante", "combinación comprable de un producto, con precio y stock propios."),
]

BIBLIOGRAFIA = [
    "Servicio Nacional de Aprendizaje SENA. Manuales técnicos de la aplicación. FAVA - Formación en "
    "Ambientes Virtuales de Aprendizaje.",
    "IEEE Computer Society (2001). IEEE 1063-2001 Standard for Software User Documentation.",
]
