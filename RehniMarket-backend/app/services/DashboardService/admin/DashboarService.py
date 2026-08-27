
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
    AdminRecentActivityResponse,
    AdminRecentUserResponse
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


def get_recent_activities(
    database: Session,
    limit: int = 4,
):
    return get_recent_admin_activities(
        database=database,
        limit=limit,
    )


def get_recent_activities_service(
    database: Session,
    limit: int = 4,
) -> list[AdminRecentActivityResponse]:

    activities = get_recent_admin_activities(
        database=database,
        limit=limit,
    )

    response = []

    for activity in activities:

        action = activity.action.value

        title = ""
        description = ""

        # ==========================================
        # USUARIOS
        # ==========================================

        if action == "user_created":
            title = "Nuevo usuario registrado"

            if activity.target_user:
                description = (
                    f"{activity.target_user.fullName} "
                    f"creó una cuenta."
                )
            else:
                description = (
                    "Se registró un nuevo usuario."
                )

        elif action == "user_updated":
            title = "Usuario actualizado"

            if activity.target_user:
                description = (
                    f"Se actualizaron los datos de "
                    f"{activity.target_user.fullName}."
                )
            else:
                description = (
                    "Se actualizaron los datos de un usuario."
                )

        elif action == "user_blocked":
            title = "Usuario bloqueado"

            if activity.target_user:
                description = (
                    f"{activity.target_user.fullName} "
                    f"fue bloqueado."
                )
            else:
                description = (
                    "Un usuario fue bloqueado."
                )

        elif action == "user_unblocked":
            title = "Usuario desbloqueado"

            if activity.target_user:
                description = (
                    f"{activity.target_user.fullName} "
                    f"fue desbloqueado."
                )
            else:
                description = (
                    "Un usuario fue desbloqueado."
                )

        elif action == "user_upgraded":
            title = "Usuario actualizado"

            if activity.target_user:
                description = (
                    f"{activity.target_user.fullName} "
                    f"actualizó su cuenta."
                )
            else:
                description = (
                    "Un usuario actualizó su cuenta."
                )

        elif action == "user_deleted":
            title = "Usuario eliminado"

            if activity.target_user:
                description = (
                    f"{activity.target_user.fullName} "
                    f"fue eliminado."
                )
            else:
                description = (
                    "Un usuario fue eliminado."
                )

        # ==========================================
        # EMPRESAS
        # ==========================================

        elif action == "company_created":
            title = "Nueva empresa registrada"

            if activity.target_company:
                description = (
                    f"{activity.target_company.nameCompany} "
                    f"fue registrada."
                )
            else:
                description = (
                    "Se registró una nueva empresa."
                )

        elif action == "company_approved":
            title = "Empresa aprobada"

            if activity.target_company:
                description = (
                    f"{activity.target_company.nameCompany} "
                    f"fue aprobada."
                )
            else:
                description = (
                    "Una empresa fue aprobada."
                )

        elif action == "company_rejected":
            title = "Empresa rechazada"

            if activity.target_company:
                description = (
                    f"{activity.target_company.nameCompany} "
                    f"fue rechazada."
                )
            else:
                description = (
                    "Una empresa fue rechazada."
                )

        elif action == "company_blocked":
            title = "Empresa bloqueada"

            if activity.target_company:
                description = (
                    f"{activity.target_company.nameCompany} "
                    f"fue bloqueada."
                )
            else:
                description = (
                    "Una empresa fue bloqueada."
                )

        elif action == "company_unblocked":
            title = "Empresa desbloqueada"

            if activity.target_company:
                description = (
                    f"{activity.target_company.nameCompany} "
                    f"fue desbloqueada."
                )
            else:
                description = (
                    "Una empresa fue desbloqueada."
                )

        else:
            title = "Actividad administrativa"
            description = (
                "Se realizó una acción administrativa."
            )

        # ==========================================
        # ADMINISTRADOR QUE REALIZÓ LA ACCIÓN
        # ==========================================

        if activity.admin:
            description = (
                f"{description[:-1]} "
                f"por {activity.admin.fullName}."
            )

        response.append(
            AdminRecentActivityResponse(
                id=activity.id,
                action=action,
                title=title,
                description=description,
                created_at=activity.created_at,
                target_user_id=activity.target_user_id,
                target_company_id=activity.target_company_id,
                admin_id=activity.admin_id,
                admin_name=(
                    activity.admin.fullName
                    if activity.admin
                    else None
                ),
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