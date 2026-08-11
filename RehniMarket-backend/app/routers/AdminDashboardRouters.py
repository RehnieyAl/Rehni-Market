from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.services.DashboardService.admin.DashboarService import (
    get_admin_dashboard_statistics_service,
    get_recent_activities_service,
    get_recent_users_service
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard/statistics")
def get_admin_dashboard_statistics(database: Session = Depends(get_db)):
    
    return get_admin_dashboard_statistics_service(database)



@router.get("/dashboard/recent-activities")
def get_recent_activities(
    database: Session = Depends(get_db),
):
    return get_recent_activities_service(
        database=database,
        limit=4,
    )



@router.get("/dashboard/recent-users")
def get_recent_users(
    database: Session = Depends(get_db),
):
    return get_recent_users_service(
        database=database,
    )