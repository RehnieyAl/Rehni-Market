from app.services.email.EmailService import send_email


def EmailCompanyBlocked(
    to_email: str,
    company_name: str,
):
    subject = "Cuenta empresarial bloqueada | Rehni Market"

    body = f"""
Rehni Market

Cuenta empresarial bloqueada


Tu cuenta empresarial ha sido bloqueada


Hola,

Te informamos que la cuenta empresarial de
{company_name}
ha sido bloqueada por el equipo de Rehni Market.


Estado de la cuenta:

✕ Cuenta bloqueada
✕ Acceso a las funciones empresariales suspendido


Mientras la cuenta permanezca bloqueada, no podrás utilizar
las funciones de la plataforma que requieran una cuenta
empresarial activa.


Si consideras que este bloqueo se realizó por error o deseas
obtener más información sobre la decisión, puedes comunicarte
con el equipo de soporte de Rehni Market.


Importante:

El bloqueo de la cuenta no significa que la información de
tu empresa haya sido eliminada de la plataforma.


Saludos,

© 2026 Rehni Market

Marketplace para empresas y clientes.
"""

    send_email(
        to_email,
        subject,
        body,
    )


def EmailCompanyUnblocked(
    to_email: str,
    company_name: str,
):
    subject = "Cuenta empresarial desbloqueada | Rehni Market"

    body = f"""
Rehni Market

Cuenta empresarial desbloqueada


¡Tu cuenta empresarial está activa nuevamente!


Hola,

Te informamos que la cuenta empresarial de
{company_name}
ha sido desbloqueada por el equipo de Rehni Market.


Estado de la cuenta:

✓ Cuenta activa
✓ Acceso a las funciones empresariales habilitado


Ya puedes ingresar nuevamente a Rehni Market y utilizar las
funciones disponibles para tu empresa.


Si tienes alguna inquietud sobre el estado de tu cuenta,
puedes comunicarte con nuestro equipo de soporte.


Saludos,

© 2026 Rehni Market

Marketplace para empresas y clientes.
"""

    send_email(
        to_email,
        subject,
        body,
    )

