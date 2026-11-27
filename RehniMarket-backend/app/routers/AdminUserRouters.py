"""Rutas del panel admin para usuarios: listado, detalle, cambio de correo o rol y bloqueo."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role
from uuid import UUID

from app.services.DashboardService.admin.UserService import (
    get_all_users_service,
    get_user_by_id_service,
    update_admin_user_service,
    toggle_admin_user_status_service,
)

router = APIRouter(
    prefix=("/admin"),
    tags=["admin"]
)

from app.schemas.SchemaDashboard.admin.user import UpdateAdminUserRequest

@router.get("/dashboard/get-users")
def get_all_users(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    limit: int = Query(default=10, ge=1, le=100),
    cursor: UUID | None = Query(default=None),
    before_cursor: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    database: Session = Depends(get_db, scope="function"),
):
    admin_id = current.user_id

    return get_all_users_service(
        admin_id=admin_id,
        database=database,
        limit=limit,
        cursor=cursor,
        before_cursor=before_cursor,
        search=search,
    )

@router.get("/dashboard/get-user/{user_id}", dependencies=[Depends(require_role("admin", "owner"))])
def get_user_by_id(user_id: UUID,database: Session = Depends(get_db, scope="function")):

    return get_user_by_id_service(user_id,database)


@router.patch("/dashboard/user/update-information/{user_id}")
def update_admin_user(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    user_id: UUID,
    data: UpdateAdminUserRequest,
    database: Session = Depends(get_db, scope="function"),
):

    admin_id = current.user_id

    return update_admin_user_service(database,user_id,admin_id,data)


@router.patch("/dashboard/user/update-information/status/{user_id}")
def toggle_admin_user_status(
    current: Annotated[AuthContext, Depends(require_role("admin", "owner"))],
    user_id: UUID,
    database: Session = Depends(get_db, scope="function"),
):

    admin_id = current.user_id
    return toggle_admin_user_status_service(database=database,user_id=user_id,admin_id=admin_id)