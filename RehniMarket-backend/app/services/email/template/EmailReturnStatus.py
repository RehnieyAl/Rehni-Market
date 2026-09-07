"""Correos del flujo de devoluciones (ReturnRequest). Mismo estilo que
EmailStatusCertificate: se llaman directo desde ReturnService, send_email nunca
revienta el flujo que lo llama."""

from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    email_wrapper,
    escape,
    format_price,
    greeting_html,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailReturnRequested(
    to_email: str,
    company_name: str,
    buyer_name: str,
    product_name: str,
    order_reference: str,
    reason: str,
):
    """Aviso a la EMPRESA: un comprador pidió la devolución de un ítem de uno de sus
    pedidos entregados."""

    subject = f"Nueva solicitud de devolución · {order_reference} | Rehni Market"

    content = (
        heading_html("Tienes una solicitud de devolución")
        + greeting_html(company_name)
        + paragraph_html(
            f"El comprador <strong>{escape(buyer_name)}</strong> solicitó la devolución "
            f"del producto <strong>{escape(product_name)}</strong> del pedido "
            f"<strong>{escape(order_reference)}</strong>."
        )
        + info_box("<strong>Motivo del comprador:</strong><br><br>" + escape(reason))
        + paragraph_html(
            "Revisa la solicitud desde tu panel, en la sección <strong>Devoluciones</strong>, "
            "y decide si la apruebas o la rechazas. Si la rechazas, deberás indicar un motivo."
        )
        + signature_html("Atentamente")
    )

    send_email(to_email, subject, email_wrapper("Solicitud de devolución", content))


def EmailReturnApproved(
    to_email: str,
    buyer_name: str,
    company_name: str,
    product_name: str,
    order_reference: str,
    refund_amount,
):
    """Aviso al COMPRADOR: la empresa aprobó la devolución y se reintegraron las RehniCoin."""

    subject = f"Devolución aprobada · {order_reference} | Rehni Market"

    content = (
        heading_html("Tu devolución fue aprobada")
        + greeting_html(buyer_name)
        + paragraph_html(
            f"<strong>{escape(company_name)}</strong> aprobó la devolución del producto "
            f"<strong>{escape(product_name)}</strong> del pedido "
            f"<strong>{escape(order_reference)}</strong>."
        )
        + info_box(
            "<strong>Reembolso acreditado en RehniCoin:</strong><br><br>"
            f"{format_price(refund_amount)}"
        )
        + paragraph_html(
            "El saldo ya está disponible en tu billetera RehniCoin para tu próxima compra."
        )
        + signature_html("Atentamente")
    )

    send_email(to_email, subject, email_wrapper("Devolución aprobada", content))


def EmailReturnRejected(
    to_email: str,
    buyer_name: str,
    company_name: str,
    product_name: str,
    order_reference: str,
    reason: str,
):
    """Aviso al COMPRADOR: la empresa rechazó la devolución, con el motivo."""

    subject = f"Devolución rechazada · {order_reference} | Rehni Market"

    content = (
        heading_html("Tu devolución no fue aprobada")
        + greeting_html(buyer_name)
        + paragraph_html(
            f"<strong>{escape(company_name)}</strong> revisó tu solicitud de devolución del "
            f"producto <strong>{escape(product_name)}</strong> del pedido "
            f"<strong>{escape(order_reference)}</strong> y no fue aprobada."
        )
        + info_box(
            "<strong>Motivo indicado por el vendedor:</strong><br><br>" + escape(reason),
            warning=True,
        )
        + paragraph_html(
            "Si consideras que hubo un error, puedes comunicarte con nuestro equipo de soporte."
        )
        + signature_html("Atentamente")
    )

    send_email(to_email, subject, email_wrapper("Devolución rechazada", content))
