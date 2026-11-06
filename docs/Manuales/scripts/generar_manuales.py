"""Arma los documentos de docs/Manuales/ con el diseño aprobado (diseno_sena.py):

- Manual de usuario.docx
- Manual Tecnico.docx
- Diccionario de datos.docx
- capturas/LISTA-CAPTURAS.md (capturas pendientes) y lista-imagenes.md (figuras y datos por verificar)

Los diagramas se insertan desde docs/Manuales/diagramas/png/; las capturas de pantalla quedan como
recuadros amarillos que se reemplazan a mano. La tabla de contenido es un campo TOC que se precarga con
los números de página medidos en una conversión a PDF (OnlyOffice x2t) y se puede actualizar en OnlyOffice.

Uso, desde la raíz del repositorio:
    uv run --project docs/Manuales/scripts python docs/Manuales/scripts/generar_manuales.py
"""

from __future__ import annotations

import json
import re
import subprocess
import unicodedata
from collections import Counter
from pathlib import Path

import contenido_diccionario as cdd
import contenido_tecnico as ct
import contenido_usuario as cu
import diseno_sena as d
import diagramas_modelo as dm
from convertir_pdf import convertir
from datos_comunes import CONTROL_VERSIONES, FECHA, PORTADA, VERSION

DATOS = d.SCRIPTS / "datos"
PNG = d.MANUALES / "diagramas" / "png"
LEGIBLE_MM = 1.85        # alto mínimo de la letra de un diagrama en la página
REPO = d.REPO


def _json(n):
    return json.loads((DATOS / n).read_text(encoding="utf-8"))


def slug(t: str) -> str:
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:50].strip("-")


def portada_lineas(nombre: str, criterio: str) -> list[str]:
    return [
        "SERVICIO NACIONAL DE APRENDIZAJE — SENA",
        PORTADA["centro"],
        f"PROGRAMA: {PORTADA['programa'].upper()}",
        f"FICHA: {PORTADA['ficha']} — TRIMESTRE: SEXTO",
        f"COMPETENCIA: {PORTADA['competencia']}",
        "PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRÓNICO TIPO MARKETPLACE",
        f"CRITERIO DE EVALUACIÓN SENA: 5 — {criterio}",
        f"{nombre.upper()} — VERSIÓN {VERSION}",
        f"Autor: {PORTADA['autor']} — Instructor: {PORTADA['instructor']}",
        FECHA,
    ]


def convertir_texto(t: str) -> str:
    """«x» → “x” (elemento de interfaz, negrita); **x** → x."""
    t = re.sub(r"«([^»]+)»", r"“\1”", t)
    return re.sub(r"\*\*([^*]+)\*\*", r"\1", t)


# --- registro de figuras --------------------------------------------------------------

class Figuras:
    """Numeración consecutiva por capítulo (Figura 5.1, 5.2…). Se calcula antes de pintar para
    resolver las referencias {fig:clave} que aparecen antes que la figura."""

    def __init__(self):
        self.contador: Counter = Counter()
        self.por_clave: dict[str, str] = {}
        self.cola: list[str] = []

    def asignar(self, capitulo: str, clave: str | None) -> str:
        self.contador[capitulo] += 1
        n = f"{capitulo}.{self.contador[capitulo]}"
        if clave:
            self.por_clave[clave] = n
        self.cola.append(n)
        return n


def expandir(bloques: list) -> list:
    """Bloques especiales que se convierten en varios bloques."""
    out = []
    for b in bloques:
        if b[0] == "clases":
            for k, (titulo, _) in dm.MODULOS.items():
                out.append(("img", f"diagramas/png/clases-{k}.png", f"Diagrama de clases: {titulo[0].lower() + titulo[1:]}", None))
        elif b[0] == "modelos":
            for k, (titulo, _) in dm.MODULOS.items():
                out.append(("img", f"diagramas/png/modelo-{k}.png", f"Modelo entidad-relación: {titulo[0].lower() + titulo[1:]}",
                            f"modelo-{k}"))
        else:
            out.append(b)
    return out


# --- documento ----------------------------------------------------------------------

