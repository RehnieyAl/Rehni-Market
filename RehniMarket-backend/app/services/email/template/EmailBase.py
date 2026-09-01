"""Bloques HTML compartidos por todos los correos de Rehni Market. El diseño de
referencia es el correo de verificación de cuenta: tarjeta blanca centrada de
600px, cabecera vinotinto (#6D0F2D), cuerpo gris y pie de página. Cada template
arma su contenido con estos helpers y lo envuelve con `email_wrapper`."""

import html
from decimal import Decimal

BRAND = "#6D0F2D"
BRAND_SOFT = "#f3dbe4"
TEXT_TITLE = "#222222"
TEXT_BODY = "#555555"
TEXT_MUTED = "#666666"
TEXT_FOOTER = "#777777"
BG_PAGE = "#f4f4f4"
BG_SOFT = "#F8F8F8"
BG_WARN = "#FFF6F8"
BORDER_WARN = "#F2D4DE"
BG_FOOTER = "#F2F2F2"
FONT = "Arial, Helvetica, sans-serif"


def _esc(value) -> str:
    return html.escape(str(value), quote=False)


def format_price(value: Decimal | float | int) -> str:
    amount = int(round(float(value)))
    return f"${amount:,.0f}".replace(",", ".")


def email_wrapper(subtitle: str, content_html: str, page_title: str | None = None) -> str:
    """Envuelve `content_html` con la cabecera/pie de marca. `subtitle` es el
    texto bajo "Rehni Market" en la cabecera. `content_html` ya es HTML de
    confianza construido con los helpers de este módulo."""

    title = _esc(page_title or subtitle)
    subtitle_html = _esc(subtitle)

    return f"""\
<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>{title} | Rehni Market</title>
<!--[if mso]>
<style>
table,td,div,p,a,h1,h2,h3{{font-family:Arial,Helvetica,sans-serif !important;}}
</style>
<![endif]-->
<style>
  body,table,td,div,p,a,h1,h2,h3{{font-family:{FONT};}}
  .rm-break{{word-break:break-word;overflow-wrap:break-word;}}
  @media only screen and (max-width:620px){{
    .rm-card{{width:100% !important;border-radius:0 !important;}}
    .rm-body{{padding:32px 24px !important;}}
    .rm-header{{padding:34px 24px !important;}}
    .rm-code{{font-size:30px !important;letter-spacing:8px !important;padding:18px 22px !important;}}
  }}
</style>
</head>

<body style="margin:0;padding:0;background:{BG_PAGE};font-family:{FONT};">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{BG_PAGE};">
<tr>
<td align="center" style="padding:40px 12px;">

<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="rm-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">

<tr>
<td class="rm-header" align="center" style="background:{BRAND};padding:40px;">
<h1 style="margin:0;color:#ffffff;font-size:34px;font-weight:bold;font-family:{FONT};">Rehni Market</h1>
<p style="margin:15px 0 0;color:{BRAND_SOFT};font-size:17px;font-family:{FONT};">{subtitle_html}</p>
</td>
</tr>

<tr>
<td class="rm-body" style="padding:45px;font-family:{FONT};color:{TEXT_BODY};">
{content_html}
</td>
</tr>

<tr>
<td style="background:{BG_FOOTER};padding:30px;text-align:center;">
<p style="margin:0;font-size:14px;color:{TEXT_FOOTER};font-family:{FONT};">&copy; 2026 Rehni Market</p>
<p style="margin:10px 0 0;font-size:13px;color:#999999;line-height:22px;font-family:{FONT};">
Marketplace para empresas y clientes.<br>
Este es un mensaje automático, por favor no respondas a este correo.
</p>
</td>
</tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->

</td>
</tr>
</table>

</body>
</html>
"""


def heading_html(text: str) -> str:
    return (
        f'<h2 style="margin:0;color:{TEXT_TITLE};font-size:26px;line-height:34px;'
        f'font-family:{FONT};">{_esc(text)}</h2>'
    )


def subheading_html(text: str) -> str:
    return (
        f'<h3 style="margin:32px 0 8px;color:{TEXT_TITLE};font-size:18px;'
        f'font-family:{FONT};">{_esc(text)}</h3>'
    )


def paragraph_html(text_html: str, *, muted: bool = False, center: bool = False) -> str:
    """`text_html` es HTML de confianza (puede traer <strong>). Los datos
    dinámicos deben escaparse por el llamador con `escape` o usando
    `greeting_html`."""

    color = TEXT_MUTED if muted else TEXT_BODY
    align = "text-align:center;" if center else ""

    return (
        f'<p class="rm-break" style="margin:20px 0 0;color:{color};font-size:16px;'
        f'line-height:28px;{align}font-family:{FONT};">{text_html}</p>'
    )


def greeting_html(name: str) -> str:
    return (
        f'<p class="rm-break" style="margin:20px 0 0;color:{TEXT_BODY};font-size:16px;'
        f'line-height:28px;font-family:{FONT};">Hola '
        f'<strong style="color:{BRAND};">{_esc(name)}</strong>,</p>'
    )


