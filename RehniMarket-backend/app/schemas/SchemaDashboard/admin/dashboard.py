"""Esquemas del inicio del panel de administración: estadísticas y actividad reciente."""
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

class AdminDashboardStatisticsResponse(BaseModel):
    users: int
    companies: int
    active_users: int
    blocked_users: int
    administrators: int
    active_companies: int
    blocked_companies: int

class AdminRecentActivityResponse(BaseModel):
    id: UUID
    action: str
    title: str
    description: str
    created_at: datetime

    target_user_id: UUID | None = None
    target_company_id: UUID | None = None

    admin_id: UUID
    admin_name: str | None = None
