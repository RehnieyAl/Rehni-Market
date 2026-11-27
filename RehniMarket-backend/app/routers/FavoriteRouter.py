"""Rutas de favoritos del comprador (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaFavorite import AddFavoriteRequest, FavoriteResponse

from app.services.commerce.FavoriteService import (
    list_favorites_service,
    add_favorite_service,
    remove_favorite_service,
)

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteResponse])
def get_favorites(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    database: Session = Depends(get_db, scope="function"),
):
    return list_favorites_service(current.user_id, current.role, database)


@router.post("")
def add_favorite(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: AddFavoriteRequest,
    database: Session = Depends(get_db, scope="function"),
):
    return add_favorite_service(current.user_id, current.role, data, database)


@router.delete("/{product_id}")
def remove_favorite(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    product_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):
    return remove_favorite_service(current.user_id, current.role, product_id, database)
