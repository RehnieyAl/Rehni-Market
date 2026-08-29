import axios from "axios";

import { showGlobalAlert } from "@/shared/components/alert/alertManager";
import { getAccessToken, redirectToLoginWithMessage } from "@/api/session";
import { ErrorCode } from "@/shared/types/ErrorCode";

// Códigos de "esta cuenta ya no puede usar el sistema"; el backend los devuelve aunque el JWT siga válido.
const ACCOUNT_BLOCKED_CODES: string[] = [
  ErrorCode.USER_BLOCKED,
  ErrorCode.COMPANY_SUSPENDED,
];

// Empresa suspendida: si el backend adjunta el motivo (`detail.reason`), se
// muestra debajo del mensaje. AlertMessage usa `whitespace-pre-line`, así que
// los saltos de línea se respetan.
// PENDIENTE BACKEND: hoy AuthMiddleware.py / LoginService.py / RefreshTokenService.py
// emiten COMPANY_SUSPENDED sin `reason`. Basta con
// `api_error(403, ErrorCodes.COMPANY_SUSPENDED, "...", extra={"reason": company.suspension_reason})`
// (la columna Company.suspension_reason ya existe).
function buildSuspensionMessage(detail: {
  code?: string;
  message?: string;
  reason?: unknown;
}): string {
  const base = detail.message || "Tu empresa se encuentra suspendida.";
  const reason = typeof detail.reason === "string" ? detail.reason.trim() : "";

  return reason ? `${base}\n\nRazón:\n${reason}` : base;
}

export function handleApiError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    showGlobalAlert("error", "Ocurrió un error inesperado.");
    return;
  }

  const detail = error.response?.data?.detail;
  const message = detail?.message;

  const resolvedMessage =
    detail?.code === ErrorCode.COMPANY_SUSPENDED
      ? buildSuspensionMessage(detail)
      : message;

  // Con sesión iniciada (hay accessToken): se invalida la sesión y se vuelve a /login con el mensaje de bloqueo.
  // Sin accessToken el código viene del propio login de una cuenta bloqueada: solo se muestra el mensaje.
  if (
    detail?.code &&
    ACCOUNT_BLOCKED_CODES.includes(detail.code) &&
    getAccessToken()
  ) {
    redirectToLoginWithMessage(resolvedMessage || "Tu cuenta se encuentra bloqueada.");
    return;
  }

  if (resolvedMessage) {
    showGlobalAlert("error", resolvedMessage);
    return;
  }

  showGlobalAlert("error", "Ocurrió un error al procesar la solicitud.");
}
