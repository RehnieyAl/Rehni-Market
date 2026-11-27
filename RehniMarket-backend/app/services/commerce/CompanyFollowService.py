"""Seguimiento de empresas: el comprador sigue o deja de seguir una empresa visible al público.
Solo expone contadores y el estado propio; nunca datos de otros seguidores."""

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelCompany import Company
from app.repository import CompanyFollowerRepository as repo
from app.repository.CompanyRepository import get_company_by_id
from app.schemas.SchemaCommerce.SchemaCompanyFollow import (
    CompanyFollowersResponse,
    CompanyFollowStatusResponse,
)

logger = logging.getLogger(__name__)


def _get_public_company(database: Session, company_id: UUID) -> Company:
    """Misma regla de visibilidad que el perfil público: una empresa suspendida no existe para
    el público, así que tampoco se puede seguir ni consultar su contador."""
    company = get_company_by_id(database, company_id)

    if not company or not company.CompanyStatus:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "Empresa no encontrada.")

    return company


def _status(database: Session, user_id: UUID, company_id: UUID) -> CompanyFollowStatusResponse:
    return CompanyFollowStatusResponse(
        company_id=company_id,
        followers_count=repo.count_followers(database, company_id),
        is_following=repo.is_following(database, user_id, company_id),
    )


def get_company_followers_service(
    database: Session, company_id: UUID
) -> CompanyFollowersResponse:
    company = _get_public_company(database, company_id)

    return CompanyFollowersResponse(
        company_id=company.id,
        followers_count=repo.count_followers(database, company.id),
    )


def get_follow_status_service(
    database: Session, user_id: UUID, company_id: UUID
) -> CompanyFollowStatusResponse:
    company = _get_public_company(database, company_id)
    return _status(database, user_id, company.id)


def _change_follow(database: Session, user_id: UUID, company_id: UUID, following: bool):
    try:
        company = _get_public_company(database, company_id)

        if following:
            repo.follow(database, user_id, company.id)
        else:
            repo.unfollow(database, user_id, company.id)

        database.commit()

        return _status(database, user_id, company.id)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        logger.exception("Error al actualizar el seguimiento de la empresa %s", company_id)
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def follow_company_service(
    database: Session, user_id: UUID, company_id: UUID
) -> CompanyFollowStatusResponse:
    return _change_follow(database, user_id, company_id, following=True)


def unfollow_company_service(
    database: Session, user_id: UUID, company_id: UUID
) -> CompanyFollowStatusResponse:
    return _change_follow(database, user_id, company_id, following=False)
