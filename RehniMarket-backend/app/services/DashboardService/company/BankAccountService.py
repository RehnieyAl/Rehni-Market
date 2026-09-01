"""CRUD de cuentas bancarias de la empresa. Mismo patrón que AddressService (una sola
predeterminada), pero el dueño es una Company, resuelta desde el usuario autenticado."""

import traceback
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelCompany import Company
from app.models.ModelCompanyBankAccount import CompanyBankAccount

from app.repository import CompanyRepository
from app.repository import CompanyBankAccountRepository as repo

from app.schemas.SchemaDashboard.SchemaBankAccount import (
    CreateBankAccountRequest,
    UpdateBankAccountRequest,
    BankAccountResponse,
)


def _get_company_for_user(database: Session, user_id: UUID) -> Company:
    company = CompanyRepository.get_company_by_user_id(database, user_id)

    if not company:
        api_error(404, ErrorCodes.COMPANY_NOT_FOUND, "No se encontró una empresa para este usuario.")

    return company


def _to_response(bank_account: CompanyBankAccount) -> BankAccountResponse:
    return BankAccountResponse(
        id=bank_account.id,
        accountHolder=bank_account.account_holder,
        documentNumber=bank_account.document_number,
        bankName=bank_account.bank_name,
        accountType=bank_account.account_type.value,
        accountNumber=bank_account.account_number,
        isDefault=bank_account.is_default,
        createdAt=bank_account.created_at,
        updatedAt=bank_account.updated_at,
    )


def list_bank_accounts_service(user_id: UUID, database: Session) -> list[BankAccountResponse]:
    company = _get_company_for_user(database, user_id)

    accounts = repo.list_bank_accounts(database, company.id)

    return [_to_response(account) for account in accounts]


def create_bank_account_service(
    user_id: UUID, data: CreateBankAccountRequest, database: Session
) -> BankAccountResponse:
    company = _get_company_for_user(database, user_id)

    try:
        existing = repo.list_bank_accounts(database, company.id)

        is_default = data.isDefault or len(existing) == 0

        if is_default:
            repo.clear_default(database, company.id)

        bank_account = CompanyBankAccount(
            company_id=company.id,
            account_holder=data.accountHolder,
            document_number=data.documentNumber,
            bank_name=data.bankName,
            account_type=data.accountType,
            account_number=data.accountNumber,
            is_default=is_default,
        )

        repo.create_bank_account(database, bank_account)

        database.commit()
        database.refresh(bank_account)

        return _to_response(bank_account)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def update_bank_account_service(
    user_id: UUID, bank_account_id: UUID, data: UpdateBankAccountRequest, database: Session
) -> BankAccountResponse:
    company = _get_company_for_user(database, user_id)

    try:
        bank_account = repo.get_bank_account_owned(database, company.id, bank_account_id)

        if not bank_account:
            api_error(404, ErrorCodes.BANK_ACCOUNT_NOT_FOUND, "Cuenta bancaria no encontrada.")

        if data.accountHolder is not None:
            bank_account.account_holder = data.accountHolder

        if data.documentNumber is not None:
            bank_account.document_number = data.documentNumber

        if data.bankName is not None:
            bank_account.bank_name = data.bankName

        if data.accountType is not None:
            bank_account.account_type = data.accountType

        if data.accountNumber is not None:
            bank_account.account_number = data.accountNumber

        if data.isDefault is True:
            repo.clear_default(database, company.id)
            bank_account.is_default = True
        elif data.isDefault is False and bank_account.is_default:
            pass

        database.commit()
        database.refresh(bank_account)

        return _to_response(bank_account)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def delete_bank_account_service(
    user_id: UUID, bank_account_id: UUID, database: Session
) -> dict:
    company = _get_company_for_user(database, user_id)

    try:
        bank_account = repo.get_bank_account_owned(database, company.id, bank_account_id)

        if not bank_account:
            api_error(404, ErrorCodes.BANK_ACCOUNT_NOT_FOUND, "Cuenta bancaria no encontrada.")

        if repo.is_bank_account_referenced_by_payout(database, bank_account.id):
            api_error(
                409,
                ErrorCodes.BANK_ACCOUNT_IN_USE,
                "Esta cuenta ya tiene liquidaciones asociadas y no se puede eliminar.",
            )

        was_default = bank_account.is_default

        repo.delete_bank_account(database, bank_account)
        database.flush()

        if was_default:
            remaining = repo.list_bank_accounts(database, company.id)

            if remaining:
                remaining[0].is_default = True

        database.commit()

        return {"message": "Cuenta bancaria eliminada correctamente."}

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
