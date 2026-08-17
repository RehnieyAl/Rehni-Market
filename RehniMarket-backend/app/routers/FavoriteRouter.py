from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaFavorite import AddFavoriteRequest, FavoriteResponse

from app.services.commerce.FavoriteService import (
    list_favorites_service,
    add_favorite_service,
    remove_favorite_service,
)

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteResponse])
def get_favorites(request: Request, database: Session = Depends(get_db)):
    return list_favorites_service(request.state.user_id, request.state.role, database)


@router.post("")
def add_favorite(request: Request, data: AddFavoriteRequest, database: Session = Depends(get_db)):
    return add_favorite_service(request.state.user_id, request.state.role, data, database)


@router.delete("/{product_id}")
def remove_favorite(request: Request, product_id: UUID, database: Session = Depends(get_db)):
    return remove_favorite_service(request.state.user_id, request.state.role, product_id, database)
