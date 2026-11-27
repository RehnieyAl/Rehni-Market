export type Role = "admin" | "company" | "user" | "owner";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  tell: string;
  profileImagen: string | null;
}

export interface AuthContextType {

  status: AuthStatus;

  accessToken: string | null;

  refreshToken: string | null;

  role: Role | null;

  user: AuthUser | null;

  login(data: {
    access_token: string;
    refresh_token: string;
    role: Role;
  }): Promise<void>;

  /** `byUser`: cierre pedido por el usuario (no por expiración); RequireAuth lo envía a una página
   * pública en lugar de al login. */
  logout(options?: { byUser?: boolean }): void;

  signedOutByUser: boolean;

  refreshProfile(): Promise<void>;
}
