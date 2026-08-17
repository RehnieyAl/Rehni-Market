export type Role = "admin" | "company" | "user" | "owner";


export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: Role;
}


export interface MeResponse {
  email: string;
  name: string;
  role: Role;
  // Foto de perfil de la CUENTA autenticada - común a cualquier rol
  // (user/company/admin/owner). Cualquier componente que consuma este
  // endpoint (navbar, sidebar, topbar...) la recibe aquí.
  profileImagen: string | null;
}


export interface MessageResponse {
  message: string;
}


export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}