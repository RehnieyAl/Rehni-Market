from fastapi import APIRouter, Request,Depends, UploadFile, File, Form, Body
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
    company_dashboard_get_my_products
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
    list_variant_specifications_service,
    create_variant_specification_service,
    update_variant_specification_service,
    delete_variant_specification_service,
)

from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest
from app.schemas.SchemaDashboard.SchemaProduct import (
    ProductStatusRequest,
    ProductDetailResponse,
    UpdateProductRequest,
)
from app.schemas.SchemaDashboard.SchemaVariant import (
    CreateVariantRequest,
    UpdateVariantRequest,
    VariantResponse,
    VariantDetailResponse,
    VariantImageResponse,
    VariantSpecificationResponse,
    VariantSpecificationRequest,
    VariantSpecificationUpdateRequest,
)
from app.services.NasService import NasService, get_nas_service

router = APIRouter(
    prefix=("/company"),
    tags=["company"]
)

# ==============================
# ROUTERS DASHBOARD
# ==============================

@router.get("/dashboard/me")
def dashboard(request: Request,database: Session = Depends(get_db)):

    user_id = request.state.user_id
    
    return company_dashboard_me_service(
        user_id= user_id,
        database=database
    )

@router.get("/dashboard/my-profile")
def get_info_company(request:Request, database: Session =Depends(get_db)):
    #Request del middleware
    user_id = request.state.user_id
    return company_dashboard_my_profile_service(user_id, database)

# patch solo permite actualizar una o varias informacion, es opcional por el usuario.
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

@router.post("/dashboard/create-product")
def create_product(
    request: Request,
    nameProduct: str = Form(...),
    catalogId: str = Form(...),
    priceProduct: float = Form(...),
    stockProduct: int = Form(...),
    descripcionProduct: str = Form(...),
    technicalSpecProduct: str = Form(...),
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
        imagesProduct=imagesProduct,
        mainColorId=mainColorId,
        nas=nas,
        database=database
    )

# Para atraer productos de la empresa
@router.get("/dashboard/get-my-products")
def get_my_product( 
    request: Request,
    search: str = "", 
    page: int =  1, 
    limit: int = 5,
    database: Session = Depends(get_db)
):
    print("accediendo a endpoint")
    user_id = request.state.user_id

    return company_dashboard_get_my_products(
        user_id,
        search=search,
        page=page,
        limit= limit,
        database=database
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

    print("userid", user_id)
    
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


# ==============================
# ROUTERS VARIANTES
# ==============================
# Ownership (user_id -> company -> product -> variant) se valida siempre
# dentro del service, nunca aqui - el router solo pasa el user_id del
# request al service (ver app/services/DashboardService/company/Variants.py).

@router.post("/dashboard/products/{product_id}/variants", response_model=VariantDetailResponse)
def create_variant(
    request: Request,
    product_id: UUID,
    data: CreateVariantRequest = Depends(CreateVariantRequest.as_form),
    imagesVariant: list[UploadFile] = File(None),
    nas: NasService = Depends(get_nas_service),
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return create_variant_service(
        user_id=user_id,
        product_id=product_id,
        data=data,
        imagesVariant=imagesVariant,
        nas=nas,
        database=database,
    )


@router.get("/dashboard/products/{product_id}/variants", response_model=list[VariantResponse])
def list_variants(
    request: Request,
    product_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return list_variants_service(
        user_id=user_id,
        product_id=product_id,
        database=database,
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


# ------------------------------
# Imágenes de variante
# ------------------------------

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


# ------------------------------
# Especificaciones de variante
# ------------------------------

@router.get(
    "/dashboard/products/{product_id}/variants/{variant_id}/specifications",
    response_model=list[VariantSpecificationResponse],
)
def list_variant_specifications(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return list_variant_specifications_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        database=database,
    )


@router.post(
    "/dashboard/products/{product_id}/variants/{variant_id}/specifications",
    response_model=VariantDetailResponse,
)
def create_variant_specification(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    data: VariantSpecificationRequest,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return create_variant_specification_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        data=data,
        database=database,
    )


@router.patch(
    "/dashboard/products/{product_id}/variants/{variant_id}/specifications/{specification_id}",
    response_model=VariantDetailResponse,
)
def update_variant_specification(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    specification_id: UUID,
    data: VariantSpecificationUpdateRequest,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return update_variant_specification_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        specification_id=specification_id,
        data=data,
        database=database,
    )


@router.delete(
    "/dashboard/products/{product_id}/variants/{variant_id}/specifications/{specification_id}",
    response_model=VariantDetailResponse,
)
def delete_variant_specification(
    request: Request,
    product_id: UUID,
    variant_id: UUID,
    specification_id: UUID,
    database: Session = Depends(get_db),
):
    user_id = request.state.user_id

    return delete_variant_specification_service(
        user_id=user_id,
        product_id=product_id,
        variant_id=variant_id,
        specification_id=specification_id,
        database=database,
    )

