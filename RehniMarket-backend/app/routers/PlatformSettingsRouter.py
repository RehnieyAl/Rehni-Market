"""Rutas del contacto institucional: edición exclusiva del owner y consulta pública de lo publicado."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.AuthDependencies import AuthContext, require_role
from app.core.dbconexion import get_db, read_session
from app.schemas.SchemaPlatformSettings import (
    PlatformContactResponse,
    PlatformContactUpdate,
    PublicPlatformContactResponse,
)
from app.services.PlatformSettingsService import get_contact_service, public_contact, update_contact_service

OWNER_ONLY_MESSAGE = "Solo el propietario puede gestionar la información de contacto de la plataforma."

Owner = Annotated[AuthContext, Depends(require_role("owner", message=OWNER_ONLY_MESSAGE))]

router = APIRouter(tags=["platform-settings"])


@router.get("/admin/platform-settings/contact", response_model=PlatformContactResponse)
def get_platform_contact(_: Owner, database: Session = Depends(get_db, scope="function")):
    """Correo y teléfono institucionales con su estado de publicación (solo owner)."""

    return get_contact_service(database)


@router.put("/admin/platform-settings/contact", response_model=PlatformContactResponse)
def update_platform_contact(
    current: Owner, data: PlatformContactUpdate, database: Session = Depends(get_db, scope="function")
):
    """Guarda el correo y el teléfono institucionales y si cada uno se publica (solo owner)."""

    return update_contact_service(current.user_id, data, database)


@router.get("/public/platform-contact", response_model=PublicPlatformContactResponse)
def get_public_platform_contact():
    """Contacto de Rehni Market que el owner decidió publicar; null en lo no publicado."""

    with read_session() as database:
        return public_contact(database)
