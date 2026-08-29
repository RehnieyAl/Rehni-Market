import axios from "axios";

// Misma forma que RehniMarket-frontend/src/api/apiErrorHandler.ts lee de
// `error.response.data.detail` (ver app/core/Exceptions.py > api_error en
// el backend, que siempre responde {detail: {code, message}}). Acá solo
// se extrae el detalle - mostrarlo es responsabilidad de cada pantalla
// (no hay todavía un toast global equivalente a AlertProvider/useAlert de
// la web; cada pantalla de Auth muestra su propio banner de error).
export interface ApiErrorDetail {
  code?: string;
  message?: string;
  // Campos extra que algunos errores adjuntan al detalle (ver
  // app/core/Exceptions.py > api_error `extra`): segundos que faltan para
  // reenviar el codigo (429 RESEND_COOLDOWN_ACTIVE) y estado de los
  // contadores en el 400 EMAIL_NOT_VERIFIED del login.
  retry_after?: number;
  expires_in?: number;
  resend_available_in?: number;
}

export function getApiErrorDetail(error: unknown): ApiErrorDetail | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return error.response?.data?.detail as ApiErrorDetail | undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorDetail(error)?.message ?? fallback;
}
