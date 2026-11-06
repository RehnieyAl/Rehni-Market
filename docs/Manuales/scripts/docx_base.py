"""Formato común de los manuales: página, estilos, portada, encabezado, pie,
tablas No. / Descripción / Detalle, figuras y marcadores resaltados.

El contenido se describe con bloques (tuplas) que se pintan dentro de la columna
Detalle. Formato en línea admitido en los textos: **negrita** y `monoespaciado`.
Los textos [CAPTURA PENDIENTE: …] y [VERIFICAR: …] se resaltan en amarillo.
"""

from __future__ import annotations

import re
import struct
from dataclasses import dataclass, field
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_COLOR_INDEX, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.table import _Cell

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parents[2]
MANUALES = SCRIPTS.parent
LOGO = REPO / "RehniMarket-frontend" / "src" / "assets" / "logo.png"

VERDE_SENA = "39A900"
GRIS_CLARO = "F2F2F2"
FUENTE = "Arial"

# Carta, márgenes de 2,5 cm: ancho útil 16,59 cm
ANCHO_UTIL = 16.5
COL_NO, COL_DESC = 1.3, 3.3
COL_DETALLE = ANCHO_UTIL - COL_NO - COL_DESC
ANCHO_IMAGEN = COL_DETALLE - 0.4
ALTO_MAX_IMAGEN = 19.0

