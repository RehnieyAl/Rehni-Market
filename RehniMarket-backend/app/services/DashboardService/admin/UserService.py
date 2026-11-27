"""Gestión de usuarios desde el panel admin: listado, detalle, cambio de correo o rol y bloqueo."""
from sqlalchemy.orm import Session
from uuid import UUID

from app.repository.admin.userRepository import (
    get_all_users_repository,
    get_user_by_id_repository,
    get_user_by_email_repository,
    update_user_repository,
    update_user_status_repository,
    update_user_credentials_repository,
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
from app.services.NasService import build_media_url

# Un solo owner (#54): se crea y administra desde PostgreSQL (deploy/OWNER.md), nunca por la API.
OWNER_ONLY_FROM_DATABASE = "La cuenta owner solo se administra desde la base de datos."


def _profile_image_url(user) -> str | None:
    return (
        build_media_url(f"uploads/{user.profileImagen}")
        if user.profileImagen
        else None
    )


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
            profileImagen=_profile_image_url(user),
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
        profileImagen=_profile_image_url(user),
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )


def _get_editable_user(database: Session, user_id: UUID, admin_id: UUID, requested_role: str | None):
    # admin_id es el `sub` del JWT (texto) y user_id un UUID: se comparan normalizados.
    if str(admin_id) == str(user_id):
        api_error(
            400,
            ErrorCodes.INVALID_USER,
            "No puedes modificar tu propia cuenta desde esta opción.",
        )

    if requested_role == "owner":
        api_error(403, ErrorCodes.FORBIDDEN, OWNER_ONLY_FROM_DATABASE)

    user = get_user_by_id_repository(database, user_id)

    if not user:
        api_error(404, ErrorCodes.USER_NOT_FOUND, "Usuario no encontrado.")

    if user.role and user.role.name == "owner":
        api_error(403, ErrorCodes.FORBIDDEN, OWNER_ONLY_FROM_DATABASE)

    return user


def _update_user_email(database: Session, user, email: str) -> None:
    """Cambia el correo y envía una contraseña temporal al nuevo."""
    existing_user = get_user_by_email_repository(database, email)

    if existing_user and existing_user.id != user.id:
        api_error(409, ErrorCodes.EMAIL_ALREADY_EXISTS, "El correo electrónico ya está registrado.")

    temporary_password = generate_temporary_password()

    update_user_credentials_repository(
        database=database,
        user=user,
        email=email,
        hashed_password=hash_password(temporary_password),
    )

    EmailUpdateUserCredentials(
        to_email=email,
        temporary_password=temporary_password,
    )


def _update_user_role(database: Session, user, new_role: str) -> None:
    if user.role.name == "company":
        api_error(400, ErrorCodes.INVALID_ROLE, "Una empresa no puede cambiar de rol.")

    role = database.query(Role).filter(Role.name == new_role).first()

    if not role:
        api_error(404, ErrorCodes.ROLE_NOT_FOUND, "Rol no encontrado.")

    user.role_id = role.id
    update_user_repository(database, user)


def update_admin_user_service(
    database: Session,
    user_id: UUID,
    admin_id: UUID,
    data: UpdateAdminUserRequest,
):
    user = _get_editable_user(database, user_id, admin_id, data.role)

    if data.email is not None:
        _update_user_email(database, user, data.email)

    if data.role is not None:
        _update_user_role(database, user, data.role)

    if data.email is not None or data.role is not None:
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
        profileImagen=_profile_image_url(user),
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )


def toggle_admin_user_status_service(
    database: Session,
    user_id: UUID,
    admin_id: UUID,
):

    # admin_id es el `sub` del JWT (texto) y user_id un UUID: se comparan normalizados.
    if str(admin_id) == str(user_id):
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

    if user.role and user.role.name == "owner":
        return api_error(
            403,
            ErrorCodes.FORBIDDEN,
            OWNER_ONLY_FROM_DATABASE,
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
        profileImagen=_profile_image_url(user),
        role=user.role.name,
        isActive=user.isActive,
        created_at=user.created_at,
    )
