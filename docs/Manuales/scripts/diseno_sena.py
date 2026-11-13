"""Diseño de los manuales de RehniMarket (réplica del diseño 2.0) con estilos reales.

Medidas tomadas de "Manual Tecnico -original.docx" / "Manual de usuario -ORIGINAL.dotx":
carta; texto desde 2,54 cm; Liberation Serif; encabezado con el título (10 pt negrita)
a la izquierda y el logo (3,19 × 1,07 cm) a la derecha; número de página (12 pt)
centrado en el pie; tabla No. / Descripción / Detalle de 1,4 + 3,4 + 11,7 cm con
cabecera gris D9D9D9 (11 pt negrita); texto de tabla 10,5 pt; subtablas 8,5 pt con
cabecera EDEDED; pies de figura 9 pt gris 595959 centrados; marcadores en amarillo.

Todo el formato vive en estilos (párrafo, carácter y tabla), en el encabezado y el pie
de la sección. Únicos campos: PAGE (pie) y TOC. Imágenes en línea. Sin SDT, sin
cuadros de texto ni protección.
"""

from __future__ import annotations

import copy
import struct
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Emu, Pt, RGBColor

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parents[2]
MANUALES = SCRIPTS.parent
LOGO = REPO / "RehniMarket-frontend" / "src" / "assets" / "logo.png"

FUENTE = "Liberation Serif"
ANCHO_TEXTO = 16.51            # 21,59 - 2,54 - 2,54
COLS = (1.40, 3.43, 11.68)     # No. | Descripción | Detalle (suma 16,51)
SANGRIA_TABLA = -0.19          # la tabla del original empieza en 2,35 cm
ANCHO_IMAGEN = COLS[2] - 0.5
ALTO_MAX_IMAGEN = 18.0

# Nombres de estilo (los de OnlyOffice en español se muestran traducidos para los
# integrados: Heading 1 → Título 1, Caption → Descripción/Pie, TOC 1 → TDC 1).
E_TEXTO = "Texto"
E_TEXTO_TABLA = "Texto de tabla"
E_TEXTO_SUBTABLA = "Texto de subtabla"
E_CABECERA_TABLA = "Cabecera de tabla"
E_CABECERA_SUBTABLA = "Cabecera de subtabla"
E_NUMERO = "Número de sección"
E_PASO = "Paso"
E_SUBTITULO = "Subtítulo de detalle"
E_LISTA = "Lista"
E_FIGURA = "Figura"
E_PIE = "Caption"
E_RECUADRO = "Texto de recuadro"
E_CODIGO = "Código"
E_PORTADA = "Portada"
E_PORTADA_INICIO = "Portada (primera línea)"
E_TITULO_MANUAL = "Título del manual"
E_TITULO_TDC = "Título de tabla de contenido"
E_PAGINA = "Número de página"
E_ENCABEZADO = "Encabezado del manual"
C_INTERFAZ = "Elemento de interfaz"
C_PENDIENTE = "Pendiente de completar"
C_MONO = "Monoespaciado"
T_SENA = "Tabla SENA"
T_SUB = "Subtabla SENA"
T_RECUADRO = "Recuadro de captura"


# --- utilidades XML ----------------------------------------------------------------

def _rpr_fuente(rpr, tam: float | None = None, negrita=None, color: str | None = None, fuente=FUENTE):
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.insert(0, rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), fuente)
    for t in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rf.get(qn(t)) is not None:
            del rf.attrib[qn(t)]