class Documento:
    def __init__(self, archivo: str, encabezado: str, carpeta_capturas: str, perfil_defecto: str = ""):
        self.archivo = d.MANUALES / archivo
        self.encabezado = encabezado
        self.carpeta = carpeta_capturas
        self.figs = Figuras()
        self.figuras: list = []        # (número, título, archivo, estado)
        self.capturas: list = []       # dict por captura
        self.titulos: list = []        # (nivel, texto, clave de búsqueda)
        self.verificar: list = []      # (sección, texto)

    # numeración previa
    def prenumerar(self, secciones):
        for _, numero, _, bloques in secciones:
            cap = numero.split(".")[0]
            for b in bloques:
                if b[0] in ("img", "captura"):
                    self.figs.asignar(cap, b[-1])

    def t(self, s: str) -> str:
        s = convertir_texto(s)
        s = re.sub(r"\{fig:([a-z0-9-]+)\}", lambda m: f"Figura {self.figs.por_clave[m.group(1)]}", s)
        for v in re.findall(r"\[VERIFICAR[^\]]*\]", s):
            self.verificar.append((self._sec, v))
        return s

    # construcción
    def nuevo(self, entradas_tdc=None, portada=None, intro_titulo="", intro=None):
        self.doc = d.nuevo_documento(self.encabezado)
        self._sec = "Portada"
        self.figuras, self.capturas, self.verificar, self.titulos = [], [], [], []
        self.figs.cola_pos = 0
        d.portada(self.doc, [self.t(x) for x in portada])
        d.tabla_contenido(self.doc, entradas_tdc)
        self._sec = intro_titulo
        self.doc.add_paragraph(intro_titulo, style=d.E_TITULO_MANUAL)
        self.titulos.append((1, intro_titulo, intro_titulo))
        for b in intro or []:
            d.texto(self.doc.add_paragraph(style=d.E_TEXTO), self.t(b[1]))
        self.tabla = None
        self._horizontal = False

    def _vertical(self):
        if self._horizontal:
            d.volver_vertical(self.doc)
            self._horizontal = False

    def _tabla(self):
        self._vertical()
        if self.tabla is None:
            self.tabla = d.tabla_sena(self.doc)
        return self.tabla

    def _siguiente_figura(self) -> str:
        n = self.figs.cola[self.figs.cola_pos]
        self.figs.cola_pos += 1
        return n

    def seccion(self, nivel, numero, titulo, bloques):
        self._sec = numero
        texto_titulo = f"{numero}. {titulo}" if nivel == 1 else f"{numero} {titulo}"
        self.titulos.append((nivel, texto_titulo, numero))
        celda = d.fila_seccion(self.doc, self._tabla(), numero, texto_titulo, nivel)
        self.det = d.Detalle(self.doc, celda, self.figuras)
        self._sin_fila = False
        for b in bloques:
            self.bloque(b)

    def _det(self):
        if self._sin_fila:
            self.det = d.Detalle(self.doc, d.fila_continuacion(self.doc, self._tabla()), self.figuras)
            self._sin_fila = False
        return self.det

    def bloque(self, b):
        k = b[0]
        if k == "p":
            self._det().p(self.t(b[1]))
        elif k == "sub":
            self._det().sub(self.t(b[1]))
        elif k == "paso":
            det = self._det()
            det.paso(b[1], self.t(b[2]))
            if b[3]:
                det.p(self.t(b[3]))
        elif k in ("ul", "ol"):
            self._det().lista([self.t(x) for x in b[1]], numerada=(k == "ol"))
        elif k == "code":
            self._det().codigo(b[1])
        elif k == "tabla":
            enc, filas, anchos = b[1], b[2], b[3]
            self._det().subtabla([self.t(x) for x in enc], [[self.t(str(c)) for c in f] for f in filas],
                                 anchos or [1] * len(enc))
        elif k == "captura":
            self.captura(*b[1:])
        elif k == "img":
            self.imagen(d.MANUALES / b[1], self.t(b[2]))
        else:
            raise ValueError(b)

    def captura(self, titulo, ruta, estado, resaltar, perfil, clave):
        num = self._siguiente_figura()
        archivo = f"docs/Manuales/capturas/{self.carpeta}/fig-{num.replace('.', '-')}-{slug(titulo)}.png"
        perfil = perfil or "—"
        self._det().recuadro_captura(num, self.t(titulo), archivo, self.t(perfil), self.t(ruta), self.t(estado),
                                     self.t(resaltar))
        self.capturas.append({"figura": num, "titulo": convertir_texto(titulo), "archivo": archivo,
                              "perfil": perfil, "ruta": convertir_texto(ruta), "estado": convertir_texto(estado),
                              "resaltar": convertir_texto(resaltar), "seccion": self._sec})
        self.figuras[-1] = (num, convertir_texto(titulo), archivo, "pendiente")

    def imagen(self, ruta: Path, titulo: str):
        num = self._siguiente_figura()
        celda_mm = d.legibilidad(ruta, d.ANCHO_IMAGEN, d.ALTO_MAX_IMAGEN)
        fila_mm = d.legibilidad(ruta, d.ANCHO_FILA, d.ALTO_MAX_VERTICAL)
        horiz_mm = d.legibilidad(ruta, d.ANCHO_HORIZONTAL, d.ALTO_MAX_HORIZONTAL)
        if celda_mm >= LEGIBLE_MM:
            self._det().imagen(ruta, num, titulo)
            return
        if fila_mm >= LEGIBLE_MM or fila_mm >= horiz_mm:
            if not self._sin_fila:          # tras otra figura de fila completa, sin fila intermedia
                det = self._det()
                if not det.c.paragraphs[0].runs and len(det.c.paragraphs) == 1:
                    det.p(f"Ver la Figura {num}.")
            d.fila_figura(self.doc, self._tabla(), ruta, num, titulo, self.figuras)
        else:
            # Tras otra figura de página completa no se abre una fila nueva (dejaría una página casi vacía).
            if not self._sin_fila:
                self.det.p(f"La Figura {num} se presenta en la página siguiente, en orientación horizontal.")
            d.pagina_horizontal(self.doc, ruta, num, titulo, self.figuras, nueva_seccion=not self._horizontal)
            self._horizontal = True
            self.tabla = None
        self._sin_fila = True

    # cierre del documento
    def titulo_libre(self, texto):
        self._sec = texto
        self._vertical()
        self.tabla = None
        self.doc.add_paragraph(texto, style=d.E_TITULO_MANUAL)
        self.titulos.append((1, texto, texto))

    def tabla_libre(self, enc, filas, anchos):
        t = self.doc.add_table(rows=1, cols=len(enc))
        t.style = self.doc.styles[d.T_SUB]
        for c, h in zip(t.rows[0].cells, enc):
            c.paragraphs[0].style = self.doc.styles[d.E_CABECERA_SUBTABLA]
            d.texto(c.paragraphs[0], h)
        d._cabecera_repetida(t.rows[0])
        for f in filas:
            for c, v in zip(t.add_row().cells, f):
                c.paragraphs[0].style = self.doc.styles[d.E_TEXTO_SUBTABLA]
                d.texto(c.paragraphs[0], self.t(str(v)))
        factor = d.ANCHO_TEXTO / sum(anchos)
        d._anchos(t, [a * factor for a in anchos], d.SANGRIA_TABLA)

    def cierre(self, glosario, bibliografia):
        if glosario:
            self.titulo_libre("Glosario")
            for termino, definicion in glosario:
                p = self.doc.add_paragraph(style=d.E_TEXTO)
                p.add_run(f"{termino}: ", style=d.C_INTERFAZ)
                d.texto(p, self.t(definicion))
        self.titulo_libre("Bibliografía")
        for b in bibliografia:
            d.texto(self.doc.add_paragraph(style=d.E_TEXTO), self.t(b))
        self.titulo_libre("Control del documento")
        self.tabla_libre(["Versión", "Fecha", "Autor", "Cambios"], [list(f) for f in CONTROL_VERSIONES],
                         [1.6, 2.2, 3.2, 9.5])

    def guardar(self):
        self.doc.save(self.archivo)


