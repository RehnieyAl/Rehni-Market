
import axios from "axios";

import { showGlobalAlert } from "@/shared/components/alert/alertManager";
import { getAccessToken, redirectToLoginWithMessage } from "@/api/session";
import { ErrorCode } from "@/shared/types/ErrorCode";

// Códigos que significan "esta cuenta ya no puede seguir usando el
// sistema", a diferencia de un error de negocio cualquiera (ver AUDITORÍA
// de bloqueo de cuentas > diferenciar bloqueado de sin-permisos/token
// inválido/etc.). El backend los devuelve incluso cuando el JWT en uso
// todavía es válido criptográficamente, porque el middleware/refresh
// revalidan el estado real de la cuenta en cada request (ver
// AuthMiddleware.py y RefreshTokenService.py).
const ACCOUNT_BLOCKED_CODES: string[] = [
  ErrorCode.USER_BLOCKED,
  ErrorCode.COMPANY_SUSPENDED,
];

export function handleApiError(
  error: unknown,
) {
  if (!axios.isAxiosError(error)) {
    showGlobalAlert(
      "error",
      "Ocurrió un error inesperado.",
    );

    return;
  }

  const detail = error.response?.data?.detail;

  const message = detail?.message;

  // Cuenta bloqueada/suspendida detectada en medio de una sesión ya
  // iniciada (hay accessToken guardado): el JWT pudo emitirse antes del
  // bloqueo, pero la cuenta ya no puede seguir usando el sistema. No
  // basta con mostrar la alerta y dejar a la persona en la pantalla
  // protegida - hay que invalidar la sesión del lado del cliente y
  // volver a /login, igual que con un token expirado (ver
  // setupAuthInterceptor.ts), pero con el mensaje real de bloqueo en vez
  // de "sesión expirada".
  //
  // Si NO hay accessToken guardado, el mismo código puede venir del
  // intento de login (POST /auth/login-user) de una cuenta bloqueada -
  // ahí no hay sesión que limpiar ni a dónde redirigir, solo se muestra
  // el mensaje normalmente (rama de abajo).
  if (
    detail?.code &&
    ACCOUNT_BLOCKED_CODES.includes(detail.code) &&
    getAccessToken()
  ) {
    redirectToLoginWithMessage(
      message || "Tu cuenta se encuentra bloqueada.",
    );

    return;
  }

  if (message) {
    showGlobalAlert("error", message);
    return;
  }

  showGlobalAlert(
    "error",
    "Ocurrió un error al procesar la solicitud.",
  );
}

