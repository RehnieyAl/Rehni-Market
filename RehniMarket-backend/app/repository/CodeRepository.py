from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.ModelCode import Codes, TypeCode


def create_code(database: Session,user_id: UUID,code: str,code_type: TypeCode,expires_at: datetime,created_at: datetime | None = None) -> Codes:
    new_code = Codes(
        code=code,
        type=code_type,
        user_id=user_id,
        created_at=created_at or datetime.utcnow(),
        expires_at=expires_at
    )

    database.add(new_code)
    database.flush()

    return new_code

def get_code(database: Session,user_id: UUID,code_type: TypeCode) -> Codes | None:
    # created_at DESC: normalmente solo hay una fila por usuario+tipo
    # (create_code_service borra la anterior antes de insertar), pero si
    # por lo que sea quedara mas de una, siempre gana la mas reciente -
    # nunca un codigo viejo.
    return (
        database.query(Codes)
        .filter(Codes.user_id == user_id, Codes.type == code_type)
        .order_by(Codes.created_at.desc())
        .first()
    )


def delete_code(database: Session,code: Codes) -> None:
    database.delete(code)
    database.flush()

def delete_user_codes(database: Session,user_id: UUID,code_type: TypeCode) -> None:

    database.query(Codes).filter(Codes.user_id == user_id,Codes.type == code_type).delete(synchronize_session=False)
    database.flush()