def escape(value) -> str:
    """Escape de datos dinámicos para insertarlos dentro de `paragraph_html`."""
    return _esc(value)


def code_block(code: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 0;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="rm-code" align="center" style="background:{BRAND};padding:20px 40px;border-radius:16px;font-size:38px;font-weight:bold;letter-spacing:12px;color:#ffffff;font-family:{FONT};">
{_esc(code)}
</td>
</tr>
</table>
</td>
</tr>
</table>
"""


def signature_html(closing: str = "Saludos") -> str:
    return f"""
<p style="margin:32px 0 0;font-size:15px;color:#333333;font-family:{FONT};">
{_esc(closing)},
<br>
<strong style="color:{BRAND};">Equipo Rehni Market</strong>
</p>
"""


def info_box(inner_html: str, warning: bool = False) -> str:
    style = (
        f"background:{BG_WARN};border-radius:12px;border:1px solid {BORDER_WARN};"
        if warning
        else f"background:{BG_SOFT};border-radius:12px;"
    )

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;{style}">
<tr>
<td style="padding:20px;">
<div class="rm-break" style="font-size:15px;line-height:26px;color:{TEXT_BODY};font-family:{FONT};">
{inner_html}
</div>
</td>
</tr>
</table>
"""


def bullet_list_html(items: list[str]) -> str:
    rows = "".join(
        f'<tr><td style="padding:4px 0;font-size:15px;line-height:24px;color:{TEXT_BODY};'
        f'font-family:{FONT};" class="rm-break">&bull;&nbsp;&nbsp;{_esc(item)}</td></tr>'
        for item in items
    )

    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'border="0" style="margin:20px 0 0;">{rows}</table>'
    )


def label_value_rows(pairs: list[tuple[str, str]]) -> str:
    rows = "".join(
        f"""
<tr>
<td style="padding:6px 12px 6px 0;font-size:15px;color:{TEXT_FOOTER};font-family:{FONT};vertical-align:top;">{_esc(label)}</td>
<td align="right" class="rm-break" style="padding:6px 0;font-size:15px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};vertical-align:top;">{_esc(value)}</td>
</tr>
"""
        for label, value in pairs
    )

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
{rows}
</table>
"""


def cta_button(text: str, href: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;">
<tr>
<td align="center">
<a href="{html.escape(href, quote=True)}" style="display:inline-block;background:{BRAND};color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:14px;font-family:{FONT};">
{_esc(text)}
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
<img src="{html.escape(image_url, quote=True)}" width="48" height="48" alt="" style="display:block;border-radius:10px;">
"""
    else:
        image_html = """
<table role="presentation" width="48" height="48" cellpadding="0" cellspacing="0" border="0" style="background:#F0F0F0;border-radius:10px;">
<tr><td>&nbsp;</td></tr>
</table>
"""

    variant_html = (
        f'<div style="font-size:13px;color:#999999;margin-top:2px;">Variante: {_esc(variant_name)}</div>'
        if variant_name
        else ""
    )

    return f"""
<tr>
<td style="padding:14px 0;border-bottom:1px solid #F0F0F0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="width:58px;vertical-align:top;">{image_html}</td>
<td class="rm-break" style="vertical-align:top;font-size:14px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};">
{_esc(name)}
{variant_html}
</td>
</tr>
</table>
</td>
<td align="center" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:{TEXT_BODY};font-family:{FONT};">
{quantity}
</td>
<td align="right" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:{TEXT_BODY};font-family:{FONT};">
{format_price(unit_price)}
</td>
<td align="right" style="padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};">
{format_price(subtotal)}
</td>
</tr>
"""


def products_summary_list_html(items: list[dict]) -> str:
    """Versión compacta de la tabla de productos (correos de cambio de estado):
    solo qué y cuánto, sin repetir precios unitarios."""

    rows = "".join(
        f"""
<tr>
<td class="rm-break" style="padding:6px 12px 6px 0;font-size:14px;color:{TEXT_BODY};font-family:{FONT};">
{item["quantity"]} &times; {_esc(item["name"])}{f" ({_esc(item['variant_name'])})" if item.get("variant_name") else ""}
</td>
<td align="right" style="padding:6px 0;font-size:14px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};">
{format_price(item["subtotal"])}
</td>
</tr>
"""
        for item in items
    )

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
{rows}
</table>
"""


def products_table_html(rows_html: str) -> str:
    header_style = (
        f"padding:10px 0;border-bottom:2px solid #E5E5E5;font-size:12px;color:#999999;"
        f"text-transform:uppercase;letter-spacing:.5px;font-family:{FONT};"
    )

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:15px;border-collapse:collapse;">
<tr>
<td style="{header_style}">Producto</td>
<td align="center" style="{header_style}">Cant.</td>
<td align="right" style="{header_style}">Precio unit.</td>
<td align="right" style="{header_style}">Subtotal</td>
</tr>
{rows_html}
</table>
"""
