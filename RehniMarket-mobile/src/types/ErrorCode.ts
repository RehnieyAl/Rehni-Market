// Espejo exacto de RehniMarket-frontend/src/shared/types/ErrorCode.ts -
// mismos códigos que ya devuelve el backend (ver app/core/ErrorCodes.py),
// no se agrega ni se quita ninguno para que el manejo de errores por
// `switch` de cada pantalla portada siga siendo válido tal cual.
export class ErrorCode {
  // ==========================
  // AUTENTICACIÓN
  // ==========================
  static readonly INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
  static readonly INVALID_TOKEN = "INVALID_TOKEN";
  static readonly TOKEN_EXPIRED = "TOKEN_EXPIRED";
  static readonly REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED";
  static readonly REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID";
  static readonly UNAUTHORIZED = "UNAUTHORIZED";
  static readonly FORBIDDEN = "FORBIDDEN";

  // ==========================
  // USUARIO
  // ==========================
  static readonly USER_NOT_FOUND = "USER_NOT_FOUND";
  static readonly EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS";
  static readonly EMAIL_ALREADY_VERIFIED = "EMAIL_ALREADY_VERIFIED";
  static readonly EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND";
  static readonly EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";
  static readonly PASSWORD_INCORRECT = "PASSWORD_INCORRECT";
  static readonly PASSWORDS_DO_NOT_MATCH = "PASSWORDS_DO_NOT_MATCH";
  static readonly ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
  static readonly USER_BLOCKED = "USER_BLOCKED";
  static readonly USER_HAS_COMPANY = "USER_HAS_COMPANY";

  // ==========================
  // VERIFICACIÓN
  // ==========================
  static readonly INVALID_CODE = "INVALID_CODE";
  static readonly CODE_EXPIRED = "CODE_EXPIRED";
  static readonly CODE_ALREADY_USED = "CODE_ALREADY_USED";
  static readonly CODE_NOT_FOUND = "CODE_NOT_FOUND";
  static readonly RESEND_COOLDOWN_ACTIVE = "RESEND_COOLDOWN_ACTIVE";

  // ==========================
  // ROLES
  // ==========================
  static readonly ROLE_NOT_FOUND = "ROLE_NOT_FOUND";
  static readonly ROLE_NOT_ASSIGNED = "ROLE_NOT_ASSIGNED";
  static readonly INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS";

  // ==========================
  // EMPRESA
  // ==========================
  static readonly COMPANY_NOT_FOUND = "COMPANY_NOT_FOUND";
  static readonly COMPANY_PENDING = "COMPANY_PENDING";
  static readonly COMPANY_APPROVED = "COMPANY_APPROVED";
  static readonly COMPANY_REJECTED = "COMPANY_REJECTED";
  static readonly COMPANY_SUSPENDED = "COMPANY_SUSPENDED";

  // ==========================
  // NIT
  // ==========================
  static readonly NIT_ALREADY_EXISTS = "NIT_ALREADY_EXISTS";

  // ==========================
  // ARCHIVOS
  // ==========================
  static readonly FILE_NOT_FOUND = "FILE_NOT_FOUND";
  static readonly FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED";
  static readonly FILE_DELETE_FAILED = "FILE_DELETE_FAILED";
  static readonly INVALID_FILE = "INVALID_FILE";

  // ==========================
  // PRODUCTOS
  // ==========================
  static readonly PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND";
  static readonly PRODUCT_ALREADY_EXISTS = "PRODUCT_ALREADY_EXISTS";
  static readonly PRODUCT_OUT_OF_STOCK = "PRODUCT_OUT_OF_STOCK";
  static readonly PRODUCT_IMAGE_NOT_FOUND = "PRODUCT_IMAGE_NOT_FOUND";

  // ==========================
  // CATÁLOGO
  // ==========================
  static readonly CATALOG_NOT_FOUND = "CATALOG_NOT_FOUND";

  // ==========================
  // VARIANTES
  // ==========================
  static readonly VARIANT_NOT_FOUND = "VARIANT_NOT_FOUND";
  static readonly VARIANT_COLOR_ALREADY_EXISTS = "VARIANT_COLOR_ALREADY_EXISTS";
  static readonly VARIANT_SPECIFICATION_NOT_FOUND = "VARIANT_SPECIFICATION_NOT_FOUND";
  static readonly VARIANT_SPECIFICATION_ALREADY_EXISTS = "VARIANT_SPECIFICATION_ALREADY_EXISTS";
  static readonly VARIANT_IMAGE_NOT_FOUND = "VARIANT_IMAGE_NOT_FOUND";
  static readonly COLOR_NOT_FOUND = "COLOR_NOT_FOUND";
  static readonly SPECIFICATION_TEMPLATE_NOT_FOUND = "SPECIFICATION_TEMPLATE_NOT_FOUND";
  static readonly SPECIFICATION_TEMPLATE_CATALOG_MISMATCH =
    "SPECIFICATION_TEMPLATE_CATALOG_MISMATCH";

  // ==========================
  // ANUNCIOS
  // ==========================
  static readonly ADVERTISEMENT_NOT_FOUND = "ADVERTISEMENT_NOT_FOUND";
  static readonly ADVERTISEMENT_IMAGE_REQUIRED = "ADVERTISEMENT_IMAGE_REQUIRED";

  // ==========================
  // CARRITO
  // ==========================
  static readonly CART_NOT_FOUND = "CART_NOT_FOUND";
  static readonly CART_ITEM_NOT_FOUND = "CART_ITEM_NOT_FOUND";
  static readonly CART_EMPTY = "CART_EMPTY";
  static readonly INVALID_QUANTITY = "INVALID_QUANTITY";
  static readonly INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK";

  // ==========================
  // PEDIDOS
  // ==========================
  static readonly ORDER_NOT_FOUND = "ORDER_NOT_FOUND";
  static readonly INVALID_ORDER_STATUS_TRANSITION = "INVALID_ORDER_STATUS_TRANSITION";

  // ==========================
  // FAVORITOS
  // ==========================
  static readonly FAVORITE_ALREADY_EXISTS = "FAVORITE_ALREADY_EXISTS";
  static readonly FAVORITE_NOT_FOUND = "FAVORITE_NOT_FOUND";

  // ==========================
  // DIRECCIONES
  // ==========================
  static readonly ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND";
  static readonly ADDRESS_REQUIRED = "ADDRESS_REQUIRED";

  // ==========================
  // BILLETERA (REHNICOIN)
  // ==========================
  static readonly WALLET_NOT_FOUND = "WALLET_NOT_FOUND";
  static readonly INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE";
  static readonly INVALID_AMOUNT = "INVALID_AMOUNT";

  // ==========================
  // RESTRICCIONES DE COMPRA
  // ==========================
  static readonly PURCHASE_NOT_ALLOWED = "PURCHASE_NOT_ALLOWED";

  // ==========================
  // RESEÑAS
  // ==========================
  static readonly REVIEW_NOT_FOUND = "REVIEW_NOT_FOUND";
  static readonly REVIEW_ALREADY_EXISTS = "REVIEW_ALREADY_EXISTS";
  static readonly REVIEW_NOT_ELIGIBLE = "REVIEW_NOT_ELIGIBLE";

  // ==========================
  // VALIDACIÓN
  // ==========================
  static readonly VALIDATION_ERROR = "VALIDATION_ERROR";
  static readonly INVALID_REQUEST = "INVALID_REQUEST";
  static readonly MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD";

  // ==========================
  // SERVIDOR
  // ==========================
  static readonly DATABASE_ERROR = "DATABASE_ERROR";
  static readonly INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
}
