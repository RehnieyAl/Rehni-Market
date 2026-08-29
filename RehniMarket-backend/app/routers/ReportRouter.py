from fastapi import APIRouter, Request, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaReport import (
    CreateReportRequest,
    ReportResponse,
)

from app.services.commerce.ReportService import create_report_service
from app.services.NasService import NasService, get_nas_service

# Creación de reportes por un usuario autenticado; la gestión vive en AdminReportRouter.py.
router = APIRouter(prefix="/reports", tags=["reports"])


# multipart/form-data: las evidencias viajan como archivos; `evidences` es opcional.
@router.post("", response_model=ReportResponse)
def create_report(
    request: Request,
    data: CreateReportRequest = Depends(CreateReportRequest.as_form),
    evidences: list[UploadFile] = File(default=[]),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    return create_report_service(
        request.state.user_id,
        data,
        database,
        nas=nas,
        evidences=evidences,
    )
