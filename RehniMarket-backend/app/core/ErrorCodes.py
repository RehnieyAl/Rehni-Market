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