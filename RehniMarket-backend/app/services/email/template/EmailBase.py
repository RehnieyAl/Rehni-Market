"""Bloques HTML compartidos por todos los correos de Rehni Market: tarjeta clara de 600 px con cabecera vinotinto,
cuerpo y pie (el diseño del correo de verificación de cuenta), tablas de presentación y estilos en línea para
Gmail y Outlook. Cada plantilla arma su contenido con estos helpers y lo envuelve con `email_wrapper`."""

import html
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import urlparse

# Colores de marca: los mismos valores que --color-primary y --color-secondary de RehniMarket-frontend/src/index.css
# (los clientes de correo no leen variables CSS). Una prueba del frontend comprueba que no se separen.
PRIMARY = "#8b0d35"
SECONDARY = "#e51d48"

TEXT_TITLE = "#222222"
TEXT_BODY = "#555555"
# Pie y textos secundarios: 5,2:1 sobre el gris del pie (el #999999 anterior no llegaba a 3:1).
TEXT_MUTED = "#666666"
BG_PAGE = "#f4f4f4"
BG_SOFT = "#f7f7f7"
BG_FOOTER = "#f2f2f2"
BORDER = "#e5e5e5"
FONT = "Arial, Helvetica, sans-serif"


def _esc(value) -> str:
    return html.escape(str(value), quote=False)


def escape(value) -> str:
    """Escape de datos dinámicos para insertarlos dentro de `paragraph_html`."""
    return _esc(value)


def format_price(value: Decimal | float | int) -> str:
    amount = int(round(float(value)))
    return f"${amount:,.0f}".replace(",", ".")


def highlight(text: str) -> str:
    return f'<strong style="color:{PRIMARY};">{_esc(text)}</strong>'


def _safe_href(href: str) -> str | None:
    """Solo enlaces HTTPS a hosts públicos: un enlace http o a localhost en un correo real es un
    enlace roto para el destinatario y una señal de spam."""

    parsed = urlparse(href or "")
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not host or host == "localhost" or host.startswith("127."):
        return None
    return href


def _contact_footer() -> str:
    from app.services.PlatformSettingsService import cached_public_contact

    contact = cached_public_contact()
    if contact is None or not (contact.email or contact.phone):
        return ""

    links = []
    if contact.email:
        links.append(
            f'<a href="mailto:{html.escape(contact.email, quote=True)}" '
            f'style="color:{PRIMARY};text-decoration:underline;">{_esc(contact.email)}</a>'
        )
    if contact.phone:
        links.append(
            f'<a href="tel:{html.escape(contact.phone, quote=True)}" '
            f'style="color:{PRIMARY};text-decoration:underline;">{_esc(contact.phone)}</a>'
        )
    return (
        f'<p class="rm-break" style="margin:0 0 10px;font-size:14px;line-height:22px;color:{TEXT_BODY};'
        f'font-family:{FONT};">¿Necesitas ayuda? {" &middot; ".join(links)}</p>'
    )


