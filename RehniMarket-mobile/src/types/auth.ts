// Espejo de RehniMarket-frontend/src/features/public/auth/types/
// {response,request,auth}.ts - mismo contrato que expone el backend (ver
// app/schemas/schemaAuth, app/routers/AuthRouters.py). Solo se listan los
// endpoints que esta app realmente usa (login-user, register-user,
// verify-email-user, change-email, forgot/reset-password-user, refresh,
// me) - quedan fuera register-company y todo lo exclusivo de
// admin/company/owner.
export type Role = "admin" | "company" | "user" | "owner";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: Role;
}

// Respuesta de GET/PATCH /auth/me - se usa directamente como "usuario
// autenticado" en el contexto (ver features/auth/context/AuthProvider.tsx),
// sin duplicar un tipo AuthUser aparte como hace la web.
export interface MeResponse {
  email: string;
  name: string;
  role: Role;
  profileImagen: string | null;
}

export type AuthUser = MeResponse;

export interface MessageResponse {
  message: string;
}

export interface RegisterUserRequest {
  full_name: string;
  email: string;
  password: string;
  tell: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ChangeEmailRequest {
  old_email: string;
  new_email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}
