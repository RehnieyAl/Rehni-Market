export const getAccessToken = () => {
  return localStorage.getItem(
    "accessToken",
  );
};

export const getRefreshToken = () => {
  return localStorage.getItem(
    "refreshToken",
  );
};

export const saveTokens = (
  accessToken: string,
  refreshToken: string,
) => {
  localStorage.setItem(
    "accessToken",
    accessToken,
  );

  localStorage.setItem(
    "refreshToken",
    refreshToken,
  );
};

export const clearTokens = () => {
  localStorage.removeItem(
    "accessToken",
  );

  localStorage.removeItem(
    "refreshToken",
  );

  localStorage.removeItem(
    "role",
  );
};

// Guarda "a dónde volver" tras el login en sessionStorage: el caso crítico (sesión expirada)
// ocurre en un interceptor de axios, fuera de React, donde no hay useNavigate.
const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

export const setPostLoginRedirect = (path: string) => {
  // Nunca se guarda "/login" como destino: evitaría un bucle tras el login.
  if (!path || path === "/login") return;

  sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    path,
  );
};

// Lee y limpia el destino guardado: se consume una sola vez tras el login.
export const consumePostLoginRedirect = (): string | null => {
  const value = sessionStorage.getItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  sessionStorage.removeItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  return value;
};

// Como redirectToLogin pero con un mensaje específico de cuenta bloqueada.
// El mensaje va en sessionStorage porque window.location.href recarga la página; lo muestra AlertProvider.
export const redirectToLoginWithMessage = (
  message: string,
) => {
  clearTokens();

  setPostLoginRedirect(
    window.location.pathname + window.location.search,
  );

  sessionStorage.setItem(
    "auth_alert",
    message,
  );

  window.location.href = "/login";
};

export const redirectToLogin = () => {
  redirectToLoginWithMessage(
    "Tu sesión ha expirado. Inicia sesión nuevamente.",
  );
};