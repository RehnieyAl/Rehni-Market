"""Reclamaciones de devolución de comprador, empresa y administración. Un solo camino de reembolso
(_approve_with_refund) para empresa y administrador: fila bloqueada, monto histórico del ítem,
refund_wallet enlazado a la reclamación (índice único) y correos registrados en la misma transacción."""

import logging
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.ErrorCodes import ErrorCodes
from app.core.Exceptions import api_error

from app.models.ModelOrder import OrderStatusEnum
from app.models.ModelReturnRequest import ReturnRequest, ReturnStatusEnum
from app.models.ModelReturnRequestEvent import CallOutcome, ReturnEventType, ReturnRequestEvent

from app.repository import OrderRepository as order_repo
from app.repository import ReturnRepository as repo

from app.schemas.SchemaCommerce.SchemaReturn import (
    AdminCallRequest,
    AdminCompanyContactResponse,
    AdminContactRequest,
    AdminDecisionRequest,
    AdminEscalateRequest,
    AdminReturnDetailResponse,
    CreateReturnRequest,
    OrderItemReturnResponse,
    ReturnDecisionRequest,
    ReturnDetailResponse,
    ReturnEventResponse,
    ReturnNotificationResponse,
    ReturnRequestResponse,
    ReturnsPaginatedResponse,
    ReviewRequest,
)

from app.services.commerce import ReturnNotificationService as notifications
from app.services.commerce.OrderService import _resolve_company
from app.services.commerce.WalletService import refund_wallet
from app.services.email.template.EmailReturnStatus import (
    build_admin_contact_email,
    build_admin_decision_for_company_email,
    build_decision_email,
    build_return_requested_email,
)

logger = logging.getLogger(__name__)

PLATFORM_NAME = "El equipo de Rehni Market"
HIDDEN_FOR_BUYER = {ReturnEventType.ADMIN_EMAIL, ReturnEventType.ADMIN_CALL}
HIDDEN_FOR_COMPANY = {ReturnEventType.ADMIN_CALL}


# ---------------------------------------------------------------- respuestas


def _reference(order) -> str:
    return f"RM-{order.order_number:06d}"


def claim_reference(ret: ReturnRequest) -> str:
    return f"DEV-{str(ret.id)[:8].upper()}"


def _decided_by(ret: ReturnRequest) -> str | None:
    if ret.admin_resolved_at is not None:
        return "admin"
    if ret.status in (ReturnStatusEnum.APPROVED, ReturnStatusEnum.REJECTED):
        return "company"
    return None


def _can_request_review(ret: ReturnRequest) -> bool:
    return (
        ret.status == ReturnStatusEnum.REJECTED
        and ret.review_requested_at is None
        and ret.admin_resolved_at is None
    )


def _to_return_response(ret: ReturnRequest) -> ReturnRequestResponse:
    order = ret.order
    item = ret.order_item
    buyer = ret.user

    return ReturnRequestResponse(
        id=ret.id,
        reference=claim_reference(ret),
        orderId=ret.order_id,
        orderReference=_reference(order),
        orderItemId=ret.order_item_id,
        companyId=ret.company_id,
        companyName=ret.company.nameCompany,
        productName=item.product_name,
        variantName=item.variant_name,
        quantity=item.quantity,
        unitPrice=item.unit_price,
        itemSubtotal=item.subtotal,
        reason=ret.reason,
        status=ret.status.value,
        companySubject=ret.company_subject,
        companyResponse=ret.company_response,
        reviewReason=ret.review_reason,
        reviewRequestedAt=ret.review_requested_at,
        escalatedAt=ret.escalated_at,
        adminSubject=ret.admin_subject,
        adminResponse=ret.admin_response,
        adminResolvedAt=ret.admin_resolved_at,
        decidedBy=_decided_by(ret),
        canRequestReview=_can_request_review(ret),
        refundAmount=ret.refund_amount,
        refundableAmount=(
            Decimal(item.subtotal) + Decimal(item.tax_amount) if item.tax_amount is not None else None
        ),
        buyerName=buyer.fullName,
        buyerEmail=buyer.email,
        createdAt=ret.created_at,
        resolvedAt=ret.resolved_at,
    )


