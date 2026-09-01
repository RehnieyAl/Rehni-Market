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

const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
const AUTH_ALERT_KEY = "auth_alert";

export const clearAuthArtifacts = () => {
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(AUTH_ALERT_KEY);
};

export const setPostLoginRedirect = (path: string) => {
  if (!path || path === "/login") return;

  sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    path,
  );
};

export const consumePostLoginRedirect = (): string | null => {
  const value = sessionStorage.getItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  sessionStorage.removeItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  return value;
};

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