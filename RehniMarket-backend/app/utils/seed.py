import uuid
from sqlalchemy.orm import Session
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelProduct import Catalog
from app.utils.Security import hash_password
from app.Config import config

def seed_roles(db: Session):
    roles = ["user", "company", "admin"]

    for role_name in roles:
        exists = db.query(Role).filter(Role.name == role_name).first()

        if not exists:
            db.add(Role(name=role_name))

    db.commit()


def seed_catalog(db: Session):
    catalog_product = catalog_product = [
    "Figuras Coleccionables",
    "Peluches",
    "Mangas",
    "Novelas Ligeras",
    "Artbooks",
    "Cosplay",
    "Accesorios Cosplay",
    "Ropa Anime",
    "Calzado",
    "Llaveros",
    "Pines",
    "Stickers",
    "Posters",
    "Mouse Pads",
    "Tazas",
    "Decoración",
    "Videojuegos",
    "Consolas",
    "Accesorios Gaming",
    "Computadoras",
    "Laptops",
    "Componentes PC",
    "Celulares",
    "Tablets",
    "Audio",
    "Smartwatch",
    "Periféricos",
    "Iluminación RGB",
    "Coleccionables",
    "Otros"
    ]

    for catalog_name in catalog_product:
        exists = db.query(Catalog).filter(Catalog.name == catalog_name).first()

        if not exists:
            db.add(Catalog(name=catalog_name))

    db.commit()


def seed_admin(db: Session):
    admin_role = db.query(Role).filter(Role.name == "admin").first()

    if not admin_role:
        return

    admin_email = config.ADMIN_DEFAULT
    admin_password = config.PASSWORD_DEFAULT

    exists = db.query(Users).filter(Users.email == admin_email).first()

    if not exists:
        admin = Users(
            id=uuid.uuid4(),
            fullName="System Admin",
            email=admin_email,
            tell="0000000000",
            hashed_password=hash_password(admin_password),
            role_id=admin_role.id,
            verified = True

        )

        db.add(admin)
        db.commit()


def run_seed(db: Session):
    seed_roles(db)
    seed_catalog(db)
    seed_admin(db)