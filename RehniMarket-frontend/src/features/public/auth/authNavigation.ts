/** Rutas de retorno de la autenticación: valida que sean internas y recuerda la última página pública
 * visitada (solo la ruta, sin datos de la sesión) para volver a ella tras el login o el cierre de sesión. */
import { isProtectedPath } from "./roleAccess";

const LAST_PUBLIC_PATH_KEY = "lastPublicPath";

/** Pantallas del propio flujo de acceso: nunca son un destino de retorno. */
const AUTH_FLOW_PREFIXES = [
  "/login",
  "/register-user",
  "/register-company",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/actualizar-certificado",
];

/** Solo rutas relativas de esta app: rechaza `//host`, `/\\host`, esquemas y caracteres de control. */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return false;
  }
  if ([...path].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return false;

  try {
    const base = "https://rehnimarket.invalid";
    return new URL(path, base).origin === base;
  } catch {
    return false;
  }
}

const pathnameOf = (path: string) => path.split(/[?#]/, 1)[0];

function isAuthFlowPath(path: string): boolean {
  const pathname = pathnameOf(path);
  return AUTH_FLOW_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicReturnPath(path: unknown): path is string {
  return isSafeInternalPath(path) && !isProtectedPath(pathnameOf(path)) && !isAuthFlowPath(path);
}

export function rememberPublicPath(path: string): void {
  if (!isPublicReturnPath(path)) return;
  try {
    sessionStorage.setItem(LAST_PUBLIC_PATH_KEY, path);
  } catch {
    // Sin sessionStorage el retorno usa el inicio de la tienda.
  }
}

/** Última página pública válida; el inicio de la tienda si no hay ninguna o no es segura. */
export function lastPublicPath(): string {
  try {
    const stored = sessionStorage.getItem(LAST_PUBLIC_PATH_KEY);
    return isPublicReturnPath(stored) ? stored : "/";
  } catch {
    return "/";
  }
}
