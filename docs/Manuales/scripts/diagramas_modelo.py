"""Genera los diagramas del modelo de datos desde datos/esquema.json (extraído de la base en
ejecución por extraer_datos.py) y los nombres de clase de RehniMarket-backend/app/models/.

Salida en docs/Manuales/diagramas/:
- modelo-relacional.mmd: vista general por módulos (sus tablas y el número de llaves foráneas entre
  módulos); con las 37 tablas juntas el diagrama no se lee en una página.
- modelo-<modulo>.mmd: diagrama entidad-relación de cada módulo con sus columnas.
- clases-<modulo>.mmd: diagrama de clases UML de cada módulo con sus atributos.


En los diagramas por módulo, las tablas de otros módulos a las que apunta una llave foránea
aparecen sin columnas. Cardinalidad: FK no nula = exactamente uno; FK nula = cero o uno;
FK con restricción UNIQUE propia = uno a uno.
Uso: uv run --project docs/Manuales/scripts python docs/Manuales/scripts/diagramas_modelo.py
"""

import ast
import json
import re
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
DIAGRAMAS = SCRIPTS.parent / "diagramas"
MODELOS = SCRIPTS.parents[2] / "RehniMarket-backend" / "app" / "models"

MODULOS = {
    "usuarios": ("Usuarios y acceso", ["users", "roles", "refreshToken", "event_codes", "addresses",
                                        "admin_activities"]),
    "empresas": ("Empresas y cuentas bancarias", ["company", "company_bank_accounts"]),
    "liquidaciones": ("Liquidaciones", ["company_payouts", "rehnicoin_movements"]),
    "catalogo": ("Catálogo y atributos", ["catalog", "catalog_attributes", "catalog_attribute_options",
                                          "specification_templates", "color_variants"]),
    "productos": ("Productos", ["products", "product_images", "product_specifications",
                                "product_attribute_values"]),
    "variantes": ("Variantes de producto", ["product_variants", "product_variant_images", "variant_options",
                                            "variant_attribute_values", "variant_specifications"]),
    "pedidos": ("Carrito y pedidos", ["carts", "cart_items", "orders", "order_items", "shipping_carriers"]),
    "posventa": ("Devoluciones, favoritos y reseñas", ["return_requests", "favorites", "reviews"]),
    "billetera": ("Billetera RehniCoin", ["wallets", "wallet_transactions"]),
    "moderacion": ("Reportes y anuncios", ["reports", "report_evidences", "advertisements"]),
}

# Dirección de cada diagrama (entidad-relación, clases), elegida para que quepa legible en la página.
DIRECCION: dict[str, tuple[str, str]] = {
    "usuarios": ("LR", "TB"), "variantes": ("LR", "TB"), "pedidos": ("LR", "TB"), "posventa": ("LR", "LR"),
}


def clases_modelo() -> dict[str, str]:
    """__tablename__ → nombre de la clase SQLAlchemy."""
    out = {}
    for f in MODELOS.glob("*.py"):
        for nodo in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
            if isinstance(nodo, ast.ClassDef):
                for st in nodo.body:
                    if (isinstance(st, ast.Assign) and any(getattr(t, "id", "") == "__tablename__" for t in st.targets)
                            and isinstance(st.value, ast.Constant)):
                        out[st.value.value] = nodo.name
    return out


def tipo(t: str) -> str:
    t = re.sub(r"character varying\((\d+)\)", r"varchar_\1", t)
    t = t.replace("character varying", "varchar")
    t = t.replace("timestamp with time zone", "timestamptz").replace("timestamp without time zone", "timestamp")
    t = re.sub(r"numeric\((\d+),(\d+)\)", r"numeric_\1_\2", t)
    return re.sub(r"[^A-Za-z0-9_]", "_", t)


def tipo_uml(t: str) -> str:
    return tipo(t).split("_")[0] if not t.startswith("timestamp") else tipo(t)


def llaves(t: dict):
    cons = t["constraints"] or []
    pk = {c for co in cons if co["type"] == "p" for c in co["cols"]}
    fks = [(co["cols"][0], co["ref"].strip('"')) for co in cons if co["type"] == "f"]
    uq = {co["cols"][0] for co in cons if co["type"] == "u" and len(co["cols"]) == 1}
    for u in t["uindexes"] or []:
        m = re.search(r"\((.+?)\)(?: WHERE (.+))?$", u["def"])
        if m and "," not in m.group(1) and not m.group(2):
            uq.add(m.group(1).strip().strip('"'))
    return pk, fks, uq


