"""Datos del árbol de categorías que siembran los seeds de categorías, especificaciones y atributos:
cada categoría con su descripción, especificaciones de producto y ejes de variante con sus opciones."""

from sqlalchemy.orm import Session

from app.models.ModelCatalog import Catalog

COLORS = [
    ("Negro", "#1A1A1A"), ("Blanco", "#F2F2F2"), ("Gris", "#8E8E93"),
    ("Rojo", "#C0392B"), ("Azul", "#2E5FEB"), ("Verde", "#27AE60"),
    ("Amarillo", "#F1C40F"), ("Naranja", "#E67E22"), ("Rosa", "#E84393"),
    ("Morado", "#8E44AD"),
]
COLORS_BASIC = COLORS[:6]
COLORS_NEUTRAL = [("Negro", "#1A1A1A"), ("Blanco", "#F2F2F2"), ("Gris", "#8E8E93"),
                  ("Plateado", "#C0C0C0"), ("Azul", "#2E5FEB"), ("Rojo", "#C0392B")]
COLORS_LEATHER = [("Negro", "#1A1A1A"), ("Café", "#6B4226"), ("Miel", "#C68E17"),
                  ("Vino", "#6E1423")]

SHOE_SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
SHOE_SIZES_KIDS = ["20", "22", "24", "26", "28", "30", "32", "34"]
APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
APPAREL_SIZES_KIDS = ["2", "4", "6", "8", "10", "12", "14"]
BABY_SIZES = ["0-3 meses", "3-6 meses", "6-9 meses", "9-12 meses", "12-18 meses", "18-24 meses"]
WAIST_SIZES = ["28", "30", "32", "34", "36", "38", "40"]
BELT_SIZES = ["85 cm", "90 cm", "95 cm", "100 cm", "105 cm", "110 cm"]
UNDERWEAR_SIZES = ["S", "M", "L", "XL"]
CAP_SIZE = ["S/M", "L/XL", "Ajustable"]

RAM_CAPACITY = ["8 GB", "16 GB", "32 GB", "64 GB"]
RAM_KIT = ["8 GB (1x8)", "16 GB (2x8)", "32 GB (2x16)", "64 GB (2x32)"]
RAM_FREQUENCY = ["2666 MHz", "3200 MHz", "3600 MHz", "4800 MHz", "6000 MHz"]
STORAGE_PC = ["256 GB", "512 GB", "1 TB", "2 TB", "4 TB"]
STORAGE_PHONE = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"]
STORAGE_TABLET = ["64 GB", "128 GB", "256 GB", "512 GB"]
SSD_CAPACITY = ["250 GB", "500 GB", "1 TB", "2 TB", "4 TB"]
SSD_FORMAT = ['2.5"', "M.2 2280 SATA", "M.2 2280 NVMe"]
HDD_CAPACITY = ["1 TB", "2 TB", "4 TB", "6 TB", "8 TB"]
USB_CAPACITY = ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB"]
POWERBANK_CAPACITY = ["10000 mAh", "20000 mAh", "27000 mAh"]
CONSOLE_STORAGE = ["512 GB", "825 GB", "1 TB", "2 TB"]

MONITOR_SIZE = ['22"', '24"', '27"', '32"', '34"', '49"']
REFRESH_RATE = ["60 Hz", "75 Hz", "100 Hz", "144 Hz", "165 Hz", "240 Hz"]
GPU_VRAM = ["8 GB", "10 GB", "12 GB", "16 GB", "24 GB"]
PSU_WATTAGE = ["550 W", "650 W", "750 W", "850 W", "1000 W", "1200 W"]
PSU_RATING = ["80+ Bronze", "80+ Gold", "80+ Platinum"]
CASE_FORMAT = ["Full Tower", "Mid Tower", "Mini Tower", "Mini-ITX"]
MB_FORMAT = ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"]
RADIATOR_SIZE = ["120 mm", "240 mm", "280 mm", "360 mm"]

KEYBOARD_LAYOUT = ["Español (ISO)", "Inglés (ANSI)", "Inglés Internacional"]
KEYBOARD_SWITCH = ["Red (Lineal)", "Blue (Clicky)", "Brown (Táctil)", "Silver (Speed)"]
KEYBOARD_FORMAT = ["Completo (100%)", "TKL (80%)", "75%", "65%", "60%"]
MOUSE_DPI = ["8000 DPI", "12000 DPI", "16000 DPI", "20000 DPI", "26000 DPI"]
MOUSEPAD_SIZE = ["S (25x21 cm)", "M (36x30 cm)", "L (45x40 cm)", "XL (90x40 cm)", "XXL (120x60 cm)"]
CONNECTION = ["Alámbrico", "Bluetooth", "Inalámbrico 2.4 GHz"]
HEADPHONE_TYPE = ["In-ear", "On-ear", "Over-ear"]
SPEAKER_POWER = ["10 W", "20 W", "40 W", "80 W", "120 W"]
MIC_PATTERN = ["Cardioide", "Omnidireccional", "Bidireccional", "Multipatrón"]
MIC_CONNECTION = ["USB", "XLR", "Jack 3.5 mm"]
RESOLUTION_CAM = ["720p", "1080p", "2K", "4K"]
CAMERA_KIT = ["Solo cuerpo", "Kit 18-55 mm", "Kit doble lente"]
DRONE_COMBO = ["Estándar", "Fly More Combo", "Combo Pro"]
CONTROLLER_PLATFORM = ["PC", "PlayStation", "Xbox", "Nintendo Switch"]
GAME_PLATFORM = ["PS5", "PS4", "Xbox Series", "Nintendo Switch", "PC"]
GAME_EDITION = ["Estándar", "Deluxe", "Coleccionista"]
CONSOLE_EDITION = ["Estándar", "Digital", "Bundle"]
WIFI_STANDARD = ["WiFi 5", "WiFi 6", "WiFi 6E", "WiFi 7"]
MESH_COVERAGE = ["Individual", "Doble (Mesh 2)", "Triple (Mesh 3)"]
PRINTER_TYPE = ["Tinta", "Láser", "Multifuncional", "Fotográfica"]
PROJECTOR_RESOLUTION = ["720p", "1080p", "4K"]
RGB_LENGTH = ["30 cm", "50 cm", "1 m", "2 m", "5 m"]
RGB_TYPE = ["Tira LED", "Barra", "Panel", "Anillo"]

