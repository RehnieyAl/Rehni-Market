// Mensaje amigable único para cualquier caso de role rechazado (login
// directo o sesión restaurada) - nunca se muestra el código de role
// técnico (ADMIN/OWNER/COMPANY/SUPPORT) al usuario final. Un solo lugar
// para no duplicar el texto entre LoginScreen y el guard raíz.
export const ROLE_REJECTED_MESSAGE =
  "Esta aplicación está disponible solo para cuentas de comprador.";
