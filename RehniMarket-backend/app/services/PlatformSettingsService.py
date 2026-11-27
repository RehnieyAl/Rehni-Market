"""Contacto institucional de Rehni Market: lectura y edición por el owner, versión pública para la web
y caché corta para el pie de los correos (que se arman fuera de una petición)."""

import logging
import threading
import time
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.dbconexion import SessionLocal
from app.models.ModelPlatformSetting import SINGLETON_ID, PlatformSetting
from app.models.ModelUser import Users
from app.schemas.SchemaPlatformSettings import (
    PlatformContactResponse,
    PlatformContactUpdate,
    PublicPlatformContactResponse,
)

logger = logging.getLogger(__name__)

_session_factory = SessionLocal
CACHE_SECONDS = 60
_cache_lock = threading.Lock()
_cache: dict = {"value": None, "loaded_at": 0.0}


def _get(database: Session) -> PlatformSetting | None:
    return database.get(PlatformSetting, SINGLETON_ID)


def public_contact(database: Session) -> PublicPlatformContactResponse:
    setting = _get(database)
    if setting is None:
        return PublicPlatformContactResponse(email=None, phone=None)
    return PublicPlatformContactResponse(
        email=setting.contact_email if setting.email_public else None,
        phone=setting.contact_phone if setting.phone_public else None,
    )


def _to_response(database: Session, setting: PlatformSetting | None) -> PlatformContactResponse:
    if setting is None:
        return PlatformContactResponse(
            contactEmail=None, contactPhone=None, emailPublic=False, phonePublic=False,
            updatedAt=None, updatedByName=None,
        )
    editor = database.get(Users, setting.updated_by) if setting.updated_by else None
    return PlatformContactResponse(
        contactEmail=setting.contact_email,
        contactPhone=setting.contact_phone,
        emailPublic=setting.email_public,
        phonePublic=setting.phone_public,
        updatedAt=setting.updated_at,
        updatedByName=editor.fullName if editor else None,
    )


def get_contact_service(database: Session) -> PlatformContactResponse:
    return _to_response(database, _get(database))


def update_contact_service(owner_id: UUID, data: PlatformContactUpdate, database: Session) -> PlatformContactResponse:
    # FOR UPDATE: dos guardados simultáneos del owner no se pisan a medias.
    setting = database.query(PlatformSetting).filter(PlatformSetting.id == SINGLETON_ID).with_for_update().first()
    if setting is None:
        setting = PlatformSetting(id=SINGLETON_ID)
        database.add(setting)

    setting.contact_email = data.contactEmail
    setting.contact_phone = data.contactPhone
    setting.email_public = data.emailPublic
    setting.phone_public = data.phonePublic
    setting.updated_by = owner_id
    database.commit()
    database.refresh(setting)
    invalidate_cache()
    return _to_response(database, setting)


def invalidate_cache() -> None:
    with _cache_lock:
        _cache["loaded_at"] = 0.0


def cached_public_contact() -> PublicPlatformContactResponse | None:
    """Contacto publicado para el pie de los correos. Si la base no responde, el correo sale sin ese
    bloque en lugar de no salir."""

    with _cache_lock:
        if time.monotonic() - _cache["loaded_at"] < CACHE_SECONDS:
            return _cache["value"]

    try:
        session = _session_factory()
        try:
            value = public_contact(session)
        finally:
            session.close()
    except Exception:
        logger.exception("No se pudo leer el contacto institucional para los correos")
        return None

    with _cache_lock:
        _cache["value"] = value
        _cache["loaded_at"] = time.monotonic()
    return value