def _estilo_parrafo(doc, nombre, base="Normal", tam=10.5, negrita=False, cursiva=False, color="000000",
                    alin=None, antes=0, despues=0, interlineado=None, sangria_izq=0.0, sangria_primera=0.0,
                    mantener_siguiente=False, fuente=FUENTE, siguiente=None, esquema=None):
    st = doc.styles
    s = st[nombre] if nombre in [x.name for x in st] else st.add_style(nombre, WD_STYLE_TYPE.PARAGRAPH)
    if base and s.name != base:
        s.base_style = st[base]
    f = s.font
    f.name = fuente; f.size = Pt(tam); f.bold = negrita; f.italic = cursiva
    f.color.rgb = RGBColor.from_string(color)
    _rpr_fuente(s.element.get_or_add_rPr(), fuente=fuente)
    pf = s.paragraph_format
    pf.alignment = alin
    pf.space_before = Pt(antes); pf.space_after = Pt(despues)
    pf.line_spacing = interlineado
    pf.left_indent = Cm(sangria_izq) if sangria_izq else None
    pf.first_line_indent = Cm(sangria_primera) if sangria_primera else None
    pf.keep_with_next = mantener_siguiente or None
    if siguiente:
        s.next_paragraph_style = st[siguiente]
    if esquema is not None:
        ppr = s.element.get_or_add_pPr()
        ol = ppr.find(qn("w:outlineLvl"))
        if ol is None:
            ol = OxmlElement("w:outlineLvl"); ppr.append(ol)
        ol.set(qn("w:val"), str(esquema))
    s.hidden = False
    s.quick_style = True
    return s


def _estilo_caracter(doc, nombre, negrita=None, fuente=None, tam=None, fondo=None):
    st = doc.styles
    s = st[nombre] if nombre in [x.name for x in st] else st.add_style(nombre, WD_STYLE_TYPE.CHARACTER)
    s.font.bold = negrita
    if fuente:
        s.font.name = fuente; _rpr_fuente(s.element.get_or_add_rPr(), fuente=fuente)
    if tam:
        s.font.size = Pt(tam)
    if fondo:
        rpr = s.element.get_or_add_rPr()
        shd = OxmlElement("w:shd"); shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), fondo)
        rpr.append(shd)
    s.quick_style = True
    return s


def _estilo_tabla(doc, nombre, cabecera_fill: str | None, fondo: str | None = None, cabecera_tam=11.0,
                  margen_cm=0.19):
    """Estilo de tabla real: bordes negros, márgenes de celda y fila de cabecera gris."""
    st = doc.styles
    if nombre in [x.name for x in st]:
        return st[nombre]
    sid = nombre.replace(" ", "")
    m = int(Cm(margen_cm).twips)
    xml = f'''<w:style {nsdecls("w")} w:type="table" w:customStyle="1" w:styleId="{sid}">
  <w:name w:val="{nombre}"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="59"/><w:qFormat/>
  <w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
  <w:tblPr>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="28" w:type="dxa"/><w:left w:w="{m}" w:type="dxa"/>
      <w:bottom w:w="28" w:type="dxa"/><w:right w:w="{m}" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  {f'<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{fondo}"/></w:tcPr>' if fondo else ''}
  {f"""<w:tblStylePr w:type="firstRow"><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:b/></w:rPr>
     <w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{cabecera_fill}"/></w:tcPr></w:tblStylePr>""" if cabecera_fill else ''}
</w:style>'''
    st.element.append(parse_xml(xml))
    return st[nombre]


def _toc_tabs(estilo, ancho_cm=ANCHO_TEXTO):
    estilo.paragraph_format.tab_stops.add_tab_stop(Cm(ancho_cm), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)


# --- documento ----------------------------------------------------------------------

