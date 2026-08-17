from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.database.Connection import get_db

from app.schemas.SchemaCommerce.SchemaOrder import CheckoutRequest, CheckoutSummaryResponse

from app.services.commerce.CheckoutService import checkout_service

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutSummaryResponse)
def checkout(request: Request, data: CheckoutRequest, database: Session = Depends(get_db)):
    return checkout_service(request.state.user_id, request.state.role, data, database)
