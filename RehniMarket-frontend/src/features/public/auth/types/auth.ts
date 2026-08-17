export type Role = "admin" | "company" | "user" | "owner";


export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  // Foto de perfil de la CUENTA - común a cualquier rol (ver
  // "Configuración de cuenta"). null si el usuario no subió ninguna.
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

  // Vuelve a pedir GET /auth/me y actualiza `user` en el contexto. Se
  // llama después de editar nombre/correo/foto en "Configuración de
  // cuenta" para que el cambio se refleje automáticamente en cualquier
  // componente que consuma este contexto (navbar, sidebar, topbar...) sin
  // necesitar recargar la página.
  refreshProfile(): Promise<void>;
}