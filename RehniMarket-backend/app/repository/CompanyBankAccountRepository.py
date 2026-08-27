from sqlalchemy.orm import Session
from uuid import UUID

from app.models.ModelCompanyBankAccount import CompanyBankAccount


def list_bank_accounts(database: Session, company_id: UUID):
    return (
        database.query(CompanyBankAccount)
        .filter(CompanyBankAccount.company_id == company_id)
        .order_by(CompanyBankAccount.is_default.desc(), CompanyBankAccount.created_at.desc())
        .all()
    )


def get_bank_account_owned(
    database: Session, company_id: UUID, bank_account_id: UUID
) -> CompanyBankAccount | None:
    return (
        database.query(CompanyBankAccount)
        .filter(
            CompanyBankAccount.id == bank_account_id,
            CompanyBankAccount.company_id == company_id,
        )
        .first()
    )


def get_default_bank_account(database: Session, company_id: UUID) -> CompanyBankAccount | None:
    return (
        database.query(CompanyBankAccount)
        .filter(
            CompanyBankAccount.company_id == company_id,
            CompanyBankAccount.is_default.is_(True),
        )
        .first()
    )


def create_bank_account(database: Session, bank_account: CompanyBankAccount) -> CompanyBankAccount:
    database.add(bank_account)
    database.flush()
    return bank_account


def delete_bank_account(database: Session, bank_account: CompanyBankAccount) -> None:
    database.delete(bank_account)


def clear_default(database: Session, company_id: UUID) -> None:
    database.query(CompanyBankAccount).filter(
        CompanyBankAccount.company_id == company_id
    ).update({CompanyBankAccount.is_default: False})


def is_bank_account_referenced_by_payout(database: Session, bank_account_id: UUID) -> bool:
    # Import local para evitar un ciclo de import a nivel de módulo entre
    # los repos de bank accounts y payouts (ambos solo se necesitan entre
    # sí en esta función puntual).
    from app.models.ModelCompanyPayout import CompanyPayout

    return (
        database.query(CompanyPayout.id)
        .filter(CompanyPayout.bank_account_id == bank_account_id)
        .first()
        is not None
    )
