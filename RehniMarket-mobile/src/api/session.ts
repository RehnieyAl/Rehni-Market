import * as SecureStore from "expo-secure-store";

import type { Role } from "@/types/auth";

// Equivalente móvil de RehniMarket-frontend/src/api/session.ts. Misma
// responsabilidad (guardar/leer/borrar tokens+role), pero:
//   - SecureStore en vez de localStorage: nunca se guarda la contraseña,
//     solo los tokens (ver Config > Fase 3).
//   - Todo es async (SecureStore no tiene versión síncrona), a diferencia
//     de la web.
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "role";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredRole(): Promise<Role | null> {
  const role = await SecureStore.getItemAsync(ROLE_KEY);

  if (role === "admin" || role === "company" || role === "user" || role === "owner") {
    return role;
  }

  return null;
}

export async function saveSession(
  accessToken: string,
  refreshToken: string,
  role: Role,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(ROLE_KEY, role),
  ]);
}

// Suscripción para que AuthProvider (Fase 3) reaccione a un logout forzado
// desde afuera del árbol de React - el interceptor de refresh en
// client.ts llama clearSession() directamente cuando el refresh falla, y
// sin este aviso el estado `user` del contexto quedaría desactualizado
// (seguiría "autenticado" un instante después de que la sesión ya se
// borró de SecureStore, ver Fase 3 > REFRESH TOKEN > "no sobrescribir
// incorrectamente la sesión").
type SessionListener = () => void;
const sessionClearedListeners = new Set<SessionListener>();

export function onSessionCleared(listener: SessionListener): () => void {
  sessionClearedListeners.add(listener);
  return () => sessionClearedListeners.delete(listener);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(ROLE_KEY),
  ]);

  sessionClearedListeners.forEach((listener) => listener());
}

// Equivalente en memoria del `sessionStorage.setItem("auth_alert", ...)`
// que usa la web (ver session.ts > redirectToLoginWithMessage): ahí hace
// falta sessionStorage porque `window.location.href` fuerza una recarga
// completa de página. En RN no hay recarga - el AuthProvider (Fase 3)
// sigue vivo en memoria durante toda la sesión de la app, así que alcanza
// con una variable de módulo; se resetea sola al cerrar la app, que es
// exactamente cuándo dejaría de tener sentido igual.
let pendingSessionMessage: string | null = null;

export function setPendingSessionMessage(message: string): void {
  pendingSessionMessage = message;
}

export function consumePendingSessionMessage(): string | null {
  const message = pendingSessionMessage;
  pendingSessionMessage = null;
  return message;
}

// Intención que un VISITANTE (o una sesión con role no permitido, que el
// efecto raíz cierra casi de inmediato - ver app/_layout.tsx >
// RootNavigation) dejó pendiente al tocar una acción que requiere cuenta
// (ver Fase Acceso Público > PENDING ACTION / useRequireUser.ts). Mismo
// mecanismo en memoria que pendingSessionMessage de arriba (no hace falta
// persistirlo: no sobrevive a cerrar la app, y no tiene por qué). Se
// modela como union discriminada en vez de un string de ruta suelto
// (a diferencia de setPostLoginRedirect en la web) porque acá SÍ hace
// falta reconstruir la selección exacta (variante/cantidad) al volver,
// no solo la pantalla - ver ProductDetailScreen.tsx > efecto de resume.
export type PendingAction =
  | { type: "ADD_TO_CART"; productId: string; variantId: string | null; quantity: number }
  | { type: "ADD_TO_FAVORITES"; productId: string; variantId: string | null }
  | { type: "CHECKOUT" };

let pendingAction: PendingAction | null = null;

export function setPendingAction(action: PendingAction): void {
  pendingAction = action;
}

// Lee sin borrar - LoginScreen.tsx la usa solo para decidir A DÓNDE
// volver (no puede consumirla: quien realmente aplica la
// variante/cantidad guardadas es la pantalla de destino, ver
// ProductDetailScreen.tsx).
export function peekPendingAction(): PendingAction | null {
  return pendingAction;
}

export function consumePendingAction(): PendingAction | null {
  const action = pendingAction;
  pendingAction = null;
  return action;
}