# --- tabla de contenido con número de página -------------------------------------------

def _palabras(pdf: Path):
    html = subprocess.run(["pdftotext", "-bbox-layout", str(pdf), "-"], capture_output=True, text=True).stdout
    paginas = []
    for pag in re.findall(r"<page[^>]*>(.*?)</page>", html, re.S):
        paginas.append([(float(x), float(y), unicodedata.normalize("NFC", w).replace("&amp;", "&"))
                        for x, y, w in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)"[^>]*>([^<]*)</word>',
                                                  pag)])
    return paginas


def paginas_titulos(pdf: Path, titulos, marca_inicio: str) -> dict:
    """Página de cada título: los numerados se buscan como palabra en la columna No. (x < 110 pt) y los
    libres como frase. Solo cuentan las páginas desde la que contiene `marca_inicio`."""
    paginas = _palabras(pdf)
    inicio = next(i for i, ws in enumerate(paginas) if marca_inicio in " ".join(w for *_, w in ws))
    out = {}
    for nivel, texto, clave in titulos:
        for i in range(inicio, len(paginas)):
            ws = paginas[i]
            if re.fullmatch(r"\d+(\.\d+)*", clave):
                if any(w == clave and x < 110 for x, _, w in ws):
                    out[clave] = i + 1
                    break
            else:
                linea = " ".join(w for *_, w in ws)
                if re.search(r"(^| )" + re.escape(clave) + r"( |$)", linea):
                    out[clave] = i + 1
                    break
    return out


