from app.services.email.EmailService import send_email
from app.services.email.template.EmailBase import (
    bullet_list_html,
    code_block,
    email_wrapper,
    greeting_html,
    heading_html,
    info_box,
    paragraph_html,
    signature_html,
)


def EmailRegisterCompany(
    to_email: str,
    company_name: str,
    code: str,
    expiration_minutes: int,
):

    subject = "Registro empresarial recibido - Verifica tu correo | Rehni Market"

    content = (
        heading_html("¡Empresa registrada!")
        + greeting_html(company_name)
        + paragraph_html(
            'Tu empresa fue registrada correctamente en '
            '<strong style="color:#6D0F2D;">Rehni Market</strong>. Para continuar con el '
            "proceso empresarial debes verificar el correo electrónico asociado a tu cuenta."
        )
        + paragraph_html("Ingresa el siguiente código de verificación en la aplicación:")
        + code_block(code)
        + paragraph_html(
            f"Este código expirará en <strong>{expiration_minutes} minutos</strong>.",
            center=True,
        )
        + info_box(
            "<strong>Proceso de activación empresarial:</strong>"
            + bullet_list_html(
                [
                    "Registro de empresa recibido",
                    "Verificación del correo electrónico",
                    "Validación de documentos enviados",
                    "Activación de cuenta empresarial",
                ]
            )
        )
        + paragraph_html(
            "Después de verificar tu correo, nuestro equipo realizará la revisión de la "
            "información empresarial. El proceso de activación puede tardar hasta "
            "<strong>3 días hábiles</strong>."
        )
        + info_box(
            "<strong>Importante:</strong><br><br>"
            "Nunca compartas este código. El equipo de Rehni Market nunca solicitará "
            "códigos de verificación por correo, teléfono o mensajes."
        )
        + paragraph_html(
            "Si no realizaste este registro empresarial, puedes ignorar este correo de "
            "forma segura.",
            muted=True,
        )
        + signature_html()
    )

    send_email(
        to_email,
        subject,
        email_wrapper("Registro empresarial", content),
    )
