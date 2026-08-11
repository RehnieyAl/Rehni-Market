from sqlalchemy.orm import Session

from app.models.ModelUser import Users
from app.schemas.schemaAuth.SchemaRegister import CreateUserRequest
from app.utils.Security import hash_password

from uuid import UUID

def get_by_email(database: Session, email: str) -> Users | None:
    get_email = database.query(Users).filter(Users.email == email).first()
    return get_email

def create_user(database: Session,user: CreateUserRequest,role_id: int) -> Users:
    new_user = Users(
        fullName=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        tell=user.tell,
        role_id=role_id,
    )
    database.add(new_user)
    database.flush()
    return new_user

def verify_email(database: Session, user: Users):
    user.verified = True
    database.flush()
    return user

def change_email(database: Session, user: Users, new_email: str):
    user.email = new_email
    user.verified = False
    database.flush()
    return user


def get_by_id(database: Session, user_id: UUID) -> Users | None:
    my_user = database.query(Users).filter(Users.id == user_id).first()
    return my_user

def update_password(database: Session, search_user: Users, password: str) -> Users:
    search_user.hashed_password = hash_password(password)
    database.flush()
    return search_user


