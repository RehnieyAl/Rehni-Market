from fastapi import APIRouter, Request, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaReport import (
    CreateReportRequest,
    ReportResponse,
)

from app.services.commerce.ReportService import create_report_service
from app.services.NasService import NasService, get_nas_service

# Creación pública (usuario autenticado) de reportes de producto/empresa
# (ver ALCANCE > Reportes). La gestión (listar/ver detalle/cambiar
# estado) vive aparte, en AdminReportRouter.py, bajo /admin/reports - no
# es la misma audiencia ni el mismo nivel de acceso.
router = APIRouter(prefix="/reports", tags=["reports"])


# multipart/form-data (no JSON): las evidencias viajan como archivos en
# el mismo request (ver ALCANCE > Reportes - EVIDENCIAS/IMÁGENES),
# mismo patrón que create_product/create_advertisement (ver
# CompanyRouter.py/AdminCompanyRouters.py). `evidences` es opcional -
# un reporte sin ninguna imagen es igual de válido.
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
