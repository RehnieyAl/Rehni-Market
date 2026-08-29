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


// Estado de los dos contadores de la pantalla de verificación, calculado
// SIEMPRE en el backend (el del frontend es solo informativo):
// - expires_in: segundos que le quedan al código antes de expirar (5 min).
// - resend_available_in: segundos para poder pedir un reenvío (60 s).
// Lo devuelven register-user, register-company, resend-verification-code,
// change-email y el 400 EMAIL_NOT_VERIFIED del login.
export interface VerificationCodeState {
  expires_in: number;
  resend_available_in: number;
}