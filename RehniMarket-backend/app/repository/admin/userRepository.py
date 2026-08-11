
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from app.models.ModelUser import Users
from uuid import UUID


def get_user_by_email_repository(
    database: Session,
    email: str,
):
    return (
        database.query(Users)
        .filter(Users.email == email)
        .first()
    )


def get_all_users_repository(
    admin_id: UUID,
    database: Session,
    limit: int = 10,
    cursor: UUID | None = None,
    before_cursor: UUID | None = None,
    search: str | None = None,
):
    query = (
        database.query(Users)
        .options(selectinload(Users.role))
        .filter(Users.id != admin_id)
    )

    if search and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Users.fullName.ilike(search_value),
                Users.email.ilike(search_value),
                Users.tell.ilike(search_value),
            )
        )

    if cursor:
        cursor_user = (
            database.query(Users)
            .filter(Users.id == cursor)
            .first()
        )

        if cursor_user:
            query = query.filter(
                or_(
                    Users.created_at < cursor_user.created_at,
                    and_(
                        Users.created_at == cursor_user.created_at,
                        Users.id < cursor_user.id,
                    ),
                )
            )

    if before_cursor:
        cursor_user = (
            database.query(Users)
            .filter(Users.id == before_cursor)
            .first()
        )

        if cursor_user:
            query = query.filter(
                or_(
                    Users.created_at > cursor_user.created_at,
                    and_(
                        Users.created_at == cursor_user.created_at,
                        Users.id > cursor_user.id,
                    ),
                )
            )

            users = (
                query
                .order_by(
                    Users.created_at.asc(),
                    Users.id.asc(),
                )
                .limit(limit + 1)
                .all()
            )

            has_previous = len(users) > limit

            users = users[:limit]

            users.reverse()

            has_next = True

            next_cursor = (
                users[-1].id
                if users
                else None
            )

            previous_cursor = (
                users[0].id
                if users
                else None
            )

            return (
                users,
                next_cursor,
                previous_cursor,
                has_next,
                has_previous,
            )

    users = (
        query
        .order_by(
            Users.created_at.desc(),
            Users.id.desc(),
        )
        .limit(limit + 1)
        .all()
    )

    has_next = len(users) > limit

    users = users[:limit]

    next_cursor = (
        users[-1].id
        if has_next and users
        else None
    )

    has_previous = cursor is not None

    previous_cursor = (
        users[0].id
        if has_previous and users
        else None
    )

    return (
        users,
        next_cursor,
        previous_cursor,
        has_next,
        has_previous,
    )


def get_user_by_id_repository(
    database: Session,
    user_id: UUID,
) -> Users | None:
    return (
        database.query(Users)
        .options(selectinload(Users.role))
        .filter(Users.id == user_id)
        .first()
    )


def update_user_repository(
    database: Session,
    user: Users,
) -> Users:
    database.flush()
    database.refresh(user)

    return user


def update_user_status_repository(
    database: Session,
    user: Users,
) -> Users:
    database.flush()
    database.refresh(user)

    return user


def delete_admin_user_repository(
    database: Session,
    user_id: UUID,
) -> bool:
    user = (
        database.query(Users)
        .filter(Users.id == user_id)
        .first()
    )

    if user is None:
        return False

    database.delete(user)
    database.flush()

    return True


def update_user_credentials_repository(database: Session,user: Users,
    email: str,
    hashed_password: str,
) -> Users:
    user.email = email
    user.hashed_password = hashed_password

    database.flush()
    database.refresh(user)

    return user


