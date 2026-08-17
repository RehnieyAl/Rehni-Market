from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelAddress import Address


def list_addresses(database: Session, user_id: UUID):
    return (
        database.query(Address)
        .filter(Address.user_id == user_id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )


def get_address_owned(database: Session, user_id: UUID, address_id: UUID) -> Address | None:
    return (
        database.query(Address)
        .filter(Address.id == address_id, Address.user_id == user_id)
        .first()
    )


def create_address(database: Session, address: Address) -> Address:
    database.add(address)
    database.flush()
    return address


def delete_address(database: Session, address: Address) -> None:
    database.delete(address)


def clear_default(database: Session, user_id: UUID) -> None:
    database.query(Address).filter(Address.user_id == user_id).update(
        {Address.is_default: False}
    )
