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

export const redirectToLogin = () => {
  clearTokens();

  sessionStorage.setItem(
    "auth_alert",
    "Tu sesión ha expirado. Inicia sesión nuevamente.",
  );

  window.location.href = "/login";
};