def construir(doc: Documento, pintar, marca_inicio: str):
    """Dos pasadas: la primera mide las páginas de los títulos y la segunda precarga la tabla de
    contenido con esos números (mismo número de entradas, así no cambia la paginación)."""
    pintar(None)
    doc.guardar()
    pdf = doc.archivo.with_suffix(".pdf")
    for _ in range(2):
        convertir(doc.archivo, pdf)
        pags = paginas_titulos(pdf, doc.titulos, marca_inicio)
        entradas = [(n, t, pags.get(c, "")) for n, t, c in doc.titulos]
        pintar(entradas)
        doc.guardar()
    convertir(doc.archivo, pdf)
    faltan = [t for _, t, c in doc.titulos if c not in pags]
    if faltan:
        print("  títulos sin página:", faltan)
    return pdf


# --- manual de usuario --------------------------------------------------------------

def manual_usuario() -> Documento:
    doc = Documento("Manual de usuario.docx", "Manual de usuario — RehniMarket", "usuario")
    errores = [(2, num, titulo, [("p", f"Se relacionan {len(filas)} mensajes."),
                                 ("tabla", ["Mensaje", "Dónde aparece", "Causa", "Acción a seguir"], filas,
                                  [4.4, 2.4, 2.6, 2.6])])
               for num, titulo, filas in cu.TABLAS_ERRORES]
    secciones = [(n, num, t, expandir(b)) for n, num, t, b in cu.SECCIONES] + errores
    doc.prenumerar(secciones)

    def pintar(entradas):
        doc.nuevo(entradas, portada_lineas("Manual de usuario", "Manual de usuario"), "Manual de usuario", cu.INTRO)
        for s in secciones:
            doc.seccion(*s)
        doc.cierre(cu.GLOSARIO, cu.BIBLIOGRAFIA)

    construir(doc, pintar, "Este manual sigue la estructura")
    return doc


# --- manual técnico -----------------------------------------------------------------

def arbol() -> str:
    """Árbol de directorios del monorepositorio (dos niveles, más app/ y src/), desde git."""
    dirs = subprocess.run(["git", "ls-tree", "-d", "-r", "--name-only", "HEAD"], cwd=REPO, capture_output=True,
                          text=True).stdout.splitlines()
    excluir = re.compile(r"(^|/)(\.|node_modules|__pycache__|dist|build|assets|public|versions|_)")
    expandir_en = {"RehniMarket-backend", "RehniMarket-backend/app", "RehniMarket-frontend",
                   "RehniMarket-frontend/src", "docs", "scripts", "tests", "caddy", "deploy"}
    lineas = ["Rehni-Market/"]

    def hijos(base):
        pref = base + "/" if base else ""
        return sorted({x[len(pref):].split("/")[0] for x in dirs if x.startswith(pref) and x != base})

    def pintar(base, nivel):
        for h in hijos(base):
            ruta = f"{base}/{h}" if base else h
            if excluir.search(h) or (nivel == 0 and h == "RehniMarket-mobile"):
                if h == "RehniMarket-mobile":
                    lineas.append("  " * (nivel + 1) + "RehniMarket-mobile/   (aplicación móvil, fuera del alcance)")
                continue
            lineas.append("  " * (nivel + 1) + h + "/")
            if ruta in expandir_en:
                pintar(ruta, nivel + 1)

    pintar("", 0)
    lineas += ["  .github/workflows/", "  docker-compose.yml", "  sonar-project.properties"]
    return "\n".join(lineas)


