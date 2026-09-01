from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    bullet_list_html,
    email_wrapper,
    escape,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailCompanyBlocked(
    to_email: str,
    company_name: str,
    reason: str | None = None,
):
    subject = "Cuenta empresarial bloqueada | Rehni Market"

    reason_section = (
        info_box(
            "<strong>Motivo de la suspensión:</strong><br><br>" + escape(reason)
        )
        if reason
        else ""
    )

    content = (
        heading_html("Tu cuenta empresarial fue bloqueada")
        + paragraph_html("Hola,")
        + paragraph_html(
            "Te informamos que la cuenta empresarial de "
            f'<strong style="color:#6D0F2D;">{escape(company_name)}</strong> ha sido '
            "bloqueada por el equipo de Rehni Market."
        )
        + reason_section
        + info_box(
            "<strong>Estado de la cuenta:</strong>"
            + bullet_list_html(
                [
                    "Cuenta bloqueada",
                    "Acceso a las funciones empresariales suspendido",
                ]
            )
        )
        + paragraph_html(
            "Mientras la cuenta permanezca bloqueada, no podrás utilizar las funciones de "
            "la plataforma que requieran una cuenta empresarial activa."
        )
        + paragraph_html(
            "Si consideras que este bloqueo se realizó por error o deseas obtener más "
            "información sobre la decisión, puedes comunicarte con el equipo de soporte de "
            "Rehni Market."
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "El bloqueo de la cuenta no significa que la información de tu empresa haya "
            "sido eliminada de la plataforma."
        )
        + signature_html()
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Cuenta empresarial bloqueada", content),
    )


def EmailCompanyUnblocked(
    to_email: str,
    company_name: str,
):
    subject = "Cuenta empresarial desbloqueada | Rehni Market"

    content = (
        heading_html("¡Tu cuenta empresarial está activa nuevamente!")
        + paragraph_html("Hola,")
        + paragraph_html(
            "Te informamos que la cuenta empresarial de "
            f'<strong style="color:#6D0F2D;">{escape(company_name)}</strong> ha sido '
            "desbloqueada por el equipo de Rehni Market."
        )
        + info_box(
            "<strong>Estado de la cuenta:</strong>"
            + bullet_list_html(
                [
                    "Cuenta activa",
                    "Acceso a las funciones empresariales habilitado",
                ]
            )
        )
        + paragraph_html(
            "Ya puedes ingresar nuevamente a Rehni Market y utilizar las funciones "
            "disponibles para tu empresa."
        )
        + paragraph_html(
            "Si tienes alguna inquietud sobre el estado de tu cuenta, puedes comunicarte "
            "con nuestro equipo de soporte."
        )
        + signature_html()
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Cuenta empresarial desbloqueada", content),
    )
