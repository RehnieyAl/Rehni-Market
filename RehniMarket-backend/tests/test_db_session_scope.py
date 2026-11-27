"""Depends(get_db, scope="function"): FastAPI cierra la sesión antes de enviar la respuesta (no después),
y todos los routers lo usan. SonarCloud (python:S930) marca `scope` como argumento inesperado: es válido."""

import inspect
import re
import typing
from pathlib import Path

import pytest
from fastapi import Depends, FastAPI
from fastapi.responses import StreamingResponse
from fastapi.testclient import TestClient

ROUTERS = Path(__file__).resolve().parents[1] / "app" / "routers"


def _literal_values(annotation) -> set:
    if typing.get_origin(annotation) is typing.Literal:
        return set(typing.get_args(annotation))
    return set().union(*(_literal_values(arg) for arg in typing.get_args(annotation)))


def test_installed_fastapi_accepts_the_scope_argument():
    scope = inspect.signature(Depends).parameters["scope"]
    assert _literal_values(scope.annotation) == {"function", "request"}


@pytest.mark.parametrize(("scope", "closed_while_sending"), [("function", True), ("request", False)])
def test_scope_decides_whether_the_dependency_closes_before_the_response_is_sent(scope, closed_while_sending):
    state = {"closed": False}

    def fake_session():
        try:
            yield state
        finally:
            state["closed"] = True

    def body():
        # Se ejecuta al enviar la respuesta: ahí se ve si la dependencia ya se cerró.
        yield str(state["closed"]).encode()

    app = FastAPI()

    @app.get("/stream")
    def stream(_session=Depends(fake_session, scope=scope)):
        return StreamingResponse(body(), media_type="text/plain")

    assert TestClient(app).get("/stream").text == str(closed_while_sending)


def test_every_router_session_dependency_closes_with_function_scope():
    uses = []
    for path in ROUTERS.glob("*.py"):
        uses += [(path.name, match.group(0)) for match in re.finditer(r"Depends\(get_db[^)]*\)", path.read_text())]

    assert uses, "no se encontraron dependencias de sesión en los routers"
    assert [use for use in uses if use[1] != 'Depends(get_db, scope="function")'] == []