MARCADOR = re.compile(r"(\[(?:CAPTURA PENDIENTE|VERIFICAR)[^\]]*\])")
INLINE = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`)")


@dataclass
class Registro:
    """Lo que se acumula al generar: figuras, capturas y puntos por verificar."""
    figuras: list = field(default_factory=list)      # (numero, titulo, archivo|None)
    capturas: list = field(default_factory=list)     # dict
    verificar: list = field(default_factory=list)    # (seccion, texto)
    seccion: str = "0"
    contador: dict = field(default_factory=dict)

    def siguiente_figura(self) -> str:
        top = self.seccion.split(".")[0]
        self.contador[top] = self.contador.get(top, 0) + 1
        return f"{top}.{self.contador[top]}"


# --- Utilidades XML -----------------------------------------------------------

def _shading(cell, color: str) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def _par_shading(par, color: str) -> None:
    pPr = par._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    pPr.append(shd)


def _repetir_encabezado(row) -> None:
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trPr.append(el)


def _no_dividir_fila(row) -> None:
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    el.set(qn("w:val"), "false")
    trPr.append(el)


def _campo(par, instr: str, texto: str = "1") -> None:
    """Campo de Word (PAGE, NUMPAGES, TOC…) con un texto provisional."""
    r = par.add_run()
    b = OxmlElement("w:fldChar"); b.set(qn("w:fldCharType"), "begin"); r._r.append(b)
    r = par.add_run()
    i = OxmlElement("w:instrText"); i.set(qn("xml:space"), "preserve"); i.text = f" {instr} "; r._r.append(i)
    r = par.add_run()
    s = OxmlElement("w:fldChar"); s.set(qn("w:fldCharType"), "separate"); r._r.append(s)
    par.add_run(texto)
    r = par.add_run()
    e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), "end"); r._r.append(e)


def _ancho_fijo(t, anchos_cm) -> None:
    """Diseño fijo: las columnas no se reacomodan al contenido."""
    t.autofit = False
    tblPr = t._tbl.tblPr
    lay = tblPr.find(qn("w:tblLayout"))
    if lay is None:
        lay = OxmlElement("w:tblLayout"); tblPr.append(lay)
    lay.set(qn("w:type"), "fixed")
    grid = t._tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), anchos_cm):
        gc.set(qn("w:w"), str(int(Cm(w).twips)))
    for row in t.rows:
        for c, w in zip(row.cells, anchos_cm):
            c.width = Cm(w)


def _tamano_png(path: Path) -> tuple[int, int]:
    with open(path, "rb") as f:
        head = f.read(24)
    w, h = struct.unpack(">II", head[16:24])
    return w, h


# --- Documento ----------------------------------------------------------------

def nuevo_documento(titulo_corto: str) -> Document:
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
    for lado in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, lado, Cm(2.5))
    sec.header_distance = Cm(1.0)
    sec.footer_distance = Cm(1.0)
    sec.different_first_page_header_footer = True

    st = doc.styles
    normal = st["Normal"]
    normal.font.name = FUENTE
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.1

    for nombre, tam, antes in (("Heading 1", 15, 18), ("Heading 2", 13, 12), ("Heading 3", 11.5, 10)):
        h = st[nombre]
        h.font.name = FUENTE
        h.font.size = Pt(tam)
        h.font.bold = True
        h.font.italic = False
        h.font.color.rgb = RGBColor(0x1F, 0x3A, 0x1F) if nombre == "Heading 1" else RGBColor(0x26, 0x26, 0x26)
        rpr = h.element.get_or_add_rPr()
        rf = rpr.find(qn("w:rFonts"))
        if rf is None:
            rf = OxmlElement("w:rFonts"); rpr.append(rf)
        for a in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rf.set(qn(a), FUENTE)
        h.paragraph_format.space_before = Pt(antes)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True

    cap = st["Caption"]
    cap.font.name = FUENTE
    cap.font.size = Pt(9)
    cap.font.italic = True
    cap.font.bold = False
    cap.font.color.rgb = RGBColor(0x40, 0x40, 0x40)
    cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(8)

    if "Codigo" not in [s.name for s in st]:
        c = st.add_style("Codigo", WD_STYLE_TYPE.PARAGRAPH)
        c.base_style = normal
        c.font.name = "Consolas"
        c.font.size = Pt(8.5)
        c.paragraph_format.space_after = Pt(0)
        c.paragraph_format.line_spacing = 1.0

    # Encabezado: título a la izquierda, logo a la derecha. Pie: Página X de Y.
    hp = sec.header.paragraphs[0]
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(ANCHO_UTIL), WD_TAB_ALIGNMENT.RIGHT)
    r = hp.add_run(titulo_corto)
    r.font.size = Pt(9); r.font.color.rgb = RGBColor(0x59, 0x59, 0x59)
    hp.add_run("\t").add_picture(str(LOGO), height=Cm(1.1))
    _borde_inferior(hp)

    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for txt, instr in (("Página ", "PAGE"), (" de ", "NUMPAGES")):
        r = fp.add_run(txt); r.font.size = Pt(9)
        _campo(fp, instr)
    for r in fp.runs:
        r.font.size = Pt(9)
    return doc


def _borde_inferior(par) -> None:
    pPr = par._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    b = OxmlElement("w:bottom")
    b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "6"); b.set(qn("w:space"), "4"); b.set(qn("w:color"), VERDE_SENA)
    bdr.append(b); pPr.append(bdr)


def portada(doc: Document, titulo: str, datos: dict, reg: Registro) -> None:
    def linea(texto, tam=12, negrita=False, antes=0, despues=6):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(antes)
        p.paragraph_format.space_after = Pt(despues)
        texto_enriquecido(p, texto, reg, tam=tam, negrita=negrita)
        return p

    linea("SERVICIO NACIONAL DE APRENDIZAJE — SENA", 13, True)
    linea(datos["centro"], 11)
    linea(datos["programa"], 11, despues=24)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(LOGO), width=Cm(5.5))
    linea("RehniMarket", 24, True, antes=12)
    linea("Plataforma de comercio electrónico tipo marketplace", 12, despues=18)
    linea(titulo, 20, True, despues=4)
    linea(f"Versión {datos['version']}", 11, despues=30)
    for etiqueta, valor in (("Ficha", datos["ficha"]), ("Competencia", datos["competencia"]),
                            ("Instructor", datos["instructor"]), ("Autor", datos["autor"])):
        linea(f"**{etiqueta}:** {valor}", 11, despues=3)
    linea(datos["fecha"], 11, antes=30)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def tabla_contenido(doc: Document) -> None:
    p = doc.add_paragraph()
    r = p.add_run("Tabla de contenido"); r.bold = True; r.font.size = Pt(15)
    p = doc.add_paragraph()
    _campo(p, 'TOC \\o "1-3" \\h \\z \\u',
           "Actualizar la tabla de contenido: clic derecho sobre este texto → Actualizar campo (OnlyOffice: Referencias → Actualizar tabla).")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


# --- Texto --------------------------------------------------------------------

def texto_enriquecido(par, texto: str, reg: Registro, tam: float | None = None, negrita=False,
                      cursiva=False) -> None:
    for trozo in MARCADOR.split(texto):
        if not trozo:
            continue
        if MARCADOR.fullmatch(trozo):
            r = par.add_run(trozo)
            r.bold = True
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
            if tam: r.font.size = Pt(tam)
            if trozo.startswith("[VERIFICAR"):
                reg.verificar.append((reg.seccion, trozo[1:-1]))
            continue
        for sub in INLINE.split(trozo):
            if not sub:
                continue
            if sub.startswith("**") and sub.endswith("**"):
                r = par.add_run(sub[2:-2]); r.bold = True
            elif sub.startswith("`") and sub.endswith("`"):
                r = par.add_run(sub[1:-1]); r.font.name = "Consolas"
                r.font.size = Pt((tam or 10.5) - 1)
            else:
                r = par.add_run(sub)
                r.bold = negrita or None
            if cursiva: r.italic = True
            if tam and not r.font.size: r.font.size = Pt(tam)


# --- Bloques dentro de una celda -----------------------------------------------

def _primer_parrafo(cont, usado: list):
    """Reutiliza el párrafo vacío inicial de una celda nueva."""
    if not usado[0] and isinstance(cont, _Cell) and cont.paragraphs and not cont.paragraphs[0].text:
        usado[0] = True
        return cont.paragraphs[0]
    return cont.add_paragraph()


def pintar_bloques(cont, bloques: list, reg: Registro, ancho: float = ANCHO_IMAGEN) -> None:
    usado = [False]
    for b in bloques:
        tipo = b[0]
        if tipo == "p":
            texto_enriquecido(_primer_parrafo(cont, usado), b[1], reg)
        elif tipo == "sub":
            p = _primer_parrafo(cont, usado)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.keep_with_next = True
            texto_enriquecido(p, b[1], reg, negrita=True)
        elif tipo == "paso":       # ("paso", n, titulo, texto)
            p = _primer_parrafo(cont, usado)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.keep_with_next = True
            texto_enriquecido(p, f"**Paso {b[1]}. {b[2]}**", reg)
            if len(b) > 3 and b[3]:
                texto_enriquecido(cont.add_paragraph(), b[3], reg)
        elif tipo in ("ul", "ol"):
            for i, item in enumerate(b[1], 1):
                p = _primer_parrafo(cont, usado)
                p.paragraph_format.left_indent = Cm(0.6)
                p.paragraph_format.first_line_indent = Cm(-0.4)
                p.paragraph_format.space_after = Pt(2)
                texto_enriquecido(p, ("• " if tipo == "ul" else f"{i}. ") + item, reg)
        elif tipo == "code":
            for linea in b[1].strip("\n").split("\n"):
                p = _primer_parrafo(cont, usado)
                p.style = "Codigo"
                _par_shading(p, GRIS_CLARO)
                p.add_run(linea if linea else " ")
            cont.add_paragraph().paragraph_format.space_after = Pt(0)
        elif tipo == "nota":
            p = _primer_parrafo(cont, usado)
            _par_shading(p, "EAF5E1")
            texto_enriquecido(p, b[1], reg)
        elif tipo == "tabla":      # ("tabla", encabezados, filas, anchos_cm|None)
            _tabla_simple(cont, b[1], b[2], b[3] if len(b) > 3 else None, reg, ancho)
        elif tipo == "img":        # ("img", ruta_relativa_a_MANUALES, titulo)
            _figura(cont, MANUALES / b[1], b[2], reg, ancho, usado)
        elif tipo == "captura":    # ("captura", pantalla, estado, archivo, titulo)
            _captura(cont, b, reg, usado)
        elif tipo == "ref":        # ("ref", texto) referencia a una figura ya usada
            texto_enriquecido(_primer_parrafo(cont, usado), b[1], reg, cursiva=True)
        else:
            raise ValueError(f"Bloque desconocido: {tipo}")


def _tabla_simple(cont, encabezados, filas, anchos, reg, ancho_total, tam=9) -> None:
    disponible = ancho_total - (0.3 if isinstance(cont, _Cell) else 0)
    if anchos is None:
        anchos = [disponible / len(encabezados)] * len(encabezados)
    factor = disponible / sum(anchos)
    anchos = [a * factor for a in anchos]
    t = cont.add_table(rows=1, cols=len(encabezados))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(encabezados):
        c = t.rows[0].cells[i]
        _shading(c, "D9EAD3")
        texto_enriquecido(c.paragraphs[0], h, reg, tam=tam, negrita=True)
    _repetir_encabezado(t.rows[0])
    for fila in filas:
        cells = t.add_row().cells
        for i, v in enumerate(fila):
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            texto_enriquecido(p, str(v), reg, tam=tam)
    _ancho_fijo(t, anchos)
    if hasattr(cont, "add_paragraph"):
        cont.add_paragraph().paragraph_format.space_after = Pt(2)


def _figura(cont, ruta: Path, titulo: str, reg: Registro, ancho: float, usado) -> None:
    w, h = _tamano_png(ruta)
    ancho_cm = ancho
    if ancho_cm * h / w > ALTO_MAX_IMAGEN:
        ancho_cm = ALTO_MAX_IMAGEN * w / h
    p = _primer_parrafo(cont, usado)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(str(ruta), width=Cm(ancho_cm))
    num = reg.siguiente_figura()
    c = cont.add_paragraph(style="Caption")
    c.add_run(f"Figura {num}. {titulo}")
    reg.figuras.append((num, titulo, ruta.relative_to(REPO).as_posix()))


def _captura(cont, b, reg: Registro, usado) -> None:
    _, pantalla, estado, archivo, titulo = b
    num = reg.siguiente_figura()
    p = _primer_parrafo(cont, usado)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(f"[CAPTURA PENDIENTE: Figura {num} — {pantalla}; {estado}]")
    r.bold = True
    r.font.highlight_color = WD_COLOR_INDEX.YELLOW
    c = cont.add_paragraph(style="Caption")
    c.add_run(f"Figura {num}. {titulo}")
    reg.figuras.append((num, titulo, None))
    reg.capturas.append({"figura": num, "pantalla": pantalla, "estado": estado,
                         "archivo": archivo, "titulo": titulo})


# --- Secciones con tabla No. / Descripción / Detalle ---------------------------

def seccion(doc: Document, nivel: int, numero: str, titulo: str, bloques: list, reg: Registro) -> None:
    """Título + tabla No. / Descripción / Detalle. Los bloques ("ancha", …) se pintan
    a ancho completo justo después de la tabla, para tablas de datos con muchas columnas."""
    reg.seccion = numero
    doc.add_heading(f"{numero}. {titulo}" if "." not in numero else f"{numero} {titulo}", level=nivel)
    if not bloques:
        return
    dentro = [b for b in bloques if b[0] != "ancha"]
    anchas = [b for b in bloques if b[0] == "ancha"]
    t = doc.add_table(rows=2, cols=3)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(("No.", "Descripción", "Detalle")):
        c = t.rows[0].cells[i]
        _shading(c, VERDE_SENA)
        r = c.paragraphs[0].add_run(h)
        r.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF); r.font.size = Pt(10)
    _repetir_encabezado(t.rows[0])
    fila = t.rows[1]
    fila.cells[0].paragraphs[0].add_run(numero).bold = True
    texto_enriquecido(fila.cells[1].paragraphs[0], titulo, reg, negrita=True)
    pintar_bloques(fila.cells[2], dentro, reg)
    _ancho_fijo(t, (COL_NO, COL_DESC, COL_DETALLE))
    for b in anchas:      # ("ancha", titulo, encabezados, filas, anchos)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.keep_with_next = True
        texto_enriquecido(p, f"**{b[1]}**", reg)
        _tabla_simple(doc, b[2], b[3], b[4], reg, ANCHO_UTIL, tam=8.5)


def texto_libre(doc: Document, bloques: list, reg: Registro) -> None:
    pintar_bloques(doc, bloques, reg, ancho=ANCHO_UTIL - 0.5)


def salto_pagina(doc: Document) -> None:
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
