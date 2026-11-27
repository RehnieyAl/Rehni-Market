"""Crea el único owner con el hash de contraseñas del backend. Lo ejecuta `rehnimarket init owner` dentro del
contenedor backend; los datos llegan como JSON por la entrada estándar para que la clave no aparezca en
argumentos ni en variables de entorno."""

import json
import re
import sys
import uuid

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.core.dbconexion import SessionLocal
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.utils.Security import hash_password

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def fail(message: str, code: int = 1) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(code)


def validate(name: str, email: str, phone: str, password: str) -> None:
    # Las mismas reglas que el registro por la API y deploy/sql/crear-owner.sql.
    if not EMAIL_PATTERN.match(email) or len(email) > 50:
        fail("el correo no es válido o supera 50 caracteres")
    if not 3 <= len(name) <= 50:
        fail("el nombre debe tener entre 3 y 50 caracteres")
    if not re.fullmatch(r"[0-9]{10}", phone):
        fail("el teléfono debe tener exactamente 10 dígitos")
    # bcrypt solo usa los primeros 72 bytes: una clave más larga no protegería la parte sobrante.
    if not 8 <= len(password.encode()) <= 72:
        fail("la clave debe tener entre 8 y 72 bytes")
    if not (re.search(r"[A-Z]", password) and re.search(r"[a-z]", password) and re.search(r"[0-9]", password)):
        fail("la clave debe tener al menos una mayúscula, una minúscula y un número")


def main() -> None:
    data = json.loads(sys.stdin.read())
    name = data["nombre"].strip()
    email = data["correo"].strip().lower()
    phone = data["telefono"].strip()
    password = data["clave"]
    validate(name, email, phone, password)

    db = SessionLocal()
    try:
        owner_role = db.query(Role).filter(Role.name == "owner").first()
        if owner_role is None:
            fail("no existe el rol owner: ejecuta antes `rehnimarket init roles`", 2)
        if db.query(Users.id).filter(Users.role_id == owner_role.id).first():
            fail("ya existe un owner; RehniMarket admite uno solo (transferencia: deploy/OWNER.md)", 3)
        if db.query(Users.id).filter(func.lower(Users.email) == email).first():
            fail("el correo ya está registrado; para convertir esa cuenta usa deploy/OWNER.md", 4)

        db.add(
            Users(
                id=uuid.uuid4(),
                fullName=name,
                email=email,
                tell=phone,
                hashed_password=hash_password(password),
                role_id=owner_role.id,
                verified=True,
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        fail("la base rechazó la cuenta (otro owner o correo duplicado creado a la vez)", 5)
    finally:
        db.close()

    print(f"owner creado: {email}")


if __name__ == "__main__":
    main()
