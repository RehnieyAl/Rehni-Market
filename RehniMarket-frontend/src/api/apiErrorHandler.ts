
import axios from "axios";

import { showGlobalAlert } from "@/shared/components/alert/alertManager";
import { getAccessToken, redirectToLoginWithMessage } from "@/api/session";
import { ErrorCode } from "@/shared/types/ErrorCode";

// Códigos de "esta cuenta ya no puede usar el sistema"; el backend los devuelve aunque el JWT siga válido.
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

  // Con sesión iniciada (hay accessToken): se invalida la sesión y se vuelve a /login con el mensaje de bloqueo.
  // Sin accessToken el código viene del propio login de una cuenta bloqueada: solo se muestra el mensaje.
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