def email_wrapper(subtitle: str, content_html: str, page_title: str | None = None) -> str:
    """Envuelve `content_html` (HTML de confianza armado con estos helpers) con la cabecera de marca y el pie.
    `subtitle` es el texto bajo "Rehni Market" en la cabecera."""

    title = _esc(page_title or subtitle)
    subtitle_html = _esc(subtitle)
    year = datetime.now(timezone.utc).year

    return f"""\
<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>{title} | Rehni Market</title>
<!--[if mso]>
<style>table,td,div,p,a,h1,h2,h3{{font-family:Arial,Helvetica,sans-serif !important;}}</style>
<![endif]-->
<style>
  .rm-break{{word-break:break-word;overflow-wrap:anywhere;}}
  @media only screen and (max-width:620px){{
    .rm-card{{width:100% !important;border-radius:0 !important;}}
    .rm-header{{padding:28px 24px !important;}}
    .rm-body{{padding:28px 24px !important;}}
    .rm-footer{{padding:24px !important;}}
    .rm-code{{font-size:28px !important;letter-spacing:8px !important;padding:16px 20px !important;}}
  }}
</style>
</head>
<body style="margin:0;padding:0;width:100%;background:{BG_PAGE};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;">{subtitle_html} · Rehni Market</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG_PAGE}" style="width:100%;background:{BG_PAGE};">
<tr>
<td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="rm-card" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr>
<td class="rm-header" align="center" bgcolor="{PRIMARY}" style="background:{PRIMARY};padding:32px 40px;">
<p style="margin:0;color:#ffffff;font-size:28px;line-height:34px;font-weight:bold;font-family:{FONT};">Rehni Market</p>
<p style="margin:8px 0 0;color:#ffffff;font-size:16px;line-height:22px;font-family:{FONT};">{subtitle_html}</p>
</td>
</tr>
<tr>
<td class="rm-body rm-break" style="padding:40px;font-family:{FONT};color:{TEXT_BODY};">
{content_html}
</td>
</tr>
<tr>
<td class="rm-footer" align="center" bgcolor="{BG_FOOTER}" style="background:{BG_FOOTER};padding:28px 40px;font-family:{FONT};">
{_contact_footer()}
<p style="margin:0;font-size:13px;line-height:20px;color:{TEXT_MUTED};font-family:{FONT};">
&copy; {year} Rehni Market &middot; Marketplace para empresas y clientes.<br>
Este es un mensaje automático, no respondas a este correo.
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
        f'<h1 class="rm-break" style="margin:0;color:{TEXT_TITLE};font-size:24px;line-height:32px;'
        f'font-weight:bold;font-family:{FONT};">{_esc(text)}</h1>'
    )


def subheading_html(text: str) -> str:
    return (
        f'<h2 style="margin:28px 0 8px;color:{TEXT_TITLE};font-size:17px;line-height:24px;'
        f'font-weight:bold;font-family:{FONT};">{_esc(text)}</h2>'
    )


def paragraph_html(text_html: str, *, muted: bool = False, center: bool = False) -> str:
    """`text_html` es HTML de confianza (puede traer <strong>); los datos dinámicos se escapan antes
    con `escape` o `highlight`."""

    color = TEXT_MUTED if muted else TEXT_BODY
    size = "14px;line-height:22px" if muted else "16px;line-height:26px"
    align = "text-align:center;" if center else ""

    return (
        f'<p class="rm-break" style="margin:16px 0 0;color:{color};font-size:{size};'
        f'{align}font-family:{FONT};">{text_html}</p>'
    )


def greeting_html(name: str) -> str:
    return paragraph_html(f'Hola <strong style="color:{PRIMARY};">{_esc(name)}</strong>,')


def code_block(code: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
<tr>
<td align="center">
<p style="margin:0 0 8px;font-size:14px;line-height:20px;color:{TEXT_MUTED};font-family:{FONT};">Tu código</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="rm-code" align="center" bgcolor="{PRIMARY}" style="background:{PRIMARY};padding:18px 32px;border-radius:12px;font-size:32px;line-height:40px;font-weight:bold;letter-spacing:10px;color:#ffffff;font-family:{FONT};">{_esc(code)}</td>
</tr>
</table>
</td>
</tr>
</table>
"""


def signature_html(closing: str = "Saludos") -> str:
    return (
        f'<p style="margin:32px 0 0;font-size:15px;line-height:24px;color:{TEXT_BODY};font-family:{FONT};">'
        f'{_esc(closing)},<br><strong style="color:{PRIMARY};">Equipo Rehni Market</strong></p>'
    )