WATCH_CASE = ["38 mm", "40 mm", "42 mm", "44 mm", "46 mm"]
STRAP_MATERIAL = ["Silicona", "Cuero", "Metal", "Nylon", "Milanese"]

FIGURE_SCALE = ["1/10", "1/8", "1/7", "1/6", "1/4"]
FIGURE_EDITION = ["Estándar", "Deluxe", "Edición Limitada"]
PLUSH_SIZE = ["15 cm", "25 cm", "40 cm", "60 cm", "1 m"]
BOOK_LANGUAGE = ["Español", "Inglés", "Japonés"]
BOOK_EDITION = ["Tapa blanda", "Tapa dura", "Edición coleccionista"]
MANGA_FORMAT = ["Tomo individual", "Pack 1-3", "Box set completo"]
COMIC_FORMAT = ["Grapa", "Tomo recopilatorio", "Edición Deluxe"]
DESIGN_OPTS = ["Diseño A", "Diseño B", "Diseño C", "Diseño D", "Diseño E"]
PIN_FINISH = ["Esmalte suave", "Esmalte duro", "Metal pulido"]
STICKER_SIZE = ["Pequeño (5 cm)", "Mediano (10 cm)", "Grande (15 cm)", "Pack surtido"]
STICKER_FINISH = ["Mate", "Brillante", "Holográfico", "Transparente"]
POSTER_SIZE = ["A4 (21x30 cm)", "A3 (30x42 cm)", "A2 (42x60 cm)", "60x90 cm"]
POSTER_FINISH = ["Mate", "Brillante", "Enmarcado"]
MUG_CAPACITY = ["325 ml", "350 ml", "450 ml"]
MUG_TYPE = ["Cerámica", "Mágica térmica", "Vidrio"]
TCG_PRODUCT = ["Sobre", "Caja (Booster Box)", "Mazo temático", "Set élite"]
BOARDGAME_EDITION = ["Base", "Deluxe", "Con expansiones"]
VINYL_FORMAT = ['LP 12"', "EP", "CD", "Cassette"]
VINYL_COLOR = ["Negro", "Transparente", "Splatter", "Picture Disc"]
COSPLAY_SET = ["Set básico", "Set completo", "Set premium"]
COSPLAY_ACC_SIZE = ["Única", "S/M", "L/XL"]

TSHIRT_FIT = ["Regular", "Slim", "Oversize"]
JEANS_FIT = ["Skinny", "Slim", "Regular", "Recto", "Bootcut"]
JEANS_COLOR = ["Azul claro", "Azul oscuro", "Negro", "Gris", "Blanco"]
PACK_OPTS = ["Individual", "Pack x3", "Pack x5"]
HEEL_HEIGHT = ["Bajo (3 cm)", "Medio (6 cm)", "Alto (9 cm)", "Plataforma"]
GLASSES_FRAME = ["Negro", "Carey", "Dorado", "Plateado", "Transparente"]
LENS_TYPE = ["Polarizado", "Espejado", "Degradado", "UV400"]
WALLET_MATERIAL = ["Cuero genuino", "Cuero sintético", "Nylon", "Fibra de carbono"]
BAG_SIZE = ["Pequeño", "Mediano", "Grande"]
BACKPACK_CAPACITY = ["15 L", "20 L", "25 L", "30 L", "40 L"]

FURNITURE_MATERIAL = ["Madera maciza", "Melamina", "Metal", "Tapizado tela", "Tapizado cuero"]
FURNITURE_COLOR = [("Gris", "#8E8E93"), ("Beige", "#D8CAB8"), ("Negro", "#1A1A1A"),
                   ("Café", "#6B4226"), ("Azul", "#2E5FEB"), ("Blanco", "#F2F2F2")]
SOFA_SEATS = ["1 puesto", "2 puestos", "3 puestos", "Seccional"]
TABLE_SEATS = ["4 puestos", "6 puestos", "8 puestos"]
LIGHT_TEMPERATURE = ["Cálida 2700K", "Neutra 4000K", "Fría 6500K", "RGB"]
LIGHT_POWER = ["5 W", "9 W", "12 W", "15 W", "20 W"]
KITCHEN_MATERIAL = ["Acero inoxidable", "Antiadherente", "Silicona", "Madera", "Bambú"]
KITCHEN_SET = ["Individual", "Set x3", "Set x6", "Set x12"]
APPLIANCE_COLOR = [("Negro", "#1A1A1A"), ("Blanco", "#F2F2F2"),
                   ("Acero inoxidable", "#C0C0C0"), ("Rojo", "#C0392B")]
CAPACITY_L = ["1 L", "2 L", "3 L", "5 L"]
BED_SIZE = ["Sencilla", "Semidoble", "Doble", "Queen", "King"]
CURTAIN_SIZE = ["1.40 x 2.20 m", "2.00 x 2.20 m", "2.80 x 2.20 m"]

