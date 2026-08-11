from uuid import UUID

from sqlalchemy.orm import Session

from app.repository.UserRepository import get_by_id

def get_authenticated_user(database: Session,user_id: str):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        return None

    return get_by_id(database,user_uuid)