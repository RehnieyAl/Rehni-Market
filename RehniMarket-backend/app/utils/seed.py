import io
import struct
import unicodedata
import uuid
import zlib

from sqlalchemy.orm import Session

from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelCompany import Company
from app.models.ModelCatalog import Catalog
from app.models.ModelCatalogAttribute import CatalogAttribute, CatalogAttributeOption
from app.models.ModelProduct import Product, ProductImage
from app.models.ModelVariant import ProductVariant
from app.models.ModelVariantImage import ProductVariantImage
from app.models.ModelVariantOption import VariantOption
from app.models.ModelAttributeValue import ProductAttributeValue
from app.models.ModelShippingCarrier import ShippingCarrier
from app.services.variants.combo_key import build_combo_key
from app.utils.Security import hash_password
from app.Config import config


def seed_roles(db: Session):
    roles = ["user", "company", "admin", "owner"]

    for role_name in roles:
        exists = db.query(Role).filter(Role.name == role_name).first()

        if not exists:
            db.add(Role(name=role_name))

    db.commit()


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
]


def _get_catalog(db: Session, name: str) -> Catalog | None:
    return db.query(Catalog).filter(Catalog.name == name).first()


def seed_catalog(db: Session):
    for order, (name, description, _specs_list, _variant_attrs) in enumerate(CATALOGS, start=1):
        if _get_catalog(db, name):
            continue

        db.add(Catalog(name=name, description=description, display_order=order))

    db.commit()


def seed_specifications(db: Session):
    for name, _description, product_specs, _variant_attrs in CATALOGS:
        catalog = _get_catalog(db, name)

        if not catalog:
            continue

        for position, spec_name in enumerate(product_specs):
            exists = (
                db.query(CatalogAttribute)
                .filter(
                    CatalogAttribute.catalog_id == catalog.id,
                    CatalogAttribute.name == spec_name,
                )
                .first()
            )

            if exists:
                continue

            db.add(
                CatalogAttribute(
                    catalog_id=catalog.id,
                    name=spec_name,
                    role="product",
                    input_type="text",
                    position=position,
                )
            )

    db.commit()


def seed_catalog_attributes(db: Session):
    for name, _description, _product_specs, variant_attrs in CATALOGS:
        catalog = _get_catalog(db, name)

        if not catalog:
            continue

        for position, (attr_name, options) in enumerate(variant_attrs):
            is_color = bool(options) and isinstance(options[0], tuple)
            input_type = "color" if is_color else "select"

            attribute = (
                db.query(CatalogAttribute)
                .filter(
                    CatalogAttribute.catalog_id == catalog.id,
                    CatalogAttribute.name == attr_name,
                )
                .first()
            )

            if attribute is None:
                attribute = CatalogAttribute(
                    catalog_id=catalog.id,
                    name=attr_name,
                    role="variant",
                    input_type=input_type,
                    position=position,
                )
                db.add(attribute)
                db.flush()
            elif attribute.role != "variant":
                continue

            for option_position, option in enumerate(options):
                if is_color:
                    value, hex_color = option
                else:
                    value, hex_color = option, None

                option_exists = (
                    db.query(CatalogAttributeOption)
                    .filter(
                        CatalogAttributeOption.attribute_id == attribute.id,
                        CatalogAttributeOption.value == value,
                    )
                    .first()
                )

                if option_exists:
                    continue

                db.add(
                    CatalogAttributeOption(
                        attribute_id=attribute.id,
                        value=value,
                        hex_color=hex_color,
                        position=option_position,
                    )
                )

    db.commit()


SEED_COMPANY_PASSWORD = "RehniSeed2026*"
_SEED_PWD_HASH: str | None = None

_PALETTE = {
    "Negro": (34, 34, 38), "Blanco": (238, 238, 242), "Gris": (140, 140, 148),
    "Plateado": (198, 198, 203), "Azul": (46, 95, 235), "Rojo": (192, 57, 43),
    "Verde": (39, 174, 96), "Amarillo": (241, 196, 15), "Naranja": (230, 126, 34),
    "Rosa": (232, 67, 147), "Morado": (142, 68, 173),
}
_DEFAULT_RGB = (108, 122, 137)


def _seed_password_hash() -> str:
    global _SEED_PWD_HASH
    if _SEED_PWD_HASH is None:
        _SEED_PWD_HASH = hash_password(SEED_COMPANY_PASSWORD)
    return _SEED_PWD_HASH


def _slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in normalized)
    return "-".join(part for part in out.split("-") if part)


def _solid_png(rgb, size: int = 480) -> bytes:
    def _chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    row = b"\x00" + bytes(rgb) * size
    idat = zlib.compress(row * size, 9)
    return signature + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")


def _ensure_media_object(object_name: str, rgb) -> str:
    """Sube un PNG de color sólido a uploads/<object_name> si aún no existe.
    Devuelve la ruta con prefijo de bucket, igual que NasService.upload_file."""

    from app.services.NasService import bucket, client

    try:
        client.stat_object(bucket, object_name)
    except Exception:
        payload = _solid_png(rgb)
        client.put_object(
            bucket,
            object_name,
            io.BytesIO(payload),
            len(payload),
            content_type="image/png",
        )

    return f"{bucket}/{object_name}"


