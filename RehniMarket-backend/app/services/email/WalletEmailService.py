"""Orquestador de los correos de RehniCoin: extrae los datos ya resueltos y llama
a las plantillas de EmailWallet. Se invoca DESPUÉS del commit del movimiento
(igual que send_payout_processed_email). send_email nunca lanza, así que un fallo
de correo no rompe la operación de billetera."""

from decimal import Decimal

from app.models.ModelUser import Users
from app.services.email.template.EmailWallet import (
    EmailRehniCoinRecharge,
    EmailRehniCoinRechargeCorrected,
)


def _date_label(value) -> str:
    return value.strftime("%d/%m/%Y %H:%M") if value else ""


def send_recharge_email(
    user: Users,
    amount: Decimal,
    new_balance: Decimal,
    description: str | None,
    created_at,
) -> None:
    EmailRehniCoinRecharge(
        to_email=user.email,
        user_name=user.fullName,
        amount=amount,
        new_balance=new_balance,
        description=description,
        date_label=_date_label(created_at),
    )


def send_recharge_correction_email(
    user: Users,
    original_amount: Decimal,
    new_amount: Decimal,
    adjustment: Decimal,
    new_balance: Decimal,
    reason: str,
    corrected_at,
) -> None:
    EmailRehniCoinRechargeCorrected(
        to_email=user.email,
        user_name=user.fullName,
        original_amount=original_amount,
        new_amount=new_amount,
        adjustment=adjustment,
        new_balance=new_balance,
        reason=reason,
        date_label=_date_label(corrected_at),
    )
