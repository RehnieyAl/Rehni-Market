
from app.services.email.EmailService import send_email


def EmailUpdateUserCredentials(to_email: str,temporary_password: str,):
    subject = "Rehni Market - Nuevos datos de acceso"
    body = f"""
Rehni Market

Actualización de datos de acceso


Hola,


Tu correo electrónico ha sido actualizado correctamente por el administrador de Rehni Market.


Estos son tus nuevos datos de acceso:


Correo electrónico:
{to_email}


Contraseña temporal:
{temporary_password}


Puedes utilizar estos datos para iniciar sesión nuevamente en Rehni Market.


Importante:


Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.


Si no reconoces este cambio, comunícate con el equipo de Rehni Market.


Saludos,


© 2026 Rehni Market

Marketplace para empresas y clientes.
"""

    send_email(
        to_email,
        subject,
        body,
    )

