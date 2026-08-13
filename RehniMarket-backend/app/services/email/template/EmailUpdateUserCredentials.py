from app.services.email.EmailService import send_email


def EmailUpdateUserCredentials(
    to_email: str,
    temporary_password: str,
):

    subject = "Actualización de credenciales | Rehni Market"

    body = f"""
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Rehni Market</title>

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

<!-- HEADER -->

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

Actualización de acceso

</p>

</td>

</tr>

<!-- CONTENT -->

<tr>

<td
style="
padding:45px;
"
>

<h2 style="
margin:0;
color:#222222;
font-size:28px;
">

Tus credenciales fueron actualizadas

</h2>

<p style="
margin-top:25px;
color:#555555;
font-size:16px;
line-height:28px;
">

Un administrador de
<strong style="color:#6D0F2D;">
Rehni Market
</strong>
ha actualizado la información de acceso asociada a tu cuenta.

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

<td
style="
padding:20px;
"
>

<p style="
margin:0;
font-size:15px;
line-height:28px;
color:#555555;
">

<strong>Correo electrónico:</strong>

<br>

{to_email}

<br><br>

<strong>Contraseña temporal:</strong>

<br>

{temporary_password}

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

Utiliza estas credenciales para iniciar sesión nuevamente en la plataforma.

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

<td
style="
padding:20px;
"
>

<p style="
margin:0;
font-size:15px;
line-height:26px;
color:#555555;
">

<strong>Importante:</strong>

<br><br>

Por seguridad, cambia tu contraseña después de iniciar sesión.

<br><br>

Si no reconoces esta actualización, comunícate con el equipo de soporte de Rehni Market.

</p>

</td>

</tr>

</table>

<p style="
margin-top:40px;
font-size:15px;
line-height:28px;
color:#666666;
">

Este correo fue enviado automáticamente como parte del proceso de actualización de credenciales.

</p>

<p style="
margin-top:30px;
font-size:15px;
color:#333333;
">

Saludos,

<br>

<strong style="color:#6D0F2D;">
Equipo Rehni Market
</strong>

</p>

</td>

</tr>

<!-- FOOTER -->

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