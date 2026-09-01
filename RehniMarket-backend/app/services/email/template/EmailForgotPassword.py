from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    code_block,
    email_wrapper,
    escape,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailForgotPassword(to_email: str, code: str, expiration_minutes: int):

    subject = "Recuperación de contraseña | Rehni Market"

    content = (
        heading_html("Recuperación de contraseña")
        + paragraph_html(
            "Hemos recibido una solicitud para restablecer la contraseña asociada a tu "
            'cuenta de <strong style="color:#6D0F2D;">Rehni Market</strong>.'
        )
        + paragraph_html(
            "Si realizaste esta solicitud, utiliza el siguiente código para verificar tu "
            "identidad y continuar con el proceso."
        )
        + code_block(code)
        + paragraph_html(
            "Por motivos de seguridad, este código será válido únicamente durante los "
            f"próximos <strong>{expiration_minutes} minutos</strong>.",
            center=True,
        )
        + info_box(
            "<strong>Información de la solicitud:</strong><br><br>"
            "- Recuperación de contraseña<br>"
            f"- Cuenta asociada: {escape(to_email)}<br>"
            f"- Código válido por {expiration_minutes} minutos"
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Por tu seguridad, nunca compartas este código con terceros.<br><br>"
            "El equipo de Rehni Market nunca solicitará códigos de verificación por correo "
            "electrónico, llamadas telefónicas o mensajes.",
            warning=True,
        )
        + paragraph_html(
            "Si no solicitaste este cambio de contraseña, puedes ignorar este correo de "
            "forma segura. Tu cuenta permanecerá protegida y no se realizará ningún cambio."
        )
        + paragraph_html(
            "Si continúas teniendo problemas para acceder a tu cuenta, comunícate con "
            "nuestro equipo de soporte."
        )
        + signature_html("Atentamente")
    )

    return send_email(
        to_email,
        subject,
        email_wrapper("Recuperación de contraseña", content),
    )
