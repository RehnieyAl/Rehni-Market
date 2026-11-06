"""Contenido del Manual de usuario de RehniMarket (versión 3.0, solo aplicación web).

Cada sección es (nivel, número, título, bloques). Los bloques se pintan en generar_manuales.py
con el diseño de diseno_sena.py. Convenciones del texto:
- «texto» es un elemento de la interfaz (botón, campo, opción): se escribe “texto” en negrita.
- `texto` va en letra monoespaciada; [VERIFICAR: …] se resalta en amarillo.
- {fig:clave} se reemplaza por el número de la figura con esa clave.
Redacción: voz pasiva para describir e infinitivo para las instrucciones.
"""

from datos_comunes import SOPORTE


def P(t): return ("p", t)
def SUB(t): return ("sub", t)
def PASO(n, titulo, texto=""): return ("paso", n, titulo, texto)
def UL(*items): return ("ul", list(items))
def OL(*items): return ("ol", list(items))
def TABLA(enc, filas, anchos=None): return ("tabla", enc, filas, anchos)
def IMG(ruta, titulo, clave=None): return ("img", ruta, titulo, clave)


def CAP(titulo, ruta, estado, resaltar, perfil=None, clave=None):
    """Recuadro de captura pendiente: título del pie, ruta o pantalla, estado que debe mostrar,
    qué resaltar y, si no es el del capítulo, el perfil con el que se toma."""
    return ("captura", titulo, ruta, estado, resaltar, perfil, clave)


# Perfiles y cuentas de prueba para las capturas (ver docs/Manuales/capturas/LISTA-CAPTURAS.md)
VISITANTE = "Visitante (sin iniciar sesión)"
COMPRADOR = "Comprador — cuenta de prueba registrada en /register-user (ej. comprador@rehnimarket.test)"
EMPRESA = "Empresa — TechNova, technova@rehnimarket.test (seed, certificado aprobado)"
ADMIN = "Administrador — cuenta de prueba con rol admin (asignado por el propietario)"
PROPIETARIO = "Propietario — cuenta owner del seed (OWNER_DEFAULT)"

INTRO = [
    P("Este manual sigue la estructura de la guía FAVA-SENA «Manuales técnicos de la aplicación». Cada "
      "elemento se presenta en la tabla No., Descripción y Detalle, y las funciones se explican paso a paso "
      "por perfil de usuario."),
]