def relaciones(tablas: dict, nombres: list[str]):
    """(padre, hijo, columna, nula, única) de las FK que salen de las tablas del módulo."""
    out = []
    for n in nombres:
        t = tablas[n]
        _, fks, uq = llaves(t)
        cols = {c["name"]: c for c in t["columns"]}
        for col, ref in fks:
            out.append((ref, n, col, cols[col]["nullable"], col in uq))
    return out


def er(tablas, nombres, columnas=True, direccion="TB") -> str:
    lineas = ["erDiagram", f"  direction {direccion}"]
    rel = relaciones(tablas, nombres)
    for n in nombres:
        t = tablas[n]
        pk, fks, uq = llaves(t)
        fkc = {c for c, _ in fks}
        if not columnas:
            lineas.append(f"  {n}")
            continue
        lineas.append(f"  {n} {{")
        for c in t["columns"]:
            k = ",".join(x for x, ok in (("PK", c["name"] in pk), ("FK", c["name"] in fkc),
                                          ("UK", c["name"] in uq)) if ok)
            lineas.append(f"    {tipo(c['type'])} {c['name']}{(' ' + k) if k else ''}")
        lineas.append("  }")
    for padre, hijo, col, nula, unica in sorted(set(rel)):
        izq = "|o" if nula else "||"
        der = "o|" if unica else "o{"
        lineas.append(f'  {padre} {izq}--{der} {hijo} : "{col}"')
    return "\n".join(lineas) + "\n"


def clases(tablas, nombres, cls, direccion="TB") -> str:
    lineas = ["classDiagram", f"  direction {direccion}"]
    for n in nombres:
        lineas.append(f"  class {cls[n]} {{")
        for c in tablas[n]["columns"]:
            lineas.append(f"    +{tipo_uml(c['type'])} {c['name']}")
        lineas.append("  }")
    externas = set()
    for padre, hijo, col, nula, unica in sorted(set(relaciones(tablas, nombres))):
        if padre not in nombres:
            externas.add(padre)
        lineas.append(f'  {cls[padre]} "{"0..1" if nula else "1"}" --> "{"0..1" if unica else "0..*"}" '
                      f'{cls[hijo]} : {col}')
    for e in sorted(externas):
        lineas.append(f"  class {cls[e]}")
        lineas.append(f"  <<externa>> {cls[e]}")
    return "\n".join(lineas) + "\n"


def general(tablas) -> str:
    """Vista general: un bloque por módulo con sus tablas y una flecha por cada par de módulos
    relacionados, con el número de llaves foráneas entre ellos."""
    modulo_de = {n: k for k, (_, ns) in MODULOS.items() for n in ns}
    lineas = ["flowchart TB"]
    for k, (titulo, ns) in MODULOS.items():
        lineas.append(f'  {k}["<b>{titulo}</b><br/>{"<br/>".join(ns)}"]')
    pares: dict[tuple[str, str], int] = {}
    for n, t in tablas.items():
        for _, ref in llaves(t)[1]:
            a, b = modulo_de[ref], modulo_de[n]
            if a != b:
                pares[(a, b)] = pares.get((a, b), 0) + 1
    for (a, b), c in sorted(pares.items()):
        lineas.append(f'  {a} -->|"{c} FK"| {b}')
    return "\n".join(lineas) + "\n"


def main() -> None:
    esquema = json.loads((SCRIPTS / "datos" / "esquema.json").read_text(encoding="utf-8"))
    tablas = {t["name"]: t for t in esquema["tables"]}
    cls = clases_modelo()
    todas = [n for _, (_, ns) in MODULOS.items() for n in ns]
    assert sorted(todas) == sorted(tablas), set(tablas) ^ set(todas)
    assert set(tablas) <= set(cls), set(tablas) - set(cls)
    (DIAGRAMAS / "modelo-relacional.mmd").write_text(general(tablas), encoding="utf-8")
    for clave, (_, nombres) in MODULOS.items():
        d_er, d_cl = DIRECCION.get(clave, ("TB", "TB"))
        (DIAGRAMAS / f"modelo-{clave}.mmd").write_text(er(tablas, nombres, direccion=d_er), encoding="utf-8")
        (DIAGRAMAS / f"clases-{clave}.mmd").write_text(clases(tablas, nombres, cls, d_cl), encoding="utf-8")
        print(clave, len(nombres), "tablas,", len(set(relaciones(tablas, nombres))), "relaciones")


if __name__ == "__main__":
    main()
