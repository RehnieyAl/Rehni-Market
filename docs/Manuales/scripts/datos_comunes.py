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
    "horario": "lunes a viernes, de 8:00 a 17:00 (hora de Colombia), excepto festivos",
    "issues": "https://github.com/RehnieyAl/Rehni-Market/issues",
    "url_produccion": "[VERIFICAR: URL de producción, https://<dominio>]",
    "url_api_produccion": "[VERIFICAR: URL de la API en producción, https://api.<dominio>]",
}

# Quién debe suministrar cada dato [VERIFICAR: …] (se lista en docs/Manuales/lista-imagenes.md). Ninguno
# está en el repositorio: son datos institucionales o de la operación en producción.
RESPONSABLES_VERIFICAR = {
    "centro de formación": "Instructor o coordinación académica del SENA",
    "número de ficha": "Instructor o coordinación académica del SENA",
    "nombre de la competencia": "Instructor (guía de aprendizaje vigente)",
    "nombre del instructor": "Instructor o coordinación académica del SENA",
    "correo de soporte": "Responsable del proyecto (buzón de la mesa de ayuda)",
    "URL de producción": "Responsable del despliegue (dominio público en Caddy, SITE_ADDRESS)",
    "URL de la API en producción": "Responsable del despliegue (dominio público en Caddy, API_ADDRESS)",
}

CONTROL_VERSIONES = [
    ("1.0", "31/08/2026", "Yeinher Algarin", "Versión inicial."),
    ("2.0", "30/10/2026", "Yeinher Algarin",
     "Reestructuración según la guía FAVA-SENA y actualización contra la API 2.6.0."),
    (VERSION, FECHA_CORTA, "Yeinher Algarin",
     "Actualización contra el código de develop: paneles Inicio, Ofertas y Novedades, mapa de "
     "navegación con menús e iconos por perfil, validaciones en vivo y mensajes de la interfaz, "
     "HTTPS con Caddy en dos dominios, SMTP configurable, despliegue en Oracle Cloud, diagramas "
     "por rol y por módulo, y Diccionario de datos aparte. Se retira la aplicación móvil del alcance."),
]
