"""Rutas del panel admin con estadísticas, actividad y usuarios recientes (admin y owner)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import require_role

from app.services.DashboardService.admin.DashboarService import (
    get_admin_dashboard_statistics_service,
    get_recent_activities_service,
    get_recent_users_service
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard/statistics", dependencies=[Depends(require_role("admin", "owner"))])
def get_admin_dashboard_statistics(database: Session = Depends(get_db, scope="function")):
    
    return get_admin_dashboard_statistics_service(database)



@router.get("/dashboard/recent-activities", dependencies=[Depends(require_role("admin", "owner"))])
def get_recent_activities(
    database: Session = Depends(get_db, scope="function"),
):
    return get_recent_activities_service(
        database=database,
        limit=4,
    )



@router.get("/dashboard/recent-users", dependencies=[Depends(require_role("admin", "owner"))])
def get_recent_users(
    database: Session = Depends(get_db, scope="function"),
):
    return get_recent_users_service(
        database=database,
    )