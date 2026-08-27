from app.services.email.EmailService import send_email


def EmailCertificateApproved(
    to_email: str,
    company_name: str,
):

    subject = "Certificado empresarial aprobado | Rehni Market"

    body = f"""
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Certificado aprobado | Rehni Market</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f4f4;
font-family:Arial, Helvetica, sans-serif;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="background:#f4f4f4;padding:40px 0;"
>

<tr>

<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
"
>

<tr>

<td
align="center"
style="
background:#6D0F2D;
padding:40px;
"
>

<h1 style="
margin:0;
color:#ffffff;
font-size:34px;
font-weight:bold;
">
Rehni Market
</h1>

<p style="
margin:15px 0 0;
color:#f3dbe4;
font-size:17px;
">
Aprobación empresarial
</p>

</td>

</tr>

<tr>

<td style="padding:45px;">

<h2 style="
margin:0;
color:#222222;
font-size:28px;
">
¡Tu empresa ha sido aprobada!
</h2>

<p style="
margin-top:25px;
color:#555555;
font-size:16px;
line-height:28px;
">
Hola <strong style="color:#6D0F2D;">{company_name}</strong>,
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
Nos complace informarte que nuestro equipo ha revisado y aprobado correctamente la documentación empresarial enviada a Rehni Market.
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
Tu empresa ya se encuentra habilitada para utilizar todas las funcionalidades empresariales disponibles dentro de la plataforma.
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:35px;
background:#F8F8F8;
border-radius:12px;
"
>

<tr>

<td style="padding:20px;">

<p style="
margin:0;
font-size:15px;
line-height:28px;
color:#555555;
">

<strong>Estado de la revisión:</strong>

<br><br>

- Certificado empresarial aprobado

<br>

- Documentación validada

<br>

- Cuenta empresarial habilitada

<br>

- Acceso a herramientas empresariales

</p>

</td>

</tr>

</table>

<p style="
margin-top:35px;
color:#555555;
font-size:16px;
line-height:28px;
">
A partir de este momento podrás iniciar sesión en tu cuenta empresarial, administrar tu perfil, publicar productos y gestionar tus operaciones dentro de Rehni Market.
</p>

<p style="
margin-top:35px;
color:#555555;
font-size:16px;
line-height:28px;
">
Gracias por confiar en Rehni Market para impulsar tu negocio.
</p>

<p style="
margin-top:30px;
font-size:15px;
color:#333333;
">
Atentamente,
<br>
<strong style="color:#6D0F2D;">
Equipo Rehni Market
</strong>
</p>

</td>

</tr>

<tr>

<td
style="
background:#F2F2F2;
padding:30px;
text-align:center;
"
>

<p style="
margin:0;
font-size:14px;
color:#777777;
">
© 2026 Rehni Market
</p>

<p style="
margin-top:10px;
font-size:13px;
color:#999999;
line-height:22px;
">
Marketplace para empresas y clientes.
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
"""

    send_email(
        to_email,
        subject,
        body,
    )


def EmailCertificateRejected(
    to_email: str,
    company_name: str,
):

    subject = "Certificado empresarial requiere correcciones | Rehni Market"

    body = f"""
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Revisión empresarial | Rehni Market</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f4f4;
font-family:Arial, Helvetica, sans-serif;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="background:#f4f4f4;padding:40px 0;"
>

<tr>

<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.08);
"
>

<tr>

<td
align="center"
style="
background:#6D0F2D;
padding:40px;
"
>

<h1 style="
margin:0;
color:#ffffff;
font-size:34px;
font-weight:bold;
">
Rehni Market
</h1>

<p style="
margin:15px 0 0;
color:#f3dbe4;
font-size:17px;
">
Revisión empresarial
</p>

</td>

</tr>

<tr>

<td style="padding:45px;">

<h2 style="
margin:0;
color:#222222;
font-size:28px;
">
Documentación pendiente de corrección
</h2>

<p style="
margin-top:25px;
color:#555555;
font-size:16px;
line-height:28px;
">
Hola <strong style="color:#6D0F2D;">{company_name}</strong>,
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
Hemos finalizado la revisión de la documentación enviada para la validación empresarial.
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
En esta ocasión no fue posible aprobar el certificado empresarial debido a inconsistencias o información que requiere ajustes antes de continuar con el proceso de activación.
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:35px;
background:#F8F8F8;
border-radius:12px;
"
>

<tr>

<td style="padding:20px;">

<p style="
margin:0;
font-size:15px;
line-height:28px;
color:#555555;
">

<strong>Estado de la revisión:</strong>

<br><br>

- Certificado pendiente de aprobación

<br>

- Documentación requiere correcciones

<br>

- Puedes realizar una nueva solicitud

</p>

</td>

</tr>

</table>

<p style="
margin-top:35px;
color:#555555;
font-size:16px;
line-height:28px;
">
Te recomendamos revisar cuidadosamente la documentación enviada y realizar las correcciones necesarias antes de volver a presentar la solicitud.
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
Una vez actualizada la información, podrás iniciar nuevamente el proceso de validación para que nuestro equipo realice una nueva revisión.
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:35px;
background:#FFF6F8;
border-radius:12px;
border:1px solid #F2D4DE;
"
>

<tr>

<td style="padding:20px;">

<p style="
margin:0;
font-size:15px;
line-height:26px;
color:#555555;
">

<strong>Importante:</strong>

<br><br>

La cuenta empresarial no ha sido eliminada ni suspendida.

<br><br>

Solo es necesario corregir la documentación requerida para continuar con el proceso de aprobación.

</p>

</td>

</tr>

</table>

<p style="
margin-top:35px;
color:#555555;
font-size:16px;
line-height:28px;
">
Si tienes dudas sobre el proceso de validación, puedes comunicarte con nuestro equipo de soporte.
</p>

<p style="
margin-top:30px;
font-size:15px;
color:#333333;
">
Atentamente,
<br>
<strong style="color:#6D0F2D;">
Equipo Rehni Market
</strong>
</p>

</td>

</tr>

<tr>

<td
style="
background:#F2F2F2;
padding:30px;
text-align:center;
"
>

<p style="
margin:0;
font-size:14px;
color:#777777;
">
© 2026 Rehni Market
</p>

<p style="
margin-top:10px;
font-size:13px;
color:#999999;
line-height:22px;
">
Marketplace para empresas y clientes.
</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
"""

    send_email(
        to_email,
        subject,
        body,
    )