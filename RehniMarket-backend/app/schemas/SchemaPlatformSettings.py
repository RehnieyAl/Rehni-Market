"""Schemas del contacto institucional: edición por el owner y versión pública (solo lo publicado)."""

import re
from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, model_validator

from app.schemas.SchemaEmail import NormalizedEmail


def _empty_to_none(value):
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _clean_phone(value):
    value = _empty_to_none(value)
    if value is None:
        return None
    value = re.sub(r"[\s()-]", "", str(value))
    # [0-9] y no \d: \d acepta dígitos no ASCII (ver H-03).
    if not re.fullmatch(r"\+?[0-9]{7,15}", value):
        raise ValueError("El teléfono debe tener entre 7 y 15 dígitos (puede empezar con +).")
    return value


OptionalEmail = Annotated[Optional[NormalizedEmail], BeforeValidator(_empty_to_none)]
OptionalPhone = Annotated[Optional[str], BeforeValidator(_clean_phone)]


class PlatformContactUpdate(BaseModel):
    contactEmail: OptionalEmail = None
    contactPhone: OptionalPhone = None
    emailPublic: bool = False
    phonePublic: bool = False

    @model_validator(mode="after")
    def published_values_exist(self):
        if self.emailPublic and not self.contactEmail:
            raise ValueError("Para publicar el correo primero debes escribirlo.")
        if self.phonePublic and not self.contactPhone:
            raise ValueError("Para publicar el teléfono primero debes escribirlo.")
        return self


class PlatformContactResponse(BaseModel):
    contactEmail: Optional[str]
    contactPhone: Optional[str]
    emailPublic: bool
    phonePublic: bool
    updatedAt: Optional[datetime]
    updatedByName: Optional[str]


class PublicPlatformContactResponse(BaseModel):
    """Solo los datos que el owner decidió publicar; null en lo demás."""

    email: Optional[str]
    phone: Optional[str]
