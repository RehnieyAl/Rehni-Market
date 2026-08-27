
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

// Orden importa: los interceptores de response de axios se encadenan en
// el orden en que se registran (el primero corre primero sobre el
// rechazo). setupAuthInterceptor va ANTES que el manejo genérico de
// errores para que un 401 que el refresh resuelve en silencio nunca
// llegue a mostrar la alerta global: cuando el refresh funciona, su
// handler devuelve `api(originalRequest)` (una promesa RESUELTA), así
// que el interceptor de abajo la recibe por su rama `onFulfilled`
// (`(response) => response`), no por `handleApiError`. Solo si el 401 no
// es recuperable (sin refresh token, refresh fallido, ya reintentado) el
// handler de setupAuthInterceptor vuelve a rechazar la promesa, y recién
// ahí handleApiError la ve - igual que cualquier otro error (403, 404,
// 500, errores de negocio, etc., que ni pasan por la lógica de refresh:
// ver setupAuthInterceptor.ts > `if (error.response?.status !== 401)`).
setupAuthInterceptor(api);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  },
);

