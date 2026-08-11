
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("ERROR GLOBAL AXIOS:", error);
    console.log("ERROR RESPONSE:", error.response?.data);
    handleApiError(error);
    return Promise.reject(error);
  },
);

setupAuthInterceptor(api);