CPU_PRESENTATION = ["Con disipador", "Sin disipador (OEM)"]
HDD_INTERNAL_CAPACITY = ["1 TB", "2 TB", "4 TB", "6 TB", "8 TB", "10 TB"]
HDD_INTERNAL_FORMAT = ['3.5"', '2.5"']
EXT_SSD_CAPACITY = ["500 GB", "1 TB", "2 TB", "4 TB"]
FAN_SIZE = ["120 mm", "140 mm"]
FAN_LIGHTING = ["Sin iluminación", "ARGB"]
FAN_PACK = ["Individual", "Pack x3"]
THERMAL_PASTE_CONTENT = ["1 g", "2 g", "4 g", "10 g"]
NET_ADAPTER_INTERFACE = ["USB", "PCIe"]
NET_ADAPTER_STANDARD = ["WiFi 5", "WiFi 6", "WiFi 6E"]
NET_DEVICE_TYPE = ["Access Point", "Switch 5 puertos", "Switch 8 puertos", "Repetidor WiFi", "Switch PoE"]
PHONE_ACCESSORY_TYPE = ["Cargador de pared", "Cable USB-C", "Cable Lightning", "Adaptador OTG",
                        "Soporte para auto", "Cargador MagSafe", "Protector de pantalla", "Hub USB-C"]
TV_SIZE = ['43"', '50"', '55"', '65"', '75"']
TV_RESOLUTION = ["Full HD", "4K UHD", "8K UHD"]
SECURITY_CAM_RESOLUTION = ["1080p", "2K", "4K"]
SECURITY_CAM_CONNECTION = ["WiFi", "Cableada PoE"]
CABLE_LENGTH = ["0.5 m", "1 m", "1.5 m", "2 m", "3 m"]
CABLE_TYPE = ["HDMI 2.1", "DisplayPort 1.4", "USB-C a USB-C", "USB-C a HDMI", "Ethernet Cat 6"]
HUB_PORTS = ["4 en 1", "6 en 1", "8 en 1", "11 en 1"]
UPS_CAPACITY = ["650 VA", "850 VA", "1000 VA", "1500 VA", "2000 VA"]
STAND_TYPE = ["Soporte de monitor", "Brazo articulado", "Base para laptop", "Soporte de celular", "Soporte de TV"]
MEMORY_CARD_CAPACITY = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"]
MEMORY_CARD_TYPE = ["microSD", "SD"]
TRIPOD_TYPE = ["Trípode", "Gimbal estabilizador", "Monopié", "Mini trípode"]
VIDEO_LIGHT_TYPE = ["Panel LED", "Aro de luz", "Tubo RGB", "Kit de estudio"]
VIDEO_LIGHT_SIZE = ['10"', '18"', "Compacto"]
SCANNER_TYPE = ["Plano", "Con alimentador ADF", "Portátil", "De película"]
VACUUM_TYPE = ["Robot", "Vertical", "De mano", "Trineo"]
SOUNDBAR_CHANNELS = ["2.0", "2.1", "3.1", "5.1"]


def _specs(*extra):
    return ["Marca", "Modelo", "Garantía", *extra]


def _book_specs(*extra):
    return ["Autor", "Editorial", "Idioma original", "Número de páginas", "ISBN", *extra]


