from fastapi import APIRouter, Request,Depends, UploadFile, File, Form, Body, Query
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from uuid import UUID

from app.services.DashboardService.company.Products import (
    create_product_service,
    get_product_detail_service,
    update_product_service,
    delete_product_service,
    change_product_status_service
)

from app.services.DashboardService.company.Dashboard import (
    company_dashboard_me_service,
    company_dashboard_my_profile_service,
    company_dashboard_upgrade_my_profile_service,
    company_dasboard_upgrade_my_photo_and_banner_profile,
    company_dashboard_get_my_products,
    company_dashboard_products_summary_service,
    replace_company_certificate_service,
)

from app.services.DashboardService.company.Variants import (
    list_variants_service,
    get_variant_detail_service,
    create_variant_service,
    update_variant_service,
    delete_variant_service,
    list_variant_images_service,
    upload_variant_images_service,
    delete_variant_image_service,
    set_main_variant_image_service,
    list_variant_attribute_values_service,
    set_variant_attribute_values_service,
)

from app.services.authentication.CertificateUpdateService import (
    update_certificate_with_credentials_service,
)

from app.schemas.SchemaDashboard.ShemaCompany import (
    UpdateInformationCompanyRequest,
    CompanyCertificateUpdateResponse,
)
from app.schemas.SchemaDashboard.SchemaProduct import (
    ProductStatusRequest,
    ProductDetailResponse,
    UpdateProductRequest,
)
from app.schemas.SchemaDashboard.SchemaVariant import (
    CreateVariantRequest,
    UpdateVariantRequest,
    VariantAttributeValueItem,
    VariantResponse,
    VariantDetailResponse,
    VariantImageResponse,
    VariantAttributeValuePair,
)
from app.services.NasService import NasService, get_nas_service

from app.services.commerce.OrderService import (
    list_company_orders_service,
    get_company_order_detail_service,
    get_company_order_status_counts_service,
    update_company_order_status_service,
    set_company_order_shipping_service,
)
from app.services.publicService.ShippingCarriers import (
    get_active_shipping_carriers_service,
)
from app.services.commerce.ReturnService import (
    list_company_returns_service,
    get_company_return_detail_service,
    decide_return_service,
)
from app.schemas.SchemaCommerce.SchemaReturn import (
    ReturnDecisionRequest,
    ReturnRequestResponse,
    ReturnsPaginatedResponse,
)
from app.schemas.SchemaCommerce.SchemaOrder import (
    OrderResponse,
    OrdersPaginatedResponse,
    OrderStatusCountsResponse,
    UpdateOrderStatusRequest,
    SetOrderShippingRequest,
)
from app.schemas.SchemaDashboard.SchemaShippingCarrier import ShippingCarrierResponse

router = APIRouter(
    prefix=("/company"),
    tags=["company"]
)


@router.get("/dashboard/me")
def dashboard(request: Request,database: Session = Depends(get_db)):

    user_id = request.state.user_id
    
    return company_dashboard_me_service(
        user_id= user_id,
        database=database
    )

@router.get("/dashboard/my-profile")
def get_info_company(request:Request, database: Session =Depends(get_db)):
    user_id = request.state.user_id
    return company_dashboard_my_profile_service(user_id, database)

@router.patch("/dashboard/upgrade-my-profile")
def upgrade_info_company_profile(request: Request, upgrade_profile: UpdateInformationCompanyRequest,database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return company_dashboard_upgrade_my_profile_service(user_id, upgrade_profile, database)

@router.patch("/dashboard/patch-media-logo-banner")
def patch_media(
    request: Request,
    photo_profile: UploadFile = File(None),
    banner_profile: UploadFile = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db)
):

    user_id = request.state.user_id

    return company_dasboard_upgrade_my_photo_and_banner_profile(
        user_id=user_id,
        nas=nas,
        database=database,
        photo_profile=photo_profile,
        banner_profile=banner_profile
    )

