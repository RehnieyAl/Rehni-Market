"""Inicio del panel de administración: estadísticas, bitácora de actividad con textos legibles y usuarios recientes."""

from sqlalchemy.orm import Session

from app.repository.admin.dashboardRepository import (
    get_admin_dashboard_statistics_repository,
    get_recent_users_repository
)

from app.repository.admin.activityRepository import (
    create_admin_activity,
    get_recent_admin_activities,
)

from app.schemas.SchemaDashboard.admin.dashboard import (
    AdminDashboardStatisticsResponse,
    AdminRecentActivityResponse
)


def get_admin_dashboard_statistics_service(
    database: Session,
) -> AdminDashboardStatisticsResponse:

    statistics = get_admin_dashboard_statistics_repository(
        database
    )

    return AdminDashboardStatisticsResponse(
        users=statistics["users"],
        companies=statistics["companies"],
        active_users=statistics["active_users"],
        blocked_users=statistics["blocked_users"],
        administrators=statistics["administrators"],
        active_companies=statistics["active_companies"],
        blocked_companies=statistics["blocked_companies"],
    )


def register_admin_activity(
    database: Session,
    admin_id,
    action,
    target_user_id=None,
    target_company_id=None,
    reason=None,
):
    return create_admin_activity(
        database=database,
        admin_id=admin_id,
        action=action,
        target_user_id=target_user_id,
        target_company_id=target_company_id,
        reason=reason,
    )


# acción -> (título, objetivo, descripción con nombre, descripción sin objetivo)
_ACTIVITY_TEXTS = {
    "user_created": ("Nuevo usuario registrado", "user", "{name} creó una cuenta.", "Se registró un nuevo usuario."),
    "user_updated": ("Usuario actualizado", "user", "Se actualizaron los datos de {name}.",
                     "Se actualizaron los datos de un usuario."),
    "user_blocked": ("Usuario bloqueado", "user", "{name} fue bloqueado.", "Un usuario fue bloqueado."),
    "user_unblocked": ("Usuario desbloqueado", "user", "{name} fue desbloqueado.", "Un usuario fue desbloqueado."),
    "user_upgraded": ("Usuario actualizado", "user", "{name} actualizó su cuenta.", "Un usuario actualizó su cuenta."),
    "user_deleted": ("Usuario eliminado", "user", "{name} fue eliminado.", "Un usuario fue eliminado."),
    "company_created": ("Nueva empresa registrada", "company", "{name} fue registrada.",
                        "Se registró una nueva empresa."),
    "company_approved": ("Empresa aprobada", "company", "{name} fue aprobada.", "Una empresa fue aprobada."),
    "company_rejected": ("Empresa rechazada", "company", "{name} fue rechazada.", "Una empresa fue rechazada."),
    "company_blocked": ("Empresa bloqueada", "company", "{name} fue bloqueada.", "Una empresa fue bloqueada."),
    "company_unblocked": ("Empresa desbloqueada", "company", "{name} fue desbloqueada.",
                          "Una empresa fue desbloqueada."),
}


def _activity_title_and_description(activity) -> tuple[str, str]:
    texts = _ACTIVITY_TEXTS.get(activity.action.value)

    if not texts:
        return "Actividad administrativa", "Se realizó una acción administrativa."

    title, target, with_name, without_target = texts
    if target == "user":
        name = activity.target_user.fullName if activity.target_user else None
    else:
        name = activity.target_company.nameCompany if activity.target_company else None

    return title, with_name.format(name=name) if name is not None else without_target


def get_recent_activities_service(
    database: Session,
    limit: int = 4,
) -> list[AdminRecentActivityResponse]:
    activities = get_recent_admin_activities(database=database, limit=limit)
    response = []

    for activity in activities:
        title, description = _activity_title_and_description(activity)

        if activity.admin:
            description = f"{description[:-1]} por {activity.admin.fullName}."

        response.append(
            AdminRecentActivityResponse(
                id=activity.id,
                action=activity.action.value,
                title=title,
                description=description,
                created_at=activity.created_at,
                target_user_id=activity.target_user_id,
                target_company_id=activity.target_company_id,
                admin_id=activity.admin_id,
                admin_name=activity.admin.fullName if activity.admin else None,
            )
        )

    return response



def get_recent_users_service(database: Session,):
    users = get_recent_users_repository(database=database,limit=4)

    return [
        {
            "id": str(user.id),
            "fullName": user.fullName,
            "email": user.email,
            "role": user.role.name,
            "isActive": user.isActive,
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]