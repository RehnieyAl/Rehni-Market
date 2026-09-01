from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    email_wrapper,
    escape,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailUpdateUserCredentials(
    to_email: str,
    temporary_password: str,
):

    subject = "Actualización de credenciales | Rehni Market"

    content = (
        heading_html("Tus credenciales fueron actualizadas")
        + paragraph_html(
            'Un administrador de <strong style="color:#6D0F2D;">Rehni Market</strong> ha '
            "actualizado la información de acceso asociada a tu cuenta."
        )
        + info_box(
            "<strong>Correo electrónico:</strong><br>"
            f"{escape(to_email)}<br><br>"
            "<strong>Contraseña temporal:</strong><br>"
            f"{escape(temporary_password)}"
        )
        + paragraph_html(
            "Utiliza estas credenciales para iniciar sesión nuevamente en la plataforma."
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Por seguridad, cambia tu contraseña después de iniciar sesión.<br><br>"
            "Si no reconoces esta actualización, comunícate con el equipo de soporte de "
            "Rehni Market.",
            warning=True,
        )
        + paragraph_html(
            "Este correo fue enviado automáticamente como parte del proceso de "
            "actualización de credenciales.",
            muted=True,
        )
        + signature_html()
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Actualización de acceso", content),
    )
