"""Correos de pedidos: cada función arma subject + body con los helpers de EmailBase.py
y llama a send_email. Los datos llegan resueltos desde OrderEmailService.py; este
archivo no conoce los modelos ni el UUID del pedido, solo `reference`."""

from decimal import Decimal

from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    email_wrapper,
    greeting_html,
    heading_html,
    subheading_html,
    paragraph_html,
    signature_html,
    info_box,
    label_value_rows,
    cta_button,
    products_table_html,
    product_row_html,
    products_summary_list_html,
    format_price,
)


def _address_section(address: dict) -> str:
    return subheading_html("Dirección de entrega") + label_value_rows(
        [
            ("Nombre completo", address["full_name"]),
            ("Teléfono", address["phone"]),
            ("Dirección", address["address"]),
            ("Ciudad", address["city"]),
            ("Departamento", address["department"]),
        ]
    )


def EmailOrderCreated(
    to_email: str,
    buyer_name: str,
    reference: str,
    status_label: str,
    created_at_label: str,
    company_name: str,
    address: dict | None,
    items: list[dict],
    distinct_products: int,
    total_units: int,
    total: Decimal,
):
    subject = f"Pedido recibido #{reference} | Rehni Market"

    order_info = info_box(
        label_value_rows(
            [
                ("Referencia", reference),
                ("Estado", status_label),
                ("Fecha", created_at_label),
                ("Empresa", company_name),
            ]
        )
    )

    address_section = _address_section(address) if address else ""

    rows_html = "".join(
        product_row_html(
            item.get("image_url"),
            item["name"],
            item.get("variant_name"),
            item["quantity"],
            item["unit_price"],
            item["subtotal"],
        )
        for item in items
    )

    summary = info_box(
        label_value_rows(
            [
                ("Productos diferentes", str(distinct_products)),
                ("Unidades totales", str(total_units)),
                ("Total pagado", format_price(total)),
                ("Método de pago", "RehniCoin"),
            ]
        )
    )

    content = (
        heading_html("¡Pedido recibido!")
        + greeting_html(buyer_name)
        + paragraph_html(
            "Hemos recibido tu pedido correctamente y ya se encuentra en proceso de validación."
        )
        + subheading_html("Información del pedido")
        + order_info
        + address_section
        + subheading_html("Detalle de productos")
        + products_table_html(rows_html)
        + subheading_html("Resumen del pedido")
        + summary
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Pedido recibido", content))


def EmailOrderProcessing(
    to_email: str,
    buyer_name: str,
    reference: str,
    status_label: str,
    updated_at_label: str,
    items: list[dict],
    total: Decimal,
):
    subject = f"Tu pedido #{reference} está en proceso"

    content = (
        heading_html("Tu pedido está en preparación")
        + greeting_html(buyer_name)
        + paragraph_html("La empresa ya está preparando tu pedido.")
        + info_box(
            label_value_rows(
                [
                    ("Referencia", reference),
                    ("Estado actual", status_label),
                    ("Fecha de actualización", updated_at_label),
                ]
            )
        )
        + subheading_html("Resumen de productos")
        + products_summary_list_html(items)
        + paragraph_html(f"<strong>Total: {format_price(total)}</strong>")
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Pedido en proceso", content))


def EmailOrderShipped(
    to_email: str,
    buyer_name: str,
    reference: str,
    status_label: str,
    address: dict | None,
    items: list[dict],
    total: Decimal,
):
    subject = f"Tu pedido #{reference} ha sido enviado"

    address_section = _address_section(address) if address else ""

    content = (
        heading_html("¡Tu pedido va en camino!")
        + greeting_html(buyer_name)
        + paragraph_html(
            "Tu pedido ha sido enviado y se encuentra camino a la dirección registrada."
        )
        + info_box(
            label_value_rows(
                [
                    ("Referencia", reference),
                    ("Estado", status_label),
                ]
            )
        )
        + address_section
        + subheading_html("Resumen de productos")
        + products_summary_list_html(items)
        + paragraph_html(f"<strong>Total: {format_price(total)}</strong>")
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Pedido enviado", content))


def EmailOrderDelivered(
    to_email: str,
    buyer_name: str,
    reference: str,
    delivered_at_label: str,
    items: list[dict],
    total: Decimal,
    rate_products_url: str,
):
    subject = f"Tu pedido #{reference} fue entregado"

    content = (
        heading_html("¡Tu pedido fue entregado!")
        + greeting_html(buyer_name)
        + paragraph_html("Confirmamos que tu pedido fue entregado correctamente.")
        + info_box(
            label_value_rows(
                [
                    ("Referencia", reference),
                    ("Fecha de entrega", delivered_at_label),
                ]
            )
        )
        + subheading_html("Resumen de productos")
        + products_summary_list_html(items)
        + paragraph_html(f"<strong>Total: {format_price(total)}</strong>")
        + paragraph_html(
            "¿Qué te pareció tu compra? Cuéntaselo a otros compradores."
        )
        + cta_button("Calificar productos", rate_products_url)
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Pedido entregado", content))


def EmailOrderCancelled(
    to_email: str,
    buyer_name: str,
    reference: str,
    cancelled_at_label: str,
    total: Decimal,
    reason: str | None = None,
    refunded_amount: Decimal | None = None,
    company_name: str | None = None,
):
    subject = f"Pedido #{reference} cancelado"

    info_pairs = [
        ("Referencia", reference),
        ("Fecha de cancelación", cancelled_at_label),
    ]

    if company_name:
        info_pairs.append(("Empresa", company_name))

    if reason:
        info_pairs.append(("Motivo", reason))

    info_pairs.append(("Total", format_price(total)))

    refund_section = ""

    if refunded_amount is not None:
        refund_section = info_box(
            "<strong>Reembolso realizado:</strong><br><br>"
            f"{format_price(refunded_amount)} RehniCoin fueron devueltos a tu billetera."
        )

    content = (
        heading_html("Tu pedido fue cancelado")
        + greeting_html(buyer_name)
        + paragraph_html("Tu pedido ha sido cancelado.")
        + info_box(label_value_rows(info_pairs))
        + refund_section
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Pedido cancelado", content))