def _tipo(t: str) -> str:
    t = re.sub(r"character varying\((\d+)\)", r"varchar(\1)", t)
    t = t.replace("timestamp with time zone", "timestamptz").replace("timestamp without time zone", "timestamp")
    return t.replace("character varying", "varchar")


def secciones_modelo_tecnico() -> list:
    e = _json("esquema.json")
    nfk = sum(1 for t in e["tables"] for c in (t["constraints"] or []) if c["type"] == "f")
    filas_mod = [[titulo, ", ".join(ns)] for _, (titulo, ns) in dm.MODULOS.items()]
    nombres = sorted(t["name"] for t in e["tables"])
    filas = (len(nombres) + 1) // 2
    listado = "\n".join("  ".join(f"{n:<30}" for n in nombres[i::filas]).rstrip() for i in range(filas))
    return [(1, "5", "Modelo relacional de la base de datos", [
        ("p", f"La base de datos PostgreSQL contiene {len(e['tables'])} tablas de negocio, más alembic_version, con "
              f"{nfk} llaves foráneas y {len(e['enums'])} tipos enumerados (revisión {e['alembic']}). Las tablas se "
              f"agrupan en {len(dm.MODULOS)} módulos:"),
        ("tabla", ["Módulo", "Tablas"], filas_mod, [3.6, 8.2]),
        ("sub", "Relaciones principales"),
        ("ul", ["users es el centro del modelo: de ella dependen la empresa (company, uno a uno), la billetera "
                "(wallets, uno a uno), el carrito, los pedidos, las direcciones, los favoritos, las reseñas y los "
                "reportes.",
                "company publica products; cada producto tiene product_variants, que son la unidad que se vende, con "
                "sus imágenes, opciones y atributos.",
                "catalog define la categoría del producto y sus catalog_attributes, que se usan como atributos de "
                "producto o como ejes de variante.",
                "orders agrupa los order_items de una sola empresa; un checkout crea un pedido por empresa. "
                "return_requests apunta al order_item devuelto.",
                "wallet_transactions registra cada movimiento de la billetera y apunta al pedido cuando es una compra "
                "o un reembolso.",
                "company_payouts liquida las ventas de una empresa a una de sus company_bank_accounts."]),
        ("p", "La {fig:modelo-general} muestra los módulos y el número de llaves foráneas entre ellos. Los "
              "diagramas entidad-relación de cada módulo, el detalle de cada tabla (campos, tipos, llaves y "
              "restricciones) y el significado de los tipos enumerados están en el documento «Diccionario de "
              "datos»."),
        ("img", "diagramas/png/modelo-relacional.png", "Modelo relacional por módulos", "modelo-general"),
        ("sub", "Tablas en PostgreSQL"),
        ("p", "Tablas del esquema public (`\\dt` en psql), además de alembic_version:"),
        ("code", listado),
    ])]


def secciones_api() -> list:
    ep = _json("endpoints.json")
    desc = _json("descripciones-endpoints.json")
    orden = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    ops = sorted(ep["operations"], key=lambda o: (o["path"], orden.index(o["method"])))
    filas = [[o["method"], o["path"], desc.get(f"{o['method']} {o['path']}", {}).get("rol", "—"),
              desc.get(f"{o['method']} {o['path']}", {}).get("descripcion", o["summary"])] for o in ops]
    roles = Counter(f[2] for f in filas)
    err = _json("errores.json")
    return [
        (2, "7.3", "Endpoints", [
            ("p", f"La API expone {len(ops)} operaciones en la versión {ep['version']}, tomadas de su OpenAPI. Rol "
                  "indica quién puede llamarla según el middleware: "
                  + ", ".join(f"{r} ({n})" for r, n in roles.most_common()) + ". La documentación interactiva se "
                  "describe en el numeral 7.6."),
            ("tabla", ["Método", "Ruta", "Rol", "Descripción"], filas, [1.3, 4.6, 1.7, 4.2]),
        ]),
        (2, "7.4", "Catálogo de errores", [
            ("p", "Los errores se devuelven como `{\"detail\": {\"code\": \"...\", \"message\": \"...\"}}`. Se "
                  f"relacionan los {len(err)} mensajes distintos extraídos del código (api_error y respuestas de los "
                  "middlewares); {valor} indica texto dinámico. Los errores de validación de esquemas (422 de "
                  "FastAPI) se transforman al mismo formato."),
            ("tabla", ["Código", "HTTP", "Mensaje"], [[e["code"], str(e["status"]), e["message"]] for e in err],
             [4.0, 1.1, 6.7]),
        ]),
    ]


