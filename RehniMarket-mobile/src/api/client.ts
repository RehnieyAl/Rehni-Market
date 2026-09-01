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

const ACCOUNT_BLOCKED_CODES: string[] = [ErrorCode.USER_BLOCKED, ErrorCode.COMPANY_SUSPENDED];

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
