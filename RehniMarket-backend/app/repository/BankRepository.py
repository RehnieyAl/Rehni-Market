"""Acceso a datos del catálogo de bancos y su enlace con cuentas bancarias registradas antes del catálogo."""

from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.ModelBank import Bank
from app.models.ModelCompanyBankAccount import CompanyBankAccount


def list_banks(database: Session, active_only: bool = False) -> list[Bank]:
    query = database.query(Bank)
    if active_only:
        query = query.filter(Bank.is_active.is_(True))
    return query.order_by(Bank.name.asc()).all()


def get_bank(database: Session, bank_id: UUID) -> Bank | None:
    return database.query(Bank).filter(Bank.id == bank_id).first()


def get_bank_by_normalized_name(database: Session, normalized_name: str) -> Bank | None:
    return database.query(Bank).filter(Bank.normalized_name == normalized_name).first()


def count_accounts_by_bank(database: Session) -> dict[UUID, int]:
    rows = database.execute(
        select(CompanyBankAccount.bank_id, func.count())
        .where(CompanyBankAccount.bank_id.is_not(None))
        .group_by(CompanyBankAccount.bank_id)
    ).all()
    return {bank_id: total for bank_id, total in rows}


def link_legacy_accounts(database: Session, bank: Bank) -> int:
    """Enlaza las cuentas sin banco cuyo bank_name normalizado coincide con el banco (mismo criterio
    que normalize_bank_name: espacios colapsados y minúsculas). No toca cuentas ya enlazadas."""
    normalized_column = func.lower(func.regexp_replace(func.trim(CompanyBankAccount.bank_name), r"\s+", " ", "g"))
    result = database.execute(
        update(CompanyBankAccount)
        .where(CompanyBankAccount.bank_id.is_(None), normalized_column == bank.normalized_name)
        .values(bank_id=bank.id, bank_name=bank.name)
        .execution_options(synchronize_session=False)
    )
    return result.rowcount or 0


def rename_linked_accounts(database: Session, bank: Bank) -> None:
    """bank_name de las cuentas enlazadas sigue al catálogo: lo leen liquidaciones y correos."""
    database.execute(
        update(CompanyBankAccount)
        .where(CompanyBankAccount.bank_id == bank.id)
        .values(bank_name=bank.name)
        .execution_options(synchronize_session=False)
    )