def _role_attribute(db: Session, catalog_id, name: str, role: str) -> CatalogAttribute | None:
    return (
        db.query(CatalogAttribute)
        .filter(
            CatalogAttribute.catalog_id == catalog_id,
            CatalogAttribute.name == name,
            CatalogAttribute.role == role,
        )
        .first()
    )


def _ensure_product_attr_value(db: Session, product_id, attribute_id, value: str):
    exists = (
        db.query(ProductAttributeValue)
        .filter(
            ProductAttributeValue.product_id == product_id,
            ProductAttributeValue.attribute_id == attribute_id,
        )
        .first()
    )
    if not exists:
        db.add(
            ProductAttributeValue(
                product_id=product_id, attribute_id=attribute_id, value=value
            )
        )


def _ensure_product_image(db: Session, product, object_name: str, rgb, is_main: bool):
    url = f"uploads/{object_name}"
    exists = (
        db.query(ProductImage)
        .filter(ProductImage.product_id == product.id, ProductImage.url == url)
        .first()
    )
    if exists:
        return
    _ensure_media_object(object_name, rgb)
    db.add(ProductImage(product_id=product.id, url=url, is_main=is_main))


def _ensure_variant_image(db: Session, variant, object_name: str, rgb):
    url = f"uploads/{object_name}"
    exists = (
        db.query(ProductVariantImage)
        .filter(
            ProductVariantImage.variant_id == variant.id,
            ProductVariantImage.url == url,
        )
        .first()
    )
    if exists:
        return
    _ensure_media_object(object_name, rgb)
    db.add(ProductVariantImage(variant_id=variant.id, url=url, is_main=True))


def _apply_discount(entity, discount):
    if not discount:
        return
    entity.discount_enable = True
    entity.discount_type = discount["type"]
    entity.discount_value = discount["value"]


def _seed_variant(db: Session, product, axis_attrs: dict, combo: dict):
    option_pairs = []
    for axis_name, attribute in axis_attrs.items():
        value = combo.get(axis_name)
        if value is None:
            return
        option = (
            db.query(CatalogAttributeOption)
            .filter(
                CatalogAttributeOption.attribute_id == attribute.id,
                CatalogAttributeOption.value == value,
            )
            .first()
        )
        if option is None:
            return
        option_pairs.append((attribute.id, option.id))

    combo_key = build_combo_key(option_id for _, option_id in option_pairs)
    name = " / ".join(str(combo[axis]) for axis in axis_attrs)

    variant = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.product_id == product.id,
            ProductVariant.sku == combo["sku"],
        )
        .first()
    )

    if variant is None:
        variant = ProductVariant(
            product_id=product.id,
            name=name,
            sku=combo["sku"],
            price=combo["price"],
            stock=combo["stock"],
            combo_key=combo_key,
        )
        _apply_discount(variant, combo.get("discount"))
        db.add(variant)
        db.flush()

    for attribute_id, option_id in option_pairs:
        linked = (
            db.query(VariantOption)
            .filter(
                VariantOption.variant_id == variant.id,
                VariantOption.attribute_id == attribute_id,
            )
            .first()
        )
        if linked is None:
            db.add(
                VariantOption(
                    variant_id=variant.id,
                    attribute_id=attribute_id,
                    option_id=option_id,
                )
            )

    color = combo.get("Color")
    if color:
        _ensure_variant_image(
            db, variant, f"seed/variants/{variant.sku}.png",
            _PALETTE.get(color, _DEFAULT_RGB),
        )


def _seed_product(db: Session, company, data: dict):
    catalog = _get_catalog(db, data["catalog"])
    if not catalog:
        return

    variants_data = data.get("variants")
    has_variants = bool(variants_data)

    product = (
        db.query(Product)
        .filter(Product.company_id == company.id, Product.name == data["name"])
        .first()
    )

    if product is None:
        product = Product(
            company_id=company.id,
            catalog_id=catalog.id,
            name=data["name"],
            descripcion=data["descripcion"],
            price=data["price"],
            stock=data.get("stock", 0),
            has_variants=has_variants,
            applies_tax=data.get("applies_tax", True),
            is_active=True,
        )
        _apply_discount(product, data.get("discount"))
        db.add(product)
        db.flush()
    else:
        product.applies_tax = data.get("applies_tax", True)

    slug = _slug(data["name"])
    _ensure_product_image(db, product, f"seed/products/{slug}-1.png", data.get("image", _DEFAULT_RGB), True)
    _ensure_product_image(db, product, f"seed/products/{slug}-2.png", _DEFAULT_RGB, False)

    for spec_name, spec_value in data["specs"].items():
        attribute = _role_attribute(db, catalog.id, spec_name, "product")
        if attribute is not None:
            _ensure_product_attr_value(db, product.id, attribute.id, str(spec_value))

    if has_variants:
        axis_attrs: dict = {}
        for axis_name in variants_data["axes"]:
            attribute = _role_attribute(db, catalog.id, axis_name, "variant")
            if attribute is not None:
                axis_attrs[axis_name] = attribute

        for combo in variants_data["combos"]:
            _seed_variant(db, product, axis_attrs, combo)

    db.flush()


def _combos(axes, rows):
    """rows: lista de tuplas (valores..., sku, price, stock[, discount])."""
    out = []
    for row in rows:
        values = row[: len(axes)]
        rest = row[len(axes):]
        combo = dict(zip(axes, values))
        combo["sku"] = rest[0]
        combo["price"] = rest[1]
        combo["stock"] = rest[2]
        if len(rest) > 3 and rest[3]:
            combo["discount"] = rest[3]
        out.append(combo)
    return {"axes": list(axes), "combos": out}


