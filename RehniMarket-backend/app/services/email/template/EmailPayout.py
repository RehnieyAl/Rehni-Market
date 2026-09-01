"""
Correo de liquidaciones (ver ALCANCE > Módulo de liquidaciones, Fase 5).
Mismo criterio que el resto de app/services/email/template/*.py: arma
subject + body con los helpers de EmailBase.py y llama a send_email
directo al final. Los datos llegan ya resueltos desde
PayoutEmailService.py - este archivo no conoce CompanyPayout/
CompanyBankAccount (modelos SQLAlchemy) directamente, igual que
EmailOrder.py no conoce Order/OrderItem.
"""

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
    format_price,
)


def EmailPayoutProcessed(
    to_email: str,
    company_name: str,
    period_label: str,
    gross_sales: Decimal,
    commission_percentage: Decimal,
    commission_amount: Decimal,
    net_amount: Decimal,
    bank_name: str,
    account_type_label: str,
    last_four_digits: str,
    paid_at_label: str,
):
    subject = "Liquidación mensual realizada | Rehni Market"

    commission_label = f"{commission_percentage * 100:.0f}%"

    payout_info = info_box(
        label_value_rows(
            [
                ("Empresa", company_name),
                ("Periodo", period_label),
                ("Ventas brutas", format_price(gross_sales)),
                (f"Comisión Rehni Market ({commission_label})", format_price(commission_amount)),
                ("Valor transferido", format_price(net_amount)),
            ]
        )
    )

    bank_info = info_box(
        label_value_rows(
            [
                ("Banco", bank_name),
                ("Tipo de cuenta", account_type_label),
                ("Cuenta", f"•••• {last_four_digits}"),
                ("Fecha de pago", paid_at_label),
            ]
        )
    )

    content = (
        heading_html("¡Tu liquidación mensual fue realizada!")
        + greeting_html(company_name)
        + paragraph_html(
            "Ya procesamos la liquidación de tus ventas del periodo indicado y "
            "transferimos el valor neto a tu cuenta registrada."
        )
        + subheading_html("Resumen de la liquidación")
        + payout_info
        + subheading_html("Cuenta de destino")
        + bank_info
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Liquidación mensual", content))