def manual_tecnico() -> Documento:
    doc = Documento("Manual Tecnico.docx", "Manual técnico — RehniMarket", "tecnico")
    codigo = [s for s in ct.SECCIONES_CODIGO if s[1] in ("7", "7.1", "7.2")] + secciones_api() + \
        [s for s in ct.SECCIONES_CODIGO if s[1] in ("7.5", "7.6")]
    codigo = [(n, num, t, [("code", arbol()) if b == ("arbol",) else b for b in bl]) for n, num, t, bl in codigo]
    secciones = (ct.SECCIONES_INICIO + secciones_modelo_tecnico() + ct.SECCIONES_PLATAFORMA + codigo + ct.ANS +
                 [(1, "9", "Limitaciones y pendientes conocidos", [
                     ("p", "Limitaciones vigentes en el código de develop a la fecha de este documento:"),
                     ("ol", ct.LIMITACIONES)])])
    secciones = [(n, num, t, expandir(b)) for n, num, t, b in secciones]
    doc.prenumerar(secciones)

    def pintar(entradas):
        doc.nuevo(entradas, portada_lineas("Manual técnico", "Manual técnico"), "Manual técnico", ct.INTRO)
        for s in secciones:
            doc.seccion(*s)
        doc.cierre(ct.GLOSARIO, ct.BIBLIOGRAFIA)

    construir(doc, pintar, "Este manual va dirigido")
    return doc


# --- diccionario de datos -------------------------------------------------------------

def _llaves(t):
    pk = {c for co in (t["constraints"] or []) if co["type"] == "p" for c in co["cols"]}
    llave, restr, generales = {}, {}, []
    for c in pk:
        llave.setdefault(c, []).append("PK")
    for co in t["constraints"] or []:
        cols = co["cols"] or []
        if co["type"] == "f":
            accion = re.search(r"ON DELETE (CASCADE|SET NULL|RESTRICT)", co["def"])
            for c in cols:
                llave.setdefault(c, []).append(f"FK → {co['ref'].strip(chr(34))}")
                if accion:
                    restr.setdefault(c, []).append(f"ON DELETE {accion.group(1)}")
        elif co["type"] == "u":
            for c in cols:
                if len(cols) == 1:
                    llave.setdefault(c, []).append("UK")
                restr.setdefault(c, []).append("UNIQUE" if len(cols) == 1 else f"UNIQUE ({', '.join(cols)})")
        elif co["type"] == "c":
            if cols:
                for c in cols:
                    restr.setdefault(c, []).append(re.sub(r"^CHECK ", "CHECK ", co["def"]))
            else:
                generales.append(co["def"])
    nombres = {c["name"] for c in t["columns"]}
    for u in t["uindexes"] or []:
        m = re.search(r"\((.+?)\)(?: WHERE (.+))?$", u["def"])
        if not m:
            continue
        cols = [x.strip().strip('"') for x in m.group(1).split(",")]
        txt = f"UNIQUE ({', '.join(cols)})" + (f" WHERE {m.group(2)}" if m.group(2) else "")
        for c in cols:
            if c in nombres:
                restr.setdefault(c, []).append(txt)
                if len(cols) == 1 and not m.group(2) and "UK" not in llave.get(c, []):
                    llave.setdefault(c, []).append("UK")
    return llave, restr, generales