def _events(ret: ReturnRequest, hidden: set[ReturnEventType]) -> list[ReturnEventResponse]:
    return [
        ReturnEventResponse(
            id=event.id,
            type=event.event_type.value,
            actorRole=event.actor_role,
            actorName=event.actor.fullName if event.actor is not None else None,
            subject=event.subject,
            message=event.message,
            amount=event.amount,
            callOutcome=event.call_outcome.value if event.call_outcome else None,
            occurredAt=event.occurred_at,
            createdAt=event.created_at,
        )
        for event in ret.events
        if event.event_type not in hidden
    ]


def _detail(ret: ReturnRequest, hidden: set[ReturnEventType]) -> ReturnDetailResponse:
    return ReturnDetailResponse(**_to_return_response(ret).model_dump(), events=_events(ret, hidden))


def _admin_detail(database: Session, ret: ReturnRequest) -> AdminReturnDetailResponse:
    company = ret.company
    representative = company.user

    return AdminReturnDetailResponse(
        **_detail(ret, set()).model_dump(),
        company=AdminCompanyContactResponse(
            companyId=company.id,
            companyName=company.nameCompany,
            nit=f"{company.CompanyNIT}-{company.CompanyNITDV}",
            companyActive=company.CompanyStatus,
            contactEmail=company.contact_email,
            contactPhone=company.contact_phone,
            representativeName=representative.fullName,
            representativeEmail=representative.email,
            representativePhone=representative.tell,
        ),
        notifications=[
            ReturnNotificationResponse(
                id=notification.id,
                kind=notification.kind,
                recipientRole=notification.recipient_role,
                recipientEmail=notification.recipient_email,
                subject=notification.subject,
                message=notification.message,
                status=notification.status.value,
                attempts=notification.attempts,
                lastError=notification.last_error,
                createdAt=notification.created_at,
                sentAt=notification.sent_at,
            )
            for notification in ret.notifications
        ],
        refundTransactionId=repo.refund_transaction_id(database, ret.id),
        payoutAdjustmentId=ret.payout_adjustment_id,
    )


