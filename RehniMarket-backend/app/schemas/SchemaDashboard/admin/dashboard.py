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

class AdminRecentUserResponse(BaseModel):
    id: UUID
    fullName: str
    email: str
    role: str | None
    isActive: bool
    created_at: datetime
