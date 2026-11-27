"""Acceso a datos de seguidores de empresas: seguir, dejar de seguir, contar y consultar."""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.ModelCompanyFollower import CompanyFollower


def follow(database: Session, user_id: UUID, company_id: UUID) -> None:
    # ON CONFLICT DO NOTHING: dos peticiones simultáneas no chocan con la UNIQUE ni duplican
    # la fila; seguir dos veces deja el mismo estado (idempotente).
    database.execute(
        insert(CompanyFollower)
        .values(user_id=user_id, company_id=company_id)
        .on_conflict_do_nothing(constraint="uq_company_follower_user_company")
    )


def unfollow(database: Session, user_id: UUID, company_id: UUID) -> None:
    database.execute(
        delete(CompanyFollower).where(
            CompanyFollower.user_id == user_id,
            CompanyFollower.company_id == company_id,
        )
    )


def count_followers(database: Session, company_id: UUID) -> int:
    return database.scalar(
        select(func.count()).select_from(CompanyFollower).where(
            CompanyFollower.company_id == company_id
        )
    ) or 0


def is_following(database: Session, user_id: UUID, company_id: UUID) -> bool:
    return database.scalar(
        select(CompanyFollower.id).where(
            CompanyFollower.user_id == user_id,
            CompanyFollower.company_id == company_id,
        )
    ) is not None