SECCIONES = [
    # ------------------------------------------------------------------ 1
    (1, "1", "Alcance", [
        P("Este manual describe la funcionalidad de la aplicación web RehniMarket, un marketplace que conecta a "
          "compradores con empresas vendedoras. Las compras se pagan con RehniCoin, el saldo interno de la "
          "plataforma, donde 1 RehniCoin equivale a 1 peso colombiano."),
        P("Se documentan el registro, el ingreso, la navegación, las funciones por perfil y los mensajes de "
          "error. Para el correcto uso de la aplicación se deben seguir cuidadosamente los pasos de cada opción. "
          "La aplicación móvil no está cubierta por este documento."),
        TABLA(["Perfil", "Rol en el sistema"], [
            ["Visitante", "Sin cuenta"],
            ["Comprador", "user"],
            ["Empresa (vendedor)", "company"],
            ["Administrador", "admin"],
            ["Propietario (subperfil de Administrador)", "owner"],
        ], [6, 4]),
        P("El propietario usa el mismo panel del administrador y suma la opción «Liquidaciones» y la gestión de "
          "las cuentas con el rol propietario."),
        SUB("Contacto de soporte"),
        P("Si el comportamiento del sistema no es el descrito en este manual, contactar a la mesa de ayuda:"),
        TABLA(["Canal", "Dato"], [
            ["Correo electrónico", SOPORTE["correo"]],
            ["Reporte de fallas", f"GitHub Issues: {SOPORTE['issues']}"],
            ["Horario", SOPORTE["horario"]],
        ], [3.5, 8.3]),
        P("Los casos en los que se debe acudir a la mesa de ayuda y la forma de reportarlos se describen en el "
          "numeral 8."),
    ]),

    # ------------------------------------------------------------------ 2
    (1, "2", "Requisitos de conocimiento para manejar el sistema", [
        TABLA(["Perfil", "Conocimientos requeridos"], [
            ["Visitante y comprador", "Uso básico de navegadores y manejo de correo electrónico para recibir "
             "códigos."],
            ["Empresa (vendedor)", "Lo anterior, más manejo de archivos PDF e imágenes, y conocimientos básicos "
             "de inventario, precios y envíos."],
            ["Administrador y propietario", "Informática básica, conocimiento de las políticas de la plataforma "
             "y de los procesos de verificación de empresas, recargas y liquidaciones."],
        ], [4, 8]),
        P("Todos los perfiles deben conocer la política de seguridad descrita en el numeral 4."),
    ]),

    # ------------------------------------------------------------------ 3
    (1, "3", "Requerimientos de hardware y software", [
        P("Estos requerimientos aplican al equipo del usuario (cliente) y no al servidor. Los requisitos del "
          "servidor se describen en el Manual técnico."),
        TABLA(["Elemento", "Mínimo", "Recomendado"], [
            ["Procesador", "Doble núcleo de 1,6 GHz", "Cuatro núcleos de 2,0 GHz o superior"],
            ["Memoria RAM", "4 GB", "8 GB"],
            ["Pantalla", "1366 × 768", "1920 × 1080"],
            ["Conexión a internet", "5 Mbps", "10 Mbps o superior"],
            ["Sistema operativo", "Windows 10, macOS 12 o una distribución de Linux actual",
             "La versión más reciente del sistema"],
            ["Navegador de escritorio", "Chrome 111, Edge 111, Firefox 128 o Safari 16.4",
             "La versión más reciente de Chrome, Edge, Firefox o Safari"],
            ["Navegador en celular o tableta", "Chrome 111 en Android o Safari 16.4 en iOS",
             "La versión más reciente del navegador"],
            ["Otros", "Lector de archivos PDF. Empresas: certificado de Cámara de Comercio en PDF de máximo 5 MB",
             "WhatsApp, para solicitar recargas de RehniCoin"],
        ], [3.2, 4.4, 4.2]),
        P("Las versiones mínimas de los navegadores son las que exige Tailwind CSS 4, con el que se construyó la "
          "interfaz; en versiones anteriores la página puede verse incompleta. La aplicación web se adapta a "
          "pantallas pequeñas, por lo que también se puede usar desde el navegador de un celular o una tableta."),
    ]),

    # ------------------------------------------------------------------ 4
    (1, "4", "Política de seguridad", [
        P("Antes de ingresar al sistema se deben leer y aceptar los términos y condiciones que se muestran en el "
          "registro. Su incumplimiento puede llevar al bloqueo de la cuenta o a la suspensión de la empresa."),
        SUB("Contraseñas"),
        OL("La contraseña debe tener mínimo 8 caracteres, con al menos una letra mayúscula, una letra minúscula "
           "y un número. Los formularios validan estas reglas mientras se escribe.",
           "No compartir la contraseña ni los códigos enviados al correo.",
           "Las contraseñas se guardan cifradas: ni siquiera un administrador puede consultarlas.",
           "El icono del ojo («Mostrar contraseña» / «Ocultar contraseña») permite revisar lo digitado; usarlo "
           "solo cuando nadie más vea la pantalla."),
        SUB("Códigos enviados al correo"),
        OL("El código de verificación de correo vence a los 5 minutos.",
           "El código de recuperación de contraseña vence a los 15 minutos.",
           "Para solicitar un código nuevo se deben esperar 60 segundos. Solo el último código enviado es "
           "válido."),
        SUB("Sesión"),
        OL("Al iniciar sesión se entregan dos credenciales: un access token, válido por 30 minutos, y un refresh "
           "token, válido por 15 días. Mientras el refresh token esté vigente, la sesión se renueva sola sin "
           "volver a pedir la contraseña.",
           "La sesión queda guardada en el navegador (almacenamiento local) hasta que se cierra. Por eso se debe "
           "oprimir «Cerrar sesión» al usar un equipo compartido.",
           "Si la sesión no se puede renovar, el sistema lleva al inicio de sesión con el aviso «Tu sesión ha "
           "expirado. Inicia sesión nuevamente.».",
           "El servidor limita el número de peticiones por dirección IP (100 por minuto en producción). Al "
           "superarlo se muestra «Demasiadas solicitudes. Intenta nuevamente más tarde.».",
           "Toda la comunicación viaja cifrada por HTTPS.",
           "Cada cuenta solo puede acceder a las funciones de su rol; las demás opciones no se muestran o "
           "llevan al inicio del panel propio."),
        SUB("Recargas"),
        P("Solicitar recargas de RehniCoin únicamente por el canal oficial de WhatsApp que abre la opción "
          "«Recargar RehniCoins». Ningún administrador pide contraseñas ni códigos para acreditar una recarga."),
    ]),

    # ------------------------------------------------------------------ 5
    (1, "5", "Ingreso al sistema", [
        P(f"Para las funciones personales se debe tener una cuenta con el correo verificado. La aplicación web "
          f"se abre en la siguiente dirección: {SOPORTE['url_produccion']}. Una vez se digite la URL aparecerá la "
          f"página de inicio."),
        CAP("Página de inicio", "/", "Menú superior, anuncios del carrusel, categorías, «Ofertas especiales», "
            "«Novedades» y la sección «¿Tienes una empresa?»", "Menú superior (recuadro rojo)", VISITANTE),
    ]),
    (2, "5.1", "Registro de comprador", [
        PASO(1, "Abrir el formulario.", "Oprimir «Registrarse» en el menú superior."),
        CAP("Opción para registrarse", "/", "Menú superior completo", "Botón «Registrarse» (flecha roja)",
            VISITANTE),
        PASO(2, "Diligenciar los datos.",
             "Ingresar «Nombre completo», «Teléfono», «Correo electrónico», «Contraseña» y «Confirmar "
             "contraseña». Aceptar los términos y oprimir «Crear cuenta». Cada campo se valida mientras se "
             "escribe:"),
        UL("El nombre debe tener entre 3 y 60 caracteres.",
           "El teléfono debe tener exactamente 10 dígitos, solo números.",
           "La contraseña debe cumplir las reglas del numeral 4.",
           "El correo debe tener un formato válido."),
        CAP("Registro de comprador", "/register-user (formulario «Crear una cuenta»)",
            "Campos diligenciados y un mensaje de validación en vivo visible bajo «Teléfono»",
            "Mensaje de validación y botón «Crear cuenta»", VISITANTE),
        PASO(3, "Verificar el correo.",
             "Ingresar el código de 6 dígitos recibido y oprimir «Verificar correo». Si no llega, oprimir "
             "«Reenviar código» (disponible a los 60 segundos). Para corregir la dirección, oprimir «¿El correo "
             "es incorrecto? Cambiarlo». Al terminar se muestra «Cuenta verificada correctamente.»."),
        CAP("Verificación del correo", "/verify-email (página «Verifica tu correo»)",
            "Código digitado y contador de reenvío", "Casillas del código y botón «Verificar correo»",
            VISITANTE),
    ]),
    (2, "5.2", "Registro de empresa", [
        PASO(1, "Abrir el formulario.",
             "Oprimir «Registrar mi empresa» en la sección «¿Tienes una empresa?» de la página de inicio, o "
             "«Registra tu empresa» en el pie de página."),
        CAP("Acceso al registro de empresa", "/ (sección «¿Tienes una empresa?»)",
            "Sección visible con su botón", "Botón «Registrar mi empresa»", VISITANTE),
        PASO(2, "Diligenciar los datos.",
             "En el formulario «Registrar empresa» completar los datos del representante (nombre, teléfono, "
             "correo, «Contraseña» y su confirmación) y los «Datos de la empresa»: «Nombre de la empresa» (3 a 50 "
             "caracteres), «Dirección» (mínimo 5 caracteres), «NIT» (solo números, mínimo 5 dígitos) y «DV» (un "
             "dígito). El formulario calcula el dígito de verificación y avisa si no coincide con el NIT. "
             "Adjuntar el «Certificado de Cámara de Comercio» en PDF de máximo 5 MB, aceptar los términos y "
             "oprimir «Crear cuenta empresarial»."),
        CAP("Registro de empresa", "/register-company (formulario «Registrar empresa»)",
            "Datos diligenciados, NIT con su DV y el PDF adjunto", "Campos «NIT» y «DV», y el certificado "
            "adjunto", VISITANTE),
        PASO(3, "Esperar la aprobación.",
             "Verificar el correo como en el numeral 5.1. Después, un administrador revisa el certificado. "
             "Mientras tanto la empresa no puede iniciar sesión: el inicio de sesión muestra «Tu empresa esta en "
             "revision». Cuando el certificado se aprueba, se puede ingresar y usar el panel de empresa."),
        PASO(4, "Atender un certificado no válido o una empresa rechazada.",
             "Si el administrador marca el certificado como no válido, al iniciar sesión se abre la ventana "
             "«Certificado no válido» con el «Motivo» y los botones «Actualizar certificado» y «Entendido». "
             "Oprimir «Actualizar certificado» y seguir el numeral 7.2.5, paso 4. Si la empresa fue rechazada, la "
             "ventana se titula «Empresa rechazada» y solo ofrece «Entendido»: acudir a la mesa de ayuda."),
        CAP("Certificado no válido", "/login (ventana «Certificado no válido»)",
            "Ventana abierta después de intentar iniciar sesión con una empresa cuyo certificado fue marcado como "
            "inválido, con el motivo visible", "Botón «Actualizar certificado»",
            "Empresa con certificado marcado como inválido (ej. GameZone, gamezone@rehnimarket.test)"),
    ]),
    (2, "5.3", "Inicio de sesión", [
        PASO(1, "Ingresar los datos.",
             "Oprimir «Iniciar sesión», digitar «Correo electrónico» y «Contraseña», y oprimir el botón «Iniciar "
             "sesión». El icono del ojo muestra u oculta la contraseña."),
        CAP("Inicio de sesión", "/login (página «Bienvenido de nuevo»)", "Correo y contraseña diligenciados",
            "Botón «Iniciar sesión» e icono del ojo", VISITANTE),
        PASO(2, "Comprobar el ingreso.",
             "Todos los perfiles llegan a la tienda; si se llegó al inicio de sesión desde una opción protegida, "
             "se regresa a esa opción. Oprimir el nombre en el menú superior: se despliega el menú de la cuenta "
             "con «Inicio», los accesos principales del panel, «Configuración de cuenta» y «Cerrar sesión»."),
        CAP("Menú de la cuenta", "/ (sesión iniciada)", "Menú de la cuenta desplegado con nombre, correo y rol",
            "Menú desplegado (recuadro rojo)", COMPRADOR),
        TABLA(["Perfil", "Panel", "Accesos del menú de la cuenta"], [
            ["Comprador", "/user/dashboard", "Inicio, Mis pedidos, Favoritos, RehniCoins, Configuración de cuenta"],
            ["Empresa", "/company/dashboard", "Inicio, Productos, Pedidos, Finanzas, Mi tienda, Configuración de "
             "cuenta"],
            ["Administrador", "/admin/dashboard", "Inicio, Empresas, Usuarios, Catálogo, Configuración de cuenta"],
            ["Propietario", "/admin/dashboard", "Los del administrador y Liquidaciones"],
        ], [3.0, 3.4, 5.4]),
    ]),
    (2, "5.4", "Recuperación de contraseña", [
        PASO(1, "Solicitar el código.",
             "En el inicio de sesión oprimir «¿Olvidaste tu contraseña?», ingresar el correo y oprimir «Enviar "
             "código». El código vence a los 15 minutos."),
        CAP("Solicitud de recuperación", "/forgot-password (página «¿Olvidaste tu contraseña?»)",
            "Correo digitado", "Botón «Enviar código»", VISITANTE),
        PASO(2, "Crear la contraseña.",
             "Ingresar el «Código de 6 dígitos», la «Nueva contraseña» y «Confirmar contraseña». Oprimir «Guardar "
             "nueva contraseña». Se muestra «Contraseña actualizada correctamente.» y se puede iniciar sesión."),
        CAP("Nueva contraseña", "/reset-password (página «Nueva contraseña»)", "Código y nueva contraseña "
            "diligenciados", "Botón «Guardar nueva contraseña»", VISITANTE),
    ]),
    (2, "5.5", "Cierre de sesión", [
        P("Abrir el menú de la cuenta y oprimir «Cerrar sesión». En los paneles, esta opción aparece al final del "
          "menú lateral. Al cerrar sesión se borran del navegador las credenciales guardadas."),
        CAP("Cierre de sesión", "/user/dashboard (menú lateral)", "Menú lateral completo del panel",
            "Opción «Cerrar sesión» al final del menú", COMPRADOR),
    ]),

    # ------------------------------------------------------------------ 6
    (1, "6", "Mapa de navegación", [
        P("La navegación se divide en la tienda pública y un panel por perfil. Cada panel abre en la opción "
          "«Inicio», que resume el estado de la cuenta. Para acceder a cada opción se deben tener los permisos "
          "correspondientes; de lo contrario, el sistema lleva al inicio de sesión o al inicio del panel propio."),
        IMG("diagramas/png/navegacion.png", "Mapa de navegación por perfil", "mapa"),
    ]),
    (2, "6.1", "Interfaz gráfica", [
        P("La aplicación web fue desarrollada con React. La interfaz hace uso de formularios, listas de "
          "selección, botones, pestañas, ventanas emergentes y alertas."),
        UL("Menú superior (tienda): «Inicio», «Categorías», «Productos», «Ofertas» y «Novedades»; búsqueda, "
           "favoritos, carrito y cuenta. En pantallas pequeñas se abre con «Abrir menú».",
           "Menú lateral (paneles): las opciones de cada perfil, con «Inicio» en primer lugar. Se contrae con "
           "«Contraer menú» y, en pantallas pequeñas, se abre con «Abrir menú de navegación».",
           "Formularios: validan cada campo mientras se escribe y terminan con un botón para enviar.",
           "Ventanas emergentes: muestran detalles y piden confirmación; se cierran con «Cerrar» (X).",
           "Alertas: informan el resultado de cada operación en verde (éxito) o rojo (error) y se cierran con "
           "«Cerrar aviso».",
           "Paginación: permite recorrer las listas con «Anterior» y «Siguiente».",
           "Estados especiales: mientras se cargan los datos se muestra «Cargando…»; si una lista está vacía, un "
           "mensaje como «Tu carrito está vacío» o «Aún no tienes favoritos»; si falla la carga, un mensaje como "
           "«No pudimos cargar tus pedidos»."),
        P("En celulares, la parte inferior de la tienda muestra el aviso «Estás usando RehniMarket en el "
          "navegador. Funciona igual desde tu teléfono; la app para Android llegará pronto.». Es informativo y se "
          "quita con «Cerrar aviso»."),
        P("Funcionalidad en desarrollo: en el pie de página, «Guía de vendedores», «Comisiones», «Centro de "
          "ayuda», «Términos y condiciones», «Política de privacidad» y los iconos de redes sociales aún no tienen "
          "destino. Si se digita una dirección que no existe, la página queda en blanco: volver a la página de "
          "inicio con el logo o con la dirección principal."),
        CAP("Elementos de la interfaz", "/user/dashboard", "Panel con el menú lateral, la barra superior, el "
            "contenido y una alerta de éxito visible", "Menú lateral, barra superior y alerta (recuadros rojos)",
            COMPRADOR),
    ]),
    (2, "6.2", "Opciones de la tienda", [
        TABLA(["Opción", "Icono", "Función", "Perfil"], [
            ["Logo RehniMarket", "—", "Vuelve a la página de inicio", "Todos"],
            ["Inicio", "—", "Muestra anuncios, categorías, ofertas y novedades", "Todos"],
            ["Categorías", "—", "Explora el catálogo por categoría", "Todos"],
            ["Productos", "—", "Lista los productos con filtros", "Todos"],
            ["Ofertas", "—", "Productos con descuento vigente (/offers)", "Todos"],
            ["Novedades", "—", "Productos más recientes (/new)", "Todos"],
            ["Buscar", "Lupa (Search)", "Busca productos, marcas o categorías", "Todos"],
            ["Mis favoritos", "Corazón (Heart)", "Abre los favoritos", "Comprador"],
            ["Mi carrito", "Carrito (ShoppingCart)", "Abre el carrito con la cantidad de productos", "Visitante y "
             "comprador"],
            ["Iniciar sesión / Registrarse", "—", "Dan acceso a la cuenta", "Visitante"],
            ["Menú de la cuenta", "Nombre y foto", "Accesos del panel, «Configuración de cuenta» y «Cerrar sesión» "
             "(LogOut)", "Con sesión"],
            ["Abrir menú / Cerrar menú", "Menú (Menu) / X", "Muestra el menú en pantallas pequeñas", "Todos"],
            ["Anuncio anterior / Siguiente anuncio", "Flechas (ChevronLeft / ChevronRight)", "Recorren el "
             "carrusel de anuncios", "Todos"],
        ], [3.4, 2.8, 4.0, 1.8]),
        CAP("Menú de la tienda", "/", "Menú superior con todas sus opciones visibles, incluidas «Ofertas» y "
            "«Novedades»", "Opciones del menú y los iconos de búsqueda, favoritos y carrito", COMPRADOR),
    ]),
    (2, "6.3", "Opciones del panel del comprador", [
        TABLA(["Opción o botón", "Icono", "Función"], [
            ["Inicio", "Casa (House)", "Resumen de la cuenta (numeral 7.1.1)"],
            ["Mis pedidos", "Paquete (Package)", "Consulta, seguimiento, cancelación y devoluciones"],
            ["Favoritos", "Corazón (Heart)", "Productos guardados"],
            ["RehniCoins", "Monedas (Coins)", "Saldo, movimientos y solicitud de recarga"],
            ["Direcciones", "Ubicación (MapPin)", "Direcciones de envío"],
            ["Configuración de cuenta", "Engranaje (Settings)", "Perfil, correo y contraseña"],
            ["Ver detalle", "Ojo (Eye)", "Abre el detalle de un pedido"],
            ["Quitar de favoritos", "Papelera (Trash2)", "Retira un producto de los favoritos"],
            ["Marcar como predeterminada", "Estrella (Star)", "Define la dirección principal"],
            ["Eliminar dirección", "Papelera (Trash2)", "Borra una dirección"],
            ["Volver a la tienda", "Flecha (ArrowLeft)", "Regresa a la tienda"],
            ["Contraer menú / Expandir menú", "PanelLeftClose / PanelLeft", "Reduce o amplía el menú lateral"],
            ["Cerrar sesión", "Salida (LogOut)", "Finaliza la sesión"],
        ], [3.8, 3.4, 4.6]),
        CAP("Menú del panel del comprador", "/user/dashboard", "Menú lateral expandido con todas las opciones",
            "Opciones del menú lateral", COMPRADOR),
    ]),
    (2, "6.4", "Opciones del panel de empresa", [
        TABLA(["Opción o botón", "Icono", "Función"], [
            ["Inicio", "Casa (House)", "Estado de verificación e indicadores (numeral 7.2.1)"],
            ["Productos", "Paquete (Package)", "Productos, variantes y descuentos"],
            ["Pedidos", "Camión (Truck)", "Pedidos recibidos, envío y estados"],
            ["Devoluciones", "Flecha circular (RotateCcw)", "Solicitudes de devolución"],
            ["Finanzas", "Billetera (Wallet)", "Resumen, liquidaciones y cuentas bancarias"],
            ["Mi tienda", "Tienda (Store)", "Logo, banner, datos públicos y certificado"],
            ["Configuración de cuenta", "Usuario (User)", "Datos del representante"],
            ["Nuevo producto / Agregar", "Más (Plus)", "Crea un producto, una variante o una cuenta"],
            ["Generar", "Varita (Wand2)", "Genera variantes por combinación"],
            ["Editar producto / Editar variante", "Lápiz (Pencil)", "Abre la edición"],
            ["Eliminar producto / Eliminar variante", "Papelera (Trash2)", "Elimina el registro"],
            ["Principal", "Estrella (Star)", "Marca la imagen principal de la variante"],
            ["Ver detalle", "Ojo (Eye)", "Abre un pedido, una devolución o una liquidación"],
            ["Descargar plantilla", "Descarga (Download)", "Descarga la plantilla del logo o del banner"],
            ["Cambiar logo / Cambiar banner", "Subir (Upload)", "Carga las imágenes de la tienda"],
            ["Buscar pedidos / Buscar devoluciones", "Lupa (Search)", "Filtra por referencia, correo o nombre"],
        ], [3.8, 3.4, 4.6]),
        CAP("Menú del panel de empresa", "/company/dashboard", "Menú lateral expandido con todas las opciones",
            "Opciones del menú lateral", EMPRESA),
    ]),
    (2, "6.5", "Opciones del panel administrativo", [
        TABLA(["Opción o botón", "Icono", "Función"], [
            ["Inicio", "Casa (House)", "Estadísticas y actividad (numeral 7.3.1)"],
            ["Empresas", "Edificio (Building2)", "Revisión de certificados y suspensión"],
            ["Usuarios", "Usuarios (Users)", "Consulta, edición, rol, bloqueo y recarga"],
            ["Catálogo", "Paquete (Package)", "Categorías y atributos"],
            ["Anuncios", "Megáfono (Megaphone)", "Carrusel de la página de inicio"],
            ["Reportes", "Gráfica (BarChart3)", "Reportes de productos y empresas"],
            ["Transportadoras", "Camión (Truck)", "Transportadoras para los envíos"],
            ["Liquidaciones (solo propietario)", "Recibo (Receipt)", "Generación y pago de liquidaciones"],
            ["RehniCoin", "Monedas (Coins)", "Recargas y correcciones"],
            ["Configuración de cuenta", "Usuario (User)", "Perfil, correo y contraseña"],
            ["Ver empresa / Ver usuario / Ver reporte / Ver anuncio", "Ojo (Eye)", "Abre el detalle"],
            ["Bloquear / Desbloquear", "Candado (Lock / Unlock)", "Suspende o reactiva una cuenta o empresa"],
            ["Recargar RehniCoin", "Monedas (Coins)", "Recarga el saldo de un usuario desde la lista"],
            ["Atributos y variantes", "Controles (SlidersHorizontal)", "Atributos de una categoría"],
            ["Activar / Desactivar", "Encendido (Power)", "Cambia el estado de una categoría, atributo, anuncio o "
             "transportadora"],
            ["Editar / Eliminar", "Lápiz (Pencil) / Papelera (Trash2)", "Modifica o borra el registro"],
            ["Plantilla web / Plantilla móvil", "Descarga (Download)", "Descargan la base para diseñar anuncios"],
            ["Corregir recarga", "Lápiz (PencilLine)", "Corrige una recarga"],
        ], [3.8, 3.4, 4.6]),
        CAP("Menú del panel administrativo", "/admin/dashboard", "Menú lateral expandido con «Liquidaciones» "
            "visible", "Opciones del menú lateral y «Liquidaciones»", PROPIETARIO),
    ]),

    # ------------------------------------------------------------------ 7
    (1, "7", "Descripción de las funciones del sistema", [
        P("A continuación se describen las funciones por perfil de usuario: comprador y visitante (7.1), empresa "
          "(7.2) y administrador con su subperfil propietario (7.3)."),
    ]),
    (2, "7.1", "Comprador (y visitante)", [
        P("El visitante puede consultar la tienda y armar el carrito; para comprar debe iniciar sesión con una "
          "cuenta de comprador. Las cuentas de empresa y de administración no pueden comprar."),
    ]),
    (3, "7.1.1", "Panel Inicio del comprador", [
        P("Al abrir el panel del comprador se muestra «Inicio» con el saludo «Hola, <nombre>», el texto "
          "«Bienvenido nuevamente a RehniMarket» y un resumen de la cuenta:"),
        UL("«Saldo RehniCoin»: saldo disponible.",
           "«Pedidos pendientes»: pedidos en curso.",
           "«Favoritos»: cantidad de productos guardados.",
           "«Último pedido»: la compra más reciente, con acceso a su detalle.",
           "«Recomendados para ti»: productos sugeridos de la tienda, con el botón «Explorar productos»."),
        CAP("Panel Inicio del comprador", "/user/dashboard", "Saldo, pedidos pendientes, favoritos, último "
            "pedido y recomendados con datos", "Indicadores superiores", COMPRADOR),
    ]),
    (3, "7.1.2", "Consultar y filtrar productos", [
        PASO(1, "Buscar.", "Digitar en «Buscar productos, marcas o categorías…» y seleccionar un resultado. "
             "Mientras busca se muestra «Buscando…»; si no hay coincidencias, «No se encontraron productos»."),
        CAP("Búsqueda de productos", "/ (barra de búsqueda)", "Sugerencias desplegadas para un texto como "
            "«teclado»", "Barra de búsqueda y sugerencias", VISITANTE),
        PASO(2, "Filtrar.", "En «Productos» usar «Categoría», «Rango de precio», «Solo con descuento», «Solo "
             "disponibles» y «Ordenar por». Oprimir «Limpiar» para quitar los filtros. En «Categorías» se puede "
             "buscar una categoría y abrir sus productos."),
        CAP("Filtros del catálogo", "/products", "Filtros aplicados y resultados", "Panel de filtros", VISITANTE),
        PASO(3, "Consultar el detalle.", "Abrir un producto para ver imágenes, precio, IVA, variantes, stock, "
             "«Descripción», «Especificaciones» y «Opiniones de compradores». Oprimir «Ver tienda» para consultar "
             "el perfil de la empresa, con su calificación y sus productos. Si el producto o la empresa ya no "
             "existen se muestra «No encontramos este producto» o «No encontramos esta empresa»."),
        CAP("Detalle del producto", "/products/:id", "Producto con variantes y stock", "Selector de variantes y "
            "stock", VISITANTE),
        CAP("Perfil de la empresa", "/company/:companyId", "Perfil público con productos y calificación",
            "Calificación y botón «Reportar empresa»", VISITANTE),
    ]),
    (3, "7.1.3", "Ofertas y Novedades", [
        P("En el menú superior se encuentran dos accesos directos al catálogo:"),
        UL("«Ofertas» (/offers): productos con un descuento vigente en alguna de sus variantes disponibles. La "
           "tarjeta muestra el mejor precio con descuento.",
           "«Novedades» (/new): lo último que se publicó en RehniMarket, de lo más reciente a lo más antiguo."),
        P("Oprimir «Ofertas» o «Novedades» y luego un producto para abrir su detalle. Si no hay productos se "
          "muestra «No hay ofertas disponibles en este momento.» o «No hay novedades disponibles en este "
          "momento.». La página de inicio incluye las secciones «Ofertas especiales» y «Novedades» con la opción "
          "de ver todas."),
        CAP("Ofertas", "/offers", "Productos con descuento y el precio rebajado", "Precio con descuento de una "
            "tarjeta", VISITANTE),
        CAP("Novedades", "/new", "Productos más recientes", "Título de la página", VISITANTE),
    ]),
    (3, "7.1.4", "Comprar productos", [
        P("Para comprar se necesita una dirección registrada y saldo suficiente."),
        PASO(1, "Agregar al carrito.", "Seleccionar las opciones de la variante y la «Cantidad» con «Aumentar "
             "cantidad» y «Disminuir cantidad». Oprimir «Agregar al carrito» o «Comprar ahora». Si falta una "
             "opción se muestra «Selecciona todas las opciones antes de continuar.»."),
        CAP("Agregar al carrito", "/products/:id", "Variante y cantidad seleccionadas", "Botones «Agregar al "
            "carrito» y «Comprar ahora»", COMPRADOR),
        PASO(2, "Revisar el carrito.", "En «Mi carrito» usar «Agregar una unidad» o «Quitar una unidad», "
             "«Eliminar producto» y «Vaciar carrito». Los productos pueden mostrar «Agotado» o «Sin stock "
             "suficiente». Oprimir «Ir a pagar»; sin sesión, el sistema pide iniciar sesión y vuelve al pago."),
        CAP("Carrito de compras", "/cart", "Productos y resumen", "Botón «Ir a pagar»", COMPRADOR),
        PASO(3, "Elegir la dirección.", "En «Dirección de envío» oprimir «Cambiar» para usar otra dirección. Si no "
             "hay ninguna, oprimir «Elegir dirección para continuar» y luego «Nueva dirección»."),
        CAP("Dirección de envío", "/checkout (ventana «Dirección de entrega»)", "Direcciones registradas y "
            "una seleccionada", "Botón «Continuar»", COMPRADOR),
        PASO(4, "Confirmar la compra.", "Verificar «Subtotal», «IVA», «Total» y «Saldo RehniCoin». Oprimir "
             "«Confirmar compra». El IVA es del 19 % en los productos que lo aplican."),
        CAP("Resumen de la compra", "/checkout", "Resumen con subtotal, IVA, total y saldo", "Botón «Confirmar "
            "compra»", COMPRADOR),
        CAP("Compra confirmada", "/checkout", "Mensaje «¡Tu compra fue confirmada!»", "Mensaje de confirmación",
            COMPRADOR),
        P("Si el carrito tiene productos de varias empresas, se genera un pedido por empresa."),
    ]),
    (3, "7.1.5", "Gestionar pedidos y devoluciones", [
        PASO(1, "Consultar.", "Abrir «Mis pedidos» y oprimir «Ver detalle». El detalle muestra la línea de estados "
             "y los productos."),
        TABLA(["Estado", "Significado"], [
            ["Pendiente", "El pedido se creó."],
            ["Pagado", "El pago en RehniCoin se registró."],
            ["En preparación", "La empresa está alistando el pedido."],
            ["Enviado", "La empresa entregó el pedido a la transportadora."],
            ["Entregado", "El pedido llegó al comprador."],
            ["Cancelado", "El pedido se canceló y el valor se reembolsó en RehniCoin."],
        ], [3.2, 8.6]),
        CAP("Lista de pedidos", "/user/dashboard?tab=orders", "Lista de pedidos con estados distintos",
            "Botón «Ver detalle»", COMPRADOR),
        CAP("Detalle del pedido", "/user/dashboard?tab=orders (ventana del pedido)", "Línea de estados y "
            "productos", "Línea de estados", COMPRADOR),
        PASO(2, "Hacer seguimiento.", "Cuando la empresa registra el envío se muestran «Transportadora» y «Número "
             "de guía». Oprimir «Consultar seguimiento» para abrir la página de la transportadora. Antes se "
             "muestra «Información de envío pendiente»."),
        CAP("Seguimiento del envío", "/user/dashboard?tab=orders (pedido «Enviado»)", "Transportadora y número de "
            "guía", "Botón «Consultar seguimiento»", COMPRADOR),
        PASO(3, "Cancelar.", "Oprimir «Cancelar pedido» y confirmar. Solo se puede cancelar en estado «Pendiente» "
             "o «Pagado». El valor se reembolsa en RehniCoin y el stock se repone automáticamente."),
        CAP("Cancelación del pedido", "/user/dashboard?tab=orders (pedido «Pagado»)", "Confirmación de "
            "cancelación abierta", "Botón «Cancelar pedido»", COMPRADOR),
        PASO(4, "Solicitar una devolución.", "En un pedido «Entregado», en el producto oprimir «Solicitar "
             "devolución», escribir el «Motivo de la devolución» (entre 5 y 500 caracteres) y oprimir «Enviar "
             "solicitud». Se muestra «Solicitud de devolución enviada. La empresa la revisará.». La empresa "
             "decide y, si aprueba, el valor del producto regresa a RehniCoin."),
        TABLA(["Estado de la devolución", "Significado"], [
            ["En revisión", "La empresa aún no ha decidido."],
            ["Aprobada", "El valor se reembolsó en RehniCoin."],
            ["Rechazada", "La empresa no aceptó la solicitud; se muestra su motivo."],
        ], [4.2, 7.6]),
        CAP("Solicitud de devolución", "/user/dashboard?tab=orders (pedido «Entregado»)", "Formulario "
            "«Solicitar devolución» con el motivo", "Campo del motivo y botón «Enviar solicitud»", COMPRADOR),
    ]),
    (3, "7.1.6", "Gestionar RehniCoin", [
        PASO(1, "Consultar.", "Abrir «RehniCoins» para ver «Saldo disponible» y «Movimientos». Cada movimiento "
             "indica su tipo: «Recarga», «Compra», «Reembolso» o «Ajuste»."),
        CAP("Billetera RehniCoin", "/user/dashboard?tab=wallet", "Saldo y movimientos de varios tipos",
            "Saldo disponible", COMPRADOR),
        PASO(2, "Solicitar una recarga.", "Oprimir «Recargar RehniCoins», elegir un valor u «Otra cantidad» y "
             "oprimir «Confirmar solicitud». Se muestra «Solicitud de recarga preparada. Continúa la conversación "
             "en WhatsApp.» y se abre WhatsApp con el mensaje. La recarga no es automática: un administrador la "
             "acredita después de verificar el pago."),
        CAP("Solicitud de recarga", "/user/dashboard?tab=wallet (ventana «Recargar RehniCoins»)", "Una cantidad "
            "seleccionada", "Botón «Confirmar solicitud»", COMPRADOR),
    ]),
    (3, "7.1.7", "Direcciones, favoritos, cuenta, reseñas y reportes", [
        PASO(1, "Administrar direcciones.", "En «Direcciones» oprimir «Agregar dirección». Ingresar «Nombre de "
             "referencia», «Nombre completo», «Teléfono», «Dirección», «Ciudad» y «Departamento»; las "
             "«Indicaciones adicionales (opcional)» no son obligatorias. Oprimir «Guardar dirección». Usar "
             "«Marcar como predeterminada» o «Eliminar dirección» según se necesite."),
        CAP("Direcciones", "/user/dashboard?tab=addresses", "Formulario de dirección diligenciado",
            "Botón «Guardar dirección»", COMPRADOR),
        PASO(2, "Administrar favoritos.", "Oprimir el icono de corazón de un producto. Consultar la lista en "
             "«Favoritos» y usar «Quitar de favoritos» para retirarlo."),
        CAP("Favoritos", "/user/dashboard?tab=favorites", "Productos guardados", "Botón «Quitar de favoritos»",
            COMPRADOR),
        PASO(3, "Configurar la cuenta.", "En «Configuración de cuenta» se muestran las secciones «Perfil», "
             "«Cuenta» y «Seguridad». Usar «Cambiar foto» y «Editar perfil» (nombre y teléfono), «Editar correo» "
             "y «Cambiar contraseña»; esta última envía un código al correo y continúa como en el numeral 5.4. "
             "Esta opción es igual para todos los perfiles."),
        CAP("Configuración de cuenta", "/user/dashboard?tab=profile", "Secciones «Perfil», «Cuenta» y "
            "«Seguridad»", "Botones «Editar perfil», «Editar correo» y «Cambiar contraseña»", COMPRADOR),
        PASO(4, "Escribir una reseña.", "Solo es posible en productos entregados y una vez por producto. En el "
             "detalle del producto seleccionar la calificación, completar «Escribe tu reseña» y oprimir «Enviar "
             "reseña». Se muestra «¡Gracias por tu reseña!». La reseña se puede editar o borrar con «Eliminar "
             "reseña»."),
        CAP("Reseña del producto", "/products/:id (sección «Opiniones de compradores»)", "Formulario de reseña "
            "con la calificación", "Estrellas y botón «Enviar reseña»", COMPRADOR),
        PASO(5, "Reportar.", "Oprimir «Reportar» en un producto o «Reportar empresa» en un perfil. Escribir el "
             "«Motivo», agregar «Descripción (opcional)» y «Evidencias (opcional)» con «Añadir imágenes» (hasta 5 "
             "imágenes JPEG, PNG o WEBP de máximo 5 MB cada una). Oprimir «Enviar reporte»."),
        CAP("Reporte de producto", "/products/:id (ventana de reporte)", "Motivo y una evidencia cargada",
            "Botón «Enviar reporte»", COMPRADOR),
    ]),

    (2, "7.2", "Empresa (vendedor)", [
        P("Las funciones de este capítulo requieren una empresa con el certificado aprobado (numeral 5.2)."),
    ]),
    (3, "7.2.1", "Panel Inicio de la empresa y estado de verificación", [
        P("Al abrir el panel de empresa se muestra «Inicio» con el banner, el logo, el nombre de la empresa, el año "
          "desde el que es miembro y una etiqueta con el estado de verificación:"),
        TABLA(["Etiqueta", "Significado", "Qué hacer"], [
            ["Empresa verificada", "El certificado fue aprobado.", "Usar todas las opciones del panel."],
            ["Empresa pendiente de verificación", "El certificado volvió a revisión.", "Esperar la revisión."],
            ["Certificado no válido", "El administrador pidió un certificado nuevo.",
             "Actualizar el certificado (numeral 7.2.5, paso 4)."],
            ["Empresa rechazada", "El administrador rechazó la empresa.", "Acudir a la mesa de ayuda."],
        ], [3.8, 4.0, 4.0]),
        P("Las etiquetas distintas de «Empresa verificada» solo se ven si el estado cambia durante una sesión "
          "abierta: en el siguiente inicio de sesión se aplica lo descrito en el numeral 5.2."),
        P("«Inicio» muestra además los indicadores «Productos publicados» (total en el catálogo), «Activos» "
          "(visibles para compradores), «Ocultos» (desactivados) y «Agotados» (sin stock disponible), y la tabla "
          "«Productos recientes» con producto, precio, stock y estado, con el acceso «Ver todos →»."),
        CAP("Panel Inicio de la empresa", "/company/dashboard", "Etiqueta «Empresa verificada», indicadores y "
            "productos recientes", "Etiqueta de verificación e indicadores", EMPRESA),
    ]),
    (3, "7.2.2", "Administrar productos", [
        PASO(1, "Crear el producto.", "En «Productos» oprimir «Nuevo producto». Ingresar «Nombre del producto», "
             "«Categoría» y «Descripción». Marcar «Este producto aplica IVA (19%)» si corresponde, completar "
             "«Especificaciones del producto» y oprimir «Crear y agregar variantes»."),
        CAP("Nuevo producto", "/company/dashboard?tab=products (formulario «Crear nuevo producto»)", "Datos "
            "diligenciados", "Botón «Crear y agregar variantes»", EMPRESA),
        PASO(2, "Crear variantes.", "Cada variante es la unidad que se vende. En «Variantes» oprimir «Generar», "
             "seleccionar «Ejes a combinar», «Precio base» y «Stock base». Oprimir «Ver combinaciones» y luego "
             "«Crear seleccionadas». Para una sola variante oprimir «Agregar», ingresar «Nombre», «SKU», "
             "«Precio», «Stock» e «Imágenes», y oprimir «Crear variante». En las imágenes, la estrella "
             "«Principal» define la que se muestra primero; la imagen de la tarjeta del producto es la principal "
             "de la primera variante disponible."),
        CAP("Generación de variantes", "/company/dashboard?tab=products (ventana «Generar combinaciones»)",
            "Ejes seleccionados y combinaciones listadas", "Botón «Crear seleccionadas»", EMPRESA),
        CAP("Variante", "/company/dashboard?tab=products (ventana «Agregar variante»)", "Precio, stock e "
            "imágenes con una marcada como «Principal»", "Estrella «Principal»", EMPRESA),
        PASO(3, "Configurar descuentos.", "Seleccionar «Tipo»: «Porcentaje (%)» o «Monto fijo ($)». Definir "
             "«Inicio (opcional)» y «Fin (opcional)». Una variante puede tener «Descuento de la variante» propio; "
             "si no lo tiene, se aplica el del producto. Un producto con descuento vigente aparece en «Ofertas»."),
        CAP("Descuento", "/company/dashboard?tab=products (edición del producto)", "Descuento diligenciado",
            "Campos de descuento", EMPRESA),
        PASO(4, "Mantener los productos.", "En la lista usar «Buscar producto…», «Editar producto», «Desactivar "
             "producto» o «Activar producto», y «Eliminar producto». En «Variantes», «Mostrar variantes "
             "eliminadas» permite ver las que se eliminaron; una combinación eliminada se puede volver a crear."),
        CAP("Lista de productos", "/company/dashboard?tab=products", "Lista con productos activos, inactivos y "
            "agotados", "Acciones de una fila", EMPRESA),
    ]),
    (3, "7.2.3", "Gestionar pedidos", [
        PASO(1, "Consultar el pedido.", "En «Pedidos» usar las pestañas «Todos», «Pendientes», «En proceso» (pedidos "
             "en preparación y enviados), «Completados» y «Cancelados», y el buscador «Buscar por referencia, "
             "correo o nombre del comprador…». Oprimir «Ver detalle»."),
        CAP("Pedidos de la empresa", "/company/dashboard?tab=orders", "Pestañas y lista de pedidos",
            "Pestañas y buscador", EMPRESA),
        PASO(2, "Registrar el envío.", "Oprimir «Editar envío», seleccionar la «Transportadora», escribir el "
             "«Número de guía» (entre 3 y 80 caracteres) y oprimir «Guardar información de envío». Si no se elige "
             "transportadora se muestra «Selecciona una transportadora.»."),
        CAP("Información de envío", "/company/dashboard?tab=orders (detalle del pedido)", "Transportadora y "
            "número de guía diligenciados", "Botón «Guardar información de envío»", EMPRESA),
        PASO(3, "Avanzar el estado.", "Oprimir, en orden, «Iniciar procesamiento», «Marcar enviado» y «Marcar "
             "entregado». Cada cambio muestra «Pedido <referencia> actualizado a …»."),
        CAP("Cambio de estado", "/company/dashboard?tab=orders (pedido «Pagado»)", "Detalle del pedido con el "
            "botón de avance", "Botón «Iniciar procesamiento»", EMPRESA),
    ]),
    (3, "7.2.4", "Resolver devoluciones", [
        PASO(1, "Filtrar las solicitudes.", "En «Devoluciones» usar las pestañas «Todas», «En revisión», "
             "«Aprobadas» y «Rechazadas», y el buscador por referencia, correo o nombre del comprador. Las "
             "solicitudes nuevas quedan en «En revisión»."),
        CAP("Pestañas de devoluciones", "/company/dashboard?tab=returns", "Pestañas «Todas», «En revisión», "
            "«Aprobadas» y «Rechazadas» con solicitudes", "Pestañas", EMPRESA),
        PASO(2, "Decidir.", "Oprimir «Ver detalle», revisar el «Motivo del comprador» y oprimir «Aprobar "
             "devolución» o «Rechazar devolución». Para rechazar es obligatorio el «Motivo del rechazo». Al "
             "aprobar, el valor del producto se reembolsa en RehniCoin al comprador."),
        CAP("Resolución de devolución", "/company/dashboard?tab=returns (detalle)", "Solicitud «En revisión» con "
            "el motivo del comprador", "Botones «Aprobar devolución» y «Rechazar devolución»", EMPRESA),
    ]),
    (3, "7.2.5", "Finanzas, Mi tienda y certificado", [
        PASO(1, "Consultar finanzas.", "En «Finanzas» se muestran el «Resumen financiero» («Ventas acumuladas», "
             "«Comisión Rehni Market», «Saldo neto pendiente» y «Próxima liquidación»), las «Liquidaciones» y las "
             "«Cuentas bancarias». La comisión de la plataforma es del 5 %."),
        CAP("Resumen financiero", "/company/dashboard?tab=finance", "Resumen con valores", "Indicadores del "
            "resumen", EMPRESA),
        PASO(2, "Registrar la cuenta bancaria.", "En «Cuentas bancarias» oprimir «Nueva cuenta». Ingresar "
             "«Titular de la cuenta», «Documento», «Banco», «Tipo de cuenta» («Ahorros», «Corriente», «Nequi» o "
             "«Daviplata») y «Número de cuenta». Marcar «Cuenta predeterminada (a esta se giran las "
             "liquidaciones)» y oprimir «Guardar cuenta». Sin cuenta predeterminada no se puede liquidar."),
        CAP("Cuenta bancaria", "/company/dashboard?tab=finance (formulario de cuenta)", "Datos diligenciados",
            "Casilla «Cuenta predeterminada»", EMPRESA),
        PASO(3, "Actualizar la tienda.", "En «Mi tienda» usar «Cambiar logo», «Cambiar banner» y «Actualizar "
             "imágenes»; «Descargar plantilla» entrega la base de cada imagen. Oprimir «Editar» para cambiar los "
             "datos públicos y «Guardar». La sección «Estado de la empresa» muestra el estado de verificación y, "
             "si aplica, el «Motivo del rechazo»."),
        CAP("Mi tienda", "/company/dashboard?tab=company", "Logo, banner, información y estado de la empresa",
            "Botones «Descargar plantilla» y «Editar»", EMPRESA),
        PASO(4, "Actualizar el certificado.", "Si fue marcado como no válido, oprimir «Actualizar certificado» "
             "(en la ventana del inicio de sesión o en «Mi tienda»). En /actualizar-certificado ingresar el correo, "
             "la contraseña y el «Nuevo certificado» en PDF de máximo 5 MB. La empresa vuelve a revisión. Una "
             "empresa rechazada no puede hacerlo y debe contactar a la mesa de ayuda."),
        CAP("Actualización del certificado", "/actualizar-certificado", "Correo, contraseña y PDF seleccionado",
            "Campo «Nuevo certificado»", "Empresa con certificado marcado como inválido (sin sesión)"),
    ]),
    (3, "7.2.6", "Configuración de cuenta de la empresa", [
        P("La opción «Configuración de cuenta» del panel de empresa administra los datos del representante (la "
          "persona que inicia sesión), no los de la tienda, que se editan en «Mi tienda»."),
        PASO(1, "Editar el perfil.", "En «Perfil» oprimir «Cambiar foto» para subir la foto, y «Editar perfil» para "
             "cambiar el nombre (mínimo 3 caracteres) y el teléfono (10 dígitos). Oprimir «Guardar»."),
        PASO(2, "Cambiar el correo.", "En «Cuenta» oprimir «Editar correo», digitar el nuevo correo y oprimir "
             "«Guardar». Si el correo ya está en uso se muestra «No se pudo actualizar el correo. Es posible que ya "
             "esté en uso.»."),
        PASO(3, "Cambiar la contraseña.", "En «Seguridad» oprimir «Cambiar contraseña» y luego «Enviar código». "
             "Continuar con el código recibido como en el numeral 5.4."),
        CAP("Configuración de cuenta de la empresa", "/company/dashboard?tab=profile", "Secciones «Perfil», "
            "«Cuenta» y «Seguridad»", "Botón «Editar perfil»", EMPRESA),
    ]),

    (2, "7.3", "Administrador (y subperfil Propietario)", [
        P("El propietario usa el mismo panel administrativo y tiene todas las funciones de este capítulo. Además, "
          "solo él puede generar y pagar liquidaciones (numeral 7.3.8) y asignar o gestionar cuentas con el rol "
          "propietario."),
    ]),
    (3, "7.3.1", "Panel Inicio del administrador", [
        P("Al abrir el panel administrativo se muestra «Inicio» con el «Resumen general de RehniMarket.»:"),
        UL("«Usuarios»: registrados, activos, bloqueados y administradores.",
           "«Empresas»: registradas, activas y bloqueadas.",
           "«Usuarios recientes»: últimos usuarios registrados, con su rol y estado, y el acceso «Ver todos →».",
           "«Actividad reciente»: últimos movimientos administrativos (aprobaciones, bloqueos y cambios)."),
        CAP("Panel Inicio del administrador", "/admin/dashboard", "Indicadores de usuarios y empresas, usuarios "
            "recientes y actividad reciente", "Indicadores superiores", ADMIN),
    ]),
    (3, "7.3.2", "Gestionar empresas", [
        PASO(1, "Revisar el certificado.", "En «Empresas» usar los filtros «Todas», «Pendientes», «Certificado "
             "inválido», «Rechazadas» y «Aprobadas», y el buscador por correo, teléfono, NIT o empresa. Oprimir "
             "«Ver empresa» y luego «Ver certificado»."),
        CAP("Empresas", "/admin/dashboard?tab=companies", "Filtros y lista con empresas en distintos estados",
            "Filtro de certificado y botón «Ver empresa»", ADMIN),
        PASO(2, "Decidir.", "Oprimir «Aprobar certificado» o «Rechazar o solicitar cambios». En este último, "
             "elegir «Rechazar» o «Certificado inválido — Solicitar actualización», escribir el «Motivo» y oprimir "
             "«Confirmar». La empresa recibe la decisión por correo."),
        CAP("Revisión del certificado", "/admin/dashboard?tab=companies (ventana «Revisar certificado»)",
            "Opciones y motivo diligenciado", "Opciones de la decisión", ADMIN),
        PASO(3, "Suspender o desbloquear una empresa.", "Oprimir «Bloquear empresa», escribir el «Motivo de "
             "suspensión» y confirmar con «Suspender empresa». Los pedidos en curso se cancelan y se reembolsan; el "
             "mensaje indica cuántos pedidos se procesaron. Para reactivarla, oprimir «Desbloquear empresa» y "
             "confirmar con «Desbloquear»."),
        CAP("Suspensión de empresa", "/admin/dashboard?tab=companies (ventana «¿Suspender la empresa…?»)",
            "Motivo diligenciado", "Botón «Suspender empresa»", ADMIN),
    ]),
    (3, "7.3.3", "Gestionar usuarios", [
        PASO(1, "Consultar.", "En «Usuarios» buscar la cuenta con «Buscar usuario, correo o teléfono…» y oprimir "
             "«Ver usuario»."),
        PASO(2, "Editar o cambiar el rol.", "Oprimir «Editar información», modificar el correo o el «Cambio de "
             "rol» y oprimir «Guardar cambios». El rol de una empresa no se puede modificar («Rol protegido»), y "
             "solo un propietario puede asignar el rol propietario o modificar una cuenta propietario («Solo un "
             "Owner puede gestionar esta cuenta.»). Una cuenta no puede modificarse a sí misma desde esta opción."),
        PASO(3, "Bloquear, desbloquear o recargar.", "Usar «Bloquear usuario» o «Desbloquear usuario». El botón "
             "«Recargar RehniCoin» de la lista abre una ventana para recargar el saldo de esa cuenta con una "
             "descripción, igual que en el numeral 7.3.7."),
        CAP("Usuarios", "/admin/dashboard?tab=users (ventana «Detalle de usuario»)", "Detalle en modo edición "
            "con el cambio de rol", "Campo «Cambio de rol» y botón «Guardar cambios»", ADMIN),
    ]),
    (3, "7.3.4", "Catálogo y transportadoras", [
        PASO(1, "Administrar categorías.", "En «Catálogo» oprimir «Nueva categoría», ingresar «Nombre», "
             "«Descripción», «Orden visual» (menor número aparece primero), «Estado» e imagen con «Subir imagen». "
             "En la lista usar «Editar categoría», «Activar categoría» o «Desactivar categoría» y «Eliminar "
             "categoría»."),
        PASO(2, "Definir atributos.", "Oprimir «Atributos y variantes» en una categoría. Ingresar «Nombre», «Rol» "
             "(«Atributo de producto» o «Eje de variante»), «Entrada» («Texto», «Número», «Lista de opciones» o "
             "«Color») y «Unidad», y oprimir «Agregar». Los valores de una lista se agregan con «Nuevo valor». Un "
             "atributo en uso no se puede eliminar, pero sí desactivar."),
        CAP("Atributos de categoría", "/admin/dashboard?tab=products (ventana «Atributos y variantes»)",
            "Atributos de una categoría con sus opciones", "Botón «Agregar»", ADMIN),
        PASO(3, "Administrar transportadoras.", "En «Transportadoras» oprimir «Nueva transportadora», ingresar "
             "«Nombre» y «URL de seguimiento», y oprimir «Crear transportadora». Las empresas solo ven las "
             "transportadoras activas; usar «Activar» o «Desactivar» y «Editar transportadora»."),
        CAP("Transportadoras", "/admin/dashboard?tab=carriers", "Lista y formulario de transportadora",
            "Botón «Nueva transportadora»", ADMIN),
    ]),
    (3, "7.3.5", "Gestionar anuncios", [
        P("Los anuncios son las imágenes del carrusel de la página de inicio. Son solo visuales: se componen de una "
          "imagen, una imagen opcional para pantallas pequeñas y un destino al que lleva el clic."),
        PASO(1, "Diseñar la imagen.", "En «Anuncios» oprimir «Plantilla web» o «Plantilla móvil» para descargar la "
             "base del diseño. La imagen móvil se usa en pantallas pequeñas; si no se sube, se usa la imagen "
             "principal."),
        PASO(2, "Crear el anuncio.", "Oprimir «Nuevo anuncio». Cargar la imagen con «Subir imagen» y, si se desea, "
             "«Subir imagen móvil». Definir «Orden» y «Estado»."),
        PASO(3, "Elegir el tipo de anuncio.", "Seleccionar el «Tipo de anuncio». El destino se calcula solo según "
             "el tipo:"),
        TABLA(["Tipo de anuncio", "Configuración requerida", "Destino del clic"], [
            ["Producto específico", "Buscar y seleccionar el producto", "Detalle del producto"],
            ["Categoría", "Seleccionar la categoría; descuento opcional con «Habilitar descuento»",
             "Productos de la categoría"],
            ["Empresa", "Buscar y seleccionar la empresa", "Perfil público de la empresa"],
            ["Promoción", "«Porcentaje de descuento»", "Productos con al menos ese descuento"],
            ["Black Friday", "«Porcentaje de descuento»", "Productos con al menos ese descuento"],
            ["Cyber Days", "«Porcentaje de descuento»", "Productos con al menos ese descuento"],
            ["Liquidación", "Descuento y/o «Stock máximo»", "Productos con descuento o pocas unidades"],
            ["Nuevos lanzamientos", "«Días máximos desde la creación»", "Productos publicados en esos días"],
        ], [3.4, 4.4, 4.0]),
        PASO(4, "Revisar y mantener.", "Usar «Ver anuncio» para la vista previa en «Desktop / tablet» y «Móvil», y "
             "los iconos de la lista para «Editar anuncio», «Activar anuncio» o «Desactivar anuncio» y «Eliminar "
             "anuncio»."),
        CAP("Tipos de anuncio", "/admin/dashboard?tab=hero (ventana «Nuevo anuncio»)", "«Tipo de anuncio» "
            "desplegado y una imagen cargada", "Lista «Tipo de anuncio»", ADMIN),
        CAP("Vista previa del anuncio", "/admin/dashboard?tab=hero (ventana «Vista previa del anuncio»)",
            "Vista «Desktop / tablet» y «Móvil»", "Las dos vistas", ADMIN),
    ]),
    (3, "7.3.6", "Atender reportes", [
        PASO(1, "Filtrar.", "En «Reportes» usar los filtros de estado («Todos», «Pendientes», «En revisión», "
             "«Resueltos», «Rechazados») y de tipo («Productos», «Empresas»), y el buscador por producto, empresa, "
             "motivo o usuario."),
        PASO(2, "Gestionar.", "Oprimir «Ver reporte». Revisar el «Motivo», la «Descripción» y las «Evidencias». "
             "Oprimir «Marcar en revisión», «Resolver» o «Rechazar», agregar la «Respuesta administrativa "
             "(opcional)» y confirmar. Un reporte resuelto ya no se puede modificar. Desde un reporte se puede "
             "abrir el producto o la empresa y usar «Suspender empresa»."),
        CAP("Detalle del reporte", "/admin/dashboard?tab=reports (ventana «Detalle del reporte»)", "Reporte con "
            "evidencias y acciones", "Botones «Marcar en revisión», «Resolver» y «Rechazar»", ADMIN),
    ]),
    (3, "7.3.7", "Recargar y corregir RehniCoin", [
        PASO(1, "Recargar saldo.", "Después de verificar el pago, en «RehniCoin» ingresar «Correo del usuario», "
             "«Cantidad (RC)» y «Descripción (opcional)». Oprimir «Recargar saldo». El máximo por operación es de "
             "10.000.000 RC. Se muestra el nombre del usuario y su nuevo saldo."),
        CAP("Recarga de RehniCoin", "/admin/dashboard?tab=wallet", "Formulario diligenciado y «Últimas recargas»",
            "Botón «Recargar saldo»", ADMIN),
        PASO(2, "Corregir una recarga.", "En «Últimas recargas» oprimir «Corregir recarga», ingresar «Nueva "
             "cantidad correcta (RC)» y «Motivo de la corrección». Una recarga solo se puede corregir una vez "
             "(queda marcada como «Corregida») y la corrección no puede dejar el saldo en negativo."),
        CAP("Corrección de recarga", "/admin/dashboard?tab=wallet (ventana «Corregir recarga»)", "Nueva cantidad "
            "y motivo", "Campo «Nueva cantidad correcta (RC)»", ADMIN),
    ]),
    (3, "7.3.8", "Liquidaciones (solo propietario)", [
        P("Una liquidación es el pago mensual a una empresa por sus ventas entregadas: comisión del 5 % y giro del "
          "95 % neto a su cuenta bancaria predeterminada."),
        PASO(1, "Filtrar.", "En «Liquidaciones» usar los filtros «Todas», «Pendientes», «Procesando», «Pagadas» y "
             "«Fallidas»."),
        TABLA(["Estado", "Significado"], [
            ["Pendiente", "La liquidación se generó y espera el pago."],
            ["Procesando", "El pago está en trámite."],
            ["Pagada", "El pago se registró y se notificó a la empresa."],
            ["Fallida", "El pago no se pudo completar."],
        ], [3.2, 8.6]),
        CAP("Filtros de liquidaciones", "/admin/dashboard?tab=payouts", "Filtros y lista de liquidaciones",
            "Filtros «Todas», «Pendientes», «Procesando», «Pagadas» y «Fallidas»", PROPIETARIO),
        PASO(2, "Generar.", "Oprimir «Generar liquidación». Buscar la «Empresa», seleccionar «Mes a liquidar» y "
             "revisar la «Vista previa». Oprimir «Generar liquidación»."),
        CAP("Generación de liquidación", "/admin/dashboard?tab=payouts (ventana «Generar liquidación»)",
            "Vista previa calculada", "Vista previa y botón «Generar liquidación»", PROPIETARIO),
        PASO(3, "Pagar.", "Transferir el valor fuera de la plataforma. Oprimir «Ver detalle», «Marcar como pagada» "
             "y «Confirmar pago». Se envía un correo a la empresa."),
        CAP("Pago de liquidación", "/admin/dashboard?tab=payouts (ventana «Marcar liquidación como pagada»)",
            "Valor y cuenta destino", "Botón «Confirmar pago»", PROPIETARIO),
    ]),
    (3, "7.3.9", "Configuración de cuenta del administrador", [
        P("La opción «Configuración de cuenta» del panel administrativo es la misma de los demás perfiles: "
          "«Perfil» (foto, nombre y teléfono), «Cuenta» (correo) y «Seguridad» (cambio de contraseña con código al "
          "correo). Seguir los pasos del numeral 7.2.6."),
        P("Un administrador no puede cambiar su propio rol ni bloquearse desde «Usuarios»: los cambios de su cuenta "
          "se hacen aquí y los de rol, con otro administrador o con el propietario."),
        CAP("Configuración de cuenta del administrador", "/admin/dashboard?tab=account", "Secciones «Perfil», "
            "«Cuenta» y «Seguridad»", "Botón «Cambiar contraseña»", ADMIN),
    ]),

    # ------------------------------------------------------------------ 8
    (1, "8", "Información sobre la mesa de ayuda", [
        P("La mesa de ayuda brinda soporte de primer nivel a los usuarios. Los casos que no puede resolver se "
          "escalan al desarrollador, según los acuerdos de niveles de servicio del Manual técnico."),
        TABLA(["Dato", "Detalle"], [
            ["Correo de soporte", SOPORTE["correo"]],
            ["Horario de atención", SOPORTE["horario"]],
            ["Herramienta de casos", f"GitHub Issues: {SOPORTE['issues']}"],
            ["Recargas de RehniCoin", "WhatsApp, desde la opción «Recargar RehniCoins» (no es un canal de "
             "soporte)"],
        ], [3.6, 8.2]),
        SUB("Cuándo acudir a la mesa de ayuda"),
        UL("Cuenta bloqueada, o empresa suspendida o rechazada.",
           "Recarga de RehniCoin pagada y no acreditada, o acreditada con un valor incorrecto.",
           "Pedido con saldo o stock inconsistente.",
           "Cambios de rol o permisos de una cuenta.",
           "Mensajes «Error interno del servidor.» u «Ocurrió un error inesperado.» que persisten después de "
           "reintentar.",
           "Una página en blanco al abrir un enlace.",
           "Cualquier comportamiento distinto al descrito en este manual."),
        SUB("Cómo reportar un caso"),
        OL("Escribir al correo de soporte o crear un issue en GitHub Issues con un título corto.",
           "Indicar el perfil, la opción del menú y los pasos realizados.",
           "Copiar el mensaje exacto que mostró el sistema y adjuntar una captura de pantalla.",
           "No incluir contraseñas ni códigos de verificación."),
    ]),

    # ------------------------------------------------------------------ 9
    (1, "9", "Descripción de los mensajes de error", [
        P("Los mensajes se muestran tal como los envía el sistema, en alertas en la parte superior de la pantalla o "
          "bajo el campo correspondiente. Se agrupan en mensajes del servidor (9.1), validaciones en vivo de los "
          "formularios (9.2), mensajes de sesión (9.3) y mensajes propios de la interfaz (9.4). {n} indica un "
          "valor que cambia en cada caso."),
        CAP("Mensaje del servidor", "/login", "Alerta «Correo o contraseña incorrecta.» después de un intento "
            "fallido", "Alerta (recuadro rojo)", VISITANTE),
        CAP("Validación en vivo", "/register-user", "Mensaje «El número de teléfono debe tener exactamente 10 "
            "dígitos.» bajo el campo", "Mensaje bajo el campo", VISITANTE),
        CAP("Sesión expirada", "/login", "Aviso «Tu sesión ha expirado. Inicia sesión nuevamente.»", "Aviso",
            VISITANTE),
        CAP("Estado vacío", "/cart", "Mensaje «Tu carrito está vacío»", "Mensaje del estado vacío", VISITANTE),
    ]),
]

