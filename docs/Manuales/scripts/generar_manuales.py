"""Genera docs/Manuales/Manual de usuario.docx y docs/Manuales/Manual Tecnico.docx,
y la lista de imágenes y pendientes docs/Manuales/lista-imagenes.md.

Uso, desde la raíz del repositorio:
    uv run --project docs/Manuales/scripts python docs/Manuales/scripts/generar_manuales.py
"""

from __future__ import annotations

import json
import re
from collections import Counter

import contenido_tecnico as ct
import contenido_usuario as cu
from datos_comunes import CONTROL_VERSIONES, PORTADA
from docx_base import MANUALES, SCRIPTS, Registro, nuevo_documento, portada, seccion, tabla_contenido, texto_libre

DATOS = SCRIPTS / "datos"


def _cargar(nombre: str):
    return json.loads((DATOS / nombre).read_text(encoding="utf-8"))


# --- Partes comunes -------------------------------------------------------------

def cierre(doc, reg: Registro, glosario, bibliografia) -> None:
    reg.seccion = "G"
    doc.add_heading("Glosario", level=1)
    texto_libre(doc, [("p", f"**{t}:** {d}") for t, d in glosario], reg)
    doc.add_heading("Bibliografía", level=1)
    texto_libre(doc, [("p", b) for b in bibliografia], reg)
    doc.add_heading("Control del documento", level=1)
    texto_libre(doc, [("tabla", ["Versión", "Fecha", "Autor", "Cambios"],
                       [list(f) for f in CONTROL_VERSIONES], [1.6, 2.2, 3.2, 9.0])], reg)


def pintar_secciones(doc, secciones, reg: Registro) -> None:
    for nivel, numero, titulo, bloques in secciones:
        seccion(doc, nivel, numero, titulo, bloques, reg)


# --- Manual de usuario --------------------------------------------------------

def manual_usuario() -> Registro:
    reg = Registro()
    doc = nuevo_documento("Manual de usuario — RehniMarket")
    portada(doc, "Manual de usuario", PORTADA, reg)
    tabla_contenido(doc)
    texto_libre(doc, cu.INTRO, reg)
    pintar_secciones(doc, cu.SECCIONES, reg)
    for numero, titulo, filas in cu.TABLAS_ERRORES:
        seccion(doc, 2, numero, titulo, [
            ("p", f"Se relacionan {len(filas)} mensajes en la tabla siguiente."),
            ("ancha", titulo, ["Mensaje", "Causa", "Acción a seguir"], filas, [7.0, 5.0, 4.5]),
        ], reg)
    cierre(doc, reg, cu.GLOSARIO, cu.BIBLIOGRAFIA)
    doc.save(MANUALES / "Manual de usuario.docx")
    return reg


# --- Manual técnico: secciones generadas desde datos/ --------------------------

TIPOS = [
    (r"character varying\((\d+)\)", r"varchar(\1)"),
    (r"timestamp with time zone", "timestamptz"),
    (r"timestamp without time zone", "timestamp"),
    (r"^character varying$", "varchar"),
]


def _tipo(t: str) -> str:
    for patron, rep in TIPOS:
        t = re.sub(patron, rep, t)
    return t


def _default(d: str | None) -> str | None:
    if d is None:
        return None
    d = re.sub(r"::[a-z_ ]+(\(\d+\))?", "", d)
    return d.strip("()") if d.startswith("(") and d.endswith(")") else d


def _restricciones(tabla: dict) -> tuple[dict, dict, list]:
    llaves: dict[str, list] = {}
    restr: dict[str, list] = {}
    generales: list[str] = []
    for c in tabla["constraints"] or []:
        cols = c["cols"] or []
        if c["type"] == "p":
            for col in cols:
                llaves.setdefault(col, []).append("PK")
        elif c["type"] == "f":
            for col in cols:
                llaves.setdefault(col, []).append("FK")
                accion = re.search(r"ON DELETE (CASCADE|SET NULL|RESTRICT)", c["def"])
                restr.setdefault(col, []).append(
                    f"FK → {c['ref']}" + (f" (ON DELETE {accion.group(1)})" if accion else ""))
        elif c["type"] == "u":
            for col in cols:
                llaves.setdefault(col, []).append("UK")
                restr.setdefault(col, []).append("UNIQUE" if len(cols) == 1 else f"UNIQUE ({', '.join(cols)})")
        elif c["type"] == "c":
            for col in cols:
                restr.setdefault(col, []).append(c["def"])
            if not cols:
                generales.append(c["def"])
    for u in tabla["uindexes"] or []:
        m = re.search(r"\((.+?)\)(?: WHERE (.+))?$", u["def"])
        if not m:
            continue
        cols = [x.strip().strip('"') for x in m.group(1).split(",")]
        texto = f"UNIQUE ({', '.join(cols)})" + (f" WHERE {m.group(2)}" if m.group(2) else "")
        for col in cols:
            if col in {c["name"] for c in tabla["columns"]}:
                llaves.setdefault(col, []).append("UK")
                restr.setdefault(col, []).append(texto)
    return llaves, restr, generales


