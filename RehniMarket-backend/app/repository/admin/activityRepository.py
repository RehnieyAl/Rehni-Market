
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.ModelAdminActivity import AdminActivity


def create_admin_activity(
    database: Session,
    admin_id,
    action,
    target_user_id=None,
    target_company_id=None,
):
    activity = AdminActivity(
        admin_id=admin_id,
        action=action,
        target_user_id=target_user_id,
        target_company_id=target_company_id,
    )

    database.add(activity)
    database.commit()
    database.refresh(activity)

    return activity


def get_recent_admin_activities(
    database: Session,
    limit: int = 10,
):
    result = database.execute(
        select(AdminActivity)
        .options(
            selectinload(AdminActivity.admin),
            selectinload(AdminActivity.target_user),
            selectinload(AdminActivity.target_company),
        )
        .order_by(AdminActivity.created_at.desc())
        .limit(limit)
    )

    return result.scalars().all()

