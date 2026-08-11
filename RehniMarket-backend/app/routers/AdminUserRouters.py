from fastapi import APIRouter, Request,Depends, UploadFile, File, Form, Body, Query
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from uuid import UUID

from app.services.DashboardService.admin.UserService import (
    get_all_users_service,
    get_user_by_id_service,
    update_admin_user_service,
    toggle_admin_user_status_service,
    delete_admin_user_service
)

router = APIRouter(
    prefix=("/admin"),
    tags=["admin"]
)

from app.schemas.SchemaDashboard.admin.user import UpdateAdminUserRequest

@router.get("/dashboard/get-users")
def get_all_users(
    request: Request,
    limit: int = Query(default=10, ge=1, le=100),
    cursor: UUID | None = Query(default=None),
    before_cursor: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    database: Session = Depends(get_db),
):
    admin_id = request.state.user_id

    return get_all_users_service(
        admin_id=admin_id,
        database=database,
        limit=limit,
        cursor=cursor,
        before_cursor=before_cursor,
        search=search,
    )

@router.get("/dashboard/get-user/{user_id}")
def get_user_by_id(user_id: UUID,database: Session = Depends(get_db)):

    return get_user_by_id_service(user_id,database)


@router.patch("/dashboard/user/update-information/{user_id}")
def update_admin_user(request: Request,user_id: UUID,data: UpdateAdminUserRequest,database: Session = Depends(get_db)):

    admin_id = request.state.user_id

    return update_admin_user_service(database,user_id,admin_id,data)


@router.patch("/dashboard/user/update-information/status/{user_id}")
def toggle_admin_user_status(request: Request, user_id: UUID,database: Session = Depends(get_db)):

    admin_id = request.state.user_id
    return toggle_admin_user_status_service(database=database,user_id=user_id,admin_id=admin_id)


@router.delete("/dashboard/user/delete/{user_id}")
def delete_admin_user(request: Request,user_id: UUID,database: Session = Depends(get_db)):

    admin_id = request.state.user_id

    return delete_admin_user_service(database=database,user_id=user_id,admin_id=admin_id)