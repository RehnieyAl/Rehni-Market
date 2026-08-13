import uuid
from sqlalchemy.orm import Session
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelCatalog import Catalog, SpecificationTemplate
from app.utils.Security import hash_password
from app.Config import config

def seed_roles(db: Session):
    roles = ["user", "company", "admin", "owner"]

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


def seed_specifications(db: Session):

    specifications = {

        "Computadoras": [
            "Marca",
            "Modelo",
            "Procesador",
            "RAM",
            "Almacenamiento",
            "Tarjeta gráfica",
            "Sistema operativo",
            "Fuente de poder",
        ],

        "Laptops": [
            "Marca",
            "Modelo",
            "Procesador",
            "RAM",
            "Almacenamiento SSD",
            "Tarjeta gráfica",
            "Pantalla",
            "Resolución",
            "Batería",
            "Sistema operativo",
        ],

        "Celulares": [
            "Marca",
            "Modelo",
            "Procesador",
            "RAM",
            "Almacenamiento interno",
            "Cámara principal",
            "Cámara frontal",
            "Batería",
            "Pantalla",
            "Sistema operativo",
        ],

        "Tablets": [
            "Marca",
            "Modelo",
            "Procesador",
            "RAM",
            "Almacenamiento",
            "Pantalla",
            "Batería",
            "Sistema operativo",
        ],

        "Componentes PC": [
            "Marca",
            "Modelo",
            "Tipo",
            "Compatibilidad",
            "Memoria",
            "Frecuencia",
        ],

        "Audio": [
            "Marca",
            "Modelo",
            "Tipo",
            "Conectividad",
            "Duración batería",
        ],

        "Monitores": [
            "Marca",
            "Modelo",
            "Tamaño pantalla",
            "Resolución",
            "Tipo de panel",
            "Frecuencia",
            "Tiempo de respuesta",
        ],

        "Periféricos": [
            "Marca",
            "Modelo",
            "Tipo",
            "Conectividad",
            "Compatibilidad",
        ],

        "Consolas": [
            "Marca",
            "Modelo",
            "Generación",
            "Almacenamiento",
            "Resolución",
        ],

        "Accesorios Gaming": [
            "Marca",
            "Modelo",
            "Tipo",
            "Compatibilidad",
            "Conectividad",
        ],
    }


    for catalog_name, specs in specifications.items():

        catalog = (
            db.query(Catalog)
            .filter(Catalog.name == catalog_name)
            .first()
        )

        if not catalog:
            continue


        for spec_name in specs:

            exists = (
                db.query(SpecificationTemplate)
                .filter(
                    SpecificationTemplate.name == spec_name,
                    SpecificationTemplate.catalog_id == catalog.id
                )
                .first()
            )


            if not exists:

                specification = SpecificationTemplate(
                    name=spec_name,
                    type="text",
                    required=True,
                    catalog_id=catalog.id
                )

                db.add(specification)


    db.commit()


def seed_admin(db: Session):
    admin_role = db.query(Role).filter(Role.name == "admin").first()

    if not admin_role:
        return
    
    admin_name = config.ADMIN_NAME
    admin_email = config.ADMIN_DEFAULT
    admin_password = config.PASSWORD_DEFAULT


    exists = db.query(Users).filter(Users.email == admin_email).first()

    if not exists:
        admin = Users(
            id=uuid.uuid4(),
            fullName=admin_name,
            email=admin_email,
            tell="0000000000",
            hashed_password=hash_password(admin_password),
            role_id=admin_role.id,
            verified = True

        )

        db.add(admin)
        db.commit()


def seed_owner(db: Session):
    owner_role = db.query(Role).filter(Role.name == "owner").first()

    if not owner_role:
        return

    owner_name = config.OWNER_NAME
    owner_email = config.OWNER_DEFAULT
    owner_password = config.OWNER_PASSWORD_DEFAULT

    # Si no se configuraron las variables de entorno del owner,
    # no se crea ninguna cuenta (evita insertar un usuario con
    # correo/contraseña vacios).
    if not owner_name or not owner_email or not owner_password:
        return

    exists = db.query(Users).filter(Users.email == owner_email).first()

    if not exists:
        owner = Users(
            id=uuid.uuid4(),
            fullName=owner_name,
            email=owner_email,
            tell="0000000000",
            hashed_password=hash_password(owner_password),
            role_id=owner_role.id,
            verified = True

        )

        db.add(owner)
        db.commit()


def run_seed(db: Session):
    seed_roles(db)
    seed_catalog(db)
    seed_specifications(db)
    seed_admin(db)
    seed_owner(db)