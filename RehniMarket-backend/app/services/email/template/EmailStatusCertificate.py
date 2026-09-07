from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    bullet_list_html,
    email_wrapper,
    escape,
    greeting_html,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailCertificateApproved(
    to_email: str,
    company_name: str,
):

    subject = "Certificado empresarial aprobado | Rehni Market"

    content = (
        heading_html("¡Tu empresa ha sido aprobada!")
        + greeting_html(company_name)
        + paragraph_html(
            "Nos complace informarte que nuestro equipo ha revisado y aprobado "
            "correctamente la documentación empresarial enviada a Rehni Market."
        )
        + paragraph_html(
            "Tu empresa ya se encuentra habilitada para utilizar todas las funcionalidades "
            "empresariales disponibles dentro de la plataforma."
        )
        + info_box(
            "<strong>Estado de la revisión:</strong>"
            + bullet_list_html(
                [
                    "Certificado empresarial aprobado",
                    "Documentación validada",
                    "Cuenta empresarial habilitada",
                    "Acceso a herramientas empresariales",
                ]
            )
        )
        + paragraph_html(
            "A partir de este momento podrás iniciar sesión en tu cuenta empresarial, "
            "administrar tu perfil, publicar productos y gestionar tus operaciones dentro "
            "de Rehni Market."
        )
        + paragraph_html("Gracias por confiar en Rehni Market para impulsar tu negocio.")
        + signature_html("Atentamente")
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Aprobación empresarial", content),
    )


def EmailCertificateNeedsUpdate(
    to_email: str,
    company_name: str,
    reason: str | None = None,
):
    """El certificado presentado no es válido (ilegible, vencido, incorrecto...): la
    empresa DEBE subir uno nuevo desde /actualizar-certificado. No es un rechazo de
    la empresa."""

    subject = "Tu certificado empresarial debe actualizarse | Rehni Market"

    reason_section = (
        info_box(
            "<strong>Motivo:</strong><br><br>" + escape(reason)
        )
        if reason
        else ""
    )

    content = (
        heading_html("Actualiza tu certificado empresarial")
        + greeting_html(company_name)
        + paragraph_html(
            "Hemos finalizado la revisión del certificado enviado para la validación "
            "empresarial."
        )
        + paragraph_html(
            "El certificado presentado no es válido (por ejemplo: ilegible, vencido o "
            "incorrecto) y debe ser reemplazado por uno vigente antes de continuar con "
            "el proceso de activación."
        )
        + reason_section
        + info_box(
            "<strong>Qué debes hacer:</strong>"
            + bullet_list_html(
                [
                    "Ingresa a la página \"Actualizar certificado\".",
                    "Verifícate con tu correo y contraseña.",
                    "Sube el nuevo certificado en PDF.",
                    "Tu empresa volverá automáticamente a revisión.",
                ]
            )
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Tu cuenta empresarial no ha sido eliminada, suspendida ni rechazada.<br><br>"
            "Solo es necesario que presentes un certificado válido.",
            warning=True,
        )
        + paragraph_html(
            "Si tienes dudas sobre el proceso de validación, puedes comunicarte con "
            "nuestro equipo de soporte."
        )
        + signature_html("Atentamente")
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Revisión empresarial", content),
    )


def EmailCertificateRejected(
    to_email: str,
    company_name: str,
    reason: str | None = None,
):
    """Rechazo TERMINAL de la empresa: no puede reintentar por sí misma. Para
    reactivarse debe intervenir un administrador."""

    subject = "Resultado de la revisión empresarial | Rehni Market"

    reason_section = (
        info_box(
            "<strong>Motivo del rechazo:</strong><br><br>" + escape(reason)
        )
        if reason
        else ""
    )

    content = (
        heading_html("Tu empresa no fue aprobada")
        + greeting_html(company_name)
        + paragraph_html(
            "Hemos finalizado la revisión de la documentación enviada para la validación "
            "empresarial."
        )
        + paragraph_html(
            "En esta ocasión no fue posible aprobar tu empresa en Rehni Market."
        )
        + reason_section
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Esta decisión no se resuelve subiendo un nuevo certificado. Si consideras "
            "que se trata de un error o quieres presentar información adicional, "
            "comunícate con nuestro equipo de soporte para que un administrador revise "
            "tu caso.",
            warning=True,
        )
        + signature_html("Atentamente")
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Revisión empresarial", content),
    )
