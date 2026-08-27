
from fastapi import (
    APIRouter,
    Request,
    Depends,
    Query,
    UploadFile,
    File,
)

from sqlalchemy.orm import Session

from app.database.Connection import get_db

from uuid import UUID

from app.services.NasService import NasService, get_nas_service


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
    change_catalog_status_service,
    delete_catalog_service,
)


# =========================================================
# SERVICES - SPECIFICATIONS
# =========================================================

from app.services.DashboardService.admin.SpecificationService import (
    get_specifications_service,
    create_specification_service,
    update_specification_service,
    delete_specification_service,
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
# SERVICES - ADVERTISEMENTS
# =========================================================

from app.services.DashboardService.admin.AdvertisementService import (
    get_advertisements_service,
    get_advertisement_service,
    create_advertisement_service,
    update_advertisement_service,
    change_advertisement_status_service,
    delete_advertisement_service,
)


# =========================================================
# SCHEMAS - COMPANY
# =========================================================

from app.schemas.SchemaDashboard.admin.company import (
    UpdateCertificateStatusRequest,
    UpdateCompanyStatusRequest,
    UpdateCompanyStatusResponse,
    AdminCompaniesPaginatedResponse,
)


# =========================================================
# SCHEMAS - CATALOG
# =========================================================

from app.schemas.SchemaDashboard.SchemaCatalog import (
    CreateCatalogRequest,
    UpdateCatalogRequest,
    CatalogResponse,
    CatalogStatusRequest,
    CreateSpecificationRequest,
    UpdateSpecificationRequest,
    SpecificationResponse,
)


# =========================================================
# SCHEMAS - COLOR
# =========================================================

from app.schemas.SchemaDashboard.SchemaColor import (
    CreateColorRequest,
    UpdateColorRequest,
)


# =========================================================
# SCHEMAS - ADVERTISEMENTS
# =========================================================

from app.schemas.SchemaDashboard.SchemaAdvertisement import (
    CreateAdvertisementRequest,
    UpdateAdvertisementRequest,
    AdvertisementStatusRequest,
    AdvertisementResponse,
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
    "/dashboard/company/status/{company_id}",
    response_model=UpdateCompanyStatusResponse,
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
        reason=data.reason,
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
    data: CreateCatalogRequest = Depends(CreateCatalogRequest.as_form),
    # Igual que create_advertisement (ver AdvertisementRouter): opcional,
    # una categoría puede crearse sin imagen y agregársela después.
    image: UploadFile | None = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):

    return create_catalog_service(
        database,
        data,
        image,
        nas,
    )


@router.put(
    "/dashboard/update-catalogs/{catalog_id}",
    response_model=CatalogResponse,
)
def update_catalog(
    catalog_id: UUID,
    data: UpdateCatalogRequest = Depends(UpdateCatalogRequest.as_form),
    image: UploadFile | None = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):

    return update_catalog_service(
        database,
        catalog_id,
        data,
        image,
        nas,
    )


@router.patch(
    "/dashboard/change-status-catalog/{catalog_id}",
    response_model=CatalogResponse,
)
def change_catalog_status(
    catalog_id: UUID,
    data: CatalogStatusRequest,
    database: Session = Depends(get_db),
):

    return change_catalog_status_service(
        database,
        catalog_id,
        data.is_active,
    )


@router.delete(
    "/dashboard/delete-catalogs/{catalog_id}"
)
def delete_catalog(
    catalog_id: UUID,
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):

    return delete_catalog_service(
        database,
        catalog_id,
        nas,
    )


# =========================================================
# SPECIFICATIONS (por catalogo)
# =========================================================


@router.get(
    "/dashboard/get-specifications/{catalog_id}",
    response_model=list[SpecificationResponse],
)
def get_specifications(
    catalog_id: UUID,
    database: Session = Depends(get_db),
):

    return get_specifications_service(
        database=database,
        catalog_id=catalog_id,
    )


@router.post(
    "/dashboard/created-specifications/{catalog_id}",
    response_model=SpecificationResponse,
)
def create_specification(
    catalog_id: UUID,
    data: CreateSpecificationRequest,
    database: Session = Depends(get_db),
):

    return create_specification_service(
        database=database,
        catalog_id=catalog_id,
        data=data,
    )


@router.put(
    "/dashboard/update-specifications/{specification_id}",
    response_model=SpecificationResponse,
)
def update_specification(
    specification_id: UUID,
    data: UpdateSpecificationRequest,
    database: Session = Depends(get_db),
):

    return update_specification_service(
        database=database,
        specification_id=specification_id,
        data=data,
    )


@router.delete(
    "/dashboard/delete-specifications/{specification_id}"
)
def delete_specification(
    specification_id: UUID,
    database: Session = Depends(get_db),
):

    return delete_specification_service(
        database=database,
        specification_id=specification_id,
    )



@router.get(
    "/dashboard/get-advertisements",
    response_model=list[AdvertisementResponse],
)
def get_advertisements(
    database: Session = Depends(get_db),
):
    return get_advertisements_service(
        database=database,
    )


@router.get(
    "/dashboard/get-advertisement/{advertisement_id}",
    response_model=AdvertisementResponse,
)
def get_advertisement(
    advertisement_id: UUID,
    database: Session = Depends(get_db),
):
    return get_advertisement_service(
        database=database,
        advertisement_id=advertisement_id,
    )


@router.post(
    "/dashboard/create-advertisement",
    response_model=AdvertisementResponse,
)
def create_advertisement(
    data: CreateAdvertisementRequest = Depends(
        CreateAdvertisementRequest.as_form
    ),

    # Imagen obligatoria para escritorio
    image: UploadFile = File(...),

    # Imagen opcional para móvil
    mobile_image: UploadFile | None = File(None),

    nas: NasService = Depends(get_nas_service),

    database: Session = Depends(get_db),
):
    return create_advertisement_service(
        database=database,
        data=data,
        image=image,
        mobile_image=mobile_image,
        nas=nas,
    )


@router.patch(
    "/dashboard/update-advertisement/{advertisement_id}",
    response_model=AdvertisementResponse,
)
def update_advertisement(
    advertisement_id: UUID,

    data: UpdateAdvertisementRequest = Depends(
        UpdateAdvertisementRequest.as_form
    ),

    # Nueva imagen desktop opcional
    image: UploadFile | None = File(None),

    # Nueva imagen móvil opcional
    mobile_image: UploadFile | None = File(None),

    nas: NasService = Depends(get_nas_service),

    database: Session = Depends(get_db),
):
    return update_advertisement_service(
        database=database,
        advertisement_id=advertisement_id,
        data=data,
        image=image,
        mobile_image=mobile_image,
        nas=nas,
    )


@router.patch(
    "/dashboard/change-status-advertisement/{advertisement_id}",
    response_model=AdvertisementResponse,
)
def change_advertisement_status(
    advertisement_id: UUID,

    data: AdvertisementStatusRequest,

    database: Session = Depends(get_db),
):
    return change_advertisement_status_service(
        database=database,
        advertisement_id=advertisement_id,
        is_active=data.is_active,
    )


@router.delete(
    "/dashboard/delete-advertisement/{advertisement_id}"
)
def delete_advertisement(
    advertisement_id: UUID,

    nas: NasService = Depends(get_nas_service),

    database: Session = Depends(get_db),
):
    return delete_advertisement_service(
        database=database,
        advertisement_id=advertisement_id,
        nas=nas,
    )