def _PCT(value):
    return {"type": "percent", "value": value}


def _FIX(value):
    return {"type": "fixed", "value": value}


COMPANIES = [
    {
        "name": "TechNova",
        "email": "technova@rehnimarket.test",
        "nit": "900100100",
        "dv": "1",
        "address": "Calle 100 #15-20, Bogotá",
        "description": "Computadoras, componentes y periféricos para PC.",
        "products": [
            {
                "name": "PC Gamer RTX",
                "catalog": "Computadoras",
                "descripcion": "Torre gamer ensamblada, lista para juegos en 1440p a altos FPS.",
                "price": 4200000,
                "image": (34, 34, 42),
                "specs": {
                    "Marca": "ASUS", "Modelo": "ROG Strix GT15",
                    "Garantía": "12 meses", "Procesador": "Intel Core i7-13700F",
                    "Tarjeta gráfica": "NVIDIA GeForce RTX 4070 12 GB",
                    "Sistema operativo": "Windows 11 Home",
                    "Fuente de poder": "750 W 80+ Gold",
                    "Conectividad": "WiFi 6 + Bluetooth 5.2",
                },
                "variants": _combos(
                    ("Color", "Memoria RAM", "Almacenamiento"),
                    [
                        ("Negro", "16 GB", "1 TB", "TECH-PC-001", 4200000, 6),
                        ("Negro", "32 GB", "1 TB", "TECH-PC-002", 4650000, 4),
                        ("Negro", "32 GB", "2 TB", "TECH-PC-003", 5100000, 3),
                        ("Blanco", "16 GB", "1 TB", "TECH-PC-004", 4300000, 5),
                    ],
                ),
            },
            {
                "name": "Laptop Gamer",
                "catalog": "Laptops",
                "descripcion": "Portátil gamer de 16 pulgadas con pantalla de alta tasa de refresco.",
                "price": 5100000,
                "image": (40, 40, 48),
                "discount": _PCT(12),
                "specs": {
                    "Marca": "Lenovo", "Modelo": "Legion Pro 5",
                    "Garantía": "12 meses", "Procesador": "AMD Ryzen 7 7840HS",
                    "Pantalla": '16" IPS 240 Hz', "Resolución": "2560 x 1600",
                    "Tarjeta gráfica": "NVIDIA GeForce RTX 4060 8 GB",
                    "Batería": "80 Wh", "Sistema operativo": "Windows 11 Home",
                    "Peso": "2.5 kg",
                },
                "variants": _combos(
                    ("Color", "Memoria RAM", "Almacenamiento"),
                    [
                        ("Gris", "16 GB", "512 GB", "TECH-LAP-001", 5100000, 5),
                        ("Gris", "32 GB", "1 TB", "TECH-LAP-002", 5750000, 3),
                        ("Negro", "16 GB", "1 TB", "TECH-LAP-003", 5350000, 4),
                        ("Negro", "32 GB", "1 TB", "TECH-LAP-004", 5800000, 2),
                    ],
                ),
            },
            {
                "name": "Memoria RAM DDR4",
                "catalog": "Memorias RAM",
                "descripcion": "Kit de memoria DDR4 para escritorio con perfil XMP.",
                "price": 210000,
                "image": (60, 70, 90),
                "specs": {
                    "Marca": "Corsair", "Modelo": "Vengeance LPX",
                    "Garantía": "Garantía limitada de por vida", "Tipo": "DDR4",
                    "Latencia": "CL16", "Voltaje": "1.35 V",
                    "Perfil XMP/EXPO": "XMP 2.0", "Disipador": "Aluminio",
                },
                "variants": _combos(
                    ("Capacidad", "Frecuencia"),
                    [
                        ("8 GB (1x8)", "2666 MHz", "TECH-RAM-001", 160000, 20),
                        ("16 GB (2x8)", "3200 MHz", "TECH-RAM-002", 240000, 15),
                        ("32 GB (2x16)", "3200 MHz", "TECH-RAM-003", 420000, 8),
                        ("16 GB (2x8)", "3600 MHz", "TECH-RAM-004", 290000, 10),
                    ],
                ),
            },
            {
                "name": "Monitor Gaming 27",
                "catalog": "Monitores",
                "descripcion": "Monitor gaming de 27 pulgadas con panel rápido para esports.",
                "price": 920000,
                "image": (28, 30, 34),
                "specs": {
                    "Marca": "LG", "Modelo": "UltraGear 27GP",
                    "Garantía": "12 meses", "Tipo de panel": "IPS",
                    "Resolución": "2560 x 1440 (QHD)", "Tiempo de respuesta": "1 ms (GtG)",
                    "Puertos": "2x HDMI 2.1, 1x DisplayPort 1.4",
                    "Curvatura": "Plano", "Soporte VESA": "100 x 100 mm",
                },
                "variants": _combos(
                    ("Tamaño", 'Frecuencia de actualización'),
                    [
                        ('27"', "144 Hz", "TECH-MON-001", 850000, 10),
                        ('27"', "165 Hz", "TECH-MON-002", 920000, 8),
                        ('27"', "240 Hz", "TECH-MON-003", 1150000, 4),
                        ('32"', "165 Hz", "TECH-MON-004", 1090000, 5),
                    ],
                ),
            },
            {
                "name": "Teclado Mecánico RGB",
                "catalog": "Periféricos",
                "descripcion": "Teclado mecánico con iluminación RGB por tecla.",
                "price": 260000,
                "image": (44, 44, 50),
                "specs": {
                    "Marca": "Redragon", "Modelo": "Kumara K552 RGB",
                    "Garantía": "12 meses", "Tipo": "Teclado mecánico",
                    "Compatibilidad": "Windows, macOS, Linux",
                    "Cable": "USB-C desmontable trenzado de 1.8 m",
                    "Software": "Redragon Software (perfiles y macros)",
                },
                "variants": _combos(
                    ("Color", "Conexión"),
                    [
                        ("Negro", "Alámbrico", "TECH-KEY-001", 240000, 14),
                        ("Blanco", "Alámbrico", "TECH-KEY-002", 250000, 9),
                        ("Negro", "Bluetooth", "TECH-KEY-003", 300000, 7),
                        ("Rojo", "Alámbrico", "TECH-KEY-004", 250000, 6),
                    ],
                ),
            },
        ],
    },
    {
        "name": "GameZone",
        "email": "gamezone@rehnimarket.test",
        "nit": "900200200",
        "dv": "2",
        "address": "Carrera 43A #1-50, Medellín",
        "description": "Consolas, videojuegos y accesorios gaming.",
        "products": [
            {
                "name": "Nintendo Switch OLED",
                "catalog": "Consolas",
                "descripcion": "Consola híbrida con pantalla OLED de 7 pulgadas.",
                "price": 1650000,
                "image": (220, 40, 40),
                "specs": {
                    "Marca": "Nintendo", "Modelo": "Switch OLED",
                    "Garantía": "12 meses", "Generación": "8.ª generación",
                    "Resolución máxima": "1080p (dock) / 720p (portátil)",
                    "Retrocompatibilidad": "No", "Conectividad": "WiFi + Bluetooth",
                    "Servicios incluidos": "Prueba de Nintendo Switch Online",
                },
                "variants": _combos(
                    ("Color", "Edición"),
                    [
                        ("Blanco", "Estándar", "GAME-SWI-001", 1650000, 8),
                        ("Rojo", "Estándar", "GAME-SWI-002", 1650000, 6),
                        ("Blanco", "Bundle", "GAME-SWI-003", 1890000, 4),
                    ],
                ),
            },
            {
                "name": "PlayStation 5",
                "catalog": "Consolas",
                "descripcion": "Consola de sobremesa de última generación con SSD ultrarrápido.",
                "price": 2800000,
                "image": (235, 235, 240),
                "specs": {
                    "Marca": "Sony", "Modelo": "PlayStation 5 Slim",
                    "Garantía": "12 meses", "Generación": "9.ª generación",
                    "Resolución máxima": "4K a 120 Hz / 8K",
                    "Retrocompatibilidad": "Juegos de PS4",
                    "Conectividad": "WiFi 6 + Bluetooth 5.1",
                    "Servicios incluidos": "Prueba de PlayStation Plus",
                },
                "variants": _combos(
                    ("Almacenamiento", "Edición"),
                    [
                        ("1 TB", "Estándar", "GAME-PS5-001", 2800000, 7),
                        ("1 TB", "Digital", "GAME-PS5-002", 2500000, 6),
                        ("2 TB", "Bundle", "GAME-PS5-003", 3200000, 3),
                    ],
                ),
            },
            {
                "name": "Control Inalámbrico",
                "catalog": "Accesorios Gaming",
                "descripcion": "Mando inalámbrico con retroalimentación háptica.",
                "price": 230000,
                "image": (30, 30, 34),
                "specs": {
                    "Marca": "Sony", "Modelo": "DualSense",
                    "Garantía": "12 meses", "Tipo": "Control inalámbrico",
                    "Material": "Plástico ABS", "Instalación": "Plug and play",
                    "Peso": "280 g",
                },
                "variants": _combos(
                    ("Color", "Plataforma compatible"),
                    [
                        ("Blanco", "PlayStation", "GAME-CTL-001", 230000, 12),
                        ("Negro", "PlayStation", "GAME-CTL-002", 235000, 9),
                        ("Azul", "PlayStation", "GAME-CTL-003", 245000, 5),
                        ("Negro", "PC", "GAME-CTL-004", 210000, 8),
                    ],
                ),
            },
            {
                "name": "Mouse Gaming RGB",
                "catalog": "Periféricos",
                "descripcion": "Ratón gaming ligero con sensor óptico de alta precisión.",
                "price": 190000,
                "image": (36, 36, 42),
                "specs": {
                    "Marca": "Logitech", "Modelo": "G502 X",
                    "Garantía": "24 meses", "Tipo": "Ratón gaming",
                    "Compatibilidad": "Windows, macOS",
                    "Cable": "USB-A trenzado de 2.1 m",
                    "Software": "Logitech G HUB",
                },
                "variants": _combos(
                    ("Color", "Conexión"),
                    [
                        ("Negro", "Alámbrico", "GAME-MOU-001", 190000, 16),
                        ("Blanco", "Alámbrico", "GAME-MOU-002", 195000, 10),
                        ("Negro", "Inalámbrico 2.4 GHz", "GAME-MOU-003", 320000, 6),
                        ("Blanco", "Inalámbrico 2.4 GHz", "GAME-MOU-004", 330000, 4),
                    ],
                ),
            },
            {
                "name": "Audífonos Gaming",
                "catalog": "Audio",
                "descripcion": "Diadema gamer con sonido envolvente y micrófono desmontable.",
                "price": 320000,
                "image": (26, 26, 30),
                "specs": {
                    "Marca": "HyperX", "Modelo": "Cloud III",
                    "Garantía": "24 meses", "Tipo": "Diadema gaming",
                    "Conectividad": "USB / Jack 3.5 mm",
                    "Duración de batería": "No aplica (alámbrico)",
                    "Cancelación de ruido": "Pasiva",
                    "Resistencia al agua": "No",
                },
                "variants": _combos(
                    ("Color", "Tipo de uso"),
                    [
                        ("Negro", "Over-ear", "GAME-HED-001", 320000, 11),
                        ("Rojo", "Over-ear", "GAME-HED-002", 330000, 7),
                        ("Blanco", "Over-ear", "GAME-HED-003", 335000, 5),
                        ("Gris", "Over-ear", "GAME-HED-004", 320000, 6),
                    ],
                ),
            },
        ],
    },
    {
        "name": "UrbanStyle",
        "email": "urbanstyle@rehnimarket.test",
        "nit": "900300300",
        "dv": "3",
        "address": "Calle 10 #5-51, Cali",
        "description": "Ropa urbana, streetwear y calzado.",
        "products": [
            {
                "name": "Camiseta Oversize",
                "catalog": "Ropa Anime",
                "descripcion": "Camiseta de corte holgado en algodón peinado.",
                "price": 75000,
                "image": (32, 32, 36),
                "specs": {
                    "Marca": "UrbanStyle", "Modelo": "Oversize Basic",
                    "Garantía": "30 días por defectos de fábrica",
                    "Material": "Algodón", "Composición": "100% algodón peinado 180 g/m²",
                    "Tipo de estampado": "Serigrafía",
                    "Instrucciones de cuidado": "Lavar a máquina en frío, no usar secadora",
                    "País de fabricación": "Colombia",
                },
                "variants": _combos(
                    ("Talla", "Color"),
                    [
                        ("S", "Negro", "URBAN-TEE-S-BLK", 75000, 12),
                        ("M", "Negro", "URBAN-TEE-M-BLK", 75000, 15),
                        ("L", "Negro", "URBAN-TEE-L-BLK", 75000, 10),
                        ("S", "Blanco", "URBAN-TEE-S-WHT", 75000, 9),
                        ("M", "Blanco", "URBAN-TEE-M-WHT", 75000, 11),
                        ("L", "Blanco", "URBAN-TEE-L-WHT", 75000, 8),
                    ],
                ),
            },
            {
                "name": "Hoodie Anime",
                "catalog": "Ropa Anime",
                "descripcion": "Buzo con capucha y estampado inspirado en anime.",
                "price": 150000,
                "image": (40, 30, 55),
                "specs": {
                    "Marca": "UrbanStyle", "Modelo": "Anime Hoodie",
                    "Garantía": "30 días por defectos de fábrica",
                    "Material": "Mezcla algodón-poliéster",
                    "Composición": "80% algodón / 20% poliéster 320 g/m²",
                    "Tipo de estampado": "DTF",
                    "Instrucciones de cuidado": "Lavar del revés, secar a la sombra",
                    "País de fabricación": "Colombia",
                },
                "variants": _combos(
                    ("Talla", "Color"),
                    [
                        ("M", "Negro", "URBAN-HOD-M-BLK", 150000, 10),
                        ("L", "Negro", "URBAN-HOD-L-BLK", 150000, 9),
                        ("XL", "Negro", "URBAN-HOD-XL-BLK", 155000, 6),
                        ("M", "Gris", "URBAN-HOD-M-GRY", 150000, 7),
                        ("L", "Gris", "URBAN-HOD-L-GRY", 150000, 8),
                        ("XL", "Gris", "URBAN-HOD-XL-GRY", 155000, 4),
                    ],
                ),
            },
            {
                "name": "Tenis Urbanos",
                "catalog": "Calzado",
                "descripcion": "Zapatillas urbanas de silueta clásica para uso diario.",
                "price": 260000,
                "image": (28, 28, 30),
                "specs": {
                    "Marca": "UrbanStyle", "Modelo": "Street Classic",
                    "Garantía": "60 días por defectos de fábrica",
                    "Material exterior": "Cuero sintético y malla",
                    "Material interior": "Textil transpirable",
                    "Tipo de suela": "Caucho antideslizante",
                    "Género": "Unisex", "Uso recomendado": "Casual / caminata",
                },
                "variants": _combos(
                    ("Talla", "Color"),
                    [
                        ("37", "Negro", "URBAN-SHOE-037-BLK", 260000, 8),
                        ("38", "Negro", "URBAN-SHOE-038-BLK", 260000, 10),
                        ("39", "Negro", "URBAN-SHOE-039-BLK", 260000, 9),
                        ("40", "Negro", "URBAN-SHOE-040-BLK", 260000, 7, _PCT(15)),
                        ("41", "Negro", "URBAN-SHOE-041-BLK", 260000, 6),
                        ("38", "Blanco", "URBAN-SHOE-038-WHT", 260000, 5),
                        ("39", "Blanco", "URBAN-SHOE-039-WHT", 260000, 6),
                        ("40", "Blanco", "URBAN-SHOE-040-WHT", 260000, 4),
                    ],
                ),
            },
            {
                "name": "Gorra Streetwear",
                "catalog": "Gorras",
                "descripcion": "Gorra tipo snapback con visera plana y bordado frontal.",
                "price": 55000,
                "image": (34, 34, 38),
                "specs": {
                    "Marca": "UrbanStyle", "Modelo": "Snap Flat",
                    "Garantía": "30 días por defectos de fábrica",
                    "Material": "Algodón y poliéster",
                    "Tipo de visera": "Plana", "Cierre": "Snapback ajustable",
                    "Estructura": "Estructurada 6 paneles",
                },
                "variants": _combos(
                    ("Talla",),
                    [
                        ("S/M", "URBAN-CAP-001", 55000, 14),
                        ("L/XL", "URBAN-CAP-002", 55000, 10),
                        ("Ajustable", "URBAN-CAP-003", 55000, 18),
                    ],
                ),
            },
            {
                "name": "Chaqueta Urbana",
                "catalog": "Ropa Anime",
                "descripcion": "Chaqueta bomber ligera con forro interior.",
                "price": 220000,
                "image": (30, 34, 30),
                "specs": {
                    "Marca": "UrbanStyle", "Modelo": "Bomber City",
                    "Garantía": "30 días por defectos de fábrica",
                    "Material": "Poliéster", "Composición": "100% poliéster con forro acolchado",
                    "Tipo de estampado": "Parche bordado",
                    "Instrucciones de cuidado": "Limpieza en seco recomendada",
                    "País de fabricación": "Colombia",
                },
                "variants": _combos(
                    ("Talla", "Color"),
                    [
                        ("M", "Negro", "URBAN-JKT-M-BLK", 220000, 6),
                        ("L", "Negro", "URBAN-JKT-L-BLK", 220000, 7),
                        ("XL", "Negro", "URBAN-JKT-XL-BLK", 225000, 4),
                        ("M", "Verde", "URBAN-JKT-M-GRN", 220000, 5),
                        ("L", "Verde", "URBAN-JKT-L-GRN", 220000, 5),
                    ],
                ),
            },
        ],
    },
    {
        "name": "Kawaii World",
        "email": "kawaiiworld@rehnimarket.test",
        "nit": "900400400",
        "dv": "4",
        "address": "Avenida 6 #23-45, Pereira",
        "description": "Figuras, peluches, mangas y coleccionables de anime.",
        "products": [
            {
                "name": "Peluche Pikachu",
                "catalog": "Peluches",
                "descripcion": "Peluche suave de Pikachu con bordados de alta calidad.",
                "price": 90000,
                "applies_tax": False,
                "image": (245, 205, 60),
                "specs": {
                    "Marca": "Kawaii World", "Modelo": "Plush Pikachu",
                    "Garantía": "30 días por defectos de fábrica",
                    "Franquicia": "Pokémon", "Material exterior": "Felpa de poliéster",
                    "Relleno": "Fibra siliconada hipoalergénica",
                    "Edad recomendada": "3+ años", "Lavable": "Lavado a mano",
                },
                "variants": _combos(
                    ("Tamaño",),
                    [
                        ("15 cm", "KAWAII-PLU-001", 55000, 20),
                        ("25 cm", "KAWAII-PLU-002", 90000, 15),
                        ("40 cm", "KAWAII-PLU-003", 150000, 8),
                        ("60 cm", "KAWAII-PLU-004", 240000, 4),
                    ],
                ),
            },
            {
                "name": "Figura Coleccionable",
                "catalog": "Figuras Coleccionables",
                "descripcion": "Figura de PVC pintada a mano, escala 1/7, con base.",
                "price": 320000,
                "stock": 12,
                "image": (60, 40, 80),
                "specs": {
                    "Marca": "Kawaii World", "Modelo": "PVC Statue",
                    "Garantía": "30 días por defectos de fábrica",
                    "Franquicia": "Original", "Fabricante": "Good Smile Company",
                    "Material": "PVC y ABS", "Altura aproximada": "24 cm",
                    "Licencia oficial": "Sí",
                },
            },
            {
                "name": "Manga One Piece",
                "catalog": "Mangas",
                "descripcion": "Tomo de la serie One Piece en edición estándar.",
                "price": 45000,
                "image": (40, 80, 150),
                "specs": {
                    "Autor": "Eiichiro Oda", "Editorial": "Panini Manga",
                    "Idioma original": "Japonés", "Número de páginas": "208",
                    "ISBN": "978-84-1121-000-0", "Dibujante": "Eiichiro Oda",
                    "Demografía": "Shōnen", "Estado de publicación": "En publicación",
                },
                "variants": _combos(
                    ("Idioma", "Formato"),
                    [
                        ("Español", "Tomo individual", "KAWAII-MAN-001", 45000, 25),
                        ("Español", "Pack 1-3", "KAWAII-MAN-002", 120000, 12),
                        ("Inglés", "Tomo individual", "KAWAII-MAN-003", 55000, 10),
                        ("Japonés", "Tomo individual", "KAWAII-MAN-004", 60000, 6),
                    ],
                ),
            },
            {
                "name": "Llavero Anime",
                "catalog": "Llaveros",
                "descripcion": "Llavero de acrílico de doble cara con impresión a color.",
                "price": 18000,
                "image": (232, 67, 147),
                "specs": {
                    "Marca": "Kawaii World", "Modelo": "Acrylic Charm",
                    "Garantía": "Sin garantía por su naturaleza",
                    "Material": "Acrílico de 4 mm", "Dimensiones": "6 x 6 cm",
                    "Tipo de anilla": "Anilla metálica con mosquetón",
                    "Tema": "Personajes de anime",
                },
                "variants": _combos(
                    ("Color",),
                    [
                        ("Rojo", "KAWAII-KEY-001", 18000, 30),
                        ("Azul", "KAWAII-KEY-002", 18000, 28),
                        ("Verde", "KAWAII-KEY-003", 18000, 25),
                        ("Rosa", "KAWAII-KEY-004", 18000, 22),
                    ],
                ),
            },
            {
                "name": "Artbook Anime",
                "catalog": "Artbooks",
                "descripcion": "Libro de arte con ilustraciones oficiales y bocetos.",
                "price": 130000,
                "stock": 8,
                "image": (25, 30, 45),
                "discount": _PCT(10),
                "specs": {
                    "Autor": "Estudio de animación", "Editorial": "Norma Editorial",
                    "Idioma original": "Japonés", "Número de páginas": "160",
                    "ISBN": "978-84-6789-000-0", "Estudio": "Estudio original",
                    "Formato del libro": "Tapa dura 24 x 30 cm",
                    "Contenido": "Ilustraciones, bocetos y entrevistas",
                },
            },
        ],
    },
    {
        "name": "AudioMax",
        "email": "audiomax@rehnimarket.test",
        "nit": "900500500",
        "dv": "5",
        "address": "Calle 72 #10-34, Barranquilla",
        "description": "Audífonos, parlantes y wearables de audio.",
        "products": [
            {
                "name": "Audífonos Bluetooth",
                "catalog": "Audio",
                "descripcion": "Audífonos over-ear inalámbricos con hasta 30 h de autonomía.",
                "price": 180000,
                "image": (30, 30, 34),
                "specs": {
                    "Marca": "AudioMax", "Modelo": "AM-BT700",
                    "Garantía": "12 meses", "Tipo": "Diadema over-ear",
                    "Conectividad": "Bluetooth 5.3", "Duración de batería": "Hasta 30 horas",
                    "Cancelación de ruido": "Híbrida activa (ANC)",
                    "Resistencia al agua": "No",
                },
                "variants": _combos(
                    ("Color", "Tipo de uso"),
                    [
                        ("Negro", "Over-ear", "AUDIO-BT-001", 180000, 14),
                        ("Blanco", "Over-ear", "AUDIO-BT-002", 185000, 9),
                        ("Azul", "Over-ear", "AUDIO-BT-003", 185000, 6),
                        ("Rojo", "Over-ear", "AUDIO-BT-004", 185000, 5),
                    ],
                ),
            },
            {
                "name": "Audífonos TWS Pro",
                "catalog": "Audio",
                "descripcion": "Audífonos true wireless in-ear con estuche de carga rápida.",
                "price": 260000,
                "image": (34, 34, 40),
                "specs": {
                    "Marca": "AudioMax", "Modelo": "AM-TWS Pro",
                    "Garantía": "12 meses", "Tipo": "In-ear true wireless",
                    "Conectividad": "Bluetooth 5.3", "Duración de batería": "8 h + 24 h con estuche",
                    "Cancelación de ruido": "ANC adaptativa",
                    "Resistencia al agua": "IPX5",
                },
                "variants": _combos(
                    ("Color", "Conexión"),
                    [
                        ("Negro", "Bluetooth", "AUDIO-TWS-BLK-001", 260000, 12),
                        ("Blanco", "Bluetooth", "AUDIO-TWS-WHT-001", 260000, 10, _PCT(10)),
                        ("Azul", "Bluetooth", "AUDIO-TWS-BLU-001", 265000, 6),
                        ("Morado", "Bluetooth", "AUDIO-TWS-PUR-001", 265000, 4),
                    ],
                ),
            },
            {
                "name": "Parlante Bluetooth",
                "catalog": "Audio",
                "descripcion": "Parlante portátil resistente al agua con 20 h de reproducción.",
                "price": 210000,
                "image": (44, 44, 50),
                "discount": _FIX(30000),
                "specs": {
                    "Marca": "AudioMax", "Modelo": "AM-Boom 20",
                    "Garantía": "12 meses", "Tipo": "Parlante portátil",
                    "Conectividad": "Bluetooth 5.3 + entrada AUX",
                    "Duración de batería": "Hasta 20 horas",
                    "Cancelación de ruido": "No aplica",
                    "Resistencia al agua": "IP67",
                },
                "variants": _combos(
                    ("Color",),
                    [
                        ("Negro", "AUDIO-SPK-001", 210000, 12),
                        ("Azul", "AUDIO-SPK-002", 210000, 8),
                        ("Verde", "AUDIO-SPK-003", 210000, 6),
                    ],
                ),
            },
            {
                "name": "Smartwatch Sport",
                "catalog": "Smartwatch",
                "descripcion": "Reloj inteligente con GPS y más de 100 modos deportivos.",
                "price": 290000,
                "image": (28, 28, 32),
                "specs": {
                    "Marca": "AudioMax", "Modelo": "AM-Watch S1",
                    "Garantía": "12 meses", "Sistema operativo": "RTOS propietario",
                    "Sensores": "Ritmo cardíaco, SpO2, acelerómetro",
                    "Autonomía": "Hasta 12 días", "GPS": "GPS + GLONASS",
                    "Resistencia al agua": "5 ATM",
                },
                "variants": _combos(
                    ("Color", "Correa"),
                    [
                        ("Negro", "Silicona", "AUDIO-WCH-001", 290000, 10),
                        ("Negro", "Metal", "AUDIO-WCH-002", 340000, 5),
                        ("Gris", "Silicona", "AUDIO-WCH-003", 290000, 7),
                        ("Azul", "Silicona", "AUDIO-WCH-004", 290000, 6),
                        ("Negro", "Nylon", "AUDIO-WCH-005", 300000, 4),
                    ],
                ),
            },
            {
                "name": "Mouse Inalámbrico",
                "catalog": "Periféricos",
                "descripcion": "Ratón inalámbrico compacto para oficina y viajes.",
                "price": 95000,
                "image": (40, 40, 46),
                "specs": {
                    "Marca": "AudioMax", "Modelo": "AM-M300",
                    "Garantía": "12 meses", "Tipo": "Ratón inalámbrico",
                    "Compatibilidad": "Windows, macOS, Linux, ChromeOS",
                    "Cable": "No incluye (receptor USB + Bluetooth)",
                    "Software": "No requiere",
                },
                "variants": _combos(
                    ("Color", "Conexión"),
                    [
                        ("Negro", "Bluetooth", "AUDIO-MOU-001", 95000, 18),
                        ("Blanco", "Bluetooth", "AUDIO-MOU-002", 95000, 12),
                        ("Negro", "Inalámbrico 2.4 GHz", "AUDIO-MOU-003", 90000, 15),
                        ("Rosa", "Bluetooth", "AUDIO-MOU-004", 98000, 6),
                    ],
                ),
            },
        ],
    },
]