# Mensaje | Dónde aparece | Causa | Acción a seguir
E = lambda m, d, c, a: [m, d, c, a]

ERRORES_SERVIDOR = [
    E("Correo o contraseña incorrecta.", "Inicio de sesión", "Los datos no coinciden.",
      "Verificar los datos o recuperar la contraseña."),
    E("Tu correo no ha sido verificado. Te enviamos un código de verificación a tu correo electrónico.",
      "Inicio de sesión", "La cuenta no tiene el correo verificado.", "Ingresar el código recibido."),
    E("Tu cuenta se encuentra bloqueada. Contacta con un administrador.", "Inicio de sesión",
      "La cuenta fue bloqueada.", "Acudir a la mesa de ayuda."),
    E("Tu empresa esta en revision", "Inicio de sesión de empresa", "El certificado está pendiente.",
      "Esperar la revisión."),
    E("El certificado que presentaste no es válido. Debes subir uno nuevo para que tu empresa vuelva a revisión.",
      "Inicio de sesión de empresa", "El certificado fue marcado como inválido.",
      "Oprimir «Actualizar certificado»."),
    E("Tu empresa fue rechazada. Para volver a operar debe intervenir un administrador.",
      "Inicio de sesión de empresa", "La empresa fue rechazada.", "Acudir a la mesa de ayuda."),
    E("Tu empresa se encuentra suspendida.", "Inicio de sesión y panel de empresa", "La empresa fue suspendida; "
      "se muestra también el motivo.", "Acudir a la mesa de ayuda."),
    E("El correo ya se encuentra registrado", "Registro", "El correo ya tiene una cuenta.",
      "Iniciar sesión o usar otro correo."),
    E("El NIT ya se encuentra registrado", "Registro de empresa", "El NIT ya pertenece a otra empresa.",
      "Verificar el NIT."),
    E("Las contraseñas no coinciden.", "Registro y recuperación", "«Contraseña» y «Confirmar contraseña» son "
      "distintas.", "Digitar la misma contraseña en los dos campos."),
    E("La contraseña debe tener al menos 8 caracteres.", "Registro", "La contraseña es corta.",
      "Usar una contraseña de 8 caracteres o más."),
    E("El código de verificación es incorrecto.", "Verificación de correo", "El código no coincide.",
      "Revisar el código del correo."),
    E("El código de verificación ha expirado. Solicita un nuevo código.", "Verificación de correo",
      "Pasaron más de 5 minutos.", "Oprimir «Reenviar código»."),
    E("Debes esperar antes de solicitar un nuevo código de verificación.", "Verificación de correo",
      "Pasaron menos de 60 segundos.", "Esperar y reintentar."),
    E("El codigo de recuperacion es incorrecto", "Recuperación de contraseña", "El código no coincide.",
      "Revisar el código o solicitar uno nuevo."),
    E("No existe una cuenta registrada con ese correo.", "Recuperación de contraseña", "El correo no existe.",
      "Verificar el correo."),
    E("El certificado debe ser un archivo PDF.", "Registro de empresa y certificado", "El archivo no es PDF.",
      "Adjuntar un PDF."),
    E("El certificado debe pesar como máximo 5 MB.", "Registro de empresa y certificado",
      "El archivo es muy grande.", "Reducir el archivo."),
    E("Tu carrito está vacío.", "Checkout", "No hay productos en el carrito.", "Agregar productos."),
    E("Debes registrar una dirección para continuar con la compra.", "Checkout", "No hay dirección de envío.",
      "Agregar una dirección."),
    E("Tu saldo de RehniCoin no alcanza para completar la compra.", "Checkout", "El saldo es insuficiente.",
      "Solicitar una recarga."),
    E("Solo hay {n} unidades disponibles.", "Carrito", "La cantidad supera el stock.", "Reducir la cantidad."),
    E("Producto sin stock disponible.", "Carrito", "El producto está agotado.", "Elegir otro producto."),
    E("Este producto requiere seleccionar una variante.", "Carrito", "Falta elegir la variante.",
      "Seleccionar las opciones."),
    E("Solo las cuentas de tipo comprador pueden realizar compras.", "Carrito", "La cuenta no es de comprador.",
      "Usar una cuenta de comprador."),
    E("Este pedido ya está en preparación y no se puede cancelar.", "Mis pedidos", "El pedido avanzó de estado.",
      "Acudir a la mesa de ayuda."),
    E("Este pedido ya fue cancelado y reembolsado.", "Mis pedidos", "El pedido ya está cancelado.",
      "Revisar los movimientos de RehniCoin."),
    E("Solo puedes solicitar la devolución de un pedido que ya fue entregado.", "Devoluciones",
      "El pedido no está entregado.", "Esperar la entrega."),
    E("Ya existe una solicitud de devolución activa para este producto.", "Devoluciones",
      "Ya hay una solicitud en revisión.", "Esperar la respuesta de la empresa."),
    E("Solo puedes reseñar productos que ya te hayan entregado.", "Reseñas",
      "No hay una compra entregada del producto.", "Esperar la entrega."),
    E("Ya reseñaste este producto. Edita tu reseña en vez de crear otra.", "Reseñas", "Ya existe una reseña.",
      "Editar la reseña existente."),
    E("Este producto ya está en tus favoritos.", "Favoritos", "El favorito ya existe.", "Ninguna."),
    E("Solo se permiten imágenes en formato JPEG, PNG o WEBP.", "Reportes e imágenes",
      "El formato del archivo no es válido.", "Usar un formato permitido."),
    E("Esta cuenta ya tiene liquidaciones asociadas y no se puede eliminar.", "Finanzas (empresa)",
      "La cuenta bancaria está en uso.", "Conservar la cuenta."),
    E("La empresa no tiene una cuenta bancaria predeterminada registrada.", "Liquidaciones",
      "No hay cuenta predeterminada.", "La empresa debe registrar la cuenta y marcarla como predeterminada."),
    E("No hay ventas válidas (pedidos entregados) en el periodo solicitado.", "Liquidaciones",
      "No hay ventas entregadas.", "Elegir otro periodo."),
    E("Ya existe una liquidación generada para esta empresa en este periodo.", "Liquidaciones",
      "La liquidación ya existe.", "Consultar la liquidación existente."),
    E("Solo el propietario puede gestionar liquidaciones.", "Liquidaciones", "La cuenta no es propietario.",
      "Usar una cuenta de propietario."),
    E("Esta recarga ya fue corregida y no puede corregirse de nuevo.", "RehniCoin (administrador)",
      "La recarga ya se corrigió.", "Acudir a la mesa de ayuda."),
    E("La corrección dejaría el saldo del usuario en negativo.", "RehniCoin (administrador)",
      "El saldo quedaría negativo.", "Revisar el valor."),
    E("No puedes modificar tu propia cuenta desde esta opción.", "Usuarios (administrador)",
      "Se intentó editar la cuenta propia.", "Usar «Configuración de cuenta»."),
    E("Solo un Owner puede asignar el rol Owner.", "Usuarios (administrador)", "Permiso insuficiente.",
      "Acudir al propietario."),
    E("Demasiadas solicitudes. Intenta nuevamente más tarde.", "Toda la aplicación",
      "Se superó el límite de peticiones.", "Esperar un minuto y reintentar."),
    E("Error interno del servidor.", "Toda la aplicación", "Ocurrió un error no previsto.",
      "Reintentar y, si persiste, acudir a la mesa de ayuda."),
]

