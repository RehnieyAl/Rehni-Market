class ErrorCodes:
    # ==========================
    # AUTENTICACIÓN
    # ==========================
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED"
    REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"

    # ==========================
    # USUARIO
    # ==========================
    USER_NOT_FOUND = "USER_NOT_FOUND"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    EMAIL_ALREADY_VERIFIED = "EMAIL_ALREADY_VERIFIED"
    EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    PASSWORD_INCORRECT = "PASSWORD_INCORRECT"
    PASSWORDS_DO_NOT_MATCH = "PASSWORDS_DO_NOT_MATCH"
    ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
    USER_BLOCKED = "USER_BLOCKED"
    USER_HAS_COMPANY = "USER_HAS_COMPANY"

    # ==========================
    # VERIFICACIÓN
    # ==========================
    INVALID_CODE = "INVALID_CODE"
    CODE_EXPIRED = "CODE_EXPIRED"
    CODE_ALREADY_USED = "CODE_ALREADY_USED"
    CODE_NOT_FOUND = "CODE_NOT_FOUND"

    # ==========================
    # ROLES
    # ==========================
    ROLE_NOT_FOUND = "ROLE_NOT_FOUND"
    ROLE_NOT_ASSIGNED = "ROLE_NOT_ASSIGNED"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"

    # ==========================
    # EMPRESA
    # ==========================
    COMPANY_NOT_FOUND = "COMPANY_NOT_FOUND"
    COMPANY_PENDING = "COMPANY_PENDING"
    COMPANY_APPROVED = "COMPANY_APPROVED"
    COMPANY_REJECTED = "COMPANY_REJECTED"
    COMPANY_SUSPENDED = "COMPANY_SUSPENDED"
    

    # ==========================
    # NIT
    # ==========================
    NIT_ALREADY_EXISTS = "NIT_ALREADY_EXISTS"

    # ==========================
    # ARCHIVOS
    # ==========================
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"
    FILE_DELETE_FAILED = "FILE_DELETE_FAILED"
    INVALID_FILE = "INVALID_FILE"

    # ==========================
    # PRODUCTOS
    # ==========================
    PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND"
    PRODUCT_ALREADY_EXISTS = "PRODUCT_ALREADY_EXISTS"
    PRODUCT_OUT_OF_STOCK = "PRODUCT_OUT_OF_STOCK"
    PRODUCT_IMAGE_NOT_FOUND = "PRODUCT_IMAGE_NOT_FOUND"

    # ==========================
    # CATÁLOGO
    # ==========================
    CATALOG_NOT_FOUND = "CATALOG_NOT_FOUND"

    # ==========================
    # VARIANTES
    # ==========================
    VARIANT_NOT_FOUND = "VARIANT_NOT_FOUND"
    VARIANT_COLOR_ALREADY_EXISTS = "VARIANT_COLOR_ALREADY_EXISTS"
    VARIANT_SPECIFICATION_NOT_FOUND = "VARIANT_SPECIFICATION_NOT_FOUND"
    VARIANT_SPECIFICATION_ALREADY_EXISTS = "VARIANT_SPECIFICATION_ALREADY_EXISTS"
    VARIANT_IMAGE_NOT_FOUND = "VARIANT_IMAGE_NOT_FOUND"
    COLOR_NOT_FOUND = "COLOR_NOT_FOUND"
    SPECIFICATION_TEMPLATE_NOT_FOUND = "SPECIFICATION_TEMPLATE_NOT_FOUND"
    # La specification_template seleccionada existe, pero pertenece a un
    # catalogo distinto al del producto/variante (ver ALCANCE > punto 4:
    # "una empresa no puede utilizar una especificacion de otro catalogo").
    SPECIFICATION_TEMPLATE_CATALOG_MISMATCH = "SPECIFICATION_TEMPLATE_CATALOG_MISMATCH"

    # ==========================
    # ANUNCIOS
    # ==========================
    ADVERTISEMENT_NOT_FOUND = "ADVERTISEMENT_NOT_FOUND"
    ADVERTISEMENT_IMAGE_REQUIRED = "ADVERTISEMENT_IMAGE_REQUIRED"

    # ==========================
    # CARRITO
    # ==========================
    CART_NOT_FOUND = "CART_NOT_FOUND"
    CART_ITEM_NOT_FOUND = "CART_ITEM_NOT_FOUND"
    CART_EMPTY = "CART_EMPTY"
    INVALID_QUANTITY = "INVALID_QUANTITY"
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK"

    # ==========================
    # PEDIDOS
    # ==========================
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    INVALID_ORDER_STATUS_TRANSITION = "INVALID_ORDER_STATUS_TRANSITION"

    # ==========================
    # FAVORITOS
    # ==========================
    FAVORITE_ALREADY_EXISTS = "FAVORITE_ALREADY_EXISTS"
    FAVORITE_NOT_FOUND = "FAVORITE_NOT_FOUND"

    # ==========================
    # DIRECCIONES
    # ==========================
    ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND"
    # El checkout no tiene una dirección de entrega válida seleccionada
    # (ver ALCANCE > compra obligatoria con dirección: falta la
    # dirección, o la dirección seleccionada no tiene nombre/teléfono).
    ADDRESS_REQUIRED = "ADDRESS_REQUIRED"

    # ==========================
    # BILLETERA (REHNICOIN)
    # ==========================
    WALLET_NOT_FOUND = "WALLET_NOT_FOUND"
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE"
    INVALID_AMOUNT = "INVALID_AMOUNT"

    # ==========================
    # RESTRICCIONES DE COMPRA
    # ==========================
    PURCHASE_NOT_ALLOWED = "PURCHASE_NOT_ALLOWED"

    # ==========================
    # RESEÑAS
    # ==========================
    REVIEW_NOT_FOUND = "REVIEW_NOT_FOUND"
    REVIEW_ALREADY_EXISTS = "REVIEW_ALREADY_EXISTS"
    # El usuario no tiene un pedido propio con este producto ya entregado
    # (ver ReviewRepository.has_delivered_purchase).
    REVIEW_NOT_ELIGIBLE = "REVIEW_NOT_ELIGIBLE"

    # ==========================
    # VALIDACIÓN
    # ==========================
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"

    # ==========================
    # BASE DE DATOS
    # ==========================
    DATABASE_ERROR = "DATABASE_ERROR"

    # ==========================
    # SERVIDOR
    # ==========================
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"

    # ==========================
    # RATE LIMIT
    # ==========================
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"