def seed_companies_and_products(db: Session):
    company_role = db.query(Role).filter(Role.name == "company").first()

    if not company_role:
        return

    password_hash = _seed_password_hash()

    for company_data in COMPANIES:
        user = db.query(Users).filter(Users.email == company_data["email"]).first()

        if user is None:
            user = Users(
                fullName=company_data["name"],
                email=company_data["email"],
                hashed_password=password_hash,
                tell="3000000000",
                verified=True,
                isActive=True,
                role_id=company_role.id,
            )
            db.add(user)
            db.flush()

        company = db.query(Company).filter(Company.user_id == user.id).first()

        if company is None:
            company = Company(
                user_id=user.id,
                nameCompany=company_data["name"],
                addressCompany=company_data["address"],
                description=company_data["description"],
                CompanyNIT=company_data["nit"],
                CompanyNITDV=company_data["dv"],
                CompanyStatus=True,
            )
            db.add(company)
            db.flush()

        for product_data in company_data["products"]:
            _seed_product(db, company, product_data)

        db.commit()


def seed_admin(db: Session):
    admin_role = db.query(Role).filter(Role.name == "admin").first()

    if not admin_role:
        return

    admin_name = config.ADMIN_NAME
    admin_email = config.ADMIN_DEFAULT
    admin_password = config.PASSWORD_DEFAULT


    exists = db.query(Users).filter(Users.email == admin_email).first()

    if not exists:
        admin = Users(
            id=uuid.uuid4(),
            fullName=admin_name,
            email=admin_email,
            tell="0000000000",
            hashed_password=hash_password(admin_password),
            role_id=admin_role.id,
            verified = True

        )

        db.add(admin)
        db.commit()