@router.put("/certificate")
def replace_certificate(
    request: Request,
    certificate: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    """Reemplaza el certificado de la empresa autenticada (request.state.user_id, el
    mismo JWT del login normal). Solo permitido mientras el certificado esté
    NEEDS_UPDATE (el admin lo marcó como inválido). REJECTED (rechazo terminal) ->
    409 COMPANY_REJECTED. Ver replace_company_certificate_service."""

    user_id = request.state.user_id

    return replace_company_certificate_service(
        user_id=user_id,
        certificate=certificate,
        nas=nas,
        database=database,
    )


@router.post("/certificate/update", response_model=CompanyCertificateUpdateResponse)
def update_certificate_with_credentials(
    email: str = Form(...),
    password: str = Form(...),
    certificate: UploadFile = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    """Actualiza el certificado de una empresa cuyo certificado fue marcado como
    **inválido** (`NEEDS_UPDATE`) identificándola por **correo + contraseña**
    (multipart/form-data). Endpoint público: NO usa JWT, no emite tokens ni abre
    sesión, no guarda las credenciales y no acepta `company_id` (la empresa se
    resuelve solo desde las credenciales). En caso correcto:
    `NEEDS_UPDATE -> PENDING`, `rejection_reason -> NULL`, sin aprobación automática.
    Una empresa con rechazo terminal (`REJECTED`) -> `409 COMPANY_REJECTED`.
    Es un flujo independiente del login normal del dashboard."""

    update_certificate_with_credentials_service(
        email=email,
        password=password,
        certificate=certificate,
        nas=nas,
        database=database,
    )

    return CompanyCertificateUpdateResponse(
        message="Certificado actualizado correctamente. Tu empresa volverá a revisión.",
        certificateStatus="pending",
    )


@router.post("/dashboard/create-product")
def create_product(
    request: Request,
    nameProduct: str = Form(...),
    catalogId: str = Form(...),
    priceProduct: float = Form(..., ge=0),
    stockProduct: int = Form(..., ge=0),
    descripcionProduct: str = Form(...),
    technicalSpecProduct: str = Form(...),
    appliesTax: bool = Form(True),
    imagesProduct: list[UploadFile] = File(None),
    mainColorId: str = Form(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db)

):
    user_id = request.state.user_id

    return create_product_service(
        user_id=user_id,
        nameProduct=nameProduct,
        catalogId=catalogId,
        priceProduct=priceProduct,
        stockProduct=stockProduct,
        descripcionProduct=descripcionProduct,
        technicalSpecProduct=technicalSpecProduct,
        appliesTax=appliesTax,
        imagesProduct=imagesProduct,
        mainColorId=mainColorId,
        nas=nas,
        database=database
    )

@router.get("/dashboard/get-my-products")
def get_my_product( 
    request: Request,
    search: str = "", 
    page: int =  1, 
    limit: int = 5,
    database: Session = Depends(get_db)
):
    user_id = request.state.user_id

    return company_dashboard_get_my_products(
        user_id,
        search=search,
        page=page,
        limit= limit,
        database=database
    )

@router.get("/dashboard/products-summary")
def get_products_summary(request: Request, database: Session = Depends(get_db)):

    user_id = request.state.user_id

    return company_dashboard_products_summary_service(
        user_id=user_id,
        database=database,
    )


@router.get("/dashboard/get-my-product/{product_id}", response_model=ProductDetailResponse)
def get_my_product_detail(
    request: Request,
    product_id: UUID,
    database: Session = Depends(get_db),
):

    user_id = request.state.user_id

    return get_product_detail_service(
        user_id=user_id,
        product_id=product_id,
        database=database,
    )


@router.patch("/dashboard/update-my-product/{idProduct}")
def upgrade_my_product(
    request: Request,
    idProduct: UUID,
    data: UpdateProductRequest = Depends(UpdateProductRequest.as_form),
    imagesProduct: list[UploadFile] = File(None),
    imagesToDeleted: list[str] | None = Form(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):

    user_id = request.state.user_id

    return update_product_service(
        user_id=user_id,
        product_id=idProduct,
        data=data,
        imagesProduct=imagesProduct,
        imagesToDeleted=imagesToDeleted,
        nas=nas,
        database=database
    )


@router.patch("/dashboard/change-status-my-product/{product_id}")
def change_status_my_product(
    request: Request,
    product_id: UUID,
    data: ProductStatusRequest, 
    database: Session = Depends(get_db)):

    user_id = request.state.user_id

    return change_product_status_service(
        user_id=user_id,
        product_id=product_id,
        is_active=data.is_active,
        database=database
    )

@router.delete("/dashboard/delete-my-product/{product_id}")
def delete_my_product(request: Request,product_id: UUID, database: Session = Depends(get_db)):

    user_id = request.state.user_id
    return delete_product_service(
        user_id=user_id,
        product_id=product_id,
        database=database
    )


@router.post("/dashboard/products/{product_id}/variants", response_model=VariantDetailResponse)
def create_variant(
    request: Request,
    product_id: UUID,
    data: CreateVariantRequest,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return create_variant_service(
        user_id=user_id,
        product_id=product_id,
        data=data,
        database=database,
    )


@router.get("/dashboard/products/{product_id}/variants", response_model=list[VariantResponse])
def list_variants(
    request: Request,
    product_id: UUID,
    include_deleted: bool = Query(default=False),
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return list_variants_service(
        user_id=user_id,
        product_id=product_id,
        database=database,
        include_deleted=include_deleted,
    )


@router.get("/dashboard/products/{product_id}/variants/{variant_id}", response_model=VariantDetailResponse)
def get_variant_detail(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return get_variant_detail_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        database=database,
    )


@router.patch("/dashboard/products/{product_id}/variants/{variant_id}", response_model=VariantDetailResponse)
def update_variant(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    data: UpdateVariantRequest,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return update_variant_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        data=data,
        database=database,
    )


@router.delete("/dashboard/products/{product_id}/variants/{variant_id}")
def delete_variant(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return delete_variant_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        database=database,
    )


@router.get(
    "/dashboard/products/{product_id}/variants/{variant_id}/images",
    response_model=list[VariantImageResponse],
)
def list_variant_images(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return list_variant_images_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        database=database,
    )


@router.post(
    "/dashboard/products/{product_id}/variants/{variant_id}/images",
    response_model=VariantDetailResponse,
)
def upload_variant_images(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    imagesVariant: list[UploadFile] = File(...),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return upload_variant_images_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        imagesVariant=imagesVariant,
        nas=nas,
        database=database,
    )


@router.delete(
    "/dashboard/products/{product_id}/variants/{variant_id}/images/{image_id}",
    response_model=VariantDetailResponse,
)
def delete_variant_image(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    image_id: UUID,
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return delete_variant_image_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        image_id=image_id,
        nas=nas,
        database=database,
    )


@router.patch(
    "/dashboard/products/{product_id}/variants/{variant_id}/images/{image_id}/main",
    response_model=VariantDetailResponse,
)
def set_main_variant_image(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    image_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return set_main_variant_image_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        image_id=image_id,
        database=database,
    )


@router.get(
    "/dashboard/products/{product_id}/variants/{variant_id}/attribute-values",
    response_model=list[VariantAttributeValuePair],
)
def list_variant_attribute_values(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return list_variant_attribute_values_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        database=database,
    )


@router.put(
    "/dashboard/products/{product_id}/variants/{variant_id}/attribute-values",
    response_model=VariantDetailResponse,
)
def set_variant_attribute_values(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    data: list[VariantAttributeValueItem],
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return set_variant_attribute_values_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        items=data,
        database=database,
    )


@router.get("/dashboard/orders", response_model=OrdersPaginatedResponse)
def get_company_orders(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: list[str] | None = Query(None),
    search: str | None = Query(None),
    database: Session = Depends(get_db),
):
    return list_company_orders_service(
        user_id=request.state.user_id,
        database=database,
        page=page,
        limit=limit,
        statuses=status,
        search=search,
    )


@router.get("/dashboard/orders/status-counts", response_model=OrderStatusCountsResponse)
def get_company_orders_status_counts(request: Request, database: Session = Depends(get_db)):
    return get_company_order_status_counts_service(
        user_id=request.state.user_id,
        database=database,
    )


@router.get("/dashboard/orders/{order_id}", response_model=OrderResponse)
def get_company_order_detail(
    request: Request, order_id: UUID, database: Session = Depends(get_db)
):
    return get_company_order_detail_service(
        user_id=request.state.user_id,
        order_id=order_id,
        database=database,
    )


@router.patch("/dashboard/orders/{order_id}/status", response_model=OrderResponse)
def update_company_order_status(
    request: Request,
    order_id: UUID,
    data: UpdateOrderStatusRequest,
    database: Session = Depends(get_db),
):
    return update_company_order_status_service(
        user_id=request.state.user_id,
        order_id=order_id,
        new_status=data.status,
        database=database,
    )


@router.get("/dashboard/shipping-carriers", response_model=list[ShippingCarrierResponse])
def get_company_shipping_carriers(request: Request, database: Session = Depends(get_db)):
    return get_active_shipping_carriers_service(database)


@router.get("/dashboard/returns", response_model=ReturnsPaginatedResponse)
def get_company_returns(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: str | None = Query(None),
    search: str | None = Query(None),
    database: Session = Depends(get_db),
):
    """Solicitudes de devolución de los pedidos de ESTA empresa (scope por company_id)."""

    return list_company_returns_service(
        user_id=request.state.user_id,
        database=database,
        page=page,
        limit=limit,
        status=status,
        search=search,
    )


@router.get("/dashboard/returns/{return_id}", response_model=ReturnRequestResponse)
def get_company_return_detail(
    request: Request, return_id: UUID, database: Session = Depends(get_db)
):
    return get_company_return_detail_service(
        user_id=request.state.user_id,
        return_id=return_id,
        database=database,
    )


@router.patch("/dashboard/returns/{return_id}", response_model=ReturnRequestResponse)
def decide_company_return(
    request: Request,
    return_id: UUID,
    data: ReturnDecisionRequest,
    database: Session = Depends(get_db),
):
    """La empresa aprueba o rechaza la devolución. Al aprobar se reintegran las RehniCoin
    al comprador. Al rechazar, `reason` es obligatorio."""

    return decide_return_service(
        user_id=request.state.user_id,
        return_id=return_id,
        data=data,
        database=database,
    )


@router.patch("/dashboard/orders/{order_id}/shipping", response_model=OrderResponse)
def set_company_order_shipping(
    request: Request,
    order_id: UUID,
    data: SetOrderShippingRequest,
    database: Session = Depends(get_db),
):
    return set_company_order_shipping_service(
        user_id=request.state.user_id,
        order_id=order_id,
        data=data,
        database=database,
    )