def info_box(inner_html: str, warning: bool = False) -> str:
    # El aviso se marca con una franja del rojo de marca, sin inventar fondos rosados.
    accent = f"border-left:4px solid {SECONDARY};" if warning else ""

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
<tr>
<td bgcolor="{BG_SOFT}" style="background:{BG_SOFT};border-radius:10px;padding:18px 20px;{accent}">
<div class="rm-break" style="font-size:15px;line-height:24px;color:{TEXT_BODY};font-family:{FONT};">
{inner_html}
</div>
</td>
</tr>
</table>
"""


def bullet_list_html(items: list[str]) -> str:
    rows = "".join(
        f'<tr><td class="rm-break" style="padding:4px 0;font-size:15px;line-height:24px;color:{TEXT_BODY};'
        f'font-family:{FONT};">&bull;&nbsp;&nbsp;{_esc(item)}</td></tr>'
        for item in items
    )

    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'border="0" style="margin:16px 0 0;">{rows}</table>'
    )


def label_value_rows(pairs: list[tuple[str, str]]) -> str:
    rows = "".join(
        f"""
<tr>
<td style="padding:8px 12px 8px 0;border-bottom:1px solid {BORDER};font-size:15px;line-height:22px;color:{TEXT_MUTED};font-family:{FONT};vertical-align:top;width:42%;">{_esc(label)}</td>
<td align="right" class="rm-break" style="padding:8px 0;border-bottom:1px solid {BORDER};font-size:15px;line-height:22px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};vertical-align:top;">{_esc(value)}</td>
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
    safe = _safe_href(href)
    if safe is None:
        return paragraph_html(f'<strong style="color:{TEXT_TITLE};">{_esc(text)}</strong> desde tu panel de Rehni Market.')

    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
<tr>
<td align="center">
<!--[if mso]><v:roundrect href="{html.escape(safe, quote=True)}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="{PRIMARY}" stroke="f"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">{_esc(text)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-->
<a href="{html.escape(safe, quote=True)}" style="display:inline-block;background:{PRIMARY};color:#ffffff;text-decoration:none;font-size:16px;line-height:24px;font-weight:bold;padding:12px 32px;border-radius:10px;font-family:{FONT};">{_esc(text)}</a>
<!--<![endif]-->
</td>
</tr>
</table>
"""


def product_row_html(
    name: str,
    variant_name: str | None,
    quantity: int,
    unit_price: Decimal,
    subtotal: Decimal,
) -> str:
    """Un producto del pedido en una sola columna (nombre, variante, cantidad y precio histórico);
    sin fotografía, para que el correo no dependa de imágenes externas ni se desborde en móvil."""

    variant_html = (
        f'<p class="rm-break" style="margin:2px 0 0;font-size:14px;line-height:20px;color:{TEXT_MUTED};font-family:{FONT};">'
        f"Variante: {_esc(variant_name)}</p>"
        if variant_name
        else ""
    )

    return f"""
<tr>
<td style="padding:14px 0;border-bottom:1px solid {BORDER};">
<p class="rm-break" style="margin:0;font-size:15px;line-height:22px;font-weight:bold;color:{TEXT_TITLE};font-family:{FONT};">{_esc(name)}</p>
{variant_html}
<p style="margin:6px 0 0;font-size:14px;line-height:20px;color:{TEXT_BODY};font-family:{FONT};">
{quantity} &times; {format_price(unit_price)} &middot; <strong style="color:{TEXT_TITLE};">{format_price(subtotal)}</strong>
</p>
</td>
</tr>
"""


def products_table_html(rows_html: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-top:1px solid {BORDER};">
{rows_html}
</table>
"""


def products_summary_list_html(items: list[dict]) -> str:
    """Versión compacta (correos de cambio de estado): qué, cuánto y subtotal, sin precio unitario."""

    rows = "".join(
        f"""
<tr>
<td class="rm-break" style="padding:8px 12px 8px 0;border-bottom:1px solid {BORDER};font-size:15px;line-height:22px;color:{TEXT_BODY};font-family:{FONT};">
{item["quantity"]} &times; {_esc(item["name"])}{f" ({_esc(item['variant_name'])})" if item.get("variant_name") else ""}
</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid {BORDER};font-size:15px;line-height:22px;color:{TEXT_TITLE};font-weight:bold;font-family:{FONT};white-space:nowrap;">
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
