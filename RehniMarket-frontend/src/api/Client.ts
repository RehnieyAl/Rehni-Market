
import axios from "axios";
import { getAccessToken } from "./session";
import { setupAuthInterceptor } from "./setupAuthInterceptor";
import { handleApiError } from "./apiErrorHandler";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
);

// El orden importa: setupAuthInterceptor va antes del manejo genérico de errores para que un
// 401 resuelto por el refresh no dispare la alerta global. Solo un 401 no recuperable llega a handleApiError.
setupAuthInterceptor(api);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  },
);