_REG = "Registro de comprador y de empresa, configuración de cuenta"
ERRORES_VALIDACION = [
    E("El número de teléfono solo puede contener números.", _REG, "El teléfono tiene letras, espacios o signos.",
      "Escribir solo dígitos, sin +57 ni guiones."),
    E("El número de teléfono debe tener exactamente 10 dígitos.", _REG, "El teléfono no tiene 10 dígitos.",
      "Escribir el celular de 10 dígitos."),
    E("El nombre completo debe tener al menos 3 caracteres.", _REG, "El nombre es muy corto.",
      "Escribir el nombre completo."),
    E("El nombre completo no debe exceder los 60 caracteres.", _REG, "El nombre es muy largo.",
      "Abreviar el nombre."),
    E("La contraseña debe contener al menos una letra mayúscula.", "Registro y recuperación",
      "Falta una mayúscula.", "Agregar una letra mayúscula."),
    E("La contraseña debe contener al menos una letra minúscula.", "Registro y recuperación",
      "Falta una minúscula.", "Agregar una letra minúscula."),
    E("La contraseña debe contener al menos un número.", "Registro y recuperación", "Falta un número.",
      "Agregar un número."),
    E("Ingresa un correo electrónico válido.", _REG, "El correo no tiene un formato válido.",
      "Escribir un correo como nombre@dominio.com."),
    E("El nombre de la empresa debe tener al menos 3 caracteres.", "Registro de empresa",
      "El nombre de la empresa es corto.", "Escribir la razón social."),
    E("El nombre de la empresa no debe exceder los 50 caracteres.", "Registro de empresa",
      "El nombre de la empresa es largo.", "Abreviar el nombre."),
    E("La dirección debe tener al menos 5 caracteres.", "Registro de empresa",
      "La dirección de la empresa es corta.", "Escribir la dirección completa."),
    E("El NIT solo puede contener números.", "Registro de empresa", "El NIT tiene puntos, guiones o letras.",
      "Escribir el NIT sin puntos ni dígito de verificación."),
    E("El NIT debe tener al menos 5 caracteres.", "Registro de empresa", "El NIT tiene menos de 5 dígitos.",
      "Revisar el NIT."),
    E("El dígito de verificación solo puede contener números.", "Registro de empresa", "El DV no es numérico.",
      "Escribir un dígito del 0 al 9."),
    E("El dígito de verificación debe tener exactamente un dígito.", "Registro de empresa",
      "El DV está vacío o tiene más de un dígito.", "Escribir un solo dígito."),
    E("El dígito de verificación no coincide con el NIT ingresado.", "Registro de empresa",
      "El DV no corresponde al NIT.", "Revisar el NIT y el DV en el RUT."),
    E("Cuéntanos el motivo de la devolución (mínimo 5 caracteres).", "Solicitud de devolución",
      "El motivo es muy corto.", "Describir el motivo con más detalle."),
    E("El motivo no debe exceder los 500 caracteres.", "Solicitud de devolución", "El motivo es muy largo.",
      "Resumir el motivo."),
    E("El número de guía debe tener al menos 3 caracteres.", "Envío del pedido (empresa)",
      "La guía es muy corta.", "Copiar el número de guía completo."),
    E("El número de guía no debe exceder los 80 caracteres.", "Envío del pedido (empresa)",
      "La guía es muy larga.", "Revisar el número de guía."),
    E("Selecciona una transportadora.", "Envío del pedido (empresa)",
      "No se eligió transportadora al registrar el envío.", "Elegir la transportadora de la lista."),
]

