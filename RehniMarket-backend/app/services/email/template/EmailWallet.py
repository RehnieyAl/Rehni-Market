"""Correos de RehniCoin (billetera interna del usuario).

Mismo criterio que el resto de app/services/email/template/*.py: arma
subject + body con los helpers de EmailBase.py y llama a send_email al final.
Los datos llegan ya resueltos desde WalletEmailService.py - este archivo no
conoce Wallet / WalletTransaction directamente.
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


def EmailRehniCoinRecharge(
    to_email: str,
    user_name: str,
    amount: Decimal,
    new_balance: Decimal,
    description: str | None,
    date_label: str,
) -> None:
    subject = "Recibiste una recarga de RehniCoin | Rehni Market"

    rows = [
        ("Cantidad recargada", f"{format_price(amount)} RC"),
        ("Nuevo saldo", f"{format_price(new_balance)} RC"),
        ("Fecha", date_label),
    ]

    if description:
        rows.insert(2, ("Concepto", description))

    content = (
        heading_html("Recibiste una recarga de RehniCoin")
        + greeting_html(user_name)
        + paragraph_html(
            f"Un administrador acreditó <strong>{format_price(amount)} RehniCoin</strong> a tu billetera. "
            "El movimiento ya aparece en tu historial de RehniCoin."
        )
        + subheading_html("Detalle de la recarga")
        + info_box(label_value_rows(rows))
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Recarga de RehniCoin", content))


def EmailRehniCoinRechargeCorrected(
    to_email: str,
    user_name: str,
    original_amount: Decimal,
    new_amount: Decimal,
    adjustment: Decimal,
    new_balance: Decimal,
    reason: str,
    date_label: str,
) -> None:
    subject = "Se corrigió una recarga de RehniCoin | Rehni Market"

    removed = adjustment < 0
    adjustment_label = ("-" if removed else "+") + f"{format_price(abs(adjustment))} RC"

    verb = "se descontaron" if removed else "se acreditaron"

    content = (
        heading_html("Se corrigió una recarga de RehniCoin")
        + greeting_html(user_name)
        + paragraph_html(
            "Una recarga de RehniCoin realizada por un administrador fue corregida. "
            f"Como resultado {verb} <strong>{format_price(abs(adjustment))} RehniCoin</strong> "
            "de tu saldo. La recarga original y esta corrección quedan visibles en tu "
            "historial de RehniCoin."
        )
        + subheading_html("Detalle de la corrección")
        + info_box(
            label_value_rows(
                [
                    ("Recarga original", f"{format_price(original_amount)} RC"),
                    ("Cantidad correcta", f"{format_price(new_amount)} RC"),
                    ("Ajuste aplicado", adjustment_label),
                    ("Nuevo saldo", f"{format_price(new_balance)} RC"),
                    ("Motivo", reason),
                    ("Fecha", date_label),
                ]
            )
        )
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Corrección de recarga de RehniCoin", content))
