export type Role = "admin" | "company" | "user" | "owner";


export interface AuthUser {
  email: string;
  name: string;
  role: Role;
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
}