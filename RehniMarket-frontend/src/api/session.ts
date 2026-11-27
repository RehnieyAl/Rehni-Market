/** Tokens de la sesión en localStorage, destino pendiente tras el login y aviso de sesión expirada. */
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
export const clearAuthArtifacts = () => {
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
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

/** Evento que emite el cliente HTTP cuando la sesión deja de ser válida (refresh fallido o cuenta
 * bloqueada). La app decide qué hacer según la página: quedarse como visitante o ir al login. */
export const SESSION_EXPIRED_EVENT = "rehni:session-expired";

export interface SessionExpiredDetail {
  message: string;
}

/** Borra los tokens y avisa una sola vez: si ya no había sesión (visitante), no hace nada. */
export const expireSession = (
  message = "Tu sesión ha expirado. Inicia sesión nuevamente.",
) => {
  if (!getAccessToken() && !getRefreshToken()) return;

  clearTokens();

  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, { detail: { message } }),
  );
};
