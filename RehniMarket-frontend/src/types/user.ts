export type Role = "admin" | "company" | "user";

export interface MeResponse {
  email: string;
  name: string;
  role: Role;
}

