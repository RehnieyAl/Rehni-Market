from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.Connection import get_db
from app.schemas.SchemaDashboard.SchemaProductArchitecture import (
    ProductAttributeValueResponse,
    ProductAvailableAttributesResponse,
    ProductDiscountRequest,
    SetProductAttributesRequest,
)
from app.schemas.SchemaDashboard.SchemaVariant import GenerateCombinationsRequest
from app.services.DashboardService.company.ProductAttributes import (
    get_available_attributes_service,
    get_product_attributes_service,
    set_product_attributes_service,
)
from app.services.DashboardService.company.ProductDiscount import (
    set_product_discount_service,
)
from app.services.DashboardService.company.VariantGenerate import (
    generate_combinations_service,
)

router = APIRouter(prefix="/company", tags=["company - product architecture"])


@router.get(
    "/dashboard/products/{product_id}/available-attributes",
    response_model=ProductAvailableAttributesResponse,
)
def get_available_attributes(
    request: Request,
    product_id: UUID,
    database: Session = Depends(get_db),
):
    return get_available_attributes_service(
        database, request.state.user_id, product_id
    )


@router.get(
    "/dashboard/products/{product_id}/product-attributes",
    response_model=list[ProductAttributeValueResponse],
)
def get_product_attributes(
    request: Request,
    product_id: UUID,
    database: Session = Depends(get_db),
):
    return get_product_attributes_service(
        database, request.state.user_id, product_id
    )


@router.put(
    "/dashboard/products/{product_id}/product-attributes",
    response_model=list[ProductAttributeValueResponse],
)
def set_product_attributes(
    request: Request,
    product_id: UUID,
    data: SetProductAttributesRequest,
    database: Session = Depends(get_db),
):
    return set_product_attributes_service(
        database, request.state.user_id, product_id, data
    )


@router.put("/dashboard/products/{product_id}/discount")
def set_product_discount(
    request: Request,
    product_id: UUID,
    data: ProductDiscountRequest,
    database: Session = Depends(get_db),
):
    return set_product_discount_service(
        database, request.state.user_id, product_id, data
    )


@router.post("/dashboard/products/{product_id}/variants/generate")
def generate_variant_combinations(
    request: Request,
    product_id: UUID,
    data: GenerateCombinationsRequest,
    database: Session = Depends(get_db),
):
    return generate_combinations_service(
        database, request.state.user_id, product_id, data.attribute_ids
    )
