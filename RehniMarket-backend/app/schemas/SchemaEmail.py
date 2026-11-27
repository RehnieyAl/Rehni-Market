"""Correo normalizado (sin espacios y en minúsculas) para los schemas de entrada: registro, login,
verificación, recuperación, cambio de correo y búsquedas de admin usan el mismo criterio."""

from typing import Annotated

from pydantic import BeforeValidator, EmailStr


def normalize_email(value):
    if isinstance(value, str):
        return value.strip().lower()

    return value


# BeforeValidator: se normaliza antes de EmailStr, que solo pasa a minúsculas el dominio.
NormalizedEmail = Annotated[EmailStr, BeforeValidator(normalize_email)]