CATALOGS = [
    ("Computadoras", "Equipos de escritorio para hogar, oficina y gaming.",
     _specs("Procesador", "Tarjeta gráfica", "Sistema operativo", "Fuente de poder", "Conectividad"),
     [("Color", COLORS_NEUTRAL), ("Memoria RAM", RAM_CAPACITY), ("Almacenamiento", STORAGE_PC)]),
    ("Laptops", "Portátiles para productividad, estudio y videojuegos.",
     _specs("Procesador", "Pantalla", "Resolución", "Tarjeta gráfica", "Batería", "Sistema operativo", "Peso"),
     [("Color", COLORS_NEUTRAL), ("Memoria RAM", RAM_CAPACITY), ("Almacenamiento", STORAGE_PC)]),
    ("Celulares", "Teléfonos inteligentes de todas las gamas.",
     _specs("Procesador", "Pantalla", "Cámara principal", "Cámara frontal", "Batería", "Sistema operativo", "Resistencia al agua"),
     [("Color", COLORS), ("Almacenamiento", STORAGE_PHONE)]),
    ("Tablets", "Tabletas para consumo de contenido, estudio y dibujo.",
     _specs("Procesador", "Pantalla", "Resolución", "Batería", "Sistema operativo", "Conectividad"),
     [("Color", COLORS_BASIC), ("Almacenamiento", STORAGE_TABLET)]),
    ("Monitores", "Pantallas para oficina, diseño y gaming.",
     _specs("Tipo de panel", "Resolución", "Tiempo de respuesta", "Puertos", "Curvatura", "Soporte VESA"),
     [("Tamaño", MONITOR_SIZE), ("Frecuencia de actualización", REFRESH_RATE), ("Color", COLORS_NEUTRAL)]),
    ("Tarjetas Gráficas", "GPU para gaming, render y cómputo.",
     _specs("Chipset", "Interfaz", "Puertos de video", "Consumo recomendado", "Longitud"),
     [("Memoria de video", GPU_VRAM), ("Color", COLORS_NEUTRAL)]),
    ("Tarjetas Madre", "Placas base para armado y actualización de PC.",
     _specs("Socket", "Chipset", "Ranuras de RAM", "Ranuras PCIe", "Puertos traseros"),
     [("Formato", MB_FORMAT), ("Color", COLORS_NEUTRAL)]),
    ("Memorias RAM", "Módulos de memoria para PC de escritorio.",
     _specs("Tipo", "Latencia", "Voltaje", "Perfil XMP/EXPO", "Disipador"),
     [("Capacidad", RAM_KIT), ("Frecuencia", RAM_FREQUENCY), ("Color", COLORS_NEUTRAL)]),
    ("Discos SSD", "Unidades de estado sólido internas.",
     _specs("Interfaz", "Velocidad de lectura", "Velocidad de escritura", "TBW", "Controladora"),
     [("Capacidad", SSD_CAPACITY), ("Formato", SSD_FORMAT)]),
    ("Discos Duros Externos", "Almacenamiento portátil USB.",
     _specs("Interfaz", "Velocidad de transferencia", "Alimentación", "Software incluido"),
     [("Capacidad", HDD_CAPACITY), ("Color", COLORS_NEUTRAL)]),
    ("Fuentes de Poder", "PSU para PC de escritorio.",
     _specs("Modularidad", "Ventilador", "Protecciones", "Conectores PCIe", "Dimensiones"),
     [("Potencia", PSU_WATTAGE), ("Certificación", PSU_RATING)]),
    ("Gabinetes PC", "Chasis para armado de computadoras.",
     _specs("Material", "Bahías de almacenamiento", "Ventiladores incluidos", "Soporte de radiador", "Gestión de cables"),
     [("Formato", CASE_FORMAT), ("Color", COLORS_NEUTRAL)]),
    ("Refrigeración Líquida", "Sistemas AIO de enfriamiento por líquido.",
     _specs("Compatibilidad de socket", "Bomba", "Iluminación", "Nivel de ruido"),
     [("Tamaño del radiador", RADIATOR_SIZE), ("Color", COLORS_NEUTRAL)]),
    ("Sillas Gamer", "Sillas ergonómicas para largas sesiones.",
     _specs("Peso soportado", "Reclinación", "Apoyabrazos", "Altura recomendada", "Base"),
     [("Color", COLORS), ("Material", ["Cuero sintético", "Tela transpirable", "Malla"])]),
    ("Teclados", "Teclados de membrana y mecánicos para el día a día.",
     _specs("Tipo", "Retroiluminación", "Teclas multimedia", "Reposamuñecas", "Cable"),
     [("Layout", KEYBOARD_LAYOUT), ("Color", COLORS_NEUTRAL), ("Conexión", CONNECTION)]),
    ("Teclados Mecánicos", "Teclados mecánicos personalizables para gaming.",
     _specs("Material del case", "Hot-swap", "Iluminación RGB", "Estabilizadores", "Perfil de keycaps"),
     [("Formato", KEYBOARD_FORMAT), ("Switch", KEYBOARD_SWITCH), ("Color", COLORS_NEUTRAL)]),
    ("Mouse", "Ratones para oficina y gaming.",
     _specs("Sensor", "Número de botones", "Peso", "Tipo de agarre", "Cable"),
     [("Color", COLORS), ("DPI", MOUSE_DPI), ("Conexión", CONNECTION)]),
    ("Mouse Pads", "Alfombrillas de escritorio.",
     _specs("Material de superficie", "Base", "Grosor", "Bordes"),
     [("Tamaño", MOUSEPAD_SIZE), ("Color", COLORS)]),
    ("Audio", "Equipos de sonido personales y para el hogar.",
     _specs("Tipo", "Conectividad", "Duración de batería", "Cancelación de ruido", "Resistencia al agua"),
     [("Color", COLORS), ("Tipo de uso", HEADPHONE_TYPE), ("Conexión", CONNECTION)]),
    ("Audífonos", "Auriculares in-ear, on-ear y over-ear.",
     _specs("Controladores", "Impedancia", "Micrófono", "Autonomía", "Estuche de carga"),
     [("Color", COLORS), ("Conexión", CONNECTION)]),
    ("Parlantes", "Altavoces portátiles y de estantería.",
     _specs("Configuración", "Respuesta de frecuencia", "Autonomía", "Resistencia al agua", "Entradas"),
     [("Color", COLORS), ("Potencia", SPEAKER_POWER)]),
    ("Micrófonos", "Micrófonos para streaming, podcast y estudio.",
     _specs("Tipo de cápsula", "Frecuencia de muestreo", "Monitoreo", "Accesorios incluidos"),
     [("Color", COLORS_NEUTRAL), ("Patrón polar", MIC_PATTERN), ("Conexión", MIC_CONNECTION)]),
    ("Webcams", "Cámaras web para videollamadas y streaming.",
     _specs("Sensor", "Campo de visión", "Enfoque", "Micrófono integrado", "Montaje"),
     [("Resolución", RESOLUTION_CAM), ("Color", COLORS_NEUTRAL)]),
    ("Cámaras Fotográficas", "Cámaras mirrorless y DSLR.",
     _specs("Sensor", "Megapíxeles", "Montura", "Estabilización", "Video máximo", "Pantalla"),
     [("Color", COLORS_NEUTRAL), ("Kit", CAMERA_KIT)]),
    ("Drones", "Drones con cámara para foto y video aéreo.",
     _specs("Sensor de cámara", "Alcance", "Autonomía de vuelo", "Peso", "Sensores de obstáculos"),
     [("Color", [("Gris", "#8E8E93"), ("Blanco", "#F2F2F2"), ("Negro", "#1A1A1A")]), ("Combo", DRONE_COMBO)]),
    ("Smartwatch", "Relojes inteligentes con sensores de salud.",
     _specs("Sistema operativo", "Sensores", "Autonomía", "GPS", "Resistencia al agua"),
     [("Color", COLORS), ("Tamaño de caja", WATCH_CASE), ("Correa", STRAP_MATERIAL)]),
    ("Bandas Inteligentes", "Pulseras de actividad y sueño.",
     _specs("Pantalla", "Sensores", "Autonomía", "Resistencia al agua"),
     [("Color", COLORS), ("Correa", STRAP_MATERIAL)]),
    ("Consolas", "Consolas de videojuegos de sobremesa y portátiles.",
     _specs("Generación", "Resolución máxima", "Retrocompatibilidad", "Conectividad", "Servicios incluidos"),
     [("Color", COLORS_NEUTRAL), ("Almacenamiento", CONSOLE_STORAGE), ("Edición", CONSOLE_EDITION)]),
    ("Controles Gaming", "Mandos para consola y PC.",
     _specs("Vibración", "Batería", "Gatillos", "Botones programables", "Latencia"),
     [("Color", COLORS), ("Plataforma", CONTROLLER_PLATFORM), ("Conexión", CONNECTION)]),
    ("Videojuegos", "Títulos físicos y digitales.",
     _specs("Desarrollador", "Distribuidora", "Género", "Clasificación PEGI", "Idiomas", "Modo multijugador"),
     [("Plataforma", GAME_PLATFORM), ("Edición", GAME_EDITION)]),
    ("Accesorios Gaming", "Complementos para setups de juego.",
     _specs("Tipo", "Material", "Instalación", "Peso"),
     [("Color", COLORS), ("Plataforma compatible", ["PC", "PlayStation", "Xbox", "Universal"])]),
    ("Iluminación RGB", "Tiras, barras y paneles LED direccionables.",
     _specs("Chip LED", "Controlador", "Sincronización", "Alimentación", "Adhesivo"),
     [("Color del cuerpo", [("Negro", "#1A1A1A"), ("Blanco", "#F2F2F2"),
                            ("Gris", "#8E8E93"), ("Plateado", "#C0C0C0")]),
      ("Longitud", RGB_LENGTH), ("Tipo", RGB_TYPE)]),
    ("Power Banks", "Baterías externas portátiles.",
     _specs("Puertos de salida", "Carga rápida", "Carga inalámbrica", "Peso", "Indicador de carga"),
     [("Capacidad", POWERBANK_CAPACITY), ("Color", COLORS_NEUTRAL)]),
    ("Memorias USB", "Unidades flash USB.",
     _specs("Interfaz", "Velocidad de lectura", "Material de carcasa", "Cifrado"),
     [("Capacidad", USB_CAPACITY), ("Color", COLORS)]),
    ("Routers WiFi", "Routers y sistemas de red para el hogar.",
     _specs("Bandas", "Puertos LAN", "Antenas", "Procesador", "Control parental"),
     [("Estándar", WIFI_STANDARD), ("Cobertura", MESH_COVERAGE)]),
    ("Proyectores", "Proyectores para cine en casa y presentaciones.",
     _specs("Tecnología", "Brillo (lúmenes)", "Contraste", "Distancia de proyección", "Altavoz integrado", "Conectividad"),
     [("Resolución", PROJECTOR_RESOLUTION), ("Color", COLORS_NEUTRAL)]),
    ("Impresoras", "Impresoras para hogar y oficina.",
     _specs("Velocidad de impresión", "Resolución", "Conectividad", "Impresión a doble cara", "Bandeja de papel"),
     [("Tipo", PRINTER_TYPE),
      ("Color", [("Negro", "#1A1A1A"), ("Blanco", "#F2F2F2"), ("Gris", "#8E8E93")])]),
    ("Periféricos", "Accesorios de entrada y salida para PC.",
     _specs("Tipo", "Compatibilidad", "Cable", "Software"),
     [("Color", COLORS), ("Conexión", CONNECTION)]),

    ("Figuras Coleccionables", "Figuras a escala de anime, cómics y videojuegos.",
     _specs("Franquicia", "Fabricante", "Material", "Altura aproximada", "Licencia oficial"),
     [("Escala", FIGURE_SCALE), ("Edición", FIGURE_EDITION)]),
    ("Peluches", "Peluches de personajes y animales.",
     _specs("Franquicia", "Material exterior", "Relleno", "Edad recomendada", "Lavable"),
     [("Tamaño", PLUSH_SIZE), ("Color", COLORS)]),
    ("Mangas", "Tomos de manga en distintos idiomas.",
     _book_specs("Dibujante", "Demografía", "Estado de publicación"),
     [("Idioma", BOOK_LANGUAGE), ("Formato", MANGA_FORMAT)]),
    ("Novelas Ligeras", "Light novels traducidas y de importación.",
     _book_specs("Ilustrador", "Volumen", "Saga"),
     [("Idioma", BOOK_LANGUAGE), ("Edición", BOOK_EDITION)]),
    ("Artbooks", "Libros de arte e ilustración.",
     _book_specs("Estudio", "Formato del libro", "Contenido"),
     [("Idioma", BOOK_LANGUAGE), ("Edición", BOOK_EDITION)]),
    ("Cómics", "Cómics de superhéroes, indie y europeos.",
     _book_specs("Guionista", "Dibujante", "Editorial original"),
     [("Idioma", BOOK_LANGUAGE), ("Formato", COMIC_FORMAT)]),
    ("Cosplay", "Trajes completos de cosplay.",
     _specs("Personaje", "Material", "Piezas incluidas", "Cuidado de la prenda"),
     [("Talla", APPAREL_SIZES), ("Set", COSPLAY_SET)]),
    ("Accesorios Cosplay", "Pelucas, armas de utilería y complementos.",
     _specs("Personaje", "Material", "Ajustable", "Cuidado"),
     [("Color", COLORS), ("Talla", COSPLAY_ACC_SIZE)]),
    ("Ropa Anime", "Prendas con diseños de anime y cultura otaku.",
     _specs("Material", "Composición", "Tipo de estampado", "Instrucciones de cuidado", "País de fabricación"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS), ("Diseño", DESIGN_OPTS)]),
    ("Posters", "Láminas y pósters decorativos.",
     _specs("Tipo de papel", "Gramaje", "Impresión", "Tema"),
     [("Tamaño", POSTER_SIZE), ("Acabado", POSTER_FINISH)]),
    ("Llaveros", "Llaveros temáticos y coleccionables.",
     _specs("Material", "Dimensiones", "Tipo de anilla", "Tema"),
     [("Color", COLORS)]),
    ("Pines", "Pines de esmalte y metal.",
     _specs("Material", "Sistema de cierre", "Dimensiones", "Tema"),
     [("Diseño", DESIGN_OPTS)]),
    ("Stickers", "Calcomanías y packs de stickers.",
     _specs("Material", "Resistencia al agua", "Adhesivo", "Tema"),
     [("Acabado", STICKER_FINISH)]),
    ("Tazas", "Tazas y mugs personalizados.",
     _specs("Material", "Apta para microondas", "Apta para lavavajillas", "Tema"),
     [("Color", COLORS)]),
    ("Cartas Coleccionables", "Productos de juegos de cartas coleccionables.",
     _specs("Juego", "Bloque/Set", "Número de cartas", "Idioma del set", "Formato de juego"),
     [("Idioma", BOOK_LANGUAGE), ("Producto", TCG_PRODUCT)]),
    ("Juegos de Mesa", "Juegos de mesa para grupos y familia.",
     _specs("Número de jugadores", "Duración media", "Edad recomendada", "Mecánica principal", "Idioma del reglamento"),
     [("Idioma", BOOK_LANGUAGE), ("Edición", BOARDGAME_EDITION)]),
    ("Vinilos y Discos", "Música en formato físico.",
     _specs("Artista", "Sello", "Año de edición", "Género musical", "Número de pistas"),
     [("Formato", VINYL_FORMAT), ("Color del vinilo", VINYL_COLOR)]),
    ("Nendoroids", "Figuras chibi articuladas.",
     _specs("Franquicia", "Fabricante", "Altura aproximada", "Accesorios incluidos", "Licencia oficial"),
     [("Edición", ["Estándar", "Deluxe (DX)", "Exclusiva de evento"])]),
    ("Ropa Deportiva", "Prendas técnicas para entrenamiento.",
     _specs("Material", "Tecnología de tejido", "Transpirabilidad", "Uso recomendado", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),

    ("Camisetas", "Camisetas casuales de manga corta.",
     _specs("Material", "Composición", "Tipo de cuello", "Instrucciones de cuidado", "País de fabricación"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS), ("Corte", TSHIRT_FIT)]),
    ("Camisas", "Camisas formales y casuales.",
     _specs("Material", "Composición", "Tipo de cuello", "Puño", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Polos", "Polos tipo piqué.",
     _specs("Material", "Composición", "Tipo de cuello", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Pantalones", "Pantalones casuales y de vestir.",
     _specs("Material", "Composición", "Tipo de tiro", "Cierre", "Instrucciones de cuidado"),
     [("Talla", WAIST_SIZES), ("Color", COLORS)]),
    ("Jeans", "Pantalones de mezclilla.",
     _specs("Material", "Composición", "Elasticidad", "Lavado", "Instrucciones de cuidado"),
     [("Talla", WAIST_SIZES), ("Color", [(c, "#2E4A7A" if "Azul" in c else "#1A1A1A") for c in JEANS_COLOR]),
      ("Corte", JEANS_FIT)]),
    ("Shorts", "Bermudas y pantalones cortos.",
     _specs("Material", "Composición", "Largo", "Cierre", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Chaquetas", "Chaquetas ligeras y de entretiempo.",
     _specs("Material", "Forro", "Impermeabilidad", "Cierre", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Sudaderas", "Buzos y sudaderas con y sin capucha.",
     _specs("Material", "Composición", "Gramaje", "Tipo de capucha", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Abrigos", "Abrigos y parkas para invierno.",
     _specs("Material exterior", "Relleno", "Temperatura recomendada", "Capucha", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Vestidos", "Vestidos casuales y de fiesta.",
     _specs("Material", "Composición", "Largo", "Escote", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Faldas", "Faldas cortas, midi y largas.",
     _specs("Material", "Composición", "Largo", "Cierre", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Ropa Interior", "Prendas interiores para hombre y mujer.",
     _specs("Material", "Composición", "Tipo", "Instrucciones de cuidado"),
     [("Talla", UNDERWEAR_SIZES), ("Color", COLORS), ("Pack", PACK_OPTS)]),
    ("Pijamas", "Conjuntos y batas para dormir.",
     _specs("Material", "Composición", "Temporada", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Trajes de Baño", "Bañadores, bikinis y trajes de baño.",
     _specs("Material", "Composición", "Protección UV", "Forro", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS)]),
    ("Ropa Infantil", "Prendas para niñas y niños.",
     _specs("Material", "Composición", "Edad recomendada", "Cierre", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES_KIDS), ("Color", COLORS)]),
    ("Ropa de Bebé", "Bodies, mamelucos y conjuntos para bebé.",
     _specs("Material", "Composición", "Tipo de cierre", "Certificación textil", "Instrucciones de cuidado"),
     [("Talla", BABY_SIZES), ("Color", COLORS)]),
    ("Uniformes", "Uniformes escolares y de trabajo.",
     _specs("Material", "Composición", "Uso", "Resistencia", "Instrucciones de cuidado"),
     [("Talla", APPAREL_SIZES), ("Color", COLORS_BASIC)]),

    ("Calzado", "Calzado casual y urbano.",
     _specs("Material exterior", "Material interior", "Tipo de suela", "Género", "Uso recomendado"),
     [("Talla", SHOE_SIZES), ("Color", COLORS)]),
    ("Tenis", "Zapatillas urbanas y sneakers.",
     _specs("Material exterior", "Material interior", "Tipo de suela", "Cierre", "Uso recomendado"),
     [("Talla", SHOE_SIZES), ("Color", COLORS)]),
    ("Zapatos Formales", "Calzado de vestir para hombre y mujer.",
     _specs("Material exterior", "Material interior", "Tipo de suela", "Construcción", "Uso recomendado"),
     [("Talla", SHOE_SIZES), ("Color", COLORS_LEATHER)]),
    ("Botas", "Botas casuales, de trabajo y de invierno.",
     _specs("Material exterior", "Forro", "Tipo de suela", "Altura de caña", "Impermeabilidad"),
     [("Talla", SHOE_SIZES), ("Color", COLORS_LEATHER)]),
    ("Botines", "Botines de media caña.",
     _specs("Material exterior", "Material interior", "Tipo de suela", "Cierre", "Altura de tacón"),
     [("Talla", SHOE_SIZES), ("Color", COLORS_LEATHER)]),
    ("Sandalias", "Sandalias y calzado abierto.",
     _specs("Material", "Tipo de suela", "Ajuste", "Uso recomendado"),
     [("Talla", SHOE_SIZES), ("Color", COLORS)]),
    ("Zapatillas Deportivas", "Calzado para running, training y básquet.",
     _specs("Material exterior", "Tecnología de amortiguación", "Tipo de suela", "Peso", "Uso recomendado", "Drop"),
     [("Talla", SHOE_SIZES), ("Color", COLORS)]),
    ("Chanclas", "Chanclas y sandalias de baño.",
     _specs("Material", "Tipo de suela", "Antideslizante"),
     [("Talla", ["S", "M", "L", "XL"])]),
    ("Calzado Infantil", "Zapatos y zapatillas para niños.",
     _specs("Material exterior", "Material interior", "Tipo de cierre", "Suela flexible", "Edad recomendada"),
     [("Talla", SHOE_SIZES_KIDS), ("Color", COLORS)]),
    ("Tacones", "Zapatos de tacón y plataformas.",
     _specs("Material exterior", "Material interior", "Tipo de suela", "Plantilla", "Uso recomendado"),
     [("Talla", SHOE_SIZES), ("Color", COLORS), ("Altura", HEEL_HEIGHT)]),

    ("Relojes", "Relojes analógicos y digitales.",
     _specs("Tipo de movimiento", "Material de caja", "Cristal", "Resistencia al agua", "Diámetro"),
     [("Color", COLORS), ("Material de correa", STRAP_MATERIAL), ("Tamaño de caja", ["36 mm", "40 mm", "42 mm", "44 mm"])]),
    ("Gorras", "Gorras, snapbacks y bucket hats.",
     _specs("Material", "Tipo de visera", "Cierre", "Estructura"),
     [("Talla", CAP_SIZE)]),
    ("Mochilas", "Mochilas urbanas, escolares y de viaje.",
     _specs("Material", "Compartimento para laptop", "Resistencia al agua", "Puerto USB", "Peso"),
     [("Capacidad", BACKPACK_CAPACITY), ("Color", COLORS)]),
    ("Bolsos y Carteras", "Bolsos de mano, bandoleras y carteras.",
     _specs("Material", "Forro", "Número de compartimentos", "Tipo de cierre", "Correa"),
     [("Color", COLORS), ("Tamaño", BAG_SIZE)]),
    ("Gafas de Sol", "Lentes de sol con protección UV.",
     _specs("Material de armazón", "Material de lente", "Protección UV", "Forma", "Incluye estuche"),
     [("Color de armazón", GLASSES_FRAME), ("Tipo de lente", LENS_TYPE)]),
    ("Cinturones", "Cinturones de cuero y tela.",
     _specs("Material", "Ancho", "Tipo de hebilla", "Ajustable"),
     [("Talla", BELT_SIZES), ("Color", COLORS_LEATHER)]),
    ("Billeteras", "Billeteras y tarjeteros.",
     _specs("Número de ranuras", "Compartimento para billetes", "Bloqueo RFID", "Dimensiones"),
     [("Color", COLORS_LEATHER), ("Material", WALLET_MATERIAL)]),

    ("Muebles de Sala", "Sofás, sillones y muebles de sala.",
     _specs("Material de estructura", "Relleno", "Dimensiones", "Peso soportado", "Requiere ensamblaje"),
     [("Color", FURNITURE_COLOR), ("Material", FURNITURE_MATERIAL), ("Plazas", SOFA_SEATS)]),
    ("Sillas", "Sillas de comedor, oficina y exterior.",
     _specs("Material de estructura", "Material del asiento", "Peso soportado", "Apilable", "Requiere ensamblaje"),
     [("Color", FURNITURE_COLOR), ("Material", FURNITURE_MATERIAL)]),
    ("Mesas", "Mesas de comedor, centro y escritorio.",
     _specs("Material de superficie", "Material de patas", "Dimensiones", "Peso soportado", "Requiere ensamblaje"),
     [("Color", FURNITURE_COLOR), ("Material", FURNITURE_MATERIAL), ("Tamaño", TABLE_SEATS)]),
    ("Iluminación", "Bombillas, lámparas y luminarias.",
     _specs("Casquillo", "Flujo luminoso (lúmenes)", "Vida útil", "Regulable", "Ángulo de haz"),
     [("Temperatura de color", LIGHT_TEMPERATURE), ("Potencia", LIGHT_POWER)]),
    ("Utensilios de Cocina", "Ollas, sartenes y utensilios.",
     _specs("Apto para inducción", "Apto para lavavajillas", "Tapa incluida", "Recubrimiento", "Origen"),
     [("Material", KITCHEN_MATERIAL), ("Set", KITCHEN_SET)]),
    ("Electrodomésticos de Cocina", "Pequeños electrodomésticos.",
     _specs("Potencia", "Funciones", "Control", "Accesorios incluidos", "Voltaje"),
     [("Color", APPLIANCE_COLOR), ("Capacidad", CAPACITY_L)]),
    ("Ropa de Cama", "Sábanas, edredones y fundas.",
     _specs("Material", "Hilos por pulgada", "Piezas incluidas", "Instrucciones de lavado"),
     [("Tamaño", BED_SIZE), ("Color", COLORS)]),
    ("Cortinas", "Cortinas blackout y decorativas.",
     _specs("Material", "Opacidad", "Tipo de sujeción", "Instrucciones de lavado"),
     [("Tamaño", CURTAIN_SIZE), ("Color", COLORS)]),
    ("Decoración", "Objetos decorativos para el hogar.",
     _specs("Material", "Dimensiones", "Estilo", "Uso interior/exterior"),
     [("Color", COLORS)]),

    ("Procesadores", "CPU de escritorio AMD e Intel para armado y actualización.",
     _specs("Socket", "Núcleos", "Hilos", "Frecuencia base", "Frecuencia turbo", "Caché", "TDP", "Gráficos integrados"),
     [("Presentación", CPU_PRESENTATION)]),
    ("Discos Duros", "Discos duros mecánicos internos para almacenamiento masivo.",
     _specs("Interfaz", "RPM", "Caché", "Velocidad de transferencia", "Uso recomendado"),
     [("Capacidad", HDD_INTERNAL_CAPACITY), ("Formato", HDD_INTERNAL_FORMAT)]),
    ("Discos SSD Externos", "Unidades de estado sólido portátiles por USB.",
     _specs("Interfaz", "Velocidad de lectura", "Velocidad de escritura", "Resistencia", "Cifrado"),
     [("Capacidad", EXT_SSD_CAPACITY), ("Color", COLORS_NEUTRAL)]),
    ("Ventiladores PC", "Ventiladores para gabinete y optimización de flujo de aire.",
     _specs("Rango de RPM", "Flujo de aire", "Nivel de ruido", "Conector", "Rodamiento"),
     [("Tamaño", FAN_SIZE), ("Iluminación", FAN_LIGHTING), ("Pack", FAN_PACK)]),
    ("Pasta Térmica", "Compuestos térmicos para CPU y GPU.",
     _specs("Conductividad térmica", "Composición", "Aplicaciones estimadas", "Aplicador"),
     [("Contenido", THERMAL_PASTE_CONTENT)]),
    ("Adaptadores de Red", "Adaptadores WiFi y Bluetooth USB y PCIe.",
     _specs("Velocidad", "Bandas", "Antena", "Compatibilidad", "Bluetooth"),
     [("Interfaz", NET_ADAPTER_INTERFACE), ("Estándar", NET_ADAPTER_STANDARD)]),
    ("Equipos de Red", "Switches, access points y repetidores para el hogar y oficina.",
     _specs("Puertos", "Velocidad", "Alimentación", "Gestión", "Montaje"),
     [("Tipo", NET_DEVICE_TYPE)]),
    ("Accesorios para Celular", "Cargadores, cables, soportes y protección para móviles.",
     _specs("Material", "Compatibilidad", "Contenido", "Certificación"),
     [("Tipo", PHONE_ACCESSORY_TYPE), ("Color", COLORS_NEUTRAL)]),
    ("Smart TV", "Televisores inteligentes 4K y 8K con apps integradas.",
     _specs("Panel", "Sistema operativo", "HDR", "Tasa de refresco", "Puertos", "Sintonizador"),
     [("Tamaño", TV_SIZE), ("Resolución", TV_RESOLUTION)]),
    ("Barras de Sonido", "Barras de sonido para TV y cine en casa.",
     _specs("Potencia", "Subwoofer", "Conectividad", "Formatos de audio", "Montaje"),
     [("Canales", SOUNDBAR_CHANNELS), ("Color", COLORS_NEUTRAL)]),
    ("Cámaras de Seguridad", "Cámaras IP de vigilancia para interior y exterior.",
     _specs("Tipo", "Visión nocturna", "Ángulo de visión", "Almacenamiento", "Audio", "Resistencia"),
     [("Resolución", SECURITY_CAM_RESOLUTION), ("Conexión", SECURITY_CAM_CONNECTION)]),
    ("Cables y Adaptadores", "Cables de video, datos y red.",
     _specs("Material", "Velocidad", "Compatibilidad", "Blindaje"),
     [("Longitud", CABLE_LENGTH), ("Tipo", CABLE_TYPE)]),
    ("Hubs y Docking", "Hubs USB-C y estaciones de acoplamiento.",
     _specs("Alimentación", "Salida de video", "Compatibilidad", "Material", "Lector de tarjetas"),
     [("Puertos", HUB_PORTS), ("Color", COLORS_NEUTRAL)]),
    ("UPS y Protección", "Sistemas de alimentación ininterrumpida y protección eléctrica.",
     _specs("Potencia (W)", "Tomas", "Autonomía", "Tipo de onda", "Tiempo de respaldo"),
     [("Capacidad", UPS_CAPACITY)]),
    ("Soportes y Bases", "Soportes para monitor, laptop, TV y celular.",
     _specs("Material", "Compatibilidad", "Peso soportado", "Ajustes", "Instalación"),
     [("Tipo", STAND_TYPE), ("Color", COLORS_NEUTRAL)]),
    ("Tarjetas de Memoria", "Tarjetas microSD y SD de alta velocidad.",
     _specs("Clase de velocidad", "Velocidad de lectura", "Velocidad de escritura", "Aplicación", "Adaptador incluido"),
     [("Capacidad", MEMORY_CARD_CAPACITY), ("Tipo", MEMORY_CARD_TYPE)]),
    ("Trípodes y Estabilizadores", "Trípodes y gimbals para foto y video.",
     _specs("Altura máxima", "Carga máxima", "Material", "Cabezal", "Peso"),
     [("Tipo", TRIPOD_TYPE)]),
    ("Iluminación para Video", "Paneles LED y aros de luz para creadores de contenido.",
     _specs("Potencia", "Temperatura de color", "CRI", "Alimentación", "Montaje"),
     [("Tipo", VIDEO_LIGHT_TYPE), ("Tamaño", VIDEO_LIGHT_SIZE)]),
    ("Escáneres", "Escáneres de documentos y fotografía.",
     _specs("Resolución óptica", "Velocidad", "Conectividad", "Alimentador de documentos", "Formatos"),
     [("Tipo", SCANNER_TYPE)]),
    ("Aspiradoras", "Aspiradoras robot, verticales y de mano.",
     _specs("Potencia", "Capacidad", "Autonomía", "Filtro", "Nivel de ruido"),
     [("Tipo", VACUUM_TYPE), ("Color", APPLIANCE_COLOR)]),
]


def get_seed_catalog(db: Session, name: str) -> Catalog | None:
    return db.query(Catalog).filter(Catalog.name == name).first()