def _page(items, total: int, page: int, limit: int) -> ReturnsPaginatedResponse:
    return ReturnsPaginatedResponse(
        items=[_to_return_response(ret) for ret in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
    )


def _status_filter(status: str | None) -> ReturnStatusEnum | None:
    if not status:
        return None
    try:
        return ReturnStatusEnum(status)
    except ValueError:
        api_error(400, ErrorCodes.VALIDATION_ERROR, "Estado de devolución inválido.")


def order_item_returns(database: Session, order_id: UUID) -> list[OrderItemReturnResponse]:
    """Reclamaciones de un pedido, listas para embeber en OrderResponse."""

    return [
        OrderItemReturnResponse(
            id=ret.id,
            orderItemId=ret.order_item_id,
            status=ret.status.value,
            reason=ret.reason,
            companyResponse=ret.company_response,
            adminResponse=ret.admin_response,
            reviewRequestedAt=ret.review_requested_at,
            canRequestReview=_can_request_review(ret),
            refundAmount=ret.refund_amount,
            createdAt=ret.created_at,
            resolvedAt=ret.resolved_at,
        )
        for ret in repo.list_by_order(database, order_id)
    ]


# ---------------------------------------------------------------- transacciones


def _run(database: Session, action: Callable, conflict: tuple[str, str]):
    """Ejecuta `action` como una transacción: cualquier error la revierte completa. Una violación de
    unicidad (reclamación o reembolso duplicado por una petición simultánea) responde 409."""

    try:
        return action()
    except HTTPException:
        database.rollback()
        raise
    except IntegrityError:
        database.rollback()
        api_error(409, *conflict)
    except Exception:
        database.rollback()
        logger.exception("Error inesperado")
        api_error(500, ErrorCodes.INTERNAL_SERVER_ERROR, "Error interno del servidor.")


def _commit_and_dispatch(database: Session, pending: list) -> None:
    ids = [notification.id for notification in pending]
    database.commit()
    notifications.schedule_dispatch(ids)


def _event(
    database: Session,
    ret: ReturnRequest,
    event_type: ReturnEventType,
    actor_id: UUID | None,
    actor_role: str,
    **fields,
) -> ReturnRequestEvent:
    event = ReturnRequestEvent(
        return_request_id=ret.id,
        event_type=event_type,
        actor_id=actor_id,
        actor_role=actor_role,
        **fields,
    )
    database.add(event)
    database.flush()
    return event


def refund_amount_for_item(item) -> Decimal:
    """Lo que el comprador pagó por la línea: subtotal + IVA cobrado en el checkout. No se reconstruye
    con el estado actual del producto; si el IVA histórico no se conoce, no se reembolsa."""

    if item.tax_amount is None:
        api_error(
            409,
            ErrorCodes.RETURN_REFUND_UNAVAILABLE,
            "No se puede determinar el IVA cobrado en este pedido; el equipo de Rehni Market debe "
            "revisar el reembolso.",
        )
    return Decimal(item.subtotal) + Decimal(item.tax_amount)


def _company_email(company) -> str:
    return company.contact_email or company.user.email


def _notify_buyer(database, ret, *, actor_id, decided_by, subject, message, approved, event):
    order = ret.order
    buyer = ret.user
    content = build_decision_email(
        recipient_name=buyer.fullName,
        subject=subject,
        message=message,
        approved=approved,
        decided_by=decided_by,
        product_name=ret.order_item.product_name,
        order_reference=_reference(order),
        claim_reference=claim_reference(ret),
        refund_amount=ret.refund_amount if approved else None,
        can_request_review=_can_request_review(ret),
    )
    return notifications.enqueue(
        database, ret, kind="decision", recipient_role="user", recipient_email=buyer.email,
        subject_and_html=content, message=message, created_by=actor_id, event=event,
    )


def _approve_with_refund(database: Session, ret: ReturnRequest, actor_id: UUID, actor_role: str) -> None:
    """Acredita el reembolso único de la reclamación (ya bloqueada y validada por el llamador)."""

    amount = refund_amount_for_item(ret.order_item)
    refund_wallet(
        database,
        ret.user_id,
        amount,
        description=f"Reembolso de la devolución {claim_reference(ret)} del pedido {_reference(ret.order)}",
        return_request_id=ret.id,
    )
    ret.status = ReturnStatusEnum.APPROVED
    ret.refund_amount = amount
    _event(
        database, ret, ReturnEventType.REFUNDED, actor_id, actor_role,
        amount=amount, wallet_transaction_id=repo.refund_transaction_id(database, ret.id),
    )


def _ensure_no_other_active_claim(database: Session, ret: ReturnRequest) -> None:
    """Reabrir un rechazo (revisión o intervención) choca con otra reclamación activa del mismo ítem
    si existe; se responde con el motivo real en lugar del conflicto del índice único."""

    if repo.other_active_claim_exists(database, ret):
        api_error(
            409,
            ErrorCodes.RETURN_ALREADY_REQUESTED,
            "Este producto ya tiene otra solicitud de devolución activa; se gestiona desde esa solicitud.",
        )


# ---------------------------------------------------------------- comprador


def request_return_service(
    user_id: UUID,
    order_id: UUID,
    data: CreateReturnRequest,
    database: Session,
) -> ReturnRequestResponse:
    def action():
        order = order_repo.get_user_order(database, order_id, user_id)

        if not order:
            api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

        if order.status != OrderStatusEnum.DELIVERED:
            api_error(
                400,
                ErrorCodes.RETURN_NOT_ELIGIBLE,
                "Solo puedes solicitar la devolución de un pedido que ya fue entregado.",
            )

        item = next((it for it in order.items if it.id == data.orderItemId), None)

        if item is None:
            api_error(404, ErrorCodes.ORDER_ITEM_NOT_FOUND, "Ese producto no pertenece a este pedido.")

        if repo.return_exists_for_item(database, item.id):
            api_error(
                409,
                ErrorCodes.RETURN_ALREADY_REQUESTED,
                "Ya existe una solicitud de devolución para este producto. Si fue rechazada, "
                "puedes solicitar una revisión desde su detalle.",
            )

        ret = repo.create(
            database,
            ReturnRequest(
                order_id=order.id,
                order_item_id=item.id,
                user_id=user_id,
                company_id=order.company_id,
                reason=data.reason,
                status=ReturnStatusEnum.PENDING,
            ),
        )
        event = _event(database, ret, ReturnEventType.REQUESTED, user_id, "user", message=data.reason)

        company = order.company
        notification = notifications.enqueue(
            database, ret, kind="new_request", recipient_role="company",
            recipient_email=_company_email(company),
            subject_and_html=build_return_requested_email(
                company_name=company.nameCompany,
                buyer_name=order.user.fullName,
                product_name=item.product_name,
                order_reference=_reference(order),
                claim_reference=claim_reference(ret),
                reason=data.reason,
            ),
            message=data.reason, created_by=user_id, event=event,
        )
        _commit_and_dispatch(database, [notification])
        database.refresh(ret)
        return _to_return_response(ret)

    return _run(
        database,
        action,
        (ErrorCodes.RETURN_ALREADY_REQUESTED, "Ya existe una solicitud de devolución activa para este producto."),
    )


def list_order_returns_service(user_id: UUID, order_id: UUID, database: Session) -> list[ReturnRequestResponse]:
    order = order_repo.get_user_order(database, order_id, user_id)

    if not order:
        api_error(404, ErrorCodes.ORDER_NOT_FOUND, "Pedido no encontrado.")

    return [_to_return_response(ret) for ret in repo.list_by_order(database, order_id)]


def list_my_returns_service(user_id: UUID, database: Session, page: int = 1, limit: int = 10) -> ReturnsPaginatedResponse:
    items, total = repo.list_by_user(database, user_id, page, limit)
    return _page(items, total, page, limit)


def get_my_return_detail_service(user_id: UUID, return_id: UUID, database: Session) -> ReturnDetailResponse:
    ret = repo.get_for_user(database, return_id, user_id)

    if not ret:
        api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

    return _detail(ret, HIDDEN_FOR_BUYER)


def request_review_service(
    user_id: UUID, return_id: UUID, data: ReviewRequest, database: Session
) -> ReturnDetailResponse:
    def action():
        ret = repo.lock_for_user(database, return_id, user_id)

        if not ret:
            api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

        if not _can_request_review(ret):
            api_error(
                409,
                ErrorCodes.RETURN_REVIEW_NOT_ALLOWED,
                "Solo puedes pedir una revisión, una vez, de una solicitud rechazada por la empresa.",
            )

        _ensure_no_other_active_claim(database, ret)
        ret.status = ReturnStatusEnum.UNDER_REVIEW
        ret.review_reason = data.reason
        ret.review_requested_at = datetime.now(timezone.utc)
        _event(database, ret, ReturnEventType.REVIEW_REQUESTED, user_id, "user", message=data.reason)
        database.commit()
        database.refresh(ret)
        return _detail(ret, HIDDEN_FOR_BUYER)

    return _run(database, action, (ErrorCodes.RETURN_REVIEW_NOT_ALLOWED, "La revisión ya fue solicitada."))


# ---------------------------------------------------------------- empresa


def list_company_returns_service(
    user_id: UUID,
    database: Session,
    page: int = 1,
    limit: int = 10,
    status: str | None = None,
    search: str | None = None,
) -> ReturnsPaginatedResponse:
    company = _resolve_company(database, user_id)
    items, total = repo.list_by_company(database, company.id, _status_filter(status), search, page, limit)
    return _page(items, total, page, limit)


def get_company_return_detail_service(user_id: UUID, return_id: UUID, database: Session) -> ReturnDetailResponse:
    company = _resolve_company(database, user_id)

    ret = repo.get_for_company(database, return_id, company.id)

    if not ret:
        api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

    return _detail(ret, HIDDEN_FOR_COMPANY)


def decide_return_service(
    user_id: UUID,
    return_id: UUID,
    data: ReturnDecisionRequest,
    database: Session,
) -> ReturnDetailResponse:
    company = _resolve_company(database, user_id)

    def action():
        ret = repo.lock_for_company(database, return_id, company.id)

        if not ret:
            api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

        if ret.status == ReturnStatusEnum.UNDER_REVIEW:
            api_error(
                409,
                ErrorCodes.RETURN_IN_ADMIN_REVIEW,
                "Esta solicitud está en revisión del equipo de Rehni Market.",
            )

        if ret.status != ReturnStatusEnum.PENDING:
            api_error(409, ErrorCodes.RETURN_ALREADY_RESOLVED, "Esta solicitud de devolución ya fue resuelta.")

        approved = data.action == "approve"
        if not approved and not data.reason:
            api_error(
                400,
                ErrorCodes.MISSING_REQUIRED_FIELD,
                "Debes indicar el motivo del rechazo de la devolución.",
            )

        order_ref = _reference(ret.order)
        ret.company_subject = data.subject or (
            f"Tu devolución fue aprobada · {order_ref}" if approved else f"Tu devolución fue rechazada · {order_ref}"
        )
        ret.company_response = data.reason
        ret.reviewed_by = user_id
        ret.resolved_at = datetime.now(timezone.utc)

        event = _event(
            database, ret,
            ReturnEventType.COMPANY_APPROVED if approved else ReturnEventType.COMPANY_REJECTED,
            user_id, "company", subject=ret.company_subject, message=data.reason,
        )
        if approved:
            _approve_with_refund(database, ret, user_id, "company")
        else:
            ret.status = ReturnStatusEnum.REJECTED

        notification = _notify_buyer(
            database, ret, actor_id=user_id, decided_by=company.nameCompany,
            subject=ret.company_subject, message=data.reason, approved=approved, event=event,
        )
        _commit_and_dispatch(database, [notification])
        database.refresh(ret)
        return _detail(ret, HIDDEN_FOR_COMPANY)

    return _run(database, action, (ErrorCodes.RETURN_ALREADY_RESOLVED, "Esta solicitud de devolución ya fue resuelta."))


# ---------------------------------------------------------------- administración


def _lock_for_admin(database: Session, return_id: UUID) -> ReturnRequest:
    ret = repo.lock_by_id(database, return_id)
    if not ret:
        api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")
    return ret


def list_admin_returns_service(
    database: Session,
    page: int = 1,
    limit: int = 10,
    status: str | None = None,
    search: str | None = None,
    company_id: UUID | None = None,
) -> ReturnsPaginatedResponse:
    items, total = repo.list_all(database, _status_filter(status), search, company_id, page, limit)
    return _page(items, total, page, limit)


def get_admin_return_detail_service(return_id: UUID, database: Session) -> AdminReturnDetailResponse:
    ret = repo.get_by_id(database, return_id)

    if not ret:
        api_error(404, ErrorCodes.RETURN_NOT_FOUND, "Solicitud de devolución no encontrada.")

    return _admin_detail(database, ret)


def escalate_return_service(
    admin_id: UUID, role: str, return_id: UUID, data: AdminEscalateRequest, database: Session
) -> AdminReturnDetailResponse:
    """El administrador toma una reclamación pendiente (empresa sin respuesta o suspendida) o
    rechazada por la empresa. No decide nada: la deja en revisión administrativa."""

    def action():
        ret = _lock_for_admin(database, return_id)

        if not (ret.status == ReturnStatusEnum.PENDING or _can_request_review(ret)):
            api_error(
                409,
                ErrorCodes.RETURN_ALREADY_RESOLVED,
                "Solo se puede intervenir una solicitud pendiente o rechazada por la empresa.",
            )

        if ret.status == ReturnStatusEnum.REJECTED:
            _ensure_no_other_active_claim(database, ret)
        ret.status = ReturnStatusEnum.UNDER_REVIEW
        ret.escalated_at = datetime.now(timezone.utc)
        _event(database, ret, ReturnEventType.ESCALATED, admin_id, role, message=data.reason)
        database.commit()
        database.refresh(ret)
        return _admin_detail(database, ret)

    return _run(database, action, (ErrorCodes.RETURN_ALREADY_RESOLVED, "La solicitud cambió de estado."))


def admin_decide_return_service(
    admin_id: UUID, role: str, return_id: UUID, data: AdminDecisionRequest, database: Session
) -> AdminReturnDetailResponse:
    def action():
        ret = _lock_for_admin(database, return_id)

        if ret.status == ReturnStatusEnum.PENDING or _can_request_review(ret):
            api_error(
                409,
                ErrorCodes.RETURN_NOT_ESCALATED,
                "Primero toma el caso (intervención) indicando la causa.",
            )
        if ret.status != ReturnStatusEnum.UNDER_REVIEW:
            api_error(409, ErrorCodes.RETURN_ALREADY_RESOLVED, "Esta solicitud de devolución ya fue resuelta.")

        approved = data.action == "approve"
        ret.admin_subject = data.subject
        ret.admin_response = data.message
        ret.admin_reviewed_by = admin_id
        ret.admin_resolved_at = datetime.now(timezone.utc)
        ret.resolved_at = ret.admin_resolved_at

        event = _event(
            database, ret,
            ReturnEventType.ADMIN_APPROVED if approved else ReturnEventType.ADMIN_REJECTED,
            admin_id, role, subject=data.subject, message=data.message,
        )
        if approved:
            _approve_with_refund(database, ret, admin_id, role)
        else:
            ret.status = ReturnStatusEnum.REJECTED

        pending = [
            _notify_buyer(
                database, ret, actor_id=admin_id, decided_by=PLATFORM_NAME,
                subject=data.subject, message=data.message, approved=approved, event=event,
            )
        ]
        company = ret.company
        pending.append(
            notifications.enqueue(
                database, ret, kind="admin_decision", recipient_role="company",
                recipient_email=_company_email(company),
                subject_and_html=build_admin_decision_for_company_email(
                    company_name=company.nameCompany,
                    subject=data.subject,
                    message=data.message,
                    approved=approved,
                    product_name=ret.order_item.product_name,
                    order_reference=_reference(ret.order),
                    claim_reference=claim_reference(ret),
                    refund_amount=ret.refund_amount if approved else None,
                ),
                message=data.message, created_by=admin_id, event=event,
            )
        )
        _commit_and_dispatch(database, pending)
        database.refresh(ret)
        return _admin_detail(database, ret)

    return _run(database, action, (ErrorCodes.RETURN_ALREADY_RESOLVED, "Esta solicitud de devolución ya fue resuelta."))


def contact_company_service(
    admin_id: UUID, role: str, return_id: UUID, data: AdminContactRequest, database: Session
) -> AdminReturnDetailResponse:
    def action():
        ret = _lock_for_admin(database, return_id)
        company = ret.company

        if data.channel == "company_contact":
            if not company.contact_email:
                api_error(
                    422,
                    ErrorCodes.RETURN_CONTACT_UNAVAILABLE,
                    "La empresa no registró un correo de contacto empresarial.",
                )
            recipient = company.contact_email
        else:
            recipient = company.user.email

        event = _event(
            database, ret, ReturnEventType.ADMIN_EMAIL, admin_id, role, subject=data.subject, message=data.message,
        )
        notification = notifications.enqueue(
            database, ret, kind="admin_contact", recipient_role="company", recipient_email=recipient,
            subject_and_html=build_admin_contact_email(
                company_name=company.nameCompany,
                subject=data.subject,
                message=data.message,
                product_name=ret.order_item.product_name,
                order_reference=_reference(ret.order),
                claim_reference=claim_reference(ret),
            ),
            message=data.message, created_by=admin_id, event=event,
        )
        _commit_and_dispatch(database, [notification])
        database.refresh(ret)
        return _admin_detail(database, ret)

    return _run(database, action, (ErrorCodes.VALIDATION_ERROR, "No se pudo registrar el contacto."))


def register_call_service(
    admin_id: UUID, role: str, return_id: UUID, data: AdminCallRequest, database: Session
) -> AdminReturnDetailResponse:
    called_at = data.calledAt if data.calledAt.tzinfo else data.calledAt.replace(tzinfo=timezone.utc)
    if called_at > datetime.now(timezone.utc) + timedelta(minutes=5):
        api_error(400, ErrorCodes.VALIDATION_ERROR, "La fecha de la llamada no puede estar en el futuro.")

    def action():
        ret = _lock_for_admin(database, return_id)
        _event(
            database, ret, ReturnEventType.ADMIN_CALL, admin_id, role,
            message=data.notes, call_outcome=CallOutcome(data.outcome), occurred_at=called_at,
        )
        database.commit()
        database.refresh(ret)
        return _admin_detail(database, ret)

    return _run(database, action, (ErrorCodes.VALIDATION_ERROR, "No se pudo registrar la llamada."))


def retry_notification_service(return_id: UUID, notification_id: UUID, database: Session) -> AdminReturnDetailResponse:
    notifications.retry_notification(database, return_id, notification_id)
    return get_admin_return_detail_service(return_id, database)
