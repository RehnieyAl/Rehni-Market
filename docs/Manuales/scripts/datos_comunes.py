"""Datos de portada y de contacto que comparten los dos manuales.

Los valores entre [VERIFICAR: …] aún no están confirmados: se resaltan en
amarillo en el .docx y se listan en docs/Manuales/lista-imagenes.md.
"""

VERSION = "3.0"
FECHA = "6 de noviembre de 2026"
FECHA_CORTA = "06/11/2026"

PORTADA = {
    "centro": "[VERIFICAR: centro de formación]",
    "programa": "Tecnólogo en Análisis y Desarrollo de Software",
    "ficha": "[VERIFICAR: número de ficha]",
    "competencia": "[VERIFICAR: nombre de la competencia]",
    "instructor": "[VERIFICAR: nombre del instructor]",
    "autor": "Yeinher Algarin",
    "version": VERSION,
    "fecha": FECHA,
}

SOPORTE = {
    "correo": "[VERIFICAR: correo de soporte]",
    "whatsapp": ("el número configurado en `VITE_REHNIMARKET_WHATSAPP` (web) y "
                 "`EXPO_PUBLIC_REHNIMARKET_WHATSAPP` (móvil); se usa para las recargas de RehniCoin "
                 "[VERIFICAR: número de WhatsApp que se publica, o «no aplica» para soporte]"),
    "horario": "lunes a viernes, de 8:00 a 17:00 (hora de Colombia), excepto festivos",
    "issues": "https://github.com/RehnieyAl/Rehni-Market/issues",
    "url_produccion": "[VERIFICAR: URL de producción, https://<dominio>]",
    "url_api_produccion": "[VERIFICAR: URL de la API en producción, https://api.<dominio>]",
}

CONTROL_VERSIONES = [
    ("1.0", "31/08/2026", "Yeinher Algarin", "Versión inicial."),
    ("2.0", "30/10/2026", "Yeinher Algarin",
     "Reestructuración según la guía FAVA-SENA y actualización contra la API 2.6.0."),
    (VERSION, FECHA_CORTA, "Yeinher Algarin",
     "Actualización contra el código de develop: paneles Inicio, Ofertas y Novedades, "
     "HTTPS con Caddy en dos dominios, SMTP configurable, despliegue en Oracle Cloud, "
     "validaciones en vivo, diagramas por rol y generación desde docs/Manuales/scripts."),
]