ERRORES_SESION = [
    E("Tu sesión ha expirado. Inicia sesión nuevamente.", "Inicio de sesión (al que lleva el sistema)",
      "La sesión venció y no se pudo renovar (por ejemplo, pasaron más de 15 días).", "Iniciar sesión de nuevo."),
    E("Tu cuenta se encuentra bloqueada.", "Inicio de sesión (al que lleva el sistema)",
      "Un administrador bloqueó la cuenta durante la sesión.", "Acudir a la mesa de ayuda."),
    E("Tu empresa se encuentra suspendida.", "Inicio de sesión (al que lleva el sistema)",
      "Un administrador suspendió la empresa durante la sesión; se agrega el motivo.", "Acudir a la mesa de ayuda."),
    E("Token requerido", "Respuesta del servidor", "Se abrió una opción que exige sesión sin haber iniciado "
      "sesión. En la web normalmente se ve el aviso de sesión expirada.", "Iniciar sesión."),
    E("Token expirado", "Respuesta del servidor", "La sesión venció y no se pudo renovar.",
      "Iniciar sesión de nuevo."),
    E("Token inválido", "Respuesta del servidor", "Las credenciales guardadas están dañadas o fueron revocadas.",
      "Cerrar sesión e iniciar sesión de nuevo."),
    E("Servicio temporalmente no disponible. Intenta de nuevo.", "Toda la aplicación",
      "El servidor no pudo consultar la base de datos en ese momento.",
      "Esperar unos segundos y reintentar; si persiste, acudir a la mesa de ayuda."),
]

