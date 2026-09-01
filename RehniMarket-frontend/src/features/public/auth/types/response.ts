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


export interface MessageResponse {
  message: string;
}


export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}


export interface VerificationCodeState {
  expires_in: number;
  resend_available_in: number;
}