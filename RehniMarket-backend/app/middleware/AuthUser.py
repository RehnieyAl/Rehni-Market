from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.ModelUser import Users

def get_authenticated_user(database: Session,user_id: str):
    """Usuario del token con `role` y `company` ya cargados en la MISMA consulta.

    auth_middleware lee user.role y user.company desde el event loop, después de
    cerrar la sesión: si fueran carga perezosa, cada petición autenticada haría
    dos consultas síncronas bloqueando el event loop (o fallaría con la sesión
    cerrada)."""
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        return None

    return (
        database.query(Users)
        .options(joinedload(Users.role), joinedload(Users.company))
        .filter(Users.id == user_uuid)
        .first()
    )