def seed_owner(db: Session):
    owner_role = db.query(Role).filter(Role.name == "owner").first()

    if not owner_role:
        return

    owner_name = config.OWNER_NAME
    owner_email = config.OWNER_DEFAULT
    owner_password = config.OWNER_PASSWORD_DEFAULT

    if not owner_name or not owner_email or not owner_password:
        return

    exists = db.query(Users).filter(Users.email == owner_email).first()

    if not exists:
        owner = Users(
            id=uuid.uuid4(),
            fullName=owner_name,
            email=owner_email,
            tell="0000000000",
            hashed_password=hash_password(owner_password),
            role_id=owner_role.id,
            verified = True

        )

        db.add(owner)
        db.commit()


def seed_shipping_carriers(db: Session):

    if db.query(ShippingCarrier).first():
        return

    carriers = [
        ("Servientrega", "https://www.servientrega.com/wps/portal/rastreo-envio?guia={tracking}"),
        ("Coordinadora", "https://www.coordinadora.com/rastreo/rastreo-de-guia/?guia={tracking}"),
        ("Interrapidísimo", "https://interrapidisimo.com/sigue-tu-envio/?guia={tracking}"),
        ("Envía", "https://envia.co/rastreo?guia={tracking}"),
    ]

    for name, tracking_url in carriers:
        db.add(ShippingCarrier(name=name, tracking_url=tracking_url, is_active=True))

    db.commit()


def run_seed(db: Session):
    seed_roles(db)
    seed_catalog(db)
    seed_specifications(db)
    seed_catalog_attributes(db)
    seed_admin(db)
    seed_owner(db)
    seed_shipping_carriers(db)
