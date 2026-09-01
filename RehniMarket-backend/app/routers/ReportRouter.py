from fastapi import APIRouter, Request, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaReport import (
    CreateReportRequest,
    ReportResponse,
)

from app.services.commerce.ReportService import create_report_service
from app.services.NasService import NasService, get_nas_service

router = APIRouter(prefix="/reports", tags=["reports"])


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
