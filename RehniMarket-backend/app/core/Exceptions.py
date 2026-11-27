"""Error estándar de la API: HTTPException con cuerpo {code, message} y datos extra opcionales."""

from typing import NoReturn

from fastapi import HTTPException


def api_error(
    status_code: int, code: str, message: str, extra: dict | None = None
) -> NoReturn:
    """Lanza una HTTPException con el formato de error de la API. Nunca retorna. Un 429 con
    `retry_after` en `extra` sale también con la cabecera estándar Retry-After."""
    detail = {
        "code": code,
        "message": message,
    }

    if extra:
        detail.update(extra)

    headers = None
    if status_code == 429 and extra and isinstance(extra.get("retry_after"), int):
        headers = {"Retry-After": str(extra["retry_after"])}

    raise HTTPException(
        status_code=status_code,
        detail=detail,
        headers=headers,
    )