def nuevo_documento(titulo_encabezado: str) -> Document:
    doc = Document()
    # Sin estilos de tema: Liberation Serif en todo el documento
    rpr_def = doc.styles.element.find(qn("w:docDefaults")).find(qn("w:rPrDefault")).find(qn("w:rPr"))
    _rpr_fuente(rpr_def)
    lang = rpr_def.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang"); rpr_def.append(lang)
    lang.set(qn("w:val"), "es-CO"); lang.set(qn("w:eastAsia"), "es-CO")

    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
    sec.left_margin = sec.right_margin = Cm(2.54)
    sec.top_margin = Cm(2.95)
    sec.bottom_margin = Cm(2.4)
    sec.header_distance = Cm(1.27)
    sec.footer_distance = Cm(1.3)

    _estilo_parrafo(doc, "Normal", base=None, tam=11, despues=0, interlineado=1.0)
    _estilo_parrafo(doc, E_TEXTO, tam=11, antes=3, despues=3, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, siguiente=E_TEXTO)
    _estilo_parrafo(doc, E_TEXTO_TABLA, tam=10.5, antes=2, despues=2, alin=WD_ALIGN_PARAGRAPH.JUSTIFY,
                    siguiente=E_TEXTO_TABLA)
    _estilo_parrafo(doc, E_TEXTO_SUBTABLA, tam=8.5, siguiente=E_TEXTO_SUBTABLA)
    _estilo_parrafo(doc, E_CABECERA_TABLA, tam=11, negrita=True, alin=WD_ALIGN_PARAGRAPH.CENTER)
    _estilo_parrafo(doc, E_CABECERA_SUBTABLA, tam=8.5, negrita=True)
    _estilo_parrafo(doc, E_NUMERO, tam=10.5, negrita=True, antes=2, despues=2)
    # Títulos dentro de la columna Descripción: se ven como el original (10,5 pt negrita)
    for n, nivel in (("Heading 1", 0), ("Heading 2", 1), ("Heading 3", 2)):
        h = _estilo_parrafo(doc, n, tam=10.5, negrita=True, antes=2, despues=2, esquema=nivel, siguiente=E_TEXTO_TABLA)
        h.paragraph_format.keep_with_next = None
        h.font.color.rgb = RGBColor(0, 0, 0)
    _estilo_parrafo(doc, E_SUBTITULO, tam=10.5, negrita=True, antes=4, despues=2, mantener_siguiente=True,
                    siguiente=E_TEXTO_TABLA)
    _estilo_parrafo(doc, E_PASO, tam=10.5, negrita=True, antes=5, despues=2, mantener_siguiente=True,
                    siguiente=E_TEXTO_TABLA)
    _estilo_parrafo(doc, E_LISTA, tam=10.5, antes=1, despues=1, sangria_izq=0.6, sangria_primera=-0.45,
                    siguiente=E_LISTA)
    _estilo_parrafo(doc, E_FIGURA, tam=10.5, alin=WD_ALIGN_PARAGRAPH.CENTER, antes=6, despues=2,
                    mantener_siguiente=True)
    _estilo_parrafo(doc, E_PIE, tam=9, color="595959", alin=WD_ALIGN_PARAGRAPH.CENTER, antes=2, despues=8,
                    siguiente=E_TEXTO_TABLA)
    _estilo_parrafo(doc, E_RECUADRO, tam=9, antes=1, despues=1, siguiente=E_RECUADRO)
    _estilo_parrafo(doc, E_CODIGO, tam=8.5, fuente="Liberation Mono", siguiente=E_CODIGO)
    _estilo_parrafo(doc, E_PORTADA, tam=12, negrita=True, alin=WD_ALIGN_PARAGRAPH.CENTER, antes=33, despues=0,
                    siguiente=E_PORTADA)
    _estilo_parrafo(doc, E_PORTADA_INICIO, base=E_PORTADA, tam=12, negrita=True, alin=WD_ALIGN_PARAGRAPH.CENTER,
                    antes=0, siguiente=E_PORTADA)
    _estilo_parrafo(doc, E_TITULO_MANUAL, tam=13, negrita=True, antes=12, despues=6, siguiente=E_TEXTO)
    _estilo_parrafo(doc, E_TITULO_TDC, tam=13, negrita=True, alin=WD_ALIGN_PARAGRAPH.CENTER, antes=12, despues=12)
    _estilo_parrafo(doc, E_PAGINA, tam=12, alin=WD_ALIGN_PARAGRAPH.CENTER)
    _estilo_parrafo(doc, E_ENCABEZADO, tam=10, negrita=True)
    for i in (1, 2, 3):
        t = _estilo_parrafo(doc, f"TOC {i}", tam=11, antes=2, despues=0, sangria_izq=0.49 * (i - 1))
        _toc_tabs(t)
    _estilo_caracter(doc, C_INTERFAZ, negrita=True)
    _estilo_caracter(doc, C_PENDIENTE, negrita=None, fondo="FFFF00")
    _estilo_caracter(doc, C_MONO, fuente="Liberation Mono")
    _estilo_tabla(doc, T_SENA, "D9D9D9")
    _estilo_tabla(doc, T_SUB, "EDEDED", margen_cm=0.12)
    _estilo_tabla(doc, T_RECUADRO, None, fondo="FFF8CC")

    # Encabezado y pie de la sección (se repiten solos). El encabezado es una tabla
    # sin bordes de dos celdas: título arriba a la izquierda, logo a la derecha.
    encabezado(doc, sec, titulo_encabezado, ANCHO_TEXTO)
    fp = sec.footer.paragraphs[0]
    fp.style = doc.styles[E_PAGINA]
    campo(fp, "PAGE", "1")
    return doc


