"""Seed de la cuenta owner definida en el .env (USER_NAME_OWNER, OWNER_DEFAULT, OWNER_PASSWORD_DEFAULT)."""

import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.Config import config
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.utils.Security import hash_password


def seed_owner(db: Session):
    owner_role = db.query(Role).filter(Role.name == "owner").first()

    if not owner_role:
        return

    owner_name = config.OWNER_NAME
    owner_email = config.OWNER_DEFAULT
    owner_password = config.OWNER_PASSWORD_DEFAULT

    if not owner_name or not owner_email or not owner_password:
        return

    # Solo puede haber un owner (índice único en la base): si ya existe uno, aunque sea con otro
    # correo, no se crea nada. Tampoco se toca una cuenta que ya use ese correo.
    owner_exists = db.query(Users.id).filter(Users.role_id == owner_role.id).first()
    email_taken = db.query(Users.id).filter(func.lower(Users.email) == owner_email.strip().lower()).first()

    if owner_exists or email_taken:
        return

    db.add(
        Users(
            id=uuid.uuid4(),
            fullName=owner_name,
            email=owner_email.strip().lower(),
            tell="0000000000",
            hashed_password=hash_password(owner_password),
            role_id=owner_role.id,
            verified=True,
        )
    )
    db.commit()
