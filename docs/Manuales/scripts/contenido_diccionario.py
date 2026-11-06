"""Contenido propio del Diccionario de datos de RehniMarket. Las tablas, columnas y restricciones
salen de datos/esquema.json (base en ejecución) y las descripciones de datos/descripciones-tablas.json.
"""

INTRO = [
    ("p", "Este documento describe la base de datos de RehniMarket tal como existe en la revisión de Alembic "
          "c3e5a7f9d1b2 (API 2.6.0). Complementa el numeral 5 del Manual técnico. Sigue el formato de la guía "
          "FAVA-SENA «Manuales técnicos de la aplicación»."),
]

INTRODUCCION = [
    ("p", "La base de datos es PostgreSQL 17 y se administra con Alembic (RehniMarket-backend/alembic/). Los "
          "modelos SQLAlchemy que la definen están en RehniMarket-backend/app/models/. El contenido de este "
          "documento se extrajo de la base en ejecución con docs/Manuales/scripts/extraer_datos.py; ante cualquier "
          "diferencia, la autoridad son las migraciones."),
    ("sub", "Convenciones de nombres"),
    ("ul", ["Las tablas usan nombres en inglés, en minúscula y en plural con guion bajo (order_items), salvo "
            "algunas heredadas en singular (company, catalog) y refreshToken, que conserva mayúsculas y se debe "
            "escribir entre comillas en SQL.",
            "Las llaves primarias se llaman id y son de tipo uuid; las foráneas terminan en _id y apuntan al id de "
            "la tabla referenciada.",
            "Las fechas usan timestamp with time zone (timestamptz) o timestamp, con los sufijos _at (created_at, "
            "updated_at, deleted_at).",
            "Los valores de dinero usan numeric con dos decimales: 1 RehniCoin equivale a 1 peso colombiano.",
            "Los estados usan tipos enumerados de PostgreSQL (numeral 4).",
            "Algunas columnas antiguas de las tablas users y company usan mayúscula inicial (isActive, "
            "CompanyStatus, nameCompany)."]),
    ("sub", "Cómo leer las tablas"),
    ("tabla", ["Columna", "Significado"], [
        ["Campo", "Nombre de la columna en la base de datos."],
        ["Tipo", "Tipo de dato de PostgreSQL; varchar(n) indica el largo máximo."],
        ["Nulo", "«Sí» si la columna admite valores nulos."],
        ["Llave", "PK: llave primaria. FK → tabla: llave foránea y la tabla a la que apunta. UK: valor único."],
        ["Restricciones", "Valor por defecto (default), restricciones UNIQUE (también índices únicos parciales), "
                          "CHECK y la regla ON DELETE de las llaves foráneas."],
        ["Descripción", "Uso de la columna en la aplicación."],
    ], [3.0, 8.8]),
]

# Significado de los valores de cada tipo enumerado
ENUMS = {
    "admin_activity_action": ("Acción registrada en la bitácora administrativa (admin_activities).", {
        "user_created": "Se creó un usuario.", "user_updated": "Se editaron los datos de un usuario.",
        "user_upgraded": "Se cambió el rol de un usuario.", "user_blocked": "Se bloqueó un usuario.",
        "user_unblocked": "Se desbloqueó un usuario.",
        "user_deleted": "Se eliminó un usuario (reservado: no hay endpoint que lo use).",
        "company_created": "Se creó una empresa.", "company_approved": "Se aprobó el certificado de una empresa.",
        "company_rejected": "Se rechazó una empresa o se marcó su certificado como inválido.",
        "company_blocked": "Se suspendió una empresa.", "company_unblocked": "Se reactivó una empresa."}),
    "advertisementtargettype": ("Tipo de destino de un anuncio del carrusel (advertisements.target_type).", {
        "PRODUCT": "Producto específico.", "CATEGORY": "Categoría, con descuento mínimo opcional.",
        "COMPANY": "Perfil público de una empresa.", "PROMOTION": "Productos con un descuento mínimo.",
        "BLACK_FRIDAY": "Campaña Black Friday (descuento mínimo).",
        "CYBER_DAYS": "Campaña Cyber Days (descuento mínimo).",
        "LIQUIDATION": "Liquidación: descuento mínimo y/o stock máximo.",
        "NEW_RELEASE": "Nuevos lanzamientos: productos creados en los últimos días."}),
    "bankaccounttypeenum": ("Tipo de cuenta bancaria de una empresa (company_bank_accounts).", {
        "SAVINGS": "Cuenta de ahorros.", "CHECKING": "Cuenta corriente.", "NEQUI": "Billetera Nequi.",
        "DAVIPLATA": "Billetera Daviplata."}),
    "companycertificateenum": ("Estado del certificado de Cámara de Comercio (company.CompanyCertificateStatus).", {
        "PENDING": "En revisión; la empresa no puede iniciar sesión.", "APPROVED": "Aprobado; la empresa opera.",
        "REJECTED": "Rechazada; solo un administrador puede intervenir.",
        "NEEDS_UPDATE": "Certificado inválido; la empresa debe subir uno nuevo."}),
    "orderstatusenum": ("Estado de un pedido (orders.status).", {
        "PENDING": "Pendiente.", "PAID": "Pagado con RehniCoin.", "PROCESSING": "En preparación por la empresa.",
        "SHIPPED": "Enviado con transportadora y guía.", "DELIVERED": "Entregado.",
        "CANCELLED": "Cancelado y reembolsado."}),
    "payoutstatusenum": ("Estado de una liquidación (company_payouts.status).", {
        "PENDING": "Generada, pendiente de pago.", "PROCESSING": "Pago en trámite.", "PAID": "Pagada.",
        "FAILED": "El pago falló."}),
    "report_status": ("Estado de un reporte (reports.status).", {
        "PENDING": "Pendiente.", "REVIEWING": "En revisión.", "RESOLVED": "Resuelto; ya no se puede modificar.",
        "REJECTED": "Rechazado."}),
    "report_target_type": ("Objeto reportado (reports.target_type).", {
        "PRODUCT": "Un producto.", "COMPANY": "Una empresa."}),
    "return_status": ("Estado de una solicitud de devolución (return_requests.status).", {
        "PENDING": "En revisión por la empresa.", "APPROVED": "Aprobada; el valor se reembolsó en RehniCoin.",
        "REJECTED": "Rechazada con motivo."}),
    "type_code_enum": ("Tipo de código temporal enviado al correo (event_codes).", {
        "RESET_PASSWORD": "Recuperación de contraseña (vence a los 15 minutos).",
        "VERIFY_EMAIL": "Verificación del correo (vence a los 5 minutos).",
        "CHANGE_EMAIL": "Cambio del correo de la cuenta."}),
    "wallettransactiontype": ("Tipo de movimiento de la billetera (wallet_transactions.type).", {
        "RECHARGE": "Recarga hecha por un administrador.", "PURCHASE": "Pago de una compra.",
        "REFUND": "Reembolso por cancelación o devolución.", "ADJUSTMENT": "Corrección de una recarga."}),
}
