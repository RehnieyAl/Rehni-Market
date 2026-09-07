import axios from "axios";

import { showGlobalAlert } from "@/shared/components/alert/alertManager";
import { getAccessToken, redirectToLoginWithMessage } from "@/api/session";
import { ErrorCode } from "@/shared/types/ErrorCode";

const ACCOUNT_BLOCKED_CODES: string[] = [
  ErrorCode.USER_BLOCKED,
  ErrorCode.COMPANY_SUSPENDED,
];

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

  // Empresa REJECTED / certificado NEEDS_UPDATE: el login se interrumpe con estos
  // códigos y `Login.tsx` los muestra con un modal dedicado (no una alerta
  // genérica). El middleware también los devuelve en rutas del panel para el caso
  // límite de un JWT emitido antes del cambio de estado; ahí tampoco molesta.
  // `COMPANY_PENDING` sí conserva su mensaje.
  if (
    detail?.code === ErrorCode.COMPANY_REJECTED ||
    detail?.code === ErrorCode.COMPANY_CERTIFICATE_INVALID
  ) {
    return;
  }

  const resolvedMessage =
    detail?.code === ErrorCode.COMPANY_SUSPENDED
      ? buildSuspensionMessage(detail)
      : message;

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
