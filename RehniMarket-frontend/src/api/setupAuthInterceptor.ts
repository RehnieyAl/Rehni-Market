import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  getRefreshToken,
  saveTokens,
  redirectToLogin,
} from "./session";

export const setupAuthInterceptor = (
  api: AxiosInstance,
) => {
  api.interceptors.response.use(
    (response) => {
      return response;
    },

    async (error: AxiosError) => {
      console.log(
        "INTERCEPTOR:",
        error,
      );

      const originalRequest =
        error.config as
          | (InternalAxiosRequestConfig & {
              _retry?: boolean;
            })
          | undefined;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      console.log(
        "URL:",
        originalRequest.url,
      );

      console.log(
        "STATUS:",
        error.response?.status,
      );

      if (
        originalRequest.url?.includes(
          "/auth/refresh",
        )
      ) {
        console.log(
          "Falló el refresh",
        );

        redirectToLogin();

        return Promise.reject(error);
      }

      if (
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }

      console.log(
        "401 DETECTADO",
      );

      if (originalRequest._retry) {
        console.log(
          "La petición ya fue reintentada",
        );

        redirectToLogin();

        return Promise.reject(error);
      }

      const refreshToken =
        getRefreshToken();

      if (!refreshToken) {
        console.log(
          "No existe refresh token",
        );

        redirectToLogin();

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log(
          "Llamando /auth/refresh...",
        );

        const response =
          await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            {
              refresh_token:
                refreshToken,
            },
          );

        console.log(
          "Refresh exitoso:",
          response.data,
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

        console.log(
          "Access token renovado",
        );

        console.log(
          "Repitiendo petición:",
          originalRequest.url,
        );

        return api(
          originalRequest,
        );

      } catch (refreshError) {
        console.error(
          "Falló la renovación:",
          refreshError,
        );

        redirectToLogin();

        return Promise.reject(
          refreshError,
        );
      }
    },
  );
};