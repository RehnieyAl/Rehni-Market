"""Ruta para que el comprador reporte un producto (solo rol user)."""

from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dbconexion import get_db
from app.core.AuthDependencies import AuthContext, require_role

from app.schemas.SchemaCommerce.SchemaReport import (
    CreateReportRequest,
    ReportResponse,
)

from app.services.commerce.ReportService import create_report_service
from app.services.NasService import NasService, get_nas_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportResponse)
def create_report(
    current: Annotated[AuthContext, Depends(require_role("user"))],
    data: CreateReportRequest = Depends(CreateReportRequest.as_form),
    evidences: list[UploadFile] = File(default=[]),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db, scope="function"),
):
    return create_report_service(
        current.user_id,
        data,
        database,
        nas=nas,
        evidences=evidences,
    )
