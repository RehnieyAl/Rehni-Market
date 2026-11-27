"""Correos de reclamaciones de devolución: devuelven (asunto, HTML) para guardarlos en
return_notifications; el envío lo hace ReturnNotificationService. Todo texto escrito por
usuarios se escapa."""

from decimal import Decimal

from app.services.email.template.EmailBase import (
    email_wrapper,
    escape,
    format_price,
    greeting_html,
    heading_html,
    info_box,
    label_value_rows,
    paragraph_html,
    signature_html,
)


def _multiline(text: str) -> str:
    return escape(text).replace("\n", "<br>")


def _references(claim_reference: str, order_reference: str, product_name: str) -> str:
    return info_box(
        label_value_rows(
            [
                ("Reclamación", claim_reference),
                ("Pedido", order_reference),
                ("Producto", product_name),
            ]
        )
    )


def build_return_requested_email(
    company_name: str,
    buyer_name: str,
    product_name: str,
    order_reference: str,
    claim_reference: str,
    reason: str,
) -> tuple[str, str]:
    """Aviso a la EMPRESA: un comprador abrió una reclamación de devolución."""

    subject = f"Nueva solicitud de devolución · {order_reference} | Rehni Market"
    content = (
        heading_html("Tienes una solicitud de devolución")
        + greeting_html(company_name)
        + paragraph_html(
            f"El comprador <strong>{escape(buyer_name)}</strong> solicitó la devolución de un producto."
        )
        + _references(claim_reference, order_reference, product_name)
        + info_box("<strong>Motivo del comprador:</strong><br><br>" + _multiline(reason))
        + paragraph_html(
            "Revisa la solicitud desde tu panel, en la sección <strong>Devoluciones</strong>. "
            "Si la apruebas se reintegra el valor pagado al comprador en RehniCoin; si la rechazas, "
            "deberás indicar el motivo."
        )
        + signature_html("Atentamente")
    )
    return subject, email_wrapper("Solicitud de devolución", content)


def build_decision_email(
    recipient_name: str,
    subject: str,
    message: str | None,
    approved: bool,
    decided_by: str,
    product_name: str,
    order_reference: str,
    claim_reference: str,
    refund_amount: Decimal | None,
    can_request_review: bool,
) -> tuple[str, str]:
    """Aviso al COMPRADOR con la decisión real de la empresa o del administrador (`decided_by`),
    con el asunto y la explicación que escribió quien decidió."""

    status_text = "aprobada" if approved else "rechazada"
    content = (
        heading_html(f"Tu solicitud de devolución fue {status_text}")
        + greeting_html(recipient_name)
        + paragraph_html(f"{escape(decided_by)} revisó tu solicitud de devolución.")
        + _references(claim_reference, order_reference, product_name)
    )

    if message:
        label = "Explicación" if approved else "Motivo del rechazo"
        content += info_box(f"<strong>{label}:</strong><br><br>" + _multiline(message), warning=not approved)

    if approved and refund_amount is not None:
        content += info_box(
            "<strong>Reembolso acreditado en tu billetera RehniCoin:</strong><br><br>"
            f"{format_price(refund_amount)}"
        )

    if can_request_review:
        content += paragraph_html(
            "Si no estás de acuerdo, puedes solicitar una revisión al equipo de Rehni Market desde "
            "el detalle del pedido o en <strong>Mis devoluciones</strong>."
        )

    content += signature_html("Atentamente")
    return subject, email_wrapper(f"Devolución {status_text}", content)


def build_admin_decision_for_company_email(
    company_name: str,
    subject: str,
    message: str,
    approved: bool,
    product_name: str,
    order_reference: str,
    claim_reference: str,
    refund_amount: Decimal | None,
) -> tuple[str, str]:
    """Aviso a la EMPRESA: el administrador resolvió una reclamación de uno de sus pedidos."""

    status_text = "aprobó" if approved else "rechazó"
    content = (
        heading_html("Resolución administrativa de una devolución")
        + greeting_html(company_name)
        + paragraph_html(f"El equipo de Rehni Market {status_text} la siguiente reclamación.")
        + _references(claim_reference, order_reference, product_name)
        + info_box("<strong>Explicación:</strong><br><br>" + _multiline(message))
    )
    if approved and refund_amount is not None:
        content += paragraph_html(
            f"Se reintegraron {escape(format_price(refund_amount))} al comprador en RehniCoin. "
            "El valor se descontará de tus ventas en la próxima liquidación."
        )
    content += signature_html("Atentamente")
    return subject, email_wrapper("Devolución", content)


def build_admin_contact_email(
    company_name: str,
    subject: str,
    message: str,
    product_name: str,
    order_reference: str,
    claim_reference: str,
) -> tuple[str, str]:
    """Mensaje que el administrador redacta para la EMPRESA sobre una reclamación."""

    content = (
        heading_html("Mensaje del equipo de Rehni Market")
        + greeting_html(company_name)
        + _references(claim_reference, order_reference, product_name)
        + info_box(_multiline(message))
        + paragraph_html(
            "Puedes responder a este correo o gestionar la reclamación desde tu panel, en la "
            "sección <strong>Devoluciones</strong>."
        )
        + signature_html("Atentamente")
    )
    return subject, email_wrapper("Reclamación de devolución", content)
