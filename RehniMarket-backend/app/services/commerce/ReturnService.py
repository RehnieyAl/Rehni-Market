import traceback
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error
from app.core.TaxConfig import compute_tax

from app.models.ModelOrder import OrderStatusEnum
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum

from app.repository import OrderRepository as order_repo
from app.repository import ReturnRepository as repo

from app.schemas.SchemaCommerce.SchemaReturn import (
    CreateReturnRequest,
    OrderItemReturnResponse,
    ReturnDecisionRequest,
    ReturnRequestResponse,
    ReturnsPaginatedResponse,
)

from app.services.commerce.OrderService import _resolve_company
from app.services.commerce.WalletService import refund_wallet
from app.services.email.template.EmailReturnStatus import (
    EmailReturnApproved,
    EmailReturnRejected,
    EmailReturnRequested,
)


def _reference(order) -> str:
    return f"RM-{order.order_number:06d}"


def _to_return_response(ret: ReturnRequest) -> ReturnRequestResponse:
    order = ret.order
    item = ret.order_item
    buyer = ret.user

    return ReturnRequestResponse(
        id=ret.id,
        orderId=ret.order_id,
        orderReference=_reference(order),
        orderItemId=ret.order_item_id,
        productName=item.product_name,
        variantName=item.variant_name,
        quantity=item.quantity,
        unitPrice=item.unit_price,
        itemSubtotal=item.subtotal,
        reason=ret.reason,
        status=ret.status.value,
        companyResponse=ret.company_response,
        refundAmount=ret.refund_amount,
        buyerName=buyer.fullName,
        buyerEmail=buyer.email,
        createdAt=ret.created_at,
        resolvedAt=ret.resolved_at,
    )


def order_item_returns(database: Session, order_id: UUID) -> list[OrderItemReturnResponse]:
    """Devoluciones de un pedido, listas para embeber en OrderResponse."""

    return [
        OrderItemReturnResponse(
            id=ret.id,
            orderItemId=ret.order_item_id,
            status=ret.status.value,
            reason=ret.reason,
            companyResponse=ret.company_response,
            refundAmount=ret.refund_amount,
            createdAt=ret.created_at,
            resolvedAt=ret.resolved_at,
        )
        for ret in repo.list_by_order(database, order_id)
    ]


def _refund_amount_for_item(item) -> Decimal:
    """subtotal del ítem + IVA proporcional. El IVA se recalcula con el mismo helper y
    redondeo del checkout, solo si el producto aplica IVA (Product.applies_tax se lee en
    vivo: OrderItem no guarda ese flag)."""

    subtotal = Decimal(item.subtotal)

    if item.product is not None and item.product.applies_tax:
        return subtotal + compute_tax(subtotal)

    return subtotal


def request_return_service(
    user_id: UUID,
    role: str,
    order_id: UUID,
    data: CreateReturnRequest,
    database: Session,
) -> ReturnRequestResponse:
    if role != "user":
        api_error(
            403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no puede solicitar devoluciones."
        )

    try:
        order = order_repo.get_user_order(database, order_id, user_id)

        if not order:
            api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

        if order.status != OrderStatusEnum.DELIVERED:
            api_error(
                400,
                ErrorCodes.RETURN_NOT_ELIGIBLE,
                "Solo puedes solicitar la devolución de un pedido que ya fue entregado.",
            )

        item = next(
            (it for it in order.items if it.id == data.orderItemId), None
        )

        if item is None:
            api_error(
                404,
                ErrorCodes.ORDER_ITEM_NOT_FOUND,
                "Ese producto no pertenece a este pedido.",
            )

        if repo.active_return_exists_for_item(database, item.id):
            api_error(
                409,
                ErrorCodes.RETURN_ALREADY_REQUESTED,
                "Ya existe una solicitud de devolución activa para este producto.",
            )

        return_request = ReturnRequest(
            order_id=order.id,
            order_item_id=item.id,
            user_id=user_id,
            company_id=order.company_id,
            reason=data.reason,
            status=ReturnStatusEnum.PENDING,
        )

        repo.create(database, return_request)

        database.commit()
        database.refresh(return_request)

        EmailReturnRequested(
            to_email=order.company.user.email,
            company_name=order.company.nameCompany,
            buyer_name=order.user.fullName,
            product_name=item.product_name,
            order_reference=_reference(order),
            reason=return_request.reason,
        )

        return _to_return_response(return_request)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def list_order_returns_service(
    user_id: UUID, role: str, order_id: UUID, database: Session
) -> list[ReturnRequestResponse]:
    if role != "user":
        api_error(403, ErrorCodes.PURCHASE_NOT_ALLOWED, "Esta cuenta no tiene devoluciones.")

    order = order_repo.get_user_order(database, order_id, user_id)

    if not order:
        api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

    return [_to_return_response(ret) for ret in repo.list_by_order(database, order_id)]