def _default(v):
    if v is None:
        return None
    v = re.sub(r"::[a-z_ ]+(\(\d+\))?", "", v)
    return v[1:-1] if v.startswith("(") and v.endswith(")") else v


def diccionario() -> Documento:
    doc = Documento("Diccionario de datos.docx", "Diccionario de datos — RehniMarket", "diccionario")
    e = _json("esquema.json")
    desc = _json("descripciones-tablas.json")
    modulo_de = {n: titulo for _, (titulo, ns) in dm.MODULOS.items() for n in ns}
    tablas = sorted(e["tables"], key=lambda t: t["name"].lower())
    secciones = [
        (1, "1", "Introducción", cdd.INTRODUCCION),
        (1, "2", "Modelo relacional", [
            ("p", "La {fig:modelo-general} muestra los módulos del modelo y el número de llaves foráneas entre ellos. "
                  "Las figuras siguientes presentan el diagrama entidad-relación de cada módulo con sus columnas; "
                  "las tablas de otros módulos a las que apunta una llave foránea aparecen sin columnas. La notación "
                  "es la de pata de gallo: || exactamente uno, |o cero o uno, o{ cero o muchos."),
            ("img", "diagramas/png/modelo-relacional.png", "Modelo relacional por módulos", "modelo-general"),
            ("modelos",),
        ]),
        (1, "3", "Tablas", [
            ("p", f"Se presenta una tabla por cada una de las {len(tablas)} tablas de la base de datos, en orden "
                  "alfabético. Los nombres de columna se conservan tal como están en la base de datos."),
        ]),
    ]
    for i, t in enumerate(tablas, 1):
        llave, restr, generales = _llaves(t)
        dsc = desc.get(t["name"], {"descripcion": "", "columnas": {}})
        filas = []
        for c in t["columns"]:
            r = list(restr.get(c["name"], []))
            df = _default(c["default"])
            if df:
                r.insert(0, f"default {df}")
            filas.append([c["name"], _tipo(c["type"]), "Sí" if c["nullable"] else "No",
                          ", ".join(dict.fromkeys(llave.get(c["name"], []))) or "—", "; ".join(r) or "—",
                          dsc["columnas"].get(c["name"], "")])
        bloques = [("p", f"{dsc['descripcion']}. Módulo: {modulo_de[t['name']]}. {len(filas)} columnas."),
                   ("tabla", ["Campo", "Tipo", "Nulo", "Llave", "Restricciones", "Descripción"], filas,
                    [2.2, 2.4, 0.8, 1.8, 2.1, 2.5])]
        for g in generales:
            bloques.append(("p", f"Restricción de tabla: `{g}`"))
        secciones.append((2, f"3.{i}", f"Tabla {t['name']}", bloques))
    filas_enum = []
    for en in e["enums"]:
        uso, vals = cdd.ENUMS[en["name"]]
        assert set(vals) == set(en["values"]), en["name"]
    secciones.append((1, "4", "Tipos enumerados", [
        ("p", f"La base de datos define {len(e['enums'])} tipos enumerados. Para cada uno se indica dónde se usa y el "
              "significado de sus valores."),
    ]))
    for i, en in enumerate(e["enums"], 1):
        uso, vals = cdd.ENUMS[en["name"]]
        secciones.append((2, f"4.{i}", f"Tipo {en['name']}", [
            ("p", uso), ("tabla", ["Valor", "Significado"], [[v, vals[v]] for v in en["values"]], [3.6, 8.2])]))
    secciones = [(n, num, t, expandir(b)) for n, num, t, b in secciones]
    doc.prenumerar(secciones)

    def pintar(entradas):
        doc.nuevo(entradas, portada_lineas("Diccionario de datos", "Manual técnico — Diccionario de datos"),
                  "Diccionario de datos", cdd.INTRO)
        for s in secciones:
            doc.seccion(*s)
        doc.cierre(None, ct.BIBLIOGRAFIA[:1])

    construir(doc, pintar, "Este documento describe la base")
    return doc


# --- listas ---------------------------------------------------------------------------

DATOS_PRUEBA = """## Datos de prueba que deben estar cargados

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
"""


