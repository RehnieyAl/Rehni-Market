from app.services.email.EmailService import send_email


def EmailForgotPassword(
    to_email: str,
    code: str,
    code_type
):

    subject = "Recuperación de contraseña | Rehni Market"

    body = f"""
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Recuperación de contraseña | Rehni Market</title>

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
Recuperación de contraseña
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
Recuperación de contraseña
</h2>

<p style="
margin-top:25px;
color:#555555;
font-size:16px;
line-height:28px;
">
Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta de
<strong style="color:#6D0F2D;">
Rehni Market
</strong>.
</p>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
">
Si realizaste esta solicitud, utiliza el siguiente código para verificar tu identidad y continuar con el proceso.
</p>

<!-- CODE -->

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="margin:40px 0;"
>

<tr>

<td align="center">

<div
style="
display:inline-block;
background:#6D0F2D;
padding:20px 40px;
border-radius:16px;
letter-spacing:12px;
font-size:38px;
font-weight:bold;
color:#ffffff;
font-family:Arial, Helvetica, sans-serif;
"
>
{code}
</div>

</td>

</tr>

</table>

<p style="
color:#555555;
font-size:16px;
line-height:28px;
text-align:center;
">
Por motivos de seguridad, este código será válido únicamente durante los próximos
<strong>10 minutos</strong>.
</p>

<!-- INFO -->

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

<strong>Información de la solicitud:</strong>

<br><br>

✓ Recuperación de contraseña

<br>

✓ Cuenta asociada: {to_email}

<br>

✓ Código válido por 10 minutos

</p>

</td>

</tr>

</table>

<!-- SECURITY -->

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

Por tu seguridad, nunca compartas este código con terceros.

<br><br>

El equipo de Rehni Market nunca solicitará códigos de verificación por correo electrónico, llamadas telefónicas o mensajes.

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
Si no solicitaste este cambio de contraseña, puedes ignorar este correo de forma segura. Tu cuenta permanecerá protegida y no se realizará ningún cambio.
</p>

<p style="
margin-top:35px;
color:#555555;
font-size:16px;
line-height:28px;
">
Si continúas teniendo problemas para acceder a tu cuenta, comunícate con nuestro equipo de soporte.
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
<br>
Este es un correo automático, por favor no respondas este mensaje.
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

    return send_email(
        to_email,
        subject,
        body
    )