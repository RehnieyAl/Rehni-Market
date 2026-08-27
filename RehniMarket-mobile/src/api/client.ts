import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";

import { env } from "@/config/env";
import { ErrorCode } from "@/types/ErrorCode";
import type { TokenResponse } from "@/types/auth";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
  setPendingSessionMessage,
} from "./session";

// Cliente HTTP único de la app (ver Fase 4 - un solo `api`, cada
// *Service.ts de src/api/ lo importa, ninguno crea su propia instancia de
// axios). Espejo funcional de RehniMarket-frontend/src/api/Client.ts +
// setupAuthInterceptor.ts, adaptado a RN:
//   - el token sale de SecureStore (async) en vez de localStorage (sync);
//   - no hay `window.location.href` - la redirección a /login se hace con
//     el router de Expo Router, importado de forma imperativa (soportado
//     fuera del árbol de React, ver docs.expo.dev/router - useRouter no
//     está disponible acá porque este archivo no es un componente).
export const api = axios.create({
  baseURL: env.apiUrl,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Mismos códigos que la web (ver ErrorCode.ts) - una cuenta bloqueada o
// una empresa suspendida no debe recuperar sesión vía refresh, y ese
// rechazo no debe leerse como "sesión expirada" (ver
// AuthMiddleware.py/RefreshTokenService.py, misma regla del lado
// backend).
const ACCOUNT_BLOCKED_CODES: string[] = [ErrorCode.USER_BLOCKED, ErrorCode.COMPANY_SUSPENDED];

// Evita disparar POST /auth/refresh una vez por cada request que reciba
// 401 al mismo tiempo (ver Fase 3 > REFRESH TOKEN > "evitar múltiples
// refresh simultáneos innecesarios") - la web no lo necesitaba tanto
// porque cada tab es un proceso aislado, pero acá varias pantallas pueden
// disparar requests en paralelo (p. ej. Promise.all en CheckoutView) que
// expiran todas juntas. Todas las llamadas concurrentes esperan la MISMA
// promesa; la primera que resuelve reintenta todas.
let refreshPromise: Promise<TokenResponse> | null = null;

function performRefresh(refreshToken: string): Promise<TokenResponse> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<TokenResponse>(`${env.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function redirectToLogin(message?: string) {
  await clearSession();

  setPendingSessionMessage(message ?? "Tu sesión ha expirado. Inicia sesión nuevamente.");

  // Mismo motivo que RequireAuth.tsx en la web: quien vea este mensaje es
  // el AuthProvider/pantalla de login (Fase 3), leyendo
  // consumePendingSessionMessage() al montar.
  router.replace("/(auth)/login");
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<{ detail?: { code?: string; message?: string } }>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      await redirectToLogin();
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await redirectToLogin();
      return Promise.reject(error);
    }

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const data = await performRefresh(refreshToken);

      await saveSession(data.access_token, data.refresh_token, data.role);

      originalRequest.headers.set("Authorization", `Bearer ${data.access_token}`);

      return api(originalRequest);
    } catch (refreshError) {
      const detail = axios.isAxiosError(refreshError)
        ? refreshError.response?.data?.detail
        : undefined;

      if (detail?.code && ACCOUNT_BLOCKED_CODES.includes(detail.code)) {
        await redirectToLogin(detail.message ?? "Tu cuenta se encuentra bloqueada.");
      } else {
        await redirectToLogin();
      }

      return Promise.reject(refreshError);
    }
  },
);
