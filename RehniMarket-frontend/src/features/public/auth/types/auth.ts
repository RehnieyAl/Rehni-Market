export type Role = "admin" | "company" | "user" | "owner";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  // Foto de la cuenta, común a cualquier rol. null si no subió ninguna.
  profileImagen: string | null;
}

export interface AuthContextType {

  accessToken: string | null;

  refreshToken: string | null;

  role: Role | null;

  user: AuthUser | null;

  login(data: {
    access_token: string;
    refresh_token: string;
    role: Role;
  }): void;

  logout(): void;

  // Vuelve a pedir GET /auth/me y actualiza `user`; se llama tras editar la cuenta.
  refreshProfile(): Promise<void>;
}