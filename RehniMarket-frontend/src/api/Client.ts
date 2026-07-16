import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8001",
});

// Agregar automáticamente el access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Renovar el token automáticamente cuando expire
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No existe refresh token");
        }

        const response = await api.post("/auth/refresh", {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("refreshToken", refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);