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

// Punto único donde se guarda "a dónde volver" después de iniciar sesión
// (ver AUDITORÍA de redirecciones de autenticación). Vive acá, junto a
// clearTokens/redirectToLogin, porque el caso que más lo necesita
// (sesión expirada, ver redirectToLogin más abajo) ocurre en un
// interceptor de axios, fuera del árbol de React - ahí no hay
// useNavigate/useLocation disponibles, así que sessionStorage es el
// único mecanismo que funciona igual para ese caso y para los que sí
// corren dentro de React (ver features/public/auth/hooks/useRedirectToLogin.ts).
// Se usa una clave de sessionStorage aparte de "auth_alert" (que ya
// existía) para no mezclar el mensaje de alerta con la ruta de retorno.
const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

export const setPostLoginRedirect = (path: string) => {
  // Nunca se guarda "/login" como destino de retorno: evitaría un login
  // exitoso que vuelve a mandar al propio login.
  if (!path || path === "/login") return;

  sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    path,
  );
};

// Lee Y limpia el destino guardado - se consume una sola vez, justo
// después de un login exitoso (ver Login.tsx), para que no quede
// "pegado" y reaparezca en un login posterior no relacionado.
export const consumePostLoginRedirect = (): string | null => {
  const value = sessionStorage.getItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  sessionStorage.removeItem(
    POST_LOGIN_REDIRECT_KEY,
  );

  return value;
};

// Mismo mecanismo que redirectToLogin (limpiar sesión + recordar la
// ruta + dejar un mensaje para mostrar apenas cargue /login), pero con
// un mensaje específico en vez del genérico de "sesión expirada". Lo usa
// el manejo de cuenta bloqueada (USER_BLOCKED/COMPANY_SUSPENDED, ver
// apiErrorHandler.ts y setupAuthInterceptor.ts) para no hacer pasar un
// bloqueo por una expiración de token (son estados distintos, ver
// AUDITORÍA de bloqueo de cuentas).
//
// El mensaje se guarda en sessionStorage (no se muestra acá mismo) porque
// window.location.href fuerza una recarga completa de página: cualquier
// alerta mostrada antes de esa línea desaparece con el reload. Quien la
// muestra de verdad es AlertProvider, que la lee y la consume una sola
// vez al montar (ver AlertProvider.tsx).
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