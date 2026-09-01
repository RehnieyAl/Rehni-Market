import * as SecureStore from "expo-secure-store";

import type { Role } from "@/types/auth";

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

let pendingSessionMessage: string | null = null;

export function setPendingSessionMessage(message: string): void {
  pendingSessionMessage = message;
}

export function consumePendingSessionMessage(): string | null {
  const message = pendingSessionMessage;
  pendingSessionMessage = null;
  return message;
}

export type PendingAction =
  | { type: "ADD_TO_CART"; productId: string; variantId: string | null; quantity: number }
  | { type: "ADD_TO_FAVORITES"; productId: string; variantId: string | null }
  | { type: "CHECKOUT" };

let pendingAction: PendingAction | null = null;

export function setPendingAction(action: PendingAction): void {
  pendingAction = action;
}

export function peekPendingAction(): PendingAction | null {
  return pendingAction;
}

export function consumePendingAction(): PendingAction | null {
  const action = pendingAction;
  pendingAction = null;
  return action;
}
