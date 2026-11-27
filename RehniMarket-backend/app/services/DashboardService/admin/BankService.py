"""Catálogo de bancos: el administrador los registra, edita, activa o desactiva y gestiona su logo en MinIO;
las empresas solo consultan los activos. No hay borrado físico: un banco se desactiva."""

import logging
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.models.ModelBank import Bank, normalize_bank_name
from app.repository import BankRepository as repo
from app.schemas.SchemaDashboard.SchemaBank import (
    AdminBankResponse,
    BankOptionResponse,
    CreateBankRequest,
    UpdateBankRequest,
)
from app.services.NasService import NasService, build_media_url, require_stored

logger = logging.getLogger(__name__)

BANK_NAS_PATH = "banks/"


def bank_logo_url(bank: Bank | None) -> str | None:
    return build_media_url(bank.logo) if bank and bank.logo else None


def _to_admin_response(bank: Bank, accounts_count: int) -> AdminBankResponse:
    return AdminBankResponse(
        id=bank.id,
        name=bank.name,
        logoUrl=bank_logo_url(bank),
        isActive=bank.is_active,
        accountsCount=accounts_count,
        createdAt=bank.created_at,
        updatedAt=bank.updated_at,
    )


def _ensure_unique_name(database: Session, normalized_name: str, current_id: UUID | None = None) -> None:
    existing = repo.get_bank_by_normalized_name(database, normalized_name)
    if existing and existing.id != current_id:
        api_error(409, ErrorCodes.BANK_ALREADY_EXISTS, "Ya existe un banco con ese nombre.")


def list_banks_admin_service(database: Session) -> list[AdminBankResponse]:
    counts = repo.count_accounts_by_bank(database)
    return [_to_admin_response(bank, counts.get(bank.id, 0)) for bank in repo.list_banks(database)]


def list_active_banks_service(database: Session) -> list[BankOptionResponse]:
    return [
        BankOptionResponse(id=bank.id, name=bank.name, logoUrl=bank_logo_url(bank))
        for bank in repo.list_banks(database, active_only=True)
    ]


def create_bank_service(
    database: Session, data: CreateBankRequest, logo: UploadFile | None, nas: NasService
) -> AdminBankResponse:
    normalized = normalize_bank_name(data.name)
    _ensure_unique_name(database, normalized)

    try:
        bank = Bank(
            name=data.name,
            normalized_name=normalized,
            is_active=data.is_active,
            logo=require_stored(nas.upload_file(logo, BANK_NAS_PATH)) if logo else None,
        )
        database.add(bank)
        database.flush()

        linked = repo.link_legacy_accounts(database, bank)
        database.commit()
        database.refresh(bank)

        return _to_admin_response(bank, linked)

    except HTTPException:
        database.rollback()
        raise

    except IntegrityError:
        # Otro administrador registró el mismo nombre entre la validación y el commit.
        database.rollback()
        api_error(409, ErrorCodes.BANK_ALREADY_EXISTS, "Ya existe un banco con ese nombre.")

    except Exception:
        database.rollback()
        logger.exception("Error inesperado al registrar un banco")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def update_bank_service(
    database: Session, bank_id: UUID, data: UpdateBankRequest, logo: UploadFile | None, nas: NasService
) -> AdminBankResponse:
    bank = repo.get_bank(database, bank_id)

    if not bank:
        api_error(404, ErrorCodes.BANK_NOT_FOUND, "Banco no encontrado.")

    previous_logo = bank.logo

    try:
        if data.name is not None and data.name != bank.name:
            normalized = normalize_bank_name(data.name)
            _ensure_unique_name(database, normalized, bank.id)
            bank.name = data.name
            bank.normalized_name = normalized
            repo.rename_linked_accounts(database, bank)

        if data.is_active is not None:
            bank.is_active = data.is_active

        if logo:
            bank.logo = require_stored(nas.upload_file(logo, BANK_NAS_PATH))

        database.commit()
        database.refresh(bank)

    except HTTPException:
        database.rollback()
        raise

    except IntegrityError:
        database.rollback()
        api_error(409, ErrorCodes.BANK_ALREADY_EXISTS, "Ya existe un banco con ese nombre.")

    except Exception:
        database.rollback()
        logger.exception("Error inesperado al actualizar el banco %s", bank_id)
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")

    # El logo anterior se borra solo cuando el nuevo ya quedó guardado; si falla, queda huérfano en MinIO
    # (no afecta a nadie) en lugar de dejar al banco sin imagen.
    if logo and previous_logo and previous_logo != bank.logo:
        nas.delete_file(previous_logo.removeprefix("uploads/"))

    counts = repo.count_accounts_by_bank(database)
    return _to_admin_response(bank, counts.get(bank.id, 0))
