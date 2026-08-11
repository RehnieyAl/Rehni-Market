
from fastapi import (
    APIRouter,
    Request,
    Depends,
    Query,
)

from sqlalchemy.orm import Session

from app.database.Connection import get_db

from uuid import UUID


# =========================================================
# SERVICES - COLORS
# =========================================================

from app.services.DashboardService.admin.colorsService import (
    get_colors_service,
    create_color_service,
    update_color_service,
    delete_color_service,
)


# =========================================================
# SERVICES - CATALOG
# =========================================================

from app.services.DashboardService.admin.CatalogService import (
    get_catalogs_service,
    create_catalog_service,
    update_catalog_service,
    delete_catalog_service,
)


# =========================================================
# SERVICES - COMPANY
# =========================================================

from app.services.DashboardService.admin.CompanyService import (
    get_all_companies_service,
    get_admin_company_service,
    update_certificate_status_service,
    update_company_status_service,
)


# =========================================================
# SCHEMAS - COMPANY
# =========================================================

from app.schemas.SchemaDashboard.admin.company import (
    UpdateCertificateStatusRequest,
    UpdateCompanyStatusRequest,
    AdminCompaniesPaginatedResponse,
)


# =========================================================
# SCHEMAS - CATALOG
# =========================================================

from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateCatalogRequest,
    UpdateCatalogRequest,
    CatalogResponse,
)


# =========================================================
# SCHEMAS - COLOR
# =========================================================

from app.schemas.SchemaDashboard.SchemaColor import (
    CreateColorRequest,
    UpdateColorRequest,
)


# =========================================================
# ROUTER PRINCIPAL
# =========================================================

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


# =========================================================
# COMPANIES
# =========================================================


@router.get(
    "/dashboard/get-companies",
    response_model=AdminCompaniesPaginatedResponse,
)
def get_company(
    search: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),
    cursor: str | None = Query(None),
    database: Session = Depends(get_db),
):

    return get_all_companies_service(
        database=database,
        limit=limit,
        cursor=cursor,
        search=search,
        status=status,
    )


# =========================================================
# GET COMPANY BY ID
# =========================================================


@router.get(
    "/dashboard/get-company/{company_id}"
)
def get_admin_company(
    company_id: UUID,
    database: Session = Depends(get_db),
):

    return get_admin_company_service(
        company_id=company_id,
        database=database,
    )


# =========================================================
# UPDATE CERTIFICATE STATUS
# =========================================================


@router.patch(
    "/dashboard/companies/certificate/status/{company_id}"
)
def update_certificate_status(
    request: Request,
    company_id: UUID,
    data: UpdateCertificateStatusRequest,
    database: Session = Depends(get_db),
):

    admin_id = request.state.user_id

    return update_certificate_status_service(
        company_id=company_id,
        status=data.status,
        database=database,
        admin_id=admin_id,
    )


# =========================================================
# UPDATE COMPANY STATUS
# =========================================================


@router.patch(
    "/dashboard/company/status/{company_id}"
)
def update_company_status(
    request: Request,
    company_id: UUID,
    data: UpdateCompanyStatusRequest,
    database: Session = Depends(get_db),
):

    admin_id = request.state.user_id

    return update_company_status_service(
        company_id=company_id,
        status=data.status,
        database=database,
        admin_id=admin_id,
    )


# =========================================================
# COLORS
# =========================================================


@router.get(
    "/dashboard/get-colors"
)
def get_colors(
    database: Session = Depends(get_db),
):

    return get_colors_service(
        database=database,
    )


@router.post(
    "/dashboard/create-color"
)
def create_color(
    data: CreateColorRequest,
    database: Session = Depends(get_db),
):

    return create_color_service(
        database=database,
        data=data,
    )


@router.put(
    "/dashboard/update-color/{color_id}"
)
def update_color(
    color_id: UUID,
    data: UpdateColorRequest,
    database: Session = Depends(get_db),
):

    return update_color_service(
        database=database,
        color_id=color_id,
        data=data,
    )


@router.delete(
    "/dashboard/delete-color/{color_id}"
)
def delete_color(
    color_id: UUID,
    database: Session = Depends(get_db),
):

    return delete_color_service(
        database=database,
        color_id=color_id,
    )


# =========================================================
# CATALOGS
# =========================================================


@router.get(
    "/dashboard/get-catalogs",
    response_model=list[CatalogResponse],
)
def get_catalogs(
    database: Session = Depends(get_db),
):

    return get_catalogs_service(
        database
    )


@router.post(
    "/dashboard/created-catalogs",
    response_model=CatalogResponse,
)
def create_catalog(
    data: CreateCatalogRequest,
    database: Session = Depends(get_db),
):

    return create_catalog_service(
        database,
        data,
    )


@router.put(
    "/dashboard/update-catalogs/{catalog_id}",
    response_model=CatalogResponse,
)
def update_catalog(
    catalog_id: UUID,
    data: UpdateCatalogRequest,
    database: Session = Depends(get_db),
):

    return update_catalog_service(
        database,
        catalog_id,
        data,
    )


@router.delete(
    "/dashboard/delete-catalogs/{catalog_id}"
)
def delete_catalog(
    catalog_id: UUID,
    database: Session = Depends(get_db),
):

    return delete_catalog_service(
        database,
        catalog_id,
    )



