/** Interceptor de respuestas: renueva el access token una vez ante un 401 y, si no se puede, da la
 * sesión por expirada (la app decide si el usuario sigue como visitante o va al login). */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  expireSession,
  getRefreshToken,
  saveTokens,
} from "./session";
import { ErrorCode } from "@/shared/types/ErrorCode";

const ACCOUNT_BLOCKED_CODES: string[] = [
  ErrorCode.USER_BLOCKED,
  ErrorCode.COMPANY_SUSPENDED,
];

export const setupAuthInterceptor = (
  api: AxiosInstance,
) => {
  api.interceptors.response.use(
    (response) => {
      return response;
    },

    async (error: AxiosError) => {
      const originalRequest =
        error.config as
          | (InternalAxiosRequestConfig & {
              _retry?: boolean;
            })
          | undefined;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      if (
        originalRequest.url?.includes(
          "/auth/refresh",
        )
      ) {
        expireSession();

        return Promise.reject(error);
      }

      if (
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        expireSession();

        return Promise.reject(error);
      }

      const refreshToken =
        getRefreshToken();

      if (!refreshToken) {
        expireSession();

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const response =
          await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            {
              refresh_token:
                refreshToken,
            },
          );

        const {
          access_token,
          refresh_token,
        } = response.data;

        saveTokens(
          access_token,
          refresh_token,
        );

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${access_token}`,
        );

        return api(
          originalRequest,
        );

      } catch (refreshError) {
        console.error(
          "Falló la renovación:",
          refreshError,
        );

        const detail =
          axios.isAxiosError(refreshError) &&
          refreshError.response?.data?.detail;

        if (
          detail &&
          detail.code &&
          ACCOUNT_BLOCKED_CODES.includes(detail.code)
        ) {
          expireSession(
            detail.message ||
              "Tu cuenta se encuentra bloqueada.",
          );
        } else {
          expireSession();
        }

        return Promise.reject(
          refreshError,
        );
      }
    },
  );
};
