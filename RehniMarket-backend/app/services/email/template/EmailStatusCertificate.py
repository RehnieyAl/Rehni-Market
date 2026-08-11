from app.services.email.EmailService import send_email

def EmailCertificateApproved(to_email: str,company_name: str,):
    subject = "Certificado empresarial aprobado | Rehni Market"

    body = f"""
Rehni Market

Certificado empresarial aprobado


¡Tu empresa ha sido aprobada!


Hola,

Nos complace informarte que el certificado empresarial de
{company_name}
ha sido revisado y aprobado correctamente por el equipo de Rehni Market.

Estado del certificado:

✓ Certificado aprobado
✓ Documentación validada
✓ Empresa habilitada


A partir de este momento, tu empresa podrá utilizar las funciones
disponibles para empresas dentro de Rehni Market.

Ya puedes ingresar a tu cuenta empresarial y continuar utilizando
la plataforma.


Importante:

Si tienes alguna inquietud sobre el proceso de aprobación, puedes
comunicarte con el equipo de soporte de Rehni Market.


Saludos,

© 2026 Rehni Market

Marketplace para empresas y clientes.
"""

    send_email(
        to_email,
        subject,
        body,
    )


def EmailCertificateRejected(to_email: str,company_name: str,):
    subject = "Certificado empresarial no aprobado | Rehni Market"

    body = f"""
Rehni Market

Revisión del certificado empresarial


Certificado no aprobado


Hola,

Te informamos que el certificado empresarial de
{company_name}
fue revisado por el equipo de Rehni Market y no pudo ser aprobado
en esta revisión.


Estado del certificado:

✕ Certificado no aprobado
✕ Revisión no satisfactoria


Puedes revisar la información y documentación enviada y realizar
las correcciones necesarias para volver a presentar el certificado
para una nueva revisión.


Importante:

El rechazo del certificado no significa que tu cuenta haya sido
eliminada. Podrás realizar nuevamente el proceso de revisión cuando
la documentación esté correctamente presentada.


Saludos,

© 2026 Rehni Market

Marketplace para empresas y clientes.
"""

    send_email(
        to_email,
        subject,
        body,
    )
