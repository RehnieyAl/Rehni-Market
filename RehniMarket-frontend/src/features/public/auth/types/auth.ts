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

  logout(): void;

  refreshProfile(): Promise<void>;
}
