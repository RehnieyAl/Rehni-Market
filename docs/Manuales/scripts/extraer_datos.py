"""Extrae del sistema los datos que usan los manuales y los guarda en datos/.

- datos/esquema.json    tablas, columnas, restricciones y enumerados de PostgreSQL
                        (contenedor rehni-postgres en ejecución).
- datos/endpoints.json  operaciones de la API, desde app.openapi() del contenedor
                        rehni-backend (no hace falta DOCS_ENABLED=true).
- datos/errores.json    mensajes de error del backend, leídos del código con ast
                        (api_error(...) y las respuestas JSON de los middlewares).

Uso, desde la raíz del repositorio y con el stack levantado:
    uv run --project docs/Manuales/scripts python docs/Manuales/scripts/extraer_datos.py
"""

from __future__ import annotations

import ast
import json
import re
import subprocess
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parents[2]
DATOS = SCRIPTS / "datos"
BACKEND_APP = REPO / "RehniMarket-backend" / "app"

SQL_ESQUEMA = r"""
select json_build_object(
 'tables', (select json_agg(t order by t->>'name') from (
   select json_build_object('name', c.relname,
     'columns', (select json_agg(json_build_object(
          'name', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
          'nullable', not a.attnotnull,
          'default', pg_get_expr(d.adbin, d.adrelid)) order by a.attnum)
        from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
        where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped),
     'constraints', (select json_agg(json_build_object('name', co.conname, 'type', co.contype,
          'cols', (select json_agg(att.attname) from unnest(co.conkey) k
                   join pg_attribute att on att.attrelid = co.conrelid and att.attnum = k),
          'ref', co.confrelid::regclass::text, 'def', pg_get_constraintdef(co.oid)))
        from pg_constraint co where co.conrelid = c.oid),
     'uindexes', (select json_agg(json_build_object('name', i.relname, 'def', pg_get_indexdef(ix.indexrelid)))
        from pg_index ix join pg_class i on i.oid = ix.indexrelid
        where ix.indrelid = c.oid and ix.indisunique and not ix.indisprimary
          and not exists (select 1 from pg_constraint co2 where co2.conindid = ix.indexrelid))
   ) t
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'alembic_version') s),
 'enums', (select json_agg(json_build_object('name', t.typname,
     'values', (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid))
     order by t.typname)
   from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typtype = 'e' and n.nspname = 'public'),
 'alembic', (select version_num from alembic_version limit 1)
);
"""


def extraer_esquema() -> dict:
    out = subprocess.run(
        ["docker", "exec", "-i", "rehni-postgres", "sh", "-c",
         'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At'],
        input=SQL_ESQUEMA, capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def extraer_endpoints() -> dict:
    code = "import json; from app.main import app; print(json.dumps(app.openapi()))"
    out = subprocess.run(
        ["docker", "exec", "-e", "RUN_SEED=false", "rehni-backend", "sh", "-c",
         f"cd /app && .venv/bin/python -c '{code}'"],
        capture_output=True, text=True, check=True,
    ).stdout
    spec = json.loads(out)
    ops = []
    for path, item in spec["paths"].items():
        for method, op in item.items():
            if method in {"get", "post", "put", "patch", "delete"}:
                ops.append({"method": method.upper(), "path": path,
                            "summary": op.get("summary", ""), "tags": op.get("tags", [])})
    return {"version": spec["info"]["version"], "operations": ops}


# --- Errores -----------------------------------------------------------------

def _status(node: ast.AST) -> int | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, int):
        return node.value
    src = ast.unparse(node)
    m = re.search(r"HTTP_(\d{3})", src)
    return int(m.group(1)) if m else None


def _code(node: ast.AST) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _message(node: ast.AST) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        parts = []
        for v in node.values:
            if isinstance(v, ast.Constant):
                parts.append(str(v.value))
            else:
                parts.append("{" + ast.unparse(v.value) + "}")
        return "".join(parts)
    return None


def extraer_errores() -> list[dict]:
    found: dict[tuple, dict] = {}
    for py in sorted(BACKEND_APP.rglob("*.py")):
        tree = ast.parse(py.read_text(encoding="utf-8"))
        rel = py.relative_to(REPO).as_posix()
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            name = ast.unparse(node.func)
            entry = None
            if name.endswith("api_error") and len(node.args) >= 3:
                kw = {k.arg: k.value for k in node.keywords}
                entry = (_status(node.args[0]), _code(node.args[1]), _message(node.args[2]))
            elif name.endswith("api_error"):
                kw = {k.arg: k.value for k in node.keywords}
                args = list(node.args) + [kw.get("status_code"), kw.get("code"), kw.get("message")]
                args = [a for a in args if a is not None][:3]
                if len(args) == 3:
                    entry = (_status(args[0]), _code(args[1]), _message(args[2]))
            elif name.endswith("JSONResponse"):
                kw = {k.arg: k.value for k in node.keywords}
                status = _status(kw["status_code"]) if "status_code" in kw else None
                content = kw.get("content")
                for d in ast.walk(content) if content is not None else []:
                    if isinstance(d, ast.Dict):
                        keys = [k.value if isinstance(k, ast.Constant) else None for k in d.keys]
                        if "code" in keys and "message" in keys:
                            entry = (status, _code(d.values[keys.index("code")]),
                                     _message(d.values[keys.index("message")]))
            if entry and entry[1] and entry[2]:
                key = (entry[1], entry[0], entry[2])
                found.setdefault(key, {"code": entry[1], "status": entry[0],
                                       "message": entry[2], "files": []})
                if rel not in found[key]["files"]:
                    found[key]["files"].append(rel)
    return sorted(found.values(), key=lambda e: (e["code"], e["status"] or 0, e["message"]))


def main() -> None:
    DATOS.mkdir(exist_ok=True)
    esquema = extraer_esquema()
    (DATOS / "esquema.json").write_text(json.dumps(esquema, ensure_ascii=False, indent=1), encoding="utf-8")
    endpoints = extraer_endpoints()
    (DATOS / "endpoints.json").write_text(json.dumps(endpoints, ensure_ascii=False, indent=1), encoding="utf-8")
    errores = extraer_errores()
    (DATOS / "errores.json").write_text(json.dumps(errores, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"esquema: {len(esquema['tables'])} tablas, {len(esquema['enums'])} enumerados, alembic {esquema['alembic']}")
    print(f"endpoints: {len(endpoints['operations'])} operaciones (API {endpoints['version']})")
    print(f"errores: {len(errores)} mensajes distintos")


if __name__ == "__main__":
    main()
