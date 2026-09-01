import axios from "axios";

export interface ApiErrorDetail {
  code?: string;
  message?: string;
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