def secciones_modelo(reg: Registro) -> list:
    esquema = _cargar("esquema.json")
    desc = _cargar("descripciones-tablas.json")
    nfk = sum(1 for t in esquema["tables"] for c in (t["constraints"] or []) if c["type"] == "f")
    nchk = sum(1 for t in esquema["tables"] for c in (t["constraints"] or []) if c["type"] == "c")
    nuq = sum(1 for t in esquema["tables"] for c in (t["constraints"] or []) if c["type"] == "u") + \
        sum(len(t["uindexes"] or []) for t in esquema["tables"])
    out = [(1, "5", "Modelo relacional y diccionario de datos", [
        ("p", f"La base de datos PostgreSQL contiene {len(esquema['tables'])} tablas de negocio, más "
              f"alembic_version, con {nfk} llaves foráneas, {nuq} restricciones o índices únicos, {nchk} "
              f"restricciones CHECK y {len(esquema['enums'])} tipos enumerados (revisión {esquema['alembic']}). "
              "El diagrama y el diccionario se generaron desde la base de datos en ejecución "
              "(docs/Manuales/scripts/extraer_datos.py)."),
        ("img", "diagramas/png/modelo-relacional.png", "Modelo relacional de la base de datos"),
        ("p", "El diagrama completo, para ampliar, está en docs/Manuales/diagramas/png/modelo-relacional.png "
              "y su fuente en docs/Manuales/diagramas/modelo-relacional.mmd."),
        ("captura", "Cliente de base de datos (pgAdmin, DbSchema o psql por túnel SSH)",
         "las tablas de la base de datos en el esquema public", "t-tablas-postgres.png", "Tablas en PostgreSQL"),
        ("sub", "Tipos enumerados"),
        ("tabla", ["Tipo", "Valores"], [[e["name"], ", ".join(e["values"])] for e in esquema["enums"]],
         [4.2, 7.6]),
    ]),
        (2, "5.1", "Diccionario de datos", [
            ("p", "Se presenta una tabla por cada tabla de la base de datos. Columnas: Nulo indica si admite "
                  "valores nulos; Llave, si es llave primaria (PK), foránea (FK) o única (UK); Restricciones "
                  "reúne el valor por defecto (default), las restricciones UNIQUE (incluidos los índices únicos "
                  "parciales), las CHECK y la tabla a la que apunta cada FK con su regla ON DELETE."),
        ])]
    for i, t in enumerate(esquema["tables"], 1):
        llaves, restr, generales = _restricciones(t)
        d = desc.get(t["name"], {"descripcion": "", "columnas": {}})
        filas = []
        for c in t["columns"]:
            r = list(restr.get(c["name"], []))
            df = _default(c["default"])
            if df:
                r.insert(0, f"default {df}")
            k = ",".join(dict.fromkeys(llaves.get(c["name"], [])))
            filas.append([c["name"], _tipo(c["type"]), "Sí" if c["nullable"] else "No", k,
                          "; ".join(r) or "—", d["columnas"].get(c["name"], "")])
        bloques = [("p", d["descripcion"] + f". {len(filas)} columnas."),
                   ("ancha", f"Diccionario de la tabla {t['name']}",
                    ["Campo", "Tipo", "Nulo", "Llave", "Restricciones", "Descripción"], filas,
                    [3.0, 2.5, 1.2, 1.3, 4.4, 4.1])]
        for g in generales:
            bloques.append(("p", f"Restricción de tabla: `{g}`"))
        out.append((3, f"5.1.{i}", f"Tabla {t['name']}", bloques))
    return out