_OK = ("La operación se completó.", "Ninguna.")
_REINT = "Reintentar; si persiste, acudir a la mesa de ayuda."
ERRORES_INTERFAZ = [
    E("Dirección guardada.", "Direcciones", *_OK),
    E("Dirección eliminada.", "Direcciones", *_OK),
    E("Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono.", "Direcciones",
      "Falta un campo obligatorio.", "Completar los campos."),
    E("No se pudo guardar la dirección.", "Direcciones", "Falló el guardado.", _REINT),
    E("No se pudo eliminar la dirección.", "Direcciones", "Falló la eliminación.", _REINT),
    E("No se pudo marcar la dirección como predeterminada.", "Direcciones", "Falló el cambio.", _REINT),
    E("No se pudieron cargar tus direcciones.", "Checkout", "Falló la consulta.", _REINT),
    E("Selecciona una dirección para continuar.", "Checkout", "No se eligió dirección.", "Elegir una dirección."),
    E("\"{producto}\" se agregó a tu carrito.", "Tienda", *_OK),
    E("Ya tienes la cantidad máxima disponible en tu carrito.", "Detalle del producto",
      "El carrito ya tiene todo el stock.", "Ninguna."),
    E("Selecciona todas las opciones antes de continuar.", "Detalle del producto", "Falta una opción de la "
      "variante.", "Seleccionar las opciones."),
    E("Esa combinación no está disponible.", "Detalle del producto", "No existe esa variante.",
      "Elegir otra combinación."),
    E("Las cuentas de empresa o administración no pueden realizar compras.", "Detalle del producto",
      "La cuenta no es de comprador.", "Usar una cuenta de comprador."),
    E("Ocurrió un error al agregar el producto al carrito.", "Detalle del producto", "Falló la operación.", _REINT),
    E("Pedido {referencia} cancelado.", "Mis pedidos", *_OK),
    E("No se pudo cancelar el pedido.", "Mis pedidos", "Falló la cancelación.", _REINT),
    E("Solicitud de devolución enviada. La empresa la revisará.", "Mis pedidos", *_OK),
    E("¡Gracias por tu reseña!", "Detalle del producto", *_OK),
    E("Tu reseña fue eliminada.", "Detalle del producto", *_OK),
    E("Selecciona una calificación antes de enviar tu reseña.", "Detalle del producto",
      "No se eligieron estrellas.", "Elegir la calificación."),
    E("No se pudo eliminar tu reseña.", "Detalle del producto", "Falló la eliminación.", _REINT),
    E("Solicitud de recarga preparada. Continúa la conversación en WhatsApp.", "RehniCoins", *_OK),
    E("No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket.", "RehniCoins",
      "El número de recargas no está configurado.", "Acudir a la mesa de ayuda."),
    E("Cuenta verificada correctamente.", "Verificación de correo", *_OK),
    E("Correo actualizado correctamente. Se ha enviado un nuevo código de verificación.",
      "Verificación de correo", *_OK),
    E("Ingresa el código completo.", "Verificación y recuperación", "Faltan dígitos del código.",
      "Digitar los 6 dígitos."),
    E("El código expiró. Solicita uno nuevo para continuar.", "Verificación de correo",
      "Pasaron más de 5 minutos.", "Oprimir «Reenviar código»."),
    E("Ingresa un correo electrónico.", "Verificación de correo", "El campo está vacío.", "Digitar el correo."),
    E("No fue posible cambiar el correo.", "Verificación de correo", "Falló el cambio.", _REINT),
    E("No fue posible reenviar el código.", "Verificación de correo", "Falló el envío.", _REINT),
    E("Contraseña actualizada correctamente.", "Recuperación de contraseña", *_OK),
    E("Debes adjuntar el certificado.", "Registro de empresa", "No se adjuntó el PDF.", "Adjuntar el "
      "certificado."),
    E("El nombre debe tener al menos 3 caracteres.", "Configuración de cuenta", "El nombre es muy corto.",
      "Escribir el nombre completo."),
    E("El teléfono debe tener exactamente 10 dígitos.", "Configuración de cuenta", "El teléfono no tiene 10 "
      "dígitos.", "Escribir el celular de 10 dígitos."),
    E("No se pudo actualizar el correo. Es posible que ya esté en uso.", "Configuración de cuenta",
      "El correo pertenece a otra cuenta.", "Usar otro correo."),
    E("No se pudo actualizar el perfil. Intenta de nuevo.", "Configuración de cuenta", "Falló el guardado.",
      _REINT),
    E("No se pudo actualizar la foto de perfil. Intenta de nuevo.", "Configuración de cuenta",
      "Falló la carga de la imagen.", "Usar una imagen JPEG, PNG o WEBP y reintentar."),
    E("No se pudo enviar el código. Intenta de nuevo más tarde.", "Configuración de cuenta",
      "Falló el envío del correo.", "Esperar y reintentar."),
    E("Producto eliminado correctamente.", "Productos (empresa)", *_OK),
    E("No se pudo cambiar el estado del producto.", "Productos (empresa)", "Falló el cambio.", _REINT),
    E("No se pudo eliminar el producto.", "Productos (empresa)", "Falló la eliminación.", _REINT),
    E("{n} variante(s) creada(s).", "Productos (empresa)", *_OK),
    E("Ingresa un precio y un stock base válidos.", "Generar combinaciones", "Precio o stock vacíos o "
      "negativos.", "Corregir los valores."),
    E("Selecciona al menos una combinación nueva.", "Generar combinaciones", "No se marcó ninguna combinación.",
      "Marcar una combinación."),
    E("No se pudieron subir las imágenes.", "Variante", "Falló la carga.", "Revisar el formato y reintentar."),
    E("No se pudo eliminar la imagen.", "Variante", "Falló la eliminación.", _REINT),
    E("No se pudo marcar la imagen como principal.", "Variante", "Falló el cambio.", _REINT),
    E("Información de envío guardada para el pedido {referencia}.", "Pedidos (empresa)", *_OK),
    E("Pedido {referencia} actualizado a \"{estado}\".", "Pedidos (empresa)", *_OK),
    E("Completa titular, documento, banco y número de cuenta.", "Finanzas (empresa)",
      "Falta un dato de la cuenta.", "Completar los campos."),
    E("Cuenta bancaria eliminada.", "Finanzas (empresa)", *_OK),
    E("No se pudieron cargar las estadísticas.", "Inicio (administrador)", "Falló la consulta.", _REINT),
    E("Empresa suspendida correctamente. No había pedidos pendientes de reembolso.", "Empresas (administrador)",
      *_OK),
    E("Empresa suspendida correctamente. Se procesaron {n} pedidos y se reembolsaron {valor} en RehniCoins.",
      "Empresas (administrador)", *_OK),
    E("Empresa desbloqueada correctamente.", "Empresas (administrador)", *_OK),
    E("Reporte {estado} correctamente.", "Reportes (administrador)", *_OK),
    E("Recarga exitosa a {usuario} ({correo}). Nuevo saldo: {saldo} RC", "RehniCoin (administrador)", *_OK),
    E("Recarga corregida para {usuario}. Ajuste {valor} RC · nuevo saldo {saldo} RC.",
      "RehniCoin (administrador)", *_OK),
    E("No se pudo recargar el saldo.", "RehniCoin y Usuarios (administrador)", "Falló la recarga.", _REINT),
    E("No se pudo corregir la recarga.", "RehniCoin (administrador)", "Falló la corrección.", _REINT),
    E("Liquidación generada para {empresa}.", "Liquidaciones (propietario)", *_OK),
    E("Selecciona una empresa y un periodo con vista previa válida.", "Liquidaciones (propietario)",
      "Falta la empresa o el periodo.", "Completar la selección."),
    E("Liquidación de {empresa} marcada como pagada.", "Liquidaciones (propietario)", *_OK),
    E("No se pudo marcar la liquidación como pagada.", "Liquidaciones (propietario)", "Falló el cambio.", _REINT),
    E("Ocurrió un error inesperado.", "Toda la aplicación", "Error no previsto o sin conexión.", _REINT),
    E("Ocurrió un error al procesar la solicitud.", "Toda la aplicación", "El servidor rechazó la operación "
      "sin un mensaje específico.", _REINT),
]

