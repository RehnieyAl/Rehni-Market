from sqlalchemy.orm import Session

from app.models.ModelRole import Role


def get_role_by_name(database: Session,role_name: str) -> Role | None:
    role = database.query(Role).filter(Role.name == role_name).first()
    return role