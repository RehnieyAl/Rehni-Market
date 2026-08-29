import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  getRefreshToken,
  saveTokens,
  redirectToLogin,
  redirectToLoginWithMessage,
} from "./session";
import { ErrorCode } from "@/shared/types/ErrorCode";

// Una cuenta bloqueada/suspendida no debe recuperar sesión vía refresh, ni mostrarse como "sesión expirada".
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
        redirectToLogin();

        return Promise.reject(error);
      }

      if (
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        redirectToLogin();

        return Promise.reject(error);
      }

      const refreshToken =
        getRefreshToken();

      if (!refreshToken) {
        redirectToLogin();

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
          redirectToLoginWithMessage(
            detail.message ||
              "Tu cuenta se encuentra bloqueada.",
          );
        } else {
          redirectToLogin();
        }

        return Promise.reject(
          refreshError,
        );
      }
    },
  );
};
