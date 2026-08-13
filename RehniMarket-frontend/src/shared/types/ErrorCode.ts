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
  static readonly USER_HAS_COMPANY = "USER_HAS_COMPANY"

  // ==========================
  // VERIFICACIÓN
  // ==========================
  static readonly INVALID_CODE = "INVALID_CODE";
  static readonly CODE_EXPIRED = "CODE_EXPIRED";
  static readonly CODE_ALREADY_USED = "CODE_ALREADY_USED";
  static readonly CODE_NOT_FOUND = "CODE_NOT_FOUND";

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
  static readonly SPECIFICATION_TEMPLATE_CATALOG_MISMATCH = "SPECIFICATION_TEMPLATE_CATALOG_MISMATCH";

  // ==========================
  // ANUNCIOS
  // ==========================
  static readonly ADVERTISEMENT_NOT_FOUND = "ADVERTISEMENT_NOT_FOUND";
  static readonly ADVERTISEMENT_IMAGE_REQUIRED = "ADVERTISEMENT_IMAGE_REQUIRED";

  // ==========================
  // VALIDACIÓN
  // ==========================
  static readonly VALIDATION_ERROR = "VALIDATION_ERROR";
  static readonly INVALID_REQUEST = "INVALID_REQUEST";
  static readonly MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD";

  // ==========================
  // BASE DE DATOS
  // ==========================
  static readonly DATABASE_ERROR = "DATABASE_ERROR";

  // ==========================
  // SERVIDOR
  // ==========================
  static readonly INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
}