def encabezado(doc, sec, titulo: str, ancho: float):
    """Encabezado de la sección: tabla sin bordes de dos celdas, título arriba a la izquierda y
    logo a la derecha."""
    doc._titulo_encabezado = titulo
    hdr = sec.header
    hdr.is_linked_to_previous = False
    for p in list(hdr.paragraphs)[1:]:
        p._p.getparent().remove(p._p)
    for t in list(hdr.tables):
        t._tbl.getparent().remove(t._tbl)
    hdr.paragraphs[0].style = doc.styles[E_ENCABEZADO]
    ht = hdr.add_table(rows=1, cols=2, width=Cm(ancho))
    izq, der = ht.rows[0].cells
    pi = izq.paragraphs[0]; pi.style = doc.styles[E_ENCABEZADO]; pi.add_run(titulo)
    pd = der.paragraphs[0]; pd.style = doc.styles[E_ENCABEZADO]; pd.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    pd.add_run().add_picture(str(LOGO), width=Cm(3.19), height=Cm(1.07))
    _anchos(ht, (ancho - 4.0, 4.0))
    sobrante = hdr.paragraphs[0]._p          # el párrafo vacío inicial queda después de la tabla
    sobrante.getparent().remove(sobrante)
    hdr._element.append(sobrante)
    sobrante_ppr = sobrante.get_or_add_pPr()
    sp = OxmlElement("w:spacing"); sp.set(qn("w:before"), "0"); sp.set(qn("w:after"), "0"); sp.set(qn("w:line"), "20"); sp.set(qn("w:lineRule"), "exact")
    sobrante_ppr.append(sp)


def campo(par, instr: str, resultado: str = "", estilo_resultado=None):
    def fld(t):
        r = OxmlElement("w:r"); f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), t); r.append(f); par._p.append(r)
    fld("begin")
    r = OxmlElement("w:r"); i = OxmlElement("w:instrText"); i.set(qn("xml:space"), "preserve"); i.text = f" {instr} "
    r.append(i); par._p.append(r)
    fld("separate")
    if resultado:
        par.add_run(resultado)
    fld("end")


def tabla_contenido(doc, entradas: list[tuple[int, str, str]] | None = None, estilo_manual=E_TITULO_MANUAL):
    """Campo TOC basado en estilos de título. `entradas` (nivel, texto, página) es el
    resultado mostrado hasta que se actualice el campo en OnlyOffice."""
    doc.add_paragraph("TABLA DE CONTENIDO", style=E_TITULO_TDC)
    instr = f'TOC \\o "1-3" \\h \\z \\u \\t "{estilo_manual},1"'
    p = doc.add_paragraph(style="TOC 1")
    def fld(par, t):
        r = OxmlElement("w:r"); f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), t); r.append(f); par._p.append(r)
    fld(p, "begin")
    r = OxmlElement("w:r"); i = OxmlElement("w:instrText"); i.set(qn("xml:space"), "preserve"); i.text = f" {instr} "
    r.append(i); p._p.append(r)
    fld(p, "separate")
    entradas = entradas or [(1, "Actualice la tabla de contenido desde Referencias.", "")]
    for k, (nivel, texto, pag) in enumerate(entradas):
        par = p if k == 0 else doc.add_paragraph(style=f"TOC {nivel}")
        if k == 0:
            par.style = doc.styles[f"TOC {nivel}"]
        par.add_run(texto)
        if pag:
            par.add_run("\t" + str(pag))
    fld(par, "end")
    salto_pagina(doc)


