from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelFavorite import Favorite


def get_favorite(database: Session, user_id: UUID, product_id: UUID) -> Favorite | None:
    return (
        database.query(Favorite)
        .filter(Favorite.user_id == user_id, Favorite.product_id == product_id)
        .first()
    )


def list_favorites(database: Session, user_id: UUID):
    return (
        database.query(Favorite)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


def count_favorites(database: Session, user_id: UUID) -> int:
    return database.query(Favorite).filter(Favorite.user_id == user_id).count()


def create_favorite(database: Session, user_id: UUID, product_id: UUID) -> Favorite:
    favorite = Favorite(user_id=user_id, product_id=product_id)
    database.add(favorite)
    database.flush()
    return favorite


def delete_favorite(database: Session, favorite: Favorite) -> None:
    database.delete(favorite)