def lista_capturas(docs: dict[str, Documento]):
    lineas = ["# Capturas de pantalla pendientes", "",
              "Generado por `docs/Manuales/scripts/generar_manuales.py`. Cada captura corresponde a un recuadro "
              "amarillo del documento: borrar el recuadro, pegar la imagen en su lugar (en línea con el texto) y "
              "conservar el pie de figura. Guardar el archivo con el nombre indicado.", "",
              "Formato: PNG, ventana del navegador a 1366 × 768 o más, sin datos personales reales. Resaltar con un "
              "recuadro o una flecha roja lo que indica la columna «Qué resaltar».", "", DATOS_PRUEBA]
    perfiles = ["Visitante", "Comprador", "Empresa", "Administrador", "Propietario"]
    for nombre, doc in docs.items():
        if not doc.capturas:
            continue
        lineas += [f"## {nombre}", ""]
        grupos: dict[str, list] = {}
        for c in doc.capturas:
            clave = next((p for p in perfiles if c["perfil"].startswith(p)), c["perfil"].split(" —")[0])
            if "inválido" in c["perfil"]:
                clave = "Empresa con certificado no válido"
            grupos.setdefault(clave, []).append(c)
        orden = perfiles[:3] + ["Empresa con certificado no válido"] + perfiles[3:]
        for perfil, caps in sorted(grupos.items(), key=lambda g: orden.index(g[0]) if g[0] in orden else 99):
            cuentas = sorted({c["perfil"] for c in caps})
            lineas += [f"### {perfil} (plataforma web)", "", "Cuenta: " + "; ".join(cuentas), "",
                       "| ✓ | Figura | Archivo | Ruta o pantalla | Estado que debe mostrar | Qué resaltar |",
                       "|---|---|---|---|---|---|"]
            for c in caps:
                lineas.append(f"| [ ] | {c['figura']} {c['titulo']} | `{Path(c['archivo']).name}` | {c['ruta']} | "
                              f"{c['estado']} | {c['resaltar']} |")
            lineas.append("")
        lineas.append(f"Carpeta: `docs/Manuales/capturas/{doc.carpeta}/`")
        lineas.append("")
    destino = d.MANUALES / "capturas" / "LISTA-CAPTURAS.md"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text("\n".join(lineas), encoding="utf-8")


def lista_imagenes(docs: dict[str, Documento]):
    lineas = ["# Figuras y datos por verificar de los manuales", "",
              "Generado por `docs/Manuales/scripts/generar_manuales.py`: no editar a mano. Las capturas pendientes, "
              "con sus instrucciones, están en `docs/Manuales/capturas/LISTA-CAPTURAS.md`.", ""]
    for nombre, doc in docs.items():
        lineas += [f"## {nombre}", "", "| Figura | Título | Tipo | Estado | Archivo |", "|---|---|---|---|---|"]
        for num, titulo, archivo, estado in doc.figuras:
            tipo = "captura" if estado == "pendiente" else "diagrama"
            lineas.append(f"| {num} | {titulo} | {tipo} | {estado} | `{archivo}` |")
        lineas.append("")
    lineas += ["## Datos por verificar", "", "Resaltados en amarillo como `[VERIFICAR: …]`.", "",
               "| Documento | Sección | Pendiente |", "|---|---|---|"]
    for nombre, doc in docs.items():
        vistos = set()
        for sec, v in doc.verificar:
            if (sec, v) not in vistos:
                vistos.add((sec, v))
                lineas.append(f"| {nombre} | {sec} | {v} |")
    (d.MANUALES / "lista-imagenes.md").write_text("\n".join(lineas) + "\n", encoding="utf-8")


def main():
    docs = {}
    for nombre, f in (("Manual de usuario", manual_usuario), ("Manual técnico", manual_tecnico),
                      ("Diccionario de datos", diccionario)):
        print("→", nombre)
        doc = f()
        docs[nombre] = doc
        ins = sum(1 for f_ in doc.figuras if f_[3] == "insertada")
        print(f"  {len(doc.figuras)} figuras ({ins} insertadas, {len(doc.capturas)} capturas pendientes), "
              f"{len(set(v for _, v in doc.verificar))} datos por verificar")
        print("  ", d.validar_editable(doc.archivo))
    lista_capturas(docs)
    lista_imagenes(docs)


if __name__ == "__main__":
    main()
