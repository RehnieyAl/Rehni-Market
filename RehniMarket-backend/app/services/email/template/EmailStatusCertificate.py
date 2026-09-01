from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    bullet_list_html,
    email_wrapper,
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


def EmailCertificateRejected(
    to_email: str,
    company_name: str,
):

    subject = "Certificado empresarial requiere correcciones | Rehni Market"

    content = (
        heading_html("Documentación pendiente de corrección")
        + greeting_html(company_name)
        + paragraph_html(
            "Hemos finalizado la revisión de la documentación enviada para la validación "
            "empresarial."
        )
        + paragraph_html(
            "En esta ocasión no fue posible aprobar el certificado empresarial debido a "
            "inconsistencias o información que requiere ajustes antes de continuar con el "
            "proceso de activación."
        )
        + info_box(
            "<strong>Estado de la revisión:</strong>"
            + bullet_list_html(
                [
                    "Certificado pendiente de aprobación",
                    "Documentación requiere correcciones",
                    "Puedes realizar una nueva solicitud",
                ]
            )
        )
        + paragraph_html(
            "Te recomendamos revisar cuidadosamente la documentación enviada y realizar "
            "las correcciones necesarias antes de volver a presentar la solicitud."
        )
        + paragraph_html(
            "Una vez actualizada la información, podrás iniciar nuevamente el proceso de "
            "validación para que nuestro equipo realice una nueva revisión."
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "La cuenta empresarial no ha sido eliminada ni suspendida.<br><br>"
            "Solo es necesario corregir la documentación requerida para continuar con el "
            "proceso de aprobación.",
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
