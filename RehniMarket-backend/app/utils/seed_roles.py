"""Seed de roles: user, company, admin y owner (datos base)."""

from sqlalchemy.orm import Session

from app.models.ModelRole import Role


def seed_roles(db: Session):
    roles = ["user", "company", "admin", "owner"]

    for role_name in roles:
        exists = db.query(Role).filter(Role.name == role_name).first()

        if not exists:
            db.add(Role(name=role_name))

    db.commit()