def list_company_returns_service(
    user_id: UUID,
    database: Session,
    page: int = 1,
    limit: int = 10,
    status: str | None = None,
    search: str | None = None,
) -> ReturnsPaginatedResponse:
    company = _resolve_company(database, user_id)

    status_enum: ReturnStatusEnum | None = None
    if status:
        try:
            status_enum = ReturnStatusEnum(status)
        except ValueError:
            api_error(400, ErrorCodes.VALIDATION_ERROR, "Estado de devolución inválido.")

    items, total = repo.list_by_company(
        database, company.id, status_enum, search, page, limit
    )

    return ReturnsPaginatedResponse(
        items=[_to_return_response(ret) for ret in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def get_company_return_detail_service(
    user_id: UUID, return_id: UUID, database: Session
) -> ReturnRequestResponse:
    company = _resolve_company(database, user_id)

    ret = repo.get_for_company(database, return_id, company.id)

    if not ret:
        api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

    return _to_return_response(ret)


def decide_return_service(
    user_id: UUID,
    return_id: UUID,
    data: ReturnDecisionRequest,
    database: Session,
) -> ReturnRequestResponse:
    company = _resolve_company(database, user_id)

    try:
        ret = repo.get_for_company(database, return_id, company.id)

        if not ret:
            api_error(
                404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada."
            )

        if ret.status != ReturnStatusEnum.PENDING:
            api_error(
                409,
                ErrorCodes.RETURN_ALREADY_RESOLVED,
                "Esta solicitud de devolución ya fue resuelta.",
            )

        item = ret.order_item
        order = ret.order
        buyer = ret.user
        now = datetime.now(timezone.utc)

        if data.action == "reject":
            reason_clean = (data.reason or "").strip()

            if not reason_clean:
                api_error(
                    400,
                    ErrorCodes.MISSING_REQUIRED_FIELD,
                    "Debes indicar el motivo del rechazo de la devolución.",
                )

            ret.status = ReturnStatusEnum.REJECTED
            ret.company_response = reason_clean
            ret.reviewed_by = user_id
            ret.resolved_at = now

            database.commit()
            database.refresh(ret)

            EmailReturnRejected(
                to_email=buyer.email,
                buyer_name=buyer.fullName,
                company_name=company.nameCompany,
                product_name=item.product_name,
                order_reference=_reference(order),
                reason=reason_clean,
            )

            return _to_return_response(ret)

        # action == "approve"
        amount = _refund_amount_for_item(item)

        refund_wallet(
            database,
            ret.user_id,
            amount,
            description=(
                f"Reembolso por devolución aprobada del pedido {_reference(order)} "
                f"— {item.product_name}"
            ),
            order_id=None,
        )

        ret.status = ReturnStatusEnum.APPROVED
        ret.refund_amount = amount
        ret.reviewed_by = user_id
        ret.resolved_at = now

        database.commit()
        database.refresh(ret)

        EmailReturnApproved(
            to_email=buyer.email,
            buyer_name=buyer.fullName,
            company_name=company.nameCompany,
            product_name=item.product_name,
            order_reference=_reference(order),
            refund_amount=amount,
        )

        return _to_return_response(ret)

    except HTTPException:
        database.rollback()
        raise

    except Exception:
        database.rollback()
        traceback.print_exc()
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")