def salto_pagina(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


# --- contenido ----------------------------------------------------------------------

def texto(par, s: str):
    """Agrega texto con estilos de carácter: «…» → Elemento de interfaz (negrita),
    [VERIFICAR …]/[CAPTURA …] → Pendiente de completar (fondo amarillo), `x` → mono."""
    import re
    for trozo in re.split(r"(\[(?:VERIFICAR|COMPLETAR)[^\]]*\]|“[^”]+”|`[^`]+`)", s):
        if not trozo:
            continue
        if trozo.startswith("[VERIFICAR") or trozo.startswith("[COMPLETAR"):
            par.add_run(trozo, style=C_PENDIENTE)
        elif trozo.startswith("“"):
            par.add_run(trozo, style=C_INTERFAZ)
        elif trozo.startswith("`"):
            par.add_run(trozo[1:-1], style=C_MONO)
        else:
            par.add_run(trozo)
    return par


def _anchos(t, anchos_cm, sangria_cm=None):
    tblPr = t._tbl.tblPr
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    w = OxmlElement("w:tblW"); w.set(qn("w:w"), str(int(Cm(sum(anchos_cm)).twips))); w.set(qn("w:type"), "dxa")
    old = tblPr.find(qn("w:tblW"))
    if old is not None:
        tblPr.remove(old)
    tblPr.append(w)
    if sangria_cm is not None:
        ind = OxmlElement("w:tblInd"); ind.set(qn("w:w"), str(int(Cm(sangria_cm).twips))); ind.set(qn("w:type"), "dxa")
        tblPr.append(ind)
    for gc, a in zip(t._tbl.tblGrid.findall(qn("w:gridCol")), anchos_cm):
        gc.set(qn("w:w"), str(int(Cm(a).twips)))
    for row in t.rows:
        for c, a in zip(row.cells, anchos_cm):
            c.width = Cm(a)


def _cabecera_repetida(row):
    trPr = row._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trPr.append(h)
    hr = OxmlElement("w:trHeight"); hr.set(qn("w:val"), str(int(Cm(0.58).twips))); trPr.append(hr)


def tabla_sena(doc):
    """Tabla No. / Descripción / Detalle con su fila de cabecera."""
    t = doc.add_table(rows=1, cols=3)
    t.style = doc.styles[T_SENA]
    for c, h in zip(t.rows[0].cells, ("No.", "Descripción", "Detalle")):
        c.paragraphs[0].style = doc.styles[E_CABECERA_TABLA]
        c.paragraphs[0].add_run(h)
    _cabecera_repetida(t.rows[0])
    _anchos(t, COLS, SANGRIA_TABLA)
    return t


def fila_seccion(doc, tabla, numero: str, titulo: str, nivel: int):
    """Agrega una fila de sección: número, título (estilo de título → tabla de contenido)
    y devuelve la celda Detalle."""
    cells = tabla.add_row().cells
    for c, a in zip(cells, COLS):
        c.width = Cm(a)
    p = cells[0].paragraphs[0]; p.style = doc.styles[E_NUMERO]; p.add_run(numero)
    p = cells[1].paragraphs[0]; p.style = doc.styles[f"Heading {nivel}"]; p.add_run(titulo)
    d = cells[2]
    d.paragraphs[0].style = doc.styles[E_TEXTO_TABLA]
    return d


def _par(celda, estilo, usado: list):
    if not usado[0] and not celda.paragraphs[0].text and len(celda.paragraphs) == 1 and not celda.paragraphs[0].runs:
        usado[0] = True
        p = celda.paragraphs[0]; p.style = celda.part.document.styles[estilo] if hasattr(celda.part, "document") else estilo
        return p
    return celda.add_paragraph(style=estilo)


class Detalle:
    """Escribe bloques dentro de la celda Detalle (o de cualquier celda)."""

    def __init__(self, doc, celda, figuras):
        self.doc, self.c, self.fig = doc, celda, figuras
        self._usado = [False]

    def _p(self, estilo):
        if not self._usado[0] and len(self.c.paragraphs) == 1 and not self.c.paragraphs[0].runs:
            self._usado[0] = True
            p = self.c.paragraphs[0]; p.style = self.doc.styles[estilo]; return p
        return self.c.add_paragraph(style=estilo)

    def p(self, s): return texto(self._p(E_TEXTO_TABLA), s)
    def sub(self, s): return texto(self._p(E_SUBTITULO), s)
    def paso(self, n, titulo, s=""):
        texto(self._p(E_PASO), f"Paso {n}. {titulo}")
        if s:
            self.p(s)
    def lista(self, items, numerada=True):
        for i, it in enumerate(items, 1):
            texto(self._p(E_LISTA), (f"{i}.\t" if numerada else "•\t") + it)

    def subtabla(self, encabezados, filas, anchos):
        self._p(E_TEXTO_TABLA) if not self._usado[0] else None
        t = self.c.add_table(rows=1, cols=len(encabezados))
        t.style = self.doc.styles[T_SUB]
        for c, h in zip(t.rows[0].cells, encabezados):
            c.paragraphs[0].style = self.doc.styles[E_CABECERA_SUBTABLA]; texto(c.paragraphs[0], h)
        _cabecera_repetida(t.rows[0])
        for f in filas:
            cs = t.add_row().cells
            for c, v in zip(cs, f):
                c.paragraphs[0].style = self.doc.styles[E_TEXTO_SUBTABLA]
                if isinstance(v, tuple) and v[0] == "img":     # ("img", ruta desde la raíz, ancho en cm)
                    c.paragraphs[0].add_run().add_picture(png_optimizado(REPO / v[1]), width=Cm(v[2]))
                else:
                    texto(c.paragraphs[0], str(v))
        total = COLS[2] - 0.45
        factor = total / sum(anchos)
        _anchos(t, [a * factor for a in anchos])
        self.c.add_paragraph(style=E_TEXTO_TABLA)   # separación editable tras la subtabla
        self._usado[0] = True
        return t

    def recuadro_captura(self, numero, titulo, archivo, perfil, ruta, estado, resaltar):
        """Tabla de una celda, fondo amarillo claro, con los datos de la captura."""
        if not self._usado[0]:
            self._p(E_TEXTO_TABLA)
        t = self.c.add_table(rows=1, cols=1)
        t.style = self.doc.styles[T_RECUADRO]
        celda = t.rows[0].cells[0]
        lineas = [f"[CAPTURA PENDIENTE] Figura {numero}. {titulo}", f"Archivo: {archivo}", "Plataforma: web",
                  f"Perfil y cuenta: {perfil}", f"Ruta o pantalla: {ruta}", f"Estado que debe mostrar: {estado}",
                  f"Qué resaltar: {resaltar}"]
        for k, l in enumerate(lineas):
            par = celda.paragraphs[0] if k == 0 else celda.add_paragraph()
            par.style = self.doc.styles[E_RECUADRO]
            etiqueta, _, valor = l.partition(": ") if k else (l, "", "")
            if k == 0:
                par.add_run(l, style=C_INTERFAZ)
            else:
                par.add_run(etiqueta + ": ", style=C_INTERFAZ); texto(par, valor)
        _anchos(t, [COLS[2] - 0.6])
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        cs = OxmlElement("w:cantSplit"); cs.set(qn("w:val"), "true")
        t.rows[0]._tr.get_or_add_trPr().append(cs)          # el recuadro no se parte entre páginas
        texto(self.c.add_paragraph(style=E_PIE), f"Figura {numero} {titulo}")
        self._usado[0] = True
        self.fig.append((numero, titulo, archivo, "captura"))

    def imagen(self, ruta: Path, numero, titulo, ancho=ANCHO_IMAGEN, alto=ALTO_MAX_IMAGEN):
        a = ancho_ajustado(ruta, ancho, alto)
        self._p(E_FIGURA).add_run().add_picture(png_optimizado(ruta), width=Cm(a))
        texto(self.c.add_paragraph(style=E_PIE), f"Figura {numero} {titulo}")
        self._usado[0] = True
        self.fig.append((numero, titulo, str(ruta.relative_to(REPO)), "insertada"))

    def codigo(self, s):
        for linea in s.strip("\n").split("\n"):
            self._p(E_CODIGO).add_run(linea or " ")


def portada(doc, lineas: list[str]):
    for k, l in enumerate(lineas):
        texto(doc.add_paragraph(style=E_PORTADA_INICIO if k == 0 else E_PORTADA), l)
    salto_pagina(doc)


def validar_editable(path: Path) -> dict:
    """Comprueba que no haya protección, SDT, cuadros de texto, anclas ni control de cambios."""
    import re
    import zipfile
    z = zipfile.ZipFile(path)
    doc = z.read("word/document.xml").decode()
    settings = z.read("word/settings.xml").decode()
    partes = "".join(z.read(n).decode() for n in z.namelist() if re.match(r"word/(header|footer)\d*\.xml", n))
    todo = doc + partes
    return {
        "documentProtection": "documentProtection" in settings,
        "writeProtection": "writeProtection" in settings,
        "trackRevisions": "trackRevisions" in settings,
        "sdt": todo.count("<w:sdt>") + todo.count("<w:sdt "),
        "txbx": todo.count("txbxContent"),
        "anchor": todo.count("<wp:anchor"),
        "inline": todo.count("<wp:inline"),
        "campos": sorted(set(re.findall(r"<w:instrText[^>]*>\s*(\w+)", todo))),
        "fldSimple": todo.count("fldSimple"),
    }


# --- imágenes, figuras a todo el ancho y páginas horizontales ----------------------

ANCHO_FILA = ANCHO_TEXTO - 0.6          # figura en una fila combinada de la tabla
ALTO_MAX_VERTICAL = 20.5
ANCHO_HORIZONTAL = 27.94 - 2.54 - 2.54  # 22,86 cm
ALTO_MAX_HORIZONTAL = 13.6


def tamano_px(ruta: Path) -> tuple[int, int]:
    return struct.unpack(">II", open(ruta, "rb").read(24)[16:24])


def ancho_ajustado(ruta: Path, ancho: float, alto: float) -> float:
    w, h = tamano_px(ruta)
    return min(ancho, alto * w / h)


def ancho_captura(ruta: Path, dpi: float = 96) -> float:
    """Ancho de una captura de pantalla: el de la columna Detalle, sin ampliarla por encima de su tamaño
    natural (px a 96 ppp). Así un recorte pequeño, como un menú desplegado, no se estira."""
    w, _ = tamano_px(ruta)
    return min(ANCHO_IMAGEN, w / dpi * 2.54)


_CACHE_PNG: dict[Path, bytes] = {}


def png_optimizado(ruta: Path):
    """PNG recomprimido sin pérdida (zlib nivel 9). Se comprueba que los píxeles sean idénticos
    y se usa el archivo más pequeño. No cambia la resolución ni el formato."""
    import io
    from PIL import Image
    if ruta not in _CACHE_PNG:
        original = ruta.read_bytes()
        with Image.open(io.BytesIO(original)) as im:
            im.load()
            buf = io.BytesIO()
            im.save(buf, format="PNG", optimize=True, compress_level=9)
        nuevo = buf.getvalue()
        with Image.open(io.BytesIO(original)) as a, Image.open(io.BytesIO(nuevo)) as b:
            identicos = a.size == b.size and a.mode == b.mode and a.tobytes() == b.tobytes()
        if not identicos:
            raise RuntimeError(f"La recompresión cambió los píxeles de {ruta}")
        _CACHE_PNG[ruta] = nuevo if len(nuevo) < len(original) else original
    import io as _io
    return _io.BytesIO(_CACHE_PNG[ruta])


def fila_continuacion(doc, tabla):
    """Fila con No. y Descripción vacíos para seguir el detalle de una sección."""
    cells = tabla.add_row().cells
    for c, a in zip(cells, COLS):
        c.width = Cm(a)
    cells[0].paragraphs[0].style = doc.styles[E_NUMERO]
    cells[1].paragraphs[0].style = doc.styles[E_NUMERO]
    cells[2].paragraphs[0].style = doc.styles[E_TEXTO_TABLA]
    return cells[2]


def fila_figura(doc, tabla, ruta: Path, numero, titulo, figuras):
    """Figura a todo el ancho: fila con las tres columnas combinadas, imagen y pie."""
    row = tabla.add_row()
    a, b, c = row.cells
    celda = a.merge(b).merge(c)
    p = celda.paragraphs[0]
    p.style = doc.styles[E_FIGURA]
    ancho = ancho_ajustado(ruta, ANCHO_FILA, ALTO_MAX_VERTICAL)
    p.add_run().add_picture(png_optimizado(ruta), width=Cm(ancho))
    texto(celda.add_paragraph(style=E_PIE), f"Figura {numero} {titulo}")
    cs = OxmlElement("w:cantSplit"); cs.set(qn("w:val"), "true")
    row._tr.get_or_add_trPr().append(cs)
    figuras.append((numero, titulo, str(ruta.relative_to(REPO)), "insertada"))


def _orientar(sec, horizontal: bool):
    from docx.enum.section import WD_ORIENT
    ancho, alto = Cm(21.59), Cm(27.94)
    sec.orientation = WD_ORIENT.LANDSCAPE if horizontal else WD_ORIENT.PORTRAIT
    sec.page_width, sec.page_height = (alto, ancho) if horizontal else (ancho, alto)
    sec.left_margin = sec.right_margin = Cm(2.54)
    sec.top_margin = Cm(2.95)
    sec.bottom_margin = Cm(2.4)
    sec.header_distance = Cm(1.27)
    sec.footer_distance = Cm(1.3)


def pagina_horizontal(doc, ruta: Path, numero, titulo, figuras, nueva_seccion=True):
    """Pone la figura sola en una página horizontal (encabezado con el ancho de la página y pie
    heredado). Si la página anterior ya era horizontal, sigue en la misma sección con un salto de
    página. Para volver a la orientación vertical se llama a volver_vertical()."""
    from docx.enum.section import WD_SECTION
    if nueva_seccion:
        sec = doc.add_section(WD_SECTION.NEW_PAGE)
        _orientar(sec, True)
        encabezado(doc, sec, doc._titulo_encabezado, ANCHO_HORIZONTAL)
    p = doc.add_paragraph(style=E_FIGURA)
    if not nueva_seccion:
        p.paragraph_format.page_break_before = True
    ancho = ancho_ajustado(ruta, ANCHO_HORIZONTAL, ALTO_MAX_HORIZONTAL)
    p.add_run().add_picture(png_optimizado(ruta), width=Cm(ancho))
    texto(doc.add_paragraph(style=E_PIE), f"Figura {numero} {titulo}")
    figuras.append((numero, titulo, str(ruta.relative_to(REPO)), "insertada"))


def volver_vertical(doc):
    from docx.enum.section import WD_SECTION
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    _orientar(sec, False)
    encabezado(doc, sec, doc._titulo_encabezado, ANCHO_TEXTO)


def legibilidad(ruta: Path, ancho_cm: float, alto_cm: float, fuente_px: float = 16, escala: float = 3) -> float:
    """Alto aproximado en mm de la letra del diagrama (16 px a escala 1) al ajustarlo al área."""
    w, h = tamano_px(ruta)
    w, h = w / escala, h / escala
    return fuente_px * min(ancho_cm * 10 / w, alto_cm * 10 / h)