TABLAS_ERRORES = [
    ("9.1", "Mensajes del servidor", ERRORES_SERVIDOR),
    ("9.2", "Validaciones en vivo de los formularios", ERRORES_VALIDACION),
    ("9.3", "Mensajes de sesión", ERRORES_SESION),
    ("9.4", "Mensajes de la interfaz (éxito y error)", ERRORES_INTERFAZ),
]

GLOSARIO = [
    ("ANS", "acrónimo de Acuerdo de Niveles de Servicio."),
    ("Access token", "credencial de sesión de corta duración (30 minutos)."),
    ("Anuncio", "imagen del carrusel de la página de inicio que lleva a un destino."),
    ("Carrito", "lista de productos que se desea comprar."),
    ("Certificado de Cámara de Comercio", "documento PDF que acredita la existencia de la empresa."),
    ("Checkout", "paso final en el que se confirma la compra."),
    ("Comisión", "porcentaje (5 %) que la plataforma descuenta de las ventas de una empresa."),
    ("Devolución", "solicitud del comprador para reembolsar un producto de un pedido entregado."),
    ("DV", "dígito de verificación del NIT."),
    ("Guía (número de guía)", "código que asigna la transportadora a un envío para hacerle seguimiento."),
    ("Liquidación", "pago mensual a una empresa por sus ventas entregadas, menos la comisión."),
    ("Mesa de ayuda", "personal dedicado a dar soporte a los usuarios."),
    ("NIT", "Número de Identificación Tributaria."),
    ("Panel", "área privada de cada perfil, con su menú lateral."),
    ("Pedido", "compra de los productos de una empresa; un checkout puede generar varios pedidos."),
    ("Propietario (owner)", "subperfil del administrador con el mayor nivel administrativo."),
    ("Refresh token", "credencial que renueva la sesión sin pedir la contraseña (15 días)."),
    ("RehniCoin", "saldo interno de la plataforma; 1 RehniCoin equivale a 1 COP."),
    ("SKU", "código que identifica una variante."),
    ("Transportadora", "empresa de mensajería que lleva el pedido al comprador."),
    ("Variante", "combinación comprable de un producto, con precio y stock propios."),
]

BIBLIOGRAFIA = [
    "Servicio Nacional de Aprendizaje SENA. Manuales técnicos de la aplicación. FAVA - Formación en Ambientes "
    "Virtuales de Aprendizaje.",
    "IEEE Computer Society (2001). IEEE 1063-2001 Standard for Software User Documentation.",
]
