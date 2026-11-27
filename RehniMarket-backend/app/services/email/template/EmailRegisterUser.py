from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    highlight,
    code_block,
    email_wrapper,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailRegisterUser(to_email: str, code: str, expiration_minutes: int):

    subject = "Verifica tu correo electrónico | Rehni Market"

    content = (
        heading_html("Te damos la bienvenida a Rehni Market")
        + paragraph_html(
            'Gracias por registrarte en ' + highlight("Rehni Market") + '. '
            "Tu cuenta fue creada correctamente."
        )
        + paragraph_html(
            "Para activar tu cuenta y comenzar a utilizar nuestros servicios, verifica tu "
            "correo electrónico ingresando el siguiente código:"
        )
        + code_block(code)
        + paragraph_html(
            f"Este código expirará en <strong>{expiration_minutes} minutos</strong>.",
            center=True,
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Nunca compartas este código. El equipo de Rehni Market nunca solicitará "
            "códigos de verificación por correo, teléfono o mensajes."
        )
        + paragraph_html(
            "Si no realizaste este registro, puedes ignorar este correo de forma segura.",
            muted=True,
        )
        + signature_html()
    )

    send_email(to_email, subject, email_wrapper("Verificación de cuenta", content))
