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
  tell: string;
  profileImagen: string | null;
}

export type AuthUser = MeResponse;

export interface UpdateMeRequest {
  fullName?: string;
  email?: string;
  tell?: string;
}

export interface MessageResponse {
  message: string;
}

export interface VerificationCodeState {
  expires_in: number;
  resend_available_in: number;
}

export type RegisterUserResponse = MessageResponse & Partial<VerificationCodeState>;

export interface ResendVerificationCodeRequest {
  email: string;
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
