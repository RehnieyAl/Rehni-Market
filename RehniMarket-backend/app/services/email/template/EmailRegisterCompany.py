from app.services.email.EmailService import send_email


def EmailRegisterCompany(
    to_email: str,
    company_name: str,
    code: str
):

    subject = "Registro empresarial recibido - Verifica tu correo | Rehni Market"

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
box-shadow:0 8px:30px rgba(0,0,0,.08);
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

Registro empresarial

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

¡Empresa registrada!

</h2>



<p style="
margin-top:25px;
color:#555555;
font-size:16px;
line-height:28px;
">

Hola,

<strong style="color:#6D0F2D;">
{company_name}
</strong>.

</p>



<p style="
color:#555555;
font-size:16px;
line-height:28px;
">

Tu empresa fue registrada correctamente en
<strong style="color:#6D0F2D;">
Rehni Market
</strong>.

Para continuar con el proceso empresarial debes verificar el correo electrónico asociado a tu cuenta.

</p>



<p style="
color:#555555;
font-size:16px;
line-height:28px;
">

Ingresa el siguiente código de verificación en la aplicación:

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

Este código expirará en
<strong>10 minutos</strong>.

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

<strong>Proceso de activación empresarial:</strong>

<br><br>

✓ Registro de empresa recibido

<br>

✓ Verificación del correo electrónico

<br>

✓ Validación de documentos enviados

<br>

✓ Activación de cuenta empresarial


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

Después de verificar tu correo, nuestro equipo realizará la revisión de la información empresarial.

El proceso de activación puede tardar hasta
<strong>
3 días hábiles
</strong>.
 
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

Nunca compartas este código.
El equipo de Rehni Market nunca solicitará códigos de verificación por correo, teléfono o mensajes.

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

Si no realizaste este registro empresarial, puedes ignorar este correo de forma segura.

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
        body
    )