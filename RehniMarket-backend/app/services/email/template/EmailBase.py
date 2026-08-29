"""Helpers HTML compartidos por los correos de pedidos (EmailOrder.py). Reproducen
el mismo diseño de marca que los templates existentes, factorizado en funciones."""

from decimal import Decimal


# "$" + separador de miles con punto, sin decimales (igual que formatPrice.ts).
def format_price(value: Decimal | float | int) -> str:
    amount = int(round(float(value)))
    return f"${amount:,.0f}".replace(",", ".")


def email_wrapper(subtitle: str, content_html: str, page_title: str | None = None) -> str:
    """Envuelve `content_html` con el header/footer de marca. `subtitle` es el texto
    bajo "Rehni Market" en el header."""

    title = page_title or subtitle

    return f"""
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | Rehni Market</title>
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
{subtitle}
</p>

</td>

</tr>

<!-- CONTENT -->

<tr>

<td style="padding:45px;">

{content_html}

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


def signature_html(closing: str = "Saludos") -> str:
    return f"""
<p style="
margin-top:30px;
font-size:15px;
color:#333333;
">
{closing},
<br>
<strong style="color:#6D0F2D;">
Equipo Rehni Market
</strong>
</p>
"""


def info_box(inner_html: str, warning: bool = False) -> str:
    style = (
        "background:#FFF6F8;border-radius:12px;border:1px solid #F2D4DE;"
        if warning
        else "background:#F8F8F8;border-radius:12px;"
    )

    return f"""
<table
width="100%"
cellpadding="0"
cellspacing="0"
style="margin-top:35px;{style}"
>
<tr>
<td style="padding:20px;">
<div style="
font-size:15px;
line-height:28px;
color:#555555;
">
{inner_html}
</div>
</td>
</tr>
</table>
"""


def label_value_rows(pairs: list[tuple[str, str]]) -> str:
    rows = "".join(
        f"""
<tr>
<td style="padding:6px 0;font-size:15px;color:#777777;">{label}</td>
<td align="right" style="padding:6px 0;font-size:15px;color:#222222;font-weight:bold;">{value}</td>
</tr>
"""
        for label, value in pairs
    )

    return f"""
<table width="100%" cellpadding="0" cellspacing="0">
{rows}
</table>
"""


def cta_button(text: str, href: str) -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
<tr>
<td align="center">
<a
href="{href}"
style="
display:inline-block;
background:#6D0F2D;
color:#ffffff;
text-decoration:none;
font-size:16px;
font-weight:bold;
padding:16px 36px;
border-radius:14px;
"
>
{text}
</a>
</td>
</tr>
</table>
"""


def product_row_html(
    image_url: str | None,
    name: str,
    variant_name: str | None,
    quantity: int,
    unit_price: Decimal,
    subtotal: Decimal,
) -> str:
    if image_url:
        image_html = f"""
<img
src="{image_url}"
width="48"
height="48"
alt=""
style="display:block;border-radius:10px;object-fit:cover;"
>
"""
    else:
        # Sin imagen real: placeholder visual, nunca una URL inventada.
        image_html = """
<table width="48" height="48" cellpadding="0" cellspacing="0" style="background:#F0F0F0;border-radius:10px;">
<tr><td></td></tr>
</table>
"""

    variant_html = (
        f'<div style="font-size:13px;color:#999999;margin-top:2px;">Variante: {variant_name}</div>'
        if variant_name
        else ""
    )

    return f"""
<tr>
<td style="padding:14px 0;border-bottom:1px solid #F0F0F0;">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="width:58px;vertical-align:top;">{image_html}</td>
<td style="vertical-align:top;">
<div style="font-size:14px;color:#222222;font-weight:bold;">{name}</div>
{variant_html}
</td>
</tr>
</table>
</td>
<td align="center" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#555555;">
{quantity}
</td>
<td align="right" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#555555;">
{format_price(unit_price)}
</td>
<td align="right" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#222222;font-weight:bold;">
{format_price(subtotal)}
</td>
</tr>
"""


def products_summary_list_html(items: list[dict]) -> str:
    """
    Versión compacta de la tabla de productos (ver EmailOrder.py >
    "Resumen de productos" en los correos de cambio de estado) - a
    diferencia de products_table_html (tabla completa con precio
    unitario/subtotal, usada solo en el correo de "Pedido creado"), acá
    solo se lista qué y cuánto, sin repetir todos los precios.
    """

    rows = "".join(
        f"""
<tr>
<td style="padding:6px 0;font-size:14px;color:#555555;">
{item["quantity"]} × {item["name"]}{f" ({item['variant_name']})" if item.get("variant_name") else ""}
</td>
<td align="right" style="padding:6px 0;font-size:14px;color:#222222;font-weight:bold;">
{format_price(item["subtotal"])}
</td>
</tr>
"""
        for item in items
    )

    return f"""
<table width="100%" cellpadding="0" cellspacing="0">
{rows}
</table>
"""


def products_table_html(rows_html: str) -> str:
    header_style = "padding:10px 0;border-bottom:2px solid #E5E5E5;font-size:12px;color:#999999;text-transform:uppercase;letter-spacing:.5px;"

    return f"""
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px;border-collapse:collapse;">
<tr>
<td style="{header_style}">Producto</td>
<td align="center" style="{header_style}">Cant.</td>
<td align="right" style="{header_style}">Precio unit.</td>
<td align="right" style="{header_style}">Subtotal</td>
</tr>
{rows_html}
</table>
"""
