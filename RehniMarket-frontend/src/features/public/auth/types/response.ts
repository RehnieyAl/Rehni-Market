export type Role = "admin" | "company" | "user";


export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: Role;
}


export interface MeResponse {
  email: string;
  name: string;
  role: Role;
}


export interface MessageResponse {
  message: string;
}


export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}