"""
Orquestador del correo de liquidaciones (ver ALCANCE > Módulo de
liquidaciones, Fase 5): extrae los datos reales de un `CompanyPayout` (ORM,
con bank_account/company ya cargados, ver CompanyPayoutRepository.py) y
llama a EmailPayoutProcessed. Mismo criterio que OrderEmailService.py.
"""

from app.models.ModelCompanyPayout import CompanyPayout

from app.services.email.template.EmailPayout import EmailPayoutProcessed

BANK_ACCOUNT_TYPE_LABEL = {
    "savings": "Ahorros",
    "checking": "Corriente",
    "nequi": "Nequi",
    "daviplata": "Daviplata",
}


def _format_date(value) -> str:
    return value.strftime("%d/%m/%Y %H:%M") if value else ""


def _period_label(payout: CompanyPayout) -> str:
    start = payout.period_start.strftime("%d/%m/%Y")
    end = payout.period_end.strftime("%d/%m/%Y")

    return f"{start} - {end}"


def send_payout_processed_email(payout: CompanyPayout) -> None:
    """
    Se llama después de marcar `payout.payout_status = PAID` (ver
    PayoutService.mark_payout_paid_service) - nunca antes, el correo dice
    literalmente "fue realizada".
    """

    bank_account = payout.bank_account
    company = payout.company

    EmailPayoutProcessed(
        to_email=company.user.email,
        company_name=company.nameCompany,
        period_label=_period_label(payout),
        gross_sales=payout.gross_sales,
        commission_percentage=payout.commission_percentage,
        commission_amount=payout.commission_amount,
        net_amount=payout.net_amount,
        bank_name=bank_account.bank_name,
        account_type_label=BANK_ACCOUNT_TYPE_LABEL.get(
            bank_account.account_type.value, bank_account.account_type.value
        ),
        last_four_digits=bank_account.account_number[-4:],
        paid_at_label=_format_date(payout.paid_at),
    )