def secciones_api(reg: Registro) -> list:
    ep = _cargar("endpoints.json")
    desc = _cargar("descripciones-endpoints.json")
    ops = sorted(ep["operations"], key=lambda o: (o["path"], ["GET", "POST", "PUT", "PATCH", "DELETE"].index(o["method"])))
    filas = []
    for o in ops:
        d = desc.get(f"{o['method']} {o['path']}", {})
        filas.append([o["method"], o["path"], d.get("rol", "—"), d.get("descripcion", o["summary"])])
    roles = Counter(f[2] for f in filas)
    err = _cargar("errores.json")
    filas_err = [[e["code"], str(e["status"]), e["message"]] for e in err]
    return [
        (2, "7.5", "Endpoints", [
            ("p", f"La API expone {len(ops)} operaciones en la versión {ep['version']}, tomadas de su OpenAPI. "
                  "Rol indica quién puede llamarla según el middleware: "
                  + ", ".join(f"{r} ({n})" for r, n in roles.most_common()) + "."),
            ("ancha", "Operaciones de la API", ["Método", "Ruta", "Rol", "Descripción"], filas,
             [1.6, 7.4, 2.9, 4.6]),
        ]),
        (2, "7.6", "Catálogo de errores", [
            ("p", "Los errores se devuelven como `{\"detail\": {\"code\": \"...\", \"message\": \"...\"}}`. Se "
                  f"relacionan los {len(filas_err)} mensajes distintos extraídos del código "
                  "(api_error y respuestas de los middlewares); {valor} indica texto dinámico. Los errores de "
                  "validación de esquemas (422 de FastAPI) se transforman al mismo formato."),
            ("ancha", "Catálogo de errores", ["Código", "HTTP", "Mensaje"], filas_err, [5.4, 1.2, 9.9]),
        ]),
    ]


def manual_tecnico() -> Registro:
    reg = Registro()
    doc = nuevo_documento("Manual técnico — RehniMarket")
    portada(doc, "Manual técnico", PORTADA, reg)
    tabla_contenido(doc)
    texto_libre(doc, ct.INTRO, reg)
    pintar_secciones(doc, ct.SECCIONES_INICIO, reg)
    pintar_secciones(doc, secciones_modelo(reg), reg)
    pintar_secciones(doc, ct.SECCIONES_PLATAFORMA, reg)
    pintar_secciones(doc, ct.SECCIONES_CODIGO, reg)
    pintar_secciones(doc, secciones_api(reg), reg)
    pintar_secciones(doc, ct.ANS, reg)
    seccion(doc, 1, "9", "Anexo: limitaciones y pendientes conocidos", [
        ("p", "Limitaciones vigentes en el código de develop a la fecha de este documento:"),
        ("ol", ct.LIMITACIONES),
    ], reg)
    cierre(doc, reg, ct.GLOSARIO, ct.BIBLIOGRAFIA)
    doc.save(MANUALES / "Manual Tecnico.docx")
    return reg


# --- Lista de imágenes y pendientes --------------------------------------------

def lista(regs: dict[str, Registro]) -> None:
    lineas = ["# Imágenes y pendientes de los manuales", "",
              "Archivo generado por `docs/Manuales/scripts/generar_manuales.py`: no editar a mano.", "",
              "## Capturas pendientes", "",
              "En el .docx cada captura aparece como un marcador amarillo `[CAPTURA PENDIENTE: …]`. Reemplazar "
              "el marcador por la imagen y conservar el pie de figura. Nombre sugerido: guardar en "
              "`docs/Manuales/capturas/`.", "",
              "| Manual | Figura | Pantalla | Estado que debe mostrar | Archivo sugerido |",
              "|---|---|---|---|---|"]
    for manual, reg in regs.items():
        for c in reg.capturas:
            lineas.append(f"| {manual} | Figura {c['figura']} | {c['pantalla']} | {c['estado']} | "
                          f"`{c['archivo']}` |")
    lineas += ["", "## Diagramas insertados", "", "| Manual | Figura | Título | Archivo |", "|---|---|---|---|"]
    for manual, reg in regs.items():
        for num, titulo, archivo in reg.figuras:
            if archivo:
                lineas.append(f"| {manual} | Figura {num} | {titulo} | `{archivo}` |")
    lineas += ["", "## Datos por verificar", "",
               "Resaltados en amarillo como `[VERIFICAR: …]` en el .docx.", "",
               "| Manual | Sección | Pendiente |", "|---|---|---|"]
    for manual, reg in regs.items():
        vistos = set()
        for sec, texto in reg.verificar:
            if texto in vistos:
                continue
            vistos.add(texto)
            lineas.append(f"| {manual} | {'Portada' if sec == '0' else sec} | {texto} |")
    (MANUALES / "lista-imagenes.md").write_text("\n".join(lineas) + "\n", encoding="utf-8")


def main() -> None:
    regs = {"Usuario": manual_usuario(), "Técnico": manual_tecnico()}
    lista(regs)
    for m, r in regs.items():
        print(f"{m}: {len(r.figuras)} figuras ({len(r.capturas)} capturas pendientes), "
              f"{len(set(t for _, t in r.verificar))} datos por verificar")


if __name__ == "__main__":
    main()
