
from sqlalchemy.orm import Session
from uuid import UUID

from app.repository.admin.userRepository import (
    get_all_users_repository,
    get_user_by_id_repository,
    get_user_by_email_repository,
    update_user_repository,
    update_user_status_repository,
    delete_admin_user_repository,
    update_user_credentials_repository,
)

from app.repository.admin.companyRepository import (
    get_company_by_user_id_repository,
)

from app.models.ModelRole import Role

from app.schemas.SchemaDashboard.admin.user import (
    AdminUserResponse,
    UpdateAdminUserRequest,
    AdminUsersPaginatedResponse,
)

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.utils.generateTemporalPassword import generate_temporary_password
from app.utils.Security import hash_password

from app.services.email.template.EmailUpdateUserCredentials import (
    EmailUpdateUserCredentials,
)

from app.services.DashboardService.admin.DashboarService import (
    register_admin_activity,
)

from app.models.ModelAdminActivity import AdminActivityAction


def get_all_users_service(
    admin_id: UUID,
    database: Session,
    limit: int = 10,
    cursor: UUID | None = None,
    before_cursor: UUID | None = None,
    search: str | None = None,
) -> AdminUsersPaginatedResponse:

    (
        users,
        next_cursor,
        previous_cursor,
        has_next,
        has_previous,
    ) = get_all_users_repository(
        admin_id=admin_id,
        database=database,
        limit=limit,
        cursor=cursor,
        before_cursor=before_cursor,
        search=search,
    )

    items = [
        AdminUserResponse(
            id=user.id,
            fullName=user.fullName,
            email=user.email,
            tell=user.tell,
            profileImagen=user.profileImagen,
            role=user.role.name,
            isActive=user.isActive,
            created_at=user.created_at,
        )
        for user in users
    ]

    return AdminUsersPaginatedResponse(
        items=items,
        next_cursor=next_cursor,
        previous_cursor=previous_cursor,
        has_next=has_next,
        has_previous=has_previous,
    )


def get_user_by_id_service(
    user_id: UUID,
    database: Session,
) -> AdminUserResponse:

    user = get_user_by_id_repository(
        database,
        user_id,
    )

    if not user:
        return api_error(
            404,
            ErrorCodes.USER_NOT_FOUND,
            "Usuario no encontrado.",
        )

    return AdminUserResponse(
        id=user.id,
        fullName=user.fullName,
        email=user.email,
        tell=user.tell,
        profileImagen=user.profileImagen,
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )


def update_admin_user_service(
    database: Session,
    user_id: UUID,
    admin_id: UUID,
    data: UpdateAdminUserRequest,
):

    if admin_id == user_id:
        return api_error(
            400,
            ErrorCodes.INVALID_USER,
            "No puedes modificar tu propia cuenta desde esta opción.",
        )

    user = get_user_by_id_repository(
        database,
        user_id,
    )

    if not user:
        return api_error(
            404,
            ErrorCodes.USER_NOT_FOUND,
            "Usuario no encontrado.",
        )

    updated = False

    if data.email is not None:

        existing_user = get_user_by_email_repository(
            database,
            data.email,
        )

        if existing_user and existing_user.id != user.id:
            return api_error(
                409,
                ErrorCodes.EMAIL_ALREADY_EXISTS,
                "El correo electrónico ya está registrado.",
            )

        temporary_password = generate_temporary_password()
        hashed_password = hash_password(temporary_password)

        update_user_credentials_repository(
            database=database,
            user=user,
            email=data.email,
            hashed_password=hashed_password,
        )

        EmailUpdateUserCredentials(
            to_email=data.email,
            temporary_password=temporary_password,
        )

        updated = True

    if data.role is not None:

        current_role = user.role.name
        new_role = data.role

        if current_role == "company":
            return api_error(
                400,
                ErrorCodes.INVALID_ROLE,
                "Una empresa no puede cambiar de rol.",
            )

        role = (
            database.query(Role)
            .filter(Role.name == new_role)
            .first()
        )

        if not role:
            return api_error(
                404,
                ErrorCodes.ROLE_NOT_FOUND,
                "Rol no encontrado.",
            )

        user.role_id = role.id

        update_user_repository(
            database,
            user,
        )

        updated = True

    if updated:
        register_admin_activity(
            database=database,
            admin_id=admin_id,
            action=AdminActivityAction.USER_UPDATED,
            target_user_id=user.id,
        )

    return AdminUserResponse(
        id=user.id,
        fullName=user.fullName,
        email=user.email,
        tell=user.tell,
        profileImagen=user.profileImagen,
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )


def toggle_admin_user_status_service(
    database: Session,
    user_id: UUID,
    admin_id: UUID,
):

    if admin_id == user_id:
        return api_error(
            400,
            ErrorCodes.INVALID_USER,
            "No puedes bloquear o desbloquear tu propia cuenta.",
        )

    user = get_user_by_id_repository(
        database,
        user_id,
    )

    if not user:
        return api_error(
            404,
            ErrorCodes.USER_NOT_FOUND,
            "Usuario no encontrado.",
        )

    user.isActive = not user.isActive

    update_user_status_repository(
        database,
        user,
    )

    action = (
        AdminActivityAction.USER_UNBLOCKED
        if user.isActive
        else AdminActivityAction.USER_BLOCKED
    )

    register_admin_activity(
        database=database,
        admin_id=admin_id,
        action=action,
        target_user_id=user.id,
    )

    return AdminUserResponse(
        id=user.id,
        fullName=user.fullName,
        email=user.email,
        tell=user.tell,
        profileImagen=user.profileImagen,
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )


def delete_admin_user_service(
    database: Session,
    user_id: UUID,
    admin_id: UUID,
) -> None:

    if user_id == admin_id:
        return api_error(
            403,
            ErrorCodes.FORBIDDEN,
            "No puedes eliminar tu propia cuenta.",
        )

    user = get_user_by_id_repository(
        database,
        user_id,
    )

    if not user:
        return api_error(
            404,
            ErrorCodes.USER_NOT_FOUND,
            "Usuario no encontrado.",
        )

    if user.role and user.role.name == "admin":
        return api_error(
            403,
            ErrorCodes.FORBIDDEN,
            "No se puede eliminar la cuenta de un administrador.",
        )

    company = get_company_by_user_id_repository(
        database,
        user_id,
    )

    if company:
        return api_error(
            409,
            ErrorCodes.USER_HAS_COMPANY,
            "No se puede eliminar este usuario porque está relacionado con una empresa.",
        )

    register_admin_activity(
        database=database,
        admin_id=admin_id,
        action=AdminActivityAction.USER_DELETED,
        target_user_id=user.id,
    )

    deleted = delete_admin_user_repository(
        database,
        user_id,
    )

    if not deleted:
        return api_error(
            404,
            ErrorCodes.USER_NOT_FOUND,
            "Usuario no encontrado.",
        )
